/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-22
 * @updated     2026-01-22
 * @Email       None
 *
 * 文件系统记忆存储库
 * 使用简单的 JSON 文件存储实现 AI 记忆功能
 * 当 Memvid SDK 不可用时作为后备方案
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { app } from 'electron';
import { log } from '../logger.js';

/**
 * 记忆文档接口
 */
export interface MemoryDocument {
  id: string;
  title: string;
  label: string;
  text: string;
  metadata?: Record<string, any>;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

/**
 * 记忆存储数据结构
 */
interface MemoryStoreData {
  documents: MemoryDocument[];
  indexes: {
    byLabel: Record<string, string[]>; // label -> document IDs
    byTag: Record<string, string[]>;   // tag -> document IDs
  };
}

/**
 * 获取记忆数据目录
 */
function getMemoryDir(): string {
  const userDataPath = app.getPath('userData');
  return join(userDataPath, 'memory');
}

/**
 * 获取记忆存储文件路径
 */
function getStoreFilePath(): string {
  return join(getMemoryDir(), 'memory-store.json');
}

/**
 * 确保记忆目录存在
 */
async function ensureMemoryDir(): Promise<void> {
  const memoryDir = getMemoryDir();
  try {
    await fs.mkdir(memoryDir, { recursive: true });
    log.info(`[fs-memory-store] Directory ensured: ${memoryDir}`);
  } catch (error) {
    log.error(`[fs-memory-store] Failed to create directory: ${memoryDir}`, error);
    throw new Error(`无法创建记忆目录: ${memoryDir}`);
  }
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 文件系统记忆存储类
 */
class FsMemoryStore {
  private data: MemoryStoreData;
  private filePath: string;

  constructor() {
    this.filePath = getStoreFilePath();
    this.data = {
      documents: [],
      indexes: {
        byLabel: {},
        byTag: {}
      }
    };
  }

  /**
   * 初始化存储
   */
  async initialize(): Promise<void> {
    try {
      log.info(`[fs-memory-store] Initializing memory at: ${this.filePath}`);

      await ensureMemoryDir();

      // 尝试加载现有数据
      const fileExists = await fs.access(this.filePath).then(() => true).catch(() => false);

      if (fileExists) {
        const content = await fs.readFile(this.filePath, 'utf-8');
        this.data = JSON.parse(content);
        log.info(`[fs-memory-store] Loaded ${this.data.documents.length} documents`);
      } else {
        // 创建新存储
        await this.save();
        log.info('[fs-memory-store] Created new memory store');
      }

      log.info('[fs-memory-store] Memory initialized successfully');
    } catch (error) {
      log.error('[fs-memory-store] Failed to initialize memory:', error);
      throw error;
    }
  }

  /**
   * 保存数据到文件
   */
  private async save(): Promise<void> {
    try {
      const content = JSON.stringify(this.data, null, 2);
      await fs.writeFile(this.filePath, content, 'utf-8');
    } catch (error) {
      log.error('[fs-memory-store] Failed to save memory:', error);
      throw error;
    }
  }

  /**
   * 更新索引
   */
  private updateIndexes(doc: MemoryDocument, remove = false): void {
    // 更新 label 索引
    if (!this.data.indexes.byLabel[doc.label]) {
      this.data.indexes.byLabel[doc.label] = [];
    }
    if (remove) {
      this.data.indexes.byLabel[doc.label] = this.data.indexes.byLabel[doc.label].filter(id => id !== doc.id);
    } else {
      if (!this.data.indexes.byLabel[doc.label].includes(doc.id)) {
        this.data.indexes.byLabel[doc.label].push(doc.id);
      }
    }

    // 更新 tag 索引
    if (doc.tags) {
      for (const tag of doc.tags) {
        if (!this.data.indexes.byTag[tag]) {
          this.data.indexes.byTag[tag] = [];
        }
        if (remove) {
          this.data.indexes.byTag[tag] = this.data.indexes.byTag[tag].filter(id => id !== doc.id);
        } else {
          if (!this.data.indexes.byTag[tag].includes(doc.id)) {
            this.data.indexes.byTag[tag].push(doc.id);
          }
        }
      }
    }
  }

  /**
   * 存储文档
   */
  async putDocument(input: Omit<MemoryDocument, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const now = new Date().toISOString();
      const doc: MemoryDocument = {
        id: generateId(),
        title: input.title,
        label: input.label || 'general',
        text: input.text,
        metadata: input.metadata || {},
        tags: input.tags || [],
        created_at: now,
        updated_at: now
      };

      this.data.documents.push(doc);
      this.updateIndexes(doc);
      await this.save();

      log.info(`[fs-memory-store] Document stored: ${doc.title}`);
      return { success: true, id: doc.id };
    } catch (error) {
      log.error('[fs-memory-store] Failed to store document:', error);
      return { success: false, error: error instanceof Error ? error.message : '存储文档失败' };
    }
  }

  /**
   * 搜索文档 (简单的关键词匹配)
   */
  async findDocuments(query: string, options: { k?: number; label?: string } = {}): Promise<{ success: boolean; error?: string; results?: any }> {
    try {
      const k = options.k || 10;
      const queryLower = query.toLowerCase();

      // 计算相关性分数
      const scored = this.data.documents.map(doc => {
        let score = 0;
        const textLower = doc.text.toLowerCase();
        const titleLower = doc.title.toLowerCase();

        // 标题匹配权重更高
        if (titleLower.includes(queryLower)) {
          score += 10;
        }

        // 内容匹配
        const occurrences = (textLower.match(new RegExp(queryLower, 'g')) || []).length;
        score += occurrences;

        // 标签匹配
        if (doc.tags) {
          for (const tag of doc.tags) {
            if (tag.toLowerCase().includes(queryLower)) {
              score += 5;
            }
          }
        }

        return { doc, score };
      });

      // 过滤掉无分数的结果并排序
      const results = scored
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, k)
        .map(item => ({
          id: item.doc.id,
          score: item.score,
          doc: item.doc
        }));

      log.info(`[fs-memory-store] Found ${results.length} results for: ${query}`);
      return {
        success: true,
        results: {
          hits: results,
          query,
          mode: 'keyword'
        }
      };
    } catch (error) {
      log.error('[fs-memory-store] Failed to search documents:', error);
      return { success: false, error: error instanceof Error ? error.message : '搜索文档失败' };
    }
  }

  /**
   * 问答查询 (简单的上下文检索)
   */
  async askQuestion(question: string, options: { k?: number } = {}): Promise<{ success: boolean; error?: string; answer?: string; context?: string }> {
    try {
      const k = options.k || 6;
      const searchResult = await this.findDocuments(question, { k });

      if (!searchResult.success || !searchResult.results || searchResult.results.hits.length === 0) {
        return {
          success: true,
          answer: '没有找到相关的记忆。',
          context: ''
        };
      }

      // 构建上下文
      const context = searchResult.results.hits
        .map(hit => `# ${hit.doc.title}\n${hit.doc.text}`)
        .join('\n\n');

      return {
        success: true,
        answer: `基于找到的 ${searchResult.results.hits.length} 条记忆：\n${context}`,
        context
      };
    } catch (error) {
      log.error('[fs-memory-store] Failed to ask question:', error);
      return { success: false, error: error instanceof Error ? error.message : '问答查询失败' };
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{ success: boolean; error?: string; stats?: any }> {
    try {
      const stats = {
        frame_count: this.data.documents.length,
        size_bytes: (await fs.stat(this.filePath)).size,
        has_lex_index: true,
        has_vec_index: false
      };
      return { success: true, stats };
    } catch (error) {
      log.error('[fs-memory-store] Failed to get stats:', error);
      return { success: false, error: error instanceof Error ? error.message : '获取统计信息失败' };
    }
  }

  /**
   * 获取时间线
   */
  async getTimeline(options: { limit?: number; reverse?: boolean } = {}): Promise<{ success: boolean; error?: string; entries?: any[] }> {
    try {
      const limit = options.limit || 50;
      const entries = [...this.data.documents]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      if (options.reverse !== false) {
        entries.reverse();
      }

      return {
        success: true,
        entries: entries.slice(0, limit).map(doc => ({
          frame_id: doc.id,
          timestamp: new Date(doc.created_at).getTime(),
          doc
        }))
      };
    } catch (error) {
      log.error('[fs-memory-store] Failed to get timeline:', error);
      return { success: false, error: error instanceof Error ? error.message : '获取时间线失败' };
    }
  }

  /**
   * 清空所有记忆
   */
  async clearAll(): Promise<{ success: boolean; error?: string }> {
    try {
      this.data = {
        documents: [],
        indexes: {
          byLabel: {},
          byTag: {}
        }
      };
      await this.save();
      log.info('[fs-memory-store] Memory cleared');
      return { success: true };
    } catch (error) {
      log.error('[fs-memory-store] Failed to clear memory:', error);
      return { success: false, error: error instanceof Error ? error.message : '清空记忆失败' };
    }
  }

  /**
   * 获取单个文档
   */
  async getDocument(id: string): Promise<{ success: boolean; error?: string; document?: any }> {
    try {
      const doc = this.data.documents.find(d => d.id === id);
      if (!doc) {
        return { success: false, error: '文档不存在' };
      }
      return { success: true, document: doc };
    } catch (error) {
      log.error('[fs-memory-store] Failed to get document:', error);
      return { success: false, error: error instanceof Error ? error.message : '获取文档失败' };
    }
  }

  /**
   * 更新文档
   */
  async updateDocument(id: string, updates: { title?: string; text?: string; label?: string; tags?: string[] }): Promise<{ success: boolean; error?: string }> {
    try {
      const index = this.data.documents.findIndex(d => d.id === id);
      if (index === -1) {
        return { success: false, error: '文档不存在' };
      }

      // 更新文档
      const doc = this.data.documents[index];
      if (updates.title) doc.title = updates.title;
      if (updates.text) doc.text = updates.text;
      if (updates.label) doc.label = updates.label;
      if (updates.tags) doc.tags = updates.tags;
      doc.updated_at = new Date().toISOString();

      // 更新索引
      this.updateIndexes(doc, false);
      this.updateIndexes(doc, true);

      await this.save();
      log.info(`[fs-memory-store] Document updated: ${id}`);
      return { success: true };
    } catch (error) {
      log.error('[fs-memory-store] Failed to update document:', error);
      return { success: false, error: error instanceof Error ? error.message : '更新文档失败' };
    }
  }

  /**
   * 删除文档
   */
  async deleteDocument(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const index = this.data.documents.findIndex(d => d.id === id);
      if (index === -1) {
        return { success: false, error: '文档不存在' };
      }

      const doc = this.data.documents[index];

      // 更新索引
      this.updateIndexes(doc, true);

      // 删除文档
      this.data.documents.splice(index, 1);

      await this.save();
      log.info(`[fs-memory-store] Document deleted: ${id}`);
      return { success: true };
    } catch (error) {
      log.error('[fs-memory-store] Failed to delete document:', error);
      return { success: false, error: error instanceof Error ? error.message : '删除文档失败' };
    }
  }

  /**
   * 关闭存储
   */
  async close(): Promise<void> {
    await this.save();
    log.info('[fs-memory-store] Memory closed');
  }
}

// 单例实例
let storeInstance: FsMemoryStore | null = null;

/**
 * 获取文件系统记忆存储实例
 */
export function getFsMemoryStore(): FsMemoryStore {
  if (!storeInstance) {
    storeInstance = new FsMemoryStore();
  }
  return storeInstance;
}

/**
 * 初始化文件系统记忆存储
 */
export async function initializeFsMemory(): Promise<void> {
  const store = getFsMemoryStore();
  await store.initialize();
}
