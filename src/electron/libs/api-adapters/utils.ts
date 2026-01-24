/**
 * API 适配器工具函数
 * 提供 API 格式检测和厂商推断功能
 * @author Alan <your.email@example.com>
 * @copyright AGCPA v3.0
 * @created 2024-01-24
 */

import type { ApiProvider } from '../../config/constants.js';
import type { UrlFormatDetection, ApiFormat } from './types.js';

/**
 * 缓存大小限制
 */
const CACHE_MAX_SIZE = 200;

/**
 * URL格式检测缓存
 */
const apiFormatCache = new Map<string, UrlFormatDetection>();

/**
 * 厂商推断结果缓存
 */
const providerCache = new Map<string, ApiProvider | null>();

/**
 * 清理缓存
 */
function cleanupCache(cache: Map<string, unknown>): void {
  if (cache.size > CACHE_MAX_SIZE) {
    const keysToDelete = Array.from(cache.keys()).slice(0, Math.floor(CACHE_MAX_SIZE * 0.2));
    for (const key of keysToDelete) {
      cache.delete(key);
    }
  }
}

/**
 * 从 URL 中检测 API 格式
 * @param baseURL - 基础 URL
 * @returns URL 格式检测结果
 */
export function detectApiFormat(baseURL: string): UrlFormatDetection {
  // 检查缓存
  const cached = apiFormatCache.get(baseURL);
  if (cached) {
    return cached;
  }

  const url = new URL(baseURL);
  const pathname = url.pathname;

  // 格式检测模式
  const formatPatterns: Array<{ pattern: RegExp; format: ApiFormat }> = [
    // 显式格式路径
    { pattern: /\/anthropic\/?$/, format: 'anthropic' },
    // Anthropic 特定路径
    { pattern: /\/v1\/messages\/?$/, format: 'anthropic' },
    { pattern: /\/v1\/beta\/messages\/?$/, format: 'anthropic' },
  ];

  // 检测格式
  for (const { pattern, format } of formatPatterns) {
    if (pattern.test(pathname)) {
      const match = pathname.match(pattern);
      const detectedPath = match ? match[0] : '';
      const cleanPathname = pathname.replace(pattern, '').replace(/\/+$/, '') || '';
      const cleanBaseURL = `${url.origin}${cleanPathname}`;

      const result = {
        format,
        cleanBaseURL,
        detectedPath,
      };

      // 缓存结果
      apiFormatCache.set(baseURL, result);
      cleanupCache(apiFormatCache);

      return result;
    }
  }

  // 未检测到明确格式，返回原始 URL
  const result = {
    format: 'unknown' as const,
    cleanBaseURL: baseURL.replace(/\/+$/, ''),
    detectedPath: '',
  };

  // 缓存结果
  apiFormatCache.set(baseURL, result);
  cleanupCache(apiFormatCache);

  return result;
}

/**
 * 从 URL 路径自动推断 API 厂商
 * @param baseURL - 基础 URL
 * @returns 推断的厂商类型，如果无法推断则返回 null
 */
export function inferProviderFromUrl(baseURL: string): ApiProvider | null {
  // 检查缓存
  const cached = providerCache.get(baseURL);
  if (cached !== undefined) {
    return cached;
  }

  const url = new URL(baseURL);
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();

  // 厂商域名映射
  const domainProviders: Array<{ pattern: RegExp; provider: ApiProvider }> = [
    { pattern: /anthropic\.com/, provider: 'anthropic' },
    { pattern: /aliyuncs\.com/, provider: 'alibaba' },
    { pattern: /bigmodel\.cn/, provider: 'zhipu' },
    { pattern: /moonshot\.cn/, provider: 'moonshot' },
    { pattern: /deepseek\.(com|cn)/, provider: 'deepseek' },
    { pattern: /qnaigc\.com/, provider: 'qiniu' },
    { pattern: /n1n\.ai/, provider: 'n1n' },
    { pattern: /minimax/i, provider: 'minimax' },
  ];

  // 按域名匹配
  for (const { pattern, provider } of domainProviders) {
    if (pattern.test(hostname)) {
      // 缓存结果
      providerCache.set(baseURL, provider);
      cleanupCache(providerCache);
      return provider;
    }
  }

  // 按路径格式推断
  if (pathname.includes('/anthropic')) {
    const result: ApiProvider = 'custom';
    providerCache.set(baseURL, result);
    cleanupCache(providerCache);
    return result;
  }

  // 缓存 null 结果
  providerCache.set(baseURL, null);
  cleanupCache(providerCache);
  return null;
}

/**
 * 获取 Anthropic 格式的完整 URL
 */
export function getAnthropicFormatUrl(baseURL: string): string {
  const detection = detectApiFormat(baseURL);
  if (detection.format === 'anthropic') {
    return detection.cleanBaseURL + (detection.detectedPath || '/v1/messages');
  }
  return baseURL;
}

/**
 * 获取预设的 URL 列表
 */
export function getAllPresetUrls(): Array<{ provider: string; name: string; url: string; description: string }> {
  return [
    {
      provider: 'anthropic',
      name: 'Anthropic 官方',
      url: 'https://api.anthropic.com',
      description: 'Anthropic 官方 API 端点'
    },
    {
      provider: 'zhipu',
      name: '智谱 AI (GLM)',
      url: 'https://open.bigmodel.cn/api/anthropic',
      description: '智谱 AI 的 Anthropic 兼容端点'
    },
    {
      provider: 'deepseek',
      name: 'DeepSeek',
      url: 'https://api.deepseek.com',
      description: 'DeepSeek API 端点'
    },
    {
      provider: 'alibaba',
      name: '阿里云百炼',
      url: 'https://dashscope.aliyuncs.com',
      description: '阿里云百炼 API 端点'
    },
    {
      provider: 'moonshot',
      name: '月之暗面 (Kimi)',
      url: 'https://api.moonshot.cn/anthropic',
      description: '月之暗面 Kimi API 端点'
    },
    {
      provider: 'n1n',
      name: 'N1N.AI',
      url: 'https://api.n1n.ai',
      description: 'N1N.AI API 端点'
    },
  ];
}
