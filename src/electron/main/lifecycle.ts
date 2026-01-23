/**
 * 应用生命周期管理
 * 处理应用启动、关闭、清理等生命周期事件
 */

import { app, globalShortcut } from "electron";
import { execSync } from "child_process";
import { isDev, DEV_PORT } from "../util.js";
import { stopPolling } from "../test.js";
import { cleanupAllSessions } from "../ipc-handlers.js";
import { getMemvidStore } from "../storage/memvid-store.js";
import { log } from "../logger.js";

let cleanupComplete = false;

/**
 * 清理函数
 * 在应用退出前执行清理操作
 */
export function cleanup(): void {
    if (cleanupComplete) return;
    cleanupComplete = true;

    // 关闭 Memvid 连接
    try {
        const memvidStore = getMemvidStore();
        memvidStore.close().catch((err: Error) => {
            log.warn('[cleanup] Failed to close Memvid store:', err);
        });
        log.info('[cleanup] Memvid store closed');
    } catch (err) {
        log.warn('[cleanup] Error closing Memvid store:', err);
    }

    // 销毁 SDK 配置缓存
    try {
        const { destroyConfigCache } = require("../managers/sdk-config-cache.js");
        destroyConfigCache();
        log.info('[cleanup] SDK config cache destroyed');
    } catch (err) {
        log.warn('[cleanup] Error destroying SDK config cache:', err);
    }

    globalShortcut.unregisterAll();
    stopPolling();
    cleanupAllSessions();
    killViteDevServer();
}

/**
 * 终止信号处理
 */
export function handleSignal(): void {
    cleanup();
    app.quit();
}

/**
 * 杀死 Vite 开发服务器
 */
function killViteDevServer(): void {
    if (!isDev()) return;
    try {
        if (process.platform === 'win32') {
            execSync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${DEV_PORT}') do taskkill /PID %a /F`, { stdio: 'ignore', shell: 'cmd.exe' });
        } else {
            execSync(`lsof -ti:${DEV_PORT} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
        }
    } catch {
        // Process may already be dead
    }
}

/**
 * 设置应用生命周期事件监听器
 */
export function setupLifecycleEventHandlers(): void {
    // Setup event handlers
    app.on("before-quit", () => {
        log.info('Application quitting (before-quit event)');
        cleanup();
    });
    app.on("will-quit", () => {
        log.info('Application quitting (will-quit event)');
        cleanup();
    });
    app.on("window-all-closed", () => {
        log.info('All windows closed');
        cleanup();
        app.quit();
    });

    process.on("SIGTERM", handleSignal);
    process.on("SIGINT", handleSignal);
    process.on("SIGHUP", handleSignal);
}
