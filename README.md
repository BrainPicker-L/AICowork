# AICowork

<div align="center">

![AICowork Logo](https://img.shields.io/badge/AICowork-v0.1.0-blue)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE.txt)
[![Electron](https://img.shields.io/badge/Electron-39.2.7-47848F?logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)

**智能协作助手 - 支持多厂商 AI API、记忆系统和 MCP 协议**

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [开发指南](#-开发指南) • [文档](#-文档) • [贡献](#-贡献)

</div>

---

## 📖 简介

AICowork 是一款基于 [@qwen-code/sdk](https://github.com/QwenLM/qwen-code) 的现代化 AI 桌面应用，旨在为开发者和创作者提供强大的 AI 协作能力。

### 核心优势

- 🎯 **开箱即用** - 无需复杂配置，快速上手
- 🔌 **多 API 支持** - 支持 OpenAI、Anthropic、Qwen 等多家 AI 服务商
- 🧠 **智能记忆** - 基于 Memvid 的向量记忆系统，让 AI 记住上下文
- 🛠️ **MCP 协议** - 支持 Model Context Protocol，可扩展工具和服务
- 🎨 **现代化 UI** - 基于 React 19 和 Tailwind CSS 4 的流畅界面
- 🌍 **国际化** - 支持中英文切换
- 🔒 **隐私安全** - 数据本地存储，保护用户隐私

---

## ✨ 功能特性

### 🤖 AI 对话

- **流式响应** - 实时显示 AI 回复，提供流畅的对话体验
- **多模型支持** - 支持 GPT-4、Claude 3.5、Qwen 等主流模型
- **会话管理** - 多会话并行，历史记录持久化
- **权限控制** - 精细化的文件操作权限管理

### 🧠 记忆系统

- **向量存储** - 基于 Memvid SDK 的高效向量数据库
- **上下文记忆** - 自动记录和检索相关对话历史
- **智能召回** - 根据当前对话智能检索相关记忆

### 🔧 扩展能力

- **MCP 服务器** - 支持自定义 MCP 服务器集成
- **技能系统** - 可扩展的技能插件机制
- **斜杠命令** - 快捷命令支持（开发中）

### 🎨 用户体验

- **响应式设计** - 适配不同屏幕尺寸
- **暗色模式** - 保护眼睛的暗色主题
- **快捷键** - 提高操作效率的键盘快捷键
- **状态指示** - 实时显示会话状态和响应进度

---

## 🚀 快速开始

### 系统要求

- **操作系统**: macOS 10.15+, Windows 10+, Linux
- **Node.js**: 18.0 或更高版本
- **包管理器**: pnpm (推荐) 或 npm

### 安装

#### 方式一：下载预编译版本（推荐）

前往 [Releases](https://github.com/BrainPicker-L/AICowork/releases) 页面下载适合你系统的安装包：

- **macOS**: `AICowork-{version}-mac-arm64.dmg` (Apple Silicon) 或 `AICowork-{version}-mac-x64.dmg` (Intel)
- **Windows**: `AICowork-{version}-win-x64.exe`
- **Linux**: `AICowork-{version}-linux-x64.AppImage`

#### 方式二：从源码构建

```bash
# 1. 克隆仓库
git clone https://github.com/BrainPicker-L/AICowork.git
cd AICowork

# 2. 安装依赖
pnpm install

# 3. 启动开发模式
pnpm dev

# 4. 或构建生产版本
pnpm build
pnpm dist
```

### 配置 API

首次启动时，应用会引导你配置 AI API：

1. 点击右上角的设置图标
2. 选择 API 提供商（OpenAI / Anthropic / Qwen）
3. 填入 API Key 和配置信息
4. 保存并开始使用

**支持的 API 格式：**

```bash
# OpenAI 格式
API Key: sk-xxx
Base URL: https://api.openai.com/v1
Model: gpt-4

# Anthropic 格式
Auth Token: sk-ant-xxx
Base URL: https://api.anthropic.com
Model: claude-3-5-sonnet-20241022

# Qwen 格式
API Key: sk-xxx
Base URL: https://dashscope.aliyuncs.com/compatible-mode/v1
Model: qwen-max
```

---

## 🛠️ 开发指南

### 技术栈

```
前端层:
├─ React 19.2.3          # UI 框架（并发渲染）
├─ TypeScript 5.9        # 类型安全
├─ Tailwind CSS 4.1      # 原子化 CSS
├─ Zustand 5.0          # 状态管理
└─ i18next 25.7         # 国际化

桌面层:
├─ Electron 39.2.7      # 跨平台桌面框架
├─ Vite 7.3             # 构建工具
└─ electron-builder     # 打包工具

AI 层:
├─ @qwen-code/sdk 0.1.3 # AI 对话核心
├─ @memvid/sdk 2.0.120  # 向量记忆存储
└─ @modelcontextprotocol/sdk # MCP 协议支持
```

### 项目结构

```
AICowork/
├─ src/
│  ├─ electron/              # Electron 主进程
│  │  ├─ main.ts            # 应用入口
│  │  ├─ ipc-handlers.ts    # IPC 通信处理
│  │  ├─ libs/              # 核心库
│  │  ├─ managers/          # 管理器
│  │  ├─ services/          # 服务层
│  │  ├─ storage/           # 存储层
│  │  └─ utils/             # 工具函数
│  ├─ ui/                   # React 渲染进程
│  │  ├─ App.tsx           # 应用根组件
│  │  ├─ pages/            # 页面组件
│  │  ├─ components/       # UI 组件
│  │  ├─ store/            # Zustand 状态
│  │  └─ i18n/             # 国际化配置
│  ├─ shared/              # 共享代码
│  └─ types/               # TypeScript 类型定义
├─ docs/                   # 文档
├─ tests/                  # 测试文件
└─ package.json
```

### 开发命令

```bash
# 开发模式（同时启动 Vite 和 Electron）
pnpm dev

# 仅启动 Vite 开发服务器
pnpm dev:vite

# 仅启动 Electron
pnpm dev:electron

# 运行测试
pnpm test

# 运行测试（监听模式）
pnpm test:watch

# 代码检查
pnpm lint

# 构建生产版本
pnpm build

# 打包应用
pnpm dist

# 平台特定打包
pnpm dist:mac-arm64   # macOS Apple Silicon
pnpm dist:mac-x64     # macOS Intel
pnpm dist:win         # Windows
pnpm dist:linux       # Linux
```

### 添加 MCP 服务器

1. 在设置页面点击"MCP 服务器"
2. 点击"添加服务器"
3. 填写服务器配置：
   ```json
   {
     "command": "node",
     "args": ["/path/to/server.js"],
     "env": {
       "API_KEY": "your-key"
     }
   }
   ```
4. 保存并启用

### 开发技能插件

技能系统允许你扩展 AI 的能力。参考 `docs/开发者文档.md` 了解详细的技能开发指南。

---

## 📚 文档

- [开发者文档](docs/开发者文档.md) - 详细的技术文档和 API 参考
- [AGENTS.md](AGENTS.md) - AI 编码助手使用指南
- [更新日志](CHANGELOG.md) - 版本更新记录

---

## 🤝 贡献

我们欢迎所有形式的贡献！

### 如何贡献

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

### 开发规范

- 遵循 TypeScript 和 ESLint 规范
- 编写清晰的提交信息
- 为新功能添加测试
- 更新相关文档

---

## 📄 许可证

本项目采用 [MIT License](LICENSE.txt) 开源协议。

---

## 🙏 致谢

- [@qwen-code/sdk](https://github.com/QwenLM/qwen-code) - 核心 AI SDK
- [@memvid/sdk](https://github.com/memvid/memvid) - 向量记忆系统
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP 协议支持
- [Electron](https://www.electronjs.org/) - 跨平台桌面框架
- [React](https://react.dev/) - UI 框架

---

## 📞 联系方式

- **问题反馈**: [GitHub Issues](https://github.com/BrainPicker-L/AICowork/issues)
- **功能建议**: [GitHub Discussions](https://github.com/BrainPicker-L/AICowork/discussions)
- **文档反馈**: [问卷调查](https://docs.qq.com/form/page/DRm5uV1pSZFB3VHNv)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个 Star！**

Made with ❤️ by [BrainPicker-L](https://github.com/BrainPicker-L)

</div>
