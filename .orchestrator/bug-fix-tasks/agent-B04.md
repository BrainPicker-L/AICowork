# Agent-B04: 增强错误处理

**任务 ID**: B-04
**优先级**: 🔴 高 - 防止应用崩溃

---

## 问题描述

发现多处缺少错误处理的代码：
1. Promise rejection 未处理
2. JSON 解析没有 try-catch
3. 空值/undefined 访问
4. IPC 调用缺少错误边界

---

## 执行步骤

### 步骤 1: 修复 runner.ts 异步处理

**文件**: `src/electron/libs/runner.ts`

**问题**: 第 46-187 行 - 立即执行异步函数没有 rejection 处理

```typescript
// 当前代码
(async () => {
  try {
    // ...
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      return;
    }
    // 只处理了 AbortError
  }
})();

// 修复后 - 添加完整的错误处理
(async () => {
  try {
    // ... 现有代码
  } catch (error) {
    // 处理中止错误
    if ((error as Error).name === "AbortError") {
      return;
    }

    // 处理其他错误
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error(`[Runner] Unexpected error in session ${session.id}`, error);

    // 通知前端
    onEvent({
      type: "session.status",
      payload: {
        sessionId: session.id,
        status: "error",
        title: session.title,
        cwd: session.cwd,
        error: errorMessage
      }
    });

    // 更新会话状态
    onSessionUpdate?.({ status: "error" });
  }
})();
```

### 步骤 2: 修复 session-store.ts JSON 解析

**文件**: `src/electron/libs/session-store.ts`

**问题**: 第 130-137 行 - JSON 解析没有错误处理

```typescript
// 当前代码
if (!sessionRow) return null;

const messages = db
  .prepare(`SELECT data FROM messages WHERE sessionId = ? ORDER BY id ASC`)
  .all(sessionId)
  .map((row) => JSON.parse(String(row.data)) as StreamMessage);

// 修复后 - 添加错误处理
if (!sessionRow) return null;

let messages: StreamMessage[] = [];
try {
  const messageRows = db
    .prepare(`SELECT data FROM messages WHERE sessionId = ? ORDER BY id ASC`)
    .all(sessionId);

  messages = messageRows.map((row, index) => {
    try {
      return JSON.parse(String(row.data)) as StreamMessage;
    } catch (error) {
      log.error(`[SessionStore] Failed to parse message at index ${index} for session ${sessionId}`, error);
      // 返回一个错误消息占位符
      return {
        type: "error",
        error: `Failed to parse message: ${error instanceof Error ? error.message : String(error)}`
      } as StreamMessage;
    }
  });
} catch (error) {
  log.error(`[SessionStore] Failed to load messages for session ${sessionId}`, error);
  messages = [];
}
```

### 步骤 3: 添加安全访问辅助函数

**新建文件**: `src/electron/utils/safe-access.ts`

```typescript
/**
 * 安全访问工具函数
 * 防止空值/undefined 访问错误
 */

/**
 * 安全获取对象属性
 * @example
 * safeGet(obj, 'a.b.c') // 相当于 obj?.a?.b?.c
 */
export function safeGet<T>(obj: any, path: string, defaultValue?: T): T | undefined {
  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result == null) {
      return defaultValue;
    }
    result = result[key];
  }

  return result !== undefined ? result : defaultValue;
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
```

### 步骤 4: 修复 IPC 处理器错误处理

**文件**: `src/electron/ipc-handlers.ts`

```typescript
// 在 handleClientEvent 中添加包装
export function handleClientEvent(event: ClientEvent) {
  const sessions = initializeSessions();

  try {
    const eventHandlers = {
      "session.list": () => handleSessionList(sessions, emit),
      // ...
    } as const;

    const handler = eventHandlers[event.type];
    if (handler) {
      handler();
    } else {
      log.warn(`Unknown event type: ${event.type}`);
    }
  } catch (error) {
    log.error(`[IPC] Error handling event type ${event.type}`, error);
    // 发送错误响应
    emit({
      type: "runner.error",
      payload: {
        sessionId: 'system',
        message: `Internal error: ${error instanceof Error ? error.message : String(error)}`
      }
    });
  }
}
```

### 步骤 5: 添加全局错误处理器

**新建文件**: `src/electron/error-handling.ts`

```typescript
/**
 * 全局错误处理
 */

import { log } from './logger.js';

/**
 * 设置全局未捕获异常处理器
 */
export function setupGlobalErrorHandlers(): void {
  // 未捕获的 Promise rejection
  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    log.error('[Global] Unhandled Promise Rejection', {
      reason,
      promise: promise.toString()
    });

    // 在开发环境打印完整堆栈
    if (reason instanceof Error) {
      log.error('[Global] Error stack:', reason.stack);
    }
  });

  // 未捕获的异常
  process.on('uncaughtException', (error: Error) => {
    log.error('[Global] Uncaught Exception', {
      message: error.message,
      stack: error.stack
    });

    // 对于未捕获异常，通常应该退出进程
    // 但在 Electron 中，让主进程继续运行
    // 可以选择通知用户或重启应用
  });

  // 警告处理
  process.on('warning', (warning: Error) => {
    log.warn('[Global] Process warning', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack
    });
  });
}

/**
 * 包装异步函数，自动捕获错误
 */
export function asyncWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  onError?: (error: Error, ...args: Parameters<T>) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (onError) {
        onError(error as Error, ...args);
      } else {
        log.error(`[AsyncWrapper] Error in ${fn.name}`, error);
        throw error;
      }
    }
  }) as T;
}
```

### 步骤 6: 在 main.ts 中初始化错误处理

**文件**: `src/electron/main.ts`

```typescript
import { setupGlobalErrorHandlers } from './error-handling.js';

// 在 app.on('ready') 之前设置
setupGlobalErrorHandlers();

app.on('ready', () => {
  // ...
});
```

---

## 输出格式

```markdown
# B-04 执行结果

## 修复的文件

### src/electron/libs/runner.ts
- 添加完整的异步错误处理
- 处理所有类型的异常

### src/electron/libs/session-store.ts
- JSON 解析添加错误处理
- 防止单条消息解析失败导致全部失败

### src/electron/utils/safe-access.ts (新建)
- 安全访问工具函数
- safeGet, safeCall, safeJsonParse 等

### src/electron/error-handling.ts (新建)
- 全局错误处理器
- 未捕获异常和 rejection 处理

### src/electron/main.ts
- 初始化全局错误处理

## 验证测试

- [ ] 无效 JSON 不会导致崩溃
- [ ] IPC 错误正确返回给前端
- [ ] 未捕获的异常被记录
- [ ] Promise rejection 被处理
```

---

**注意事项**:
- 所有异步操作都要有错误处理
- JSON 解析必须用 try-catch 包装
- 全局错误处理器应该尽早设置
- 不要在生产环境暴露敏感错误信息
