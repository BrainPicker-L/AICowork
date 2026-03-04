# OpenCode SDK vs Qwen Code SDK 对比分析

> 针对 AICowork（Cowork）选型的详细能力与兼容性对比。  
> 参考文档：[OpenCode SDK](https://opencode.ai/docs/zh-cn/sdk) | [Qwen Code TypeScript SDK](https://qwenlm.github.io/qwen-code-docs/zh/developers/sdk-typescript/)

---

## 一、架构与运行模型

| 维度 | OpenCode SDK | Qwen Code SDK |
|------|--------------|----------------|
| **架构** | **Client-Server**：SDK 要么启动/连接一个 opencode 服务器（默认 4096 端口），要么仅作为客户端连接已有实例 | **In-Process**：`query()` 内部通过子进程/CLI 调用 Qwen Code，无独立常驻服务 |
| **入口** | `createOpencode()` → 同时启动服务器 + 客户端；或 `createOpencodeClient({ baseUrl })` 仅客户端 | `query({ prompt, options })` → 返回 `AsyncIterable<SDKMessage>`，单入口 |
| **会话生命周期** | 由服务端管理：`session.create()` / `session.list()` / `session.get()` 等，会话持久化在服务端 | 由调用方维护：通过 `session_id` 在多次 `yield` 的 `SDKUserMessage` 中传递，SDK 内部与 CLI 协同维护上下文 |
| **适用场景** | 多客户端共享同一后端、CI/脚本中连接已有 opencode 实例、需要集中式会话与文件 API | 单机桌面/Electron 应用、需要完全掌控进程与权限、希望无额外守护进程 |

**对 Cowork 的启示**：Cowork 是 Electron 单机应用，不需要多端共享同一 AI 后端。Qwen 的「进程内 + 单次 query 流式对话」与当前「Runner + UserInputQueue + 流式消息到前端」的模型一致；若切到 OpenCode，需先解决「谁在何时启动/连接 opencode 服务」以及「会话与 UI 状态如何对应」的问题。

---

## 二、能力对比总览

### 2.1 对话与提示

| 能力 | OpenCode SDK | Qwen Code SDK |
|------|--------------|----------------|
| **单次提示** | `client.session.prompt({ path: { id }, body: { parts } })`，返回当轮 AssistantMessage | 通过 `query({ prompt: "..." })` 或 generator 的首条 `SDKUserMessage` |
| **多轮对话** | 同一 `session.id` 下多次调用 `session.prompt()`，服务端维护历史 | 单次 `query()`，`prompt` 为 `AsyncIterable<SDKUserMessage>`，在 generator 中持续 `yield` 新用户消息，`session_id` 固定 |
| **仅注入上下文（不触发回复）** | `body.noReply: true` | 不单独区分，由 prompt 内容/约定控制 |
| **流式输出** | 文档未强调流式；可能通过 `event.subscribe()` 或响应流体现 | 原生流式：`for await (const message of q)`，且支持 `includePartialMessages` 做实时逐 token 展示 |
| **结构化输出** | 支持：`body.format: { type: "json_schema", schema, retryCount }`，结果在 `result.data.info.structured_output` | 文档未突出；若需可依赖模型/提示或自行解析 |
| **中止会话** | `session.abort({ path: { id } })` | `abortController.abort()` 或 `q.interrupt()` |

Cowork 当前依赖：**多轮流式 + 同一 session_id + 用户消息队列 + 部分消息（includePartialMessages）**。这些在 Qwen SDK 中都是原生支持；OpenCode 需用「多次 prompt + 事件流」拼出类似体验，改造量较大。

### 2.2 会话与历史

| 能力 | OpenCode SDK | Qwen Code SDK |
|------|--------------|----------------|
| **会话 CRUD** | 完整：list / get / create / delete / update | 无独立会话 API；会话语义由 `session_id` + 应用层（如 Cowork 的 SessionStore）维护 |
| **子会话** | `session.children({ path })` | 无 |
| **消息列表/详情** | `session.messages({ path })` / `session.message({ path })` | 无；历史在 CLI/SDK 内部，应用层通过自己保存的 `SDKMessage` 做展示 |
| **撤回/恢复** | `session.revert` / `session.unrevert` | 无 |
| **总结会话** | `session.summarize({ path, body })` | 无 |
| **分享会话** | `session.share` / `session.unshare` | 无 |

OpenCode 在「会话与历史」上更偏服务端、功能更全；Cowork 若以本地会话 + 本地存储为主，Qwen 的「无会话 API」反而简单，现有 SessionStore 已能覆盖需求。

### 2.3 权限与工具审批

| 能力 | OpenCode SDK | Qwen Code SDK |
|------|--------------|----------------|
| **权限模式** | 文档未细说；仅有 `postSessionByIdPermissionsByPermissionId` 响应权限请求 | 明确：`default` / `plan` / `auto-edit` / `yolo`，且可与 `allowedTools` / `excludeTools` 组合 |
| **每工具审批** | 需配合事件流或轮询拿到权限请求，再调 API 响应 | **`canUseTool(toolName, input, { signal })`** 回调，在 60s 内返回 `allow/deny`，与 Cowork 的「弹窗确认」流程完全契合 |
| **运行时改权限/模型** | 未写 | `q.setPermissionMode()` / `q.setModel()` |

Cowork 已在 `permission-handler.ts` 中实现：删除操作与 AskUserQuestion 走 `sendPermissionRequest` → 前端弹窗 → `resolve` 回 `PermissionResult`。这与 Qwen 的 `canUseTool` 一一对应。OpenCode 需要自己从事件里识别「权限请求」并调 `postSessionByIdPermissionsByPermissionId`，协议与 UI 对接都要重写。

### 2.4 MCP（Model Context Protocol）

| 能力 | OpenCode SDK | Qwen Code SDK |
|------|--------------|----------------|
| **外部 MCP 服务器** | 依赖 opencode 服务端配置 | `options.mcpServers`：command/args/url 等，与 Cowork 从 ~/.qwen/settings.json 读取并注入一致 |
| **进程内 MCP 工具** | 未写 | **`tool()` + `createSdkMcpServer()`**：Zod schema 定义工具，同一进程内注册，无需单独进程 |
| **与配置目录联动** | 取决于服务端如何读配置 | 可直接传 `mcpServers`，Cowork 已从 `getCachedMcpServers()` 等拉取并传入 |

Cowork 已大量使用「外部 MCP + 配置缓存」；Qwen 的 `mcpServers` 与现有逻辑兼容。OpenCode 的 MCP 如何配置、是否与 ~/.qwen 兼容未知，需额外调研。

### 2.5 工作区与文件

| 能力 | OpenCode SDK | Qwen Code SDK |
|------|--------------|----------------|
| **文本搜索** | `client.find.text({ query: { pattern } })` | 由 AI 通过内置工具在 `cwd` 下执行，无直接 SDK API |
| **按名查文件/目录** | `client.find.files({ query: { query, type, directory, limit } })` | 同上 |
| **符号搜索** | `client.find.symbols({ query })` | 同上 |
| **读文件** | `client.file.read({ query: { path } })` | 同上 |
| **文件状态** | `client.file.status({ query? })` | 同上 |

OpenCode 提供独立的「工作区/文件」API，适合做 IDE 式集成（如侧边栏搜索、符号树）。Cowork 若主要做「对话 + 工具由 AI 调」则不必依赖这些；若以后要做深度代码导航，OpenCode 更有优势。

### 2.6 其他

| 能力 | OpenCode SDK | Qwen Code SDK |
|------|--------------|----------------|
| **TUI 控制** | `tui.appendPrompt` / `openHelp` / `openSessions` / `showToast` 等 | 无（面向无头/嵌入场景） |
| **认证** | `auth.set({ path: { id }, body: { type, key } })` | 通过 env / 配置文件 / Qwen Code CLI 配置 |
| **事件流** | `client.event.subscribe()` → 通用服务端事件 | 无独立「事件 API」；通过消息流中的 system/result 等体现 |
| **Config/Project/Path** | `config.get` / `config.providers` / `project.list|current` / `path.get` | 无对应 API；cwd/model 等通过 `options` 传入 |
| **健康检查** | `global.health()` | 无（进程在即健康） |

TUI/Config/Project 对「桌面 App 内嵌 AI」价值有限；事件流在 OpenCode 里更适合做权限请求、进度等，但需自行解析协议。

---

## 三、兼容性与集成成本（针对 Cowork）

### 3.1 运行时与依赖

| 项目 | OpenCode SDK | Qwen Code SDK |
|------|--------------|----------------|
| **Node 版本** | 文档未强调 | Node ≥ 20 |
| **额外进程** | 需要 opencode 服务器（或用户本机已开） | 需要 Qwen Code CLI（≥0.4.0）在 PATH 或 `pathToQwenExecutable` |
| **Electron** | 未说明；通常需处理 fetch/HTTP 与主进程/渲染进程 | 项目已用：FORK_MODE、CLI 路径解析、asar 内 cli.js 等 |
| **打包** | 需打包或引导用户安装 opencode 运行时 | 已处理：electron-builder 打包 `@qwen-code/sdk`、copy-pnpm-deps、cli.js 路径 |

Cowork 已在 Electron 下把 Qwen SDK 的 CLI 路径、环境变量、MCP 配置、权限回调等打通；换 OpenCode 要重新解决「服务由谁起、如何打包、如何配置」以及「会话/权限/事件」的对接。

### 3.2 与现有 Cowork 代码的契合度

- **Runner**：当前基于 `query()` + `createConversationStream()` + `sendMessage(message)`。OpenCode 没有「单次长连接流式多轮」的等价物，需改为「每轮一次 session.prompt() + 事件订阅」，并自己拼装「部分消息」体验。
- **权限**：`createPermissionHandler` 依赖 `canUseTool` 与 `PermissionResult`。OpenCode 的权限是「服务端发请求 → 客户端调 postSessionByIdPermissionsByPermissionId」，需要新的事件解析层和状态机。
- **会话恢复**：Cowork 用 `resume` + `claudeSessionId`。OpenCode 用服务端 session id，概念类似，但恢复流程和存储结构要改。
- **MCP**：当前从配置缓存读 MCP 并传入 `mcpServers`。OpenCode 若 MCP 由服务端配置，则需统一成「服务端配置」或保留「客户端传 MCP」的机制，否则会与现有设置页、~/.qwen 等不一致。

整体看，**继续用 Qwen Code SDK 的兼容成本和风险更小**；换 OpenCode 相当于重做一层「对话 + 权限 + MCP」的适配。

---

## 四、优劣简要总结

### OpenCode SDK

- **优势**：会话/历史/文件/符号 API 丰富；支持结构化输出；可多客户端共享后端；有 TUI、事件流、健康检查等。
- **劣势**：Client-Server 架构与 Cowork 的「单机 Electron + 流式多轮」不一致；无 `canUseTool` 式回调，权限需自己用事件+API 实现；与现有 Runner、权限、MCP、打包流程的兼容成本高。

### Qwen Code SDK

- **优势**：与 Cowork 现有架构一致（单进程、流式、多轮、session_id）；`canUseTool` 与现有权限 UI 完美对接；MCP 支持完善且已接入；Electron 与打包已验证；无额外服务进程。
- **劣势**：无会话/消息/文件/符号等独立 API；无内置「会话总结/撤回/分享」；结构化输出需自行处理；依赖 Qwen Code CLI。

---

## 五、选型建议（针对 Cowork）

- **若目标仍是「桌面 AI 协作助手」、以对话 + 工具审批 + MCP + 现有体验为主**：  
  **建议继续使用 Qwen Code SDK**。理由：  
  1）架构与当前 Runner/权限/MCP 完全匹配，兼容性最好；  
  2）权限与流式多轮能力更强、更贴 UI；  
  3）无需引入并维护 opencode 服务，部署与打包更简单。

- **若未来要做「多端共享同一 AI 后端」或「强依赖服务端会话/文件/符号 API」**：  
  可再评估 OpenCode，作为「第二运行时」或「远程后端」选项，而不是直接替换现有 Qwen 集成。此时需要单独做：opentime 服务生命周期、会话与权限协议对接、以及事件流解析与 UI 的绑定。

- **若仅看「能力广度」**：OpenCode 在会话管理、工作区/文件 API、结构化输出、事件流上更全，但多数能力 Cowork 当前并未用到；Qwen 在「嵌入式、流式、权限、MCP」这条链路上更成熟、与 Cowork 已实现功能对齐更好。

**结论**：在「能力 + 兼容性」综合考量下，**Cowork 继续选用 Qwen Code SDK 更合适**；OpenCode 更适合作为「可选远程后端」或后续扩展时再引入，而不是替代现有 Qwen 集成。
