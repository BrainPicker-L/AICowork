import electron from "electron";
import type { ClientEvent, ServerEvent } from "./types.js";
import type { EventPayloadMapping } from "./util.js";

electron.contextBridge.exposeInMainWorld("electron", {
    subscribeStatistics: (callback) =>
        ipcOn("statistics", stats => {
            callback(stats);
        }),
    getStaticData: () => ipcInvoke("getStaticData"),

    // Claude Agent IPC APIs
    sendClientEvent: (event: ClientEvent) => {
        electron.ipcRenderer.send("client-event", event);
    },
    onServerEvent: (callback: (event: ServerEvent) => void) => {
        const cb = (_: Electron.IpcRendererEvent, payload: string) => {
            try {
                const event = JSON.parse(payload);
                callback(event);
            } catch (error) {
                // 静默处理 JSON 解析错误，避免干扰用户
                if (process.env.NODE_ENV === 'development') {
                    console.error("[IPC] Failed to parse server event:", error);
                }
            }
        };
        electron.ipcRenderer.on("server-event", cb);
        return () => electron.ipcRenderer.off("server-event", cb);
    },
    generateSessionTitle: (userInput: string | null) =>
        ipcInvoke("generate-session-title", userInput),
    getRecentCwds: (limit?: number) =>
        ipcInvoke("get-recent-cwds", limit),
    selectDirectory: () =>
        ipcInvoke("select-directory"),
    getApiConfig: () =>
        ipcInvoke("get-api-config"),
    getApiConfigById: (configId: string) =>
        ipcInvoke("get-api-config-by-id", configId),
    getAllApiConfigs: () =>
        ipcInvoke("get-all-api-configs"),
    saveApiConfig: (config: any) =>
        ipcInvoke("save-api-config", config),
    deleteApiConfig: (configId: string) =>
        ipcInvoke("delete-api-config", configId),
    setActiveApiConfig: (configId: string) =>
        ipcInvoke("set-active-api-config", configId),
    checkApiConfig: () =>
        ipcInvoke("check-api-config"),
    validateApiConfig: (config: any) =>
        ipcInvoke("validate-api-config", config),
    testApiConnection: (config: any) =>
        invoke("test-api-connection", config),
    sendLog: (logMessage: { level: string; message: string; meta?: unknown; timestamp: string }) =>
        invoke("send-log", logMessage),
    getSupportedProviders: () =>
        invoke("get-supported-providers"),
    getProviderConfig: (provider: string) =>
        invoke("get-provider-config", provider),
    getAnthropicFormatUrls: () =>
        invoke("get-anthropic-format-urls"),
    getAllPresetUrls: () =>
        invoke("get-all-preset-urls"),
    openExternal: (url: string) =>
        invoke("open-external", url),
    renameSession: (sessionId: string, newTitle: string) =>
        ipcInvoke("session.rename", sessionId, newTitle),
    // MCP 服务器操作
    getMcpServers: () =>
        invoke("get-mcp-servers"),
    getMcpServerList: () =>
        invoke("get-mcp-server-list"),
    saveMcpServer: (name: string, config: any) =>
        invoke("save-mcp-server", name, config),
    deleteMcpServer: (name: string) =>
        invoke("delete-mcp-server", name),
    toggleMcpServerEnabled: (name: string, enabled: boolean) =>
        invoke("toggle-mcp-server-enabled", name, enabled),
    validateMcpServer: (config: any) =>
        invoke("validate-mcp-server", config),
    testMcpServer: (config: any) =>
        invoke("test-mcp-server", config),
    getMcpServerTools: (config: any) =>
        invoke("get-mcp-server-tools", config),
    getMcpTemplates: () =>
        invoke("get-mcp-templates"),
    // Skills 操作
    getSkillsList: () =>
        ipcInvoke("get-skills-list"),
    importSkill: (sourcePath: string) =>
        invoke("import-skill", sourcePath),
    deleteSkill: (skillName: string) =>
        ipcInvoke("delete-skill", skillName),
    openSkillsDirectory: () =>
        ipcInvoke("open-skills-directory"),
    openPluginsDirectory: () =>
        ipcInvoke("open-plugins-directory"),
    // 技能元数据操作
    getSkillMetadata: (skillName: string) =>
        ipcInvoke("get-skill-metadata", skillName),
    getAllSkillsMetadata: () =>
        ipcInvoke("get-all-skills-metadata"),
    // 批量获取技能数据（优化：单次 IPC 调用获取列表、元数据和标签）
    getAllSkillsData: () =>
        invoke("get-all-skills-data"),
    setSkillNote: (skillName: string, note: string) =>
        ipcInvoke("set-skill-note", skillName, note),
    deleteSkillNote: (skillName: string) =>
        ipcInvoke("delete-skill-note", skillName),
    // 标签操作
    getAllTags: () =>
        ipcInvoke("get-all-tags"),
    createTag: (name: string, color: string) =>
        ipcInvoke("create-tag", name, color),
    deleteTag: (tagId: string) =>
        ipcInvoke("delete-tag", tagId),
    updateTag: (tagId: string, updates: { name?: string; color?: string }) =>
        ipcInvoke("update-tag", tagId, updates),
    addTagToSkill: (skillName: string, tagId: string) =>
        ipcInvoke("add-tag-to-skill", skillName, tagId),
    removeTagFromSkill: (skillName: string, tagId: string) =>
        ipcInvoke("remove-tag-from-skill", skillName, tagId),
    // Agents 操作
    getAgentsList: () =>
        ipcInvoke("get-agents-list"),
    getAgentDetail: (agentId: string) =>
        ipcInvoke("get-agent-detail", agentId),
    getGlobalAgentConfig: () =>
        ipcInvoke("get-global-agent-config"),
    saveGlobalAgentConfig: (config: any) =>
        ipcInvoke("save-global-agent-config", config),
    createAgent: (agentConfig: any) =>
        ipcInvoke("create-agent", agentConfig),
    updateAgent: (agentId: string, config: any) =>
        ipcInvoke("update-agent", agentId, config),
    deleteAgent: (agentId: string) =>
        ipcInvoke("delete-agent", agentId),
    getOrchestrationConfig: () =>
        ipcInvoke("get-orchestration-config"),
    saveOrchestrationConfig: (config: any) =>
        ipcInvoke("save-orchestration-config", config),
    // 批量获取 Agent 配置（优化：单次 IPC 调用获取所有配置）
    getAllAgentConfigs: () =>
        invoke("get-all-agent-configs"),
    openAgentsDirectory: () =>
        ipcInvoke("open-agents-directory"),
    // Hooks 操作
    getHooksConfig: () =>
        ipcInvoke("get-hooks-config"),
    saveHook: (config: { type: string; hook: string; command: string; description?: string }) =>
        ipcInvoke("save-hook", config),
    deleteHook: (hookType: string, hookName: string) =>
        ipcInvoke("delete-hook", hookType, hookName),
    // Permissions 操作
    getPermissionsConfig: () =>
        ipcInvoke("get-permissions-config"),
    savePermissionRule: (rule: { tool: string; allowed: boolean; description?: string }) =>
        ipcInvoke("save-permission-rule", rule),
    deletePermissionRule: (toolName: string) =>
        ipcInvoke("delete-permission-rule", toolName),
    // Output 操作
    getOutputConfig: () =>
        ipcInvoke("get-output-config"),
    saveOutputConfig: (config: any) =>
        ipcInvoke("save-output-config", config),
    // Session Recovery 操作
    getSessionsList: () =>
        ipcInvoke("get-sessions-list"),
    getSessionHistory: (sessionId: string) =>
        ipcInvoke("get-session-history", sessionId),
    recoverSession: (sessionId: string) =>
        ipcInvoke("recover-session", sessionId),
    deleteSession: (sessionId: string) =>
        ipcInvoke("delete-session", sessionId),
    // Rules 操作
    getRulesList: () =>
        ipcInvoke("get-rules-list"),
    saveRule: (rulePath: string, content: string) =>
        ipcInvoke("save-rule", rulePath, content),
    createRule: (name: string, content: string) =>
        ipcInvoke("create-rule", name, content),
    deleteRule: (rulePath: string) =>
        ipcInvoke("delete-rule", rulePath),
    // Claude.md 配置操作
    getClaudeConfig: () =>
        ipcInvoke("get-claude-config"),
    saveClaudeConfig: (content: string) =>
        ipcInvoke("save-claude-config", content),
    deleteClaudeConfig: () =>
        ipcInvoke("delete-claude-config"),
    openClaudeDirectory: () =>
        ipcInvoke("open-claude-directory"),
    // Jarvis 配置操作
    exportJarvisConfig: (metadata: any, outputPath: string) =>
        invoke("export-jarvis-config", metadata, outputPath),
    previewJarvisConfig: (jarvisPath: string) =>
        invoke("preview-jarvis-config", jarvisPath),
    importJarvisConfig: (jarvisPath: string, options: any) =>
        invoke("import-jarvis-config", jarvisPath, options),
    saveJarvisDialog: () =>
        invoke("save-jarvis-dialog"),
    openJarvisDialog: () =>
        invoke("open-jarvis-dialog"),
    // 记忆操作
    getMemoryKinds: () =>
        invoke("memory-get-kinds"),
    getMemoryKind: (id: string) =>
        invoke("memory-get-kind", id),
    createMemoryKind: (kind: any) =>
        invoke("memory-create-kind", kind),
    updateMemoryKind: (id: string, patch: any) =>
        invoke("memory-update-kind", id, patch),
    deleteMemoryKind: (id: string) =>
        invoke("memory-delete-kind", id),
    getMemoryEntries: (kindId?: string, options?: { includeDeleted?: boolean }) =>
        invoke("memory-get-entries", kindId, options),
    getMemoryEntry: (id: string) =>
        invoke("memory-get-entry", id),
    createMemoryEntry: (entry: any) =>
        invoke("memory-create-entry", entry),
    updateMemoryEntry: (id: string, patch: any) =>
        invoke("memory-update-entry", id, patch),
    deleteMemoryEntry: (id: string, soft?: boolean) =>
        invoke("memory-delete-entry", id, soft),
    searchMemoryEntries: (params: any) =>
        invoke("memory-search-entries", params),
    // Language Preference 操作
    setLanguagePreference: (language: string) =>
        invoke("language:set-preference", language),
    // Theme Preference 操作
    getTheme: () =>
        invoke("get-theme"),
    setTheme: (theme: string) =>
        invoke("set-theme", theme),
    // DingTalk 操作（多机器人）
    getDingTalkBotList: () =>
        invoke("get-dingtalk-bot-list"),
    getDingTalkBot: (name: string) =>
        invoke("get-dingtalk-bot", name),
    saveDingTalkBot: (name: string, config: any) =>
        invoke("save-dingtalk-bot", name, config),
    deleteDingTalkBot: (name: string) =>
        invoke("delete-dingtalk-bot", name),
    validateDingTalkConfig: (config: any) =>
        invoke("validate-dingtalk-config", config),
    testDingTalkConnection: (config: any) =>
        invoke("test-dingtalk-connection", config),
    getDingTalkStatus: (name?: string) =>
        invoke("get-dingtalk-status", name)
})

function ipcInvoke<Key extends keyof EventPayloadMapping>(key: Key, ...args: any[]): Promise<EventPayloadMapping[Key]> {
    return electron.ipcRenderer.invoke(key, ...args);
}

// 通用的 invoke 函数，用于不在 EventPayloadMapping 中的 API
function invoke(channel: string, ...args: any[]): Promise<any> {
    return electron.ipcRenderer.invoke(channel, ...args);
}

function ipcOn<Key extends keyof EventPayloadMapping>(key: Key, callback: (payload: EventPayloadMapping[Key]) => void) {
    const cb = (_: Electron.IpcRendererEvent, payload: any) => callback(payload)
    electron.ipcRenderer.on(key, cb);
    return () => electron.ipcRenderer.off(key, cb)
}
