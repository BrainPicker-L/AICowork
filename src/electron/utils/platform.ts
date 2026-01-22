/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @Email       None
 *
 * 平台兼容性工具函数
 * 提供跨平台的统一接口
 */

import { platform } from 'process';
import { app } from 'electron';
import path from 'path';

/** 当前平台类型 */
export type Platform = 'windows' | 'macos' | 'linux' | 'unknown';

/**
 * 获取当前平台
 */
export function getPlatform(): Platform {
  switch (platform) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'macos';
    case 'linux':
      return 'linux';
    default:
      return 'unknown';
  }
}

/** 是否是 Windows */
export const isWindows = platform === 'win32';

/** 是否是 macOS */
export const isMacOS = platform === 'darwin';

/** 是否是 Linux */
export const isLinux = platform === 'linux';

/**
 * 获取平台特定的路径分隔符
 */
export function getPathSeparator(): string {
  return path.sep;
}

/**
 * 获取平台特定的换行符
 */
export function getLineEnding(): string {
  return isWindows ? '\r\n' : '\n';
}

/**
 * 判断是否是开发环境
 * 使用 app.isPackaged 而不是 process.env.NODE_ENV
 */
export function isDev(): boolean {
  if (app && typeof app.isPackaged === 'boolean') {
    return !app.isPackaged;
  }
  // 回退到环境变量
  return process.env.NODE_ENV === 'development';
}

/** 判断是否是生产环境 */
export function isProd(): boolean {
  return !isDev();
}

/**
 * 获取用户数据目录
 * 跨平台统一接口
 */
export function getUserDataPath(): string {
  if (app) {
    return app.getPath('userData');
  }
  // 回退方案（使用环境变量，避免 require/os 导入）
  return process.env.APPDATA ||  // Windows
         process.env.HOME ||     // Unix-like
         process.env.USERPROFILE || // Windows (备用)
         '.';  // 最后的回退
}

/**
 * 获取平台特定的删除命令模式
 */
export function getPlatformDeletePatterns(): RegExp[] {
  // PowerShell 跨平台
  const basePatterns = [
    /\b(Remove-Item|Delete-Item|Remove-ItemProperty)\b/i,
    /\b(powershell|pwsh)(\s+(-Command|-c)\s+)?(".*?\b(Remove-Item|Delete-Item|Remove-ItemProperty)\b|'.*?\b(Remove-Item|Delete-Item|Remove-ItemProperty)\b)/i,
  ];

  if (isWindows) {
    basePatterns.push(
      /\b(cmd\.exe|cmd)\s+(\/c|\/k)\s+"[^"]*\b(del|erase|rmdir|rd)\b/i,
      /\|\s*(\w+\.exe)?\s*\b(del|erase)\s+/i,
      /[;&]\s*\b(del|erase|rmdir|rd)\s+/i,
    );
  } else {
    // Unix (macOS/Linux)
    basePatterns.push(
      /\brm\s+[-\w\s\\""'\$]+/,
      /\brmdir\s+/,
      /\bunlink\s+/,
    );
  }

  return basePatterns;
}

/**
 * 终止占用端口的进程
 * 跨平台实现
 */
export async function killPortOccupier(port: number): Promise<boolean> {
  const { execSync } = await import('child_process');

  try {
    if (isWindows) {
      // Windows 方法 1: PowerShell (推荐)
      try {
        execSync(
          `powershell -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }"`,
          { stdio: 'ignore' }
        );
        return true;
      } catch {
        // Windows 方法 2: netstat + taskkill (回退方案)
        execSync(
          `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /PID %a /F`,
          { stdio: 'ignore', shell: 'cmd.exe' }
        );
        return true;
      }
    } else {
      // Unix 方法: lsof
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
      return true;
    }
  } catch (error) {
    const { log } = await import('../logger.js');
    log.warn(`[Platform] Failed to kill process on port ${port}:`, error);
    return false;
  }
}
