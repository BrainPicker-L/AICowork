/**
 * 贾维斯配置包导入导出模块
 * 处理 .jarvis 压缩包的创建和解析
 */

import AdmZip from 'adm-zip';
import { promises as fs } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';
import { log } from '../logger.js';
import { loadMcpServers, saveMcpServer, loadMcpServer, type McpServerConfig } from './mcp-store.js';
import { getSkillsList, type SkillConfig } from './skills-store.js';

// 贾维斯元信息接口
export interface JarvisMetadata {
  name: string;
  description: string;
  version: string;
  author: string;
  authorEmail?: string;
  tags: string[];
}

// MCP 服务器配置（扩展）
export interface JarvisMcpServerConfig extends McpServerConfig {
  description?: string;
  requiresUserInput?: Record<string, {
    description: string;
    type: 'text' | 'password';
    required: boolean;
  }>;
}

// 贾维斯完整配置接口
export interface JarvisConfig {
  jarvis: JarvisMetadata & {
    createdAt: string;
    updatedAt: string;
  };
  mcpServers: Record<string, JarvisMcpServerConfig>;
  skills: string[];
  dependencies: {
    npm: string[];
    python: string[];
  };
  statistics: {
    mcpServersCount: number;
    skillsCount: number;
    totalSize: string;
  };
}

// 导入选项
export interface ImportOptions {
  skipExisting?: boolean;  // 跳过已存在的配置
  overwrite?: boolean;     // 覆盖已存在的配置
  userInputs?: Record<string, Record<string, string>>; // 用户填写的敏感信息
}

// 导入结果
export interface ImportResult {
  success: boolean;
  imported: {
    mcpServers: string[];
    skills: string[];
  };
  skipped: {
    mcpServers: string[];
    skills: string[];
  };
  errors: string[];
}

/**
 * 导出贾维斯配置为 .jarvis 压缩包
 */
export async function exportJarvisConfig(
  metadata: JarvisMetadata,
  outputPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    log.info('[jarvis-store] Starting export...');
    
    // 1. 读取 MCP 配置
    const mcpServers = await loadMcpServers();
    
    // 2. 读取 Skills
    const skills = await getSkillsList();
    const skillsDir = join(homedir(), '.qwen', 'skills');
    
    // 3. 提取需要用户输入的字段
    const mcpServersWithUserInput: Record<string, JarvisMcpServerConfig> = {};
    for (const [name, config] of Object.entries(mcpServers)) {
      const serverConfig: JarvisMcpServerConfig = { ...config };
      
      // 检测环境变量中的敏感信息
      if (config.env) {
        const requiresUserInput: Record<string, any> = {};
        for (const [key, value] of Object.entries(config.env)) {
          // 检测常见的敏感字段
          if (
            key.includes('TOKEN') ||
            key.includes('KEY') ||
            key.includes('SECRET') ||
            key.includes('PASSWORD') ||
            key.includes('API_KEY')
          ) {
            requiresUserInput[key] = {
              description: `${key} (敏感信息，需要导入时填写)`,
              type: 'password' as const,
              required: true,
            };
            // 替换为占位符
            serverConfig.env = {
              ...serverConfig.env,
              [key]: '<需要用户填写>',
            };
          }
        }
        
        if (Object.keys(requiresUserInput).length > 0) {
          serverConfig.requiresUserInput = requiresUserInput;
        }
      }
      
      mcpServersWithUserInput[name] = serverConfig;
    }
    
    // 4. 创建 jarvis.json
    const jarvisConfig: JarvisConfig = {
      jarvis: {
        ...metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      mcpServers: mcpServersWithUserInput,
      skills: skills.map(s => s.name),
      dependencies: {
        npm: extractNpmDependencies(mcpServers),
        python: [],
      },
      statistics: {
        mcpServersCount: Object.keys(mcpServers).length,
        skillsCount: skills.length,
        totalSize: '0MB', // 将在压缩后计算
      },
    };
    
    // 5. 创建压缩包
    const zip = new AdmZip();
    
    // 添加 jarvis.json
    zip.addFile('jarvis.json', Buffer.from(JSON.stringify(jarvisConfig, null, 2)));
    
    // 添加 Skills 目录
    for (const skill of skills) {
      const skillDir = join(skillsDir, skill.name);
      try {
        await addDirectoryToZip(zip, skillDir, `skills/${skill.name}`);
      } catch (error) {
        log.warn(`[jarvis-store] Failed to add skill ${skill.name}:`, error);
      }
    }
    
    // 添加 README
    const readme = generateReadme(jarvisConfig);
    zip.addFile('README.md', Buffer.from(readme));
    
    // 6. 写入文件
    zip.writeZip(outputPath);
    
    // 7. 计算文件大小
    const stats = await fs.stat(outputPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    log.info(`[jarvis-store] Export completed: ${outputPath} (${sizeMB}MB)`);
    
    return { success: true };
    
  } catch (error) {
    log.error('[jarvis-store] Export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 导入贾维斯配置包
 */
export async function importJarvisConfig(
  jarvisPath: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    imported: { mcpServers: [], skills: [] },
    skipped: { mcpServers: [], skills: [] },
    errors: [],
  };
  
  try {
    log.info('[jarvis-store] Starting import...');
    
    // 1. 解压文件
    const zip = new AdmZip(jarvisPath);
    const zipEntries = zip.getEntries();
    
    // 2. 读取 jarvis.json
    const jarvisEntry = zipEntries.find(e => e.entryName === 'jarvis.json');
    if (!jarvisEntry) {
      throw new Error('Invalid .jarvis file: missing jarvis.json');
    }
    
    const config: JarvisConfig = JSON.parse(jarvisEntry.getData().toString('utf8'));
    
    // 3. 导入 MCP 服务器
    for (const [name, mcpConfig] of Object.entries(config.mcpServers)) {
      try {
        // 检查是否已存在
        const existing = await loadMcpServer(name);
        
        if (existing) {
          if (options.skipExisting) {
            result.skipped.mcpServers.push(name);
            continue;
          }
          if (!options.overwrite) {
            result.errors.push(`MCP server "${name}" already exists`);
            continue;
          }
        }
        
        // 处理用户输入的敏感信息
        const finalConfig = { ...mcpConfig };
        
        // 移除 requiresUserInput 字段（这是元信息，不应保存到配置中）
        delete (finalConfig as any).requiresUserInput;
        
        // 填充用户提供的敏感信息
        if (options.userInputs?.[name] && finalConfig.env) {
          for (const [key, value] of Object.entries(options.userInputs[name])) {
            if (finalConfig.env[key] === '<需要用户填写>') {
              finalConfig.env[key] = value;
            }
          }
        }
        
        await saveMcpServer(name, finalConfig);
        result.imported.mcpServers.push(name);
        
      } catch (error) {
        result.errors.push(`Failed to import MCP "${name}": ${error}`);
      }
    }
    
    // 4. 导入 Skills
    const skillsDir = join(homedir(), '.qwen', 'skills');
    await fs.mkdir(skillsDir, { recursive: true });
    
    for (const skillName of config.skills) {
      try {
        const skillPath = join(skillsDir, skillName);
        
        // 检查是否已存在
        try {
          await fs.access(skillPath);
          if (options.skipExisting) {
            result.skipped.skills.push(skillName);
            continue;
          }
          if (!options.overwrite) {
            result.errors.push(`Skill "${skillName}" already exists`);
            continue;
          }
          // 删除旧的
          await fs.rm(skillPath, { recursive: true, force: true });
        } catch {
          // 不存在，继续
        }
        
        // 解压 skill 目录
        const skillEntries = zipEntries.filter(e => 
          e.entryName.startsWith(`skills/${skillName}/`)
        );
        
        if (skillEntries.length === 0) {
          result.errors.push(`Skill "${skillName}" not found in package`);
          continue;
        }
        
        for (const entry of skillEntries) {
          if (entry.isDirectory) continue;
          
          const relativePath = entry.entryName.replace(`skills/${skillName}/`, '');
          const targetPath = join(skillPath, relativePath);
          
          await fs.mkdir(join(targetPath, '..'), { recursive: true });
          await fs.writeFile(targetPath, entry.getData());
        }
        
        result.imported.skills.push(skillName);
        
      } catch (error) {
        result.errors.push(`Failed to import skill "${skillName}": ${error}`);
      }
    }
    
    log.info('[jarvis-store] Import completed', result);
    return result;
    
  } catch (error) {
    log.error('[jarvis-store] Import failed:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : String(error));
    return result;
  }
}

/**
 * 预览贾维斯配置包（不实际导入）
 */
export async function previewJarvisConfig(
  jarvisPath: string
): Promise<{ success: boolean; config?: JarvisConfig; error?: string }> {
  try {
    const zip = new AdmZip(jarvisPath);
    const jarvisEntry = zip.getEntry('jarvis.json');
    
    if (!jarvisEntry) {
      return { success: false, error: 'Invalid .jarvis file: missing jarvis.json' };
    }
    
    const config: JarvisConfig = JSON.parse(jarvisEntry.getData().toString('utf8'));
    return { success: true, config };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// === 辅助函数 ===

/**
 * 递归添加目录到 ZIP
 */
async function addDirectoryToZip(
  zip: AdmZip,
  dirPath: string,
  zipPath: string
): Promise<void> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    const zipEntryPath = `${zipPath}/${entry.name}`;
    
    if (entry.isDirectory()) {
      await addDirectoryToZip(zip, fullPath, zipEntryPath);
    } else {
      const content = await fs.readFile(fullPath);
      zip.addFile(zipEntryPath, content);
    }
  }
}

/**
 * 从 MCP 配置中提取 npm 依赖
 */
function extractNpmDependencies(mcpServers: Record<string, McpServerConfig>): string[] {
  const deps = new Set<string>();
  
  for (const config of Object.values(mcpServers)) {
    if (config.command === 'npx' && config.args) {
      // 提取 npx -y @xxx/yyy 中的包名
      const pkgIndex = config.args.findIndex(arg => arg.startsWith('@'));
      if (pkgIndex >= 0) {
        deps.add(config.args[pkgIndex]);
      }
    }
  }
  
  return Array.from(deps);
}

/**
 * 生成 README
 */
function generateReadme(config: JarvisConfig): string {
  return `# ${config.jarvis.name}

${config.jarvis.description}

## 信息

- **版本**: ${config.jarvis.version}
- **作者**: ${config.jarvis.author}
- **创建时间**: ${config.jarvis.createdAt}
- **标签**: ${config.jarvis.tags.join(', ')}

## 包含内容

### MCP 服务器 (${config.statistics.mcpServersCount})

${Object.entries(config.mcpServers).map(([name, cfg]) => 
  `- **${name}**: ${cfg.description || '无描述'}`
).join('\n')}

### Skills (${config.statistics.skillsCount})

${config.skills.map(name => `- ${name}`).join('\n')}

## 使用方法

1. 在 DtazziCowork 中打开设置
2. 进入"贾维斯配置"页面
3. 点击"导入配置"
4. 选择此 .jarvis 文件
5. 按提示填写必要的配置信息
6. 完成导入

## 依赖

### NPM 包

${config.dependencies.npm.length > 0 ? config.dependencies.npm.map(pkg => `- ${pkg}`).join('\n') : '无'}

---

由 DtazziCowork 导出
`;
}
