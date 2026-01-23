/**
 * 内存管理模块
 * 处理自动记忆分析和存储功能
 */

import type { Session } from "../../storage/session-store.js";
import type { ServerEvent } from "../../types.js";
import type { MemoryConfig } from "./types.js";
import { memoryStore } from "../../utils/memory-tools.js";

// 记忆指南系统提示缓存
let memoryGuidancePromptCache: string | null = null;

/**
 * 获取缓存的记忆指南提示
 * @returns 缓存的记忆提示或 null
 */
export function getCachedMemoryGuidance(): string | null {
  return memoryGuidancePromptCache;
}

/**
 * 设置记忆指南提示缓存
 * @param prompt 要缓存的提示文本
 */
export function setCachedMemoryGuidance(prompt: string): void {
  memoryGuidancePromptCache = prompt;
}

/**
 * 清除记忆指南提示缓存
 */
export function clearMemoryGuidanceCache(): void {
  memoryGuidancePromptCache = null;
}

/**
 * 构建记忆指南系统提示
 * @returns 记忆指南提示文本
 */
export function buildMemoryGuidancePrompt(): string {
  return `
## AI 记忆功能

你有访问两类记忆工具的权限，可以跨会话存储和检索信息。

### 1. 快速记忆工具（推荐）
- **memory_search** - 搜索已存储的记忆
- **memory_store** - 存储新记忆到知识库
- **memory_ask** - 基于记忆的问答（RAG）

### 2. 文件记忆工具
- **memory (view)** - 查看记忆目录或文件内容
- **memory (create)** - 创建新的记忆文件
- **memory (str_replace)** - 编辑现有记忆文件
- **memory (insert)** - 在文件中插入内容
- **memory (delete)** - 删除记忆文件
- **memory (rename)** - 重命名记忆文件

### 记忆存储规范：

**应该存储：**
- ✅ 重要的技术决策和架构选择
- ✅ 用户明确的偏好设置和工作习惯
- ✅ 项目特定的约定和规范
- ✅ 复杂问题的解决方案（经过提炼）

**不应该存储：**
- ❌ 临时性对话和闲聊
- ❌ 重复的信息
- ❌ 过于琐碎的细节
- ❌ 原始输出日志
- ❌ AI 的通用知识

**使用建议：**
- 存储前先用 memory_search 检查是否已存在类似内容
- 内容使用 Markdown 格式，分点陈述
- 选择合适的标签：project/preference/technical/context/custom
- 使用文件工具可以创建更结构化的记忆文件
`;
}

/**
 * 获取或构建记忆指南提示（带缓存）
 * @returns 记忆指南提示文本
 */
export function getMemoryGuidancePrompt(): string | undefined {
  const cached = getCachedMemoryGuidance();
  if (cached) {
    return cached;
  }
  const prompt = buildMemoryGuidancePrompt();
  setCachedMemoryGuidance(prompt);
  return prompt;
}

/**
 * 触发自动记忆分析
 * 让 AI 清洗会话内容并提取关键信息存储到记忆
 *
 * @param session - 当前会话
 * @param prompt - 用户提示词
 * @param memConfig - 记忆配置
 * @param onEvent - 事件回调函数
 */
export async function triggerAutoMemoryAnalysis(
  session: Session,
  prompt: string,
  memConfig: MemoryConfig,
  onEvent: (event: ServerEvent) => void
): Promise<void> {
  const { log } = await import("../../logger.js");

  // 只对特定分类的会话进行自动记忆
  if (!memConfig.autoStoreCategories.includes('project') && !memConfig.autoStoreCategories.includes('technical')) {
    onEvent({
      type: "memory.status",
      payload: { sessionId: session.id, stored: false, message: "分类未启用自动存储" }
    });
    return;
  }

  log.info(`[Auto Memory] Starting analysis for session ${session.id}`);

  // 使用简单的关键词检测判断是否值得存储
  const hasValuableContent = /问题|解决|配置|实现|功能|错误|修复|decision|fix|implement/.test(prompt.toLowerCase());
  if (!hasValuableContent) {
    log.info(`[Auto Memory] Session skipped - no valuable content detected`);
    onEvent({
      type: "memory.status",
      payload: { sessionId: session.id, stored: false, message: "无有价值内容" }
    });
    return;
  }

  // 获取 API 配置
  const { getCurrentApiConfig } = await import("../../services/claude-settings.js");
  const config = getCurrentApiConfig();
  if (!config) {
    log.warn('[Auto Memory] No API config available');
    return;
  }

  // 构建分析提示
  const analysisPrompt = `
## 记忆提取任务

请分析以下会话，提取值得存储到长期记忆的关键信息。

**原始用户请求：**
${prompt}

**记忆存储规范（严格遵守）：**

应该存储：
- ✅ 重要的技术决策和架构选择
- ✅ 用户明确的偏好设置和工作习惯
- ✅ 项目特定的约定和规范
- ✅ 复杂问题的解决方案（经过提炼）
- ✅ 有用的命令和工具组合

不应该存储：
- ❌ 临时性对话和闲聊
- ❌ 重复的信息
- ❌ 过于琐碎的细节（文件路径、随机数字）
- ❌ 原始输出日志（需提炼后再存）
- ❌ AI 的通用知识（非项目特定）

**输出格式（JSON）：**
\`\`\`json
{
  "shouldStore": true/false,
  "title": "简短标题（10字以内）",
  "content": "结构化的记忆内容（Markdown格式，分点陈述）",
  "label": "project/preference/technical/custom"
}
\`\`\`

如果会话内容不值得存储，设置 shouldStore 为 false。

现在请分析并输出 JSON：
`;

  try {
    // 调用 AI API 进行分析
    const response = await fetch(`${config.baseURL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model || 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          { role: 'user', content: analysisPrompt }
        ],
      }),
    });

    if (!response.ok) {
      log.error(`[Auto Memory] API error: ${response.status}`);
      return;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    // 提取 JSON
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      log.warn('[Auto Memory] No JSON found in AI response');
      onEvent({
        type: "memory.status",
        payload: { sessionId: session.id, stored: false, message: "AI响应格式错误" }
      });
      return;
    }

    const analysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);

    if (!analysis.shouldStore) {
      log.info('[Auto Memory] AI decided not to store this session');
      onEvent({
        type: "memory.status",
        payload: { sessionId: session.id, stored: false, message: "AI判断无需存储" }
      });
      return;
    }

    // 存储到记忆
    const result = await memoryStore(
      analysis.title || `会话-${new Date().toLocaleDateString()}`,
      analysis.content || '',
      analysis.label || 'project'
    );

    log.info(`[Auto Memory] Stored: ${analysis.title} - ${result}`);

    // 发送存储成功状态
    onEvent({
      type: "memory.status",
      payload: { sessionId: session.id, stored: true, title: analysis.title, message: "已存储到记忆" }
    });

  } catch (error) {
    log.error('[Auto Memory] Failed:', error);
    onEvent({
      type: "memory.status",
      payload: { sessionId: session.id, stored: false, message: `存储失败: ${error instanceof Error ? error.message : String(error)}` }
    });
  }
}
