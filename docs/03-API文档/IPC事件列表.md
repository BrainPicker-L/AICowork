# IPC 事件列表

> **文档类型**: API 文档
> **更新日期**: 2026-01-20
> **适用版本**: v0.1.0

---
> **@author**: Alan
> **@copyright**: Copyright © 2026
> **@created**: 2026-01-20
> **@Email**: alan@example.com
> **@license**: AGCPA v3.0
---

## 目录

- [概述](#概述)
- [Client → Server 事件](#client--server-事件)
- [Server → Client 事件](#server--client-事件)
- [IPC 处理器](#ipc-处理器)
- [数据类型](#数据类型)

---

## 概述

Claude-Cowork 使用 Electron IPC (进程间通信) 机制在渲染进程（前端）和主进程（后端）之间传递消息。

### 通信方式

| 方向 | 通信方式 | 用途 |
|------|----------|------|
| Client → Server | `ipcRenderer.send` | 单向通信，不需要返回值 |
| Client → Server | `ipcRenderer.invoke` | 双向通信，需要返回值 |
| Server → Client | `webContents.send` | 服务器主动推送 |

---

## Client → Server 事件

### session.start

启动新会话。

**类型**: `client-event` (单向)
**位置**: [ipc-handlers.ts:92](../src/electron/ipc-handlers.ts#L92)

```typescript
{
  type: "session.start";
  payload: {
    title: string;        // 会话标题
    prompt: string;       // 用户提示词
    cwd?: string;         // 工作目录
    allowedTools?: string; // 允许的工具，默认 "Read,Edit,Bash"
  };
}
```

**响应**:
- `session.status` - 会话状态更新
- `stream.user_prompt` - 用户提示词记录
- `stream.message` - AI 消息流

---

### session.continue

继续已有会话。

**类型**: `client-event` (单向)
**位置**: [ipc-handlers.ts:159](../src/electron/ipc-handlers.ts#L159)

```typescript
{
  type: "session.continue";
  payload: {
    sessionId: string;    // 会话 ID
    prompt: string;       // 用户提示词
  };
}
```

**响应**:
- `session.status` - 会话状态更新
- `stream.user_prompt` - 用户提示词记录
- `stream.message` - AI 消息流

---

### session.stop

停止正在运行的会话。

**类型**: `client-event` (单向)
**位置**: [ipc-handlers.ts:259](../src/electron/ipc-handlers.ts#L259)

```typescript
{
  type: "session.stop";
  payload: {
    sessionId: string;    // 会话 ID
  };
}
```

**响应**:
- `session.status` - 会话状态更新为 `idle`

---

### session.delete

删除会话。

**类型**: `client-event` (单向)
**位置**: [ipc-handlers.ts:283](../src/electron/ipc-handlers.ts#L283)

```typescript
{
  type: "session.delete";
  payload: {
    sessionId: string;    // 会话 ID
  };
}
```

**响应**:
- `session.deleted` - 会话删除确认

---

### session.list

获取所有会话列表。

**类型**: `client-event` (单向)
**位置**: [ipc-handlers.ts:66](../src/electron/ipc-handlers.ts#L66)

```typescript
{
  type: "session.list";
}
```

**响应**:
- `session.list` - 会话列表

---

### session.history

获取会话历史记录。

**类型**: `client-event` (单向)
**位置**: [ipc-handlers.ts:74](../src/electron/ipc-handlers.ts#L74)

```typescript
{
  type: "session.history";
  payload: {
    sessionId: string;    // 会话 ID
  };
}
```

**响应**:
- `session.history` - 会话历史记录
- `session.deleted` - 如果会话不存在

---

### permission.response

响应权限请求。

**类型**: `client-event` (单向)
**位置**: [ipc-handlers.ts:314](../src/electron/ipc-handlers.ts#L314)

```typescript
{
  type: "permission.response";
  payload: {
    sessionId: string;          // 会话 ID
    toolUseId: string;          // 工具调用 ID
    result: PermissionResult;   // 权限结果
  };
}
```

**PermissionResult 类型**:

```typescript
type PermissionResult =
  | { behavior: "allow"; updatedInput?: unknown; message?: string }
  | { behavior: "deny"; message?: string }
  | { behavior: "auto"; updatedInput?: unknown }
  | { behavior: "skip" };
```

---

## Server → Client 事件

### session.status

会话状态更新。

**类型**: `server-event`
**位置**: [ipc-handlers.ts:47](../src/electron/ipc-handlers.ts#L47)

```typescript
{
  type: "session.status";
  payload: {
    sessionId: string;    // 会话 ID
    status: SessionStatus; // 会话状态
    title?: string;       // 会话标题
    cwd?: string;         // 工作目录
    error?: string;       // 错误信息（如果有）
  };
}
```

**SessionStatus 类型**:

```typescript
type SessionStatus = "idle" | "running" | "completed" | "error";
```

---

### stream.message

AI 消息流。

**类型**: `server-event`
**位置**: [ipc-handlers.ts:50](../src/electron/ipc-handlers.ts#L50)

```typescript
{
  type: "stream.message";
  payload: {
    sessionId: string;    // 会话 ID
    message: StreamMessage; // SDK 消息
  };
}
```

**StreamMessage 类型**:

```typescript
type StreamMessage = SDKMessage | UserPromptMessage;

type UserPromptMessage = {
  type: "user_prompt";
  prompt: string;
};
```

---

### stream.user_prompt

用户提示词记录。

**类型**: `server-event`
**位置**: [ipc-handlers.ts:53](../src/electron/ipc-handlers.ts#L53)

```typescript
{
  type: "stream.user_prompt";
  payload: {
    sessionId: string;    // 会话 ID
    prompt: string;       // 用户提示词
  };
}
```

---

### session.list

会话列表。

**类型**: `server-event`
**位置**: [ipc-handlers.ts:68](../src/electron/ipc-handlers.ts#L68)

```typescript
{
  type: "session.list";
  payload: {
    sessions: SessionInfo[];
  };
}
```

**SessionInfo 类型**:

```typescript
type SessionInfo = {
  id: string;
  title: string;
  status: SessionStatus;
  claudeSessionId?: string;
  cwd?: string;
  createdAt: number;
  updatedAt: number;
};
```

---

### session.history

会话历史记录。

**类型**: `server-event`
**位置**: [ipc-handlers.ts:82](../src/electron/ipc-handlers.ts#L82)

```typescript
{
  type: "session.history";
  payload: {
    sessionId: string;        // 会话 ID
    status: SessionStatus;     // 会话状态
    messages: StreamMessage[]; // 消息列表
  };
}
```

---

### session.deleted

会话删除确认。

**类型**: `server-event`
**位置**: [ipc-handlers.ts:296](../src/electron/ipc-handlers.ts#L296)

```typescript
{
  type: "session.deleted";
  payload: {
    sessionId: string;    // 被删除的会话 ID
  };
}
```

---

### permission.request

权限请求。

**类型**: `server-event`
**位置**: [runner.ts:127](../src/electron/libs/runner.ts#L127)

```typescript
{
  type: "permission.request";
  payload: {
    sessionId: string;    // 会话 ID
    toolUseId: string;    // 工具调用 ID
    toolName: string;     // 工具名称
    input: unknown;       // 工具输入参数
  };
}
```

---

### runner.error

运行器错误。

**类型**: `server-event`
**位置**: [ipc-handlers.ts:304](../src/electron/ipc-handlers.ts#L304)

```typescript
{
  type: "runner.error";
  payload: {
    sessionId?: string;   // 相关的会话 ID（可选）
    message: string;      // 错误消息
  };
}
```

---

## IPC 处理器

### getStaticData

获取静态系统数据。

**调用**: `ipcInvoke("getStaticData")`
**位置**: [main.ts:99](../src/electron/main.ts#L99)

```typescript
{
  totalStorage: number;  // 总存储空间（GB）
  cpuModel: string;      // CPU 型号
  totalMemoryGB: number; // 总内存（GB）
}
```

---

### generate-session-title

生成会话标题。

**调用**: `ipcInvoke("generate-session-title", userInput)`
**位置**: [main.ts:109](../src/electron/main.ts#L109)

```typescript
// 输入
userInput: string | null; // 用户输入的提示词

// 输出
title: string; // 生成的会话标题
```

---

### get-recent-cwds

获取最近使用的工作目录。

**调用**: `ipcInvoke("get-recent-cwds", limit?)`
**位置**: [main.ts:114](../src/electron/main.ts#L114)

```typescript
// 输入
limit?: number; // 限制数量，默认 8，范围 1-20

// 输出
cwds: string[]; // 最近使用的工作目录列表
```

---

### select-directory

选择目录。

**调用**: `ipcInvoke("select-directory")`
**位置**: [main.ts:120](../src/electron/main.ts#L120)

```typescript
// 输出
directoryPath: string | null; // 选择的目录路径，取消时为 null
```

---

### get-api-config

获取 API 配置。

**调用**: `ipcInvoke("get-api-config")`
**位置**: [main.ts:133](../src/electron/main.ts#L133)

```typescript
// 输出
config: ApiConfig | null; // API 配置，未配置时为 null
```

---

### check-api-config

检查 API 配置。

**调用**: `ipcInvoke("check-api-config")`
**位置**: [main.ts:137](../src/electron/main.ts#L137)

```typescript
// 输出
{
  hasConfig: boolean;          // 是否有配置
  config: ApiConfig | null;    // 配置内容
}
```

---

### save-api-config

保存 API 配置。

**调用**: `ipcInvoke("save-api-config", config)`
**位置**: [main.ts:142](../src/electron/main.ts#L142)

```typescript
// 输入
config: ApiConfig; // API 配置

// 输出
{
  success: boolean;   // 是否成功
  error?: string;     // 错误信息（失败时）
}
```

---

### test-api-connection

测试 API 连接。

**调用**: `ipcInvoke("test-api-connection", config)`
**位置**: [main.ts:155](../src/electron/main.ts#L155)

```typescript
// 输入
config: ApiConfig; // API 配置

// 输出
{
  success: boolean;       // 是否成功
  message: string;        // 结果消息
  details?: string;       // 详细信息
  responseTime?: number;  // 响应时间（ms）
}
```

---

### send-log

发送前端日志到主进程。

**调用**: `ipcInvoke("send-log", logMessage)`
**位置**: [main.ts:160](../src/electron/main.ts#L160)

```typescript
// 输入
{
  level: string;          // 日志级别
  message: string;        // 日志消息
  meta?: unknown;         // 附加数据
  timestamp: string;      // 时间戳
}
```

---

## 数据类型

### ApiConfig

```typescript
type ApiConfig = {
  apiKey: string;         // API 密钥
  baseURL: string;        // API 基础 URL
  model: string;          // 模型名称
  apiType?: "anthropic";  // API 类型
};
```

### TestApiResult

```typescript
type TestApiResult = {
  success: boolean;       // 测试是否成功
  message: string;        // 结果消息
  details?: string;       // 详细说明
  responseTime?: number;  // 响应时间（ms）
};
```

---

## 附录

### 事件流程图

```
┌─────────────────────────────────────────────────────────┐
│                    渲染进程 (前端)                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ↓ IPC invoke/send
┌─────────────────────────────────────────────────────────┐
│                    主进程 (后端)                         │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │ IPC Handlers │ → │   Runner     │ → │   Claude  │  │
│  └─────────────┘    │   (AI)       │    │   SDK     │  │
│       ↑             └──────────────┘    └───────────┘  │
│       │                    ↑                           │
│  Session Store              │                         │
│  (SQLite)                   │                         │
└────────────────────────────┼─────────────────────────┘
                             │
                             ↓ IPC send
┌─────────────────────────────────────────────────────────┐
│                    渲染进程 (前端)                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Event Handler → Zustand Store → UI Update      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-20
