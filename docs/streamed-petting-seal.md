# Memvid AI 内存系统集成计划

## 一、项目概述

### Memvid 简介
Memvid 是一个单文件 AI 内存系统，具有以下特性：
- **单文件存储** - 所有数据（内容、嵌入、索引）存储在一个 `.mv2` 文件中
- **多模态支持** - 文本、图像、音频、PDF、DOCX、PPTX、XLSX
- **强大搜索** - 全文搜索（BM25）、向量搜索（HNSW）、CLIP 视觉搜索
- **时间旅行** - 支持历史状态查询和调试
- **本地优先** - 无需数据库，完全离线工作
- **跨平台 SDK** - Rust 核心，Node.js/Python SDK

### 当前项目（Claude-Cowork）分析
- **前端**: React + TypeScript + Tailwind CSS
- **后端**: Electron (Node.js)
- **数据库**: better-sqlite3
- **状态管理**: Zustand
- **已有功能**: API 配置、MCP 服务器、技能系统、会话管理

---

## 二、集成目标

将 Memvid 作为 AI 对话的持久化内存层，为 Claude-Cowork 提供：

1. **对话历史记忆** - 存储和检索历史对话内容
2. **知识库管理** - 存储文档、笔记、代码片段
3. **智能搜索** - 快速检索相关记忆
4. **多模态支持** - 处理文本、图像、文档等
5. **时间旅行** - 查看历史状态和变更

---

## 三、技术方案

### 方案选择：使用 Node.js SDK

Memvid 提供官方的 Node.js SDK `@memvid/sdk`，可以直接在 Electron 主进程中使用。

```bash
npm install @memvid/sdk
```

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                      React UI 层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ MemoryPanel  │  │ SearchPanel  │  │  DocViewer   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Electron 主进程                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              MemvidService (新增)                     │   │
│  │  - 初始化和管理 .mv2 文件                              │   │
│  │  - 提供内存操作的 IPC 接口                             │   │
│  │  - 处理搜索、存储、检索                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   @memvid/sdk                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  文件存储     │  │  全文搜索     │  │  向量搜索     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    memory.mv2 文件                           │
│  数据段 + Lex索引 + Vec索引 + 时间索引 + TOC                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 四、详细实施步骤

### 阶段一：环境准备与依赖安装

#### 1.1 安装依赖
```bash
# 安装 @memvid/sdk
npm install @memvid/sdk

# 或使用 pnpm
pnpm add @memvid/sdk

# 或使用 bun
bun add @memvid/sdk
```

#### 1.2 更新 package.json
```json
{
  "dependencies": {
    "@memvid/sdk": "^2.0.146"
  }
}
```

#### 1.3 更新 TypeScript 配置
确保 `tsconfig.json` 包含正确的模块解析：

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}
```

---

### 阶段二：核心服务实现

#### 2.1 创建 MemvidService（完整版）
**文件**: `src/electron/services/memvid-service.ts`

```typescript
/**
 * @fileoverview Memvid AI 内存管理服务 - 完整实现
 * @author Alan
 * @description 提供内存存储、搜索、检索等功能
 * @created 2025-01-21
 * @license AGPL-3.0
 */

import { Memvid } from '@memvid/sdk';
import path from 'path';
import fs from 'fs';
import { log } from '../logger.js';

/**
 * 内存存储选项
 */
export interface MemoryPutOptions {
  /** 文档标题 */
  title?: string;
  /** 层级化 URI (mv2://path/to/doc) */
  uri?: string;
  /** 用户标签 */
  tags?: Record<string, string>;
  /** 内容类型 */
  kind?: string;
  /** 自动提取日期 */
  extractDates?: boolean;
  /** 自动打标签 */
  autoTag?: boolean;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  /** 帧标识符 */
  frameId: number;
  /** 文档标题 */
  title?: string;
  /** 文档 URI */
  uri?: string;
  /** 匹配文本片段 */
  text: string;
  /** 相关性分数 */
  score?: number;
  /** 时间戳 */
  timestamp?: number;
  /** 文本范围 */
  range?: [number, number];
  /** 分块范围 */
  chunkRange?: [number, number];
}

/**
 * 时间线索引
 */
export interface TimelineEntry {
  frameId: number;
  uri?: string;
  preview: string;
  timestamp?: number;
}

/**
 * 内存统计信息
 */
export interface MemoryStats {
  frameCount: number;
  hasLexIndex: boolean;
  hasVecIndex: boolean;
  hasTimeIndex: boolean;
  fileSize: number;
}

/**
 * 自定义错误类
 */
export class MemvidServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'MemvidServiceError';
  }
}

/**
 * Memvid 内存管理服务
 *
 * @example
 * ```typescript
 * const service = new MemvidService(app.getPath('userData'));
 * await service.initialize();
 * await service.putMemory('Hello, world!', { title: 'First' });
 * const results = await service.search('hello');
 * ```
 */
export class MemvidService {
  private memvid: Memvid | null = null;
  private memoryPath: string;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(userDataPath: string) {
    this.memoryPath = path.join(userDataPath, 'memory.mv2');
    log.info('[MemvidService] Service created with path:', this.memoryPath);
  }

  /**
   * 初始化内存服务
   * 创建或打开 .mv2 文件
   *
   * @throws {MemvidServiceError} 初始化失败时抛出
   */
  async initialize(): Promise<void> {
    // 防止重复初始化
    if (this.isInitialized) {
      log.warn('[MemvidService] Already initialized');
      return;
    }

    // 如果正在初始化，等待完成
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize();

    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  private async _initialize(): Promise<void> {
    try {
      log.info('[MemvidService] Initializing...');

      // 确保目录存在
      const dir = path.dirname(this.memoryPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        log.info('[MemvidService] Created directory:', dir);
      }

      // 打开或创建内存文件
      if (fs.existsSync(this.memoryPath)) {
        log.info('[MemvidService] Opening existing memory file');
        this.memvid = await Memvid.open(this.memoryPath);
      } else {
        log.info('[MemvidService] Creating new memory file');
        this.memvid = await Memvid.create(this.memoryPath);
      }

      this.isInitialized = true;
      const stats = await this.getStats();
      log.info('[MemvidService] Initialized successfully', {
        frameCount: stats.frameCount,
        hasLexIndex: stats.hasLexIndex,
        hasVecIndex: stats.hasVecIndex,
        fileSize: stats.fileSize,
      });
    } catch (error) {
      log.error('[MemvidService] Failed to initialize:', error);
      throw new MemvidServiceError(
        'Failed to initialize Memvid service',
        'INIT_FAILED',
        error
      );
    }
  }

  /**
   * 确保服务已初始化
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.memvid) {
      throw new MemvidServiceError(
        'Memvid service not initialized. Call initialize() first.',
        'NOT_INITIALIZED'
      );
    }
  }

  /**
   * 存储内容到内存
   *
   * @param content - 要存储的内容
   * @param options - 存储选项
   * @returns 帧标识符
   * @throws {MemvidServiceError} 存储失败时抛出
   */
  async putMemory(
    content: string,
    options?: MemoryPutOptions
  ): Promise<number> {
    this.ensureInitialized();

    try {
      log.debug('[MemvidService] Putting memory:', {
        title: options?.title,
        uri: options?.uri,
        contentLength: content.length,
      });

      const frameId = await this.memvid!.put(content, {
        title: options?.title,
        uri: options?.uri,
        tags: options?.tags,
        kind: options?.kind,
      });

      await this.memvid!.commit();

      log.info('[MemvidService] Memory stored successfully', { frameId });
      return frameId;
    } catch (error) {
      log.error('[MemvidService] Failed to put memory:', error);
      throw new MemvidServiceError(
        'Failed to store memory',
        'PUT_FAILED',
        error
      );
    }
  }

  /**
   * 批量存储内容
   *
   * @param items - 要存储的内容数组
   * @returns 成功存储的帧标识符数组
   */
  async putMemoryBatch(
    items: Array<{ content: string; options?: MemoryPutOptions }>
  ): Promise<number[]> {
    this.ensureInitialized();

    const frameIds: number[] = [];
    const errors: Array<{ index: number; error: Error }> = [];

    log.info('[MemvidService] Putting batch memory:', { count: items.length });

    for (let i = 0; i < items.length; i++) {
      try {
        const frameId = await this.putMemory(items[i].content, items[i].options);
        frameIds.push(frameId);
      } catch (error) {
        log.error(`[MemvidService] Failed to put memory at index ${i}:`, error);
        errors.push({ index: i, error: error as Error });
      }
    }

    if (errors.length > 0) {
      log.warn('[MemvidService] Batch put completed with errors:', {
        total: items.length,
        success: frameIds.length,
        failed: errors.length,
      });
    }

    return frameIds;
  }

  /**
   * 搜索内存内容
   *
   * @param query - 搜索查询
   * @param topK - 返回结果数量
   * @returns 搜索结果列表
   * @throws {MemvidServiceError} 搜索失败时抛出
   */
  async search(query: string, topK: number = 10): Promise<SearchResult[]> {
    this.ensureInitialized();

    try {
      log.debug('[MemvidService] Searching:', { query, topK });

      const response = await this.memvid!.search({
        query,
        topK: topK,
        snippetChars: 200,
      });

      const results = response.hits.map(hit => ({
        frameId: hit.frameId,
        title: hit.title,
        uri: hit.uri,
        text: hit.text,
        score: hit.score,
        timestamp: hit.timestamp,
        range: hit.range,
        chunkRange: hit.chunkRange,
      }));

      log.info('[MemvidService] Search completed', {
        query,
        totalHits: response.totalHits,
        elapsedMs: response.elapsedMs,
        returned: results.length,
      });

      return results;
    } catch (error) {
      log.error('[MemvidService] Failed to search:', error);
      throw new MemvidServiceError(
        'Failed to search memory',
        'SEARCH_FAILED',
        error
      );
    }
  }

  /**
   * 获取内存时间线
   *
   * @param limit - 返回条目数量
   * @returns 时间线条目
   */
  async getTimeline(limit: number = 50): Promise<TimelineEntry[]> {
    this.ensureInitialized();

    try {
      log.debug('[MemvidService] Getting timeline:', { limit });

      const timeline = await this.memvid!.timeline({ limit });

      const entries = timeline.map(entry => ({
        frameId: entry.frameId,
        uri: entry.uri,
        preview: entry.preview,
        timestamp: entry.timestamp,
      }));

      log.info('[MemvidService] Timeline retrieved', { count: entries.length });
      return entries;
    } catch (error) {
      log.error('[MemvidService] Failed to get timeline:', error);
      throw new MemvidServiceError(
        'Failed to get timeline',
        'TIMELINE_FAILED',
        error
      );
    }
  }

  /**
   * 获取内存统计信息
   *
   * @returns 统计信息
   */
  async getStats(): Promise<MemoryStats> {
    this.ensureInitialized();

    try {
      const stats = await this.memvid!.stats();
      const fileSize = fs.statSync(this.memoryPath).size;

      return {
        frameCount: stats.frameCount,
        hasLexIndex: stats.hasLexIndex,
        hasVecIndex: stats.hasVecIndex,
        hasTimeIndex: stats.hasTimeIndex,
        fileSize,
      };
    } catch (error) {
      log.error('[MemvidService] Failed to get stats:', error);
      throw new MemvidServiceError(
        'Failed to get stats',
        'STATS_FAILED',
        error
      );
    }
  }

  /**
   * 关闭内存服务
   */
  async close(): Promise<void> {
    if (this.memvid) {
      log.info('[MemvidService] Closing service...');
      try {
        await this.memvid.close();
        this.memvid = null;
        this.isInitialized = false;
        log.info('[MemvidService] Service closed successfully');
      } catch (error) {
        log.error('[MemvidService] Error closing service:', error);
        throw new MemvidServiceError(
          'Failed to close Memvid service',
          'CLOSE_FAILED',
          error
        );
      }
    }
  }

  /**
   * 检查服务是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized && this.memvid !== null;
  }

  /**
   * 获取内存文件路径
   */
  getMemoryPath(): string {
    return this.memoryPath;
  }

  /**
   * 备份内存文件
   *
   * @param backupPath - 备份文件路径
   */
  async backup(backupPath?: string): Promise<string> {
    this.ensureInitialized();

    const targetPath = backupPath || this.memoryPath + '.backup';
    log.info('[MemvidService] Creating backup:', { from: this.memoryPath, to: targetPath });

    try {
      // 先确保所有更改已提交
      await this.memvid!.commit();

      // 复制文件
      await fs.promises.copyFile(this.memoryPath, targetPath);

      log.info('[MemvidService] Backup created successfully');
      return targetPath;
    } catch (error) {
      log.error('[MemvidService] Failed to create backup:', error);
      throw new MemvidServiceError(
        'Failed to create backup',
        'BACKUP_FAILED',
        error
      );
    }
  }
}

// 导出单例实例
let memvidServiceInstance: MemvidService | null = null;

export function getMemvidService(userDataPath: string): MemvidService {
  if (!memvidServiceInstance) {
    memvidServiceInstance = new MemvidService(userDataPath);
  }
  return memvidServiceInstance;
}

export async function cleanupMemvidService(): Promise<void> {
  if (memvidServiceInstance) {
    await memvidServiceInstance.close();
    memvidServiceInstance = null;
  }
}
```

#### 2.2 注册 IPC 处理器（完整版）
**文件**: `src/electron/ipc-handlers.ts` (添加到现有文件)

```typescript
/**
 * @fileoverview Memvid IPC 处理器
 * @author Alan
 * @description 处理渲染进程与 Memvid 服务之间的通信
 * @created 2025-01-21
 */

import { app } from 'electron';
import {
  getMemvidService,
  cleanupMemvidService,
  MemoryPutOptions,
  SearchResult,
  TimelineEntry,
  MemoryStats,
  MemvidServiceError,
} from './services/memvid-service.js';
import { log } from './logger.js';

// 全局服务实例
let memvidService = getMemvidService(app.getPath('userData'));

/**
 * IPC 响应包装
 */
interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 包装异步 IPC 调用的错误处理
 */
async function wrapIpcCall<T>(
  fn: () => Promise<T>
): Promise<IpcResponse<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    log.error('[IPC] Memvid operation failed:', error);

    if (error instanceof MemvidServiceError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

// ========== IPC 处理器注册 ==========

/**
 * 初始化 Memvid 服务
 */
ipcMainHandle('memvid:init', async () => {
  log.info('[IPC] memvid:init called');
  return wrapIpcCall(async () => {
    await memvidService.initialize();
    const stats = await memvidService.getStats();
    return stats;
  });
});

/**
 * 存储内存
 */
ipcMainHandle('memvid:put', async (_event, content: string, options?: MemoryPutOptions) => {
  log.debug('[IPC] memvid:put called', { title: options?.title, contentLength: content?.length });
  return wrapIpcCall(async () => {
    const frameId = await memvidService.putMemory(content, options);
    return { frameId };
  });
});

/**
 * 批量存储内存
 */
ipcMainHandle('memvid:putBatch', async (_event, items: Array<{ content: string; options?: MemoryPutOptions }>) => {
  log.info('[IPC] memvid:putBatch called', { count: items?.length });
  return wrapIpcCall(async () => {
    const frameIds = await memvidService.putMemoryBatch(items);
    return { frameIds, count: frameIds.length };
  });
});

/**
 * 搜索内存
 */
ipcMainHandle('memvid:search', async (_event, query: string, topK: number = 10) => {
  log.debug('[IPC] memvid:search called', { query, topK });
  return wrapIpcCall(async () => {
    const results = await memvidService.search(query, topK);
    return results;
  });
});

/**
 * 获取时间线
 */
ipcMainHandle('memvid:timeline', async (_event, limit: number = 50) => {
  log.debug('[IPC] memvid:timeline called', { limit });
  return wrapIpcCall(async () => {
    const timeline = await memvidService.getTimeline(limit);
    return timeline;
  });
});

/**
 * 获取统计信息
 */
ipcMainHandle('memvid:stats', async () => {
  log.debug('[IPC] memvid:stats called');
  return wrapIpcCall(async () => {
    const stats = await memvidService.getStats();
    return stats;
  });
});

/**
 * 备份内存文件
 */
ipcMainHandle('memvid:backup', async (_event, backupPath?: string) => {
  log.info('[IPC] memvid:backup called', { backupPath });
  return wrapIpcCall(async () => {
    const path = await memvidService.backup(backupPath);
    return { path };
  });
});

/**
 * 获取内存文件路径
 */
ipcMainHandle('memvid:getPath', async () => {
  log.debug('[IPC] memvid:getPath called');
  return wrapIpcCall(async () => {
    return memvidService.getMemoryPath();
  });
});

/**
 * 检查服务是否就绪
 */
ipcMainHandle('memvid:isReady', async () => {
  log.debug('[IPC] memvid:isReady called');
  return {
    success: true,
    data: { ready: memvidService.isReady() },
  };
});

/**
 * 应用退出时清理
 */
export async function cleanupMemvidOnExit(): Promise<void> {
  log.info('[IPC] Cleaning up Memvid service on exit');
  try {
    await cleanupMemvidService();
  } catch (error) {
    log.error('[IPC] Error cleaning up Memvid service:', error);
  }
}

// 在现有的 cleanup 函数中调用
// async function cleanup() {
//   ...
//   await cleanupMemvidOnExit();
//   ...
// }
```

---

### 阶段二：React UI 组件

#### 1. 创建内存面板
**文件**: `src/ui/components/MemoryPanel.tsx`

```typescript
/**
 * @author Alan
 * @description AI 内存面板组件
 * @created 2025-01-21
 */

import { useState, useEffect } from 'react';
import { Search, Clock, Database, FileText } from 'lucide-react';

interface MemoryPanelProps {
  className?: string;
}

export function MemoryPanel({ className }: MemoryPanelProps) {
  const [memories, setMemories] = useState<SearchResult[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'search'>('timeline');

  useEffect(() => {
    loadMemories();
    loadStats();
  }, []);

  const loadMemories = async () => {
    const result = await window.electron.ipcRenderer.invoke('memvid:timeline', 50);
    setMemories(result);
  };

  const loadStats = async () => {
    const result = await window.electron.ipcRenderer.invoke('memvid:stats');
    setStats(result);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const result = await window.electron.ipcRenderer.invoke('memvid:search', searchQuery, 20);
    setMemories(result);
    setActiveTab('search');
  };

  return (
    <div className={className}>
      {/* 头部统计 */}
      {stats && (
        <div className="flex gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span className="text-sm">{stats.frameCount} 条记忆</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="text-sm">{stats.hasLexIndex ? '全文索引' : '无索引'}</span>
          </div>
        </div>
      )}

      {/* 搜索框 */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="搜索记忆..."
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          搜索
        </button>
      </div>

      {/* 记忆列表 */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {memories.map((memory) => (
          <div key={memory.frameId} className="p-3 border rounded-lg hover:bg-gray-50">
            <div className="flex items-start justify-between mb-1">
              <span className="font-medium text-sm">
                {memory.title || '无标题'}
              </span>
              <span className="text-xs text-gray-500">#{memory.frameId}</span>
            </div>
            <p className="text-sm text-gray-700 line-clamp-2">
              {memory.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 2. 添加到设置页面
**文件**: `src/ui/pages/SettingsPage/sections/MemorySection.tsx`

```typescript
/**
 * @author Alan
 * @description AI 内存设置面板
 * @created 2025-01-21
 */

import { MemoryPanel } from '../../components/MemoryPanel';

export function MemorySection() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">AI 内存管理</h3>
        <p className="text-sm text-gray-600 mb-4">
          管理 AI 对话记忆和知识库，支持全文搜索和向量检索。
        </p>
      </div>

      <MemoryPanel className="w-full" />
    </div>
  );
}
```

---

### 阶段三：国际化支持

#### 3.1 中文翻译文件
**文件**: `src/ui/i18n/locales/zh.ts`

```typescript
/**
 * @fileoverview Memvid 中文翻译
 * @author Alan
 */

export default {
  memory: {
    title: 'AI 内存管理',
    description: '管理 AI 对话记忆和知识库，支持全文搜索和向量检索。所有数据存储在本地 .mv2 文件中，完全离线工作。',

    // 统计信息
    stats: {
      totalMemories: '条记忆',
      hasLexIndex: '全文索引',
      noIndex: '无索引',
      fileSize: 'MB',
    },

    // 标签页
    tabs: {
      timeline: '时间线',
      search: '搜索',
      stats: '统计',
    },

    // 搜索
    search: {
      placeholder: '搜索记忆...',
      button: '搜索',
      noResults: '没有找到匹配的记忆',
      noMemories: '暂无记忆',
    },

    // 时间线
    timeline: {
      noTitle: '无标题',
      frameId: '帧 ID',
      preview: '预览',
    },

    // 错误消息
    errors: {
      notInitialized: '内存服务未初始化',
      initFailed: '初始化失败',
      putFailed: '存储失败',
      searchFailed: '搜索失败',
      timelineFailed: '获取时间线失败',
      statsFailed: '获取统计信息失败',
      backupFailed: '备份失败',
    },

    // 按钮
    buttons: {
      refresh: '刷新',
      backup: '备份',
      export: '导出',
      import: '导入',
    },

    // 提示信息
    tooltips: {
      relevance: '相关度',
      timestamp: '时间戳',
      moreInfo: '更多信息',
    },
  },
};
```

#### 3.2 英文翻译文件
**文件**: `src/ui/i18n/locales/en.ts`

```typescript
/**
 * @fileoverview Memvid English translations
 * @author Alan
 */

export default {
  memory: {
    title: 'AI Memory Management',
    description: 'Manage AI conversation memory and knowledge base with full-text search and vector retrieval. All data is stored locally in .mv2 files, completely offline.',

    // Statistics
    stats: {
      totalMemories: 'memories',
      hasLexIndex: 'Full-text Index',
      noIndex: 'No Index',
      fileSize: 'MB',
    },

    // Tabs
    tabs: {
      timeline: 'Timeline',
      search: 'Search',
      stats: 'Statistics',
    },

    // Search
    search: {
      placeholder: 'Search memories...',
      button: 'Search',
      noResults: 'No matching memories found',
      noMemories: 'No memories yet',
    },

    // Timeline
    timeline: {
      noTitle: 'Untitled',
      frameId: 'Frame ID',
      preview: 'Preview',
    },

    // Error messages
    errors: {
      notInitialized: 'Memory service not initialized',
      initFailed: 'Initialization failed',
      putFailed: 'Storage failed',
      searchFailed: 'Search failed',
      timelineFailed: 'Failed to get timeline',
      statsFailed: 'Failed to get statistics',
      backupFailed: 'Backup failed',
    },

    // Buttons
    buttons: {
      refresh: 'Refresh',
      backup: 'Backup',
      export: 'Export',
      import: 'Import',
    },

    // Tooltips
    tooltips: {
      relevance: 'Relevance',
      timestamp: 'Timestamp',
      moreInfo: 'More info',
    },
  },
};
```

---

### 阶段四：TypeScript 类型定义

#### 4.1 更新 electron.d.ts
**文件**: `src/ui/electron.d.ts`

```typescript
/**
 * @fileoverview Electron IPC 类型定义
 * @author Alan
 */

/**
 * Memvid 相关类型定义
 */
export interface MemoryPutOptions {
  title?: string;
  uri?: string;
  tags?: Record<string, string>;
  kind?: string;
  extractDates?: boolean;
  autoTag?: boolean;
}

export interface SearchResult {
  frameId: number;
  title?: string;
  uri?: string;
  text: string;
  score?: number;
  timestamp?: number;
  range?: [number, number];
  chunkRange?: [number, number];
}

export interface TimelineEntry {
  frameId: number;
  uri?: string;
  preview: string;
  timestamp?: number;
}

export interface MemoryStats {
  frameCount: number;
  hasLexIndex: boolean;
  hasVecIndex: boolean;
  hasTimeIndex: boolean;
  fileSize: number;
}

/**
 * IPC 响应包装
 */
export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Electron API 接口扩展
 */
export interface ElectronAPI {
  // ... 现有接口

  // Memvid 接口
  memvid: {
    /** 初始化 Memvid 服务 */
    init: () => Promise<IpcResponse<MemoryStats>>;

    /** 存储内存 */
    put: (content: string, options?: MemoryPutOptions) => Promise<IpcResponse<{ frameId: number }>>;

    /** 批量存储内存 */
    putBatch: (items: Array<{ content: string; options?: MemoryPutOptions }>) => Promise<IpcResponse<{ frameIds: number[]; count: number }>>;

    /** 搜索内存 */
    search: (query: string, topK?: number) => Promise<IpcResponse<SearchResult[]>>;

    /** 获取时间线 */
    timeline: (limit?: number) => Promise<IpcResponse<TimelineEntry[]>>;

    /** 获取统计信息 */
    stats: () => Promise<IpcResponse<MemoryStats>>;

    /** 备份内存文件 */
    backup: (backupPath?: string) => Promise<IpcResponse<{ path: string }>>;

    /** 获取内存文件路径 */
    getPath: () => Promise<IpcResponse<string>>;

    /** 检查服务是否就绪 */
    isReady: () => Promise<IpcResponse<{ ready: boolean }>>;
  };
}
```

---

### 阶段五：会话集成

#### 5.1 对话自动存储
**文件**: `src/electron/ipc-handlers.ts` (添加)

```typescript
/**
 * 自动存储对话到内存
 *
 * @param sessionId - 会话 ID
 * @param userMessage - 用户消息
 * @param assistantResponse - 助手响应
 */
export async function storeConversationToMemory(
  sessionId: string,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  if (!memvidService.isReady()) {
    log.warn('[Conversation] Memvid service not ready, skipping storage');
    return;
  }

  try {
    const content = `## 用户问\n${userMessage}\n\n## 助手答\n${assistantResponse}`;

    await memvidService.putMemory(content, {
      title: `对话记录 - ${new Date().toLocaleString('zh-CN')}`,
      uri: `mv2://conversations/${sessionId}`,
      tags: {
        type: 'conversation',
        sessionId: sessionId,
        timestamp: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
      },
    });

    log.info('[Conversation] Stored to memory', { sessionId });
  } catch (error) {
    log.error('[Conversation] Failed to store to memory:', error);
    // 不抛出错误，避免影响对话流程
  }
}

/**
 * 检索相关对话记忆
 *
 * @param query - 搜索查询
 * @param limit - 返回结果数量
 * @returns 相关记忆文本
 */
export async function retrieveRelevantMemories(
  query: string,
  limit: number = 5
): Promise<string> {
  if (!memvidService.isReady()) {
    return '';
  }

  try {
    const results = await memvidService.search(query, limit);

    if (results.length === 0) {
      return '';
    }

    const memories = results.map(r => {
      const title = r.title || r.uri || '无标题';
      const score = r.score ? ` (相关度: ${(r.score * 100).toFixed(0)}%)` : '';
      return `### ${title}${score}\n${r.text}`;
    });

    return `## 相关记忆\n\n${memories.join('\n\n---\n\n')}`;
  } catch (error) {
    log.error('[Conversation] Failed to retrieve memories:', error);
    return '';
  }
}
```

---

### 阶段六：测试方案

#### 6.1 单元测试
**文件**: `tests/electron/services/memvid-service.test.ts`

```typescript
/**
 * @fileoverview MemvidService 单元测试
 * @author Alan
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemvidService } from '@/electron/services/memvid-service';
import { fs } from 'memfs';
import path from 'path';

describe('MemvidService', () => {
  let service: MemvidService;
  let testDataPath: string;

  beforeEach(() => {
    // 创建临时测试目录
    testDataPath = '/tmp/test-memvid';
    fs.mkdirSync(testDataPath, { recursive: true });
    service = new MemvidService(testDataPath);
  });

  afterEach(async () => {
    await service.close();
    // 清理测试文件
    if (fs.existsSync(testDataPath)) {
      fs.rmSync(testDataPath, { recursive: true, force: true });
    }
  });

  describe('initialize', () => {
    it('should create a new memory file', async () => {
      await service.initialize();
      expect(service.isReady()).toBe(true);
    });

    it('should open existing memory file', async () => {
      await service.initialize();
      await service.close();

      const service2 = new MemvidService(testDataPath);
      await service2.initialize();
      expect(service2.isReady()).toBe(true);
    });
  });

  describe('putMemory', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should store a memory', async () => {
      const frameId = await service.putMemory('Hello, world!', {
        title: 'Test',
      });
      expect(frameId).toBeGreaterThanOrEqual(0);
    });

    it('should store memory with options', async () => {
      const frameId = await service.putMemory('Content', {
        title: 'Title',
        uri: 'mv2://test/doc',
        tags: { type: 'test' },
      });
      expect(frameId).toBeGreaterThanOrEqual(0);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await service.initialize();
      await service.putMemory('The quick brown fox', { title: 'Fox' });
      await service.putMemory('The lazy dog', { title: 'Dog' });
    });

    it('should search for memories', async () => {
      const results = await service.search('fox');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].text).toContain('fox');
    });

    it('should return empty results for non-matching query', async () => {
      const results = await service.search('elephant');
      expect(results.length).toBe(0);
    });
  });

  describe('getTimeline', () => {
    beforeEach(async () => {
      await service.initialize();
      await service.putMemory('First', { title: 'First' });
      await service.putMemory('Second', { title: 'Second' });
    });

    it('should get timeline entries', async () => {
      const timeline = await service.getTimeline(10);
      expect(timeline.length).toBe(2);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await service.initialize();
      await service.putMemory('Test', { title: 'Test' });
    });

    it('should return statistics', async () => {
      const stats = await service.getStats();
      expect(stats.frameCount).toBeGreaterThanOrEqual(1);
      expect(stats.fileSize).toBeGreaterThan(0);
    });
  });

  describe('backup', () => {
    beforeEach(async () => {
      await service.initialize();
      await service.putMemory('Important data', { title: 'Important' });
    });

    it('should create a backup', async () => {
      const backupPath = await service.backup();
      expect(fs.existsSync(backupPath)).toBe(true);
    });
  });
});
```

#### 6.2 集成测试清单

**功能测试**
- [ ] 创建新的 .mv2 内存文件
- [ ] 打开已存在的内存文件
- [ ] 存储文本内容到内存
- [ ] 存储带元数据的内容
- [ ] 搜索已存储的内容
- [ ] 获取时间线数据
- [ ] 获取统计信息
- [ ] 备份内存文件

**UI 测试**
- [ ] 内存面板正确显示
- [ ] 搜索框功能正常
- [ ] 时间线滚动正常
- [ ] 统计信息正确显示
- [ ] 错误提示正常显示
- [ ] 加载状态正常显示
- [ ] 响应式布局适配

**集成测试**
- [ ] 对话自动存储
- [ ] 相关记忆检索
- [ ] 跨会话记忆保留
- [ ] 内存文件持久化
- [ ] 应用重启后数据保留

**边界测试**
- [ ] 空搜索查询处理
- [ ] 超长内容存储
- [ ] 特殊字符处理
- [ ] 并发存储操作
- [ ] 大量数据性能测试

---

### 阶段七：验证测试方案

#### 7.1 手动测试步骤

**测试准备**
```bash
# 1. 清理现有测试数据
rm -rf ~/Library/Application\ Support/aicowork/memory.mv2

# 2. 启动应用
npm run dev
```

**测试流程**

1. **初始化测试**
   - 打开设置页面
   - 导航到 "AI 内存管理" 区域
   - 检查是否显示 "0 条记忆"
   - 检查索引状态

2. **存储测试**
   - 输入测试内容: "Hello, this is a test memory"
   - 点击存储按钮
   - 验证成功提示
   - 检查记忆数增加

3. **搜索测试**
   - 在搜索框输入 "test"
   - 点击搜索按钮
   - 验证搜索结果显示
   - 检查相关度分数

4. **时间线测试**
   - 切换到时间线标签
   - 验证按时间排序显示
   - 检查分页功能

5. **持久化测试**
   - 关闭应用
   - 重新启动
   - 验证数据仍然存在

6. **性能测试**
   - 存储 100 条记录
   - 测试搜索响应时间
   - 验证 UI 流畅度

#### 7.2 自动化测试脚本
**文件**: `tests/integration/memflows.e2e.ts`

```typescript
/**
 * @fileoverview Memvid E2E 测试
 * @author Alan
 */

import { test, expect } from '@playwright/test';

test.describe('Memvid Memory Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 导航到设置页面
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="memory-section"]');
  });

  test('should display memory panel', async ({ page }) => {
    await expect(page.locator('[data-testid="memory-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="memory-stats"]')).toBeVisible();
  });

  test('should store and search memory', async ({ page }) => {
    // 输入搜索内容作为测试
    await page.fill('[data-testid="memory-search-input"]', 'test query');
    await page.click('[data-testid="memory-search-button"]');

    // 验证搜索完成
    await expect(page.locator('[data-testid="memory-results"]')).toBeVisible();
  });

  test('should display timeline', async ({ page }) => {
    await page.click('[data-testid="timeline-tab"]');

    // 验证时间线显示
    const timelineItems = page.locator('[data-testid="timeline-item"]');
    await expect(timelineItems).toBeVisible();
  });

  test('should show stats', async ({ page }) => {
    await page.click('[data-testid="stats-tab"]');

    // 验证统计信息
    await expect(page.locator('[data-testid="stat-frame-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-file-size"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-index-status"]')).toBeVisible();
  });
});
```

---

## 五、关键文件清单（更新）

### 新增文件

| 文件路径 | 说明 | 行数估算 |
|---------|------|---------|
| `src/electron/services/memvid-service.ts` | Memvid 服务封装（完整版） | ~450 |
| `src/ui/components/MemoryPanel.tsx` | 内存面板组件 | ~300 |
| `src/ui/pages/SettingsPage/sections/MemorySection.tsx` | 内存设置区域 | ~50 |
| `src/ui/i18n/locales/memvid-zh.ts` | 中文翻译 | ~60 |
| `src/ui/i18n/locales/memvid-en.ts` | 英文翻译 | ~60 |
| `tests/electron/services/memvid-service.test.ts` | 单元测试 | ~200 |
| `tests/integration/memvid.e2e.ts` | E2E 测试 | ~100 |

### 修改文件

| 文件路径 | 修改内容 | 影响范围 |
|---------|---------|---------|
| `src/electron/ipc-handlers.ts` | 添加 Memvid IPC 处理器 | +150 行 |
| `src/electron/main.ts` | 添加清理逻辑 | +5 行 |
| `src/ui/pages/SettingsPage/SettingsPage.tsx` | 添加内存设置入口 | +10 行 |
| `src/ui/electron.d.ts` | 添加 IPC 类型定义 | +80 行 |
| `src/ui/i18n/locales/zh.ts` | 合并中文翻译 | +60 行 |
| `src/ui/i18n/locales/en.ts` | 合并英文翻译 | +60 行 |
| `package.json` | 添加 @memvid/sdk 依赖 | +1 行 |

---

## 六、后续扩展（详细）

### 6.1 短期优化 (1-3 个月)

**SDK 高级功能集成**

| 功能 | SDK API | UI 需求 | 优先级 |
|------|---------|---------|--------|
| 向量嵌入 | `enableVectorEmbeddings()` | 配置面板 | 高 |
| CLIP 搜索 | `put(image, {kind: 'image'})` | 图像预览 | 中 |
| Whisper 转录 | `transcribe(audio)` | 音频播放器 | 中 |
| 文档导入 | `importDocument(pdf)` | 拖拽上传 | 高 |
| 时间旅行 | `search({asOfFrame: n})` | 历史视图 | 低 |

**详细实现计划**

1. **向量嵌入与语义搜索** (Week 1-2)
   - 启用本地嵌入模型
   - 自动向量化存储
   - 混合搜索配置

2. **多模态文档处理** (Week 3-4)
   - PDF 导入和解析
   - 图像索引和搜索
   - 文档预览组件

3. **UI/UX 改进** (Week 5-6)
   - 虚拟滚动优化
   - 高级搜索过滤器
   - 标签管理界面

---

### 阶段三：会话集成

详细内容已在阶段五中实现，包括：
- `storeConversationToMemory()` - 对话自动存储
- `retrieveRelevantMemories()` - 相关记忆检索

---

## 七、后续扩展计划

### 7.1 中期功能 (3-6 个月)

| 功能 | SDK 支持 | 实现复杂度 | 优先级 |
|------|---------|-----------|--------|
| 记忆分组 | 通过 URI 和 tags | 中 | 高 |
| 导出/导入 | `backup()` + 自定义 | 中 | 高 |
| 可视化图谱 | 需自定义实现 | 高 | 中 |
| 智能推荐 | 搜索 + 排序 | 中 | 中 |

### 7.2 长期愿景 (6-12 个月)

1. **AI 增强功能**
   - 智能摘要生成
   - 自动关联推荐
   - 问答式交互

2. **企业功能**
   - 多用户支持
   - 权限管理
   - 审计日志

3. **生态系统**
   - 插件系统
   - 第三方集成
   - API 开放

---

## 八、注意事项

### 8.1 兼容性

| 项目 | 要求 | 状态 |
|------|------|------|
| Node.js | 18+ | ✅ Electron 内置 |
| OS | Win/macOS/Linux | ✅ SDK 全支持 |
| TypeScript | 5.0+ | ✅ 完整类型 |

### 8.2 性能考虑

- **内存占用**: ~50-100MB 基础，随数据增长
- **搜索延迟**: 全文 ~5ms, 向量 ~10ms
- **存储效率**: Zstd 压缩，通常 50-70%

### 8.3 安全建议

- API 密钥使用加密胶囊 (.mv2e)
- 定期备份内存文件
- 控制内存文件访问权限

---

**@author Alan**
**@created 2025-01-21**
**@version 1.1.0 (细化版)**
**@license AGPL-3.0**
