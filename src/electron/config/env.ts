/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @Email       None
 *
 * 环境配置模块
 * 提供统一的环境判断和配置获取
 */

import { app } from 'electron';
import os from 'os';
import { isDev as platformIsDev } from '../utils/platform.js';

/** 缓存的环境状态 */
let cachedLogLevel: string | null = null;

/**
 * 判断是否是开发环境
 * 统一使用平台工具模块的判断
 */
export function isDev(): boolean {
  return platformIsDev();
}

/** 判断是否是生产环境 */
export function isProd(): boolean {
  return !isDev();
}

/** 获取用户数据目录 */
export function getUserDataPath(): string {
  if (app) {
    return app.getPath('userData');
  }
  // 回退到环境变量
  return process.env.APPDATA ||
         process.env.HOME ||
         os.homedir();
}

/**
 * 获取日志级别
 * 优先使用环境变量覆盖
 */
export function getLogLevel(): string {
  if (cachedLogLevel === null) {
    // 优先使用环境变量覆盖
    if (process.env.LOG_LEVEL) {
      const validLevels = ['error', 'warn', 'info', 'debug'];
      if (validLevels.includes(process.env.LOG_LEVEL)) {
        cachedLogLevel = process.env.LOG_LEVEL;
      } else {
        cachedLogLevel = isDev() ? 'debug' : 'info';
      }
    } else {
      // 开发环境默认 debug，生产环境默认 info
      cachedLogLevel = isDev() ? 'debug' : 'info';
    }
  }
  return cachedLogLevel;
}

/** 是否启用调试模式 */
export function isDebugMode(): boolean {
  return !!process.env.DEBUG || isDev();
}

/** 获取应用版本 */
export function getAppVersion(): string {
  if (app && app.getVersion) {
    return app.getVersion();
  }
  return process.env.npm_package_version || '0.0.0';
}

/** 获取应用名称 */
export function getAppName(): string {
  if (app && app.getName) {
    return app.getName();
  }
  return 'AICowork';
}

/** 获取系统信息 */
export function getSystemInfo(): {
  platform: string;
  arch: string;
  nodeVersion: string;
  electronVersion: string;
  appVersion: string;
} {
  return {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.versions.node,
    electronVersion: process.versions.electron || 'unknown',
    appVersion: getAppVersion(),
  };
}
