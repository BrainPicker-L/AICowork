import { app } from "electron";
import { readFileSync, existsSync, mkdirSync, writeFileSync, promises as fs } from "fs";
import { join } from "path";
import { log } from "../logger.js";
import { getProviderDefaults } from "../libs/api-adapter.js";
import type { ApiProvider } from "../config/constants.js";
import { PROVIDER_COMPATIBILITY } from "../config/constants.js";
import { saveApiConfigToEnv } from "../utils/env-file.js";

// 使用 fs.promises 进行异步操作
const { writeFile, access } = fs;

// ==================== 类型定义 ====================

export type ApiType = ApiProvider;

export type ApiConfig = {
  /** 配置唯一 ID */
  id: string;
  /** 配置名称（用户可自定义） */
  name: string;
  /** API 密钥 */
  apiKey: string;
  /** API 基础 URL */
  baseURL: string;
  /** 模型名称 */
  model: string;
  /** API 厂商类型 */
  apiType?: ApiType;
  /** 是否为当前激活的配置 */
  isActive?: boolean;
  /** Azure 特定：资源名称 */
  resourceName?: string;
  /** Azure 特定：部署名称 */
  deploymentName?: string;
  /** 自定义请求头 */
  customHeaders?: Record<string, string>;
  /** 强制使用 OpenAI 格式（用于 Anthropic 端点不可用时） */
  forceOpenaiFormat?: boolean;
  /** 模型特定的参数限制（动态获取） */
  modelLimits?: {
    max_tokens?: number;
    min_tokens?: number;
    max_temperature?: number;
    min_temperature?: number;
    max_top_p?: number;
    min_top_p?: number;
    lastUpdated?: number;  // 时间戳
  };
  /** 创建时间 */
  createdAt?: number;
  /** 更新时间 */
  updatedAt?: number;
};

/**
 * 多配置存储结构
 */
export type ApiConfigsStore = {
  /** 当前激活的配置 ID */
  activeConfigId?: string;
  /** 所有配置列表 */
  configs: ApiConfig[];
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

const CONFIG_FILE_NAME = "api-config.json";

/**
 * 生成唯一配置 ID
 */
function generateConfigId(): string {
  return `cfg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 迁移旧格式配置到新格式
 */
function migrateOldConfig(oldConfig: any): ApiConfigsStore {
  const newConfig: ApiConfig = {
    id: generateConfigId(),
    name: oldConfig.name || `${oldConfig.apiType || 'custom'} 配置`,
    apiKey: oldConfig.apiKey,
    baseURL: oldConfig.baseURL,
    model: oldConfig.model,
    apiType: oldConfig.apiType || 'anthropic',
    isActive: true,
    resourceName: oldConfig.resourceName,
    deploymentName: oldConfig.deploymentName,
    customHeaders: oldConfig.customHeaders,
    forceOpenaiFormat: oldConfig.forceOpenaiFormat,
    modelLimits: oldConfig.modelLimits,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return {
    activeConfigId: newConfig.id,
    configs: [newConfig],
  };
}

// 无需 API Key 的厂商（本地部署）- 当前无此类厂商
const NO_API_KEY_PROVIDERS: ReadonlySet<ApiProvider> = new Set([
  // 当前保留的厂商都需要 API Key
]);

// 各厂商的 API Key 格式模式
const API_KEY_PATTERNS: Partial<Record<ApiProvider, RegExp[]>> = {
  anthropic: [/^sk-ant-[a-zA-Z0-9_-]{91,}$/],
  zhipu: [/^[0-9a-f]{32}\.[0-9a-f]{8}\.[0-9a-f]{8}$/],
  deepseek: [/^sk-[a-zA-Z0-9-]{51,}$/],
  alibaba: [/^sk-[a-zA-Z0-9]{48,}$/],
  moonshot: [/^sk-[a-zA-Z0-9]{43,}$/],
  qiniu: [/^sk-[a-zA-Z0-9]{32,}$/],
  n1n: [/^sk-[a-zA-Z0-9]{32,}$/],
  minimax: [/^.{20,}$/],
  custom: [/^.{20,}$/],
};

/**
 * 验证 API Key 格式（根据厂商类型）
 */
function validateApiKey(apiKey: string, provider: ApiProvider): string[] {
  const errors: string[] = [];

  // 本地部署厂商不需要 API Key
  if (NO_API_KEY_PROVIDERS.has(provider)) {
    // 允许空 API key 或任意值
    return errors;
  }

  if (!apiKey || typeof apiKey !== 'string') {
    errors.push('API Key 不能为空');
    return errors;
  }

  const trimmed = apiKey.trim();

  // 基本验证
  if (trimmed.length < 20) {
    errors.push('API Key 长度过短（至少 20 个字符）');
  }

  if (trimmed.length > 200) {
    errors.push('API Key 长度过长（最多 200 个字符）');
  }

  // 检查是否包含可疑字符
  if (/[<>{}]/.test(trimmed)) {
    errors.push('API Key 包含非法字符');
  }

  // 检查命令注入模式（shell 元字符）
  if (/[;&|`$()]/.test(trimmed)) {
    errors.push('API Key 包含潜在命令注入模式');
  }

  // 厂商特定验证
  const patterns = API_KEY_PATTERNS[provider];
  if (patterns && patterns.length > 0) {
    const matchesPattern = patterns.some(pattern => pattern.test(trimmed));
    if (!matchesPattern) {
      // 只在警告级别提示格式不匹配，因为用户可能使用自定义密钥
      log.warn(`[config-store] API key format may not match expected format for ${provider}`);
    }
  }

  return errors;
}

/**
 * 验证 Base URL 格式
 */
function validateBaseURL(baseURL: string, provider: ApiProvider): string[] {
  const errors: string[] = [];

  if (!baseURL || typeof baseURL !== 'string') {
    errors.push('Base URL 不能为空');
    return errors;
  }

  const trimmed = baseURL.trim();

  try {
    const url = new URL(trimmed);

    // 检查协议
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      errors.push('Base URL 必须使用 HTTP 或 HTTPS 协议');
    }

    // 生产环境建议使用 HTTPS
    if (app.isPackaged && url.protocol === 'http:' && provider !== 'custom') {
      errors.push('生产环境建议使用 HTTPS');
    }

  } catch (error) {
    errors.push('Base URL 格式无效');
  }

  return errors;
}

/**
 * 验证模型名称
 * 允许任何模型名称，只做基本格式验证
 */
function validateModel(model: string, _provider: ApiProvider): string[] {
  const errors: string[] = [];

  if (!model || typeof model !== 'string') {
    errors.push('模型名称不能为空');
    return errors;
  }

  const trimmed = model.trim();

  if (trimmed.length < 3) {
    errors.push('模型名称过短（至少 3 个字符）');
  }

  if (trimmed.length > 200) {
    errors.push('模型名称过长（最多 200 个字符）');
  }

  // 检查非法字符
  if (/[<>{}]/.test(trimmed)) {
    errors.push('模型名称包含非法字符');
  }

  // 不再限制模型名称，允许用户自由输入任何模型
  // 厂商会不断更新模型，限制列表会导致用户无法使用新模型

  return errors;
}

/**
 * 验证配置名称
 */
function validateConfigName(name: string): string[] {
  const errors: string[] = [];

  if (!name || typeof name !== 'string') {
    errors.push('配置名称不能为空');
    return errors;
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    errors.push('配置名称不能为空');
  }

  if (trimmed.length > 100) {
    errors.push('配置名称过长（最多 100 个字符）');
  }

  // 检查 SQL 注入模式
  const sqlInjectionPatterns = [
    /--/,           // SQL 注释
    /;/i,           // 语句分隔符
    /'?\s*(OR|AND)\s+['\w\s]+=.*=/i,  // OR/AND 条件注入
    /UNION\s+SELECT/i,  // UNION 注入
    /DROP\s+TABLE/i,    // DROP TABLE
    /' OR '/i,      // 简单的 OR 注入
    /' AND '/i,     // 简单的 AND 注入
  ];
  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(trimmed)) {
      errors.push('配置名称包含潜在的 SQL 注入模式');
      break;
    }
  }

  // 检查可疑字符
  if (/[<>{}]/.test(trimmed)) {
    errors.push('配置名称包含非法字符');
  }

  return errors;
}

/**
 * 完整验证 API 配置
 */
export function validateApiConfig(config: ApiConfig): ValidationResult {
  const errors: string[] = [];
  const provider = config.apiType || 'anthropic';

  // 验证名称
  if (config.name) {
    errors.push(...validateConfigName(config.name));
  }

  // 验证 apiKey
  errors.push(...validateApiKey(config.apiKey, provider));

  // 验证 baseURL
  errors.push(...validateBaseURL(config.baseURL, provider));

  // 验证 model
  errors.push(...validateModel(config.model, provider));

  // 验证 apiType（只验证是否在支持的厂商列表中）
  const validProviders: ApiProvider[] = [
    'anthropic', 'zhipu', 'deepseek', 'alibaba',
    'qiniu', 'moonshot', 'n1n', 'minimax', 'custom',
  ];

  if (!validProviders.includes(config.apiType as ApiProvider)) {
    errors.push(`不支持的 API 类型: ${config.apiType}。支持的厂商: ${validProviders.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function getConfigPath(): string {
  const userDataPath = app.getPath("userData");
  return join(userDataPath, CONFIG_FILE_NAME);
}

/**
 * 规范化 baseURL - 自动修复旧配置的路径
 * 将旧的 OpenAI 格式路径自动迁移到 Anthropic 兼容路径
 */
function normalizeBaseURL(baseURL: string, apiType: ApiType): string {
  try {
    const url = new URL(baseURL);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname;

    // 厂商路径映射 - 旧格式 -> 新格式
    const pathMigrations: Array<{
      hostPattern: RegExp;
      apiTypes: ApiType[];
      oldPathPrefix: string;
      newPathPrefix: string;
      stripSuffix?: string;  // 需要移除的后缀（如 /v1）
    }> = [
      {
        hostPattern: /dashscope\.aliyuncs\.com/,
        apiTypes: ['alibaba'],
        oldPathPrefix: '/compatible-mode',
        newPathPrefix: '/apps/anthropic',
        stripSuffix: '/v1',  // 移除 /v1 后缀，避免与适配器路径冲突
      },
      {
        hostPattern: /api\.deepseek\.com/,
        apiTypes: ['deepseek'],
        oldPathPrefix: '',
        newPathPrefix: '/anthropic',
      },
      {
        hostPattern: /open\.bigmodel\.cn/,
        apiTypes: ['zhipu'],
        oldPathPrefix: '',
        newPathPrefix: '/api/anthropic',
      },
    ];

    for (const migration of pathMigrations) {
      if (!migration.hostPattern.test(hostname)) continue;
      if (!migration.apiTypes.includes(apiType)) continue;

      // 检查是否需要迁移
      let needsMigration = false;
      let newPathname = pathname;

      if (migration.oldPathPrefix === '') {
        // 旧格式没有路径前缀，直接添加新路径
        if (pathname === '' || pathname === '/') {
          needsMigration = true;
          newPathname = migration.newPathPrefix;
        }
      } else {
        // 检查是否有旧的路径前缀
        if (pathname.startsWith(migration.oldPathPrefix)) {
          needsMigration = true;
          newPathname = pathname.replace(migration.oldPathPrefix, migration.newPathPrefix);

          // 如果需要移除后缀（如 /v1），避免与适配器路径冲突
          if (migration.stripSuffix && newPathname.endsWith(migration.stripSuffix)) {
            newPathname = newPathname.slice(0, -migration.stripSuffix.length);
            // 移除后可能留下末尾斜杠，也需要清理
            newPathname = newPathname.replace(/\/+$/, '');
          }
        }
      }

      if (needsMigration) {
        const newBaseURL = `${url.origin}${newPathname}`;
        log.info(`[config-store] 自动迁移 baseURL: ${baseURL} -> ${newBaseURL}`);
        return newBaseURL;
      }
    }

    return baseURL;
  } catch {
    return baseURL;
  }
}

/**
 * 根据 baseURL 智能推断 apiType
 * 解决旧配置文件缺少 apiType 字段的问题
 */
function inferApiTypeFromBaseURL(baseURL: string): ApiType {
  try {
    const url = new URL(baseURL);
    const hostname = url.hostname.toLowerCase();

    // 根据域名推断厂商
    const domainMap: Record<string, ApiType> = {
      'dashscope.aliyuncs.com': 'alibaba',
      'api.moonshot.cn': 'moonshot',
      'open.bigmodel.cn': 'zhipu',
      'api.deepseek.com': 'deepseek',
      'api.qiniu.com': 'qiniu',
      'api.minimax.chat': 'minimax',
    };

    // 精确匹配域名
    if (domainMap[hostname]) {
      return domainMap[hostname];
    }

    // 模糊匹配（支持子域名）
    for (const [domain, apiType] of Object.entries(domainMap)) {
      if (hostname.includes(domain)) {
        return apiType;
      }
    }

    // 检查路径特征（阿里云兼容模式路径）
    const pathname = url.pathname.toLowerCase();
    if (pathname.includes('/compatible-mode')) {
      // 有兼容模式路径，可能是 alibaba
      // 优先根据域名判断
      if (hostname.includes('aliyun') || hostname.includes('dashscope')) {
        return 'alibaba';
      }
    }

    // 默认返回 custom（而不是 anthropic，让适配器系统自动处理）
    return 'custom';
  } catch {
    return 'custom';
  }
}

export function loadApiConfig(): ApiConfig | null {
  try {
    const configPath = getConfigPath();
    if (!existsSync(configPath)) {
      return null;
    }
    const raw = readFileSync(configPath, "utf8");
    const data = JSON.parse(raw);

    // 检查是否为新格式（有 configs 数组）
    if (data.configs && Array.isArray(data.configs)) {
      const store = data as ApiConfigsStore;
      // 找到激活的配置（直接使用明文 API Key）
      const activeConfig = store.configs.find(c => c.id === store.activeConfigId) || store.configs[0];
      if (activeConfig) {
        return activeConfig;
      }
      return null;
    }

    // 旧格式迁移
    if (data.apiKey && data.baseURL && data.model) {
      log.info('[config-store] 检测到旧格式配置，开始迁移...');
      const newStore = migrateOldConfig(data);
      // 保存新格式（明文存储）
      writeFileSync(configPath, JSON.stringify(newStore, null, 2), "utf8");
      log.info('[config-store] 旧配置已迁移到新格式');
      return newStore.configs[0];
    }

    return null;
  } catch (error) {
    log.error("[config-store] Failed to load API config:", error);
    return null;
  }
}

/**
 * 获取所有 API 配置
 */
export function loadAllApiConfigs(): ApiConfigsStore | null {
  try {
    const configPath = getConfigPath();
    if (!existsSync(configPath)) {
      return { configs: [] };
    }
    const raw = readFileSync(configPath, "utf8");
    const data = JSON.parse(raw);

    // 检查是否为新格式（有 configs 数组）
    if (data.configs && Array.isArray(data.configs)) {
      // 直接返回，API Key 已是明文
      return data as ApiConfigsStore;
    }

    // 旧格式迁移
    if (data.apiKey && data.baseURL && data.model) {
      log.info('[config-store] 检测到旧格式配置，开始迁移...');
      const newStore = migrateOldConfig(data);
      // 保存新格式（明文存储）
      writeFileSync(configPath, JSON.stringify(newStore, null, 2), "utf8");
      log.info('[config-store] 旧配置已迁移到新格式');
      return newStore;
    }

    return { configs: [] };
  } catch (error) {
    log.error("[config-store] Failed to load all API configs:", error);
    return { configs: [] };
  }
}

export function saveApiConfig(config: ApiConfig): void {
  const configPath = getConfigPath();
  const userDataPath = app.getPath("userData");

  try {
    // 确保目录存在并验证创建结果
    if (!existsSync(userDataPath)) {
      try {
        mkdirSync(userDataPath, { recursive: true });
        // 验证目录创建成功
        if (!existsSync(userDataPath)) {
          throw new Error(`无法创建配置目录: ${userDataPath}`);
        }
      } catch (mkdirError) {
        log.error(`[config-store] Failed to create config directory: ${userDataPath}`, mkdirError);
        throw new Error(`无法创建配置目录，请检查文件权限。\n目录路径: ${userDataPath}`);
      }
    }

    // 验证配置
    const validation = validateApiConfig(config);
    if (!validation.valid) {
      const errorMessage = `配置验证失败:\n${validation.errors.join('\n')}`;
      log.error("[config-store] " + errorMessage);
      throw new Error(errorMessage);
    }

    // 设置默认 apiType
    if (!config.apiType) {
      config.apiType = "anthropic";
    }

    // 加载现有配置存储
    let store: ApiConfigsStore = { configs: [] };
    if (existsSync(configPath)) {
      try {
        const raw = readFileSync(configPath, "utf8");
        const data = JSON.parse(raw);
        if (data.configs && Array.isArray(data.configs)) {
          store = data as ApiConfigsStore;
        } else if (data.apiKey) {
          // 迁移旧格式
          store = migrateOldConfig(data);
        }
      } catch (e) {
        log.warn("[config-store] Failed to load existing config, creating new store");
      }
    }

    // 确保配置有 ID 和名称
    const now = Date.now();
    if (!config.id) {
      config.id = generateConfigId();
    }
    if (!config.name) {
      config.name = `${config.apiType || 'custom'} 配置`;
    }
    config.updatedAt = now;
    if (!config.createdAt) {
      config.createdAt = now;
    }

    // 查找配置是否已存在
    const existingIndex = store.configs.findIndex(c => c.id === config.id);
    if (existingIndex >= 0) {
      // 更新现有配置（明文存储）
      store.configs[existingIndex] = config;
    } else {
      // 添加新配置（明文存储）
      store.configs.push(config);
      // 新配置自动设为激活
      store.activeConfigId = config.id;
    }

    // 保存到文件
    writeFileSync(configPath, JSON.stringify(store, null, 2), "utf8");
    log.info("[config-store] API config saved successfully");

    // 保存到 .env 文件（使用激活的配置）
    const activeConfig = store.configs.find(c => c.id === store.activeConfigId) || config;
    try {
      saveApiConfigToEnv({
        apiKey: config.apiKey,
        baseURL: activeConfig.baseURL,
        model: activeConfig.model,
        apiType: activeConfig.apiType,
      });
      log.info("[config-store] ✓ Environment variables saved to .env file successfully");
    } catch (envError) {
      // .env 文件保存失败不影响主流程，只记录警告
      log.warn("[config-store] ✗ Failed to save .env file (continuing):", envError);
    }
  } catch (error) {
    log.error("[config-store] Failed to write config file", error);

    // 检查是否是权限问题
    if (error instanceof Error) {
      if (error.message.includes('EACCES') || error.message.includes('EPERM')) {
        throw new Error(`没有写入配置文件的权限。\n请确保应用对以下目录有写入权限:\n${userDataPath}`);
      }
      if (error.message.includes('ENOENT') || error.message.includes('ENOTDIR')) {
        throw new Error(`配置路径无效。\n请检查路径: ${configPath}`);
      }
      if (error.message.includes('ENOSPC')) {
        throw new Error(`磁盘空间不足，无法保存配置文件。`);
      }
    }
    throw error;
  }
}

/**
 * 异步保存配置（推荐使用）
 * 返回详细的结果对象，便于前端显示错误信息
 */
export async function saveApiConfigAsync(config: ApiConfig): Promise<{ success: boolean; error?: string }> {
  try {
    saveApiConfig(config);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

/**
 * 删除指定的 API 配置
 * @param configId 配置 ID
 */
export function deleteApiConfig(configId: string): void {
  try {
    const configPath = getConfigPath();
    if (!existsSync(configPath)) {
      return;
    }

    const raw = readFileSync(configPath, "utf8");
    const store = JSON.parse(raw) as ApiConfigsStore;

    // 过滤掉要删除的配置
    store.configs = store.configs.filter(c => c.id !== configId);

    // 如果删除的是激活配置，需要重新选择激活配置
    if (store.activeConfigId === configId) {
      if (store.configs.length > 0) {
        store.activeConfigId = store.configs[0].id;
      } else {
        delete store.activeConfigId;
      }
    }

    // 保存更新后的配置
    writeFileSync(configPath, JSON.stringify(store, null, 2), "utf8");
    log.info(`[config-store] API config deleted: ${configId}`);
  } catch (error) {
    log.error("[config-store] Failed to delete API config:", error);
    throw error;
  }
}

/**
 * 设置激活的 API 配置
 * @param configId 配置 ID
 */
export function setActiveApiConfig(configId: string): void {
  try {
    const configPath = getConfigPath();
    if (!existsSync(configPath)) {
      throw new Error("配置文件不存在");
    }

    const raw = readFileSync(configPath, "utf8");
    const store = JSON.parse(raw) as ApiConfigsStore;

    // 检查配置是否存在
    const config = store.configs.find(c => c.id === configId);
    if (!config) {
      throw new Error(`配置不存在: ${configId}`);
    }

    // 更新激活配置
    store.activeConfigId = configId;

    // 保存更新后的配置
    writeFileSync(configPath, JSON.stringify(store, null, 2), "utf8");
    log.info(`[config-store] Active API config set to: ${configId}`);

    // 清除 API 配置缓存，确保下次获取最新配置
    try {
      // 动态导入并调用缓存清除函数
      import("../services/claude-settings.js").then(module => {
        module.clearApiConfigCache?.();
        log.info("[config-store] ✓ API config cache cleared");
      }).catch((cacheError) => {
        log.warn("[config-store] Failed to clear cache:", cacheError);
      });
    } catch (cacheError) {
      log.warn("[config-store] Failed to clear cache:", cacheError);
    }

    // 更新 .env 文件（使用明文 API Key）
    try {
      saveApiConfigToEnv({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        model: config.model,
        apiType: config.apiType,
      });
      log.info("[config-store] ✓ Environment variables updated");
    } catch (envError) {
      log.warn("[config-store] ✗ Failed to update .env file:", envError);
    }
  } catch (error) {
    log.error("[config-store] Failed to set active API config:", error);
    throw error;
  }
}

/**
 * 动态获取模型参数限制
 * 通过发送测试请求到厂商 API 获取当前模型的参数限制
 *
 * @param config API 配置
 * @returns 模型参数限制，如果获取失败则返回 null
 */
export async function fetchModelLimits(config: ApiConfig): Promise<ApiConfig['modelLimits'] | null> {
  try {
    log.info('[config-store] 开始获取模型参数限制:', {
      apiType: config.apiType,
      model: config.model,
      baseURL: config.baseURL,
    });

    // 尝试发送一个最小化的测试请求
    // 使用非常小的 max_tokens 值来避免超出限制
    // 检查 baseURL 是否已经包含完整路径（包含 /anthropic 或 /v1）
    // 如果包含，则直接使用 baseURL；否则拼接 /v1/messages
    const hasFullPath = /\/(anthropic|v1)(\/|$)/.test(config.baseURL);
    const testUrl = hasFullPath ? config.baseURL : `${config.baseURL}/v1/messages`;
    const testBody = {
      model: config.model,
      max_tokens: 1,  // 使用最小值测试
      messages: [{ role: 'user', content: 'Hi' }],
    };

    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        ...config.customHeaders,
      },
      body: JSON.stringify(testBody),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // 尝试从错误消息中提取参数限制信息
      // 常见格式：Range of max_tokens should be [1, 8192]
      const maxTokensMatch = errorText.match(/Range of max_tokens should be \[(\d+),\s*(\d+)\]/i);
      if (maxTokensMatch) {
        const limits = {
          min_tokens: parseInt(maxTokensMatch[1], 10),
          max_tokens: parseInt(maxTokensMatch[2], 10),
          lastUpdated: Date.now(),
        };
        log.info('[config-store] 从错误消息中提取到模型限制:', limits);
        return limits;
      }

      // 如果错误不包含参数限制信息，记录警告
      log.warn('[config-store] 无法从错误消息中提取参数限制:', {
        status: response.status,
        error: errorText.slice(0, 200),
      });
      return null;
    }

    // 请求成功，说明参数有效，但这不告诉我们上限
    // 可以尝试使用更大的值来探测上限，但这可能不是好主意
    log.info('[config-store] 测试请求成功，但无法确定参数上限');
    return null;

  } catch (error) {
    log.error('[config-store] 获取模型参数限制失败:', error);
    return null;
  }
}

/**
 * 更新配置中的模型限制
 * 自动获取并保存模型参数限制
 */
export async function updateModelLimits(config: ApiConfig): Promise<ApiConfig> {
  const limits = await fetchModelLimits(config);

  if (limits) {
    const updatedConfig = {
      ...config,
      modelLimits: limits,
    };

    // 保存更新后的配置
    saveApiConfig(updatedConfig);
    log.info('[config-store] 模型限制已更新并保存:', limits);
    return updatedConfig;
  }

  return config;
}

/**
 * 动态获取厂商的模型列表
 * 尝试从厂商 API 获取可用模型列表
 *
 * @param config API 配置
 * @returns 模型列表，如果获取失败则返回 null
 */
export async function fetchModelList(config: ApiConfig): Promise<string[] | null> {
  try {
    log.info('[config-store] 开始获取模型列表:', {
      apiType: config.apiType,
      baseURL: config.baseURL,
    });

    // 检查 baseURL 是否已经包含完整路径
    // 包含 /anthropic 的厂商通常不提供 /v1/models 端点
    const hasFullPath = /\/(anthropic|v1)(\/|$)/.test(config.baseURL);

    if (hasFullPath) {
      log.info('[config-store] Base URL 已包含完整路径，使用预定义模型列表');
      const providerDefaults = getProviderDefaults(config.apiType || 'custom');
      return providerDefaults.models;
    }

    // 1. 首先尝试从 /v1/models 端点获取（OpenAI 兼容格式）
    const modelsUrl = `${config.baseURL}/v1/models`;

    try {
      const response = await fetch(modelsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          ...config.customHeaders,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // OpenAI 格式响应: { object: "list", data: [{ id: "model-name", ... }] }
        if (data.data && Array.isArray(data.data)) {
          const models = data.data
            .map((m: any) => m.id)
            .filter((id: string) => id && typeof id === 'string');

          log.info(`[config-store] 从 /v1/models 获取到 ${models.length} 个模型:`, models.slice(0, 10));
          return models;
        }
      }
    } catch (e) {
      log.debug('[config-store] /v1/models 端点不可用，尝试其他方式');
    }

    // 2. 如果 /v1/models 不可用，使用预定义的模型列表
    const providerDefaults = getProviderDefaults(config.apiType || 'custom');
    if (providerDefaults.models && providerDefaults.models.length > 0) {
      log.info(`[config-store] 使用预定义模型列表:`, providerDefaults.models);
      return providerDefaults.models;
    }

    log.warn('[config-store] 无法获取模型列表');
    return null;

  } catch (error) {
    log.error('[config-store] 获取模型列表失败:', error);

    // 失败时返回预定义列表作为回退
    const providerDefaults = getProviderDefaults(config.apiType || 'custom');
    if (providerDefaults.models && providerDefaults.models.length > 0) {
      return providerDefaults.models;
    }

    return null;
  }
}

/**
 * 获取所有支持的厂商列表
 */
export function getSupportedProviders(): Array<{
  id: ApiProvider;
  name: string;
  description: string;
  icon?: string;
}> {
  return [
    {
      id: 'anthropic',
      name: 'Anthropic (Claude)',
      description: '官方 Anthropic API，支持 Claude 系列模型',
      icon: '🤖',
    },
    {
      id: 'zhipu',
      name: '智谱 AI (GLM)',
      description: '智谱 AI - 提供 Anthropic 兼容端点',
      icon: '🟢',
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      description: 'DeepSeek - 提供 Anthropic 兼容端点',
      icon: '🔍',
    },
    {
      id: 'alibaba',
      name: '阿里云 (通义千问)',
      description: '阿里云 - 提供 Anthropic 兼容端点',
      icon: '☁️',
    },
    {
      id: 'qiniu',
      name: '七牛云 (AI大模型)',
      description: '七牛云 - 支持 50+ 模型，兼容 Anthropic 格式',
      icon: '🐮',
    },
    {
      id: 'moonshot',
      name: '月之暗面 (Kimi)',
      description: '月之暗面 - 提供 Anthropic 兼容端点',
      icon: '🌙',
    },
    {
      id: 'n1n',
      name: 'N1N.AI',
      description: 'N1N.AI - 国内合规专线，支持 Anthropic 格式',
      icon: '🚀',
    },
    {
      id: 'minimax',
      name: 'MiniMax',
      description: 'MiniMax - 提供 Anthropic 兼容端点',
      icon: '✨',
    },
    {
      id: 'custom',
      name: '自定义 (Anthropic 格式)',
      description: '其他兼容 Anthropic API 格式的服务',
      icon: '⚙️',
    },
  ];
}

/**
 * 获取厂商的默认配置
 */
export function getProviderConfig(provider: ApiProvider): {
  baseURL: string;
  models: string[];
  defaultModel: string;
  description: string;
} {
  const defaults = getProviderDefaults(provider);

  return {
    ...defaults,
    description: getProviderDescription(provider),
  };
}

/**
 * 获取厂商描述
 */
function getProviderDescription(provider: ApiProvider): string {
  const descriptions: Partial<Record<ApiProvider, string>> = {
    anthropic: '官方 Anthropic API，支持 Claude Sonnet、Haiku、Opus 等模型',
    zhipu: '智谱 AI ChatGLM - Anthropic 兼容端点，支持 GLM-4、GLM-3-Turbo、Flash 等',
    deepseek: 'DeepSeek - Anthropic 兼容端点，支持 DeepSeek Chat、DeepSeek Coder',
    alibaba: '阿里云百炼 - Anthropic 兼容端点，支持 Qwen Turbo、Plus、Max 等模型',
    qiniu: '七牛云 AI 大模型，支持 50+ 主流模型，兼容 Anthropic 格式',
    moonshot: '月之暗面 Kimi - Anthropic 兼容端点，支持 128K、32K、8K 等长文本模型',
    n1n: 'N1N.AI 国内合规专线，支持 Anthropic 格式',
    minimax: 'MiniMax - Anthropic 兼容端点，支持 MiniMax-M2.1 等模型',
    custom: '自定义 API，需兼容 Anthropic 格式',
  };

  return descriptions[provider] || '自定义 API';
}

/**
 * 配置兼容性验证结果
 */
export interface CompatibilityValidationResult {
  /** 是否兼容（不推荐不代表不兼容） */
  compatible: boolean;
  /** 是否推荐使用 */
  recommended: boolean;
  /** 警告信息（不推荐时显示） */
  warning?: string;
  /** 兼容性详情 */
  details: {
    format: 'anthropic' | 'openai';
    note?: string;
  };
}

/**
 * 验证 API 配置的兼容性
 * 检查厂商是否与 Anthropic SDK 原生兼容
 *
 * @param config API 配置
 * @returns 兼容性验证结果
 *
 * @author Alan
 * @created 2025-01-24
 */
export function validateApiCompatibility(config: ApiConfig): CompatibilityValidationResult {
  const provider = config.apiType || 'anthropic';
  const compatibility = PROVIDER_COMPATIBILITY[provider];

  if (!compatibility) {
    // 未知厂商，保守处理
    return {
      compatible: true,
      recommended: false,
      warning: `未知厂商: ${provider}，可能无法正常工作`,
      details: { format: 'openai' },
    };
  }

  if (!compatibility.recommended) {
    // 不推荐的厂商（OpenAI 格式）
    return {
      compatible: true, // 配置本身有效，只是不推荐
      recommended: false,
      warning: `厂商 "${provider}" 不被 Anthropic SDK 原生支持。${compatibility.note || '可能无法正常工作。建议使用支持 Anthropic 格式的厂商（智谱 AI、DeepSeek 等）。'}`,
      details: {
        format: compatibility.format,
        note: compatibility.note,
      },
    };
  }

  // 推荐的厂商（Anthropic 格式）
  return {
    compatible: true,
    recommended: true,
    details: {
      format: compatibility.format,
      note: compatibility.note,
    },
  };
}

/**
 * 获取推荐的厂商列表
 * 用于 UI 优先显示推荐厂商
 *
 * @returns 推荐的厂商列表
 */
export function getRecommendedProviders(): ApiProvider[] {
  return Object.entries(PROVIDER_COMPATIBILITY)
    .filter(([, info]) => info.recommended)
    .map(([provider]) => provider as ApiProvider);
}

/**
 * 获取不推荐的厂商列表
 * 用于 UI 标记或提示
 *
 * @returns 不推荐的厂商列表
 */
export function getNotRecommendedProviders(): ApiProvider[] {
  return Object.entries(PROVIDER_COMPATIBILITY)
    .filter(([, info]) => !info.recommended)
    .map(([provider]) => provider as ApiProvider);
}

