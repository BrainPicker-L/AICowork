# DtazziCowork 项目分析

## 项目概览

| 属性 | 值 |
|------|-----|
| **项目名** | DtazziCowork (原名 AiCowork) |
| **版本** | v0.1.1 |
| **类型** | Electron 桌面应用 |
| **许可证** | MIT |
| **主仓库** | https://github.com/BrainPicker-L/DtazziCowork |

**一句话描述：** 基于 @qwen-code/sdk 的 AI 智能协作桌面应用，支持多厂商 AI API、向量记忆系统、MCP 协议扩展和钉钉机器人集成。

---

## 技术栈

### 前端渲染层

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2.3 | UI 框架（并发渲染） |
| TypeScript | 5.9 | 类型安全 |
| Tailwind CSS | 4.1 | 原子化样式 |
| Zustand | 5.0 | 状态管理 |
| i18next | 25.7 | 国际化（中/英文） |
| Lucide React | 0.562 | 图标库 |
| Radix UI | latest | 无障碍基础组件 |
| React Markdown | 10.1 | Markdown 渲染 |
| highlight.js | 11.11 | 代码高亮 |

### 桌面层

| 技术 | 版本 | 用途 |
|------|------|------|
| Electron | 39.2.7 | 跨平台桌面框架 |
| Vite | 7.3 | 构建工具 |
| electron-builder | 26.4 | 打包分发 |

### AI 与后端层

| 技术 | 版本 | 用途 |
|------|------|------|
| @qwen-code/sdk | 0.1.5-preview.1 | 核心 AI 对话 SDK |
| @modelcontextprotocol/sdk | 1.25.3 | MCP 协议支持 |
| @anthropic-ai/tokenizer | 0.0.4 | Token 计数 |
| dingtalk-stream | 2.1.4 | 钉钉机器人消息流 |
| better-sqlite3 | 12.6.2 | 本地 SQLite 存储 |
| winston | 3.19 | 日志系统 |
| zod | 4.3.5 | Schema 校验 |

### 开发工具

| 技术 | 版本 | 用途 |
|------|------|------|
| Vitest | 4.0.17 | 单元测试框架 |
| Testing Library | 16.3 | 组件测试 |
| ESLint | 9.39 | 代码规范 |
| Happy DOM | 20.3 | DOM 模拟 |

---

## 项目结构

```
DtazziCowork/
├── src/
│   ├── electron/              # Electron 主进程 (TypeScript)
│   │   ├── main/              # 主进程入口
│   │   │   └── main.ts        # Electron 应用启动
│   │   ├── ipc-handlers.ts    # IPC 通信处理
│   │   ├── preload.cts        # 预加载脚本
│   │   ├── config/            # 配置管理
│   │   ├── errors/            # 错误定义
│   │   ├── handlers/          # 请求处理器
│   │   ├── libs/              # 核心库
│   │   │   ├── api-adapter.ts         # API 适配器基类
│   │   │   ├── api-adapters/          # 各厂商 API适配器
│   │   │   ├── runner/                # AI 会话运行器
│   │   │   └── user-input-queue.ts    # 用户输入队列
│   │   ├── managers/          # 管理器
│   │   │   ├── mcp-server-manager.ts  # MCP 服务器管理
│   │   │   └── sdk-config-cache.ts    # SDK 配置缓存
│   │   ├── mcp-servers/       # MCP 服务器实现
│   │   │   └── memory/               # 记忆 MCP 服务器
│   │   ├── middleware/        # 中间件
│   │   ├── services/          # 服务层
│   │   │   ├── claude-settings.ts     # Claude 配置
│   │   │   ├── dingtalk-service.ts    # 钉钉机器人服务 (31KB)
│   │   │   ├── qwen-settings.ts       # Qwen 配置
│   │   │   ├── language-preference-store.ts  # 语言偏好
│   │   │   └── voice-service.ts       # 语音录入服务
│   │   ├── storage/           # 存储层 (基于 better-sqlite3)
│   │   │   ├── agents-store.ts        # Agent 存储
│   │   │   ├── config-store.ts        # 配置存储 (35KB)
│   │   │   ├── dingtalk-store.ts      # 钉钉配置存储
│   │   │   ├── hooks-store.ts         # Hooks 存储
│   │   │   ├── jarvis-store.ts        # Jarvis 存储
│   │   │   ├── mcp-store.ts           # MCP 服务器存储
│   │   │   ├── memory-store.ts        # 记忆存储
│   │   │   ├── output-store.ts        # 输出存储
│   │   │   ├── permissions-store.ts   # 权限存储
│   │   │   ├── rules-store.ts         # 规则存储
│   │   │   ├── session-store.ts       # 会话存储
│   │   │   ├── skills-store.ts        # 技能存储
│   │   │   └── theme-store.ts         # 主题存储
│   │   ├── utils/             # 工具函数
│   │   ├── api-tester.ts      # API 测试工具
│   │   ├── voice-api-tester.ts # 语音 API 测试
│   │   ├── error-handling.ts  # 错误处理
│   │   ├── logger.ts          # 日志系统 (8KB)
│   │   ├── pathResolver.ts    # 路径解析
│   │   └── util.ts            # 通用工具
│   │
│   ├── ui/                    # React 渲染进程
│   │   ├── App.tsx            # 应用根组件 (23KB)
│   │   ├── main.tsx           # React 入口
│   │   ├── components/        # UI 组件
│   │   │   ├── SettingsModal.tsx      # 设置弹窗 (41KB)
│   │   │   ├── EventCard.tsx          # 事件卡片 (18KB)
│   │   │   ├── PromptInput.tsx        # 提示输入框 (15KB)
│   │   │   ├── Sidebar.tsx            # 侧边栏 (13KB)
│   │   │   ├── DecisionPanel.tsx      # 决策面板
│   │   │   ├── ErrorBoundary.tsx      # 错误边界
│   │   │   ├── StartSessionModal.tsx  # 启动会话弹窗
│   │   │   ├── SessionStatusIndicator.tsx # 会话状态指示器
│   │   │   ├── DeletionConfirmDialog.tsx  # 删除确认
│   │   │   ├── LanguageSwitcher.tsx   # 语言切换器
│   │   │   └── ...                    # 图标组件
│   │   ├── pages/
│   │   │   └── SettingsPage/          # 设置页面
│   │   ├── store/             # Zustand 状态管理
│   │   ├── hooks/             # React Hooks
│   │   ├── i18n/              # 国际化配置
│   │   ├── render/            # 渲染相关
│   │   ├── config/            # UI 配置
│   │   ├── utils/             # 工具函数
│   │   ├── App.css / index.css # 样式
│   │   ├── electron.d.ts      # Electron 类型声明
│   │   └── vite-env.d.ts      # Vite 环境声明
│   │
│   ├── shared/                # 主进程与渲染进程共享代码
│   │   └── deletion-detection.ts  # 删除检测逻辑
│   │
│   └── types/                 # 全局 TypeScript 类型
│
├── tests/
│   ├── unit/                  # 单元测试
│   │   ├── config-store.test.ts
│   │   ├── dingtalk-service.test.ts
│   │   ├── dingtalk-store.test.ts
│   │   ├── mcp-store.test.ts
│   │   └── skills-store.test.ts
│   ├── integration/           # 集成测试
│   │   ├── optimization-verification.test.ts
│   │   ├── ipc-handlers.test.ts
│   │   └── settings-api.test.ts
│   ├── electron/              # Electron 特定测试
│   │   ├── type-guards.test.ts
│   │   ├── config-validation.test.ts
│   │   └── api-adapter.test.ts
│   ├── security/              # 安全测试
│   │   └── security.test.ts
│   ├── shared/                # 共享代码测试
│   │   └── deletion-detection.test.ts
│   ├── components/            # 组件测试
│   ├── benchmarks/            # 性能基准测试
│   │   └── mcp-server-manager.bench.ts
│   └── setup.ts               # 测试全局配置
│
├── docs/                      # 文档
│   ├── 开发者文档.md            # 开发者技术文档 (23KB)
│   ├── DESIGN_MEMORY_FEATURE.md     # 记忆功能设计
│   ├── MEMORY_FAQ_AND_FIX.md        # 记忆 FAQ
│   ├── MEMORY_TECHNICAL_SPEC.md     # 记忆技术规格
│   ├── OpenCode与Qwen-Code-SDK对比分析.md  # SDK 对比分析
│   ├── css-theme-guide.md           # CSS 主题指南
│   ├── dingtalk-setup-guide.md      # 钉钉配置指南
│   ├── SETTINGS_NAVIGATION_REDESIGN.md  # 设置导航重设计
│   ├── plans/                       # 开发计划
│   └── 语音录入创建任务-方案设计.md     # 语音录入方案
│
├── scripts/                   # 构建脚本
│   └── copy-pnpm-deps-for-asar.cjs
│
├── public/                    # 静态资源
├── package.json
├── vite.config.ts
├── electron-builder.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── eslint.config.js
├── vitest.config.ts
└── .gitignore
```

---

## 核心模块分析

### 1. AI 对话引擎

**核心依赖：** `@qwen-code/sdk`

- 通过 `libs/api-adapter.ts` 定义统一 API 适配器接口
- `libs/api-adapters/` 目录下实现不同厂商的适配器
- `libs/runner/` 负责启动和管理 AI 会话进程
- 支持流式响应、多模型切换、会话并行

### 2. 多厂商 API 支持

支持以下 AI 服务商：

| 厂商 | 配置文件 | 状态 |
|------|----------|------|
| OpenAI | qwen-settings.ts | 已实现 |
| Anthropic (Claude) | claude-settings.ts | 已实现 |
| Qwen (通义千问) | qwen-settings.ts | 已实现 |

### 3. 记忆系统 (Memory)

**核心依赖：** 向量存储 + MCP 协议

- `storage/memory-store.ts` - 记忆数据持久化
- `mcp-servers/memory/` - 记忆 MCP 服务器
- `docs/DESIGN_MEMORY_FEATURE.md` - 设计文档
- 功能：上下文记忆、智能召回、向量检索

### 4. MCP 协议扩展

**核心依赖：** `@modelcontextprotocol/sdk`

- `storage/mcp-store.ts` - MCP 服务器配置存储
- `managers/mcp-server-manager.ts` - MCP 服务器生命周期管理
- 支持自定义 MCP 服务器的添加、启用、禁用

### 5. 钉钉集成

**核心依赖：** `dingtalk-stream`

- `services/dingtalk-service.ts` - 钉钉消息收发服务 (最大文件 31KB)
- `storage/dingtalk-store.ts` - 钉钉配置持久化
- 支持多机器人配置、消息流式处理

### 6. 语音录入

- `services/voice-service.ts` - 语音处理服务
- `storage/voice-store.ts` - 语音状态管理
- `voice-api-tester.ts` - 语音 API 测试工具
- 通过 Fn 键触发语音录入，直接启动后台任务
- 详细方案文档：`docs/语音录入创建任务-方案设计.md`

### 7. 存储层

所有数据使用 `better-sqlite3` 本地存储，包括：

| Store | 职责 |
|-------|------|
| `config-store` | 应用主配置 (最大, 35KB) |
| `session-store` | 会话历史 |
| `agents-store` | Agent 配置 |
| `mcp-store` | MCP 服务器配置 |
| `skills-store` | 技能插件 |
| `memory-store` | 向量记忆 |
| `permissions-store` | 文件操作权限 |
| `rules-store` | 规则配置 |
| `theme-store` | 主题设置 |
| `dingtalk-store` | 钉钉配置 |
| `hooks-store` | Hooks 存储 |
| `jarvis-store` | Jarvis 存储 |
| `output-store` | 输出数据 |

### 8. 状态管理

**渲染进程：** Zustand stores

- 多个独立 store 管理不同功能域
- 通过 IPC 与主进程存储同步

### 9. 国际化

- 基于 `i18next` + `react-i18next`
- 支持中文/英文切换
- 配置存储在 `language-preference-store`

### 10. 主题系统

- 基于 Tailwind CSS 4
- 支持亮色/暗色主题切换
- 详细指南：`docs/css-theme-guide.md`

---

## 关键数据流

```
用户输入 (UI)
    │
    ▼
PromptInput.tsx ──IPC──> ipc-handlers.ts
                              │
                              ▼
                        libs/runner/
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
               qwen-adapter  claude-adapter  openai-adapter
                    │
                    ▼
              @qwen-code/sdk
                    │
                    ▼
              流式响应 ──IPC──> EventCard.tsx (显示)
```

---

## 测试体系

| 类型 | 位置 | 覆盖范围 |
|------|------|----------|
| 单元测试 | `tests/unit/` | 存储层、服务层 |
| 集成测试 | `tests/integration/` | IPC 处理器、设置 API、优化验证 |
| Electron 测试 | `tests/electron/` | 类型守卫、配置校验、API适配器 |
| 安全测试 | `tests/security/` | 安全相关 |
| 组件测试 | `tests/components/` | React 组件 |
| 性能基准 | `tests/benchmarks/` | MCP 服务器管理 |

---

## 构建与部署

### 开发

```bash
pnpm dev           # 同时启动 Vite + Electron
pnpm dev:vite      # 仅 Vite
pnpm dev:electron  # 仅 Electron
```

### 生产构建

```bash
pnpm build         # TypeScript 编译 + Vite 构建
pnpm dist          # 完整构建 + 打包
```

### 平台打包

| 命令 | 目标平台 |
|------|----------|
| `pnpm dist:mac-arm64` | macOS Apple Silicon |
| `pnpm dist:mac-x64` | macOS Intel |
| `pnpm dist:win` | Windows x64 |
| `pnpm dist:linux` | Linux x64 |

### 依赖管理

- 使用 `pnpm` workspace
- ASAR 打包时需要特殊处理 pnpm 依赖 (`scripts/copy-pnpm-deps-for-asar.cjs`)
- `.npmrc` 配置了 npm 源

---

## Git 历史分析

| Commit | 说明 |
|--------|------|
| `8e64ad1` | 增加 opencode 和 qwen sdk 对比方案 |
| `8e784f2` | 修复程序坞图标消失与 Fn 录音结果为空 |
| `aaf77c3` | 增加语音输入能力 (Fn 键) |
| `1bb9f9a` | 项目名 AiCowork → DtazziCowork |
| `bc2f9bd` | Merge PR #7 钉钉集成 |
| `1f3cdd2` | 添加钉钉机器人配置文档 |
| `8e4877b` | 集成钉钉多机器人消息收发 |
| `d83fd18` | Merge PR #6 暗色主题 |
| `a8448b9` | 添加暗色主题支持 |

---

## 项目优势

1. **多厂商兼容** - 通过适配器模式支持 OpenAI/Anthropic/Qwen
2. **本地优先** - 所有数据使用 SQLite 本地存储，隐私安全
3. **可扩展架构** - MCP 协议 + 技能系统支持功能扩展
4. **企业集成** - 内置钉钉机器人支持
5. **完整测试** - 覆盖单元、集成、安全、组件、性能多维度
6. **现代化技术栈** - React 19 + TypeScript 5.9 + Vite 7 + Electron 39

## 潜在关注点

1. **依赖体积** - Electron + SQLite + AI SDK 导致包体积较大
2. **pnpm + ASAR** - 需要特殊脚本处理 pnpm 符号链接与 ASAR 打包的兼容性
3. **语音录入** - 目前仅开发模式可用，Mac 软件包形态未完全测试
4. **记忆系统** - 依赖 Memvid，需关注向量存储性能
5. **Beta 阶段** - v0.1.1，核心功能仍在迭代中
