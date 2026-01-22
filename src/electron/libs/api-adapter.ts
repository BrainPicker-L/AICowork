/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @Email       None
 *
 * 多厂商 API 转换器
 * 将不同厂商的 API 格式转换为 Anthropic 兼容格式
 */

import { log } from '../logger.js';
import type { ApiProvider } from '../config/constants.js';
import { PROVIDER_MAX_TOKENS } from '../config/constants.js';

// 重新导出供其他模块使用
export { PROVIDER_MAX_TOKENS };

/**
 * API 配置接口
 * 注意：apiType 为可选字段以保持向后兼容性
 */
export interface ApiConfig {
  /** API 厂商类型（可选，用于识别配置类型） */
  apiType?: ApiProvider;
  /** API 密钥 */
  apiKey: string;
  /** API 基础 URL */
  baseURL: string;
  /** 模型名称 */
  model: string;
  /** Azure 特定：资源名称 */
  resourceName?: string;
  /** Azure 特定：部署名称 */
  deploymentName?: string;
  /** 自定义请求头 */
  customHeaders?: Record<string, string>;
  /** 高级参数：Temperature (0-2) */
  temperature?: number;
  /** 高级参数：Max Tokens */
  maxTokens?: number;
  /** 高级参数：Top P (0-1) */
  topP?: number;
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
    lastUpdated?: number;
  };
}

/**
 * API 格式类型（从 URL 路径检测）
 */
export type ApiFormat =
  | 'anthropic'      // /anthropic 或 /v1/messages
  | 'unknown';       // 未知格式，使用默认

/**
 * URL 格式检测结果
 */
export interface UrlFormatDetection {
  format: ApiFormat;
  cleanBaseURL: string;  // 移除格式后缀后的纯净 Base URL
  detectedPath: string;  // 检测到的路径段
}

/**
 * 从 URL 中检测 API 格式
 * 支持的 URL 格式：
 * - https://api.example.com/anthropic → Anthropic 格式
 * - https://api.example.com/openai → OpenAI 格式
 * - https://api.example.com/v1/messages → Anthropic 格式
 * - https://api.example.com/v1/chat/completions → OpenAI 格式
 */
export function detectApiFormat(baseURL: string): UrlFormatDetection {
  const url = new URL(baseURL);
  const pathname = url.pathname;

  // 格式检测模式 - 只检测 Anthropic 格式
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
      // 移除格式后缀，获取纯净 Base URL
      const match = pathname.match(pattern);
      const detectedPath = match ? match[0] : '';
      const cleanPathname = pathname.replace(pattern, '').replace(/\/+$/, '') || '';

      // 构造纯净的 Base URL
      const cleanBaseURL = `${url.origin}${cleanPathname}`;

      return {
        format,
        cleanBaseURL,
        detectedPath,
      };
    }
  }

  // 未检测到明确格式，返回原始 URL
  return {
    format: 'unknown',
    cleanBaseURL: baseURL.replace(/\/+$/, ''),
    detectedPath: '',
  };
}

/**
 * 从 URL 路径自动推断 API 厂商
 */
export function inferProviderFromUrl(baseURL: string): ApiProvider | null {
  const url = new URL(baseURL);
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();

  // 厂商域名映射 - 只保留 Anthropic 兼容格式的厂商
  const domainProviders: Array<{ pattern: RegExp; provider: ApiProvider }> = [
    { pattern: /anthropic\.com/, provider: 'anthropic' },
    { pattern: /aliyuncs\.com/, provider: 'alibaba' },
    { pattern: /bigmodel\.cn/, provider: 'zhipu' },
    { pattern: /moonshot\.cn/, provider: 'moonshot' },
    { pattern: /deepseek\.(com|cn)/, provider: 'deepseek' },
    { pattern: /qnaigc\.com/, provider: 'qiniu' },
    { pattern: /volcengine\.com/, provider: 'huawei' },
    { pattern: /volces\.com/, provider: 'huawei' },
    { pattern: /n1n\.ai/, provider: 'n1n' },
    { pattern: /minimax/i, provider: 'minimax' },
  ];

  // 按域名匹配
  for (const { pattern, provider } of domainProviders) {
    if (pattern.test(hostname)) {
      return provider;
    }
  }

  // 按路径格式推断
  if (pathname.includes('/anthropic')) {
    // 可能是兼容 Anthropic 格式的第三方服务
    return 'custom';
  }

  return null;
}

/**
 * Anthropic API 消息格式
 */
export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | Array<AnthropicContentBlock>;
}

export interface AnthropicContentBlock {
  type: 'text' | 'image' | 'tool_use' | 'tool_result';
  text?: string;
  source?: { type: 'base64'; media_type: string; data: string };
  id?: string;
  name?: string;
  input?: unknown;
  content?: string;
  is_error?: boolean;
}

export interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stream?: boolean;
  tools?: any[];
  tool_choice?: any;
  system?: string;
}

export interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text' | 'tool_use' | 'tool_result';
    text?: string;
    id?: string;
    name?: string;
    input?: unknown;
    content?: string;
    is_error?: boolean;
  }>;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * API 转换器接口
 */
export interface ApiAdapter {
  /** 将 Anthropic 请求转换为厂商特定格式 */
  transformRequest(request: AnthropicRequest, config: ApiConfig): {
    url: string;
    headers: Record<string, string>;
    body: unknown;
  };

  /** 将厂商响应转换为 Anthropic 格式 */
  transformResponse(response: unknown, config: ApiConfig): AnthropicResponse;

  /** 获取流式响应转换器 */
  transformStream?(chunk: string, config: ApiConfig): string | null;
}

/**
 * 厂商端点配置
 * 每个厂商可以同时支持 Anthropic 和 OpenAI 格式
 */
const VENDOR_ENDPOINTS: Partial<Record<ApiProvider, {
  /** Anthropic 兼容端点路径 */
  anthropic?: string;
  /** OpenAI 兼容端点路径 */
  openai?: string;
  /** 默认使用的端点类型 */
  default: 'anthropic' | 'openai';
}>> = {
  // 阿里云百炼 - 同时支持两种格式
  alibaba: {
    anthropic: '/apps/anthropic/v1/messages',
    openai: '/compatible-mode/v1/chat/completions',
    default: 'anthropic',  // 优先使用 Anthropic，无需格式转换
  },
  // DeepSeek - 同时支持两种格式
  deepseek: {
    anthropic: '/v1/messages',
    openai: '/v1/chat/completions',
    default: 'anthropic',
  },
  // 月之暗面
  moonshot: {
    anthropic: '/v1/messages',
    openai: '/v1/chat/completions',
    default: 'anthropic',
  },
  // 七牛云 AI - Anthropic 兼容
  qiniu: {
    anthropic: '/v1/messages',
    openai: '/v1/chat/completions',
    default: 'anthropic',
  },
  // N1N.AI - Anthropic 兼容
  n1n: {
    anthropic: '/v1/messages',
    openai: '/v1/chat/completions',
    default: 'anthropic',
  },
  // MiniMax - Anthropic 兼容
  minimax: {
    anthropic: '/v1/messages',
    openai: '/v1/chat/completions',
    default: 'anthropic',
  },
  // 其他使用 OpenAI 格式的厂商
  xingchen: { openai: '/v1/chat/completions', default: 'openai' },
  tencent: { openai: '/v1/chat/completions', default: 'openai' },
  iflytek: { openai: '/v1/chat/completions', default: 'openai' },
  spark: { openai: '/v1/chat/completions', default: 'openai' },
  sensetime: { openai: '/v1/chat/completions', default: 'openai' },
  stepfun: { openai: '/v1/chat/completions', default: 'openai' },
  lingyi: { openai: '/v1/chat/completions', default: 'openai' },
  '01ai': { openai: '/v1/chat/completions', default: 'openai' },
  abd: { openai: '/v1/chat/completions', default: 'openai' },
  bestex: { openai: '/v1/chat/completions', default: 'openai' },
  puyu: { openai: '/v1/chat/completions', default: 'openai' },
  volcengine: { openai: '/v1/chat/completions', default: 'openai' },
  doubao: { openai: '/v1/chat/completions', default: 'openai' },
  hunyuan: { openai: '/v1/chat/completions', default: 'openai' },
  wenxin: { openai: '/v1/chat/completions', default: 'openai' },
  // 国外厂商
  google: { openai: '/v1/chat/completions', default: 'openai' },
  cohere: { openai: '/v1/chat/completions', default: 'openai' },
  mistral: { openai: '/v1/chat/completions', default: 'openai' },
  meta: { openai: '/v1/chat/completions', default: 'openai' },
  replicate: { openai: '/v1/chat/completions', default: 'openai' },
  together: { openai: '/v1/chat/completions', default: 'openai' },
  anyscale: { openai: '/v1/chat/completions', default: 'openai' },
  fireworks: { openai: '/v1/chat/completions', default: 'openai' },
  baseten: { openai: '/v1/chat/completions', default: 'openai' },
  octoai: { openai: '/v1/chat/completions', default: 'openai' },
  lamini: { openai: '/v1/chat/completions', default: 'openai' },
  forefront: { openai: '/v1/chat/completions', default: 'openai' },
  perplexity: { openai: '/v1/chat/completions', default: 'openai' },
  you: { openai: '/v1/chat/completions', default: 'openai' },
  phind: { openai: '/v1/chat/completions', default: 'openai' },
  poe: { openai: '/v1/chat/completions', default: 'openai' },
  character: { openai: '/v1/chat/completions', default: 'openai' },
  // 本地部署
  ollama: { openai: '/v1/chat/completions', default: 'openai' },
  vllm: { openai: '/v1/chat/completions', default: 'openai' },
  textgen: { openai: '/v1/chat/completions', default: 'openai' },
  localai: { openai: '/v1/chat/completions', default: 'openai' },
  fastchat: { openai: '/v1/chat/completions', default: 'openai' },
  lmstudio: { openai: '/v1/chat/completions', default: 'openai' },
  jan: { openai: '/v1/chat/completions', default: 'openai' },
  // 代理服务
  openrouter: { openai: '/v1/chat/completions', default: 'openai' },
  togetherai: { openai: '/v1/chat/completions', default: 'openai' },
  anywb: { openai: '/v1/chat/completions', default: 'openai' },
  aiproxy: { openai: '/v1/chat/completions', default: 'openai' },
  gptapi: { openai: '/v1/chat/completions', default: 'openai' },
  api2d: { openai: '/v1/chat/completions', default: 'openai' },
  closeai: { openai: '/v1/chat/completions', default: 'openai' },
  custom: { openai: '/v1/chat/completions', default: 'openai' },
};

/**
 * 各厂商的 OpenAI 格式端点映射（保留用于向后兼容）
 * @deprecated 使用 VENDOR_ENDPOINTS 代替
 */
const OPENAI_ENDPOINTS: Record<string, string> = {
  // 从 VENDOR_ENDPOINTS 动态生成
  ...Object.fromEntries(
    Object.entries(VENDOR_ENDPOINTS)
      .filter(([, v]) => v.openai)
      .map(([k, v]) => [k, v.openai!])
  ),
};

/**
 * OpenAI API 适配器
 */
export class OpenAIAdapter implements ApiAdapter {
  private apiType: ApiProvider = 'openai';

  constructor(apiType?: ApiProvider) {
    if (apiType) {
      this.apiType = apiType;
    }
  }

  transformRequest(request: AnthropicRequest, config: ApiConfig) {
    // 将 Anthropic 消息转换为 OpenAI 格式
    const messages = request.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: typeof msg.content === 'string'
        ? msg.content
        : this.convertContentBlocks(msg.content as Array<AnthropicContentBlock>)
    }));

    // OpenAI API 格式
    const body = {
      model: config.model,
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 4096,
      stream: request.stream ?? false,
      tools: request.tools ? this.convertTools(request.tools) : undefined,
    };

    // 移除 undefined 值
    (Object.keys(body) as Array<keyof typeof body>).forEach(key => {
      if (body[key] === undefined) {
        delete body[key];
      }
    });

    // 获取该厂商的端点路径
    const endpoint = OPENAI_ENDPOINTS[this.apiType] || '/v1/chat/completions';

    return {
      url: `${config.baseURL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        ...config.customHeaders,
      },
      body,
    };
  }

  transformResponse(response: unknown, config: ApiConfig): AnthropicResponse {
    const openaiResp = response as {
      id: string;
      choices: Array<{
        message: {
          role: string;
          content: string;
          tool_calls?: Array<{
            id: string;
            type: string;
            function: { name: string; arguments: string };
          }>;
        };
        finish_reason: string;
      }>;
      usage: { prompt_tokens: number; completion_tokens: number };
    };

    const choice = openaiResp.choices[0];
    const content: any[] = [];

    // 文本内容
    if (choice.message.content) {
      content.push({ type: 'text', text: choice.message.content });
    }

    // 工具调用
    if (choice.message.tool_calls) {
      for (const toolCall of choice.message.tool_calls) {
        content.push({
          type: 'tool_use',
          id: toolCall.id,
          name: toolCall.function.name,
          input: JSON.parse(toolCall.function.arguments),
        });
      }
    }

    return {
      id: openaiResp.id,
      type: 'message',
      role: 'assistant',
      content,
      stop_reason: this.mapStopReason(choice.finish_reason),
      usage: {
        input_tokens: openaiResp.usage.prompt_tokens,
        output_tokens: openaiResp.usage.completion_tokens,
      },
    };
  }

  transformStream(chunk: string, config: ApiConfig): string | null {
    // OpenAI 流式响应格式转换
    try {
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      let result = '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          const parsed = JSON.parse(data);
          if (parsed.choices && parsed.choices[0]?.delta?.content) {
            // 转换为 Anthropic SSE 格式
            const anthropicDelta = {
              type: 'content_block_delta',
              index: 0,
              delta: { type: 'text', text: parsed.choices[0].delta.content }
            };
            result += `data: ${JSON.stringify(anthropicDelta)}\n\n`;
          }
        }
      }

      return result || null;
    } catch {
      return null;
    }
  }

  private convertContentBlocks(blocks: Array<AnthropicContentBlock>): string {
    return blocks
      .filter(b => b.type === 'text')
      .map(b => b.text || '')
      .join('\n');
  }

  private convertTools(tools: any[]): any[] {
    // OpenAI 工具格式转换
    return tools?.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema,
      },
    }));
  }

  private mapStopReason(reason: string): 'end_turn' | 'max_tokens' | 'stop_sequence' | null {
    const mapping: Record<string, 'end_turn' | 'max_tokens' | 'stop_sequence' | null> = {
      'stop': 'end_turn',
      'length': 'max_tokens',
      'content_filter': 'end_turn',
    };
    return mapping[reason] ?? 'end_turn';
  }
}

/**
 * 阿里云通义千问适配器
 */
export class AlibabaAdapter implements ApiAdapter {
  transformRequest(request: AnthropicRequest, config: ApiConfig) {
    const messages = request.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: typeof msg.content === 'string' ? msg.content : this.convertContent(msg.content),
    }));

    const body = {
      model: config.model,
      input: {
        messages,
      },
      parameters: {
        max_tokens: request.max_tokens ?? 4096,
        temperature: request.temperature ?? 0.7,
        result_format: 'message',
      },
    };

    return {
      url: `${config.baseURL}/services/aigc/text-generation/generation`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        ...config.customHeaders,
      },
      body,
    };
  }

  transformResponse(response: unknown, config: ApiConfig): AnthropicResponse {
    const alibabaResp = response as {
      output: {
        text: string;
        choices: Array<{ message: { content: string; tool_calls?: any[] } }>;
      };
      usage: { input_tokens: number; output_tokens: number };
    };

    const output = alibabaResp.output;
    const choice = output.choices?.[0];
    const content: any[] = [{ type: 'text', text: choice?.message?.content || output.text }];

    // 工具调用支持（如果存在）
    if (choice?.message?.tool_calls) {
      for (const toolCall of choice.message.tool_calls) {
        content.push({
          type: 'tool_use',
          id: toolCall.id,
          name: toolCall.function.name,
          input: JSON.parse(toolCall.function.arguments),
        });
      }
    }

    return {
      id: `alibaba-${Date.now()}`,
      type: 'message',
      role: 'assistant',
      content,
      stop_reason: 'end_turn',
      usage: alibabaResp.usage,
    };
  }

  transformStream(chunk: string, config: ApiConfig): string | null {
    // 阿里云流式响应转换
    try {
      const data = JSON.parse(chunk);
      if (data.output?.text) {
        const anthropicDelta = {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text', text: data.output.text }
        };
        return `data: ${JSON.stringify(anthropicDelta)}\n\n`;
      }
      return null;
    } catch {
      return null;
    }
  }

  private convertContent(content: any): string {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n');
    }
    return '';
  }
}

/**
 * 百度文心一言适配器
 */
export class BaiduAdapter implements ApiAdapter {
  transformRequest(request: AnthropicRequest, config: ApiConfig) {
    const messages = request.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: typeof msg.content === 'string' ? msg.content : this.convertContent(msg.content),
    }));

    const body = {
      messages,
      temperature: request.temperature ?? 0.7,
      top_p: request.top_p ?? 0.8,
      penalty_score: 1.0,
      stream: request.stream ?? false,
      disable_search: false,
    };

    return {
      url: `${config.baseURL}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ completions`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        ...config.customHeaders,
      },
      body,
    };
  }

  transformResponse(response: unknown, config: ApiConfig): AnthropicResponse {
    const baiduResp = response as {
      id: string;
      choices: Array<{ message: { role: string; content: string; tool_calls?: any[] } }>;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const choice = baiduResp.choices[0];
    const content: any[] = [{ type: 'text', text: choice.message.content }];

    return {
      id: baiduResp.id,
      type: 'message',
      role: 'assistant',
      content,
      stop_reason: 'end_turn',
      usage: {
        input_tokens: baiduResp.usage.prompt_tokens,
        output_tokens: baiduResp.usage.completion_tokens,
      },
    };
  }

  transformStream(chunk: string, config: ApiConfig): string | null {
    try {
      const data = JSON.parse(chunk);
      if (data.choices?.[0]?.delta?.content) {
        const anthropicDelta = {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text', text: data.choices[0].delta.content }
        };
        return `data: ${JSON.stringify(anthropicDelta)}\n\n`;
      }
      return null;
    } catch {
      return null;
    }
  }

  private convertContent(content: any): string {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n');
    }
    return '';
  }
}

/**
 * 智谱 ChatGLM 适配器
 */
export class ZhipuAdapter implements ApiAdapter {
  transformRequest(request: AnthropicRequest, config: ApiConfig) {
    const messages = request.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: typeof msg.content === 'string' ? msg.content : this.convertContent(msg.content),
    }));

    const body = {
      model: config.model,
      messages,
      temperature: request.temperature ?? 0.7,
      top_p: request.top_p ?? 0.7,
      stream: request.stream ?? false,
    };

    return {
      url: `${config.baseURL}/paas/v4/chat/completions`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        ...config.customHeaders,
      },
      body,
    };
  }

  transformResponse(response: unknown, config: ApiConfig): AnthropicResponse {
    const zhipuResp = response as {
      id: string;
      choices: Array<{ message: { role: string; content: string; tool_calls?: any[] } }>;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const choice = zhipuResp.choices[0];
    const content: any[] = [{ type: 'text', text: choice.message.content }];

    return {
      id: zhipuResp.id,
      type: 'message',
      role: 'assistant',
      content,
      stop_reason: 'end_turn',
      usage: {
        input_tokens: zhipuResp.usage.prompt_tokens,
        output_tokens: zhipuResp.usage.completion_tokens,
      },
    };
  }

  transformStream(chunk: string, config: ApiConfig): string | null {
    try {
      const data = JSON.parse(chunk);
      if (data.choices?.[0]?.delta?.content) {
        const anthropicDelta = {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text', text: data.choices[0].delta.content }
        };
        return `data: ${JSON.stringify(anthropicDelta)}\n\n`;
      }
      return null;
    } catch {
      return null;
    }
  }

  private convertContent(content: any): string {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n');
    }
    return '';
  }
}

/**
 * 月之暗面 Kimi 适配器
 */
export class MoonshotAdapter implements ApiAdapter {
  transformRequest(request: AnthropicRequest, config: ApiConfig) {
    const messages = request.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: typeof msg.content === 'string' ? msg.content : this.convertContent(msg.content),
    }));

    const body = {
      model: config.model,
      messages,
      temperature: request.temperature ?? 0.3,
      stream: request.stream ?? false,
    };

    return {
      url: `${config.baseURL}/v1/chat/completions`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        ...config.customHeaders,
      },
      body,
    };
  }

  transformResponse(response: unknown, config: ApiConfig): AnthropicResponse {
    const moonshotResp = response as {
      id: string;
      choices: Array<{ message: { role: string; content: string } }>;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const choice = moonshotResp.choices[0];
    const content: any[] = [{ type: 'text', text: choice.message.content }];

    return {
      id: moonshotResp.id,
      type: 'message',
      role: 'assistant',
      content,
      stop_reason: 'end_turn',
      usage: {
        input_tokens: moonshotResp.usage.prompt_tokens,
        output_tokens: moonshotResp.usage.completion_tokens,
      },
    };
  }

  transformStream(chunk: string, config: ApiConfig): string | null {
    try {
      const data = JSON.parse(chunk);
      if (data.choices?.[0]?.delta?.content) {
        const anthropicDelta = {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text', text: data.choices[0].delta.content }
        };
        return `data: ${JSON.stringify(anthropicDelta)}\n\n`;
      }
      return null;
    } catch {
      return null;
    }
  }

  private convertContent(content: any): string {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n');
    }
    return '';
  }
}

/**
 * DeepSeek 适配器
 */
export class DeepSeekAdapter implements ApiAdapter {
  transformRequest(request: AnthropicRequest, config: ApiConfig) {
    const messages = request.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: typeof msg.content === 'string' ? msg.content : this.convertContent(msg.content),
    }));

    const body = {
      model: config.model,
      messages,
      temperature: request.temperature ?? 0.7,
      stream: request.stream ?? false,
    };

    return {
      url: `${config.baseURL}/v1/chat/completions`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        ...config.customHeaders,
      },
      body,
    };
  }

  transformResponse(response: unknown, config: ApiConfig): AnthropicResponse {
    const deepseekResp = response as {
      id: string;
      choices: Array<{ message: { role: string; content: string; tool_calls?: any[] } }>;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const choice = deepseekResp.choices[0];
    const content: any[] = [{ type: 'text', text: choice.message.content }];

    return {
      id: deepseekResp.id,
      type: 'message',
      role: 'assistant',
      content,
      stop_reason: 'end_turn',
      usage: {
        input_tokens: deepseekResp.usage.prompt_tokens,
        output_tokens: deepseekResp.usage.completion_tokens,
      },
    };
  }

  transformStream(chunk: string, config: ApiConfig): string | null {
    try {
      const data = JSON.parse(chunk);
      if (data.choices?.[0]?.delta?.content) {
        const anthropicDelta = {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text', text: data.choices[0].delta.content }
        };
        return `data: ${JSON.stringify(anthropicDelta)}\n\n`;
      }
      return null;
    } catch {
      return null;
    }
  }

  private convertContent(content: any): string {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n');
    }
    return '';
  }
}

/**
 * Google Gemini API 适配器
 * Gemini API 使用与 OpenAI 类似的聊天补全格式
 */
export class GeminiAdapter implements ApiAdapter {
  transformRequest(request: AnthropicRequest, config: ApiConfig) {
    // 将 Anthropic 消息转换为 Gemini 格式
    const contents = request.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{
        text: typeof msg.content === 'string'
          ? msg.content
          : this.convertContentBlocks(msg.content as Array<AnthropicContentBlock>)
      }]
    }));

    // Gemini API 格式
    const body = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.max_tokens ?? 4096,
      },
    };

    return {
      url: `${config.baseURL}/v1beta/models/${config.model}:generateContent`,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.apiKey,
        ...config.customHeaders,
      },
      body,
    };
  }

  transformResponse(response: unknown, config: ApiConfig): AnthropicResponse {
    const geminiResp = response as {
      id?: string;
      candidates: Array<{
        content: {
          parts: Array<{ text?: string; functionCall?: any }>;
          role?: string;
        };
        finishReason: string;
      }>;
      usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
      };
    };

    const candidate = geminiResp.candidates?.[0];
    const content: any[] = [];

    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.text) {
          content.push({ type: 'text', text: part.text });
        }
        if (part.functionCall) {
          content.push({
            type: 'tool_use',
            id: `tool_${Date.now()}`,
            name: part.functionCall.name,
            input: part.functionCall.args,
          });
        }
      }
    }

    return {
      id: geminiResp.id || `gemini_${Date.now()}`,
      type: 'message',
      role: 'assistant',
      content,
      stop_reason: this.mapStopReason(candidate?.finishReason || 'STOP'),
      usage: {
        input_tokens: geminiResp.usageMetadata?.promptTokenCount || 0,
        output_tokens: geminiResp.usageMetadata?.candidatesTokenCount || 0,
      },
    };
  }

  transformStream(chunk: string, config: ApiConfig): string | null {
    try {
      const data = JSON.parse(chunk);
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const anthropicDelta = {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text', text: data.candidates[0].content.parts[0].text }
        };
        return `data: ${JSON.stringify(anthropicDelta)}\n\n`;
      }
      return null;
    } catch {
      return null;
    }
  }

  private convertContentBlocks(blocks: Array<AnthropicContentBlock>): string {
    return blocks
      .filter(b => b.type === 'text')
      .map(b => b.text || '')
      .join('\n');
  }

  private mapStopReason(reason: string): 'end_turn' | 'max_tokens' | 'stop_sequence' {
    switch (reason) {
      case 'MAX_TOKENS':
        return 'max_tokens';
      case 'STOP':
      case 'RECITATION':
      case 'SAFETY':
        return 'end_turn';
      default:
        return 'end_turn';
    }
  }
}

/**
 * Anthropic 透传适配器工厂
 * 用于完全兼容 Anthropic API 格式的厂商
 * @param useOpenaiEndpoint 是否强制使用 OpenAI 兼容端点
 */
function createAnthropicAdapter(useOpenaiEndpoint: boolean = false): ApiAdapter {
  if (useOpenaiEndpoint) {
    // 使用 OpenAI 兼容端点（用于 Anthropic 端点不可用时）
    return {
      transformRequest: (request, config) => {
        // 获取厂商的 OpenAI 端点路径
        const vendorConfig = VENDOR_ENDPOINTS[config.apiType || 'custom'];
        const openaiPath = vendorConfig?.openai || '/compatible-mode/v1/chat/completions';

        // 清理 baseURL：移除 Anthropic 格式路径，只保留域名
        let cleanBaseUrl = config.baseURL;
        try {
          const url = new URL(config.baseURL);
          // 如果 baseURL 包含 /apps/anthropic 等路径，移除它们
          // 只保留协议 + 域名 + 端口
          cleanBaseUrl = url.origin;
        } catch {
          // URL 解析失败，使用原始值
        }

        // 将 Anthropic 消息转换为 OpenAI 格式
        const messages = request.messages.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: typeof msg.content === 'string'
            ? msg.content
            : (msg.content as Array<any>)
                .filter(b => b.type === 'text')
                .map(b => b.text)
                .join('\n')
        }));

        // 优先使用动态获取的模型限制，否则使用硬编码的厂商默认值
        const modelLimits = config.modelLimits?.max_tokens;
        const providerDefaultMaxTokens = PROVIDER_MAX_TOKENS[config.apiType || 'custom'] || 8192;
        // 使用动态限制或默认限制
        const effectiveMaxTokens = modelLimits || providerDefaultMaxTokens;
        const requestedMaxTokens = request.max_tokens ?? effectiveMaxTokens;
        // 自动限制在有效最大值内，防止 API 错误
        const actualMaxTokens = Math.min(requestedMaxTokens, effectiveMaxTokens);

        const body = {
          model: config.model,
          messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: actualMaxTokens,
          stream: request.stream ?? false,
        };

        // 如果用户的请求值超过限制，记录警告
        if (requestedMaxTokens > effectiveMaxTokens) {
          const limitSource = modelLimits ? '动态获取' : '厂商默认';
          log.warn(`[ApiAdapter] 请求的 max_tokens (${requestedMaxTokens}) 超过 ${limitSource} 限制 (${effectiveMaxTokens})，已自动调整为 ${actualMaxTokens}`);
        }

        const finalUrl = `${cleanBaseUrl}${openaiPath}`;

        // 详细日志用于调试
        log.info('[ApiAdapter OpenAI格式] 请求详情:', {
          originalBaseURL: config.baseURL,
          cleanBaseUrl,
          openaiPath,
          finalUrl,
          model: config.model,
          max_tokens: body.max_tokens,
          requestedMaxTokens,
          effectiveMaxTokens,
          limitSource: modelLimits ? '动态获取' : '厂商默认',
          modelLimits: config.modelLimits,
          apiType: config.apiType,
          apiKeyPrefix: config.apiKey.slice(0, 10) + '...',
        });

        return {
          url: finalUrl,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
            ...config.customHeaders,
          },
          body,
        };
      },
      transformResponse: (response) => {
        // OpenAI 响应转换为 Anthropic 格式
        const openaiResp = response as {
          id?: string;
          choices: Array<{
            message: { role: string; content: string };
            finish_reason: string;
          }>;
          usage: { prompt_tokens: number; completion_tokens: number };
        };

        const choice = openaiResp.choices?.[0];
        return {
          id: openaiResp.id || `openai-${Date.now()}`,
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: choice?.message?.content || '' }],
          stop_reason: choice?.finish_reason === 'length' ? 'max_tokens' : 'end_turn',
          usage: {
            input_tokens: openaiResp.usage?.prompt_tokens || 0,
            output_tokens: openaiResp.usage?.completion_tokens || 0,
          },
        } as AnthropicResponse;
      },
    };
  }

  // 标准 Anthropic 透传适配器（带 max_tokens 限制）
  return {
    transformRequest: (request, config) => {
      // 优先使用动态获取的模型限制，否则使用硬编码的厂商默认值
      const modelLimits = config.modelLimits?.max_tokens;
      const providerDefaultMaxTokens = PROVIDER_MAX_TOKENS[config.apiType || 'custom'] || 8192;
      // 使用动态限制或默认限制
      const effectiveMaxTokens = modelLimits || providerDefaultMaxTokens;
      const requestedMaxTokens = request.max_tokens ?? effectiveMaxTokens;
      const actualMaxTokens = Math.min(requestedMaxTokens, effectiveMaxTokens);

      // 如果用户的请求值超过限制，记录警告
      if (requestedMaxTokens > effectiveMaxTokens) {
        const limitSource = modelLimits ? '动态获取' : '厂商默认';
        log.warn(`[ApiAdapter] 请求的 max_tokens (${requestedMaxTokens}) 超过 ${limitSource} 限制 (${effectiveMaxTokens})，已自动调整为 ${actualMaxTokens}`);
      }

      // 创建新的请求对象，应用 max_tokens 限制
      const limitedRequest = {
        ...request,
        max_tokens: actualMaxTokens,
      };

      // 详细日志用于调试
      log.info('[ApiAdapter Anthropic透传] 请求详情:', {
        url: `${config.baseURL}/v1/messages`,
        model: config.model,
        max_tokens: limitedRequest.max_tokens,
        requestedMaxTokens,
        effectiveMaxTokens,
        limitSource: modelLimits ? '动态获取' : '厂商默认',
        modelLimits: config.modelLimits,
        apiType: config.apiType,
        forceOpenaiFormat: config.forceOpenaiFormat,
      });

      return {
        url: `${config.baseURL}/v1/messages`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          ...config.customHeaders,
        },
        body: limitedRequest,
      };
    },
    transformResponse: (response) => response as AnthropicResponse,
  };
}

/**
 * 获取 API 适配器
 *
 * 策略：
 * - Anthropic 兼容厂商 → 使用透传适配器
 * - 大部分厂商 → 使用 OpenAI 适配器（格式转换）
 * - forceOpenaiFormat=true → 强制使用 OpenAI 兼容端点（用于端点不可用时）
 */
export function getApiAdapter(provider: ApiProvider, config?: ApiConfig): ApiAdapter {
  // 检查是否强制使用 OpenAI 格式
  const forceOpenai = config?.forceOpenaiFormat === true;

  if (forceOpenai) {
    log.info(`[ApiAdapter] ${provider} 强制使用 OpenAI 兼容端点`);
    return createAnthropicAdapter(true);
  }

  // 完全兼容 Anthropic 格式的厂商（支持直连）
  const anthropicCompatibleProviders: ApiProvider[] = [
    'anthropic',
    'zhipu',
    'deepseek',  // DeepSeek 支持 Anthropic 格式
    'alibaba',   // 阿里云支持 Anthropic 格式
    'qiniu',
    'moonshot',  // Moonshot 支持 Anthropic 格式
    'n1n',
    'minimax',    // MiniMax 支持 Anthropic 格式
  ];

  // 如果是 Anthropic 兼容厂商，使用透传适配器
  if (anthropicCompatibleProviders.includes(provider)) {
    log.debug(`[ApiAdapter] ${provider} 使用 Anthropic 透传适配器`);
    return createAnthropicAdapter(false);
  }

  // 其他厂商使用 OpenAI 适配器（格式转换）
  log.debug(`[ApiAdapter] ${provider} 使用 OpenAI 格式适配器`);
  return new OpenAIAdapter(provider);
}

/**
 * 获取厂商默认配置
 */
export function getProviderDefaults(provider: ApiProvider): {
  baseURL: string;
  models: string[];
  defaultModel: string;
} {
  const defaults: Partial<Record<ApiProvider, { baseURL: string; models: string[]; defaultModel: string }>> = {
    anthropic: {
      baseURL: 'https://api.anthropic.com',
      models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
      defaultModel: 'claude-sonnet-4-20250514',
    },
    // 使用 Anthropic 兼容端点
    zhipu: {
      baseURL: 'https://open.bigmodel.cn/api/anthropic',
      models: ['glm-4', 'glm-4-flash', 'glm-3-turbo'],
      defaultModel: 'glm-4',
    },
    deepseek: {
      baseURL: 'https://api.deepseek.com/anthropic',
      models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
      defaultModel: 'deepseek-chat',
    },
    alibaba: {
      baseURL: 'https://dashscope.aliyuncs.com/apps/anthropic',
      models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-max-longcontext'],
      defaultModel: 'qwen-plus',
    },
    qiniu: {
      baseURL: 'https://api.qnaigc.com',
      models: ['qwen-plus', 'deepseek-chat', 'glm-4', 'claude-3-5-sonnet-20241022'],
      defaultModel: 'qwen-plus',
    },
    moonshot: {
      baseURL: 'https://api.moonshot.cn',
      models: ['moonshot-v1-128k', 'moonshot-v1-32k', 'moonshot-v1-8k'],
      defaultModel: 'moonshot-v1-128k',
    },
    huawei: {
      baseURL: 'https://maas-model.cn-north-4.myhuaweicloud.com',
      models: ['glm-4', 'qwen-plus', 'deepseek-chat'],
      defaultModel: 'glm-4',
    },
    ollama: {
      baseURL: 'http://localhost:11434',
      models: ['llama3', 'qwen2', 'deepseek-r1'],
      defaultModel: 'llama3',
    },
    n1n: {
      baseURL: 'https://api.n1n.ai',
      models: ['claude-sonnet-4-20250514', 'gpt-4o', 'glm-4'],
      defaultModel: 'claude-sonnet-4-20250514',
    },
    minimax: {
      baseURL: 'https://api.minimaxi.com',
      models: ['MiniMax-M2.1', 'MiniMax-M2.1-lightning', 'MiniMax-M2'],
      defaultModel: 'MiniMax-M2.1',
    },
    openai: {
      baseURL: 'https://api.openai.com',
      models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      defaultModel: 'gpt-4o',
    },
    google: {
      baseURL: 'https://generativelanguage.googleapis.com',
      models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'],
      defaultModel: 'gemini-2.0-flash-exp',
    },
    custom: {
      baseURL: 'https://api.example.com',
      models: ['custom-model'],
      defaultModel: 'custom-model',
    },
  };

  return defaults[provider] || defaults.custom;
}

/**
 * 获取支持的 /anthropic 格式 URL 列表
 * 这些厂商提供了兼容 Anthropic API 格式的端点
 */
export function getAnthropicFormatUrls(): Record<string, string> {
  return {
    // Anthropic 官方
    anthropic: 'https://api.anthropic.com',
    // 智谱 AI - 提供了 Anthropic 兼容端点
    zhipu: 'https://open.bigmodel.cn/api/anthropic',
    // DeepSeek - 提供了 Anthropic 兼容端点
    deepseek: 'https://api.deepseek.com/anthropic',
    // 阿里云百炼 - Anthropic 兼容端点
    alibaba: 'https://dashscope.aliyuncs.com/apps/anthropic',
    // 七牛云 AI - 支持 Anthropic 格式
    qiniu: 'https://api.qnaigc.com',
    // 月之暗面 Kimi - Anthropic 兼容
    moonshot: 'https://api.moonshot.cn',
    // N1N.AI - Anthropic 兼容
    n1n: 'https://api.n1n.ai',
    // MiniMax - Anthropic 兼容
    minimax: 'https://api.minimaxi.com',
  };
}

/**
 * 获取厂商的 max_tokens 限制
 * @param provider API 厂商
 * @returns 最大 token 数
 */
export function getProviderMaxTokens(provider: ApiProvider): number {
  return PROVIDER_MAX_TOKENS[provider] || 4096;
}

/**
 * 获取所有支持的预设 URL（包括多种格式）
 */
export function getAllPresetUrls(): Array<{
  provider: ApiProvider;
  name: string;
  url: string;
  description: string;
}> {
  return [
    // Anthropic 官方
    {
      provider: 'anthropic',
      name: 'Anthropic (Official)',
      url: 'https://api.anthropic.com',
      description: 'Anthropic 官方 API',
    },
    // 智谱 AI - Anthropic 兼容格式
    {
      provider: 'zhipu',
      name: '智谱 AI (GLM)',
      url: 'https://open.bigmodel.cn/api/anthropic',
      description: '智谱 AI Anthropic 兼容格式',
    },
    // DeepSeek - Anthropic 兼容格式
    {
      provider: 'deepseek',
      name: 'DeepSeek',
      url: 'https://api.deepseek.com/anthropic',
      description: 'DeepSeek Anthropic 兼容格式',
    },
    // 阿里云百炼 - Anthropic 兼容格式
    {
      provider: 'alibaba',
      name: '阿里云百炼 (通义千问)',
      url: 'https://dashscope.aliyuncs.com/apps/anthropic',
      description: '阿里云百炼 Anthropic 兼容格式',
    },
    // 月之暗面 Kimi - Anthropic 兼容
    {
      provider: 'moonshot',
      name: '月之暗面 Kimi',
      url: 'https://api.moonshot.cn',
      description: '月之暗面 Anthropic 兼容格式',
    },
    // 七牛云 AI - Anthropic 兼容
    {
      provider: 'qiniu',
      name: '七牛云 AI 大模型',
      url: 'https://api.qnaigc.com',
      description: '七牛云 - 支持 50+ 模型，兼容 Anthropic 格式',
    },
    // 华为云 ModelArts - Anthropic 兼容
    {
      provider: 'huawei',
      name: '华为云 ModelArts',
      url: 'https://maas-model.cn-north-4.myhuaweicloud.com',
      description: '华为云 ModelArts - Anthropic 兼容接口',
    },
    // Ollama (本地) - Anthropic 兼容
    {
      provider: 'ollama',
      name: 'Ollama (本地部署)',
      url: 'http://localhost:11434',
      description: 'Ollama - 本地部署，支持 Anthropic API',
    },
    // N1N.AI - Anthropic 兼容
    {
      provider: 'n1n',
      name: 'N1N.AI',
      url: 'https://api.n1n.ai',
      description: 'N1N.AI - 国内合规专线，支持 Anthropic 格式',
    },
    // MiniMax - Anthropic 兼容
    {
      provider: 'minimax',
      name: 'MiniMax',
      url: 'https://api.minimaxi.com',
      description: 'MiniMax - Anthropic 兼容端点',
    },
    // Google Gemini - Anthropic 兼容
    {
      provider: 'google',
      name: 'Google Gemini',
      url: 'https://generativelanguage.googleapis.com',
      description: 'Google Gemini Anthropic 兼容格式（需在 AI Studio 配置）',
    },
  ];
}
