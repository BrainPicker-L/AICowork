# Agent-B05: 修复类型安全问题

**任务 ID**: B-05
**优先级**: 🟡 中 - 提高代码质量

---

## 问题描述

发现多处类型安全问题：
1. 使用 `any` 类型绕过检查
2. 强制类型断言可能导致运行时错误
3. 类型定义不完整
4. 缺少运行时类型验证

---

## 执行步骤

### 步骤 1: 修复 session-store.ts 类型断言

**文件**: `src/electron/libs/session-store.ts`

**问题**: 第 95-105 行 - 不安全的类型断言

```typescript
// 当前代码
return rows.map((row) => ({
  id: String(row.id),
  title: String(row.title),
  status: row.status as SessionStatus, // 不安全的断言
  // ...
}));

// 修复后 - 添加运行时验证
function isValidSessionStatus(status: string): status is SessionStatus {
  return ['idle', 'running', 'completed', 'error'].includes(status);
}

return rows
  .filter((row) => {
    // 验证状态值有效
    if (!isValidSessionStatus(String(row.status))) {
      log.warn(`[SessionStore] Invalid session status: ${row.status}`);
      return false;
    }
    return true;
  })
  .map((row) => ({
    id: String(row.id),
    title: String(row.title),
    status: String(row.status) as SessionStatus, // 现在是安全的
    cwd: String(row.cwd || ''),
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
    hydrated: Boolean(row.hydrated),
  }));
```

### 步骤 2: 创建类型验证工具

**新建文件**: `src/electron/utils/type-guards.ts`

```typescript
/**
 * 类型守卫和运行时类型验证
 */

import type { StreamMessage, ServerEvent } from '../types.js';

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

/** 会话状态类型守卫 */
export function isSessionStatus(value: unknown): value is 'idle' | 'running' | 'completed' | 'error' {
  return isString(value) && ['idle', 'running', 'completed', 'error'].includes(value);
}

/** 检查是否为有效的 ServerEvent */
export function isValidServerEvent(event: unknown): event is ServerEvent {
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
    'runner.error'
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

/** 验证并转换 API 配置 */
export function validateApiConfig(config: unknown): {
  valid: boolean;
  config?: { apiKey: string; baseURL: string; model: string };
  error?: string;
} {
  if (!isObject(config)) {
    return { valid: false, error: 'Config must be an object' };
  }

  const apiKey = config.apiKey;
  const baseURL = config.baseURL;
  const model = config.model;

  if (!isString(apiKey) || apiKey.length < 20) {
    return { valid: false, error: 'API key must be a string with at least 20 characters' };
  }

  if (!isString(baseURL) || baseURL.length === 0) {
    return { valid: false, error: 'Base URL must be a non-empty string' };
  }

  if (!isString(model) || model.length === 0) {
    return { valid: false, error: 'Model must be a non-empty string' };
  }

  return {
    valid: true,
    config: { apiKey, baseURL, model }
  };
}
```

### 步骤 3: 修复 preload.cts 类型

**文件**: `src/electron/preload.cts`

```typescript
// 当前代码
sendClientEvent: (event: any) => {
  electron.ipcRenderer.send("client-event", event);
}

// 修复后 - 添加类型检查
import type { ClientEvent } from './types.js';

sendClientEvent: (event: ClientEvent) => {
  // 运行时类型验证
  if (!event || typeof event !== 'object') {
    throw new Error('sendClientEvent: event must be an object');
  }
  if (!event.type || typeof event.type !== 'string') {
    throw new Error('sendClientEvent: event must have a type property');
  }
  electron.ipcRenderer.send("client-event", event);
}
```

### 步骤 4: 更新类型定义

**文件**: `src/electron/types.ts`

```typescript
// 添加更严格的类型定义

/** 客户端事件类型 */
export type ClientEvent =
  | { type: "session.list" }
  | { type: "session.history"; payload: { sessionId: string } }
  | { type: "session.start"; payload: SessionStartPayload }
  | { type: "session.continue"; payload: { sessionId: string; prompt: string } }
  | { type: "session.stop"; payload: { sessionId: string } }
  | { type: "session.delete"; payload: { sessionId: string } }
  | { type: "permission.response"; payload: { sessionId: string; toolUseId: string; result: PermissionResult } };

/** 会话启动负载 */
export interface SessionStartPayload {
  cwd: string;
  title: string;
  allowedTools: string;
  prompt: string;
}

/** 权限结果 */
export interface PermissionResult {
  behavior: "allow" | "deny" | "redirectInput";
  updatedInput?: unknown;
  message?: string;
}

/** 会话状态 */
export type SessionStatus = "idle" | "running" | "completed" | "error";

/** API 配置 */
export interface ApiConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  apiType?: "anthropic" | "openai" | "custom";
}
```

### 步骤 5: 添加类型检查装饰器

**新建文件**: `src/electron/utils/runtime-typecheck.ts`

```typescript
/**
 * 运行时类型检查装饰器
 */

/**
 * 为函数添加运行时参数类型检查
 */
export function typed<T extends (...args: any[]) => any>(
  fn: T,
  validator?: (...args: Parameters<T>) => boolean
): T {
  return ((...args: Parameters<T>) => {
    if (validator && !validator(...args)) {
      throw new TypeError(`Type validation failed for ${fn.name}`);
    }
    return fn(...args);
  }) as T;
}

/**
 * 创建类型安全的 IPC 处理器
 */
export function createIpcHandler<T extends Record<string, (...args: any[]) => any>>(
  handlers: T
): T {
  const wrapped = {} as T;

  for (const [key, handler] of Object.entries(handlers)) {
    wrapped[key as keyof T] = ((...args: any[]) => {
      try {
        return handler(...args);
      } catch (error) {
        if (error instanceof TypeError) {
          throw new Error(`[${key}] Type error: ${error.message}`);
        }
        throw error;
      }
    }) as T[keyof T];
  }

  return wrapped;
}
```

### 步骤 6: 更新 logger.ts 类型

**文件**: `src/electron/logger.ts`

```typescript
// 为日志方法添加类型重载

class SessionLogger {
  private sessionId: string;
  private cwd?: string;
  private globalLogger: winston.Logger;

  constructor(sessionId: string, cwd?: string) {
    this.sessionId = sessionId;
    this.cwd = cwd;
    this.globalLogger = getGlobalLogger();
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.globalLogger.info(this.formatMessage(message), meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.globalLogger.warn(this.formatMessage(message), meta);
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    const errorMeta = {
      ...meta,
      ...(error instanceof Error && {
        error: error.message,
        stack: error.stack
      })
    };
    this.globalLogger.error(this.formatMessage(message), errorMeta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.globalLogger.debug(this.formatMessage(message), meta);
  }

  private formatMessage(message: string): string {
    if (this.cwd) {
      return `[${this.sessionId}][${this.cwd}] ${message}`;
    }
    return `[${this.sessionId}] ${message}`;
  }
}
```

---

## 输出格式

```markdown
# B-05 执行结果

## 修复的文件

### src/electron/libs/session-store.ts
- 添加运行时状态验证
- 安全的类型转换

### src/electron/preload.cts
- 添加事件类型验证
- 移除 any 类型

### src/electron/types.ts
- 更新类型定义
- 添加更严格的类型

### src/electron/utils/type-guards.ts (新建)
- 类型守卫函数
- 运行时验证工具

### src/electron/utils/runtime-typecheck.ts (新建)
- 类型检查装饰器
- IPC 处理器包装

### src/electron/logger.ts
- 改进类型定义
- 添加错误类型处理

## 验证测试

- [ ] TypeScript 编译无错误
- [ ] 无效输入被拒绝
- [ ] 类型错误在运行时被捕获
- [ ] 没有 any 类型滥用
```

---

**注意事项**:
- 尽量避免使用 any，改用 unknown
- 添加类型守卫进行运行时验证
- 为外部输入添加类型检查
- 使用 TypeScript 严格模式
