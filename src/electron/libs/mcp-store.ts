/**
 * MCP 配置存储模块
 * 读写 ~/.claude/settings.json 中的 mcpServers 配置
 */

import { promises as fs } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
import { log } from "../logger.js";

/**
 * MCP 服务器配置接口
 */
export interface McpServerConfig {
  /** 服务器名称（唯一标识） */
  name: string;
  /** 显示名称（可选） */
  displayName?: string;
  /** 服务器类型 */
  type?: 'stdio' | 'sse' | 'streamableHttp';
  /** 命令（stdio 类型） */
  command?: string;
  /** 命令参数（stdio 类型） */
  args?: string[];
  /** 环境变量（可选） */
  env?: Record<string, string>;
  /** URL（sse/streamableHttp 类型） */
  url?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 描述（可选） */
  description?: string;
}

/**
 * Claude settings.json 结构（部分）
 */
interface ClaudeSettings {
  mcpServers?: Record<string, McpServerConfig>;
  env?: Record<string, string>;
  enabledPlugins?: Record<string, boolean>;
  hooks?: any;
  permissions?: any;
}

/**
 * 获取 Claude settings.json 文件路径
 */
function getSettingsPath(): string {
  return join(homedir(), '.claude', 'settings.json');
}

/**
 * 确保 .claude 目录存在（异步）
 */
async function ensureClaudeDir(): Promise<void> {
  const settingsPath = getSettingsPath();
  const dir = dirname(settingsPath);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * 读取 Claude settings.json（异步）
 */
async function readSettings(): Promise<ClaudeSettings> {
  const settingsPath = getSettingsPath();
  try {
    await fs.access(settingsPath);
  } catch {
    // 文件不存在，返回默认配置
    const defaultSettings: ClaudeSettings = {
      mcpServers: {},
      env: {},
      enabledPlugins: {},
    };
    return defaultSettings;
  }

  try {
    const raw = await fs.readFile(settingsPath, "utf8");
    return JSON.parse(raw);
  } catch (readError: any) {
    if (readError.code === 'ENOENT') {
      return { mcpServers: {} };
    }
    if (readError instanceof SyntaxError) {
      log.error("[mcp-store] Failed to parse settings.json:", readError);
      return { mcpServers: {} };
    }
    throw readError;
  }
}

/**
 * 写入 Claude settings.json（异步）
 */
async function writeSettings(settings: ClaudeSettings): Promise<void> {
  try {
    await ensureClaudeDir();
    const settingsPath = getSettingsPath();
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf8");
    log.info("[mcp-store] Settings saved successfully");
  } catch (error) {
    log.error("[mcp-store] Failed to write settings.json:", error);
    throw new Error('Failed to write MCP settings');
  }
}

/**
 * 获取所有 MCP 服务器配置（异步）
 */
export async function loadMcpServers(): Promise<Record<string, McpServerConfig>> {
  const settings = await readSettings();
  return settings.mcpServers || {};
}

/**
 * 获取单个 MCP 服务器配置（异步）
 */
export async function loadMcpServer(name: string): Promise<McpServerConfig | null> {
  const servers = await loadMcpServers();
  return servers[name] || null;
}

/**
 * 保存 MCP 服务器配置（异步）
 */
export async function saveMcpServer(name: string, config: McpServerConfig): Promise<void> {
  const settings = await readSettings();

  if (!settings.mcpServers) {
    settings.mcpServers = {};
  }

  // 确保 name 和 config.name 一致
  config.name = name;

  // 添加时间戳
  (config as any).updatedAt = Date.now();

  settings.mcpServers[name] = config;
  await writeSettings(settings);
  log.info(`[mcp-store] MCP server saved: ${name}`);
}

/**
 * 删除 MCP 服务器配置（异步）
 */
export async function deleteMcpServer(name: string): Promise<void> {
  const settings = await readSettings();

  if (settings.mcpServers && settings.mcpServers[name]) {
    delete settings.mcpServers[name];
    await writeSettings(settings);
    log.info(`[mcp-store] MCP server deleted: ${name}`);
  }
}

/**
 * 获取 MCP 服务器列表（数组格式，便于 UI 展示）
 */
export async function getMcpServerList(): Promise<Array<{ name: string; config: McpServerConfig }>> {
  const servers = await loadMcpServers();
  return Object.entries(servers).map(([name, config]) => ({ name, config }));
}

/**
 * 常用 MCP 服务器模板
 */
export const MCP_TEMPLATES: Record<string, McpServerConfig> = {
  github: {
    name: "github",
    displayName: "GitHub",
    description: "GitHub 仓库操作",
    type: "stdio",
    command: "npx",
    args: ["@modelcontextprotocol/server-github"],
  },
  filesystem: {
    name: "filesystem",
    displayName: "Filesystem",
    description: "本地文件系统访问",
    type: "stdio",
    command: "npx",
    args: ["@modelcontextprotocol/server-filesystem", "/path/to/allowed"],
  },
  brave_search: {
    name: "brave-search",
    displayName: "Brave Search",
    description: "Brave 搜索引擎",
    type: "stdio",
    command: "npx",
    args: ["@modelcontextprotocol/server-brave-search"],
  },
  puppeteer: {
    name: "puppeteer",
    displayName: "Puppeteer",
    description: "网页自动化操作",
    type: "stdio",
    command: "npx",
    args: ["@modelcontextprotocol/server-puppeteer"],
  },
  fetch: {
    name: "fetch",
    displayName: "Fetch",
    description: "HTTP 请求工具",
    type: "stdio",
    command: "npx",
    args: ["@modelcontextprotocol/server-fetch"],
  },
  memory: {
    name: "memory",
    displayName: "Memory",
    description: "持久化记忆存储",
    type: "stdio",
    command: "npx",
    args: ["@modelcontextprotocol/server-memory"],
  },
};

/**
 * 从模板创建 MCP 服务器
 */
export function createMcpServerFromTemplate(templateName: string, customName?: string): McpServerConfig {
  const template = MCP_TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Unknown MCP template: ${templateName}`);
  }

  const config: McpServerConfig = { ...template };
  if (customName) {
    config.name = customName;
  }

  return config;
}

/**
 * 验证 MCP 服务器配置
 */
export function validateMcpServer(config: McpServerConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查名称
  if (!config.name || typeof config.name !== 'string') {
    errors.push('服务器名称不能为空');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(config.name)) {
    errors.push('服务器名称只能包含字母、数字、下划线和连字符');
  }

  // 检查类型
  if (config.type && !['stdio', 'sse', 'streamableHttp'].includes(config.type)) {
    errors.push('无效的服务器类型');
  }

  // stdio 类型需要 command
  if (!config.type || config.type === 'stdio') {
    if (!config.command) {
      errors.push('stdio 类型服务器必须指定命令');
    }
  }

  // sse/streamableHttp 类型需要 url
  if (config.type === 'sse' || config.type === 'streamableHttp') {
    if (!config.url) {
      errors.push(`${config.type} 类型服务器必须指定 URL`);
    } else {
      try {
        new URL(config.url);
      } catch (urlError) {
        if (urlError instanceof TypeError) {
          errors.push('URL 格式无效');
        } else {
          throw urlError;
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * MCP 服务器测试结果接口
 */
export interface McpTestResult {
  success: boolean;
  message: string;
  details?: string;
}

/**
 * 测试 MCP 服务器连接
 */
export async function testMcpServer(config: McpServerConfig): Promise<McpTestResult> {
  // 首先验证配置
  const validation = validateMcpServer(config);
  if (!validation.valid) {
    return {
      success: false,
      message: '配置验证失败',
      details: validation.errors.join(', '),
    };
  }

  const type = config.type || 'stdio';

  if (type === 'stdio') {
    // 测试 stdio 类型：检查命令是否存在
    return await testStdioServer(config);
  } else if (type === 'sse' || type === 'streamableHttp') {
    // 测试 HTTP 类型：检查 URL 是否可达
    return await testHttpServer(config);
  }

  return {
    success: false,
    message: '未知的服务器类型',
  };
}

/**
 * 测试 stdio 类型的 MCP 服务器
 */
async function testStdioServer(config: McpServerConfig): Promise<McpTestResult> {
  const { spawn } = await import('child_process');

  return new Promise((resolve) => {
    const args = config.args || [];
    const command = config.command!;

    // 设置超时
    const timeout = setTimeout(() => {
      resolve({
        success: false,
        message: '连接超时',
        details: `命令 ${command} 在 5 秒内无响应`,
      });
    }, 5000);

    try {
      // 尝试启动进程（使用 --version 或类似参数测试）
      const testArgs = ['--version', '--help', '-v'].filter(arg =>
        args.length === 0 || !args.includes(arg)
      );

      const child = spawn(command, testArgs.length > 0 ? testArgs : args, {
        shell: true,
        env: { ...process.env, ...config.env },
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          message: '命令执行失败',
          details: error.message,
        });
      });

      child.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0 || code === 1) {
          // 退出码 0 或 1 都可能表示命令存在（某些工具用 1 表示帮助信息）
          resolve({
            success: true,
            message: '连接成功',
            details: `命令 ${command} 可用`,
          });
        } else {
          resolve({
            success: false,
            message: '命令不可用',
            details: `退出码: ${code}`,
          });
        }
      });
    } catch (error: any) {
      clearTimeout(timeout);
      resolve({
        success: false,
        message: '启动失败',
        details: error.message,
      });
    }
  });
}

/**
 * 测试 HTTP 类型的 MCP 服务器
 */
async function testHttpServer(config: McpServerConfig): Promise<McpTestResult> {
  const url = config.url!;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // 使用原生 fetch (Node.js 18+)
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal as any,
      headers: {
        'Accept': 'application/json',
      },
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (response && (response.ok || response.status === 404 || response.status === 405)) {
      // 200, 404, 405 都表示服务器存在（只是端点可能不同）
      return {
        success: true,
        message: '连接成功',
        details: `URL ${url} 可访问`,
      };
    }

    return {
      success: false,
      message: '连接失败',
      details: `URL ${url} 无响应`,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: '连接超时',
        details: `URL ${url} 在 5 秒内无响应`,
      };
    }
    return {
      success: false,
      message: '连接失败',
      details: error.message,
    };
  }
}
