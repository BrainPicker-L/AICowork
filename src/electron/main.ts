/**
 * AICowork Electron 应用主入口
 * 负责应用初始化和模块协调
 *
 * @author Claude Code
 * @created 2025-01-23
 * @Email noreply@anthropic.com
 * @copyright AGPL-3.0
 */

import { app, Menu } from "electron";
import { log, logStartup, setupErrorHandling } from "./logger.js";
import { precheckProxyNeeds } from './services/claude-settings.js';
import { setupLifecycleEventHandlers } from "./main/lifecycle.js";
import { createMainWindow } from "./main/window-manager.js";
import { registerIpcHandlers } from "./main/ipc-registry.js";
import "./services/claude-settings.js";

/**
 * 初始化异步任务
 * 在后台执行，不阻塞应用启动
 */
function initializeAsyncTasks(): void {
    // 启动时预检测代理需求
    precheckProxyNeeds().catch((error) => {
        log.warn('[Main] 代理预检测失败（不影响使用）:', error);
    });

    // 启动时预加载 SDK 配置
    // 优化：提前缓存配置，减少会话启动时的3-5秒延迟
    import("./managers/sdk-config-cache.js").then((cacheModule) => {
        cacheModule.initializeConfigCache().catch((error) => {
            log.warn('[Main] SDK 配置缓存初始化失败（不影响使用）:', error);
        });
    }).catch((error) => {
        log.error('[Main] Failed to import sdk-config-cache module:', error);
    });

    // 从 .env 文件加载环境变量
    import("./utils/env-file.js").then((envModule) => {
        try {
            const envVars = envModule.readEnvFile ? envModule.readEnvFile() : {};
            Object.assign(process.env, envVars);

            if (Object.keys(envVars).length > 0) {
                log.info('[Main] Loaded environment variables from .env file:', Object.keys(envVars));
            }
        } catch (error) {
            log.error('[Main] Failed to load .env file:', error);
        }
    }).catch((error) => {
        log.error('[Main] Failed to import env-file module:', error);
    });
}

/**
 * 应用就绪时的初始化
 */
app.on("ready", () => {
    // 1. 设置错误处理（必须在其他操作之前）
    setupErrorHandling();

    // 2. 记录应用启动
    logStartup();

    // 3. 初始化异步任务
    initializeAsyncTasks();

    // 4. 设置应用菜单
    Menu.setApplicationMenu(null);

    // 5. 设置生命周期事件监听器
    setupLifecycleEventHandlers();

    // 6. 创建主窗口
    createMainWindow();

    // 7. 注册所有 IPC 处理器
    registerIpcHandlers();
});

/**
 * 防止应用在 macOS 上意外退出
 */
app.on("window-all-closed", () => {
    // 在 macOS 上，除非用户明确使用 Cmd+Q 退出
    // 否则应用和菜单栏保持活动状态
    if (process.platform !== "darwin") {
        app.quit();
    }
});
