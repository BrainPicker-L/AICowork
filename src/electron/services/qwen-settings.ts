import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { loadApiConfig, saveApiConfig, type ApiConfig } from "../storage/config-store.js";
import { app } from "electron";
import { log } from "../logger.js";

/**
 * API 配置缓存
 * 避免频繁读取配置文件
 */
let apiConfigCache: ApiConfig | null = null;
let apiConfigCacheTimestamp: number = 0;
const API_CONFIG_CACHE_TTL = 60000; // 60秒缓存（性能优化）

/**
 * Qwen SDK 路径缓存
 * 避免重复计算路径
 */
let qwenCodePathCache: string | null = null;

/**
 * 获取 Qwen Code SDK CLI 路径（带缓存）
 *
 * 重要说明：
 * 1. SDK 的 CLI 路径是可选的，仅用于特定场景
 * 2. 如果 CLI 不存在，SDK 可以继续正常工作
 * 3. 使用 fork() 会自动使用当前 Node.js 进程（Electron 内置的）
 *
 * @returns CLI 脚本的完整路径，如果不存在则返回 undefined
 */
export function getQwenCodePath(): string | undefined {
  // 检查缓存
  if (qwenCodePathCache !== null) {
    return qwenCodePathCache || undefined;
  }

  let cliPath: string;

  if (app.isPackaged) {
    // 生产环境：使用 app.asar.unpacked 中的解包模块
    cliPath = join(
      process.resourcesPath,
      'app.asar.unpacked/node_modules/@qwen-code/sdk/cli.js'
    );

    // 验证文件存在
    if (!existsSync(cliPath)) {
      log.warn(`[qwen-settings] CLI not found at: ${cliPath}`);
      log.warn(`[qwen-settings] SDK will continue without CLI path`);
      // 缓存 null 以表示 CLI 不存在
      qwenCodePathCache = null;
      return undefined;
    }

    log.debug(`[qwen-settings] Using packaged CLI: ${cliPath}`);
  } else {
    // 开发环境：使用 node_modules 中的 CLI
    cliPath = join(process.cwd(), 'node_modules/@qwen-code/sdk/cli.js');

    if (!existsSync(cliPath)) {
      log.warn(`[qwen-settings] CLI not found at: ${cliPath}`);
      log.warn(`[qwen-settings] Current directory: ${process.cwd()}`);
      // 缓存 null 以表示 CLI 不存在
      qwenCodePathCache = null;
      return undefined;
    }

    log.debug(`[qwen-settings] Using dev CLI: ${cliPath}`);
  }

  // 缓存结果
  qwenCodePathCache = cliPath;
  return cliPath;
}

/**
 * 清除 API 配置缓存
 * 在配置更改时调用
 */
export function clearApiConfigCache(): void {
  apiConfigCache = null;
  apiConfigCacheTimestamp = 0;
  qwenCodePathCache = null;
  log.debug('[qwen-settings] API 配置缓存已清除');

  // 同时清除 SDK 配置缓存（包含 API 配置）
  import("../managers/sdk-config-cache.js").then(module => {
    module.clearConfigCache().catch((error) => {
      log.warn('[qwen-settings] Failed to clear SDK config cache:', error);
    });
  }).catch((error) => {
    log.warn('[qwen-settings] Failed to import SDK config cache:', error);
  });
}

// 获取当前有效的配置（优先界面配置，然后是环境变量，最后回退到文件配置）
export function getCurrentApiConfig(): ApiConfig | null {
  // 检查缓存（5秒内有效）
  const now = Date.now();
  if (apiConfigCache && (now - apiConfigCacheTimestamp) < API_CONFIG_CACHE_TTL) {
    return apiConfigCache;
  }

  // 1. 优先检查 api-config.json
  const uiConfig = loadApiConfig();
  if (uiConfig) {
    log.debug("[qwen-settings] Using UI config from api-config.json:", {
      baseURL: uiConfig.baseURL,
      model: uiConfig.model,
      apiType: uiConfig.apiType
    });
    // 更新缓存
    apiConfigCache = uiConfig;
    apiConfigCacheTimestamp = now;
    return uiConfig;
  }

  // 2. 检查 process.env（从 .env 文件加载的环境变量）
  // 支持多种环境变量格式：ANTHROPIC_* / OPENAI_* / QWEN_*
  const envAuthToken = process.env.ANTHROPIC_AUTH_TOKEN || process.env.OPENAI_API_KEY || process.env.QWEN_API_KEY;
  const envBaseURL = process.env.ANTHROPIC_BASE_URL || process.env.OPENAI_BASE_URL || process.env.QWEN_BASE_URL;
  const envModel = process.env.ANTHROPIC_MODEL || process.env.OPENAI_MODEL || process.env.QWEN_MODEL;
  const envApiType = process.env.ANTHROPIC_API_TYPE || process.env.QWEN_API_TYPE;

  if (envAuthToken && envBaseURL && envModel) {
    log.debug("[qwen-settings] Using config from process.env (.env file):", {
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
      log.debug("[qwen-settings] Persisted env config to api-config.json");
    } catch (e) {
      log.error("[qwen-settings] Failed to persist config:", e);
    }
    // 更新缓存
    apiConfigCache = config;
    apiConfigCacheTimestamp = now;
    return config;
  }

  // 3. 回退到 ~/.qwen/settings.json（兼容旧的 ~/.claude/settings.json）
  const configDirs = [
    join(homedir(), ".qwen"),
    join(homedir(), ".claude")  // 向后兼容
  ];

  for (const configDir of configDirs) {
    try {
      const settingsPath = join(configDir, "settings.json");
      if (!existsSync(settingsPath)) continue;

      const raw = readFileSync(settingsPath, "utf8");
      const parsed = JSON.parse(raw) as { env?: Record<string, unknown> };
      if (parsed.env) {
        // 支持多种环境变量名称
        const authToken = parsed.env.OPENAI_API_KEY || parsed.env.QWEN_API_KEY || parsed.env.ANTHROPIC_AUTH_TOKEN;
        const baseURL = parsed.env.OPENAI_BASE_URL || parsed.env.QWEN_BASE_URL || parsed.env.ANTHROPIC_BASE_URL;
        const model = parsed.env.OPENAI_MODEL || parsed.env.QWEN_MODEL || parsed.env.ANTHROPIC_MODEL;

        if (authToken && baseURL && model) {
          log.debug(`[qwen-settings] Using file config from ${settingsPath}`);
          const config: ApiConfig = {
            id: 'qwen-settings',
            name: 'Qwen Settings 配置',
            apiKey: String(authToken),
            baseURL: String(baseURL),
            model: String(model),
            apiType: "anthropic"
          };
          // 持久化到 api-config.json
          try {
            saveApiConfig(config);
            log.debug("[qwen-settings] Persisted config to api-config.json");
          } catch (e) {
            log.error("[qwen-settings] Failed to persist config:", e);
          }
          // 更新缓存
          apiConfigCache = config;
          apiConfigCacheTimestamp = now;
          return config;
        }
      }
    } catch {
      // Ignore missing or invalid settings file, try next directory
      continue;
    }
  }

  log.debug("[qwen-settings] No config found");
  return null;
}

export function buildEnvForConfig(config: ApiConfig): Record<string, string> {
  const baseEnv = { ...process.env } as Record<string, string>;

  // Qwen SDK 使用 OpenAI 兼容的环境变量
  baseEnv.OPENAI_API_KEY = config.apiKey;
  baseEnv.OPENAI_BASE_URL = config.baseURL;
  baseEnv.OPENAI_MODEL = config.model;
  
  // 同时保留 ANTHROPIC_* 格式（用于 .env 文件兼容）
  baseEnv.ANTHROPIC_AUTH_TOKEN = config.apiKey;
  baseEnv.ANTHROPIC_BASE_URL = config.baseURL;
  baseEnv.ANTHROPIC_MODEL = config.model;
  if (config.apiType) {
    baseEnv.ANTHROPIC_API_TYPE = config.apiType;
  }

  // 设置 Qwen 配置目录路径，确保 SDK 能找到 MCP 配置
  const qwenConfigDir = join(homedir(), '.qwen');
  baseEnv.QWEN_CONFIG_DIR = qwenConfigDir;

  log.info(`[qwen-settings] QWEN_CONFIG_DIR set to: ${qwenConfigDir}`);

  return baseEnv;
}

// ===== 代理功能已移除，改为直连模式 =====
