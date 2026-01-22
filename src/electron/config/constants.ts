/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @Email       None
 *
 * 后端常量配置
 * 统一管理文件大小、超时、轮询间隔等常量
 */

// 重新导出删除检测模式（从共享模块）
export { DELETION_PATTERNS } from "../../shared/deletion-detection.js";

// ==================== 文件大小限制 ====================

/** 日志文件最大大小（5MB） */
export const MAX_LOG_FILE_SIZE = 5242880;

/** 最大保留日志文件数量 */
export const MAX_LOG_FILES = 5;

// ==================== 轮询和超时 ====================

/** 资源轮询间隔（2秒） */
export const RESOURCE_POLL_INTERVAL = 2000;

/** 默认会话超时时间（5分钟） */
export const DEFAULT_SESSION_TIMEOUT = 300000;

/** Runner 超时时间（5分钟） */
export const RUNNER_TIMEOUT = 300000;

/** 默认工作目录限制 */
export const DEFAULT_CWD_LIMIT = 8;

// ==================== API 验证 ====================

/** API Key 最小长度 */
export const API_KEY_MIN_LENGTH = 20;

/** API Key 最大长度 */
export const API_KEY_MAX_LENGTH = 200;

/** Model 名称最小长度 */
export const MODEL_NAME_MIN_LENGTH = 3;

/** Model 名称最大长度 */
export const MODEL_NAME_MAX_LENGTH = 100;

/** 基础 URL 最小长度 */
export const BASE_URL_MIN_LENGTH = 10;

/** 基础 URL 最大长度 */
export const BASE_URL_MAX_LENGTH = 500;

// ==================== 日志级别 ====================

/** 日志级别枚举 */
export const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
} as const;

/** 日志级别类型 */
export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

// ==================== 会话状态 ====================

/** 会话状态枚举 */
export const SESSION_STATUS = {
  IDLE: "idle",
  RUNNING: "running",
  COMPLETED: "completed",
  ERROR: "error",
} as const;

/** 会话状态类型 */
export type SessionStatus = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];

// ==================== API 厂商映射 ====================

/**
 * API 厂商类型定义
 * 包含所有主流第三方 AI 服务商
 */
export type ApiProvider =
  // 官方 API
  | 'anthropic'        // Anthropic (Claude) - 官方
  // 国内厂商 - Anthropic 兼容格式
  | 'zhipu'            // 智谱 AI (GLM)
  | 'deepseek'         // DeepSeek
  | 'alibaba'          // 阿里云 (通义千问)
  | 'qiniu'            // 七牛云 AI
  | 'moonshot'         // 月之暗面 (Kimi)
  | 'huawei'           // 华为云 (ModelArts)
  | 'minimax'          // MiniMax
  | 'baichuan'         // 百川智能
  | 'xingchen'         // 百度文心一言
  | 'tencent'          // 腾讯混元
  | 'iflytek'          // 科大讯飞
  | 'spark'            // 讯飞星火
  | 'sensetime'        // 商汤日日新
  | 'stepfun'          // 阶跃星辰
  | 'lingyi'           // 零一万物
  | '01ai'             // 零一万物 (01.AI)
  | 'abd'              // 澳东区弟 (ABD)
  | 'bestex'           // BestEx
  | 'puyu'             // 书生浦语
  | 'volcengine'       // 字节跳动豆包 (火山引擎)
  | 'doubao'           // 字节跳动豆包
  | 'hunyuan'          // 腾讯混元
  | 'wenxin'           // 百度文心
  // 国外厂商 - Anthropic 兼容格式
  | 'openai'           // OpenAI (通过兼容层)
  | 'google'           // Google Gemini
  | 'cohere'           // Cohere
  | 'mistral'          // Mistral AI
  | 'meta'             // Meta Llama
  | 'replicate'        // Replicate
  | 'together'         // Together AI
  | 'anyscale'         // Anyscale
  | 'fireworks'        // Fireworks AI
  | 'baseten'          // Baseten
  | 'octoai'           // OctoAI
  | 'lamini'           // Lamini
  | 'forefront'        // Forefront
  | 'perplexity'       // Perplexity AI
  | 'you'              // You.com
  | 'phind'            // Phind
  | 'poe'              // Poe
  | 'character'        // Character.AI
  // 本地/私有部署
  | 'ollama'           // Ollama (本地)
  | 'vllm'             // vLLM (本地)
  | 'textgen'          // Text Generation WebUI
  | 'localai'          // LocalAI
  | 'fastchat'         // FastChat
  | 'lmstudio'         // LM Studio
  | 'jan'              // Jan AI
  // 代理/中转服务
  | 'n1n'              // N1N.AI
  | 'openrouter'       // OpenRouter
  | 'togetherai'       // Together AI (备用)
  | 'anywb'            // AnyWave
  | 'aiproxy'          // AI Proxy
  | 'gptapi'           // GPT API
  | 'api2d'            // API2D
  | 'closeai'          // CloseAI
  // 自定义
  | 'custom';          // 自定义兼容 API

/**
 * 厂商 API 路径前缀映射
 * 定义每个厂商的 /messages 端点路径
 */
export const API_PATH_PREFIXES: Record<ApiProvider, string> = {
  // Anthropic 官方格式
  anthropic: '/v1/messages',

  // 国内厂商 - 使用 Anthropic 兼容格式
  zhipu: '/v1/messages',
  deepseek: '/v1/messages',
  // 阿里云兼容模式路径
  alibaba: '/compatible-mode/v1/messages',
  qiniu: '/v1/messages',
  moonshot: '/v1/messages',
  huawei: '/v1/messages',
  minimax: '/v1/messages',
  baichuan: '/v1/messages',
  xingchen: '/v1/messages',
  tencent: '/v1/messages',
  iflytek: '/v1/messages',
  spark: '/v1/messages',
  sensetime: '/v1/messages',
  stepfun: '/v1/messages',
  lingyi: '/v1/messages',
  '01ai': '/v1/messages',
  abd: '/v1/messages',
  bestex: '/v1/messages',
  puyu: '/v1/messages',
  volcengine: '/v1/messages',
  doubao: '/v1/messages',
  hunyuan: '/v1/messages',
  wenxin: '/v1/messages',

  // 国外厂商
  openai: '/v1/messages',
  google: '/v1/messages',
  cohere: '/v1/messages',
  mistral: '/v1/messages',
  meta: '/v1/messages',
  replicate: '/v1/messages',
  together: '/v1/messages',
  anyscale: '/v1/messages',
  fireworks: '/v1/messages',
  baseten: '/v1/messages',
  octoai: '/v1/messages',
  lamini: '/v1/messages',
  forefront: '/v1/messages',
  perplexity: '/v1/messages',
  you: '/v1/messages',
  phind: '/v1/messages',
  poe: '/v1/messages',
  character: '/v1/messages',

  // 本地/私有部署
  ollama: '/v1/messages',
  vllm: '/v1/messages',
  textgen: '/v1/messages',
  localai: '/v1/messages',
  fastchat: '/v1/messages',
  lmstudio: '/v1/messages',
  jan: '/v1/messages',

  // 代理/中转服务
  n1n: '/v1/messages',
  openrouter: '/v1/messages',
  togetherai: '/v1/messages',
  anywb: '/v1/messages',
  aiproxy: '/v1/messages',
  gptapi: '/v1/messages',
  api2d: '/v1/messages',
  closeai: '/v1/messages',

  // 自定义
  custom: '/v1/messages',
};

/**
 * 厂商标准 Base URL 映射
 * 用于代理模式时自动修正用户输入的 URL
 * 只包含域名和端口，不含路径后缀
 */
export const PROVIDER_BASE_URLS: Record<ApiProvider, string> = {
  // Anthropic 官方
  anthropic: 'https://api.anthropic.com',

  // 国内厂商
  zhipu: 'https://open.bigmodel.cn/api/anthropic',
  deepseek: 'https://api.deepseek.com',
  alibaba: 'https://dashscope.aliyuncs.com',
  qiniu: 'https://api.qnaigc.com',
  moonshot: 'https://api.moonshot.cn',
  huawei: 'https://maas-model.cn-north-4.myhuaweicloud.com',
  minimax: 'https://api.minimaxi.com',
  baichuan: 'https://api.baichuan-ai.com',
  xingchen: 'https://aip.baidubce.com',
  tencent: 'https://hunyuan.tencentcloudapi.com',
  iflytek: 'https://spark-api.xf-yun.com',
  spark: 'https://spark-api.xf-yun.com',
  sensetime: 'https://api.sensetime.com',
  stepfun: 'https://api.stepfun.com',
  lingyi: 'https://api.lingyiwanwu.com',
  '01ai': 'https://api.01.ai',
  abd: 'https://api.abd.ai',
  bestex: 'https://api.bestex.ai',
  puyu: 'https://puyu.intern-ai.org.cn',
  volcengine: 'https://ark.cn-beijing.volces.com',
  doubao: 'https://ark.cn-beijing.volces.com',
  hunyuan: 'https://hunyuan.tencentcloudapi.com',
  wenxin: 'https://aip.baidubce.com',

  // 国外厂商
  openai: 'https://api.openai.com',
  google: 'https://generativelanguage.googleapis.com',
  cohere: 'https://api.cohere.ai',
  mistral: 'https://api.mistral.ai',
  meta: 'https://api.meta.ai',
  replicate: 'https://api.replicate.com',
  together: 'https://api.together.xyz',
  anyscale: 'https://api.anyscale.com',
  fireworks: 'https://api.fireworks.ai',
  baseten: 'https://api.baseten.co',
  octoai: 'https://api.octoai.cn',
  lamini: 'https://api.lamini.ai',
  forefront: 'https://api.forefront.ai',
  perplexity: 'https://api.perplexity.ai',
  you: 'https://api.you.com',
  phind: 'https://api.phind.com',
  poe: 'https://api.poe.com',
  character: 'https://api.character.ai',

  // 本地/私有部署
  ollama: 'http://localhost:11434',
  vllm: 'http://localhost:8000',
  textgen: 'http://localhost:5000',
  localai: 'http://localhost:8080',
  fastchat: 'http://localhost:8000',
  lmstudio: 'http://localhost:1234',
  jan: 'http://localhost:1337',

  // 代理/中转服务
  n1n: 'https://api.n1n.ai',
  openrouter: 'https://openrouter.ai/api',
  togetherai: 'https://api.together.xyz',
  anywb: 'https://api.anywb.com',
  aiproxy: 'https://api.aiproxy.io',
  gptapi: 'https://api.gptapi.us',
  api2d: 'https://api.api2d.com',
  closeai: 'https://api.closeai-proxy.com',

  // 自定义
  custom: 'https://api.example.com',
};

/**
 * 各厂商 max_tokens 限制（输出 token 最大值）
 * 用于 UI 自动填充和参数验证
 */
export const PROVIDER_MAX_TOKENS: Record<ApiProvider, number> = {
  // Anthropic 官方
  anthropic: 8192,

  // 国内厂商
  zhipu: 8192,          // 智谱 AI
  deepseek: 8192,       // DeepSeek
  alibaba: 8192,        // 阿里云百炼
  qiniu: 4096,           // 七牛云 AI
  moonshot: 4096,        // 月之暗面
  huawei: 4096,         // 华为云
  minimax: 4096,        // MiniMax
  baichuan: 4096,       // 百川智能
  xingchen: 4096,       // 百度文心
  tencent: 4096,        // 腾讯混元
  iflytek: 4096,        // 科大讯飞
  spark: 4096,          // 讯飞星火
  sensetime: 4096,      // 商汤
  stepfun: 4096,        // 阶跃星辰
  lingyi: 4096,         // 零一万物
  '01ai': 4096,         // 零一万物
  abd: 4096,            // ABD
  bestex: 4096,        // BestEx
  puyu: 4096,           // 书生浦语
  volcengine: 4096,     // 字节豆包
  doubao: 4096,         // 字节豆包
  hunyuan: 4096,        // 腾讯混元
  wenxin: 4096,         // 百度文心

  // 国外厂商
  openai: 4096,         // OpenAI
  google: 8192,         // Gemini
  cohere: 4096,         // Cohere
  mistral: 4096,        // Mistral
  meta: 4096,           // Llama
  replicate: 4096,      // Replicate
  together: 8192,       // Together AI
  anyscale: 4096,       // Anyscale
  fireworks: 4096,      // Fireworks
  baseten: 4096,        // Baseten
  octoai: 4096,         // OctoAI
  lamini: 4096,         // Lamini
  forefront: 4096,      // Forefront
  perplexity: 4096,     // Perplexity
  you: 4096,            // You.com
  phind: 4096,          // Phind
  poe: 4096,            // Poe
  character: 4096,      // Character.AI

  // 本地/私有部署（通常无限制或很高）
  ollama: 16384,        // Ollama
  vllm: 16384,          // vLLM
  textgen: 16384,       // Text Generation WebUI
  localai: 16384,       // LocalAI
  fastchat: 16384,      // FastChat
  lmstudio: 16384,      // LM Studio
  jan: 16384,           // Jan AI

  // 代理/中转服务
  n1n: 8192,            // N1N.AI
  openrouter: 8192,     // OpenRouter
  togetherai: 8192,     // Together AI
  anywb: 8192,          // AnyWave
  aiproxy: 8192,        // AI Proxy
  gptapi: 4096,         // GPT API
  api2d: 4096,          // API2D
  closeai: 4096,        // CloseAI

  // 自定义（默认值）
  custom: 4096,
};

/**
 * 从环境变量加载自定义厂商映射
 * 支持用户通过 .env 文件扩展厂商配置
 *
 * 环境变量格式：
 * - CUSTOM_API_PATH_PREFIX_<provider>=/custom/path
 * - CUSTOM_API_BASE_URL_<provider>=https://custom.domain.com
 *
 * 示例：
 * - CUSTOM_API_PATH_PREFIX_myservice=/api/v1/chat
 * - CUSTOM_API_BASE_URL_myservice=https://my-api.example.com
 */
export function loadCustomProviderMappings(): {
  pathPrefixes: Partial<Record<ApiProvider, string>>;
  baseUrls: Partial<Record<ApiProvider, string>>;
} {
  const pathPrefixes: Partial<Record<ApiProvider, string>> = {};
  const baseUrls: Partial<Record<ApiProvider, string>> = {};

  // 扫描环境变量中的自定义配置
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('CUSTOM_API_PATH_PREFIX_')) {
      const provider = key.replace('CUSTOM_API_PATH_PREFIX_', '').toLowerCase() as ApiProvider;
      pathPrefixes[provider] = value;
    }
    if (key.startsWith('CUSTOM_API_BASE_URL_')) {
      const provider = key.replace('CUSTOM_API_BASE_URL_', '').toLowerCase() as ApiProvider;
      baseUrls[provider] = value;
    }
  }

  if (Object.keys(pathPrefixes).length > 0 || Object.keys(baseUrls).length > 0) {
    console.log('[Constants] 已加载自定义厂商映射:', { pathPrefixes, baseUrls });
  }

  return { pathPrefixes, baseUrls };
}

/**
 * 获取完整的厂商路径前缀映射（包含自定义配置）
 */
export function getApiPathPrefixes(): Record<ApiProvider, string> {
  const custom = loadCustomProviderMappings();
  return { ...API_PATH_PREFIXES, ...custom.pathPrefixes };
}

/**
 * 获取完整的厂商 Base URL 映射（包含自定义配置）
 */
export function getProviderBaseUrls(): Record<ApiProvider, string> {
  const custom = loadCustomProviderMappings();
  return { ...PROVIDER_BASE_URLS, ...custom.baseUrls };
}

/**
 * 根据域名自动推断厂商类型
 */
export function inferProviderFromDomain(hostname: string): ApiProvider | null {
  const domainMap: Record<string, ApiProvider> = {
    'anthropic.com': 'anthropic',
    'bigmodel.cn': 'zhipu',
    'deepseek.com': 'deepseek',
    'deepseek.cn': 'deepseek',
    'aliyuncs.com': 'alibaba',
    'qnaigc.com': 'qiniu',
    'moonshot.cn': 'moonshot',
    'huaweicloud.com': 'huawei',
    'minimaxi.com': 'minimax',
    'baichuan-ai.com': 'baichuan',
    'baidubce.com': 'xingchen',
    'tencentcloudapi.com': 'tencent',
    'xf-yun.com': 'iflytek',
    'sensetime.com': 'sensetime',
    'stepfun.com': 'stepfun',
    'lingyiwanwu.com': 'lingyi',
    '01.ai': '01ai',
    'abd.ai': 'abd',
    'volces.com': 'doubao',
    'openai.com': 'openai',
    'googleapis.com': 'google',
    'cohere.ai': 'cohere',
    'mistral.ai': 'mistral',
    'replicate.com': 'replicate',
    'together.xyz': 'together',
    'anyscale.com': 'anyscale',
    'fireworks.ai': 'fireworks',
    'baseten.co': 'baseten',
    'octoai.cn': 'octoai',
    'lamini.ai': 'lamini',
    'perplexity.ai': 'perplexity',
    'you.com': 'you',
    'phind.com': 'phind',
    'poe.com': 'poe',
    'n1n.ai': 'n1n',
    'openrouter.ai': 'openrouter',
    'localhost': 'ollama',
  };

  // 精确匹配
  if (domainMap[hostname]) {
    return domainMap[hostname];
  }

  // 后缀匹配
  for (const [domain, provider] of Object.entries(domainMap)) {
    if (hostname.endsWith(`.${domain}`) || hostname === domain) {
      return provider;
    }
  }

  return null;
}

/**
 * 类型守卫函数：验证字符串是否为有效的 ApiProvider
 *
 * 用途：
 * - 运行时验证用户输入的厂商名称
 * - 防止无效的厂商配置
 * - 类型断言前进行验证
 *
 * @param provider 待验证的厂商名称
 * @returns 是否为有效的 ApiProvider
 */
export function isValidApiProvider(provider: string): provider is ApiProvider {
  // 所有已知的 ApiProvider 值
  const validProviders: ReadonlySet<string> = new Set([
    // 官方 API
    'anthropic',
    // 国内厂商 - Anthropic 兼容格式
    'zhipu', 'deepseek', 'alibaba', 'qiniu', 'moonshot', 'huawei',
    'minimax', 'baichuan', 'xingchen', 'tencent', 'iflytek', 'spark',
    'sensetime', 'stepfun', 'lingyi', '01ai', 'abd', 'bestex', 'puyu',
    'volcengine', 'doubao', 'hunyuan', 'wenxin',
    // 国外厂商
    'openai', 'google', 'cohere', 'mistral', 'meta', 'replicate',
    'together', 'anyscale', 'fireworks', 'baseten', 'octoai', 'lamini',
    'forefront', 'perplexity', 'you', 'phind', 'poe', 'character',
    // 本地/私有部署
    'ollama', 'vllm', 'textgen', 'localai', 'fastchat', 'lmstudio', 'jan',
    // 代理/中转服务
    'n1n', 'openrouter', 'togetherai', 'anywb', 'aiproxy', 'gptapi', 'api2d', 'closeai',
    // 自定义
    'custom',
  ]);

  return validProviders.has(provider);
}
