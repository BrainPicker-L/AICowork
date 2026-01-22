/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-21
 * @updated     2026-01-21
 * @Email       None
 *
 * Skills 管理存储库
 * 管理用户自定义技能的创建、读取、删除操作
 */

import { promises as fs } from 'fs';
import { join, basename, normalize } from 'path';
import { homedir } from 'os';
import { log } from '../logger.js';

/**
 * 验证并清理技能名称，防止路径遍历攻击
 */
function validateSkillName(skillName: string): string {
  // 去除首尾空格
  const trimmed = skillName.trim();

  // 检查长度 (1-64 字符)
  if (trimmed.length < 1 || trimmed.length > 64) {
    throw new Error('技能名称长度必须在 1-64 字符之间');
  }

  // 使用 normalize 和 basename 清理路径
  const normalized = normalize(trimmed);
  const cleanName = basename(normalized);

  // 验证清理后的名称与原始输入一致
  if (cleanName !== trimmed || normalized !== trimmed) {
    throw new Error('技能名称包含非法字符或路径');
  }

  // 只允许字母、数字、连字符和下划线
  const validNameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!validNameRegex.test(cleanName)) {
    throw new Error('技能名称只能包含字母、数字、连字符和下划线');
  }

  return cleanName;
}

// 技能配置接口
export interface SkillConfig {
  name: string;
  description: string;
  prompt: string;
  script?: {
    type: 'javascript' | 'python';
    content?: string;
    path?: string;
  };
  createdAt?: number;
  updatedAt?: number;
}

// 获取技能目录路径
function getSkillsDir(): string {
  return join(homedir(), '.claude', 'skills');
}

// 获取技能文件路径（带安全验证）
function getSkillFilePath(skillName: string): string {
  const cleanName = validateSkillName(skillName);
  return join(getSkillsDir(), cleanName, 'SKILL.md');
}

// 获取技能目录路径（带安全验证）
function getSkillDirPath(skillName: string): string {
  const cleanName = validateSkillName(skillName);
  return join(getSkillsDir(), cleanName);
}

/**
 * 确保技能目录存在
 */
async function ensureSkillsDir(): Promise<void> {
  const skillsDir = getSkillsDir();
  try {
    await fs.access(skillsDir);
  } catch {
    await fs.mkdir(skillsDir, { recursive: true });
  }
}

/**
 * 解析 SKILL.md 文件内容
 * 支持两种格式：
 * 1. Frontmatter 格式（YAML）：---\nname: xxx\ndescription: xxx\n---
 * 2. 标准 Markdown 格式：# xxx\n## 描述\n## 指导
 */
function parseSkillMarkdown(content: string, defaultName: string): {
  name: string;
  description: string;
  prompt: string;
} {
  let name = defaultName;
  let description = '';
  let prompt = '';
  const lines = content.split('\n');

  // 检测是否为 frontmatter 格式（以 --- 开头）
  if (lines[0]?.trim() === '---') {
    // 查找 frontmatter 结束位置
    let frontmatterEnd = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i]?.trim() === '---') {
        frontmatterEnd = i;
        break;
      }
    }

    if (frontmatterEnd > 0) {
      // 解析 frontmatter 内容
      const frontmatterLines = lines.slice(1, frontmatterEnd);
      for (const line of frontmatterLines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('name:')) {
          name = trimmedLine.substring(5).trim() || name;
        } else if (trimmedLine.startsWith('description:')) {
          description = trimmedLine.substring(12).trim() || '';
        }
      }
      // frontmatter 之后的内容作为 prompt
      prompt = lines.slice(frontmatterEnd + 1).join('\n').trim();
    } else {
      // 没有找到结束标记，整个内容作为 prompt
      prompt = content;
    }
  } else {
    // 标准 Markdown 格式解析
    let inDescription = false;
    let inGuidance = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('# ')) {
        name = line.substring(2).trim();
      } else if (line.startsWith('## 描述') || line.startsWith('## Description')) {
        inDescription = true;
        inGuidance = false;
      } else if (line.startsWith('## 指导') || line.startsWith('## Guidance')) {
        inGuidance = true;
        inDescription = false;
      } else if (line.startsWith('## ')) {
        inDescription = false;
        inGuidance = false;
      } else if (inDescription) {
        description += (description ? '\n' : '') + line;
      } else if (inGuidance) {
        prompt += (prompt ? '\n' : '') + line;
      }
    }
  }

  return {
    name,
    description: description || '无描述',
    prompt: prompt || content,
  };
}

/**
 * 获取所有技能列表
 */
export async function getSkillsList(): Promise<SkillConfig[]> {
  try {
    await ensureSkillsDir();
    const skillsDir = getSkillsDir();
    log.info(`[skills-store] Reading skills from: ${skillsDir}`);

    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    log.info(`[skills-store] Found ${entries.length} entries in skills directory`);

    const skills: SkillConfig[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = join(skillsDir, entry.name);
        const skillFile = join(skillPath, 'SKILL.md');

        log.debug(`[skills-store] Checking directory: ${entry.name}`);

        try {
          await fs.access(skillFile);
          const content = await fs.readFile(skillFile, 'utf-8');
          const { name, description, prompt } = parseSkillMarkdown(content, entry.name);

          // 检测脚本文件
          let script: SkillConfig['script'] = undefined;
          const jsScriptFile = join(skillPath, `${entry.name}.js`);
          const pyScriptFile = join(skillPath, `${entry.name}.py`);

          try {
            if (await fs.access(jsScriptFile).then(() => true).catch(() => false)) {
              script = { type: 'javascript' as const };
              log.debug(`[skills-store] Found JS script for: ${entry.name}`);
            } else if (await fs.access(pyScriptFile).then(() => true).catch(() => false)) {
              script = { type: 'python' as const };
              log.debug(`[skills-store] Found Python script for: ${entry.name}`);
            }
          } catch {
            // 忽略脚本文件检查错误
          }

          const stats = await fs.stat(skillFile);
          const skill = {
            name,
            description,
            prompt,
            script,
            createdAt: stats.birthtime.getTime(),
            updatedAt: stats.mtime.getTime(),
          };
          skills.push(skill);
          log.info(`[skills-store] ✓ Loaded skill: ${name} (${description})`);
        } catch (error) {
          log.warn(`[skills-store] ✗ Failed to read skill ${entry.name}:`, error);
        }
      }
    }

    log.info(`[skills-store] Total loaded: ${skills.length} skills`);
    return skills;
  } catch (error) {
    log.error('[skills-store] Failed to get skills list:', error);
    return [];
  }
}

/**
 * 创建新技能（使用原子操作防止并发竞争）
 */
export async function createSkill(config: SkillConfig): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureSkillsDir();

    // 验证技能名称（validateSkillName 会检查空值）
    const cleanName = validateSkillName(config.name);

    const skillDir = getSkillDirPath(cleanName);
    const skillFile = getSkillFilePath(cleanName);

    // 使用原子操作：先写临时文件，再重命名
    // 这样可以避免并发请求同时通过存在性检查的竞争条件
    const tempFile = skillFile + '.tmp';

    // 生成 SKILL.md 文件内容
    const now = Date.now();
    let content = `# ${cleanName}

## 描述
${config.description || '自定义技能'}

## 指导
${config.prompt || ''}

---
*Created: ${new Date(now).toISOString()}*
`;

    // 如果有脚本配置，添加到 SKILL.md
    if (config.script) {
      const scriptSection = `
## 脚本配置
- **类型**: ${config.script.type}
- **路径**: ${config.script.path || '(内嵌脚本)'}
`;
      content += scriptSection;
    }

    // 确保目录存在
    await fs.mkdir(skillDir, { recursive: true });

    // 先写入临时文件
    await fs.writeFile(tempFile, content, 'utf-8');

    // 原子性重命名：如果目标文件已存在会失败
    try {
      await fs.rename(tempFile, skillFile);
    } catch (renameError: any) {
      // 删除临时文件
      try {
        await fs.unlink(tempFile);
      } catch {
        // 忽略删除临时文件的失败
      }

      if (renameError.code === 'EEXIST') {
        return { success: false, error: '技能已存在' };
      }
      throw renameError;
    }

    // 如果有脚本内容，写入脚本文件
    if (config.script && config.script.content) {
      const ext = config.script.type === 'javascript' ? 'js' : 'py';
      const scriptFile = join(skillDir, `${cleanName}.${ext}`);
      await fs.writeFile(scriptFile, config.script.content, 'utf-8');
      log.info(`[skills-store] Script file created: ${scriptFile}`);
    }

    log.info(`[skills-store] Skill created: ${cleanName}`);

    return { success: true };
  } catch (error: any) {
    // 处理验证错误
    if (error.message && error.message.includes('技能名称')) {
      return { success: false, error: error.message };
    }

    log.error('[skills-store] Failed to create skill:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '创建技能失败'
    };
  }
}

/**
 * 删除技能
 */
export async function deleteSkill(skillName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const skillDir = getSkillDirPath(skillName);

    // 检查技能是否存在
    try {
      await fs.access(skillDir);
    } catch {
      return { success: false, error: '技能不存在' };
    }

    // 删除整个技能目录
    await fs.rm(skillDir, { recursive: true, force: true });
    log.info(`[skills-store] Skill deleted: ${skillName}`);

    return { success: true };
  } catch (error: any) {
    // 处理验证错误
    if (error.message && error.message.includes('技能名称')) {
      return { success: false, error: error.message };
    }

    log.error('[skills-store] Failed to delete skill:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除技能失败'
    };
  }
}

/**
 * 获取技能详情
 */
export async function getSkillDetail(skillName: string): Promise<SkillConfig | null> {
  try {
    const skillDir = getSkillDirPath(skillName);
    const skillFile = getSkillFilePath(skillName);

    const content = await fs.readFile(skillFile, 'utf-8');
    const stats = await fs.stat(skillFile);

    // 使用统一的解析函数
    const { name, description, prompt } = parseSkillMarkdown(content, skillName);

    // 检测脚本文件
    let script: SkillConfig['script'] = undefined;
    const jsScriptFile = join(skillDir, `${skillName}.js`);
    const pyScriptFile = join(skillDir, `${skillName}.py`);

    try {
      if (await fs.access(jsScriptFile).then(() => true).catch(() => false)) {
        script = { type: 'javascript' as const };
      } else if (await fs.access(pyScriptFile).then(() => true).catch(() => false)) {
        script = { type: 'python' as const };
      }
    } catch {
      // 忽略脚本文件检查错误
    }

    return {
      name,
      description,
      prompt,
      script,
      createdAt: stats.birthtime.getTime(),
      updatedAt: stats.mtime.getTime(),
    };
  } catch (error) {
    log.error('[skills-store] Failed to get skill detail:', error);
    return null;
  }
}
