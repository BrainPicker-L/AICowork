# DtazziCowork 架构概览

## 项目简介

DtazziCowork 是一款基于 Electron + React 的桌面 AI 协作助手，支持多 AI 提供商对话、MCP 工具集成、向量记忆系统与钉钉消息联动。

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面运行时 | Electron 39 |
| UI 框架 | React 19 + TypeScript 5.9 |
| 样式 | Tailwind CSS 4 |
| 状态管理 | Zustand 5 |
| 构建工具 | Vite 7 + electron-builder |
| AI SDK | @qwen-code/sdk |
| 本地存储 | better-sqlite3 |
| MCP 协议 | @modelcontextprotocol/sdk |
| 即时通讯 | dingtalk-stream |

## 架构分层

```
┌─────────────────────────────────────┐
│           Renderer (React)          │
│  Pages / Components / Hooks / Store │
├─────────────────────────────────────┤
│            IPC Bridge               │
├─────────────────────────────────────┤
│          Main Process (Node)        │
│  Services / Handlers / MCP / Memory │
├─────────────────────────────────────┤
│          Storage (SQLite)           │
└─────────────────────────────────────┘
```

### 渲染进程（Renderer）

- **Pages**: 页面组件，如 SettingsPage
- **Components**: 可复用 UI 组件
- **Store**: Zustand 状态管理（agents、mcp、dingtalk、memory 等）
- **Hooks**: 自定义 React Hooks
- **i18n**: 国际化支持（en/de/es/fr/ja/ko）

### 主进程（Main）

- **handlers/**: IPC 通道处理，连接渲染进程与主进程
- **libs/**: 核心库，包含 AI API 适配器和会话运行器
- **services/**: 业务服务，如钉钉消息服务
- **mcp-servers/**: MCP 协议服务端集成，含向量记忆服务
- **storage/**: 基于 SQLite 的持久化层
- **managers/**: 资源管理器

### 进程间通信

渲染进程通过 Electron 的 IPC 机制与主进程通信，所有 AI 调用、存储操作和外部服务交互均由主进程处理，渲染进程仅负责 UI 展示与状态管理。

## 关键模块

- **多 AI 提供商**: 通过 api-adapters 统一适配 OpenAI、Anthropic、Qwen 等不同 AI 接口
- **向量记忆**: 基于 SQLite 的本地向量存储，为对话提供上下文记忆
- **MCP 工具**: 支持通过 MCP 协议扩展 AI 能力
- **钉钉集成**: 通过 dingtalk-stream 实现消息收发
- **语音输入**: 通过 Fn 键触发语音录入，启动后台 AI 任务