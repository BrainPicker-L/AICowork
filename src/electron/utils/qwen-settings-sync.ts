/**
 * Qwen Settings 同步工具
 * 将 api-config.json 的配置同步到 ~/.qwen/settings.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { log } from '../logger.js';
import type { ApiConfig } from '../storage/config-store.js';

interface QwenSettings {
  mcpServers?: Record<string, any>;
  $version?: number;
  security?: {
    auth?: {
      selectedType?: string;
    };
  };
  model?: {
    name?: string;
  };
  modelProviders?: {
    openai?: Array<{ id: string; envKey: string; baseUrl: string }>;
    anthropic?: Array<{ id: string; envKey: string; baseUrl: string }>;
    gemini?: Array<{ id: string; envKey: string; baseUrl: string }>;
    'vertex-ai'?: Array<{ id: string; envKey: string; baseUrl: string }>;
  };
}

interface ApiConfigsStore {
  configs: ApiConfig[];
  activeConfigId?: string;
}

/**
 * 获取 API 规范
 * 根据 apiType 映射到对应的 API 规范
 */
export function getApiSpec(apiType: string): 'openai' | 'anthropic' | 'gemini' | 'vertex-ai' {
  const specMap: Record<string, 'openai' | 'anthropic' | 'gemini' | 'vertex-ai'> = {
    // OpenAI 规范
    'xita': 'openai',
    'deepseek': 'openai',
    'moonshot': 'openai',
    'alibaba': 'openai',
    
    // Anthropic 规范
    'anthropic': 'anthropic',
    'zhipu': 'anthropic',
    'qiniu': 'anthropic',
    'n1n': 'anthropic',
    'minimax': 'anthropic',
    
    // Gemini 规范
    'gemini': 'gemini',
    
    // Vertex AI 规范
    'vertex-ai': 'vertex-ai',
    
    // 自定义（默认 anthropic）
    'custom': 'anthropic',
  };
  
  return specMap[apiType] || 'anthropic';
}

/**
 * 构建 baseUrl
 * 只有 openai 规范才添加 /v1 后缀
 */
function buildBaseUrl(baseURL: string, apiSpec: 'openai' | 'anthropic' | 'gemini' | 'vertex-ai'): string {
  // 移除尾部斜杠
  let url = baseURL.replace(/\/$/, '');
  
  // 只有 openai 规范才添加 /v1 后缀
  if (apiSpec === 'openai' && !url.endsWith('/v1')) {
    url += '/v1';
  }
  
  return url;
}

/**
 * 同步配置到 ~/.qwen/settings.json
 * 
 * 功能：
 * 1. 读取或创建 settings.json
 * 2. 按 API 规范分组配置
 * 3. 只对 openai 规范的 baseURL 添加 /v1 后缀
 * 4. 只更新 modelProviders 和 $version，不添加其他字段
 * 5. 写回文件
 */
export function syncToQwenSettings(apiConfigStore: ApiConfigsStore): void {
  const qwenSettingsPath = join(homedir(), '.qwen', 'settings.json');
  
  // 1. 读取或创建 settings.json
  let qwenSettings: QwenSettings = {};
  
  if (existsSync(qwenSettingsPath)) {
    try {
      const content = readFileSync(qwenSettingsPath, 'utf8');
      qwenSettings = JSON.parse(content);
      log.debug('[qwen-settings-sync] Loaded existing settings.json');
    } catch (error) {
      log.warn('[qwen-settings-sync] Failed to parse settings.json, creating new', error);
      qwenSettings = {};
    }
  } else {
    // 确保目录存在
    const dir = join(homedir(), '.qwen');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      log.info('[qwen-settings-sync] Created ~/.qwen directory');
    }
    log.info('[qwen-settings-sync] Creating new settings.json');
  }
  
  // 2. 只设置必要的字段：$version 和 modelProviders
  if (!qwenSettings.$version) {
    qwenSettings.$version = 2;
  }
  
  // 3. 清空现有的 modelProviders（完全重建）
  qwenSettings.modelProviders = {
    openai: [],
    anthropic: [],
    gemini: [],
    'vertex-ai': [],
  };
  
  // 4. 按 API 规范分组并添加配置
  for (const config of apiConfigStore.configs) {
    // 获取 API 规范
    const apiSpec = config.apiSpec || getApiSpec(config.apiType || 'custom');
    
    // 构建 baseUrl（只有 openai 规范才添加 /v1）
    const baseUrl = buildBaseUrl(config.baseURL, apiSpec);
    
    const modelConfig = {
      id: config.model,
      envKey: 'OPENAI_API_KEY', // 固定值
      baseUrl: baseUrl,
    };
    
    // 添加到对应的规范分组
    if (!qwenSettings.modelProviders[apiSpec]) {
      qwenSettings.modelProviders[apiSpec] = [];
    }
    qwenSettings.modelProviders[apiSpec]!.push(modelConfig);
    
    log.debug(`[qwen-settings-sync] Added model to ${apiSpec}: ${config.model} -> ${baseUrl}`);
  }
  
  // 5. 写回文件（只包含 $version 和 modelProviders）
  try {
    // 只保留 $version 和 modelProviders
    const outputSettings = {
      $version: qwenSettings.$version,
      modelProviders: qwenSettings.modelProviders,
    };
    
    writeFileSync(qwenSettingsPath, JSON.stringify(outputSettings, null, 2), 'utf8');
    log.info('[qwen-settings-sync] ✓ Successfully synced to ~/.qwen/settings.json');
    
    // 打印同步统计
    const stats = {
      openai: qwenSettings.modelProviders.openai?.length || 0,
      anthropic: qwenSettings.modelProviders.anthropic?.length || 0,
      gemini: qwenSettings.modelProviders.gemini?.length || 0,
      'vertex-ai': qwenSettings.modelProviders['vertex-ai']?.length || 0,
    };
    log.info('[qwen-settings-sync] Sync stats:', stats);
  } catch (error) {
    log.error('[qwen-settings-sync] ✗ Failed to write settings.json', error);
    throw error;
  }
}
