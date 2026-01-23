/**
 * API 连接测试器
 */

import { log } from "./logger.js";
import { detectApiFormat } from "./libs/api-adapter.js";

export interface ApiConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  apiType?: string;
  resourceName?: string;
  deploymentName?: string;
}

export interface TestResult {
  success: boolean;
  message: string;
  details?: string;
  responseTime?: number;
}

/**
 * 智能检测 Base URL 是否已包含完整路径
 * 所有支持的厂商都使用 Anthropic 格式
 */
function buildApiEndpoint(config: ApiConfig): string {
  const baseUrl = config.baseURL.replace(/\/+$/, ''); // 移除尾部斜杠

  // 使用正则检查 URL 是否以特定路径结尾（完整端点）
  const endsWithPath = (pattern: string) => new RegExp(`${pattern}/?$`).test(baseUrl);

  // 如果 URL 包含完整的 API 端点路径（如 /messages），直接使用
  if (endsWithPath('/messages')) {
    log.info('URL ends with complete API endpoint, using as-is', { baseURL: baseUrl });
    return baseUrl;
  }

  // 如果已有 /v1，只添加 /messages
  if (endsWithPath('/v1')) return `${baseUrl}/messages`;

  // 默认添加 /v1/messages（Anthropic 格式）
  return `${baseUrl}/v1/messages`;
}

/**
 * 构造 API 请求体
 * 所有支持的厂商都使用 Anthropic 格式
 */
function buildApiRequestBody(config: ApiConfig): any {
  // 所有支持的厂商（anthropic、zhipu、deepseek、alibaba、custom）都使用 Anthropic 格式
  return {
    model: config.model,
    max_tokens: 10,
    messages: [{ role: 'user', content: 'Hi' }]
  };
}

/**
 * 构造 API 请求头
 * 所有支持的厂商都使用 Anthropic 格式
 */
function buildApiHeaders(config: ApiConfig): Record<string, string> {
  // 所有支持的厂商（anthropic、zhipu、deepseek、alibaba、custom）都使用 Anthropic 格式请求头
  return {
    'Content-Type': 'application/json',
    'x-api-key': config.apiKey,
    'anthropic-version': '2023-06-01'
  };
}

export async function testApiConnection(config: ApiConfig): Promise<TestResult> {
  const startTime = Date.now();
  const apiEndpoint = buildApiEndpoint(config);

  log.info('Testing API connection', {
    baseURL: config.baseURL,
    apiType: config.apiType,
    model: config.model,
    apiEndpoint
  });

  try {
    // 验证配置
    if (!config.apiKey || !config.baseURL || !config.model) {
      return {
        success: false,
        message: "配置不完整",
        details: "请确保 API Key、Base URL 和 Model 都已填写"
      };
    }

    // 构造请求
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: buildApiHeaders(config),
      body: JSON.stringify(buildApiRequestBody(config))
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();

      // 检查 API 返回的错误
      if (data.error) {
        const errorMsg = typeof data.error === 'string' ? data.error : data.error.message || JSON.stringify(data.error);
        return {
          success: false,
          message: "API 返回错误",
          details: errorMsg,
          responseTime
        };
      }

      return {
        success: true,
        message: "连接成功",
        details: "API 配置正确，可以正常使用",
        responseTime
      };
    } else {
      // 处理特定的 HTTP 状态码
      let message = "连接失败";
      let details = `HTTP ${response.status}: ${response.statusText}`;

      switch (response.status) {
        case 400:
          message = "请求参数错误";
          details = "请检查模型名称是否正确，或查看 API 文档";
          break;
        case 401:
          message = "认证失败";
          details = "API Key 不正确或已过期";
          break;
        case 403:
          message = "权限被拒绝";
          details = "API Key 没有访问此资源的权限";
          break;
        case 404:
          message = "API 端点不存在";
          details = `请检查 Base URL 格式。当前请求: ${apiEndpoint}`;
          break;
        case 429:
          message = "请求过于频繁";
          details = "已达到速率限制，请稍后重试";
          break;
        case 500:
          message = "服务器错误";
          details = "API 服务器出现问题，请稍后重试";
          break;
        case 503:
          message = "服务不可用";
          details = "API 暂时不可用，请稍后重试";
          break;
      }

      // 尝试读取错误响应体以获取更多信息
      try {
        const errorData = await response.json();
        if (errorData.error) {
          details += `\n${typeof errorData.error === 'string' ? errorData.error : errorData.error.message || JSON.stringify(errorData.error)}`;
        }
      } catch {
        // 忽略 JSON 解析错误
      }

      return { success: false, message, details, responseTime };
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    // 处理网络错误
    if (error.code === 'ENOTFOUND') {
      return {
        success: false,
        message: "无法解析服务器地址",
        details: `请检查 Base URL 是否正确。当前 Base URL: ${config.baseURL}`,
        responseTime
      };
    }

    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        message: "连接被拒绝",
        details: "服务器拒绝连接，请检查 Base URL 和端口",
        responseTime
      };
    }

    if (error.code === 'ETIMEDOUT') {
      return {
        success: false,
        message: "连接超时",
        details: "服务器响应超时，请检查网络连接",
        responseTime
      };
    }

    // 其他错误
    log.error('API test error', error);
    return {
      success: false,
      message: "测试失败",
      details: error instanceof Error ? error.message : String(error),
      responseTime
    };
  }
}
