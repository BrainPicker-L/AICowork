/**
 * Memvid AI 记忆存储库
 * 使用 @memvid/sdk 提供持久化的 AI 记忆功能
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { app } from 'electron';
import { use, create, MemvidError } from '@memvid/sdk';
import { log } from '../logger.js';
import { tmpdir } from 'os';

/**
 * 记忆文档接口
 */
export interface MemoryDocument {
  id?: string;
  title: string;
  label?: string;
  text: string;
  metadata?: Record<string, any>;
  uri?: string;
  tags?: string[];
}

/**
 * 获取 Memvid 数据目录
 */
function getMemvidDir(): string {
    const userDataPath = app.getPath('userData');
    return join(userDataPath, 'memvid');
}

/**
 * 获取默认记忆文件路径
 */
function getMemoryFilePath(): string {
    return join(getMemvidDir(), 'memory.mv2');
}

/**
 * 确保 Memvid 目录存在
 */
async function ensureMemvidDir(): Promise<void> {
    const memvidDir = getMemvidDir();
    try {
        await fs.mkdir(memvidDir, { recursive: true });
        log.info(`[memvid-store] Directory ensured: ${memvidDir}`);
    } catch (error) {
        // 目录可能已存在，检查是否可访问
        try {
            await fs.access(memvidDir);
            log.info(`[memvid-store] Directory exists: ${memvidDir}`);
        } catch (accessError) {
            log.error(`[memvid-store] Failed to create/access directory: ${memvidDir}`, accessError);
            throw new Error(`无法创建记忆目录: ${memvidDir}`);
        }
    }
}

/**
 * 记忆文档接口
 */
export interface MemoryDocumentInput {
    title: string;
    label?: string;
    text: string;
    metadata?: Record<string, any>;
    uri?: string;
    tags?: string[];
}

/**
 * 搜索结果接口
 */
export interface SearchResult {
    hits: Array<{
        id: string;
        score: number;
        doc: MemoryDocument;
    }>;
    query: string;
    mode: string;
}

/**
 * 统计信息接口
 */
export interface MemoryStats {
    frame_count: number;
    size_bytes: number;
    has_lex_index: boolean;
    has_vec_index: boolean;
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 检查错误是否是锁定错误
 */
function isLockError(error: any): boolean {
    const errorMessage = error?.message || String(error);
    return errorMessage.includes('lock') ||
           errorMessage.includes('locked') ||
           errorMessage.includes('os error 32') ||
           errorMessage.includes('os error 33') ||
           errorMessage.includes('process cannot access');
}

/**
 * 清理临时目录中的锁文件
 */
async function cleanupLockFiles(): Promise<void> {
    try {
        // 1. 清理 memvid 目录下的锁文件
        const memvidDir = getMemvidDir();
        const memvidTempDir = join(memvidDir, '.tmp');

        try {
            const files = await fs.readdir(memvidTempDir);
            const lockFiles = files.filter(f => f.includes('.lock') || f.includes('tantivy'));

            for (const lockFile of lockFiles) {
                try {
                    const lockPath = join(memvidTempDir, lockFile);
                    await fs.unlink(lockPath);
                    log.info(`[memvid-store] Cleaned up lock file: ${lockFile}`);
                } catch (err) {
                    // 忽略清理失败的文件
                }
            }
        } catch {
            // 临时目录不存在，忽略
        }

        // 2. 清理系统临时目录中的锁文件
        // Memvid SDK 会在系统临时目录创建 .tmp* 目录
        const systemTempDir = tmpdir();
        try {
            const tempDirs = await fs.readdir(systemTempDir);
            const memvidTempDirs = tempDirs.filter(d => d.startsWith('.tmp'));

            for (const tempDirName of memvidTempDirs) {
                const tempPath = join(systemTempDir, tempDirName);
                try {
                    const files = await fs.readdir(tempPath);
                    const lockFiles = files.filter(f => f.includes('.lock') || f.includes('tantivy'));

                    for (const lockFile of lockFiles) {
                        try {
                            const lockPath = join(tempPath, lockFile);
                            await fs.unlink(lockPath);
                            log.info(`[memvid-store] Cleaned up lock file in system temp: ${lockPath}`);
                        } catch (err) {
                            // 忽略清理失败的文件
                        }
                    }

                    // 如果目录为空，删除目录
                    try {
                        const remainingFiles = await fs.readdir(tempPath);
                        if (remainingFiles.length === 0) {
                            await fs.rmdir(tempPath);
                            log.info(`[memvid-store] Removed empty temp directory: ${tempPath}`);
                        }
                    } catch {
                        // 忽略删除失败
                    }
                } catch (err) {
                    // 忽略清理失败的目录
                }
            }
        } catch (err) {
            // 无法读取系统临时目录，忽略
        }
    } catch (err) {
        log.warn('[memvid-store] Failed to cleanup lock files:', err);
    }
}

/**
 * 带重试的操作
 */
async function withRetry<T>(
    operation: () => Promise<T>,
    options: { maxRetries?: number; retryDelay?: number; onRetry?: (attempt: number, error: any) => void } = {}
): Promise<T> {
    const maxRetries = options.maxRetries ?? 3;
    const retryDelay = options.retryDelay ?? 500;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt < maxRetries && isLockError(error)) {
                options.onRetry?.(attempt + 1, error);
                log.warn(`[memvid-store] Lock error on attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${retryDelay}ms...`);
                await delay(retryDelay);
                // 再次清理锁文件
                await cleanupLockFiles();
                continue;
            }
            throw error;
        }
    }
    throw new Error('Unexpected error in withRetry');
}

/**
 * Memvid 存储类
 */
class MemvidStore {
    private memory: any = null;
    private filePath: string;

    constructor(filePath?: string) {
        this.filePath = filePath || getMemoryFilePath();
    }

    /**
     * 初始化记忆存储（带重试机制）
     */
    async initialize(): Promise<void> {
        log.info(`[memvid-store] Initializing memory at: ${this.filePath}`);

        // 首先清理可能的遗留锁文件
        await cleanupLockFiles();

        // 首先确保目录存在
        await ensureMemvidDir();

        return withRetry(async () => {
            // 检查文件是否存在
            const fileExists = await fs.access(this.filePath).then(() => true).catch(() => false);
            log.info(`[memvid-store] Memory file exists: ${fileExists}`);

            if (fileExists) {
                // 文件存在，使用 use() 打开
                this.memory = await use('basic', this.filePath);
                log.info('[memvid-store] Opened existing memory file');
            } else {
                // 文件不存在，使用 create() 创建新文件
                this.memory = await create(this.filePath, 'basic');
                log.info('[memvid-store] Created new memory file with SDK');
            }

            log.info('[memvid-store] Memory initialized successfully');
        }, {
            maxRetries: 5,
            retryDelay: 1000,
            onRetry: (attempt) => {
                log.warn(`[memvid-store] Initialization attempt ${attempt} failed with lock error, retrying...`);
            }
        });
    }

    /**
     * 存储文档
     */
    async putDocument(input: MemoryDocumentInput): Promise<{ success: boolean; error?: string; id?: string }> {
        try {
            // 在操作前尝试清理锁文件
            await cleanupLockFiles();

            if (!this.memory) {
                await this.initialize();
            }

            const doc = await this.memory.put({
                title: input.title,
                label: input.label || 'general',
                text: input.text,
                metadata: input.metadata || {},
                uri: input.uri,
                tags: input.tags || [],
            });

            await this.memory.seal();

            log.info(`[memvid-store] Document stored: ${input.title}`);
            return { success: true, id: doc?.id };
        } catch (error) {
            if (error instanceof MemvidError) {
                log.error(`[memvid-store] Memvid error ${error.code}: ${error.message}`);
                return { success: false, error: `[${error.code}] ${error.message}` };
            }
            log.error('[memvid-store] Failed to store document:', error);
            return { success: false, error: error instanceof Error ? error.message : '存储文档失败' };
        }
    }

    /**
     * 批量存储文档
     */
    async putDocuments(inputs: MemoryDocumentInput[]): Promise<{ success: boolean; error?: string; count?: number }> {
        try {
            // 在操作前尝试清理锁文件
            await cleanupLockFiles();

            if (!this.memory) {
                await this.initialize();
            }

            const docs = inputs.map(input => ({
                title: input.title,
                label: input.label || 'general',
                text: input.text,
                metadata: input.metadata || {},
                uri: input.uri,
                tags: input.tags || [],
            }));

            const frameIds = await this.memory.putMany(docs, { compressionLevel: 3 });
            await this.memory.seal();

            log.info(`[memvid-store] Batch stored ${frameIds.length} documents`);
            return { success: true, count: frameIds.length };
        } catch (error) {
            if (error instanceof MemvidError) {
                log.error(`[memvid-store] Memvid error ${error.code}: ${error.message}`);
                return { success: false, error: `[${error.code}] ${error.message}` };
            }
            log.error('[memvid-store] Failed to store documents:', error);
            return { success: false, error: error instanceof Error ? error.message : '批量存储文档失败' };
        }
    }

    /**
     * 搜索文档
     */
    async findDocuments(query: string, options: { mode?: 'lex' | 'sem' | 'auto'; k?: number } = {}): Promise<{ success: boolean; error?: string; results?: SearchResult }> {
        try {
            if (!this.memory) {
                await this.initialize();
            }

            const results = await this.memory.find(query, {
                mode: options.mode || 'lex',
                k: options.k || 10,
            });

            log.info(`[memvid-store] Found ${results.hits.length} results for: ${query}`);
            return { success: true, results };
        } catch (error) {
            if (error instanceof MemvidError) {
                if (error.code === 'MV004') {
                    return { success: false, error: '词法索引未启用，无法进行搜索' };
                }
                log.error(`[memvid-store] Memvid error ${error.code}: ${error.message}`);
                return { success: false, error: `[${error.code}] ${error.message}` };
            }
            log.error('[memvid-store] Failed to search documents:', error);
            return { success: false, error: error instanceof Error ? error.message : '搜索文档失败' };
        }
    }

    /**
     * 问答查询（RAG）
     */
    async askQuestion(question: string, options: { k?: number; mode?: 'lex' | 'sem' | 'auto'; contextOnly?: boolean } = {}): Promise<{ success: boolean; error?: string; answer?: string; context?: string }> {
        try {
            if (!this.memory) {
                await this.initialize();
            }

            const response = await this.memory.ask(question, {
                k: options.k || 6,
                mode: options.mode || 'lex',
                contextOnly: options.contextOnly || true,
            });

            log.info(`[memvid-store] Answer generated for: ${question}`);
            return { success: true, answer: response.answer, context: response.context };
        } catch (error) {
            if (error instanceof MemvidError) {
                log.error(`[memvid-store] Memvid error ${error.code}: ${error.message}`);
                return { success: false, error: `[${error.code}] ${error.message}` };
            }
            log.error('[memvid-store] Failed to ask question:', error);
            return { success: false, error: error instanceof Error ? error.message : '问答查询失败' };
        }
    }

    /**
     * 获取统计信息
     */
    async getStats(): Promise<{ success: boolean; error?: string; stats?: MemoryStats }> {
        try {
            if (!this.memory) {
                await this.initialize();
            }

            const stats = await this.memory.stats();
            return { success: true, stats };
        } catch (error) {
            log.error('[memvid-store] Failed to get stats:', error);
            return { success: false, error: error instanceof Error ? error.message : '获取统计信息失败' };
        }
    }

    /**
     * 获取时间线
     */
    async getTimeline(options: { limit?: number; since?: number; reverse?: boolean } = {}): Promise<{ success: boolean; error?: string; entries?: any[] }> {
        try {
            if (!this.memory) {
                await this.initialize();
            }

            const entries = await this.memory.timeline({
                limit: options.limit || 50,
                since: options.since,
                reverse: options.reverse || true,
            });

            return { success: true, entries };
        } catch (error) {
            if (error instanceof MemvidError) {
                if (error.code === 'MV005') {
                    return { success: false, error: '时间索引未启用' };
                }
                log.error(`[memvid-store] Memvid error ${error.code}: ${error.message}`);
                return { success: false, error: `[${error.code}] ${error.message}` };
            }
            log.error('[memvid-store] Failed to get timeline:', error);
            return { success: false, error: error instanceof Error ? error.message : '获取时间线失败' };
        }
    }

    /**
     * 获取单个文档
     */
    async getDocument(frameId: string): Promise<{ success: boolean; error?: string; document?: any }> {
        try {
            if (!this.memory) {
                await this.initialize();
            }

            // 从时间线获取文档
            const timeline = await this.memory.timeline({ limit: 10000, reverse: true });
            const entry = timeline.entries?.find((e: any) => e.frame_id === frameId);

            if (!entry) {
                return { success: false, error: '文档不存在' };
            }

            return { success: true, document: entry.doc };
        } catch (error) {
            log.error('[memvid-store] Failed to get document:', error);
            return { success: false, error: error instanceof Error ? error.message : '获取文档失败' };
        }
    }

    /**
     * 更新文档（Memvid 暂不支持更新，返回错误）
     */
    async updateDocument(frameId: string, updates: { title?: string; text?: string; label?: string; tags?: string[] }): Promise<{ success: boolean; error?: string }> {
        try {
            // Memvid SDK 暂不支持更新现有文档
            log.warn(`[memvid-store] Update not implemented for frame: ${frameId}`);
            return { success: false, error: 'Memvid 暂不支持更新文档，请删除后重新添加' };
        } catch (error) {
            log.error('[memvid-store] Failed to update document:', error);
            return { success: false, error: error instanceof Error ? error.message : '更新文档失败' };
        }
    }

    /**
     * 删除文档
     */
    async deleteDocument(frameId: string): Promise<{ success: boolean; error?: string }> {
        try {
            if (!this.memory) {
                await this.initialize();
            }

            // Memvid SDK 暂不支持删除单个文档
            log.warn(`[memvid-store] Delete not implemented for frame: ${frameId}`);
            return { success: false, error: 'Memvid 暂不支持删除单个文档' };
        } catch (error) {
            log.error('[memvid-store] Failed to delete document:', error);
            return { success: false, error: error instanceof Error ? error.message : '删除文档失败' };
        }
    }

    /**
     * 清空所有记忆
     */
    async clearAll(): Promise<{ success: boolean; error?: string }> {
        try {
            // 关闭当前连接
            if (this.memory) {
                await this.memory.seal();
                this.memory = null;
            }

            // 删除记忆文件
            const filePath = this.filePath;
            try {
                await fs.unlink(filePath);
                log.info('[memvid-store] Memory file deleted');
            } catch {
                // 文件不存在，忽略
            }

            // 重新初始化
            await this.initialize();

            return { success: true };
        } catch (error) {
            log.error('[memvid-store] Failed to clear memory:', error);
            return { success: false, error: error instanceof Error ? error.message : '清空记忆失败' };
        }
    }

    /**
     * 关闭记忆存储
     */
    async close(): Promise<void> {
        if (this.memory) {
            await this.memory.seal();
            this.memory = null;
            log.info('[memvid-store] Memory closed');
        }
    }
}

// 单例实例
let storeInstance: MemvidStore | null = null;

/**
 * 获取 Memvid 存储实例
 */
export function getMemvidStore(): MemvidStore {
    if (!storeInstance) {
        storeInstance = new MemvidStore();
    }
    return storeInstance;
}

/**
 * 初始化 Memvid 存储
 */
export async function initializeMemvid(): Promise<void> {
    const store = getMemvidStore();
    await store.initialize();
}
