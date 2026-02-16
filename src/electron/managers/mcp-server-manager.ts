/**
 * MCP 服务器配置管理器
 * @author Alan
 * @copyright AGCPA v3.0
 * @created 2025-01-24
 * @Email alan@example.com
 *
 * 只负责配置读取，实例管理由 SDK 处理
 * 用户的增删改查操作在 mcp-store.ts 中
 * 内置记忆 MCP（aicowork-memory）自动注入，供对话中 memory_recall / memory_store / memory_forget
 */

import path from "path";
import { fileURLToPath } from "url";
import { log } from "../logger.js";
import { loadMcpServers, getEnhancedPath, type McpServerConfig } from "../storage/mcp-store.js";
import { getMemoryDirPath } from "../storage/memory-store.js";

const _dir = path.dirname(fileURLToPath(import.meta.url));

/**
 * 获取 MCP 服务器配置
 * 在传递给 SDK 前，移除 type 字段让 SDK 自动识别
 * 自动注入内置记忆 MCP（aicowork-memory），使对话中可检索/存储设置里的记忆
 */
export async function getMcpServers(): Promise<Record<string, McpServerConfig>> {
  const servers: Record<string, McpServerConfig> = {};

  // 获取外部 MCP 服务器配置（从配置文件）
  try {
    const configs = await loadMcpServers();
    let enabledCount = 0;
    let skippedCount = 0;

    for (const [name, config] of Object.entries(configs)) {
      // 跳过禁用的服务器
      if (config.disabled || ('enabled' in config && !config.enabled)) {
        skippedCount++;
        continue;
      }

      // 移除 type 字段，让 Qwen SDK 自动识别
      // 同时移除其他不需要的字段
      const { type, name: _, disabled, ...cleanConfig } = config as any;
      
      // 对 stdio 类型的 MCP 服务器（有 command 字段），注入增强的 PATH
      // 解决打包后 Electron 应用 PATH 受限，找不到用户安装的命令（如 utoo-proxy）的问题
      if (cleanConfig.command) {
        cleanConfig.env = {
          ...process.env,
          PATH: getEnhancedPath(),
          ...(cleanConfig.env || {}),
        };
      }

      servers[name] = cleanConfig;
      enabledCount++;
    }

    log.info(`[MCP Config] ${enabledCount} external servers enabled, ${skippedCount} skipped`);
  } catch (error) {
    log.warn('[MCP Config] Failed to load MCP configs:', error);
  }

  // 注入内置记忆 MCP：与设置页共用 memory-store 数据，对话中可 memory_recall / memory_store / memory_forget
  try {
    const memoryDir = getMemoryDirPath();
    const memoryServerPath = path.join(_dir, "..", "mcp-servers", "memory", "index.js");
    servers["aicowork-memory"] = {
      command: "node",
      args: [memoryServerPath, "--db", memoryDir],
      env: { ...process.env, PATH: getEnhancedPath(), MEMORY_DB_PATH: memoryDir },
      enabled: true,
      displayName: "AICowork 记忆",
      description: "设置中管理的记忆，对话中可检索与存储",
    };
    log.info("[MCP Config] Built-in memory MCP (aicowork-memory) injected");
  } catch (err) {
    log.warn("[MCP Config] Failed to inject built-in memory MCP:", err);
  }

  log.info(`[MCP Config] Total ${Object.keys(servers).length} server configs`);
  return servers;
}

/**
 * 清除 MCP 配置缓存
 * （保留此函数以兼容现有代码）
 */
export function clearMcpServerCache(): void {
  // SDK 会处理自己的缓存
  log.debug('[MCP Config] Cache cleared (SDK handles caching)');
}

/**
 * 清除配置缓存
 */
export function clearMcpConfigCache(): void {
  // 配置缓存清除由 SDK 处理
  log.debug('[MCP Config] Config cache cleared');
}
