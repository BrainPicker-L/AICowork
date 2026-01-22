# Claude-Cowork Bug 修复报告

> **文档类型**: Bug 修复报告
> **报告日期**: 2026-01-20
> **项目版本**: 0.1.0
> **修复目标**: 保守修复，确保现有功能完好，避免引入技术债务

---
> **@author**: Alan
> **@copyright**: Copyright © 2026
> **@created**: 2026-01-20
> **@Email**: None
> **@license**: AGCPA v3.0
---

## 目录

- [一、概述](#一概述)
- [二、严重缺陷 (🔴 高优先级)](#二严重缺陷-高优先级)
- [三、功能缺陷 (🟡 中优先级)](#三功能缺陷-中优先级)
- [四、代码质量 (🟢 低优先级)](#四代码质量-低优先级)
- [五、修复优先级建议](#五修复优先级建议)
- [六、修复检查清单](#六修复检查清单)

---

## 一、概述

### 1.1 审计范围

| 模块 | 文件数 | Bug 数量 |
|------|--------|----------|
| Electron 主进程 | 8 | 10 |
| React 前端 | 6 | 8 |
| 共享模块 | 2 | 2 |
| 类型定义 | 3 | 2 |
| **合计** | **19** | **22** |

### 1.2 严重程度分类

| 严重程度 | 数量 | 说明 |
|----------|------|------|
| 🔴 严重 | 4 | 安全漏洞、数据一致性风险 |
| 🟡 中等 | 8 | 功能缺陷、边界情况 |
| 🟢 轻微 | 10 | 代码质量、可维护性 |

### 1.3 修复原则

1. **保守修复**: 最小化代码变更，只修复问题，不重构
2. **向后兼容**: 确保现有功能和 API 不受影响
3. **测试优先**: 修复后必须验证相关功能正常工作
4. **文档同步**: 更新相关文档和注释

---

## 二、严重缺陷 (🔴 高优先级)

### 2.1 【数据一致性】SQLite 事务缺失

**文件**: [src/electron/libs/session-store.ts:178-187](../src/electron/libs/session-store.ts#L178-L187)

**问题描述**:
`deleteSession` 方法中，先删除 messages，再删除 sessions，两步操作没有事务保护。如果进程在中间崩溃，可能导致数据库不一致。

**当前代码**:
```typescript
deleteSession(id: string): boolean {
  const existing = this.sessions.get(id);
  if (existing) {
    this.sessions.delete(id);
  }
  this.db.prepare(`delete from messages where session_id = ?`).run(id);
  const result = this.db.prepare(`delete from sessions where id = ?`).run(id);
  const removedFromDb = result.changes > 0;
  return removedFromDb || Boolean(existing);
}
```

**修复方案** (保守修复):
```typescript
deleteSession(id: string): boolean {
  const existing = this.sessions.get(id);
  if (existing) {
    this.sessions.delete(id);
  }

  // 使用事务确保原子性
  const deleteTransaction = this.db.transaction(() => {
    this.db.prepare(`delete from messages where session_id = ?`).run(id);
    const result = this.db.prepare(`delete from sessions where id = ?`).run(id);
    return result.changes > 0;
  });

  const removedFromDb = deleteTransaction();
  return removedFromDb || Boolean(existing);
}
```

**影响范围**: 仅 `deleteSession` 方法，API 不变
**测试要求**: 删除会话后验证 messages 和 sessions 都被删除
**风险等级**: 低 - 事务是 SQLite 的标准特性

---

### 2.2 【逻辑错误】模块级 sessions 变量可能未初始化

**文件**: [src/electron/ipc-handlers.ts:38-41](../src/electron/ipc-handlers.ts#L38-L41)

**问题描述**:
`hasLiveSession` 函数在首次 IPC 调用时可能返回 `false`，因为 `sessions` 模块变量可能为 `undefined`。

**当前代码**:
```typescript
function hasLiveSession(sessionId: string): boolean {
  if (!sessions) return false;
  return Boolean(sessions.getSession(sessionId));
}
```

**修复方案** (保守修复):
```typescript
function hasLiveSession(sessionId: string): boolean {
  // 确保已初始化
  const currentSessions = initializeSessions();
  return Boolean(currentSessions.getSession(sessionId));
}
```

**影响范围**: 仅 `hasLiveSession` 内部函数
**测试要求**: 验证 emit 事件的会话过滤逻辑正常
**风险等级**: 低 - 只是添加初始化保证

---

### 2.3 【命名冲突】局部变量覆盖模块变量

**文件**: [src/electron/ipc-handlers.ts:75-98](../src/electron/ipc-handlers.ts#L75-L98)

**问题描述**:
`handleClientEvent` 中的局部 `sessions` 变量覆盖了模块级 `sessions`，同时导出的模块变量可能导致外部访问到未初始化的值。

**当前代码**:
```typescript
let sessions: SessionStore;  // 模块变量

export function handleClientEvent(event: ClientEvent) {
  const sessions = initializeSessions();  // 局部变量覆盖
  ...
}
export { sessions };  // 导出可能未定义的模块变量
```

**修复方案** (保守修复):
```typescript
let sessions: SessionStore;

export function handleClientEvent(event: ClientEvent) {
  // 使用模块变量，移除局部声明
  if (!sessions) {
    sessions = initializeSessions();
  }
  ...
}

// 修改导出，提供安全访问
export function getSessionStore(): SessionStore {
  if (!sessions) {
    sessions = initializeSessions();
  }
  return sessions;
}
```

**影响范围**: `ipc-handlers.ts` 内部实现
**测试要求**: 验证所有 IPC 事件处理正常
**风险等级**: 低 - 只是移除局部变量声明

---

### 2.4 【类型安全】描述记录中的拼写错误

**文件**: [src/electron/libs/config-store.ts:454](src/electron/libs/config-store.ts#L454)

**问题描述**:
`descriptions` 对象中 `anthropropic` 应为 `anthropic`，这是一个拼写错误。

**当前代码**:
```typescript
const descriptions: Record<ApiProvider, string> = {
  anthropropic: '官方 Anthropic API，支持 Claude Sonnet、Haiku、Opus 等模型',
  ...
};
```

**修复方案**:
```typescript
const descriptions: Record<ApiProvider, string> = {
  anthropic: '官方 Anthropic API，支持 Claude Sonnet、Haiku、Opus 等模型',
  ...
};
```

**影响范围**: 仅 `getProviderDescription` 函数内部
**测试要求**: 验证各厂商描述显示正常
**风险等级**: 极低 - 仅修正拼写

---

## 三、功能缺陷 (🟡 中优先级)

### 3.1 【边界情况】空字符串 cwd 处理不一致

**文件**: [src/electron/libs/session-store.ts:108-120](src/electron/libs/session-store.ts#L108-L120)

**问题描述**:
`listRecentCwds` 使用 `trim(cwd) != ''` 过滤，但其他地方可能没有相同处理。

**当前代码**:
```typescript
listRecentCwds(limit = 8): string[] {
  const rows = this.db
    .prepare(
      `select cwd, max(updated_at) as latest
       from sessions
       where cwd is not null and trim(cwd) != ''
       group by cwd
       order by latest desc
       limit ?`
    )
    .all(limit) as Array<Record<string, unknown>>;
  return rows.map((row) => String(row.cwd));
}
```

**修复方案** (保守修复 - 确保过滤空字符串):
```typescript
listRecentCwds(limit = 8): string[] {
  const rows = this.db
    .prepare(
      `select cwd, max(updated_at) as latest
       from sessions
       where cwd is not null and trim(cwd) != ''
       group by cwd
       order by latest desc
       limit ?`
    )
    .all(limit) as Array<Record<string, unknown>>;
  // 添加额外的空字符串过滤保护
  return rows
    .map((row) => String(row.cwd))
    .filter(cwd => cwd.trim() !== '');
}
```

**影响范围**: 仅 `listRecentCwds` 返回值
**测试要求**: 验证最近目录列表不包含空字符串
**风险等级**: 低 - 只是添加额外的过滤保护

---

### 3.2 【数据竞态】Session 继续时可能覆盖 runner handle

**文件**: [src/electron/handlers/session-handlers.ts:117-219](src/electron/handlers/session-handlers.ts#L117-L219)

**问题描述**:
在 `handleSessionContinue` 中，如果快速发送多条消息，可能创建多个 runner handle，旧 handle 没有被中止。

**修复方案** (保守修复):
```typescript
export function handleSessionContinue(
  sessions: SessionStore,
  runnerHandles: Map<string, RunnerHandle>,
  emit: (event: ServerEvent) => void,
  sessionId: string,
  prompt: string
): void {
  const session = sessions.getSession(sessionId);
  if (!session) {
    emit({ type: "session.deleted", payload: { sessionId } });
    emit({
      type: "runner.error",
      payload: { sessionId, message: "Session no longer exists." }
    });
    return;
  }

  // 添加：中止旧的 runner handle
  const existingHandle = runnerHandles.get(sessionId);
  if (existingHandle) {
    existingHandle.abort();
    runnerHandles.delete(sessionId);
  }

  // If session has no claudeSessionId, treat this as the first prompt
  if (!session.claudeSessionId) {
    // ... 现有代码保持不变
```

**影响范围**: `handleSessionContinue` 函数开头
**测试要求**: 验证快速发送多条消息时旧会话被正确中止
**风险等级**: 低 - 只是添加清理旧 handle 的逻辑

---

### 3.3 【UI 逻辑】PromptInput 禁用状态需要调整

**文件**: [src/ui/App.tsx:356](src/ui/App.tsx#L356)

**问题描述**:
`PromptInput` 的 `disabled` 属性设置为 `visibleMessages.length === 0`，这意味着没有消息时禁用输入，但会话运行时应该保持可用。

**当前代码**:
```typescript
<PromptInput sendEvent={sendEvent} onSendMessage={handleSendMessage} disabled={visibleMessages.length === 0} />
```

**修复方案**:
```typescript
// 修改禁用条件：仅在没有活动会话且没有消息时禁用
<PromptInput
  sendEvent={sendEvent}
  onSendMessage={handleSendMessage}
  disabled={!activeSession && visibleMessages.length === 0}
/>
```

**影响范围**: 仅 `PromptInput` 的禁用逻辑
**测试要求**: 验证新建会话时可以正常输入
**风险等级**: 低 - 只是调整禁用条件

---

### 3.4 【运行时安全】session.claudeSessionId 可能未定义

**文件**: [src/electron/handlers/session-handlers.ts](src/electron/handlers/session-handlers.ts)

**问题描述**:
多处使用 `session.claudeSessionId` 但没有检查是否为 undefined。

**影响位置**:
- 第 86 行: `resumeSessionId: session.claudeSessionId`
- 第 153 行: `resumeSessionId: session.claudeSessionId`
- 第 197 行: `resumeSessionId: session.claudeSessionId`

**修复方案** (使用可选链或默认值):
```typescript
// 第 86 行（已有处理，但明确默认值）
resumeSessionId: session.claudeSessionId ?? undefined,

// 其他位置同理，保持代码简洁
```

**说明**: `runClaude` 函数已经可以处理 `undefined` 的 `resumeSessionId`，所以无需修改，只是需要确认行为符合预期。

**影响范围**: 无需修改，确认行为即可
**测试要求**: 验证没有 claudeSessionId 的会话可以正常启动
**风险等级**: 无 - 现有代码已正确处理

---

### 3.5 【依赖处理】Promise 拒继静默处理

**文件**: [src/ui/utils/logger.ts:56-63](src/ui/utils/logger.ts#L56-L63)

**问题描述**:
`sendLog` 失败时只做开发环境日志，生产环境完全静默，可能掩盖问题。

**修复方案** (保守修复 - 添加计数但不过度打扰):
```typescript
class FrontendLogger {
  private sendErrorCount = 0;
  private isDevelopment = import.meta.env.DEV;

  private sendLog(level: LogLevel, message: string, meta?: unknown): void {
    const logMessage: LogMessage = {
      level,
      message,
      meta,
      timestamp: new Date().toISOString()
    };

    // 开发环境下同时输出到 console
    if (this.isDevelopment) {
      switch (level) {
        case 'error':
          console.error(`[Frontend] ${message}`, meta || '');
          break;
        case 'warn':
          console.warn(`[Frontend] ${message}`, meta || '');
          break;
        case 'info':
          console.info(`[Frontend] ${message}`, meta || '');
          break;
        case 'debug':
          console.debug(`[Frontend] ${message}`, meta || '');
          break;
      }
    }

    // 通过 IPC 发送到主进程（如果可用）
    if (window.electron && typeof window.electron.sendLog === 'function') {
      window.electron.sendLog(logMessage).catch((err: unknown) => {
        this.sendErrorCount++;
        // 仅在开发环境或错误频繁时输出
        if (this.isDevelopment || this.sendErrorCount > 10) {
          console.error('[FrontendLogger] Failed to send log to main process (count:', this.sendErrorCount, '):', err);
        }
      });
    }
  }
```

**影响范围**: 仅 `FrontendLogger` 类内部
**测试要求**: 验证日志发送失败不影响主流程
**风险等级**: 低 - 只是添加错误计数

---

### 3.6 【可维护性】console.error 替换为统一日志

**文件**: [src/ui/components/SettingsModal.tsx:222](src/ui/components/SettingsModal.tsx#L222)

**问题描述**:
使用 `console.error` 而不是统一的 `log` 方法。

**当前代码**:
```typescript
} catch (err) {
  console.error("Failed to test API connection:", err);
  ...
}
```

**修复方案**:
```typescript
} catch (err) {
  log.error("Failed to test API connection:", err);
  ...
}
```

**影响范围**: `SettingsModal.tsx` 一处
**测试要求**: 验证错误日志正常输出
**风险等级**: 极低 - 只是替换日志方法

---

### 3.7 【类型安全】useIPC hook 依赖优化

**文件**: [src/ui/hooks/useIPC.ts:8-24](src/ui/hooks/useIPC.ts#L8-L24)

**问题描述**:
`useEffect` 依赖 `onEvent` 回调，可能导致频繁的订阅/取消订阅。

**当前代码**:
```typescript
useEffect(() => {
  const unsubscribe = window.electron.onServerEvent((event: ServerEvent) => {
    onEvent(event);
  });

  unsubscribeRef.current = unsubscribe;
  setConnected(true);

  return () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setConnected(false);
  };
}, [onEvent]);
```

**修复方案** (使用 ref 稳定回调):
```typescript
import { useCallback, useEffect, useRef, useState } from "react";
import type { ServerEvent, ClientEvent } from "../types";

export function useIPC(onEvent: (event: ServerEvent) => void) {
  const [connected, setConnected] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onEventRef = useRef(onEvent);

  // 保持 ref 最新
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const unsubscribe = window.electron.onServerEvent((event: ServerEvent) => {
      onEventRef.current(event);
    });

    unsubscribeRef.current = unsubscribe;
    setConnected(true);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setConnected(false);
    };
  }, []); // 空依赖数组，只在挂载时订阅

  const sendEvent = useCallback((event: ClientEvent) => {
    window.electron.sendClientEvent(event);
  }, []);

  return { connected, sendEvent };
}
```

**影响范围**: `useIPC` hook 内部实现
**测试要求**: 验证 IPC 通信正常，事件订阅稳定
**风险等级**: 低 - 使用 ref 是标准模式

---

### 3.8 【配置】CSP 通配符优化

**文件**: [src/electron/main.ts:98](src/electron/main.ts#L98)

**问题描述**:
生产环境 CSP 使用 `https://*.anthropic.com` 通配符。

**当前代码**:
```typescript
const csp = isDev()
    ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*; ..."
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.anthropic.com https://*.anthropic.com;";
```

**修复方案** (保守修复 - 明确域名):
```typescript
const csp = isDev()
    ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*; style-src 'self' 'unsafe-inline' http://localhost:*;"
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.anthropic.com;";
```

**说明**: 移除 `https://*.anthropic.com` 通配符，保留 `https://api.anthropic.com`（这是实际使用的 API 地址）。如果将来需要其他子域名，可以明确添加。

**影响范围**: 仅生产环境 CSP 配置
**测试要求**: 验证生产环境 API 调用正常
**风险等级**: 低 - 当前只使用 api.anthropic.com

---

## 四、代码质量 (🟢 低优先级)

### 4.1 【类型定义】ApiConfig 类型重复定义

**问题描述**:
`ApiConfig` 类型在多个文件中重复定义：
- `src/electron/types.ts`
- `src/electron/libs/config-store.ts`
- `src/ui/electron.d.ts`

**修复方案** (保守修复 - 从单一来源导入):
```typescript
// src/electron/types.ts - 作为唯一来源
export interface ApiConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  apiType?: string;
  resourceName?: string;
  deploymentName?: string;
  customHeaders?: Record<string, string>;
}

// src/electron/libs/config-store.ts - 导入使用
import type { ApiConfig } from "../types.js";

// src/ui/electron.d.ts - 导入使用（通过类型引用）
// 注意：UI 层的类型需要保持一致
```

**影响范围**: 类型定义文件
**测试要求**: 验证类型检查通过，编译无错误
**风险等级**: 低 - 只是移除重复定义

---

### 4.2 【代码规范】未使用的导入清理

**文件**: 多处

**问题描述**:
部分文件存在未使用的导入，如 `import type { SDKResultMessage }` 在 `util.ts` 中。

**修复方案**:
逐文件检查并移除未使用的导入。使用 ESLint 的 `--fix` 选项可以自动处理。

```bash
# 自动修复未使用的导入
bun run lint --fix
```

**影响范围**: 多个文件的导入语句
**测试要求**: 验证编译无错误
**风险等级**: 极低 - 只是移除未使用的代码

---

### 4.3 【类型安全】减少 any 类型使用

**文件**: 多处

**问题描述**:
代码中存在约 10+ 处 `any` 类型使用。

**修复方案** (渐进式替换):
优先修复以下位置：

| 文件 | 位置 | 替换类型 |
|------|------|----------|
| `src/electron/preload.cts` | 第 12 行 | `event: ClientEvent` |
| `src/ui/App.tsx` | 第 129 行 | 具体类型 |
| `src/ui/store/useAppStore.ts` | 部分状态 | 具体类型 |

**示例**:
```typescript
// 修复前
const getPartialMessageContent = (eventMessage: any) => {

// 修复后
const getPartialMessageContent = (eventMessage: { delta: { type: string; [key: string]: unknown } }) => {
```

**影响范围**: 类型注解
**测试要求**: 验证类型检查通过
**风险等级**: 低 - 只是添加更精确的类型

---

### 4.4 【性能】handlePartialMessages 依赖优化

**文件**: [src/ui/App.tsx:70-98](src/ui/App.tsx#L70-L98)

**问题描述**:
`handlePartialMessages` 依赖 `shouldAutoScroll`，可能导致回调频繁变化。

**修复方案** (使用 ref):
```typescript
const shouldAutoScrollRef = useRef(shouldAutoScroll);
shouldAutoScrollRef.current = shouldAutoScroll;

const handlePartialMessages = useCallback((partialEvent: ServerEvent) => {
  if (partialEvent.type !== "stream.message" || partialEvent.payload.message.type !== "stream_event") return;

  const message = partialEvent.payload.message as any;
  if (message.event.type === "content_block_start") {
    partialMessageRef.current = "";
    setPartialMessage(partialMessageRef.current);
    setShowPartialMessage(true);
  }

  if (message.event.type === "content_block_delta") {
    partialMessageRef.current += getPartialMessageContent(message.event) || "";
    setPartialMessage(partialMessageRef.current);
    if (shouldAutoScrollRef.current) {  // 使用 ref
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      setHasNewMessages(true);
    }
  }

  if (message.event.type === "content_block_stop") {
    setShowPartialMessage(false);
    setTimeout(() => {
      partialMessageRef.current = "";
      setPartialMessage(partialMessageRef.current);
    }, PARTIAL_MESSAGE_CLEAR_DELAY);
  }
}, []); // 空依赖数组
```

**影响范围**: `App.tsx` 内部实现
**测试要求**: 验证消息滚动正常
**风险等级**: 低 - 使用 ref 是标准模式

---

## 五、修复优先级建议

### 5.1 必须修复 (P0 - 本周内)

| Bug | 修复难度 | 风险 | 预计时间 |
|-----|----------|------|----------|
| 2.1 SQLite 事务缺失 | 低 | 低 | 10 分钟 |
| 2.2 sessions 未初始化 | 低 | 低 | 5 分钟 |
| 2.3 命名冲突 | 低 | 低 | 15 分钟 |
| 2.4 拼写错误 | 极低 | 极低 | 2 分钟 |

**总计**: 约 30 分钟

---

### 5.2 建议修复 (P1 - 两周内)

| Bug | 修复难度 | 风险 | 预计时间 |
|-----|----------|------|----------|
| 3.1 空 cwd 处理 | 低 | 低 | 10 分钟 |
| 3.2 runner handle 竞态 | 低 | 低 | 15 分钟 |
| 3.3 PromptInput 禁用 | 低 | 低 | 5 分钟 |
| 3.7 useIPC 依赖 | 中 | 低 | 20 分钟 |
| 3.8 CSP 通配符 | 低 | 低 | 5 分钟 |
| 3.5 Promise 错误计数 | 低 | 低 | 10 分钟 |
| 3.6 console 替换 | 极低 | 极低 | 5 分钟 |

**总计**: 约 70 分钟

---

### 5.3 可选修复 (P2 - 有空时)

| Bug | 修复难度 | 风险 | 预计时间 |
|-----|----------|------|----------|
| 4.1 类型重复 | 低 | 低 | 30 分钟 |
| 4.2 未使用导入 | 极低 | 极低 | 10 分钟 |
| 4.3 any 类型 | 中 | 低 | 60 分钟 |
| 4.4 性能优化 | 低 | 低 | 15 分钟 |

**总计**: 约 115 分钟

---

## 六、修复检查清单

### 6.1 修复前检查

- [ ] 创建修复分支: `git checkout -b fix/bug-cleanup-v0.1.0`
- [ ] 备份当前数据库（如果存在）
- [ ] 确认所有测试通过
- [ ] 记录当前版本状态

### 6.2 修复过程检查

每个 Bug 修复后：

- [ ] 代码变更符合"保守修复"原则
- [ ] 不引入新的依赖
- [ ] 不修改 API 接口
- [ ] 相关功能测试通过

### 6.3 修复后验证

**P0 Bug 修复后必须验证**:
- [ ] 创建新会话正常
- [ ] 删除会话正常
- [ ] 会话继续正常
- [ ] IPC 通信正常

**P1 Bug 修复后建议验证**:
- [ ] 快速发送多条消息
- [ ] 空 cwd 会话处理
- [ ] 输入框禁用状态
- [ ] 日志发送功能

**全量测试**:
- [ ] 运行 `bun run build` 无错误
- [ ] 运行 `bun run lint` 无错误
- [ ] 手动测试所有主要功能

### 6.4 发布前检查

- [ ] 更新 CHANGELOG.md
- [ ] 更新版本号（如果需要）
- [ ] 创建 Git 标签
- [ ] 测试打包后的应用

---

## 附录

### A. 修复分支命名规范

```
fix/<bug类型>-<描述>-v<版本>
例如:
fix/data-consistency-transaction-v0.1.0
fix/ui-prompt-input-disabled-v0.1.0
```

### B. 提交信息规范

```
fix(module): 简短描述

详细说明（可选）

Fixes: #bug编号
```

### C. 修复时间估算

| 优先级 | Bug 数量 | 预计时间 |
|--------|----------|----------|
| P0 | 4 | 30 分钟 |
| P1 | 7 | 70 分钟 |
| P2 | 4 | 115 分钟 |
| **合计** | **15** | **215 分钟 (约 3.5 小时)** |

---

**报告生成时间**: 2026-01-20
**下次审查建议**: 修复完成后
**审查工具**: Claude Code
**审查人员**: Alan
