/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-21
 * @updated     2026-01-21
 * @Email       None
 *
 * Output Styles 管理存储库
 * 管理 AI 输出样式和格式配置
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { app } from 'electron';
import { log } from '../logger.js';

// 输出配置接口
export interface OutputConfig {
  format: 'markdown' | 'plain';
  theme: 'default' | 'dark' | 'light';
  codeHighlight: boolean;
  showLineNumbers: boolean;
  fontSize: 'small' | 'medium' | 'large';
  wrapCode: boolean;
  renderer: 'standard' | 'enhanced';
}

// 默认配置
const DEFAULT_CONFIG: OutputConfig = {
  format: 'markdown',
  theme: 'default',
  codeHighlight: true,
  showLineNumbers: false,
  fontSize: 'medium',
  wrapCode: false,
  renderer: 'enhanced',
};

// 获取配置文件路径
function getConfigPath(): string {
  const userDataPath = app.getPath('userData');
  return join(userDataPath, 'output.json');
}

/**
 * 加载输出配置
 */
export async function getOutputConfig(): Promise<OutputConfig> {
  try {
    const configPath = getConfigPath();

    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      // 合并默认配置，确保所有字段都存在
      return { ...DEFAULT_CONFIG, ...config };
    } catch (readError: any) {
      // 区分文件不存在和 JSON 解析错误
      if (readError.code === 'ENOENT') {
        // 文件不存在，返回默认配置
        return { ...DEFAULT_CONFIG };
      }
      // JSON 解析错误或其他错误
      log.error('[output-store] Failed to parse output config:', readError);
      return { ...DEFAULT_CONFIG };
    }
  } catch (error) {
    log.error('[output-store] Failed to load output config:', error);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * 保存输出配置
 */
export async function saveOutputConfig(config: Partial<OutputConfig>): Promise<{ success: boolean; error?: string }> {
  try {
    const currentConfig = await getOutputConfig();
    const newConfig = { ...currentConfig, ...config };

    const configPath = getConfigPath();
    await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');

    log.info('[output-store] Output config saved:', newConfig);
    return { success: true };
  } catch (error) {
    log.error('[output-store] Failed to save output config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '保存输出配置失败'
    };
  }
}

/**
 * 获取可用的主题选项
 */
export function getThemeOptions(): Array<{ value: string; label: string; description: string }> {
  return [
    { value: 'default', label: '默认', description: '跟随系统设置' },
    { value: 'dark', label: '深色', description: '深色主题' },
    { value: 'light', label: '浅色', description: '浅色主题' },
  ];
}

/**
 * 获取可用的字号选项
 */
export function getFontSizeOptions(): Array<{ value: string; label: string }> {
  return [
    { value: 'small', label: '小' },
    { value: 'medium', label: '中' },
    { value: 'large', label: '大' },
  ];
}

/**
 * 获取可用的渲染器选项
 */
export function getRendererOptions(): Array<{ value: string; label: string; description: string }> {
  return [
    {
      value: 'standard',
      label: '标准渲染器',
      description: '基础 Markdown 渲染，轻量快速'
    },
    {
      value: 'enhanced',
      label: '增强渲染器',
      description: '支持图表、流程图、SVG 等（实验性）'
    },
  ];
}
