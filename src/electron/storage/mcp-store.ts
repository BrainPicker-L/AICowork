/**
 * MCP 配置存储模块
 * 读写 ~/.qwen/settings.json 中的 mcpServers 配置
 * 按照 Qwen Code SDK 规范实现
 */

import { promises as fs } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
import { log } from "../logger.js";
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

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
 * Qwen settings.json 结构（部分）
 * 按照 Qwen Code SDK 规范定义
 */
interface QwenSettings {
  mcpServers?: Record<string, McpServerConfig>;
  env?: Record<string, string>;
}

/**
 * 获取 Qwen settings.json 文件路径
 * 按照 Qwen Code SDK 规范，配置文件存储在 ~/.qwen/settings.json
 */
function getSettingsPath(): string {
  return join(homedir(), '.qwen', 'settings.json');
}

/**
 * 确保 .qwen 目录存在（异步）
 */
async function ensureQwenDir(): Promise<void> {
  const settingsPath = getSettingsPath();
  const dir = dirname(settingsPath);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * 读取 Qwen settings.json（异步）
 */
async function readSettings(): Promise<QwenSettings> {
  const settingsPath = getSettingsPath();
  try {
    await fs.access(settingsPath);
  } catch {
    // 文件不存在，返回默认配置
    const defaultSettings: QwenSettings = {
      mcpServers: {},
      env: {},
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
 * 写入 Qwen settings.json（异步）
 */
async function writeSettings(settings: QwenSettings): Promise<void> {
  try {
    await ensureQwenDir();
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
 * MCP 工具信息接口
 */
export interface McpToolInfo {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

/**
 * 测试 MCP 服务器连接
 * 真正连接到 MCP 服务器并测试通信
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

  try {
    const client = new Client({
      name: 'mcp-connection-tester',
      version: '1.0.0',
    });

    let transport: any;
    const type = config.type || 'stdio';

    // 创建传输层
    if (type === 'stdio') {
      if (!config.command) {
        return {
          success: false,
          message: '配置错误',
          details: 'stdio 类型需要 command 参数',
        };
      }
      transport = new StdioClientTransport({
        command: config.command,
        args: config.args || [],
        env: {
          ...process.env,
          ...(config.env || {}),
        } as Record<string, string>,
      });
    } else if (type === 'sse') {
      if (!config.url) {
        return {
          success: false,
          message: '配置错误',
          details: 'sse 类型需要 url 参数',
        };
      }
      transport = new SSEClientTransport(new URL(config.url));
    } else if (type === 'streamableHttp') {
      if (!config.url) {
        return {
          success: false,
          message: '配置错误',
          details: 'streamableHttp 类型需要 url 参数',
        };
      }
      transport = new StreamableHTTPClientTransport(new URL(config.url));
    } else {
      return {
        success: false,
        message: '未知的服务器类型',
        details: `不支持的类型: ${type}`,
      };
    }

    // 尝试连接到服务器
    const startTime = Date.now();
    await client.connect(transport, { timeout: 10000 });

    try {
      // 测试基本通信：获取服务器信息
      const serverInfo = await client.getServerVersion();
      const responseTime = Date.now() - startTime;

      return {
        success: true,
        message: '连接成功',
        details: `服务器: ${serverInfo.name || 'unknown'}, 版本: ${serverInfo.version || 'unknown'}, 响应时间: ${responseTime}ms`,
      };
    } finally {
      // 关闭连接
      await client.close();
    }
  } catch (error: any) {
    log.error('[mcp-store] MCP server test failed:', error);
    
    // 解析错误信息
    let message = '连接失败';
    let details = error.message;

    if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      message = '连接超时';
      details = '服务器在 10 秒内无响应';
    } else if (error.message?.includes('ENOENT') || error.message?.includes('command not found')) {
      message = '命令不存在';
      details = `找不到命令: ${config.command}`;
    } else if (error.message?.includes('ECONNREFUSED')) {
      message = '连接被拒绝';
      details = '无法连接到服务器';
    } else if (error.code === 'ENOENT') {
      message = '命令不存在';
      details = `找不到命令: ${config.command}`;
    }

    return {
      success: false,
      message,
      details,
    };
  }
}

/**
 * 获取 MCP 服务器的工具列表
 */
export async function getMcpServerTools(config: McpServerConfig): Promise<McpToolInfo[]> {
  try {
    const client = new Client({
      name: 'mcp-tools-inspector',
      version: '1.0.0',
    });

    let transport: any;
    const type = config.type || 'stdio';

    // 创建传输层
    if (type === 'stdio') {
      if (!config.command) {
        throw new Error('stdio 类型需要 command 参数');
      }
      transport = new StdioClientTransport({
        command: config.command,
        args: config.args || [],
        env: {
          ...process.env,
          ...(config.env || {}),
        } as Record<string, string>,
      });
    } else if (type === 'sse') {
      if (!config.url) {
        throw new Error('sse 类型需要 url 参数');
      }
      transport = new SSEClientTransport(new URL(config.url));
    } else if (type === 'streamableHttp') {
      if (!config.url) {
        throw new Error('streamableHttp 类型需要 url 参数');
      }
      transport = new StreamableHTTPClientTransport(new URL(config.url));
    } else {
      throw new Error(`不支持的服务器类型: ${type}`);
    }

    // 连接到服务器
    await client.connect(transport, { timeout: 10000 });

    try {
      // 获取工具列表
      const result = await client.listTools();
      
      // 转换为简化格式
      const tools: McpToolInfo[] = result.tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
      }));

      return tools;
    } finally {
      // 关闭连接
      await client.close();
    }
  } catch (error: any) {
    log.error('[mcp-store] Failed to get MCP server tools:', error);
    throw new Error(`获取工具列表失败: ${error.message}`);
  }
}


