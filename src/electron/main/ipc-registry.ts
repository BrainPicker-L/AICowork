/**
 * IPC 处理器注册中心
 * 组织和注册所有 IPC 通信处理器
 */

import { ipcMain, dialog } from "electron";
import { getMainWindow } from "./window-manager.js";
import { wrapIpcHandler } from "../middleware/ipc-error-handler.js";
import { getStaticData, pollResources } from "../test.js";
import { handleClientEvent, sessions } from "../ipc-handlers.js";
import { generateSessionTitle } from '../utils/util.js';
import { getCurrentApiConfig } from '../services/claude-settings.js';
import { testApiConnection } from "../api-tester.js";
import type { ClientEvent } from "../types.js";
import { SLASH_COMMANDS_CACHE_TTL } from "../config/network-constants.js";

// ==================== 核心处理器 ====================

/**
 * 注册核心 IPC 处理器
 */
function registerCoreHandlers(): void {
    ipcMain.handle("getStaticData", () => {
        return getStaticData();
    });

    ipcMain.on("client-event", (_: any, event: ClientEvent) => {
        handleClientEvent(event);
    });
}

// ==================== 会话处理器 ====================

/**
 * 注册会话相关 IPC 处理器
 */
function registerSessionHandlers(): void {
    ipcMain.handle("generate-session-title", async (_: any, userInput: string | null) => {
        return await generateSessionTitle(userInput);
    });

    ipcMain.handle("get-recent-cwds", (_: any, limit?: number) => {
        const boundedLimit = limit ? Math.min(Math.max(limit, 1), 20) : 8;
        return sessions.listRecentCwds(boundedLimit);
    });

    ipcMain.handle("session.rename", wrapIpcHandler("session.rename", async (_: any, sessionId: string, newTitle: string) => {
        const success = sessions.renameSession(sessionId, newTitle);
        return { success };
    }));
}

// ==================== 配置处理器 ====================

/**
 * 注册配置相关 IPC 处理器
 */
function registerConfigHandlers(): void {
    ipcMain.handle("get-api-config", () => {
        return getCurrentApiConfig();
    });

    ipcMain.handle("check-api-config", () => {
        const config = getCurrentApiConfig();
        return { hasConfig: config !== null, config };
    });

    ipcMain.handle("select-directory", async () => {
        const mainWindow = getMainWindow();
        if (!mainWindow) {
            throw new Error("Main window not available");
        }

        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });

        if (result.canceled) {
            return null;
        }

        return result.filePaths[0];
    });

    ipcMain.handle("test-api-connection", async (_: any, config: any) => {
        return await testApiConnection(config);
    });
}

// ==================== 日志处理器 ====================

/**
 * 注册日志相关 IPC 处理器
 */
function registerLoggingHandlers(): void {
    const { log } = require("../logger.js");

    ipcMain.handle("send-log", (_: any, logMessage: { level: string; message: string; meta?: unknown; timestamp: string }) => {
        const { level, message, meta } = logMessage;
        switch (level) {
            case 'error':
                log.error(`[Frontend] ${message}`, meta);
                break;
            case 'warn':
                log.warn(`[Frontend] ${message}`, meta);
                break;
            case 'info':
                log.info(`[Frontend] ${message}`, meta);
                break;
            case 'debug':
                log.debug(`[Frontend] ${message}`, meta);
                break;
        }
        return;
    });
}

// ==================== 斜杠命令缓存系统 ====================

/**
 * 设置斜杠命令缓存系统
 */
function setupSlashCommandsCache(): void {
    const { log } = require("../logger.js");

    let slashCommandsCache: Array<{ name: string; description: string; source: string }> | null = null;
    let slashCommandsCacheTime = 0;

    /**
     * 清除斜杠命令缓存
     * 当检测到 settings.json 变化时调用
     */
    function clearSlashCommandsCache(): void {
        slashCommandsCache = null;
        slashCommandsCacheTime = 0;
        log.info('[IPC] 斜杠命令缓存已清除');
    }

    /**
     * 设置 settings.json 文件监听
     */
    async function setupSettingsWatcher(): Promise<void> {
        try {
            const FS = await import('fs');
            const path = await import('path');
            const os = await import('os');
            const settingsFile = path.join(os.homedir(), '.claude', 'settings.json');

            // 检查文件是否存在
            try {
                await FS.promises.access(settingsFile);
            } catch {
                return;
            }

            // 监听文件变化
            const watcher = FS.watch(settingsFile, (eventType) => {
                if (eventType === 'change') {
                    log.info('[IPC] 检测到 settings.json 变化，清除斜杠命令缓存');
                    clearSlashCommandsCache();
                }
            });

            log.info('[IPC] settings.json 文件监听已设置');

            // 注意：watcher 需要在应用退出时关闭，这里简化处理
            process.on('exit', () => watcher.close());
        } catch (error) {
            log.warn('[IPC] 设置 settings.json 监听失败:', error);
        }
    }

    // 注册斜杠命令处理器
    ipcMain.handle("get-slash-commands", async () => {
        try {
            // 检查缓存是否有效
            const now = Date.now();
            if (slashCommandsCache && (now - slashCommandsCacheTime) < SLASH_COMMANDS_CACHE_TTL) {
                return slashCommandsCache;
            }

            const { getSlashCommands } = await import("../services/slash-commands.js");
            const commands = await getSlashCommands();

            // 更新缓存
            slashCommandsCache = commands;
            slashCommandsCacheTime = now;

            return commands;
        } catch (error) {
            const { log } = require("../logger.js");
            log.error("[IPC] 获取斜杠命令失败", error);
            // 返回内置命令作为回退
            return [
                { name: "/plan", description: "制定实施计划", source: "builtin" },
                { name: "/help", description: "显示帮助信息", source: "builtin" },
                { name: "/bug", description: "报告 Bug", source: "builtin" },
                { name: "/clear", description: "清除屏幕", source: "builtin" },
                { name: "/exit", description: "退出会话", source: "builtin" },
                { name: "/new", description: "新建会话", source: "builtin" },
                { name: "/sessions", description: "会话管理", source: "builtin" },
            ];
        }
    });

    // 初始化文件监听
    setupSettingsWatcher().catch(err => {
        log.warn('[IPC] 初始化文件监听失败:', err);
    });
}

// ==================== 主注册函数 ====================

/**
 * 注册所有 IPC 处理器
 */
export function registerIpcHandlers(): void {
    registerCoreHandlers();
    registerSessionHandlers();
    registerConfigHandlers();
    registerLoggingHandlers();
    setupSlashCommandsCache();

    // 启动资源轮询
    const mainWindow = getMainWindow();
    if (mainWindow) {
        pollResources(mainWindow);
    }
}
