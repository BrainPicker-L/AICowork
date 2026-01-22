/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @Email       None
 *
 * 环境变量文件管理
 * 将用户配置保存到本地 .env 文件，实现持久化
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { app } from 'electron';
import { log } from '../logger.js';

/** 环境变量文件路径 */
function getEnvFilePath(): string {
  const userDataPath = app.getPath('userData');
  return join(userDataPath, '.env');
}

/**
 * 读取环境变量文件
 */
export function readEnvFile(): Record<string, string> {
  const envPath = getEnvFilePath();

  if (!existsSync(envPath)) {
    log.debug('[env-file] .env file does not exist, returning empty object');
    return {};
  }

  try {
    const content = readFileSync(envPath, 'utf-8');
    const envVars: Record<string, string> = {};

    // 解析 .env 文件内容
    const lines = content.split('\n');
    for (const line of lines) {
      // 跳过注释和空行
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // 解析 KEY=VALUE 格式
      const match = trimmedLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        // 移除值两端的引号（如果有）
        const cleanValue = value.trim().replace(/^['"]|['"]$/g, '');
        envVars[key.trim()] = cleanValue;
      }
    }

    log.debug('[env-file] Loaded environment variables:', Object.keys(envVars));
    return envVars;
  } catch (error) {
    log.error('[env-file] Failed to read .env file:', error);
    return {};
  }
}

/**
 * 写入环境变量文件
 */
export function writeEnvFile(envVars: Record<string, string>): void {
  const envPath = getEnvFilePath();
  const userDataPath = app.getPath('userData');

  try {
    // 确保目录存在
    if (!existsSync(userDataPath)) {
      mkdirSync(userDataPath, { recursive: true });
    }

    // 构建 .env 文件内容
    const lines: string[] = [
      '# AICowork API 配置',
      '# 自动生成，请勿手动编辑',
      '',
    ];

    // API 配置
    if (envVars.ANTHROPIC_AUTH_TOKEN) {
      lines.push(`# Anthropic API Key`);
      lines.push(`ANTHROPIC_AUTH_TOKEN=${envVars.ANTHROPIC_AUTH_TOKEN}`);
      lines.push('');
    }

    if (envVars.ANTHROPIC_BASE_URL) {
      lines.push(`# API Base URL`);
      lines.push(`ANTHROPIC_BASE_URL=${envVars.ANTHROPIC_BASE_URL}`);
      lines.push('');
    }

    if (envVars.ANTHROPIC_MODEL) {
      lines.push(`# 默认模型`);
      lines.push(`ANTHROPIC_MODEL=${envVars.ANTHROPIC_MODEL}`);
      lines.push('');
    }

    if (envVars.ANTHROPIC_API_TYPE) {
      lines.push(`# API 厂商类型`);
      lines.push(`ANTHROPIC_API_TYPE=${envVars.ANTHROPIC_API_TYPE}`);
      lines.push('');
    }

    // 写入文件
    writeFileSync(envPath, lines.join('\n'), 'utf-8');
    log.info('[env-file] Environment variables saved to .env file');
  } catch (error) {
    log.error('[env-file] Failed to write .env file:', error);
    throw new Error(`保存环境变量文件失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 从环境变量文件加载 API 配置
 */
export function loadApiConfigFromEnv(): {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  apiType?: string;
} | null {
  const envVars = readEnvFile();

  if (!envVars.ANTHROPIC_AUTH_TOKEN || !envVars.ANTHROPIC_BASE_URL || !envVars.ANTHROPIC_MODEL) {
    log.debug('[env-file] Incomplete configuration in .env file');
    return null;
  }

  return {
    apiKey: envVars.ANTHROPIC_AUTH_TOKEN,
    baseURL: envVars.ANTHROPIC_BASE_URL,
    model: envVars.ANTHROPIC_MODEL,
    apiType: envVars.ANTHROPIC_API_TYPE || 'anthropic',
  };
}

/**
 * 将 API 配置保存到环境变量文件
 */
export function saveApiConfigToEnv(config: {
  apiKey: string;
  baseURL: string;
  model: string;
  apiType?: string;
}): void {
  const envVars: Record<string, string> = {
    ANTHROPIC_AUTH_TOKEN: config.apiKey,
    ANTHROPIC_BASE_URL: config.baseURL,
    ANTHROPIC_MODEL: config.model,
  };

  if (config.apiType) {
    envVars.ANTHROPIC_API_TYPE = config.apiType;
  }

  writeEnvFile(envVars);
}
