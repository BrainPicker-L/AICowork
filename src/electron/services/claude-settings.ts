import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { loadApiConfig, saveApiConfig, type ApiConfig } from "../storage/config-store.js";
import { startProxyServer, stopProxyServer, getProxyStatus } from "../api-proxy/index.js";
import { app } from "electron";
import { log } from "../logger.js";
import { PROXY_CHECK_TIMEOUT, PROXY_CACHE_TTL } from "../config/network-constants.js";

/**
 * 获取 AI Agent SDK CLI 路径
 *
 * 重要说明：
 * 1. 项目已对 SDK 打补丁，使用 fork() 代替 spawn()
 * 2. fork() 会自动使用当前 Node.js 进程（Electron 内置的）
 * 3. 因此不需要用户设备安装 Node.js
 *
 * @returns CLI 脚本的完整路径
 */
export function getClaudeCodePath(): string {
  let cliPath: string;

  if (app.isPackaged) {
    // 生产环境：使用 app.asar.unpacked 中的解包模块
    cliPath = join(
      process.resourcesPath,
      'app.asar.unpacked/node_modules/@anthropic-ai/claude-agent-sdk/cli.js'
    );

    // 验证文件存在
    if (!existsSync(cliPath)) {
      log.error(`[claude-settings] CLI not found at: ${cliPath}`);
      log.error(`[claude-settings] Resources path: ${process.resourcesPath}`);
      log.error(`[claude-settings] Please ensure @anthropic-ai/claude-agent-sdk is in asarUnpack`);
      // 抛出明确的错误
      throw new Error(
        'AI Agent SDK CLI not found. Please ensure the application is properly built.\n' +
        `Expected path: ${cliPath}`
      );
    }

    log.debug(`[claude-settings] Using packaged CLI: ${cliPath}`);
  } else {
    // 开发环境：使用 node_modules 中的 CLI
    cliPath = join(process.cwd(), 'node_modules/@anthropic-ai/claude-agent-sdk/cli.js');

    if (!existsSync(cliPath)) {
      log.warn(`[claude-settings] CLI not found at: ${cliPath}`);
      log.warn(`[claude-settings] Current directory: ${process.cwd()}`);
      log.warn(`[claude-settings] Try running: bun install or npm install`);
    }

    log.debug(`[claude-settings] Using dev CLI: ${cliPath}`);
  }

  return cliPath;
}

// 获取当前有效的配置（优先界面配置，然后是环境变量，最后回退到文件配置）
export function getCurrentApiConfig(): ApiConfig | null {
  // 1. 优先检查 api-config.json
  const uiConfig = loadApiConfig();
  if (uiConfig) {
    log.debug("[claude-settings] Using UI config from api-config.json:", {
      baseURL: uiConfig.baseURL,
      model: uiConfig.model,
      apiType: uiConfig.apiType
    });
    return uiConfig;
  }

  // 2. 检查 process.env（从 .env 文件加载的环境变量）
  const envAuthToken = process.env.ANTHROPIC_AUTH_TOKEN;
  const envBaseURL = process.env.ANTHROPIC_BASE_URL;
  const envModel = process.env.ANTHROPIC_MODEL;
  const envApiType = process.env.ANTHROPIC_API_TYPE;

  if (envAuthToken && envBaseURL && envModel) {
    log.debug("[claude-settings] Using config from process.env (.env file):", {
      baseURL: envBaseURL,
      model: envModel,
      apiType: envApiType
    });
    const config: ApiConfig = {
      id: 'env',
      name: '环境变量配置',
      apiKey: String(envAuthToken),
      baseURL: String(envBaseURL),
      model: String(envModel),
      apiType: (envApiType as any) || "anthropic"
    };
    // 持久化到 api-config.json 以便下次快速加载
    try {
      saveApiConfig(config);
      log.debug("[claude-settings] Persisted env config to api-config.json");
    } catch (e) {
      log.error("[claude-settings] Failed to persist config:", e);
    }
    return config;
  }

  // 3. 回退到 ~/.claude/settings.json
  try {
    const settingsPath = join(homedir(), ".claude", "settings.json");
    const raw = readFileSync(settingsPath, "utf8");
    const parsed = JSON.parse(raw) as { env?: Record<string, unknown> };
    if (parsed.env) {
      const authToken = parsed.env.ANTHROPIC_AUTH_TOKEN;
      const baseURL = parsed.env.ANTHROPIC_BASE_URL;
      const model = parsed.env.ANTHROPIC_MODEL;

      if (authToken && baseURL && model) {
        log.debug("[claude-settings] Using file config from ~/.claude/settings.json");
        const config: ApiConfig = {
          id: 'claude-settings',
          name: 'Claude Settings 配置',
          apiKey: String(authToken),
          baseURL: String(baseURL),
          model: String(model),
          apiType: "anthropic"
        };
        // 持久化到 api-config.json
        try {
          saveApiConfig(config);
          log.debug("[claude-settings] Persisted config to api-config.json");
        } catch (e) {
          log.error("[claude-settings] Failed to persist config:", e);
        }
        return config;
      }
    }
  } catch {
    // Ignore missing or invalid settings file.
  }

  log.debug("[claude-settings] No config found");
  return null;
}

export function buildEnvForConfig(config: ApiConfig): Record<string, string> {
  const baseEnv = { ...process.env } as Record<string, string>;

  baseEnv.ANTHROPIC_AUTH_TOKEN = config.apiKey;

  // 保留原始 baseURL，不做路径清理
  // 适配器会根据 apiType 自动处理路径前缀
  baseEnv.ANTHROPIC_BASE_URL = config.baseURL;
  baseEnv.ANTHROPIC_MODEL = config.model;

  // 设置 Claude 配置目录路径，确保 SDK 能找到 MCP 配置
  const claudeConfigDir = join(homedir(), '.claude');
  baseEnv.CLAUDE_CONFIG_DIR = claudeConfigDir;

  log.info(`[claude-settings] CLAUDE_CONFIG_DIR set to: ${claudeConfigDir}`);

  return baseEnv;
}

// 记录需要代理的 API 配置（baseURL 为 key）
const proxyNeededApis = new Map<string, boolean>();

// 预检测进行中标记
let isPrechecking = false;

/**
 * 清除代理检测缓存
 * 在配置改变时调用，确保重新检测
 */
export function clearProxyCache(): void {
  proxyNeededApis.clear();
  log.info('[claude-settings] 代理检测缓存已清除');
}

/**
 * 应用启动时预检测代理需求
 * 在后台异步执行，不阻塞应用启动
 */
export async function precheckProxyNeeds(): Promise<void> {
  // 如果已经在预检测中，跳过
  if (isPrechecking) {
    log.debug('[claude-settings] 代理预检测已在进行中，跳过');
    return;
  }

  // 获取当前配置
  const config = getCurrentApiConfig();
  if (!config) {
    log.debug('[claude-settings] 无 API 配置，跳过预检测');
    return;
  }

  // 检查是否已有缓存结果
  let cleanBaseURL: string;
  try {
    const url = new URL(config.baseURL);
    url.pathname = '';
    cleanBaseURL = url.toString().replace(/\/$/, '');
  } catch {
    cleanBaseURL = config.baseURL;
  }
  const cacheKey = cleanBaseURL;

  // 检查配置文件缓存（24小时内有效）
  if (config.needsProxy !== undefined && config.needsProxyCheckedAt) {
    const age = Date.now() - config.needsProxyCheckedAt;
    if (age < PROXY_CACHE_TTL) {
      log.debug(`[claude-settings] 配置文件缓存有效，跳过预检测 (${Math.round(age / 1000 / 60)} 分钟前)`);
      proxyNeededApis.set(cacheKey, config.needsProxy);
      return;
    }
  }

  // 检查内存缓存
  if (proxyNeededApis.has(cacheKey)) {
    log.debug(`[claude-settings] 内存缓存有效，跳过预检测`);
    return;
  }

  // 开始预检测
  isPrechecking = true;
  log.info(`[claude-settings] 开始代理预检测: ${cleanBaseURL}`);

  // 异步执行检测，不阻塞
  checkProxyNeeded(config)
    .then((needsProxy) => {
      log.info(`[claude-settings] 代理预检测完成: ${needsProxy ? '需要代理' : '无需代理'}`);
    })
    .catch((error) => {
      log.warn(`[claude-settings] 代理预检测失败:`, error);
    })
    .finally(() => {
      isPrechecking = false;
    });
}

/**
 * 检测 API 是否需要代理模式
 *
 * 背景：部分第三方 API 不支持 Anthropic 的 /count_tokens 端点
 * 策略：测试 /v1/messages/count_tokens 端点是否可用
 *
 * 优化特性：
 * - 5 秒超时（从 10 秒缩短）
 * - 失败快速降级到代理模式
 * - 配置文件缓存（24 小时有效）
 * - 内存缓存（会话期间复用）
 *
 * @param config API 配置
 * @returns true 表示需要启动代理服务器拦截 count_tokens 请求
 *          false 表示 API 原生支持该端点，可直接连接
 */
export async function checkProxyNeeded(config: ApiConfig): Promise<boolean> {
  // 使用 URL API 安全地清理 baseURL，只清理路径部分
  let cleanBaseURL: string;
  try {
    const url = new URL(config.baseURL);
    // 清空路径，保留协议、域名、端口
    url.pathname = '';
    // 移除末尾斜杠
    cleanBaseURL = url.toString().replace(/\/$/, '');
  } catch {
    // 如果 URL 无效，使用原始值
    cleanBaseURL = config.baseURL;
  }
  const cacheKey = cleanBaseURL;

  log.info('[claude-settings] 检查 API 代理需求:', {
    originalBaseURL: config.baseURL,
    cleanBaseURL,
    apiType: config.apiType,
    model: config.model,
  });

  // 优先级 1: 检查配置文件中是否已有检测结果（24小时内有效）
  if (config.needsProxy !== undefined && config.needsProxyCheckedAt) {
    const age = Date.now() - config.needsProxyCheckedAt;
    if (age < PROXY_CACHE_TTL) {
      log.info(`[claude-settings] 使用配置文件中的检测结果: ${config.needsProxy} (缓存于 ${Math.round(age / 1000 / 60)} 分钟前)`);
      proxyNeededApis.set(cacheKey, config.needsProxy);
      return config.needsProxy;
    }
  }

  // 优先级 2: 检查内存缓存
  if (proxyNeededApis.has(cacheKey)) {
    const cached = proxyNeededApis.get(cacheKey)!;
    log.info(`[claude-settings] 使用内存缓存结果: ${cached} for ${cacheKey}`);
    return cached;
  }

  // 尝试测试 /count_tokens 端点（使用 Anthropic 标准路径）
  try {
    const testUrl = `${cleanBaseURL}/v1/messages/count_tokens`;
    log.info(`[claude-settings] 测试端点: ${testUrl} (超时: ${PROXY_CHECK_TIMEOUT}ms)`);

    // 设置超时控制（使用优化的超时时间）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROXY_CHECK_TIMEOUT);

    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'test' }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const needsProxy = !response.ok;
    proxyNeededApis.set(cacheKey, needsProxy);

    if (needsProxy) {
      log.info(`[claude-settings] ✓ API 需要代理模式: ${cleanBaseURL} (status: ${response.status})`);
    } else {
      log.warn(`[claude-settings] ✗ API 可以直接连接（可能有问题）: ${cleanBaseURL} (status: ${response.status})`);
    }

    // 保存检测结果到配置文件，避免下次重复检测
    try {
      const { saveApiConfig, loadAllApiConfigs } = await import('../storage/config-store.js');
      const store = loadAllApiConfigs();
      if (store) {
        const existingConfig = store.configs.find(c => c.id === config.id);
        if (existingConfig) {
          existingConfig.needsProxy = needsProxy;
          existingConfig.needsProxyCheckedAt = Date.now();
          saveApiConfig(existingConfig);
          log.info(`[claude-settings] 检测结果已保存到配置文件`);
        }
      }
    } catch (saveError) {
      log.warn(`[claude-settings] 保存检测结果失败（不影响使用）:`, saveError);
    }

    return needsProxy;
  } catch (error) {
    // 快速降级：检测失败时默认使用代理模式
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('abort') || errorMsg.includes('timeout')) {
      log.warn(`[claude-settings] API 检测超时 (${PROXY_CHECK_TIMEOUT}ms)，使用代理模式: ${cleanBaseURL}`);
    } else {
      log.warn(`[claude-settings] API 检测失败，使用代理模式: ${cleanBaseURL}`, error);
    }
    proxyNeededApis.set(cacheKey, true);
    return true;
  }
}

/**
 * 构建启用代理模式的环境变量
 * 用于第三方 API（DeepSeek、阿里云等）
 * @param config API 配置
 * @returns 环境变量对象
 */
export function buildEnvForConfigWithProxy(config: ApiConfig): Record<string, string> {
  const baseEnv = { ...process.env } as Record<string, string>;

  // 设置 API 密钥
  baseEnv.ANTHROPIC_AUTH_TOKEN = config.apiKey;

  // 启动代理服务器，使用原始配置（保留完整路径）
  // 注意：不清理 baseURL，因为适配器需要完整路径来构造正确的 API 端点
  // 例如：https://open.bigmodel.cn/api/anthropic 需要保持完整
  const proxyUrl = startProxyServer(config);
  baseEnv.ANTHROPIC_BASE_URL = proxyUrl;
  baseEnv.ANTHROPIC_MODEL = config.model;

  // 设置 Claude 配置目录路径，确保 SDK 能找到 MCP 配置
  baseEnv.CLAUDE_CONFIG_DIR = join(homedir(), '.claude');

  // 添加 Claude Code CLI 环境变量
  baseEnv.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = '1';
  baseEnv.DISABLE_AUTOUPDATER = '1';

  log.info('[claude-settings] 代理模式已启用:', {
    proxyUrl,
    baseURL: config.baseURL,
    apiType: config.apiType,
    model: config.model,
    proxyStatus: getProxyStatus()
  });

  return baseEnv;
}

/**
 * 清理代理服务器资源
 * 在应用退出或切换配置时调用
 */
export function cleanupProxyServer(): void {
  stopProxyServer();
  log.info('[claude-settings] 代理服务器资源已清理');
}
