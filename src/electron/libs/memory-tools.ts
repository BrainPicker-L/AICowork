/**
 * AI 记忆工具处理器
 * 为 Claude Agent SDK 提供记忆工具
 * 支持双后端：Memvid SDK（主要）和文件系统（后备）
 */

import { getMemvidStore } from './memvid-store.js';
import { getFsMemoryStore } from './fs-memory-store.js';
import { log } from '../logger.js';

/**
 * 存储后端类型
 */
type StorageBackend = 'memvid' | 'filesystem';

/**
 * 当前使用的存储后端
 */
let currentBackend: StorageBackend = 'memvid';
let backendInitialized = false;

/**
 * 检测并初始化可用的存储后端
 * 优先使用 Memvid SDK（高性能 .mv2 格式）
 */
async function ensureBackend(): Promise<void> {
  if (backendInitialized) return;

  // 优先尝试 Memvid SDK
  try {
    const memvid = getMemvidStore();
    await memvid.initialize();
    currentBackend = 'memvid';
    log.info('[Memory Tool] Using Memvid backend');
  } catch (error) {
    log.warn('[Memory Tool] Memvid initialization failed, falling back to filesystem:', error);
    // 回退到文件系统存储
    try {
      const fsStore = getFsMemoryStore();
      await fsStore.initialize();
      currentBackend = 'filesystem';
      log.info('[Memory Tool] Using filesystem backend (fallback)');
    } catch (fsError) {
      log.error('[Memory Tool] All backends failed:', fsError);
      throw new Error('无法初始化任何记忆存储后端');
    }
  }

  backendInitialized = true;
}

/**
 * 记忆工具配置
 */
export interface MemoryToolConfig {
  enabled: boolean;
  autoStore: boolean;
  autoStoreCategories: string[];
  searchMode: 'lex' | 'sem' | 'auto';
  defaultK: number;
}

/**
 * 默认记忆工具配置
 */
const DEFAULT_MEMORY_CONFIG: MemoryToolConfig = {
  enabled: true,
  autoStore: false,
  autoStoreCategories: ['project', 'technical'],
  searchMode: 'lex',
  defaultK: 6,
};

/**
 * 记忆工具存储
 */
let memoryToolConfig: MemoryToolConfig = { ...DEFAULT_MEMORY_CONFIG };

/**
 * 设置记忆工具配置
 */
export function setMemoryToolConfig(config: Partial<MemoryToolConfig>): void {
  memoryToolConfig = { ...memoryToolConfig, ...config };
  log.info('[Memory Tool] Config updated:', memoryToolConfig);
}

/**
 * 获取记忆工具配置
 */
export function getMemoryToolConfig(): MemoryToolConfig {
  return { ...memoryToolConfig };
}

/**
 * 记忆搜索工具
 */
export async function memorySearch(query: string, k: number = 6): Promise<string> {
  try {
    if (!memoryToolConfig.enabled) {
      return '记忆功能未启用';
    }

    await ensureBackend();

    let result: any;
    if (currentBackend === 'memvid') {
      const memvid = getMemvidStore();
      result = await memvid.findDocuments(query, {
        mode: memoryToolConfig.searchMode,
        k,
      });
    } else {
      const fsStore = getFsMemoryStore();
      result = await fsStore.findDocuments(query, { k });
    }

    if (!result.success || !result.results) {
      return `搜索失败：${result.error || '未知错误'}`;
    }

    if (result.results.hits.length === 0) {
      return '未找到相关记忆';
    }

    // 格式化搜索结果
    const formatted = result.results.hits.map((hit: any, index: number) => {
      const score = hit.score ? ` (相关度: ${(hit.score * 100).toFixed(0)}%)` : '';
      const doc = hit.doc;
      return `${index + 1}. ${doc.title || '无标题'}${score}\n   ${doc.text?.substring(0, 200) || ''}${doc.text && doc.text.length > 200 ? '...' : ''}`;
    }).join('\n\n');

    return `找到 ${result.results.hits.length} 条相关记忆：\n\n${formatted}`;
  } catch (error) {
    log.error('[Memory Tool] Search failed:', error);
    return `搜索失败：${error instanceof Error ? error.message : '未知错误'}`;
  }
}

/**
 * 记忆存储工具
 */
export async function memoryStore(
  title: string,
  text: string,
  label: string = 'custom'
): Promise<string> {
  try {
    if (!memoryToolConfig.enabled) {
      return '记忆功能未启用';
    }

    await ensureBackend();

    let result: any;
    if (currentBackend === 'memvid') {
      const memvid = getMemvidStore();
      result = await memvid.putDocument({
        title: title.trim(),
        text: text.trim(),
        label: label.trim(),
        metadata: {
          storedAt: new Date().toISOString(),
          source: 'ai_tool',
        },
      });
    } else {
      const fsStore = getFsMemoryStore();
      result = await fsStore.putDocument({
        title: title.trim(),
        text: text.trim(),
        label: label.trim(),
        metadata: {
          storedAt: new Date().toISOString(),
          source: 'ai_tool',
        },
      });
    }

    if (!result.success) {
      return `存储失败：${result.error || '未知错误'}`;
    }

    return `已存储记忆：${title}`;
  } catch (error) {
    log.error('[Memory Tool] Store failed:', error);
    return `存储失败：${error instanceof Error ? error.message : '未知错误'}`;
  }
}

/**
 * 记忆问答工具 (RAG)
 */
export async function memoryAsk(question: string, k: number = 6): Promise<string> {
  try {
    if (!memoryToolConfig.enabled) {
      return '记忆功能未启用';
    }

    await ensureBackend();

    let result: any;
    if (currentBackend === 'memvid') {
      const memvid = getMemvidStore();
      result = await memvid.askQuestion(question, {
        mode: memoryToolConfig.searchMode,
        k,
        contextOnly: false,
      });
    } else {
      const fsStore = getFsMemoryStore();
      result = await fsStore.askQuestion(question, { k });
    }

    if (!result.success) {
      return `查询失败：${result.error || '未知错误'}`;
    }

    // 如果有直接回答，返回回答
    if (result.answer) {
      return result.answer;
    }

    // 否则返回检索到的上下文
    if (result.context) {
      return `根据记忆检索到的相关信息：\n\n${result.context}`;
    }

    return '未找到相关记忆';
  } catch (error) {
    log.error('[Memory Tool] Ask failed:', error);
    return `查询失败：${error instanceof Error ? error.message : '未知错误'}`;
  }
}

/**
 * 自动存储记忆（用于会话结束时自动记录重要信息）
 */
export async function autoStoreMemory(
  sessionTitle: string,
  sessionSummary: string,
  keyPoints: string[],
  category: string = 'project'
): Promise<void> {
  try {
    if (!memoryToolConfig.enabled || !memoryToolConfig.autoStore) {
      return;
    }

    // 检查分类是否在自动存储列表中
    if (!memoryToolConfig.autoStoreCategories.includes(category)) {
      return;
    }

    const memvid = getMemvidStore();

    // 构建记忆内容
    const content = [
      `# ${sessionTitle}`,
      '',
      '## 会话摘要',
      sessionSummary,
      '',
      '## 关键点',
      ...keyPoints.map((point, index) => `${index + 1}. ${point}`),
      '',
      `## 会话时间`,
      new Date().toISOString(),
    ].join('\n');

    await memvid.putDocument({
      title: sessionTitle,
      text: content,
      label: category,
      metadata: {
        storedAt: new Date().toISOString(),
        source: 'auto_store',
      },
    });

    log.info(`[Memory Tool] Auto-stored memory: ${sessionTitle}`);
  } catch (error) {
    log.error('[Memory Tool] Auto-store failed:', error);
  }
}

/**
 * 智能分析会话内容，提取关键信息
 * 根据最佳实践过滤垃圾内容，只存储有价值的信息
 */
export async function analyzeSessionContent(
  messages: Array<{ type: string; role?: string; content?: string | Array<{ type: string; text?: string }> }>
): Promise<{ summary: string; keyPoints: string[]; shouldStore: boolean }> {
  // 提取用户消息和 AI 响应
  const userMessages: string[] = [];
  const assistantActions: string[] = [];

  for (const msg of messages) {
    if (msg.type === 'user' && msg.content) {
      const text = typeof msg.content === 'string' ? msg.content :
        Array.isArray(msg.content) ? msg.content.map(c => c.type === 'text' ? c.text || '' : '').join('') : '';
      if (text.trim()) userMessages.push(text.trim());
    }

    if (msg.type === 'assistant' && msg.content) {
      // 提取助手的关键操作
      const content = msg.content as any;
      if (Array.isArray(content)) {
        for (const item of content) {
          if (item.type === 'tool_use') {
            assistantActions.push(`${item.name}: ${JSON.stringify(item.input).substring(0, 50)}...`);
          } else if (item.type === 'text' && item.text) {
            assistantActions.push(item.text.substring(0, 100));
          }
        }
      }
    }
  }

  // 过滤条件：判断是否值得存储
  const shouldStore = evaluateSessionValue(userMessages, assistantActions);
  if (!shouldStore) {
    return { summary: '', keyPoints: [], shouldStore: false };
  }

  // 提取关键信息
  const keyPoints = extractKeyPoints(userMessages, assistantActions);

  // 生成摘要
  const summary = generateSummary(userMessages, keyPoints);

  return { summary, keyPoints, shouldStore: true };
}

/**
 * 评估会话价值，判断是否应该存储
 */
function evaluateSessionValue(userMessages: string[], assistantActions: string[]): boolean {
  const allText = [...userMessages, ...assistantActions].join(' ').toLowerCase();

  // 排除条件：不应存储的内容
  const excludePatterns = [
    /^(测试|test|hello|hi|你好)\s*$/i,  // 简单问候
    /^(ok|好的|收到|got it|sure)\s*$/i,  // 简单确认
    /^(谢谢|thank|感谢)\s*$/i,  // 礼貌用语
  ];

  // 检查是否是简单的确认/问候
  for (const msg of userMessages) {
    for (const pattern of excludePatterns) {
      if (pattern.test(msg.trim())) {
        return false;
      }
    }
  }

  // 包含条件：必须有的特征
  const includePatterns = [
    /问题|problem|error|bug|错误|故障/,
    /解决|solve|fix|修复|implement|实现/,
    /配置|config|设置|setting|preference|偏好/,
    /决定|decision|选择|choice/,
    /架构|architecture|design|设计/,
    /命令|command|script|脚本/,
    /api|接口|endpoint/,
    /功能|feature|add|新增/,
  ];

  // 至少包含一个有价值的特征
  return includePatterns.some(pattern => pattern.test(allText));
}

/**
 * 提取关键点
 */
function extractKeyPoints(userMessages: string[], assistantActions: string[]): string[] {
  const points: string[] = [];

  // 从用户消息中提取明确的偏好和需求
  for (const msg of userMessages) {
    // 提取偏好设置
    if (msg.includes('偏好') || msg.includes('prefer') || msg.includes('设置')) {
      points.push(`📌 用户需求: ${msg.substring(0, 100)}`);
    }

    // 提取技术决策
    if (msg.includes('选择') || msg.includes('用') || msg.includes('使用')) {
      points.push(`🔧 技术选择: ${msg.substring(0, 100)}`);
    }

    // 提取问题描述
    if (msg.includes('问题') || msg.includes('错误') || msg.includes('error')) {
      points.push(`⚠️ 问题: ${msg.substring(0, 100)}`);
    }
  }

  // 从 AI 操作中提取解决方案
  for (const action of assistantActions) {
    if (action.startsWith('Write:') || action.startsWith('Edit:')) {
      const match = action.match(/(Write|Edit):\s*([^{}]+)/);
      if (match) {
        points.push(`📝 修改文件: ${match[2].substring(0, 80)}`);
      }
    }
    if (action.startsWith('Bash:')) {
      const match = action.match(/Bash:\s*"([^"]+)"/);
      if (match) {
        points.push(`⚡ 执行命令: ${match[1]}`);
      }
    }
  }

  // 去重并限制数量
  const uniquePoints = [...new Set(points)];
  return uniquePoints.slice(0, 8);
}

/**
 * 生成会话摘要
 */
function generateSummary(userMessages: string[], keyPoints: string[]): string {
  if (userMessages.length === 0) return '空会话';

  // 使用第一个用户消息作为主要主题
  const mainTopic = userMessages[0].substring(0, 60);

  // 统计关键操作类型
  const hasCodeChanges = keyPoints.some(p => p.includes('修改文件'));
  const hasCommands = keyPoints.some(p => p.includes('执行命令'));
  const hasDecisions = keyPoints.some(p => p.includes('技术选择') || p.includes('用户需求'));

  let summary = mainTopic;

  if (hasCodeChanges) summary += ' | 包含代码修改';
  if (hasCommands) summary += ' | 执行了命令';
  if (hasDecisions) summary += ' | 做出了决策';

  return summary;
}

/**
 * 获取记忆统计信息（双后端支持）
 */
export async function getMemoryStats(): Promise<{ success: boolean; error?: string; stats?: any }> {
  try {
    await ensureBackend();

    if (currentBackend === 'memvid') {
      const memvid = getMemvidStore();
      return await memvid.getStats();
    } else {
      const fsStore = getFsMemoryStore();
      return await fsStore.getStats();
    }
  } catch (error) {
    log.error('[Memory Tool] Failed to get stats:', error);
    return { success: false, error: error instanceof Error ? error.message : '获取统计信息失败' };
  }
}

/**
 * 获取记忆时间线（双后端支持）
 */
export async function getMemoryTimeline(options: { limit?: number; reverse?: boolean } = {}): Promise<{ success: boolean; error?: string; entries?: any[] }> {
  try {
    await ensureBackend();

    if (currentBackend === 'memvid') {
      const memvid = getMemvidStore();
      return await memvid.getTimeline(options);
    } else {
      const fsStore = getFsMemoryStore();
      return await fsStore.getTimeline(options);
    }
  } catch (error) {
    log.error('[Memory Tool] Failed to get timeline:', error);
    return { success: false, error: error instanceof Error ? error.message : '获取时间线失败' };
  }
}

/**
 * 清空所有记忆（双后端支持）
 */
export async function clearAllMemory(): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureBackend();

    if (currentBackend === 'memvid') {
      const memvid = getMemvidStore();
      return await memvid.clearAll();
    } else {
      const fsStore = getFsMemoryStore();
      return await fsStore.clearAll();
    }
  } catch (error) {
    log.error('[Memory Tool] Failed to clear memory:', error);
    return { success: false, error: error instanceof Error ? error.message : '清空记忆失败' };
  }
}

/**
 * 存储单个文档（双后端支持，IPC 调用）
 */
export async function putDocument(input: any): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    if (!memoryToolConfig.enabled) {
      return { success: false, error: '记忆功能未启用' };
    }

    await ensureBackend();

    if (currentBackend === 'memvid') {
      const memvid = getMemvidStore();
      return await memvid.putDocument(input);
    } else {
      const fsStore = getFsMemoryStore();
      return await fsStore.putDocument(input);
    }
  } catch (error) {
    log.error('[Memory Tool] Failed to put document:', error);
    return { success: false, error: error instanceof Error ? error.message : '存储文档失败' };
  }
}

/**
 * 搜索文档（双后端支持，IPC 调用）
 */
export async function findDocuments(query: string, options: any = {}): Promise<{ success: boolean; error?: string; results?: any }> {
  try {
    if (!memoryToolConfig.enabled) {
      return { success: false, error: '记忆功能未启用' };
    }

    await ensureBackend();

    if (currentBackend === 'memvid') {
      const memvid = getMemvidStore();
      return await memvid.findDocuments(query, {
        mode: options.mode || memoryToolConfig.searchMode,
        k: options.k || memoryToolConfig.defaultK,
      });
    } else {
      const fsStore = getFsMemoryStore();
      return await fsStore.findDocuments(query, {
        k: options.k || memoryToolConfig.defaultK,
      });
    }
  } catch (error) {
    log.error('[Memory Tool] Failed to find documents:', error);
    return { success: false, error: error instanceof Error ? error.message : '搜索文档失败' };
  }
}

/**
 * 问答查询（双后端支持，IPC 调用）
 */
export async function askQuestion(question: string, options: any = {}): Promise<{ success: boolean; error?: string; answer?: string; context?: string }> {
  try {
    if (!memoryToolConfig.enabled) {
      return { success: false, error: '记忆功能未启用' };
    }

    await ensureBackend();

    if (currentBackend === 'memvid') {
      const memvid = getMemvidStore();
      return await memvid.askQuestion(question, {
        mode: options.mode || memoryToolConfig.searchMode,
        k: options.k || memoryToolConfig.defaultK,
        contextOnly: options.contextOnly ?? false,
      });
    } else {
      const fsStore = getFsMemoryStore();
      return await fsStore.askQuestion(question, {
        k: options.k || memoryToolConfig.defaultK,
      });
    }
  } catch (error) {
    log.error('[Memory Tool] Failed to ask question:', error);
    return { success: false, error: error instanceof Error ? error.message : '问答查询失败' };
  }
}

/**
 * 获取单个文档（双后端支持）
 */
export async function getDocument(id: string): Promise<{ success: boolean; error?: string; document?: any }> {
  try {
    if (!memoryToolConfig.enabled) {
      return { success: false, error: '记忆功能未启用' };
    }

    await ensureBackend();

    if (currentBackend === 'memvid') {
      const memvid = getMemvidStore();
      return await memvid.getDocument(id);
    } else {
      const fsStore = getFsMemoryStore();
      return await fsStore.getDocument(id);
    }
  } catch (error) {
    log.error('[Memory Tool] Failed to get document:', error);
    return { success: false, error: error instanceof Error ? error.message : '获取文档失败' };
  }
}

/**
 * 更新文档（双后端支持）
 */
export async function updateDocument(id: string, updates: { title?: string; text?: string; label?: string; tags?: string[] }): Promise<{ success: boolean; error?: string }> {
  try {
    if (!memoryToolConfig.enabled) {
      return { success: false, error: '记忆功能未启用' };
    }

    await ensureBackend();

    if (currentBackend === 'memvid') {
      const memvid = getMemvidStore();
      return await memvid.updateDocument(id, updates);
    } else {
      const fsStore = getFsMemoryStore();
      return await fsStore.updateDocument(id, updates);
    }
  } catch (error) {
    log.error('[Memory Tool] Failed to update document:', error);
    return { success: false, error: error instanceof Error ? error.message : '更新文档失败' };
  }
}

/**
 * 删除文档（双后端支持）
 */
export async function deleteDocument(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!memoryToolConfig.enabled) {
      return { success: false, error: '记忆功能未启用' };
    }

    await ensureBackend();

    if (currentBackend === 'memvid') {
      const memvid = getMemvidStore();
      return await memvid.deleteDocument(id);
    } else {
      const fsStore = getFsMemoryStore();
      return await fsStore.deleteDocument(id);
    }
  } catch (error) {
    log.error('[Memory Tool] Failed to delete document:', error);
    return { success: false, error: error instanceof Error ? error.message : '删除文档失败' };
  }
}

/**
 * 自动存储记忆（用于会话结束时自动记录重要信息）
 */
export const MEMORY_TOOLS = [
  {
    name: 'memory_search',
    description: '从长期记忆中搜索相关信息。用于查找之前存储的项目信息、技术决策、用户偏好等。',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索关键词或问题',
        },
        k: {
          type: 'number',
          description: '返回结果数量（默认6）',
          default: 6,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'memory_store',
    description: '将重要信息存储到长期记忆中。用于记录项目决策、技术方案、用户偏好等重要信息。',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: '信息标题（简短描述）',
        },
        text: {
          type: 'string',
          description: '信息详细内容',
        },
        label: {
          type: 'string',
          description: '分类标签（project/preference/technical/context/custom）',
          default: 'custom',
        },
      },
      required: ['title', 'text'],
    },
  },
  {
    name: 'memory_ask',
    description: '基于记忆的问答。使用 RAG（检索增强生成）技术，根据记忆内容回答问题。',
    input_schema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: '要回答的问题',
        },
        k: {
          type: 'number',
          description: '检索相关记忆的数量（默认6）',
          default: 6,
        },
      },
      required: ['question'],
    },
  },
] as const;
