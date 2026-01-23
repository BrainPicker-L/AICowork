/**
 * 记忆配置存储
 * 管理记忆功能的配置
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { app } from 'electron';
import { log } from '../logger.js';

/**
 * 记忆配置接口
 */
export interface MemoryConfig {
  enabled: boolean;
  autoStore: boolean;
  autoStoreCategories: string[];
  searchMode: 'lex' | 'sem' | 'auto';
  defaultK: number;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: MemoryConfig = {
  enabled: true,
  autoStore: false,
  autoStoreCategories: ['project', 'technical'],
  searchMode: 'lex',
  defaultK: 6,
};

/**
 * 获取配置文件路径
 */
function getConfigPath(): string {
  const userDataPath = app.getPath('userData');
  return join(userDataPath, 'memory-config.json');
}

/**
 * 获取记忆配置
 */
export async function getMemoryConfig(): Promise<{ success: boolean; error?: string; config?: MemoryConfig }> {
  try {
    const configPath = getConfigPath();

    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      return { success: true, config };
    } catch {
      // 文件不存在，返回默认配置
      return { success: true, config: { ...DEFAULT_CONFIG } };
    }
  } catch (error) {
    log.error('[memory-config] Failed to get config:', error);
    return { success: false, error: error instanceof Error ? error.message : '获取配置失败' };
  }
}

/**
 * 保存记忆配置
 */
export async function saveMemoryConfig(config: MemoryConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const configPath = getConfigPath();
    const content = JSON.stringify(config, null, 2);
    await fs.writeFile(configPath, content, 'utf-8');

    // 同时更新 memory-tools 模块中的配置
    const { setMemoryToolConfig } = await import('./memory-tools.js');
    setMemoryToolConfig(config);

    return { success: true };
  } catch (error) {
    log.error('[memory-config] Failed to save config:', error);
    return { success: false, error: error instanceof Error ? error.message : '保存配置失败' };
  }
}

/**
 * 重置记忆配置为默认值
 */
export async function resetMemoryConfig(): Promise<{ success: boolean; error?: string }> {
  return saveMemoryConfig({ ...DEFAULT_CONFIG });
}
