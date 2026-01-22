# 多厂商 API 支持实现报告

> **执行时间**: 2026-01-20
> **功能**: 添加 12 个 AI 厂商 API 支持，包括 Google Gemini
> **状态**: ✅ 全部完成

---

## 执行概览

| 任务 ID | 任务名称 | 状态 | 主要成果 |
|---------|----------|------|----------|
| **T-01** | 设计 API 转换器架构 | ✅ | ApiAdapter 接口、适配器模式 |
| **T-02** | 实现厂商 API 转换器 | ✅ | 12 个厂商适配器实现 |
| **T-03** | 更新配置存储支持多厂商 | ✅ | 配置验证、厂商默认值 |
| **T-04** | 更新 UI 支持厂商选择 | ✅ | 厂商下拉框、动态模型列表 |
| **T-05** | 更新 preload 脚本 | ✅ | IPC 方法暴露 |
| **T-06** | 添加 Gemini API 支持 | ✅ | GeminiAdapter 实现 |
| **T-07** | 修复构建问题 | ✅ | Vite 别名配置 |

---

## 一、支持厂商列表

### 国外厂商 (7个)
| 厂商 | ID | 模型示例 | 图标 |
|------|-----|----------|------|
| Anthropic (Claude) | `anthropic` | claude-sonnet-4-20250514 | 🤖 |
| OpenAI | `openai` | gpt-4o | 🧠 |
| Azure OpenAI | `azure` | gpt-4 | 🔷 |
| Google Gemini | `gemini` | gemini-2.0-flash-exp | 💎 |
| Groq | `groq` | llama-3.3-70b-versatile | ⚡ |
| Together AI | `together` | Mixtral-8x7B-v0.1 | 🤝 |
| DeepSeek | `deepseek` | deepseek-chat | 🔍 |

### 国内厂商 (4个)
| 厂商 | ID | 模型示例 | 图标 |
|------|-----|----------|------|
| 阿里云通义千问 | `alibaba` | qwen-turbo | ☁️ |
| 百度文心一言 | `baidu` | ERNIE-Bot-4 | 🔵 |
| 智谱 AI (ChatGLM) | `zhipu` | glm-4 | 🟢 |
| 月之暗面 (Kimi) | `moonshot` | moonshot-v1-128k | 🌙 |

### 自定义 (1个)
| 厂商 | ID | 说明 | 图标 |
|------|-----|------|------|
| 自定义 API | `custom` | 兼容 OpenAI 格式 | ⚙️ |

---

## 二、核心文件修改

### 1. 新增文件

#### `src/electron/libs/api-adapter.ts` (~920 行)
**用途**: 多厂商 API 格式转换器

**核心接口**:
```typescript
export interface ApiAdapter {
  transformRequest(request: AnthropicRequest, config: ApiConfig): {
    url: string;
    headers: Record<string, string>;
    body: unknown;
  };
  transformResponse(response: unknown, config: ApiConfig): AnthropicResponse;
  transformStream?(chunk: string, config: ApiConfig): string | null;
}
```

**实现的适配器类**:
- `OpenAIAdapter` - OpenAI、Groq、Together、自定义
- `AlibabaAdapter` - 阿里云通义千问
- `BaiduAdapter` - 百度文心一言
- `ZhipuAdapter` - 智谱 ChatGLM
- `MoonshotAdapter` - 月之暗面 Kimi
- `DeepSeekAdapter` - DeepSeek
- `GeminiAdapter` - Google Gemini

**关键函数**:
```typescript
export function getApiAdapter(provider: ApiProvider): ApiAdapter
export function getProviderDefaults(provider: ApiProvider): {
  baseURL: string;
  models: string[];
  defaultModel: string;
}
```

---

### 2. 修改文件

#### `src/electron/libs/config-store.ts`
**修改内容**:
1. 添加 12 个厂商的 API Key 验证模式
2. 添加 `getSupportedProviders()` 函数
3. 添加 `getProviderConfig()` 函数
4. 更新 `validateApiConfig()` 支持多厂商验证
5. 添加 Azure 专用字段验证

**新增常量**:
```typescript
const API_KEY_PATTERNS: Record<ApiProvider, RegExp[]> = {
  anthropic: [/^sk-ant-[a-zA-Z0-9_-]{91,}$/],
  openai: [/^sk-[a-zA-Z0-9]{48,}$/],
  azure: [/^[a-f0-9]{32}$/],
  gemini: [/^AIza[A-Za-z0-9_-]{35}$/, /^GOOG-[A-Za-z0-9_-]{35,}$/],
  // ... 11 个厂商
};
```

---

#### `src/electron/preload.cts`
**新增 IPC 暴露**:
```typescript
getSupportedProviders: () => invoke("get-supported-providers"),
getProviderConfig: (provider: string) => invoke("get-provider-config", provider)
```

---

#### `src/ui/components/SettingsModal.tsx`
**新增功能**:
1. 厂商选择下拉框
2. 动态模型列表（根据厂商自动更新）
3. Azure 专用字段（资源名称、部署名称）
4. 厂商描述显示

**新增状态**:
```typescript
const [apiType, setApiType] = useState<string>("anthropic");
const [resourceName, setResourceName] = useState("");
const [deploymentName, setDeploymentName] = useState("");
const [providers, setProviders] = useState<Array<{...}>>([]);
const [providerModels, setProviderModels] = useState<string[]>([]);
```

---

#### `types/index.d.ts`
**新增类型定义**:
```typescript
type ApiProvider =
  | 'anthropic' | 'openai' | 'azure' | 'alibaba' | 'baidu'
  | 'zhipu' | 'moonshot' | 'deepseek' | 'groq' | 'together'
  | 'gemini' | 'custom';

type ApiConfig = {
  apiKey: string;
  baseURL: string;
  model: string;
  apiType?: ApiProvider;
  resourceName?: string;
  deploymentName?: string;
  customHeaders?: Record<string, string>;
};

type ApiProviderInfo = {
  id: ApiProvider;
  name: string;
  description: string;
  icon?: string;
};

type ProviderConfig = {
  baseURL: string;
  models: string[];
  defaultModel: string;
  description: string;
};
```

---

#### `vite.config.ts`
**修改内容**: 添加模块解析别名
```typescript
resolve: {
  alias: {
    '@/shared': path.resolve(__dirname, 'src/shared'),
  },
},
```

---

#### `src/ui/App.tsx`
**修改内容**: 使用别名导入
```typescript
// 修改前
import { isDeletionPermissionRequest } from "../../shared/deletion-detection.js";

// 修改后
import { isDeletionPermissionRequest } from "@/shared/deletion-detection";
```

---

#### `src/ui/components/ErrorBoundary.tsx`
**修改内容**: 移除未使用的导入和变量
```typescript
// 移除
import { useTranslation } from "react-i18next";
const { t } = useTranslation();

// 修改为
static getDerivedStateFromError(_error: Error): ...
```

---

## 三、Gemini API 适配器实现

### GeminiAdapter 类特点

1. **请求格式转换**:
   - Anthropic 消息 → Gemini `contents` 格式
   - 角色映射: `assistant` → `model`

2. **API 端点**:
   ```
   https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
   ```

3. **请求头**:
   ```typescript
   {
     'Content-Type': 'application/json',
     'x-goog-api-key': config.apiKey
   }
   ```

4. **响应转换**:
   - `candidates[0].content.parts[0].text` → Anthropic 文本内容
   - `usageMetadata.promptTokenCount` → `input_tokens`
   - `usageMetadata.candidatesTokenCount` → `output_tokens`

5. **支持的模型**:
   - `gemini-2.0-flash-exp` (默认)
   - `gemini-1.5-pro`
   - `gemini-1.5-flash`

---

## 四、构建修复

### 问题描述
TypeScript 无法解析 `../../shared/deletion-detection.js` 模块

### 解决方案
1. 在 `vite.config.ts` 添加别名解析
2. 更新 `App.tsx` 使用 `@/shared` 别名导入

### 构建结果
```
✓ 647 modules transformed
✓ built in 13.80s
```

---

## 五、文件变更统计

| 类型 | 数量 | 文件列表 |
|------|------|----------|
| **新增** | 1 | `api-adapter.ts` |
| **修改** | 8 | `config-store.ts`, `preload.cts`, `SettingsModal.tsx`, `electron.d.ts`, `types/index.d.ts`, `vite.config.ts`, `App.tsx`, `ErrorBoundary.tsx` |
| **总代码行数** | ~1200 | 新增 + 修改 |

---

## 六、技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户界面层                            │
│  SettingsModal.tsx (厂商选择 + 动态模型列表 + Azure 字段)     │
└────────────────────────┬────────────────────────────────────┘
                         │ IPC 调用
┌────────────────────────▼────────────────────────────────────┐
│                         IPC 层                               │
│  preload.cts (getSupportedProviders, getProviderConfig)     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                       主进程层                               │
│  main.ts + config-store.ts (配置管理 + 厂商验证)             │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                      适配器层                               │
│  api-adapter.ts (12个厂商适配器 + 统一接口)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                      厂商 API                                │
│  Anthropic │ OpenAI │ Gemini │ 阿里云 │ 百度 │ 智谱 │ ...   │
└─────────────────────────────────────────────────────────────┘
```

---

## 七、API Key 验证规则

| 厂商 | 格式模式 | 示例 |
|------|----------|------|
| Anthropic | `sk-ant-[a-zA-Z0-9_-]{91,}` | `sk-ant-api03-...` |
| OpenAI | `sk-[a-zA-Z0-9]{48,}` | `sk-...` |
| Azure | `[a-f0-9]{32}` | 32位十六进制 |
| Gemini | `AIza[A-Za-z0-9_-]{35}` 或 `GOOG-...` | `AIzaSyDa...` |
| 阿里云 | `sk-[a-zA-Z0-9]{48,}` | `sk-...` |
| 百度 | `[a-z0-9]{24}` | 24位小写字母数字 |
| 智谱 | `[0-9a-f]{32}\.[0-9a-f]{8}\.[0-9a-f]{8}` | `xxx.xxx.xxx` |
| DeepSeek | `sk-[a-zA-Z0-9-]{51,}` | `sk-...` |
| Groq | `gsk_[a-zA-Z0-9]{52,}` | `gsk_...` |

---

## 八、测试验证清单

### 编译验证
- [x] TypeScript 编译通过
- [x] Vite 构建成功
- [x] 无类型错误

### 功能验证（需测试）
- [ ] 厂商列表正确显示
- [ ] 切换厂商时模型列表更新
- [ ] Azure 专用字段显示/隐藏
- [ ] 保存配置成功
- [ ] 测试连接功能

### 厂商验证（需测试）
- [ ] Anthropic API
- [ ] OpenAI API
- [ ] Azure OpenAI
- [ ] Google Gemini API
- [ ] 阿里云通义千问
- [ ] 百度文心一言
- [ ] 智谱 ChatGLM
- [ ] 月之暗面 Kimi
- [ ] DeepSeek
- [ ] Groq
- [ ] Together AI
- [ ] 自定义 API

---

## 九、后续建议

### 1. 文档
创建用户配置指南，说明：
- 各厂商 API Key 获取方式
- 模型选择建议
- Azure 配置步骤

### 2. 测试
- 添加各厂商 API 的集成测试
- 测试流式响应转换
- 测试错误处理

### 3. 优化
- 添加厂商图标（替换 emoji）
- 添加模型参数提示
- 保存最近使用的模型

### 4. 扩展
- 支持更多厂商
- 支持自定义模型参数
- 支持多配置切换

---

**作者**: Alan
**日期**: 2026-01-20
**许可证**: AGCPA v3.0
