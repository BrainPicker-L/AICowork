# 第三方 API 兼容解决方案

**@author**      Alan
**@copyright**   AGCPA v3.0
**@created**     2026-01-20
**@Email**       None
**@version**     1.0.0

---

## 一、问题分析

### 1.1 现象描述

- **测试连接成功**：第三方 API（DeepSeek、阿里云等）连接测试通过
- **实际使用失败**：AI 会话无响应，日志显示 404 错误
- **智谱 API 正常**：只有智谱 API 可以正常工作

### 1.2 根本原因

通过分析用户提供的错误日志，发现问题根源：

```json
{
  "error": {
    "message": "Invalid URL (POST /v1/messages/count_tokens)",
    "type": "invalid_request_error"
  }
}
```

**关键发现**：

1. **SDK 调用流程**：
   ```
   ① POST /v1/messages/count_tokens (计算 token 数)
   ② POST /v1/messages (实际发送消息)
   ```

2. **第三方 API 兼容性**：
   | 端点 | Anthropic | 智谱 | DeepSeek/阿里云 |
   |------|-----------|------|----------------|
   | `/v1/messages` | ✅ | ✅ | ✅ |
   | `/v1/messages/count_tokens` | ✅ | ✅ | ❌ |

3. **为何测试成功但使用失败**：
   - **测试连接**：直接调用 `POST /v1/messages` → 成功
   - **实际使用**：SDK 先调用 `/count_tokens` → 404 失败

### 1.3 为什么智谱能工作？

智谱 AI 的 API 实现了完整的 Anthropic API 兼容层，包括 `/count_tokens` 端点。

---

## 二、解决方案

### 2.1 架构设计

创建**本地代理服务器**，将第三方 API 伪装成完整的 Anthropic API：

```
┌─────────────────────────────────────────────────────────────────┐
│                         Claude SDK                              │
│  (认为自己在调用官方 Anthropic API)                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    本地代理服务器 (127.0.0.1:35721)              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ① /count_tokens     → 返回估算值 (不转发)                  │ │
│  │ ② /messages         → 转发到第三方 API                      │ │
│  │ ③ 处理流式响应 (SSE)                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    第三方 API                                   │
│  (DeepSeek / 阿里云 / 七牛 / 月之暗面 等)                       │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 代理服务器功能

#### 功能 1：处理 /count_tokens 请求

```typescript
// 不转发请求，直接返回估算的 token 数量
POST /v1/messages/count_tokens

Request:
{
  "model": "deepseek-chat",
  "messages": [...],
  "system": "...",
  "tools": [...]
}

Response:
{
  "input_tokens": 150,    // 估算值
  "cache_read_input_tokens": 0,
  "cache_creation_input_tokens": 0
}
```

**Token 估算算法**：
- 中文：约 0.7 字符/token
- 英文：约 4 字符/token
- 代码：约 3 字符/token
- 系统提示词：额外计算

#### 功能 2：转发 /messages 请求

```typescript
// 转发到第三方 API，保持请求格式不变
POST /v1/messages → 第三方 API /v1/messages
```

#### 功能 3：处理流式响应

```typescript
// 支持 Server-Sent Events (SSE) 流式响应
if (request.stream === true) {
  // 管道传输流式数据
  response.body.pipeTo(response);
}
```

---

## 三、实现细节

### 3.1 参考实现：AIClientAPI 项目

项目中的 `AIClientAPI` 文件夹是一个完整的 API 代理转换实现，关键发现：

**核心架构**：
- `api-server.js` - HTTP 服务器入口
- `request-handler.js` - 请求路由，**拦截 `/count_tokens` 请求**
- `claude/claude-kiro.js` - Claude API 适配器，包含 token 计算

**关键代码**（request-handler.js 165-194 行）：
```javascript
// 处理 /count_tokens 请求
if (path.includes('/count_tokens') && method === 'POST') {
    // 1. 优先使用精确计算
    if (apiService.countTokens) {
        const result = apiService.countTokens(body);
        res.end(JSON.stringify(result));
    }
    // 2. 后备：估算 token
    else if (apiService.estimateInputTokens) {
        res.end(JSON.stringify({ input_tokens: apiService.estimateInputTokens(body) }));
    }
    // 3. 兜底：返回 0
    else {
        res.end(JSON.stringify({ input_tokens: 0 }));
    }
}
```

**Token 计算**（使用 `@anthropic-ai/tokenizer`）：
```javascript
import { countTokens } from '@anthropic-ai/tokenizer';

countTextTokens(text) {
    try {
        return countTokens(text);  // 精确计算
    } catch {
        return Math.ceil(text.length / 4);  // 估算兜底
    }
}
```

### 3.2 深入分析：完整的请求处理流程

通过深入研究 AIClientAPI 项目，发现完整的请求处理流程如下：

**流程图**：
```
HTTP 请求
    ↓
request-handler.js (路由层)
    ├─→ /count_tokens  → 直接返回估算值（不转发）
    └─→ /messages     → handleContentGenerationRequest
         ↓
    common.js (转换层)
    ├─→ extractModelAndStreamInfo
    ├─→ convertData (协议转换)
    └─→ handleStreamRequest / handleUnaryRequest
         ↓
    claude-core.js (API 服务层)
    └─→ callApi (转发到第三方)
         ↓
    ClaudeConverter (响应转换层)
    └─→ convertResponse / convertStreamChunk
         ↓
    返回给 SDK
```

**关键发现**：

1. **协议转换器工厂模式**（convert.js）：
```javascript
// ConverterFactory 根据协议类型选择转换器
const converter = ConverterFactory.getConverter(fromProtocol);

// 转换类型
- 'request':       请求转换
- 'response':      响应转换
- 'streamChunk':   流式块转换
- 'modelList':     模型列表转换
```

2. **Claude 流式响应格式**（ClaudeConverter.js）：
```javascript
// Claude 流式事件类型
- message_start         // 流开始
- content_block_start   // 内容块开始
- content_block_delta   // 内容增量
- content_block_stop    // 内容块结束
- message_delta         // 消息元数据（usage）
- message_stop          // 流结束
```

3. **完整的 countTokens 实现**（claude-kiro.js 1787-1846）：
```javascript
countTokens(requestBody) {
    let totalTokens = 0;

    // 1. 系统提示词
    if (requestBody.system) {
        totalTokens += this.countTextTokens(requestBody.system);
    }

    // 2. 消息内容（支持多种类型）
    if (requestBody.messages) {
        for (const message of requestBody.messages) {
            // - text: 普通文本
            // - tool_use: 工具调用
            // - tool_result: 工具结果
            // - image: 图片（固定 1600 tokens）
            // - document: 文档
        }
    }

    // 3. 工具定义
    if (requestBody.tools) {
        for (const tool of requestBody.tools) {
            totalTokens += this.countTextTokens(tool.name);
            totalTokens += this.countTextTokens(tool.description);
            totalTokens += this.countTextTokens(JSON.stringify(tool.input_schema));
        }
    }

    return { input_tokens: totalTokens };
}
```

### 3.3 文件结构

```
src/electron/libs/
├── api-proxy.ts           # 代理服务器核心实现
├── claude-settings.ts     # 集成代理到环境变量
├── token-counter.ts       # Token 估算工具（使用 @anthropic-ai/tokenizer）
└── config-store.ts        # API 配置存储
```

### 3.4 核心代码结构

#### api-proxy.ts

```typescript
// 全局服务器实例
let proxyServer: http.Server | null = null;

// 启动代理服务器
export function startApiProxy(config: ApiConfig): string {
  const port = 35721;
  const server = http.createServer((req, res) => {
    if (req.url === '/v1/messages/count_tokens') {
      handleCountTokens(req, res);  // 不转发，返回估算值
    } else if (req.url === '/v1/messages') {
      handleMessages(req, res, config);  // 转发到第三方
    } else {
      res.writeHead(404).end('Not Found');
    }
  });

  server.listen(port, '127.0.0.1');
  return `http://127.0.0.1:${port}`;
}

// 处理 count_tokens 请求
async function handleCountTokens(req: any, res: any) {
  const body = await parseRequestBody(req);
  const tokenCount = estimateTokens(body);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    input_tokens: tokenCount.input,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0
  }));
}

// 处理 messages 请求（转发）
async function handleMessages(req: any, res: any, config: ApiConfig) {
  const body = await parseRequestBody(req);
  const response = await fetch(`${config.baseURL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  // 处理流式或非流式响应
  if (body.stream) {
    pipeStreamResponse(response, res);
  } else {
    const data = await response.text();
    res.end(data);
  }
}
```

#### token-counter.ts

```typescript
/**
 * Token 估算工具
 */
export function estimateTokens(request: {
  model: string;
  messages: any[];
  system?: string;
  tools?: any[];
}): { input: number; cache_creation: number } {
  let totalChars = 0;

  // 系统提示词
  if (request.system) {
    totalChars += request.system.length;
  }

  // 消息内容
  for (const msg of request.messages) {
    if (typeof msg.content === 'string') {
      totalChars += msg.content.length;
    } else if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === 'text') {
          totalChars += block.text.length;
        }
      }
    }
  }

  // 工具定义
  if (request.tools) {
    totalChars += JSON.stringify(request.tools).length;
  }

  // 估算 token 数（中文约 0.7 字符/token，英文约 4 字符/token）
  const chineseChars = (totalChars.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherChars = totalChars - chineseChars;

  const tokens = Math.ceil(chineseChars / 0.7 + otherChars / 4);

  return {
    input: tokens,
    cache_creation: 0
  };
}
```

#### claude-settings.ts 修改

```typescript
export function buildEnvForConfig(config: ApiConfig): Record<string, string> {
  const baseEnv = { ...process.env };

  // 启动代理服务器
  const proxyUrl = startApiProxy(config);

  // SDK 连接到代理服务器（以为在调用官方 API）
  baseEnv.ANTHROPIC_AUTH_TOKEN = config.apiKey;
  baseEnv.ANTHROPIC_BASE_URL = proxyUrl;  // 代理地址
  baseEnv.ANTHROPIC_MODEL = config.model;

  // 禁用非必要流量
  baseEnv.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = '1';
  baseEnv.DISABLE_AUTOUPDATER = '1';

  return baseEnv;
}

// 清理代理资源
export function cleanupApiProxy(): void {
  stopApiProxy();
}
```

### 3.5 环境变量说明

| 变量 | 值 | 作用 |
|------|-----|------|
| `ANTHROPIC_AUTH_TOKEN` | `{API_KEY}` | API 密钥（传给 SDK） |
| `ANTHROPIC_BASE_URL` | `http://127.0.0.1:35721` | 代理服务器地址 |
| `ANTHROPIC_MODEL` | `{MODEL_NAME}` | 模型名称 |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | `1` | 禁用遥测 |
| `DISABLE_AUTOUPDATER` | `1` | 禁用自动更新 |

---

## 四、测试方案

### 4.1 功能测试清单

| 测试项 | 测试方法 | 预期结果 |
|--------|----------|----------|
| 代理服务器启动 | 启动应用 | 日志显示 "代理服务器启动成功" |
| /count_tokens 拦截 | 发送 AI 消息 | 日志显示 "count_tokens 请求已拦截" |
| /messages 转发 | 发送 AI 消息 | 日志显示 "消息已转发到 {API}" |
| 流式响应 | 发送长消息 | 逐步显示回复内容 |
| DeepSeek API | 配置 DeepSeek | 正常响应 |
| 阿里云 API | 配置阿里云 | 正常响应 |
| 错误处理 | 断开网络 | 显示友好错误提示 |

### 4.2 日志验证

代理服务器应输出以下日志：

```
[API Proxy] 代理服务器启动成功，监听端口: 35721
[API Proxy] 代理 URL: http://127.0.0.1:35721
[API Proxy] 目标 API: https://api.deepseek.com/anthropic
[API Proxy] count_tokens 请求已拦截，估算 tokens: 150
[API Proxy] messages 请求已转发到第三方 API
[API Proxy] 第三方 API 响应成功
```

---

## 五、部署清单

### 5.1 开发环境

```bash
# 1. 创建代理服务器文件
touch src/electron/libs/api-proxy.ts
touch src/electron/libs/token-counter.ts

# 2. 修改 claude-settings.ts
# 3. 编译测试
bun run transpile:electron
bun run dev
```

### 5.2 生产构建

```bash
# 1. 编译 Electron 代码
bun run transpile:electron

# 2. 构建前端
bun run build

# 3. 打包 Windows 版本
export NODE_OPTIONS="--max-old-space-size=8192"
npx electron-builder --win --x64
```

---

## 六、风险与限制

### 6.1 已知风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Token 估算不准确 | 计费偏差 | 使用保守估算（偏高） |
| 代理端口冲突 | 启动失败 | 使用固定端口 35721，检测占用 |
| 内存泄漏 | 长期运行问题 | 正确管理服务器生命周期 |

### 6.2 功能限制

1. **Token 计数**：基于估算，非精确值
2. **缓存功能**：暂不支持 prompt caching
3. **流式中断**：网络中断时可能无法优雅关闭

---

## 七、后续优化

### 7.1 短期优化

- [ ] 支持 prompt caching API
- [ ] 更精确的 token 估算（基于实际模型）
- [ ] 请求/响应日志记录（用于调试）

### 7.2 长期优化

- [ ] 请求重试机制（指数退避）
- [ ] 请求队列管理（并发控制）
- [ ] 响应缓存（相同请求去重）

---

## 八、总结

### 核心要点

1. **问题本质**：第三方 API 不支持 `/count_tokens` 端点
2. **解决方案**：代理服务器拦截该请求，返回估算值
3. **架构优势**：SDK 无感知，兼容所有第三方 API

### 预期效果

实施后，所有 Anthropic API 兼容的第三方服务（DeepSeek、阿里云、七牛、月之暗面等）均可正常工作，无需修改 SDK 代码。

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-20
**状态**: 待实施
