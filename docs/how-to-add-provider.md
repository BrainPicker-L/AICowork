# 添加自定义厂商配置教程

> **作者**: Alan
> **版权**: AGCPA v3.0
> **创建日期**: 2026-01-20
> **邮箱**: None

---

## 概述

本教程介绍如何为 Agent Cowork 添加自定义 AI 厂商配置。支持两种方式：
1. **直接修改代码** - 添加永久厂商配置
2. **环境变量配置** - 无需修改代码的灵活方式

---

## 方法一：直接修改代码（永久配置）

### 步骤 1：编辑 `src/electron/config/constants.ts`

在 `API_PATH_PREFIXES` 中添加路径前缀：

```typescript
export const API_PATH_PREFIXES: Record<ApiProvider, string> = {
  // ... 现有厂商 ...

  // 添加新厂商
  newai: '/v2/anthropic/messages',  // 路径前缀
};
```

在 `PROVIDER_BASE_URLS` 中添加 Base URL：

```typescript
export const PROVIDER_BASE_URLS: Record<ApiProvider, string> = {
  // ... 现有厂商 ...

  // 添加新厂商
  newai: 'https://api.newai.com',
};
```

### 步骤 2：在 ApiProvider 类型中添加新厂商

```typescript
export type ApiProvider =
  | 'anthropic'
  | 'zhipu'
  // ... 现有厂商 ...
  | 'newai';  // 添加新厂商
```

### 步骤 3：重新编译打包

```bash
bun run transpile:electron
npx electron-builder --win --x64
```

---

## 方法二：环境变量配置（推荐）

无需修改代码，通过 `.env` 文件或系统环境变量添加配置。

### 步骤 1：创建或编辑 `.env` 文件

在项目根目录创建 `.env` 文件：

```bash
# 格式：CUSTOM_API_BASE_URL_<厂商名>=https://域名
CUSTOM_API_BASE_URL_newai=https://api.newai.com

# 可选：自定义路径前缀（如果不配置则使用默认 /v1/messages）
CUSTOM_API_PATH_PREFIX_newai=/v2/anthropic/messages
```

### 步骤 2：使用自定义厂商

在应用界面选择 API 类型时，输入 `newai` 作为厂商名称。

---

## 完整示例

### 示例 1：添加新的国内厂商 "云服务器"

```bash
# .env 文件
CUSTOM_API_BASE_URL_cloudserver=https://cloud-server.ai
CUSTOM_API_PATH_PREFIX_cloudserver=/api/v1/chat/completions
```

### 示例 2：添加私有部署的 API

```bash
# .env 文件
CUSTOM_API_BASE_URL_myapi=https://internal.company.com
CUSTOM_API_PATH_PREFIX_myapi=/internal/anthropic
```

### 示例 3：添加中转服务

```bash
# .env 文件
CUSTOM_API_BASE_URL_proxy=https://proxy.example.com
CUSTOM_API_PATH_PREFIX_proxy=/anthropic/v1
```

---

## 环境变量命名规则

- **厂商名**：自动转换为小写，支持字母、数字、下划线
- **路径前缀**：必须以 `/` 开头，无需在配置中添加 `v1/messages`（代理会自动处理）
- **Base URL**：完整的 API 域名，包含协议（https:// 或 http://）

## 验证配置

启动应用后，在日志中查看是否加载了自定义配置：

```
[Constants] 已加载自定义厂商映射: {
  pathPrefixes: { newai: '/v2/anthropic/messages' },
  baseUrls: { newai: 'https://api.newai.com' }
}
```

## 常见问题

### Q：配置没有生效？
- 检查厂商名是否正确（会转为小写）
- 确保 `.env` 文件在项目根目录
- 重启应用使配置生效

### Q：如何知道 API 需要什么路径？
- 查看 API 文档中的 `/messages` 端点路径
- 某些 API 可能使用 `/chat/completions` 格式
- 根据实际 API 格式配置路径前缀

### Q：可以覆盖内置厂商的配置吗？
- 可以，环境变量配置会覆盖 `constants.ts` 中的默认配置
- 这允许为内置厂商使用自定义的端点地址

---

## 技术说明

- **自动检测机制**：程序会测试 `/count_tokens` 端点，不可用时自动启用代理
- **路径拼接规则**：`baseURL + pathPrefix` 构成最终请求 URL
- **代理服务器**：监听本地端口 35721，处理 `/count_tokens` 并转发 `/messages` 请求
- **Token 计算**：使用 `@anthropic-ai/tokenizer` 精确计算或估算

---

## 附录：内置厂商列表

### 国内厂商
- 智谱 AI (zhipu)
- DeepSeek (deepseek)
- 阿里云 (alibaba) - 使用 `/compatible-mode` 路径
- 七牛云 AI (qiniu)
- 月之暗面 (moonshot)
- 华为云 (huawei)
- MiniMax (minimax)
- 百川智能 (baichuan)
- 腾讯混元 (hunyuan)
- 百度文心 (wenxin)
- 等等...

### 国外厂商
- OpenAI (openai)
- Google (google)
- Cohere (cohere)
- Mistral (mistral)
- Meta (meta)
- 等等...

### 代理/中转服务
- N1N.AI (n1n)
- OpenRouter (openrouter)
- 等等...

---

## 更新日志

- **v1.0** (2026-01-20) - 初始版本，支持环境变量配置
