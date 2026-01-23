/**
 * MCP 服务器实例管理器
 * 实现服务器实例池化、配置缓存和引用计数管理
 */

import { log } from "../logger.js";
import { loadMcpServers, type McpServerConfig } from "../storage/mcp-store.js";
import { getCachedMcpServers } from "./sdk-config-cache.js";
import { createMemoryMcpServer } from "../utils/memory-mcp-server.js";
import { createClaudeMemoryToolServer } from "../utils/claude-memory-mcp-server.js";
import { getMemoryToolConfig } from "../utils/memory-tools.js";

/**
 * MCP 服务器实例类型
 */
export type McpServerInstance = any;

/**
 * 服务器池中的条目
 */
interface ServerPoolEntry {
  /** 服务器实例 */
  instance: McpServerInstance;
  /** 引用计数 */
  refCount: number;
  /** 创建时间 */
  createdAt: number;
  /** 最后使用时间 */
  lastUsedAt: number;
}

/**
 * 缓存的配置
 */
interface CachedConfig {
  /** 配置数据 */
  config: Record<string, McpServerConfig>;
  /** 缓存时间 */
  cachedAt: number;
}

/**
 * MCP 服务器管理器类
 * 单例模式，全局唯一实例
 */
class McpServerManager {
  private static instance: McpServerManager;

  /** 服务器实例池（按名称存储） */
  private serverPool: Map<string, ServerPoolEntry> = new Map();

  /** 配置缓存 */
  private configCache: CachedConfig | null = null;

  /** 配置缓存有效期（毫秒）- 30秒 */
  private readonly CONFIG_CACHE_TTL = 30 * 1000;

  /** 空闲服务器超时时间（毫秒）- 5分钟 */
  private readonly IDLE_TIMEOUT = 5 * 60 * 1000;

  /** 记忆服务器缓存名称（内置） */
  private readonly MEMORY_SERVERS = ['memory-tools', 'memory'];

  private constructor() {
    // 启动清理定时器
    this.startCleanupTimer();
    log.info('[MCP Manager] Initialized');
  }

  /**
   * 获取管理器单例
   */
  static getInstance(): McpServerManager {
    if (!McpServerManager.instance) {
      McpServerManager.instance = new McpServerManager();
    }
    return McpServerManager.instance;
  }

  /**
   * 获取或创建 MCP 服务器（增加引用计数）
   *
   * @param serverName - 服务器名称
   * @param serverConfig - 服务器配置（仅用于外部服务器）
   * @returns 服务器实例
   */
  async acquireServer(serverName: string, serverConfig?: McpServerConfig): Promise<McpServerInstance> {
    const existing = this.serverPool.get(serverName);

    if (existing) {
      // 复用现有实例
      existing.refCount++;
      existing.lastUsedAt = Date.now();
      log.info(`[MCP Manager] Reusing server: ${serverName} (refCount: ${existing.refCount})`);
      return existing.instance;
    }

    // 创建新实例
    log.info(`[MCP Manager] Creating new server: ${serverName}`);
    const instance = await this.createServerInstance(serverName, serverConfig);

    // 加入池
    this.serverPool.set(serverName, {
      instance,
      refCount: 1,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    });

    log.info(`[MCP Manager] Server created: ${serverName} (total: ${this.serverPool.size})`);
    return instance;
  }

  /**
   * 释放 MCP 服务器（减少引用计数）
   *
   * @param serverName - 服务器名称
   */
  releaseServer(serverName: string): void {
    const entry = this.serverPool.get(serverName);
    if (!entry) {
      log.warn(`[MCP Manager] Server not found in pool: ${serverName}`);
      return;
    }

    entry.refCount--;
    entry.lastUsedAt = Date.now();
    log.info(`[MCP Manager] Released server: ${serverName} (refCount: ${entry.refCount})`);

    // 如果引用计数为0，延迟关闭（避免频繁创建/销毁）
    if (entry.refCount <= 0) {
      log.info(`[MCP Manager] Server idle (will be cleaned up later): ${serverName}`);
    }
  }

  /**
   * 获取多个服务器（批量获取，用于会话启动）
   *
   * @returns 服务器实例映射表
   */
  async acquireServers(): Promise<Record<string, McpServerInstance>> {
    const servers: Record<string, McpServerInstance> = {};

    // 1. 获取记忆服务器（如果启用）
    const memConfig = getMemoryToolConfig();
    if (memConfig.enabled) {
      try {
        const [memoryTools, claudeMemory] = await Promise.allSettled([
          this.acquireServer('memory-tools'),
          this.acquireServer('memory'),
        ]);

        if (memoryTools.status === 'fulfilled') {
          servers['memory-tools'] = memoryTools.value;
        }
        if (claudeMemory.status === 'fulfilled') {
          servers['memory'] = claudeMemory.value;
        }
      } catch (error) {
        log.error('[MCP Manager] Failed to acquire memory servers:', error);
      }
    }

    // 2. 获取外部 MCP 服务器（从配置）
    try {
      const configs = await this.loadMcpConfigsWithCache();
      for (const [name, config] of Object.entries(configs)) {
        if (config.disabled) {
          continue;
        }
        if (servers[name]) {
          continue; // 避免覆盖内置服务器
        }

        try {
          // 外部服务器使用配置对象（SDK会自动处理）
          servers[name] = {
            type: config.type || 'stdio',
            command: config.command,
            args: config.args,
            env: config.env,
            url: config.url,
          };
        } catch (error) {
          log.error(`[MCP Manager] Failed to acquire server ${name}:`, error);
        }
      }
    } catch (error) {
      log.warn('[MCP Manager] Failed to load external MCP configs:', error);
    }

    log.info(`[MCP Manager] Acquired ${Object.keys(servers).length} servers:`, Object.keys(servers));
    return servers;
  }

  /**
   * 释放多个服务器（批量释放）
   *
   * @param serverNames - 服务器名称列表
   */
  releaseServers(serverNames: string[]): void {
    for (const name of serverNames) {
      this.releaseServer(name);
    }
  }

  /**
   * 清除所有缓存和服务器实例
   * 在配置更改时调用
   */
  async clearAll(): Promise<void> {
    log.info('[MCP Manager] Clearing all caches and servers');

    // 关闭所有服务器
    for (const [name, entry] of this.serverPool.entries()) {
      try {
        if (entry.instance?.close && typeof entry.instance.close === 'function') {
          entry.instance.close();
        }
      } catch (error) {
        log.warn(`[MCP Manager] Error closing server ${name}:`, error);
      }
    }

    this.serverPool.clear();
    this.configCache = null;

    log.info('[MCP Manager] All caches cleared');
  }

  /**
   * 清除配置缓存（配置文件更改时调用）
   */
  clearConfigCache(): void {
    log.info('[MCP Manager] Clearing config cache');
    this.configCache = null;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    poolSize: number;
    totalRefs: number;
    servers: Array<{ name: string; refCount: number; idleTime: number }>;
  } {
    const servers = Array.from(this.serverPool.entries()).map(([name, entry]) => ({
      name,
      refCount: entry.refCount,
      idleTime: Date.now() - entry.lastUsedAt,
    }));

    const totalRefs = servers.reduce((sum, s) => sum + s.refCount, 0);

    return {
      poolSize: this.serverPool.size,
      totalRefs,
      servers,
    };
  }

  // ========== 私有方法 ==========

  /**
   * 创建服务器实例
   */
  private async createServerInstance(
    serverName: string,
    serverConfig?: McpServerConfig
  ): Promise<McpServerInstance> {
    // 内置记忆服务器
    if (serverName === 'memory-tools') {
      return await createMemoryMcpServer();
    }
    if (serverName === 'memory') {
      return await createClaudeMemoryToolServer();
    }

    // 外部服务器（返回配置对象）
    if (serverConfig) {
      return {
        type: serverConfig.type || 'stdio',
        command: serverConfig.command,
        args: serverConfig.args,
        env: serverConfig.env,
        url: serverConfig.url,
      };
    }

    throw new Error(`Unknown server type: ${serverName}`);
  }

  /**
   * 加载 MCP 配置（使用全局缓存）
   * 优先使用 sdk-config-cache 的缓存，减少配置加载时间
   */
  private async loadMcpConfigsWithCache(): Promise<Record<string, McpServerConfig>> {
    const now = Date.now();

    // 检查本地缓存（30秒有效期）
    if (this.configCache && (now - this.configCache.cachedAt) < this.CONFIG_CACHE_TTL) {
      log.info('[MCP Manager] Using local cached MCP configs');
      return this.configCache.config;
    }

    // 使用全局配置缓存（更快）
    try {
      log.info('[MCP Manager] Loading MCP configs from global cache');
      const configs = await getCachedMcpServers();

      // 更新本地缓存
      this.configCache = {
        config: configs,
        cachedAt: now,
      };

      return configs;
    } catch (error) {
      // 回退到直接加载
      log.warn('[MCP Manager] Failed to load from global cache, falling back to direct load:', error);
      const configs = await loadMcpServers();

      this.configCache = {
        config: configs,
        cachedAt: now,
      };

      return configs;
    }
  }

  /**
   * 清理空闲的服务器
   */
  private cleanupIdleServers(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [name, entry] of this.serverPool.entries()) {
      // 跳过内置记忆服务器（始终保留）
      if (this.MEMORY_SERVERS.includes(name)) {
        continue;
      }

      // 清理空闲且无引用的服务器
      if (entry.refCount <= 0 && (now - entry.lastUsedAt) > this.IDLE_TIMEOUT) {
        toDelete.push(name);
      }
    }

    if (toDelete.length === 0) {
      return;
    }

    log.info(`[MCP Manager] Cleaning up ${toDelete.length} idle servers:`, toDelete);

    for (const name of toDelete) {
      const entry = this.serverPool.get(name);
      if (!entry) continue;

      try {
        if (entry.instance?.close && typeof entry.instance.close === 'function') {
          entry.instance.close();
        }
      } catch (error) {
        log.warn(`[MCP Manager] Error closing server ${name}:`, error);
      }

      this.serverPool.delete(name);
    }

    log.info(`[MCP Manager] Cleanup complete (remaining: ${this.serverPool.size})`);
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    // 每分钟清理一次
    setInterval(() => {
      this.cleanupIdleServers();
    }, 60 * 1000);

    log.info('[MCP Manager] Cleanup timer started');
  }
}

// ========== 导出 ==========

/**
 * 获取 MCP 服务器管理器实例
 */
export function getMcpServerManager(): McpServerManager {
  return McpServerManager.getInstance();
}

/**
 * 清除所有 MCP 服务器缓存
 * 在配置更改时调用
 */
export async function clearMcpServerCache(): Promise<void> {
  const manager = getMcpServerManager();
  await manager.clearAll();
}

/**
 * 清除配置缓存
 */
export function clearMcpConfigCache(): void {
  const manager = getMcpServerManager();
  manager.clearConfigCache();
}
