/**
 * AICowork Electron 应用主入口
 * 负责应用初始化和模块协调
 */

import { app, Menu, shell, nativeTheme } from "electron";
import { log, logStartup, setupErrorHandling } from "./logger.js";
import { setupLifecycleEventHandlers } from "./main/lifecycle.js";
import { createMainWindow } from "./main/window-manager.js";
import { registerIpcHandlers } from "./main/ipc-registry.js";
import "./services/claude-settings.js";
import { autoConnectDingTalk } from "./services/dingtalk-service.js";
import { getEmit } from "./ipc-handlers.js";

// 导入应用服务初始化器
import { initializeAppServices } from "./main/app-initializer.js";

// 导入主题偏好
import { loadThemePreference } from "./storage/theme-store.js";

/**
 * 设置应用菜单（保留基本功能）
 */
function setupApplicationMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
        {
            label: '文件',
            submenu: [
                {
                    label: '退出',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: '编辑',
            submenu: [
                { role: 'undo', label: '撤销' },
                { role: 'redo', label: '重做' },
                { type: 'separator' },
                { role: 'cut', label: '剪切' },
                { role: 'copy', label: '复制' },
                { role: 'paste', label: '粘贴' },
                { role: 'selectAll', label: '全选' }
            ]
        },
        {
            label: '帮助',
            submenu: [
                {
                    label: '文档',
                    click: () => {
                        shell.openExternal('https://docs.qq.com/form/page/DRm5uV1pSZFB3VHNv');
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

/**
 * 应用就绪时的初始化
 */
app.on("ready", async () => {
    // 1. 设置错误处理（必须在其他操作之前）
    setupErrorHandling();

    // 2. 记录应用启动
    logStartup();

    // 3. 初始化应用服务（后台异步执行）
    initializeAppServices().catch((error) => {
        log.error('[App] Failed to initialize services:', error);
    });

    // 4. 应用主题偏好（在创建窗口前设置，确保窗口创建时已是正确主题）
    const themePreference = loadThemePreference();
    nativeTheme.themeSource = themePreference;
    log.info(`[App] Theme preference applied: ${themePreference}`);

    // 5. 设置应用菜单（保留基本功能）
    setupApplicationMenu();

    // 6. 设置生命周期事件监听器
    setupLifecycleEventHandlers();

    // 7. 创建主窗口（等待 Vite 服务器准备好）
    await createMainWindow();

    // 8. 注册所有 IPC 处理器
    registerIpcHandlers();

    // 9. 钉钉机器人自动连接（如果已配置且启用）
    autoConnectDingTalk(getEmit()).catch((error) => {
        log.error('[App] DingTalk auto-connect failed:', error);
    });
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
