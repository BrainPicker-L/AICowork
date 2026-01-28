/**
 * 修复 API 配置工具
 * 为旧配置补充 apiSpec 字段并重新同步
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { app } from 'electron';
import { log } from '../logger.js';
import { getApiSpec, syncToQwenSettings } from './qwen-settings-sync.js';
import type { ApiConfig } from '../storage/config-store.js';

interface ApiConfigsStore {
  configs: ApiConfig[];
  activeConfigId?: string;
}

/**
 * 修复所有配置，为缺少 apiSpec 的配置补充字段
 */
export function fixApiConfigs(): { success: boolean; fixed: number; error?: string } {
  try {
    const configPath = join(app.getPath('userData'), 'api-config.json');
    
    if (!existsSync(configPath)) {
      return { success: false, fixed: 0, error: '配置文件不存在' };
    }

    // 读取配置
    const raw = readFileSync(configPath, 'utf8');
    const store = JSON.parse(raw) as ApiConfigsStore;

    let fixedCount = 0;

    // 为每个配置补充 apiSpec
    for (const config of store.configs) {
      if (!config.apiSpec && config.apiType) {
        config.apiSpec = getApiSpec(config.apiType);
        fixedCount++;
        log.info(`[fix-api-config] Fixed config: ${config.name} (${config.apiType} -> ${config.apiSpec})`);
      }
    }

    if (fixedCount > 0) {
      // 保存更新后的配置
      writeFileSync(configPath, JSON.stringify(store, null, 2), 'utf8');
      log.info(`[fix-api-config] Saved ${fixedCount} fixed configs to api-config.json`);

      // 重新同步到 ~/.qwen/settings.json
      syncToQwenSettings(store);
      log.info('[fix-api-config] Re-synced to ~/.qwen/settings.json');
    }

    return { success: true, fixed: fixedCount };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('[fix-api-config] Failed to fix configs:', error);
    return { success: false, fixed: 0, error: errorMessage };
  }
}
