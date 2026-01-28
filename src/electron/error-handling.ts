import { log } from './logger.js';

/**
 * 设置全局未捕获异常处理器
 */
export function setupGlobalErrorHandlers(): void {
  // 未捕获的 Promise rejection
  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    log.error('[GlobalError] Unhandled Promise Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      promise: promise.toString(),
    });

    // 在开发环境打印完整堆栈
    if (reason instanceof Error) {
      log.error('[GlobalError] Error stack:', reason.stack);
    }
  });

  // 未捕获的异常
  process.on('uncaughtException', (error: Error) => {
    // ✅ 特殊处理：EPIPE 错误（流式输出时客户端断开连接）
    // 这是正常的网络行为，不应该导致应用崩溃
    if (error.message.includes('EPIPE') || error.message.includes('write EPIPE')) {
      log.warn('[GlobalError] EPIPE error (client disconnected during streaming)', {
        message: error.message,
        // 不打印完整堆栈，避免日志污染
      });
      return; // 忽略此错误，继续运行
    }

    log.error('[GlobalError] Uncaught Exception', {
      message: error.message,
      stack: error.stack,
    });

    // 对于未捕获异常，通常应该退出进程
    // 但在 Electron 中，让主进程继续运行以允许用户保存数据
    // 可以选择通知用户或重启应用
  });

  // 警告处理
  process.on('warning', (warning: Error) => {
    log.warn('[GlobalError] Process warning', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
    });
  });

  // 注意：SIGINT/SIGTERM/SIGHUP 信号处理统一在 main.ts 中处理
  // 这里不设置处理器，避免冲突并确保清理逻辑正确执行
}

/**
 * 包装异步函数，自动捕获错误
 */
export function asyncWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const contextStr = context ? `[${context}]` : '';
      log.error(`${contextStr} Async error in ${fn.name}`, error);
      throw error;
    }
  }) as T;
}

/**
 * 创建安全的 IPC 处理器包装器
 * 自动捕获异常并返回标准错误响应
 */
export function createSafeIpcHandler<T extends (...args: any[]) => Promise<any> | any>(
  handler: T,
  handlerName?: string
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = handler(...args);

      // 处理异步结果
      if (result instanceof Promise) {
        return result.catch((error) => {
          const name = handlerName || handler.name || 'unknown';
          log.error(`[IPC] Error in handler "${name}"`, error);

          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        });
      }

      return result;
    } catch (error) {
      const name = handlerName || handler.name || 'unknown';
      log.error(`[IPC] Sync error in handler "${name}"`, error);

      // 对于同步错误，如果是 IPC 处理器，返回错误对象
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }) as T;
}
