/**
 * Hooks 管理存储库
 * 管理事件钩子配置
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { app } from 'electron';
import { log } from '../logger.js';

// 钩子配置接口
export interface HookConfig {
  type: 'preToolUse' | 'postToolUse';
  hook: string;
  command: string;
  description?: string;
}

// Hooks 配置存储接口
export interface HooksStore {
  preToolUse: Array<{ hook: string; command: string; description?: string }>;
  postToolUse: Array<{ hook: string; command: string; description?: string }>;
}

// 获取配置文件路径
function getConfigPath(): string {
  const userDataPath = app.getPath('userData');
  return join(userDataPath, 'hooks.json');
}

/**
 * 加载 Hooks 配置
 */
export async function getHooksConfig(): Promise<HooksStore> {
  try {
    const configPath = getConfigPath();

    try {
      const content = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(content);
    } catch (readError: any) {
      // 区分文件不存在和 JSON 解析错误
      if (readError.code === 'ENOENT') {
        // 文件不存在，返回默认配置
        return {
          preToolUse: [],
          postToolUse: [],
        };
      }
      // JSON 解析错误或其他错误
      log.error('[hooks-store] Failed to parse hooks config:', readError);
      return {
        preToolUse: [],
        postToolUse: [],
      };
    }
  } catch (error) {
    log.error('[hooks-store] Failed to load hooks config:', error);
    return {
      preToolUse: [],
      postToolUse: [],
    };
  }
}

/**
 * 保存 Hooks 配置
 */
async function saveHooksConfig(config: HooksStore): Promise<void> {
  try {
    const configPath = getConfigPath();
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    log.error('[hooks-store] Failed to save hooks config:', error);
    throw new Error('Failed to save hooks configuration');
  }
}

/**
 * 添加钩子
 */
export async function saveHook(config: HookConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const hooksConfig = await getHooksConfig();

    // 验证钩子类型
    if (config.type !== 'preToolUse' && config.type !== 'postToolUse') {
      return { success: false, error: '无效的钩子类型' };
    }

    // 验证钩子名称和命令
    if (!config.hook || config.hook.trim().length === 0) {
      return { success: false, error: '钩子名称不能为空' };
    }

    if (!config.command || config.command.trim().length === 0) {
      return { success: false, error: '命令不能为空' };
    }

    const hookArray = hooksConfig[config.type];

    // 检查钩子是否已存在
    const existingIndex = hookArray.findIndex(h => h.hook === config.hook);
    if (existingIndex >= 0) {
      // 更新现有钩子
      hookArray[existingIndex] = {
        hook: config.hook,
        command: config.command,
        description: config.description,
      };
    } else {
      // 添加新钩子
      hookArray.push({
        hook: config.hook,
        command: config.command,
        description: config.description,
      });
    }

    await saveHooksConfig(hooksConfig);
    log.info(`[hooks-store] Hook saved: ${config.type}.${config.hook}`);

    return { success: true };
  } catch (error) {
    log.error('[hooks-store] Failed to save hook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '保存钩子失败'
    };
  }
}

/**
 * 删除钩子
 */
export async function deleteHook(hookType: string, hookName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const hooksConfig = await getHooksConfig();

    // 验证钩子类型
    if (hookType !== 'preToolUse' && hookType !== 'postToolUse') {
      return { success: false, error: '无效的钩子类型' };
    }

    const hookArray = hooksConfig[hookType as keyof HooksStore] as Array<any>;
    const initialLength = hookArray.length;

    // 过滤掉要删除的钩子
    const filteredArray = hookArray.filter(h => h.hook !== hookName);

    if (filteredArray.length === initialLength) {
      return { success: false, error: '钩子不存在' };
    }

    hooksConfig[hookType as keyof HooksStore] = filteredArray as any;
    await saveHooksConfig(hooksConfig);
    log.info(`[hooks-store] Hook deleted: ${hookType}.${hookName}`);

    return { success: true };
  } catch (error) {
    log.error('[hooks-store] Failed to delete hook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除钩子失败'
    };
  }
}

/**
 * 获取可用的钩子类型列表
 */
export function getHookTypes(): Array<{ value: string; label: string; description: string }> {
  return [
    {
      value: 'preToolUse',
      label: 'PreToolUse',
      description: '在工具使用前触发',
    },
    {
      value: 'postToolUse',
      label: 'PostToolUse',
      description: '在工具使用后触发',
    },
  ];
}
