/**
 * API 适配器类型定义
 * 定义 API 配置、消息格式和适配器接口
 */

import type { ApiProvider } from '../../config/constants.js';

/**
 * API 配置接口
 */
export interface ApiConfig {
  /** API 厂商类型 */
  apiType?: ApiProvider;
  /** API 规范类型：openai、anthropic、gemini、vertex-ai */
  apiSpec?: 'openai' | 'anthropic' | 'gemini' | 'vertex-ai';
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
  /** 强制使用 OpenAI 格式 */
  forceOpenaiFormat?: boolean;
  /** 模型特定的参数限制 */
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
 * API 格式类型
 */
export type ApiFormat =
  | 'anthropic'
  | 'unknown';

/**
 * URL 格式检测结果
 */
export interface UrlFormatDetection {
  format: ApiFormat;
  cleanBaseURL: string;
  detectedPath: string;
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

// ===== 已删除：ApiAdapter 接口（未使用，SDK 直接处理 API 调用） =====
// 之前定义的 ApiAdapter 接口及其相关方法（transformRequest, transformResponse, transformStream）
// 已被移除，因为 Claude Agent SDK 原生处理所有 API 调用，无需适配器层。
