/**
 * 前端日志工具
 *
 * 将前端日志通过 IPC 发送到主进程的 winston 日志系统
 *
 * @author: Alan
 * @copyright: Copyright © 2026
 * @created: 2026-01-20
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMessage {
  level: LogLevel;
  message: string;
  meta?: unknown;
  timestamp: string;
}

/**
 * 前端日志类
 */
class FrontendLogger {
  private isDevelopment = import.meta.env.DEV;

  /**
   * 发送日志到主进程
   */
  private sendLog(level: LogLevel, message: string, meta?: unknown): void {
    const logMessage: LogMessage = {
      level,
      message,
      meta,
      timestamp: new Date().toISOString()
    };

    // 开发环境下同时输出到 console
    if (this.isDevelopment) {
      switch (level) {
        case 'error':
          console.error(`[Frontend] ${message}`, meta || '');
          break;
        case 'warn':
          console.warn(`[Frontend] ${message}`, meta || '');
          break;
        case 'info':
          console.info(`[Frontend] ${message}`, meta || '');
          break;
        case 'debug':
          console.debug(`[Frontend] ${message}`, meta || '');
          break;
      }
    }

    // 通过 IPC 发送到主进程（如果可用）
    if (window.electron && typeof window.electron.sendLog === 'function') {
      window.electron.sendLog(logMessage).catch((err: unknown) => {
        // 如果发送失败，回退到 console
        if (this.isDevelopment) {
          console.error('[FrontendLogger] Failed to send log to main process:', err);
        }
      });
    }
  }

  info(message: string, meta?: unknown): void {
    this.sendLog('info', message, meta);
  }

  warn(message: string, meta?: unknown): void {
    this.sendLog('warn', message, meta);
  }

  error(message: string, error?: Error | unknown): void {
    const meta = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error;
    this.sendLog('error', message, meta);
  }

  debug(message: string, meta?: unknown): void {
    if (this.isDevelopment) {
      this.sendLog('debug', message, meta);
    }
  }
}

// 创建单例实例
export const logger = new FrontendLogger();

// 便捷导出
export const log = {
  info: (message: string, meta?: unknown) => logger.info(message, meta),
  warn: (message: string, meta?: unknown) => logger.warn(message, meta),
  error: (message: string, error?: Error | unknown) => logger.error(message, error),
  debug: (message: string, meta?: unknown) => logger.debug(message, meta),
};

export default logger;
