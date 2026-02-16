/**
 * MCP 配置存储模块
 * 读写 ~/.qwen/settings.json 中的 mcpServers 配置
 * 按照 Qwen Code SDK 规范实现
 */

import { promises as fs, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
import { log } from "../logger.js";
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

/**
 * 获取增强的 PATH 环境变量
 * 在打包后的 Electron 应用中，需要手动添加常见的用户工具路径
 * 解决 spawn ENOENT 问题
 */
export function getEnhancedPath(): string {
  const home = homedir();
  const existingPath = process.env.PATH || '';
  const additionalPaths: string[] = [];

  // 1. 检测 nvm 安装的 Node.js 版本
  const nvmDir = join(home, '.nvm', 'versions', 'node');
  if (existsSync(nvmDir)) {
    try {
      const versions = readdirSync(nvmDir);
      for (const version of versions) {
        const binPath = join(nvmDir, version, 'bin');
        if (existsSync(binPath) && !existingPath.includes(binPath)) {
          additionalPaths.push(binPath);
        }
      }
    } catch { /* ignore */ }
  }

  // 2. 常见的用户工具安装路径
  const commonPaths = [
    // Node.js 版本管理器
    join(home, '.volta', 'bin'),
    join(home, '.fnm', 'aliases', 'default', 'bin'),
    
    // 包管理器全局安装路径
    join(home, '.npm-global', 'bin'),
    join(home, '.yarn', 'bin'),
    join(home, '.pnpm-global', 'bin'),
    join(home, 'node_modules', '.bin'),
    
    // 自定义工具路径
    join(home, '.utoo-proxy'),
    join(home, '.local', 'bin'),
    join(home, 'bin'),
    
    // 系统路径
    '/usr/local/bin',
    '/opt/homebrew/bin',  // macOS ARM Homebrew
    '/opt/homebrew/sbin',
  ];

  for (const p of commonPaths) {
    if (existsSync(p) && !existingPath.includes(p) && !additionalPaths.includes(p)) {
      additionalPaths.push(p);
    }
  }

  const enhancedPath = [...additionalPaths, existingPath].join(':');
  
  // 仅在开发环境或首次调用时记录日志
  if (additionalPaths.length > 0) {
    log.debug(`[mcp-store] Enhanced PATH with ${additionalPaths.length} additional paths`);
  }

  return enhancedPath;
}

/**
 * MCP 服务器配置接口
 * 支持从 MCP 市场直接复制粘贴的格式
 * 按照 Qwen Code SDK 规范：
 * - stdio 类型使用 command + args
 * - sse 类型使用 url
 * - http/streamable_http 类型使用 httpUrl
 */
export interface McpServerConfig {
  // ===== 传输类型字段（可选，Qwen SDK 会自动识别） =====
  /** 
   * 传输类型（可选）
   * 注意：Qwen Code SDK 会自动识别传输类型，此字段仅用于兼容性
   * 如果提供，应为：stdio、sse、http 或 streamable_http
   */
  type?: 'stdio' | 'sse' | 'http' | 'streamable_http';
  
  // ===== stdio 类型字段 =====
  /** 命令（stdio 类型必需） */
  command?: string;
  /** 命令参数（stdio 类型可选） */
  args?: string[];
  /** 工作目录（stdio 类型可选） */
  cwd?: string;
  /** 环境变量（stdio 类型可选） */
  env?: Record<string, string>;
  
  // ===== sse 类型字段 =====
  /** URL（sse 类型必需） */
  url?: string;
  
  // ===== http/streamable_http 类型字段 =====
  /** HTTP URL（http/streamable_http 类型必需） */
  httpUrl?: string;
  
  /** HTTP 请求头（sse/http 类型可选） */
  headers?: Record<string, string>;
  
  // ===== 通用可选字段 =====
  /** 显示名称 */
  displayName?: string;
  /** 描述 */
  description?: string;
  /** 是否启用 */
  enabled?: boolean;
  /** 连接超时（毫秒） */
  timeout?: number;
  /** 是否信任（跳过确认） */
  trust?: boolean;
  /** 包含的工具列表（白名单） */
  includeTools?: string[];
  /** 排除的工具列表（黑名单） */
  excludeTools?: string[];
  
  // ===== 已废弃字段（仅用于兼容） =====
  /** @deprecated 使用 enabled 代替 */
  disabled?: boolean;
  /** @deprecated 服务器名称已经是 key，不需要重复 */
  name?: string;
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
 * 用户输入的配置原样保存到 settings.json
 */
export async function saveMcpServer(name: string, config: McpServerConfig): Promise<void> {
  const settings = await readSettings();

  if (!settings.mcpServers) {
    settings.mcpServers = {};
  }

  // 移除 name 字段（name 是 key，不应在 value 中重复）
  const { name: _, ...configToSave } = config as any;
  
  // 原样保存用户配置，包括 type 字段（如果有）
  settings.mcpServers[name] = configToSave;
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
 * 切换 MCP 服务器的启用状态
 * @param name 服务器名称
 * @param enabled 新的启用状态
 */
export async function toggleMcpServerEnabled(name: string, enabled: boolean): Promise<void> {
  const config = await loadMcpServer(name);
  if (!config) {
    throw new Error(`MCP server not found: ${name}`);
  }
  
  // 更新 enabled 状态
  config.enabled = enabled;
  
  // 保存配置
  await saveMcpServer(name, config);
  log.info(`[mcp-store] MCP server "${name}" ${enabled ? 'enabled' : 'disabled'}`);
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
 * 检查是否符合 Qwen Code 规范，并给出修改建议
 * 按照 Qwen Code SDK 规范：
 * - stdio 类型使用 command + args
 * - sse 类型使用 url
 * - http/streamable_http 类型使用 httpUrl
 */
export function validateMcpServer(config: McpServerConfig): { 
  valid: boolean; 
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 检查 type 字段（如果提供）
  if (config.type) {
    const validTypes = ['stdio', 'sse', 'http', 'streamable_http'];
    if (!validTypes.includes(config.type)) {
      errors.push(`type 必须是 ${validTypes.join('、')} 之一`);
    }
    
    // 如果是 streamable_http，给出建议
    if (config.type === 'streamable_http') {
      warnings.push('建议：type 值 "streamable_http" 可以改为 "http"，或直接移除 type 字段让 Qwen SDK 自动识别');
    }
  }

  // 检查必需字段
  const hasCommand = !!config.command;
  const hasUrl = !!config.url;
  const hasHttpUrl = !!config.httpUrl;

  if (!hasCommand && !hasUrl && !hasHttpUrl) {
    errors.push('必须提供 command（stdio 类型）、url（sse 类型）或 httpUrl（http/streamable_http 类型）');
  }

  // 检查 url 和 httpUrl 不能同时存在
  if (hasUrl && hasHttpUrl) {
    errors.push('url 和 httpUrl 不能同时存在，SSE 类型使用 url，HTTP 类型使用 httpUrl');
  }

  // 类型与字段匹配校验
  if (config.type === 'sse' && hasHttpUrl && !hasUrl) {
    errors.push('SSE 类型应使用 url 字段而不是 httpUrl');
  }
  if ((config.type === 'http' || config.type === 'streamable_http') && hasUrl && !hasHttpUrl) {
    warnings.push('HTTP/Streamable HTTP 类型建议使用 httpUrl 字段而不是 url（当前配置仍可工作，但建议调整）');
  }

  // stdio 类型验证
  if (hasCommand) {
    if (typeof config.command !== 'string' || config.command.trim() === '') {
      errors.push('command 不能为空');
    }
    if (config.args && !Array.isArray(config.args)) {
      errors.push('args 必须是数组');
    }
    if (config.env && typeof config.env !== 'object') {
      errors.push('env 必须是对象');
    }
  }

  // sse 类型验证（url 字段）
  if (hasUrl) {
    try {
      new URL(config.url!);
    } catch {
      errors.push('url 格式无效');
    }
  }

  // http/streamable_http 类型验证（httpUrl 字段）
  if (hasHttpUrl) {
    try {
      new URL(config.httpUrl!);
    } catch {
      errors.push('httpUrl 格式无效');
    }
  }

  // headers 验证
  if (config.headers && typeof config.headers !== 'object') {
    errors.push('headers 必须是对象');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
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
 * 根据配置自动识别传输类型并创建 Transport
 * 按照 Qwen Code SDK 规范：
 * - stdio 类型使用 command + args
 * - sse 类型使用 url
 * - http/streamable_http 类型使用 httpUrl
 */
function createTransport(config: McpServerConfig): any {
  // 优先根据字段判断，而不是 type
  if (config.command) {
    // stdio 类型 - 使用增强的 PATH 解决打包后找不到命令的问题
    return new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env: {
        ...process.env,
        PATH: getEnhancedPath(),
        ...(config.env || {}),
      } as Record<string, string>,
    });
  } else if (config.httpUrl) {
    // HTTP/Streamable HTTP 类型 - 优先使用 httpUrl 字段
    return new StreamableHTTPClientTransport(new URL(config.httpUrl));
  } else if (config.url) {
    // 根据 type 判断是 SSE 还是 HTTP
    // 如果 type 是 http 或 streamable_http，使用 HTTP（兼容旧配置）
    if (config.type === 'http' || config.type === 'streamable_http') {
      return new StreamableHTTPClientTransport(new URL(config.url));
    }
    // 默认使用 SSE
    return new SSEClientTransport(new URL(config.url));
  }
  
  throw new Error('无法识别传输类型：缺少 command、url 或 httpUrl');
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

  try {
    const client = new Client({
      name: 'mcp-connection-tester',
      version: '1.0.0',
    });

    const transport = createTransport(config);
    const startTime = Date.now();
    await client.connect(transport, { timeout: config.timeout || 10000 });

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
      details = `服务器在 ${config.timeout || 10000}ms 内无响应`;
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

    const transport = createTransport(config);
    await client.connect(transport, { timeout: config.timeout || 10000 });

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


