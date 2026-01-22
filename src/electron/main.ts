import { app, BrowserWindow, ipcMain, dialog, globalShortcut, Menu, shell } from "electron"
import { execSync } from "child_process";
import { ipcMainHandle, isDev, DEV_PORT } from "./util.js";
import { getPreloadPath, getUIPath, getIconPath } from "./pathResolver.js";
import { getStaticData, pollResources, stopPolling } from "./test.js";
import { handleClientEvent, sessions, cleanupAllSessions } from "./ipc-handlers.js";
import { generateSessionTitle } from "./libs/util.js";
import { saveApiConfig } from "./libs/config-store.js";
import { getCurrentApiConfig } from "./libs/claude-settings.js";
import { testApiConnection } from "./api-tester.js";
import { log, logStartup, setupErrorHandling } from "./logger.js";
import type { ClientEvent } from "./types.js";
import "./libs/claude-settings.js";
import { getMemvidStore } from "./libs/memvid-store.js";

let cleanupComplete = false;
let mainWindow: BrowserWindow | null = null;

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

function cleanup(): void {
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

    globalShortcut.unregisterAll();
    stopPolling();
    cleanupAllSessions();
    killViteDevServer();
}

function handleSignal(): void {
    cleanup();
    app.quit();
}

// Initialize everything when app is ready
app.on("ready", () => {
    // 设置错误处理（必须在其他操作之前）
    setupErrorHandling();

    // 记录应用启动
    logStartup();

    // 从 .env 文件加载环境变量（在启动时自动读取）
    import("./libs/env-file.js").then((envModule) => {
        try {
            const envVars = envModule.readEnvFile ? envModule.readEnvFile() : {};

            // 将环境变量合并到 process.env
            Object.assign(process.env, envVars);

            if (Object.keys(envVars).length > 0) {
                console.log('[Main] Loaded environment variables from .env file:', Object.keys(envVars));
            }
        } catch (error) {
            console.error('[Main] Failed to load .env file:', error);
            // 不阻塞启动，继续执行
        }
    }).catch((error) => {
        console.error('[Main] Failed to import env-file module:', error);
    });

    Menu.setApplicationMenu(null);
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

    // Create main window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        webPreferences: {
            preload: getPreloadPath(),
        },
        icon: getIconPath(),
        titleBarStyle: "hiddenInset",
        backgroundColor: "#FAF9F6",
        trafficLightPosition: { x: 15, y: 18 }
    });

    if (isDev()) mainWindow.loadURL(`http://localhost:${DEV_PORT}`)
    else mainWindow.loadFile(getUIPath());

    // 设置 CSP 安全头
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        // 开发环境：允许本地开发服务器和内联脚本
        // 生产环境：严格限制资源来源
        const csp = isDev()
            ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*; style-src 'self' 'unsafe-inline' http://localhost:*;"
            : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.anthropic.com https://*.anthropic.com;";

        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [csp]
            }
        });
    });

    globalShortcut.register('CommandOrControl+Q', () => {
        cleanup();
        app.quit();
    });

    // 开发者工具快捷键（用于调试）
    globalShortcut.register('F12', () => {
        mainWindow?.webContents.openDevTools();
    });
    globalShortcut.register('CommandOrControl+Shift+I', () => {
        mainWindow?.webContents.openDevTools();
    });

    pollResources(mainWindow);

    ipcMainHandle("getStaticData", () => {
        return getStaticData();
    });

    // Handle client events
    ipcMain.on("client-event", (_: any, event: ClientEvent) => {
        handleClientEvent(event);
    });

    // Handle session title generation
    ipcMainHandle("generate-session-title", async (_: any, userInput: string | null) => {
        return await generateSessionTitle(userInput);
    });

    // Handle recent cwds request
    ipcMainHandle("get-recent-cwds", (_: any, limit?: number) => {
        const boundedLimit = limit ? Math.min(Math.max(limit, 1), 20) : 8;
        return sessions.listRecentCwds(boundedLimit);
    });

    // Handle directory selection
    ipcMainHandle("select-directory", async () => {
        const result = await dialog.showOpenDialog(mainWindow!, {
            properties: ['openDirectory']
        });

        if (result.canceled) {
            return null;
        }

        return result.filePaths[0];
    });

    // Handle API config
    ipcMainHandle("get-api-config", () => {
        return getCurrentApiConfig();
    });

    ipcMainHandle("check-api-config", () => {
        const config = getCurrentApiConfig();
        return { hasConfig: config !== null, config };
    });

    // Handle API config validation
    ipcMainHandle("validate-api-config", async (_: any, config: any) => {
        const { validateApiConfig } = await import("./libs/config-store.js");
        return validateApiConfig(config);
    });

    // Handle get supported providers
    ipcMainHandle("get-supported-providers", async () => {
        const { getSupportedProviders } = await import("./libs/config-store.js");
        return getSupportedProviders();
    });

    // Handle get provider config
    ipcMainHandle("get-provider-config", async (_: any, provider: string) => {
        const { getProviderConfig } = await import("./libs/config-store.js");
        return getProviderConfig(provider as any);
    });

    // Handle get all API configs
    ipcMainHandle("get-all-api-configs", async () => {
        try {
            const { loadAllApiConfigs } = await import("./libs/config-store.js");
            const result = loadAllApiConfigs();
            return result || { configs: [] };
        } catch (error) {
            log.error("[IPC] Failed to load all API configs", error);
            return { configs: [] };
        }
    });

    // Handle get API config by ID
    ipcMainHandle("get-api-config-by-id", async (_: any, configId: string) => {
        try {
            const { loadAllApiConfigs } = await import("./libs/config-store.js");
            const result = loadAllApiConfigs();
            if (result && result.configs) {
                const config = result.configs.find((c: any) => c.id === configId);
                return config || null;
            }
            return null;
        } catch (error) {
            log.error("[IPC] Failed to get API config by ID", error);
            return null;
        }
    });

    // Handle get Anthropic format URLs
    ipcMainHandle("get-anthropic-format-urls", async () => {
        const { getAnthropicFormatUrls } = await import("./libs/api-adapter.js");
        return getAnthropicFormatUrls();
    });

    // Handle get all preset URLs
    ipcMainHandle("get-all-preset-urls", async () => {
        const { getAllPresetUrls } = await import("./libs/api-adapter.js");
        return getAllPresetUrls();
    });

    ipcMainHandle("save-api-config", async (_: any, config: any) => {
        try {
            const { saveApiConfigAsync } = await import("./libs/config-store.js");
            const result = await saveApiConfigAsync(config);

            // 保存成功后，立即更新 process.env（无需重启应用）
            if (result.success) {
                process.env.ANTHROPIC_AUTH_TOKEN = config.apiKey;
                process.env.ANTHROPIC_BASE_URL = config.baseURL;
                process.env.ANTHROPIC_MODEL = config.model;
                if (config.apiType) {
                    process.env.ANTHROPIC_API_TYPE = config.apiType;
                }
                console.log('[Main] Updated process.env with new API config');
            }

            return result;
        } catch (error) {
            log.error("[IPC] Failed to save API config", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "未知错误"
            };
        }
    });

    ipcMainHandle("delete-api-config", async (_: any, configId: string) => {
        try {
            const { deleteApiConfig } = await import("./libs/config-store.js");
            deleteApiConfig(configId);
            return { success: true };
        } catch (error) {
            log.error("[IPC] Failed to delete API config", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "未知错误"
            };
        }
    });

    ipcMainHandle("set-active-api-config", async (_: any, configId: string) => {
        try {
            const { setActiveApiConfig } = await import("./libs/config-store.js");
            setActiveApiConfig(configId);
            return { success: true };
        } catch (error) {
            log.error("[IPC] Failed to set active API config", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "未知错误"
            };
        }
    });

    // Handle API connection testing
    ipcMainHandle("test-api-connection", async (_: any, config: any) => {
        return await testApiConnection(config);
    });

    // Handle frontend logging
    ipcMainHandle("send-log", (_: any, logMessage: { level: string; message: string; meta?: unknown; timestamp: string }) => {
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

    // Handle opening external URLs
    ipcMainHandle("open-external", async (_: any, url: string) => {
        try {
            await shell.openExternal(url);
            return { success: true };
        } catch (error) {
            log.error("[IPC] Failed to open external URL", error);
            return { success: false, error: error instanceof Error ? error.message : "Failed to open URL" };
        }
    });

    // Handle session rename
    ipcMainHandle("session.rename", async (_: any, sessionId: string, newTitle: string) => {
        try {
            const success = sessions.renameSession(sessionId, newTitle);
            return { success };
        } catch (error) {
            log.error("[IPC] Failed to rename session", error);
            return { success: false, error: error instanceof Error ? error.message : "Failed to rename session" };
        }
    });

    // Handle get available slash commands
    ipcMainHandle("get-slash-commands", async () => {
        try {
            const { getSlashCommands } = await import("./libs/slash-commands.js");
            const commands = await getSlashCommands();
            return commands;
        } catch (error) {
            log.error("[IPC] Failed to get slash commands", error);
            // 返回内置命令作为回退
            return [
                { name: "/plan", description: "制定实施计划", source: "builtin" },
                { name: "/help", description: "显示帮助信息", source: "builtin" },
                { name: "/bug", description: "报告 Bug", source: "builtin" },
                { name: "/clear", description: "清除屏幕", source: "builtin" },
                { name: "/exit", description: "退出会话", source: "builtin" },
                { name: "/new", description: "新建会话", source: "builtin" },
                { name: "/sessions", description: "会话管理", source: "builtin" },
                { name: "/commit", description: "创建 Git 提交", source: "builtin" },
                { name: "/review", description: "代码审查", source: "builtin" },
                { name: "/test", description: "运行测试", source: "builtin" },
                { name: "/build", description: "构建项目", source: "builtin" },
                { name: "/lint", description: "代码检查", source: "builtin" },
                { name: "/format", description: "代码格式化", source: "builtin" },
                { name: "/plugins", description: "管理插件", source: "builtin" },
                { name: "/mcp", description: "Model Context Protocol 服务器", source: "builtin" },
                { name: "/memory", description: "记忆管理", source: "builtin" },
                { name: "/agents", description: "代理管理", source: "builtin" },
                { name: "/hooks", description: "钩子配置", source: "builtin" },
                { name: "/permissions", description: "权限设置", source: "builtin" },
                { name: "/output", description: "输出样式设置", source: "builtin" },
                { name: "/settings", description: "设置", source: "builtin" },
                { name: "/customize", description: "自定义配置", source: "builtin" },
                { name: "/config", description: "配置管理", source: "builtin" },
                { name: "/env", description: "环境变量", source: "builtin" },
                { name: "/provider", description: "API 提供商", source: "builtin" },
                { name: "/model", description: "模型设置", source: "builtin" },
                { name: "/token", description: "Token 使用情况", source: "builtin" },
            ];
        }
    });

    // MCP 服务器 IPC 处理器
    ipcMainHandle("get-mcp-servers", async () => {
        const { loadMcpServers } = await import("./libs/mcp-store.js");
        return loadMcpServers();
    });

    ipcMainHandle("get-mcp-server-list", async () => {
        const { getMcpServerList } = await import("./libs/mcp-store.js");
        return getMcpServerList();
    });

    ipcMainHandle("save-mcp-server", async (_: any, name: string, config: any) => {
        try {
            const { saveMcpServer } = await import("./libs/mcp-store.js");
            saveMcpServer(name, config);
            return { success: true };
        } catch (error) {
            log.error("[IPC] Failed to save MCP server", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "未知错误"
            };
        }
    });

    ipcMainHandle("delete-mcp-server", async (_: any, name: string) => {
        try {
            const { deleteMcpServer } = await import("./libs/mcp-store.js");
            deleteMcpServer(name);
            return { success: true };
        } catch (error) {
            log.error("[IPC] Failed to delete MCP server", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "未知错误"
            };
        }
    });

    ipcMainHandle("validate-mcp-server", async (_: any, config: any) => {
        const { validateMcpServer } = await import("./libs/mcp-store.js");
        return validateMcpServer(config);
    });

    ipcMainHandle("test-mcp-server", async (_: any, config: any) => {
        try {
            const { testMcpServer } = await import("./libs/mcp-store.js");
            return await testMcpServer(config);
        } catch (error) {
            log.error("[IPC] Failed to test MCP server", error);
            return {
                success: false,
                message: '测试失败',
                details: error instanceof Error ? error.message : String(error),
            };
        }
    });

    ipcMainHandle("get-mcp-templates", async () => {
        const { MCP_TEMPLATES } = await import("./libs/mcp-store.js");
        return MCP_TEMPLATES;
    });

    // Skills 管理 IPC 处理器
    ipcMainHandle("get-skills-list", async () => {
        try {
            const { getSkillsList } = await import("./libs/skills-store.js");
            const skills = await getSkillsList();
            log.info(`[IPC] get-skills-list: Found ${skills.length} skills`);
            // 确保返回的格式匹配类型定义（包含 script 字段）
            return skills.map(s => ({
                name: s.name,
                description: s.description,
                prompt: s.prompt || '',
                script: s.script,
                createdAt: s.createdAt || Date.now(),
                updatedAt: s.updatedAt || Date.now(),
            }));
        } catch (error) {
            log.error("[IPC] Failed to get skills list", error);
            return [];
        }
    });

    ipcMainHandle("create-skill", async (_: any, skillConfig: { name: string; description: string; prompt: string; script?: { type: 'javascript' | 'python'; content?: string; path?: string } }) => {
        try {
            const { createSkill } = await import("./libs/skills-store.js");
            return await createSkill(skillConfig);
        } catch (error) {
            log.error("[IPC] Failed to create skill", error);
            return { success: false, error: error instanceof Error ? error.message : "创建技能失败" };
        }
    });

    ipcMainHandle("delete-skill", async (_: any, skillName: string) => {
        try {
            const { deleteSkill } = await import("./libs/skills-store.js");
            return await deleteSkill(skillName);
        } catch (error) {
            log.error("[IPC] Failed to delete skill", error);
            return { success: false, error: error instanceof Error ? error.message : "删除技能失败" };
        }
    });

    ipcMainHandle("open-skills-directory", async () => {
        try {
            const path = await import("path");
            const os = await import("os");
            const skillsDir = path.join(os.homedir(), ".claude", "skills");
            // 确保目录存在
            const fs = await import("fs");
            if (!fs.existsSync(skillsDir)) {
                fs.mkdirSync(skillsDir, { recursive: true });
            }
            await shell.openPath(skillsDir);
            return { success: true };
        } catch (error) {
            log.error("[IPC] Failed to open skills directory", error);
            return { success: false, error: error instanceof Error ? error.message : "打开目录失败" };
        }
    });

    // 技能元数据管理 IPC 处理器
    ipcMainHandle("get-skill-metadata", async (_: any, skillName: string) => {
        try {
            const { getSkillMetadataWithTags } = await import("./libs/skills-metadata.js");
            return await getSkillMetadataWithTags(skillName);
        } catch (error) {
            log.error("[IPC] Failed to get skill metadata", error);
            return null;
        }
    });

    ipcMainHandle("get-all-skills-metadata", async () => {
        try {
            const { getAllSkillsMetadata } = await import("./libs/skills-metadata.js");
            return await getAllSkillsMetadata();
        } catch (error) {
            log.error("[IPC] Failed to get all skills metadata", error);
            return {};
        }
    });

    ipcMainHandle("set-skill-note", async (_: any, skillName: string, note: string) => {
        try {
            const { setSkillNote } = await import("./libs/skills-metadata.js");
            await setSkillNote(skillName, note);
            return { success: true };
        } catch (error) {
            log.error("[IPC] Failed to set skill note", error);
            return { success: false, error: error instanceof Error ? error.message : "设置备注失败" };
        }
    });

    ipcMainHandle("delete-skill-note", async (_: any, skillName: string) => {
        try {
            const { deleteSkillNote } = await import("./libs/skills-metadata.js");
            await deleteSkillNote(skillName);
            return { success: true };
        } catch (error) {
            log.error("[IPC] Failed to delete skill note", error);
            return { success: false, error: error instanceof Error ? error.message : "删除备注失败" };
        }
    });

    // 标签管理 IPC 处理器
    ipcMainHandle("get-all-tags", async () => {
        try {
            const { getAllTags } = await import("./libs/skills-metadata.js");
            return await getAllTags();
        } catch (error) {
            log.error("[IPC] Failed to get tags", error);
            return [];
        }
    });

    ipcMainHandle("create-tag", async (_: any, name: string, color: string) => {
        try {
            const { createTag } = await import("./libs/skills-metadata.js");
            const tag = await createTag(name, color);
            return { success: true, tag };
        } catch (error) {
            log.error("[IPC] Failed to create tag", error);
            return { success: false, error: error instanceof Error ? error.message : "创建标签失败" };
        }
    });

    ipcMainHandle("delete-tag", async (_: any, tagId: string) => {
        try {
            const { deleteTag } = await import("./libs/skills-metadata.js");
            await deleteTag(tagId);
            return { success: true };
        } catch (error) {
            log.error("[IPC] Failed to delete tag", error);
            return { success: false, error: error instanceof Error ? error.message : "删除标签失败" };
        }
    });

    ipcMainHandle("update-tag", async (_: any, tagId: string, updates: { name?: string; color?: string }) => {
        try {
            const { updateTag } = await import("./libs/skills-metadata.js");
            const tag = await updateTag(tagId, updates);
            return { success: true, tag };
        } catch (error) {
            log.error("[IPC] Failed to update tag", error);
            return { success: false, error: error instanceof Error ? error.message : "更新标签失败" };
        }
    });

    ipcMainHandle("add-tag-to-skill", async (_: any, skillName: string, tagId: string) => {
        try {
            const { addTagToSkill } = await import("./libs/skills-metadata.js");
            await addTagToSkill(skillName, tagId);
            return { success: true };
        } catch (error) {
            log.error("[IPC] Failed to add tag to skill", error);
            return { success: false, error: error instanceof Error ? error.message : "添加标签失败" };
        }
    });

    ipcMainHandle("remove-tag-from-skill", async (_: any, skillName: string, tagId: string) => {
        try {
            const { removeTagFromSkill } = await import("./libs/skills-metadata.js");
            await removeTagFromSkill(skillName, tagId);
            return { success: true };
        } catch (error) {
            log.error("[IPC] Failed to remove tag from skill", error);
            return { success: false, error: error instanceof Error ? error.message : "移除标签失败" };
        }
    });

    ipcMainHandle("open-plugins-directory", async () => {
        try {
            const path = await import("path");
            const os = await import("os");
            const pluginsDir = path.join(os.homedir(), ".claude", "plugins");
            // 确保目录存在
            const fs = await import("fs");
            if (!fs.existsSync(pluginsDir)) {
                fs.mkdirSync(pluginsDir, { recursive: true });
            }
            await shell.openPath(pluginsDir);
            return { success: true };
        } catch (error) {
            log.error("[IPC] Failed to open plugins directory", error);
            return { success: false, error: error instanceof Error ? error.message : "打开目录失败" };
        }
    });

    // Agents 管理 IPC 处理器
    ipcMainHandle("get-agents-list", async () => {
        try {
            const { getAgentsList } = await import("./libs/agents-store.js");
            return await getAgentsList();
        } catch (error) {
            log.error("[IPC] Failed to get agents list", error);
            return [];
        }
    });

    ipcMainHandle("get-agent-detail", async (_: any, agentId: string) => {
        try {
            const { getAgentDetail } = await import("./libs/agents-store.js");
            return await getAgentDetail(agentId);
        } catch (error) {
            log.error("[IPC] Failed to get agent detail", error);
            return null;
        }
    });

    ipcMainHandle("get-global-agent-config", async () => {
        try {
            const { getGlobalConfig } = await import("./libs/agents-store.js");
            return await getGlobalConfig();
        } catch (error) {
            log.error("[IPC] Failed to get global agent config", error);
            return {
                maxSubAgents: 3,
                defaultAgentId: 'general-purpose',
                autoEnableSubAgents: true,
                timeoutSeconds: 300,
            };
        }
    });

    ipcMainHandle("save-global-agent-config", async (_: any, config: any) => {
        try {
            const { saveGlobalConfig } = await import("./libs/agents-store.js");
            await saveGlobalConfig(config);
            return { success: true };
        } catch (error) {
            log.error("[IPC] Failed to save global agent config", error);
            return { success: false, error: error instanceof Error ? error.message : "保存全局配置失败" };
        }
    });

    ipcMainHandle("create-agent", async (_: any, agentConfig: any) => {
        try {
            const { createAgent, validateAgentConfig } = await import("./libs/agents-store.js");
            // 先验证
            const validation = validateAgentConfig(agentConfig);
            if (!validation.valid) {
                return { success: false, error: validation.errors.join(', ') };
            }
            return await createAgent(agentConfig);
        } catch (error) {
            log.error("[IPC] Failed to create agent", error);
            return { success: false, error: error instanceof Error ? error.message : "创建 Agent 失败" };
        }
    });

    ipcMainHandle("update-agent", async (_: any, agentId: string, config: any) => {
        try {
            const { updateAgent, validateAgentConfig } = await import("./libs/agents-store.js");
            // 先验证
            const validation = validateAgentConfig(config);
            if (!validation.valid) {
                return { success: false, error: validation.errors.join(', ') };
            }
            return await updateAgent(agentId, config);
        } catch (error) {
            log.error("[IPC] Failed to update agent", error);
            return { success: false, error: error instanceof Error ? error.message : "更新 Agent 失败" };
        }
    });

    ipcMainHandle("delete-agent", async (_: any, agentId: string) => {
        try {
            const { deleteAgent } = await import("./libs/agents-store.js");
            return await deleteAgent(agentId);
        } catch (error) {
            log.error("[IPC] Failed to delete agent", error);
            return { success: false, error: error instanceof Error ? error.message : "删除 Agent 失败" };
        }
    });

    ipcMainHandle("open-agents-directory", async () => {
        try {
            const { app } = await import("electron");
            const path = await import("path");
            const agentsDir = path.join(app.getPath('userData'), 'agents');
            await shell.openPath(agentsDir);
            return { success: true };
        } catch (error) {
            log.error("[IPC] Failed to open agents directory", error);
            return { success: false, error: error instanceof Error ? error.message : "打开目录失败" };
        }
    });

    // Agent 编排配置 IPC 处理器
    ipcMainHandle("get-orchestration-config", async () => {
        try {
            const { getOrchestrationConfig } = await import("./libs/agents-store.js");
            return await getOrchestrationConfig();
        } catch (error) {
            log.error("[IPC] Failed to get orchestration config", error);
            return {
                mode: 'parallel' as const,
                agentSequence: [],
                maxConcurrency: 3,
                stopOnFailure: true,
                enableAggregation: true,
                aggregationStrategy: 'all' as const,
            };
        }
    });

    ipcMainHandle("save-orchestration-config", async (_: any, config: any) => {
        try {
            const { saveOrchestrationConfig, validateOrchestrationConfig } = await import("./libs/agents-store.js");
            // 先验证
            const validation = validateOrchestrationConfig(config);
            if (!validation.valid) {
                return { success: false, error: validation.errors.join(', ') };
            }
            return await saveOrchestrationConfig(config);
        } catch (error) {
            log.error("[IPC] Failed to save orchestration config", error);
            return { success: false, error: error instanceof Error ? error.message : "保存编排配置失败" };
        }
    });

    ipcMainHandle("validate-orchestration-config", async (_: any, config: any) => {
        try {
            const { validateOrchestrationConfig } = await import("./libs/agents-store.js");
            return validateOrchestrationConfig(config);
        } catch (error) {
            log.error("[IPC] Failed to validate orchestration config", error);
            return { valid: false, errors: [error instanceof Error ? error.message : '验证失败'] };
        }
    });

    ipcMainHandle("get-orchestration-mode-description", async (_: any, mode: string) => {
        try {
            const { getOrchestrationModeDescription } = await import("./libs/agents-store.js");
            return getOrchestrationModeDescription(mode as any);
        } catch (error) {
            log.error("[IPC] Failed to get orchestration mode description", error);
            return '';
        }
    });

    ipcMainHandle("get-aggregation-strategy-description", async (_: any, strategy: string) => {
        try {
            const { getAggregationStrategyDescription } = await import("./libs/agents-store.js");
            return getAggregationStrategyDescription(strategy as any);
        } catch (error) {
            log.error("[IPC] Failed to get aggregation strategy description", error);
            return '';
        }
    });

    // Hooks 管理 IPC 处理器
    ipcMainHandle("get-hooks-config", async () => {
        try {
            const { getHooksConfig } = await import("./libs/hooks-store.js");
            return getHooksConfig();
        } catch (error) {
            log.error("[IPC] Failed to get hooks config", error);
            return { preToolUse: [], postToolUse: [] };
        }
    });

    ipcMainHandle("save-hook", async (_: any, hookConfig: { type: string; hook: string; command: string; description?: string }) => {
        try {
            const { saveHook } = await import("./libs/hooks-store.js");
            return await saveHook(hookConfig as any);
        } catch (error) {
            log.error("[IPC] Failed to save hook", error);
            return { success: false, error: error instanceof Error ? error.message : "保存钩子失败" };
        }
    });

    ipcMainHandle("delete-hook", async (_: any, hookType: string, hookName: string) => {
        try {
            const { deleteHook } = await import("./libs/hooks-store.js");
            return await deleteHook(hookType, hookName);
        } catch (error) {
            log.error("[IPC] Failed to delete hook", error);
            return { success: false, error: error instanceof Error ? error.message : "删除钩子失败" };
        }
    });

    // Permissions 管理 IPC 处理器
    ipcMainHandle("get-permissions-config", async () => {
        try {
            const { getPermissionsConfig } = await import("./libs/permissions-store.js");
            return getPermissionsConfig();
        } catch (error) {
            log.error("[IPC] Failed to get permissions config", error);
            return { allowedTools: [], customRules: [] };
        }
    });

    ipcMainHandle("save-permission-rule", async (_: any, rule: { tool: string; allowed: boolean; description?: string }) => {
        try {
            const { savePermissionRule } = await import("./libs/permissions-store.js");
            return await savePermissionRule(rule);
        } catch (error) {
            log.error("[IPC] Failed to save permission rule", error);
            return { success: false, error: error instanceof Error ? error.message : "保存权限规则失败" };
        }
    });

    ipcMainHandle("delete-permission-rule", async (_: any, toolName: string) => {
        try {
            const { deletePermissionRule } = await import("./libs/permissions-store.js");
            return await deletePermissionRule(toolName);
        } catch (error) {
            log.error("[IPC] Failed to delete permission rule", error);
            return { success: false, error: error instanceof Error ? error.message : "删除权限规则失败" };
        }
    });

    // Output Styles 管理 IPC 处理器
    ipcMainHandle("get-output-config", async () => {
        try {
            const { getOutputConfig } = await import("./libs/output-store.js");
            const config = await getOutputConfig();
            // 确保返回的格式匹配类型定义
            const result = {
                format: config.format,
                theme: config.theme,
                codeHighlight: config.codeHighlight,
                showLineNumbers: config.showLineNumbers,
                fontSize: config.fontSize,
                wrapCode: config.wrapCode,
            };
            return result as any;
        } catch (error) {
            log.error("[IPC] Failed to get output config", error);
            // 返回完整的默认配置
            return {
                format: "markdown",
                theme: "default",
                codeHighlight: true,
                showLineNumbers: false,
                fontSize: "medium",
                wrapCode: false,
            };
        }
    });

    ipcMainHandle("save-output-config", async (_: any, config: any) => {
        try {
            const { saveOutputConfig } = await import("./libs/output-store.js");
            return await saveOutputConfig(config);
        } catch (error) {
            log.error("[IPC] Failed to save output config", error);
            return { success: false, error: error instanceof Error ? error.message : "保存输出配置失败" };
        }
    });

    ipcMainHandle("get-renderer-options", async () => {
        try {
            const { getRendererOptions } = await import("./libs/output-store.js");
            return getRendererOptions();
        } catch (error) {
            log.error("[IPC] Failed to get renderer options", error);
            return [];
        }
    });

    // Memory IPC 处理器（使用双后端系统）
    ipcMainHandle("memory-put-document", async (_: any, input: any) => {
        try {
            const { putDocument } = await import("./libs/memory-tools.js");
            return await putDocument(input);
        } catch (error) {
            log.error("[IPC] Failed to put memory document", error);
            return { success: false, error: error instanceof Error ? error.message : "存储文档失败" };
        }
    });

    ipcMainHandle("memory-put-documents", async (_: any, inputs: any[]) => {
        try {
            // 批量存储 - 逐个处理
            const { putDocument } = await import("./libs/memory-tools.js");
            const results = [];
            for (const input of inputs) {
                const result = await putDocument(input);
                results.push(result);
            }
            const allSuccess = results.every(r => r.success);
            return { success: allSuccess, results };
        } catch (error) {
            log.error("[IPC] Failed to put memory documents", error);
            return { success: false, error: error instanceof Error ? error.message : "批量存储文档失败" };
        }
    });

    ipcMainHandle("memory-find-documents", async (_: any, query: string, options: any = {}) => {
        try {
            const { findDocuments } = await import("./libs/memory-tools.js");
            return await findDocuments(query, options);
        } catch (error) {
            log.error("[IPC] Failed to find memory documents", error);
            return { success: false, error: error instanceof Error ? error.message : "搜索文档失败" };
        }
    });

    ipcMainHandle("memory-ask-question", async (_: any, question: string, options: any = {}) => {
        try {
            const { askQuestion } = await import("./libs/memory-tools.js");
            return await askQuestion(question, options);
        } catch (error) {
            log.error("[IPC] Failed to ask memory question", error);
            return { success: false, error: error instanceof Error ? error.message : "问答查询失败" };
        }
    });

    ipcMainHandle("memory-get-stats", async () => {
        try {
            const { getMemoryStats } = await import("./libs/memory-tools.js");
            return await getMemoryStats();
        } catch (error) {
            log.error("[IPC] Failed to get memory stats", error);
            return { success: false, error: error instanceof Error ? error.message : "获取统计信息失败" };
        }
    });

    ipcMainHandle("memory-get-timeline", async (_: any, options: any = {}) => {
        try {
            const { getMemoryTimeline } = await import("./libs/memory-tools.js");
            return await getMemoryTimeline(options);
        } catch (error) {
            log.error("[IPC] Failed to get memory timeline", error);
            return { success: false, error: error instanceof Error ? error.message : "获取时间线失败" };
        }
    });

    ipcMainHandle("memory-clear", async () => {
        try {
            const { clearAllMemory } = await import("./libs/memory-tools.js");
            return await clearAllMemory();
        } catch (error) {
            log.error("[IPC] Failed to clear memory", error);
            return { success: false, error: error instanceof Error ? error.message : "清空记忆失败" };
        }
    });

    // Memory 单个文档操作 IPC 处理器
    ipcMainHandle("memory-get-document", async (_: any, id: string) => {
        try {
            const { getDocument } = await import("./libs/memory-tools.js");
            return await getDocument(id);
        } catch (error) {
            log.error("[IPC] Failed to get memory document", error);
            return { success: false, error: error instanceof Error ? error.message : "获取文档失败" };
        }
    });

    ipcMainHandle("memory-update-document", async (_: any, id: string, updates: any) => {
        try {
            const { updateDocument } = await import("./libs/memory-tools.js");
            return await updateDocument(id, updates);
        } catch (error) {
            log.error("[IPC] Failed to update memory document", error);
            return { success: false, error: error instanceof Error ? error.message : "更新文档失败" };
        }
    });

    ipcMainHandle("memory-delete-document", async (_: any, id: string) => {
        try {
            const { deleteDocument } = await import("./libs/memory-tools.js");
            return await deleteDocument(id);
        } catch (error) {
            log.error("[IPC] Failed to delete memory document", error);
            return { success: false, error: error instanceof Error ? error.message : "删除文档失败" };
        }
    });

    // Memory 配置 IPC 处理器
    ipcMainHandle("memory-get-config", async () => {
        try {
            const { getMemoryConfig } = await import("./libs/memory-config.js");
            return await getMemoryConfig();
        } catch (error) {
            log.error("[IPC] Failed to get memory config", error);
            return { success: false, error: error instanceof Error ? error.message : "获取配置失败" };
        }
    });

    ipcMainHandle("memory-set-config", async (_: any, config: any) => {
        try {
            const { saveMemoryConfig } = await import("./libs/memory-config.js");
            return await saveMemoryConfig(config);
        } catch (error) {
            log.error("[IPC] Failed to save memory config", error);
            return { success: false, error: error instanceof Error ? error.message : "保存配置失败" };
        }
    });

    ipcMainHandle("memory-import-file", async (_: any, filePath: string) => {
        try {
            // 导入记忆文件（支持 JSON, TXT, MD 等格式）
            const { promises: fs } = await import('fs');
            const { basename } = await import('path');
            const { getMemvidStore } = await import("./libs/memvid-store.js");

            const content = await fs.readFile(filePath, 'utf-8');
            const fileName = basename(filePath);

            // 尝试解析为 JSON
            let documents = [];
            try {
                const jsonData = JSON.parse(content);
                if (Array.isArray(jsonData)) {
                    documents = jsonData;
                } else if (jsonData.documents) {
                    documents = jsonData.documents;
                }
            } catch {
                // 不是 JSON，当作单个文档处理
                documents = [{
                    title: fileName.replace(/\.(json|txt|md)$/i, ''),
                    text: content,
                    label: 'imported'
                }];
            }

            const store = getMemvidStore();
            let count = 0;
            for (const doc of documents) {
                const result = await store.putDocument({
                    title: doc.title || fileName,
                    text: doc.text || content,
                    label: doc.label || 'imported',
                    metadata: { ...doc.metadata, importedAt: new Date().toISOString() }
                });
                if (result.success) count++;
            }

            return { success: true, count };
        } catch (error) {
            log.error("[IPC] Failed to import memory file", error);
            return { success: false, error: error instanceof Error ? error.message : "导入失败" };
        }
    });

    // Rules IPC 处理器
    ipcMainHandle("get-rules-list", async () => {
        try {
            const { getRulesList } = await import("./libs/rules-store.js");
            return await getRulesList();
        } catch (error) {
            log.error("[IPC] Failed to get rules list", error);
            return { success: false, error: error instanceof Error ? error.message : "获取规则列表失败", rules: [] };
        }
    });

    ipcMainHandle("save-rule", async (_: any, rulePath: string, content: string) => {
        try {
            const { saveRule } = await import("./libs/rules-store.js");
            return await saveRule(rulePath, content);
        } catch (error) {
            log.error("[IPC] Failed to save rule", error);
            return { success: false, error: error instanceof Error ? error.message : "保存规则失败" };
        }
    });

    ipcMainHandle("create-rule", async (_: any, name: string, content: string) => {
        try {
            const { createRule } = await import("./libs/rules-store.js");
            return await createRule(name, content);
        } catch (error) {
            log.error("[IPC] Failed to create rule", error);
            return { success: false, error: error instanceof Error ? error.message : "创建规则失败" };
        }
    });

    ipcMainHandle("delete-rule", async (_: any, rulePath: string) => {
        try {
            const { deleteRule } = await import("./libs/rules-store.js");
            return await deleteRule(rulePath);
        } catch (error) {
            log.error("[IPC] Failed to delete rule", error);
            return { success: false, error: error instanceof Error ? error.message : "删除规则失败" };
        }
    });

    // Claude.md 配置 IPC 处理器
    ipcMainHandle("get-claude-config", async () => {
        try {
            const { getClaudeConfig } = await import("./libs/rules-store.js");
            return await getClaudeConfig();
        } catch (error) {
            log.error("[IPC] Failed to get Claude config", error);
            return { success: false, error: error instanceof Error ? error.message : "获取配置失败" };
        }
    });

    ipcMainHandle("save-claude-config", async (_: any, content: string) => {
        try {
            const { saveClaudeConfig } = await import("./libs/rules-store.js");
            return await saveClaudeConfig(content);
        } catch (error) {
            log.error("[IPC] Failed to save Claude config", error);
            return { success: false, error: error instanceof Error ? error.message : "保存配置失败" };
        }
    });

    ipcMainHandle("delete-claude-config", async () => {
        try {
            const { deleteClaudeConfig } = await import("./libs/rules-store.js");
            return await deleteClaudeConfig();
        } catch (error) {
            log.error("[IPC] Failed to delete Claude config", error);
            return { success: false, error: error instanceof Error ? error.message : "删除配置失败" };
        }
    });

    ipcMainHandle("open-claude-directory", async () => {
        try {
            const { openClaudeDirectory } = await import("./libs/rules-store.js");
            return await openClaudeDirectory();
        } catch (error) {
            log.error("[IPC] Failed to open Claude directory", error);
            return { success: false, error: error instanceof Error ? error.message : "打开目录失败" };
        }
    });

    // Session Recovery IPC 处理器（使用现有的 SessionStore）
    ipcMainHandle("get-sessions-list", async () => {
        try {
            // 使用现有的 sessions 对象获取会话列表
            const storedSessions = sessions.listSessions();
            // 转换为简化的会话信息格式
            return storedSessions.map(s => ({
                sessionId: s.id,
                title: s.title,
                cwd: s.cwd,
                updatedAt: s.updatedAt,
                createdAt: s.createdAt,
            }));
        } catch (error) {
            log.error("[IPC] Failed to get sessions list", error);
            return [];
        }
    });

    ipcMainHandle("get-session-history", async (_: any, sessionId: string) => {
        try {
            const history = sessions.getSessionHistory(sessionId);
            if (!history) {
                return null;
            }
            return history;
        } catch (error) {
            log.error("[IPC] Failed to get session history", error);
            return null;
        }
    });

    ipcMainHandle("recover-session", async (_: any, sessionId: string) => {
        try {
            // 检查会话是否存在
            const session = sessions.getSession(sessionId);
            if (!session) {
                return { success: false, error: "会话不存在" };
            }

            log.info(`[IPC] Session recovered: ${sessionId}`);

            // 发送会话列表事件，刷新前端会话列表
            const allSessions = sessions.listSessions();
            mainWindow?.webContents.send("server-event", JSON.stringify({
                type: "session.list",
                payload: { sessions: allSessions }
            }));

            // 发送会话历史事件，加载会话消息
            const history = sessions.getSessionHistory(sessionId);
            if (history) {
                mainWindow?.webContents.send("server-event", JSON.stringify({
                    type: "session.history",
                    payload: {
                        sessionId: history.session.id,
                        status: history.session.status,
                        messages: history.messages
                    }
                }));
            }

            return { success: true, sessionId };
        } catch (error) {
            log.error("[IPC] Failed to recover session", error);
            return { success: false, error: error instanceof Error ? error.message : "恢复会话失败" };
        }
    });

    ipcMainHandle("delete-session", async (_: any, sessionId: string) => {
        try {
            const success = sessions.deleteSession(sessionId);
            if (success) {
                log.info(`[IPC] Session deleted: ${sessionId}`);
                return { success: true };
            }
            return { success: false, error: "会话不存在" };
        } catch (error) {
            log.error("[IPC] Failed to delete session", error);
            return { success: false, error: error instanceof Error ? error.message : "删除会话失败" };
        }
    });
})
