/**
 * 类型守卫和运行时类型验证
 * 提供安全的类型检查和验证函数
 */

import type { StreamMessage } from '../types.js';

/** 检查值是否为非空对象 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 检查值是否为字符串 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/** 检查值是否为数字 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/** 检查值是否为布尔值 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/** 会话状态类型守卫 */
export function isSessionStatus(value: unknown): value is 'idle' | 'running' | 'completed' | 'error' {
  return isString(value) && ['idle', 'running', 'completed', 'error'].includes(value);
}

/** 检查是否为有效的 ServerEvent */
export function isValidServerEvent(event: unknown): event is { type: string; payload?: unknown } {
  if (!isObject(event)) return false;
  if (!isString(event.type)) return false;

  const validTypes = [
    'session.list',
    'session.history',
    'session.status',
    'session.deleted',
    'stream.message',
    'stream.user_prompt',
    'permission.request',
    'runner.error',
  ];

  return validTypes.includes(event.type);
}

/** 检查是否为有效的 StreamMessage */
export function isValidStreamMessage(message: unknown): message is StreamMessage {
  if (!isObject(message)) return false;
  if (!isString(message.type)) return false;

  const validTypes = ['text', 'image', 'tool_use', 'tool_result', 'user_prompt', 'error', 'stream_event'];
  if (!validTypes.includes(message.type)) return false;

  return true;
}

/** 安全获取对象属性 */
export function getProperty<T extends object, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue: T[K]
): T[K] {
  if (obj == null) return defaultValue;
  return obj[key] ?? defaultValue;
}

/**
 * 安全解析 JSON
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 安全字符串转换
 */
export function safeString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

/**
 * 检查值是否为空（null, undefined, 空字符串, 空数组）
 */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * 验证并转换 API 配置
 */
export function validateApiConfig(config: unknown): {
  valid: boolean;
  config?: { apiKey: string; baseURL: string; model: string };
  error?: string;
} {
  if (!isObject(config)) {
    return { valid: false, error: '配置必须是对象' };
  }

  const apiKey = config.apiKey;
  const baseURL = config.baseURL;
  const model = config.model;

  if (!isString(apiKey) || apiKey.length < 20) {
    return { valid: false, error: 'API Key 必须是至少 20 个字符的字符串' };
  }

  if (!isString(baseURL) || baseURL.length === 0) {
    return { valid: false, error: 'Base URL 必须是非空字符串' };
  }

  if (!isString(model) || model.length === 0) {
    return { valid: false, error: '模型名称必须是非空字符串' };
  }

  return {
    valid: true,
    config: { apiKey, baseURL, model }
  };
}

/**
 * 安全调用函数
 */
export function safeCall<T>(
  fn: () => T,
  onError?: (error: Error) => T
): T | undefined {
  try {
    return fn();
  } catch (error) {
    if (onError) {
      return onError(error as Error);
    }
    return undefined;
  }
}

/**
 * 创建类型断言辅助函数（用于运行时检查后断言）
 */
export function assertType<T>(
  value: unknown,
  guard: (v: unknown) => v is T,
  message?: string
): T {
  if (guard(value)) {
    return value;
  }
  throw new Error(message || `Type assertion failed: value does not match expected type`);
}
