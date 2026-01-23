/**
 * Permissions 管理存储库
 * 管理工具权限规则配置
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { app } from 'electron';
import { log } from '../logger.js';

// 权限规则接口
export interface PermissionRule {
  tool: string;
  allowed: boolean;
  description?: string;
}

// Permissions 配置存储接口
export interface PermissionsStore {
  allowedTools: string[];
  customRules: PermissionRule[];
}

// 获取配置文件路径
function getConfigPath(): string {
  const userDataPath = app.getPath('userData');
  return join(userDataPath, 'permissions.json');
}

/**
 * 加载 Permissions 配置
 */
export async function getPermissionsConfig(): Promise<PermissionsStore> {
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
          allowedTools: [],
          customRules: [],
        };
      }
      // JSON 解析错误或其他错误
      log.error('[permissions-store] Failed to parse permissions config:', readError);
      return {
        allowedTools: [],
        customRules: [],
      };
    }
  } catch (error) {
    log.error('[permissions-store] Failed to load permissions config:', error);
    return {
      allowedTools: [],
      customRules: [],
    };
  }
}

/**
 * 保存 Permissions 配置
 */
async function savePermissionsConfig(config: PermissionsStore): Promise<void> {
  try {
    const configPath = getConfigPath();
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    log.error('[permissions-store] Failed to save permissions config:', error);
    throw new Error('Failed to save permissions configuration');
  }
}

/**
 * 保存权限规则
 */
export async function savePermissionRule(rule: PermissionRule): Promise<{ success: boolean; error?: string }> {
  try {
    const permissionsConfig = await getPermissionsConfig();

    // 验证规则
    if (!rule.tool || rule.tool.trim().length === 0) {
      return { success: false, error: '工具名称不能为空' };
    }

    // 检查规则是否已存在
    const existingIndex = permissionsConfig.customRules.findIndex(r => r.tool === rule.tool);
    if (existingIndex >= 0) {
      // 更新现有规则
      permissionsConfig.customRules[existingIndex] = rule;
    } else {
      // 添加新规则
      permissionsConfig.customRules.push(rule);
    }

    // 如果是允许的工具，添加到 allowedTools 列表
    if (rule.allowed) {
      if (!permissionsConfig.allowedTools.includes(rule.tool)) {
        permissionsConfig.allowedTools.push(rule.tool);
      }
    } else {
      // 如果是拒绝的工具，从 allowedTools 列表移除
      permissionsConfig.allowedTools = permissionsConfig.allowedTools.filter(t => t !== rule.tool);
    }

    await savePermissionsConfig(permissionsConfig);
    log.info(`[permissions-store] Permission rule saved: ${rule.tool} -> ${rule.allowed}`);

    return { success: true };
  } catch (error) {
    log.error('[permissions-store] Failed to save permission rule:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '保存权限规则失败'
    };
  }
}

/**
 * 删除权限规则
 */
export async function deletePermissionRule(toolName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const permissionsConfig = await getPermissionsConfig();

    const initialLength = permissionsConfig.customRules.length;

    // 过滤掉要删除的规则
    permissionsConfig.customRules = permissionsConfig.customRules.filter(r => r.tool !== toolName);

    // 同时从 allowedTools 中移除
    permissionsConfig.allowedTools = permissionsConfig.allowedTools.filter(t => t !== toolName);

    if (permissionsConfig.customRules.length === initialLength) {
      return { success: false, error: '规则不存在' };
    }

    await savePermissionsConfig(permissionsConfig);
    log.info(`[permissions-store] Permission rule deleted: ${toolName}`);

    return { success: true };
  } catch (error) {
    log.error('[permissions-store] Failed to delete permission rule:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除权限规则失败'
    };
  }
}

/**
 * 获取可用的工具列表
 */
export function getAvailableTools(): Array<{ name: string; description: string }> {
  return [
    { name: 'Bash', description: '执行 bash 命令' },
    { name: 'Read', description: '读取文件内容' },
    { name: 'Write', description: '写入文件内容' },
    { name: 'Edit', description: '编辑文件' },
    { name: 'Glob', description: '文件模式匹配' },
    { name: 'Grep', description: '搜索文件内容' },
    { name: 'Task', description: '启动子代理' },
    { name: 'AskUserQuestion', description: '向用户提问' },
    { name: 'WebSearch', description: '网络搜索' },
    { name: 'mcp__4_5v_mcp__analyze_image', description: '图像分析' },
    { name: 'mcp__web_reader__webReader', description: '网页阅读器' },
  ];
}
