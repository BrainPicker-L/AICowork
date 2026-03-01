/**
 * SDK 配置缓存管理模块
 * 实现配置预加载、缓存和增量更新，优化启动性能
 * @author Alan
 * @copyright AGCPA v3.0
 * @updated 2025-01-24 (添加 API 配置缓存)
 */

import { watch, FSWatcher, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { app } from 'electron';
import { log } from '../logger.js';
import { loadSdkNativeConfig, type SdkNativeConfig } from '../utils/sdk-native-loader.js';
import { loadMcpServers, type McpServerConfig } from '../storage/mcp-store.js';
import { loadApiConfig, type ApiConfig } from '../storage/config-store.js';

/**
 * 缓存的配置数据
 */
export interface CachedConfig {
  /** SDK 原生配置 */
  sdkNative: SdkNativeConfig;
  /** MCP 服务器配置 */
  mcpServers: Record<string, McpServerConfig>;
  /** API 配置 */
  apiConfig: ApiConfig | null;
  /** 缓存时间戳 */
  timestamp: number;
}

/**
 * 配置变更事件类型
 */
export type ConfigChangeEvent = {
  type: 'sdk-native' | 'mcp-servers' | 'api-config' | 'all';
  timestamp: number;
};

/**
 * 配置变更监听器类型
 */
type ConfigChangeListener = (event: ConfigChangeEvent) => void;

/**
 * SDK 配置缓存管理器
 */
class SdkConfigCacheManager {
  /** 缓存的配置 */
  private cache: CachedConfig | null = null;

  /** 是否已初始化 */
  private initialized: boolean = false;

  /** 文件监听器 */
  private watchers: FSWatcher[] = [];

  /** 配置变更监听器 */
  private listeners: Set<ConfigChangeListener> = new Set();

  /** 防抖定时器 */
  private debounceTimer: NodeJS.Timeout | null = null;

  /** 防抖延迟（毫秒） */
  private readonly DEBOUNCE_DELAY = 300;

  /**
   * 初始化缓存管理器
   * 在应用启动时调用，预加载所有配置
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      log.warn('[Config Cache] Already initialized');
      return;
    }

    log.info('[Config Cache] Initializing...');

    try {
      // 预加载配置
      await this.preloadConfig();

      // 启动文件监听
      this.startWatching();

      this.initialized = true;
      log.info('[Config Cache] ✓ Initialization completed');
    } catch (error) {
      log.error('[Config Cache] ✗ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * 预加载所有配置到缓存
   */
  private async preloadConfig(): Promise<void> {
    const startTime = Date.now();

    try {
      // 并行加载所有配置（API 配置是同步的，包装为 Promise）
      const [sdkNative, mcpServers, apiConfig] = await Promise.all([
        loadSdkNativeConfig(),
        loadMcpServers(),
        Promise.resolve().then(() => {
          try {
            return loadApiConfig();
          } catch {
            return null;
          }
        }),
      ]);

      // 更新缓存
      this.cache = {
        sdkNative,
        mcpServers,
        apiConfig,
        timestamp: Date.now(),
      };

      const duration = Date.now() - startTime;
      log.info(`[Config Cache] ✓ Config preloaded (${duration}ms)`, {
        plugins: sdkNative.plugins?.length || 0,
        agents: Object.keys(sdkNative.agents || {}).length,
        mcpServers: Object.keys(mcpServers).length,
        apiConfigured: !!apiConfig,
      });
    } catch (error) {
      log.error('[Config Cache] ✗ Failed to preload config:', error);
      // 即使失败也创建空缓存，避免后续调用出错
      this.cache = {
        sdkNative: {},
        mcpServers: {},
        apiConfig: null,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 启动文件监听
   * 监听配置文件变化，触发增量更新
   */
  private startWatching(): void {
    const settingsPath = join(homedir(), '.qwen', 'settings.json');
    const pluginsDir = join(homedir(), '.qwen', 'plugins');
    const agentsDir = join(homedir(), '.qwen', 'agents');
    const apiConfigPath = join(app.getPath('userData'), 'api-config.json');

    // 监听 settings.json（包含 MCP 服务器、权限、钩子等配置）
    try {
      const settingsWatcher = watch(settingsPath, { persistent: false }, (eventType, filename) => {
        if (eventType === 'change') {
          log.info(`[Config Cache] settings.json changed`);
          this.handleConfigChange('all');
        }
      });
      this.watchers.push(settingsWatcher);
      log.info(`[Config Cache] ✓ Watching settings.json`);
    } catch (error) {
      log.warn('[Config Cache] ✗ Failed to watch settings.json:', error);
    }

    // 监听 api-config.json（API 配置文件）
    try {
      const apiConfigWatcher = watch(apiConfigPath, { persistent: false }, (eventType, filename) => {
        if (eventType === 'change') {
          log.info(`[Config Cache] api-config.json changed`);
          this.handleConfigChange('api-config');
        }
      });
      this.watchers.push(apiConfigWatcher);
      log.info(`[Config Cache] ✓ Watching api-config.json`);
    } catch (error) {
      log.warn('[Config Cache] ✗ Failed to watch api-config.json:', error);
    }

    // 监听 plugins 目录（不存在则创建，避免 ENOENT）
    try {
      if (!existsSync(pluginsDir)) {
        mkdirSync(pluginsDir, { recursive: true });
      }
      const pluginsWatcher = watch(pluginsDir, { persistent: false }, (eventType, filename) => {
        if (eventType === 'rename' && filename) {
          log.info(`[Config Cache] Plugins directory changed: ${filename}`);
          this.handleConfigChange('sdk-native');
        }
      });
      this.watchers.push(pluginsWatcher);
      log.info(`[Config Cache] ✓ Watching plugins directory`);
    } catch (error) {
      log.warn('[Config Cache] ✗ Failed to watch plugins directory:', error);
    }

    // 监听 agents 目录（不存在则创建，避免 ENOENT）
    try {
      if (!existsSync(agentsDir)) {
        mkdirSync(agentsDir, { recursive: true });
      }
      const agentsWatcher = watch(agentsDir, { persistent: false }, (eventType, filename) => {
        if (eventType === 'rename' && filename) {
          log.info(`[Config Cache] Agents directory changed: ${filename}`);
          this.handleConfigChange('sdk-native');
        }
      });
      this.watchers.push(agentsWatcher);
      log.info(`[Config Cache] ✓ Watching agents directory`);
    } catch (error) {
      log.warn('[Config Cache] ✗ Failed to watch agents directory:', error);
    }

    log.info(`[Config Cache] ✓ Started ${this.watchers.length} file watchers`);
  }

  /**
   * 处理配置变更
   * 使用防抖机制，避免频繁更新
   */
  private handleConfigChange(type: ConfigChangeEvent['type']): void {
    // 清除之前的防抖定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // 设置新的防抖定时器
    this.debounceTimer = setTimeout(async () => {
      log.info(`[Config Cache] Processing config change: ${type}`);

      try {
        if (type === 'all') {
          // 全量更新
          await this.preloadConfig();
        } else if (type === 'sdk-native') {
          // 增量更新 SDK 原生配置
          await this.incrementalUpdateSdkNative();
        } else if (type === 'mcp-servers') {
          // 增量更新 MCP 服务器配置
          await this.incrementalUpdateMcpServers();
        } else if (type === 'api-config') {
          // 增量更新 API 配置
          await this.incrementalUpdateApiConfig();
        }

        // 通知监听器
        this.notifyListeners({
          type,
          timestamp: Date.now(),
        });

        log.info(`[Config Cache] ✓ Config updated: ${type}`);
      } catch (error) {
        log.error(`[Config Cache] ✗ Failed to update config:`, error);
      }
    }, this.DEBOUNCE_DELAY);
  }

  /**
   * 增量更新 SDK 原生配置
   */
  private async incrementalUpdateSdkNative(): Promise<void> {
    if (!this.cache) {
      return;
    }

    const startTime = Date.now();

    try {
      // 只更新 SDK 原生配置
      const sdkNative = await loadSdkNativeConfig();

      // 合并到缓存
      this.cache.sdkNative = sdkNative;
      this.cache.timestamp = Date.now();

      const duration = Date.now() - startTime;
      log.info(`[Config Cache] ✓ SDK native config incremental updated (${duration}ms)`, {
        plugins: sdkNative.plugins?.length || 0,
        agents: Object.keys(sdkNative.agents || {}).length,
      });
    } catch (error) {
      log.error('[Config Cache] ✗ Failed to incremental update SDK native config:', error);
    }
  }

  /**
   * 增量更新 MCP 服务器配置
   */
  private async incrementalUpdateMcpServers(): Promise<void> {
    if (!this.cache) {
      return;
    }

    const startTime = Date.now();

    try {
      // 只更新 MCP 服务器配置
      const mcpServers = await loadMcpServers();

      // 合并到缓存
      this.cache.mcpServers = mcpServers;
      this.cache.timestamp = Date.now();

      const duration = Date.now() - startTime;
      log.info(`[Config Cache] ✓ MCP servers incremental updated (${duration}ms)`, {
        count: Object.keys(mcpServers).length,
      });
    } catch (error) {
      log.error('[Config Cache] ✗ Failed to incremental update MCP servers:', error);
    }
  }

  /**
   * 增量更新 API 配置
   */
  private async incrementalUpdateApiConfig(): Promise<void> {
    if (!this.cache) {
      return;
    }

    const startTime = Date.now();

    try {
      // 只更新 API 配置
      const apiConfig = loadApiConfig();

      // 合并到缓存
      this.cache.apiConfig = apiConfig;
      this.cache.timestamp = Date.now();

      const duration = Date.now() - startTime;
      log.info(`[Config Cache] ✓ API config incremental updated (${duration}ms)`, {
        configured: !!apiConfig,
        baseURL: apiConfig?.baseURL,
        model: apiConfig?.model,
      });
    } catch (error) {
      log.error('[Config Cache] ✗ Failed to incremental update API config:', error);
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(event: ConfigChangeEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        log.error('[Config Cache] Listener error:', error);
      }
    }
  }

  /**
   * 获取缓存的配置
   * 如果缓存未初始化，会先加载配置
   */
  async getConfig(): Promise<CachedConfig> {
    if (!this.cache) {
      log.warn('[Config Cache] Cache not initialized, loading now...');
      await this.initialize();
    }

    return this.cache!;
  }

  /**
   * 获取缓存的 SDK 原生配置
   */
  async getSdkNativeConfig(): Promise<SdkNativeConfig> {
    const config = await this.getConfig();
    return config.sdkNative;
  }

  /**
   * 获取缓存的 MCP 服务器配置
   */
  async getMcpServers(): Promise<Record<string, McpServerConfig>> {
    const config = await this.getConfig();
    return config.mcpServers;
  }

  /**
   * 获取缓存的 API 配置
   */
  async getApiConfig(): Promise<ApiConfig | null> {
    const config = await this.getConfig();
    return config.apiConfig;
  }

  /**
   * 添加配置变更监听器
   */
  addChangeListener(listener: ConfigChangeListener): void {
    this.listeners.add(listener);
    log.info(`[Config Cache] Added change listener (total: ${this.listeners.size})`);
  }

  /**
   * 移除配置变更监听器
   */
  removeChangeListener(listener: ConfigChangeListener): void {
    this.listeners.delete(listener);
    log.info(`[Config Cache] Removed change listener (total: ${this.listeners.size})`);
  }

  /**
   * 清除缓存
   * 在配置被外部修改时调用
   */
  async clearCache(): Promise<void> {
    log.info('[Config Cache] Clearing cache...');
    await this.preloadConfig();
    log.info('[Config Cache] ✓ Cache cleared');
  }

  /**
   * 销毁缓存管理器
   * 停止所有文件监听器
   */
  destroy(): void {
    log.info('[Config Cache] Destroying...');

    // 清除防抖定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // 停止所有文件监听器
    for (const watcher of this.watchers) {
      try {
        watcher.close();
      } catch (error) {
        log.warn('[Config Cache] Failed to close watcher:', error);
      }
    }
    this.watchers = [];

    // 清除监听器
    this.listeners.clear();

    // 清除缓存
    this.cache = null;

    this.initialized = false;
    log.info('[Config Cache] ✓ Destroyed');
  }

  /**
   * 获取缓存状态信息
   */
  getStatus(): {
    initialized: boolean;
    hasCache: boolean;
    cacheAge: number | null;
    watcherCount: number;
    listenerCount: number;
  } {
    return {
      initialized: this.initialized,
      hasCache: this.cache !== null,
      cacheAge: this.cache ? Date.now() - this.cache.timestamp : null,
      watcherCount: this.watchers.length,
      listenerCount: this.listeners.size,
    };
  }
}

// 单例实例
let configCacheInstance: SdkConfigCacheManager | null = null;

/**
 * 获取配置缓存管理器实例
 */
export function getConfigCacheManager(): SdkConfigCacheManager {
  if (!configCacheInstance) {
    configCacheInstance = new SdkConfigCacheManager();
  }
  return configCacheInstance;
}

/**
 * 初始化配置缓存
 * 在应用启动时调用
 */
export async function initializeConfigCache(): Promise<void> {
  const manager = getConfigCacheManager();
  await manager.initialize();
}

/**
 * 获取缓存的 SDK 原生配置
 * 替代原来的 loadSdkNativeConfig()
 */
export async function getCachedSdkNativeConfig(): Promise<SdkNativeConfig> {
  const manager = getConfigCacheManager();
  return await manager.getSdkNativeConfig();
}

/**
 * 获取缓存的 MCP 服务器配置
 * 替代原来的 loadMcpServers()
 */
export async function getCachedMcpServers(): Promise<Record<string, McpServerConfig>> {
  const manager = getConfigCacheManager();
  return await manager.getMcpServers();
}

/**
 * 获取缓存的 API 配置
 * 替代原来的 getCurrentApiConfig()，提供预加载和热更新能力
 */
export async function getCachedApiConfig(): Promise<ApiConfig | null> {
  const manager = getConfigCacheManager();
  return await manager.getApiConfig();
}

/**
 * 添加配置变更监听器
 */
export function addConfigChangeListener(listener: ConfigChangeListener): void {
  const manager = getConfigCacheManager();
  manager.addChangeListener(listener);
}

/**
 * 移除配置变更监听器
 */
export function removeConfigChangeListener(listener: ConfigChangeListener): void {
  const manager = getConfigCacheManager();
  manager.removeChangeListener(listener);
}

/**
 * 清除配置缓存
 */
export async function clearConfigCache(): Promise<void> {
  const manager = getConfigCacheManager();
  await manager.clearCache();
}

/**
 * 销毁配置缓存
 */
export function destroyConfigCache(): void {
  if (configCacheInstance) {
    configCacheInstance.destroy();
    configCacheInstance = null;
  }
}

/**
 * 获取配置缓存状态
 */
export function getConfigCacheStatus(): ReturnType<SdkConfigCacheManager['getStatus']> {
  const manager = getConfigCacheManager();
  return manager.getStatus();
}

// 导出管理器类（用于高级用法）
export { SdkConfigCacheManager };
