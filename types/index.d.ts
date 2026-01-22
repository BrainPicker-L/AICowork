type Statistics = {
    cpuUsage: number;
    ramUsage: number;
    storageData: number;
}

type StaticData = {
    totalStorage: number;
    cpuModel: string;
    totalMemoryGB: number;
}

type UnsubscribeFunction = () => void;

type ApiProvider =
    | 'anthropic'
    | 'openai'
    | 'azure'
    | 'alibaba'
    | 'baidu'
    | 'zhipu'
    | 'moonshot'
    | 'deepseek'
    | 'groq'
    | 'together'
    | 'gemini'
    | 'custom';

type ApiConfig = {
    id: string;
    name: string;
    apiKey: string;
    baseURL: string;
    model: string;
    apiType?: ApiProvider;
    /** Azure 特定：资源名称 */
    resourceName?: string;
    /** Azure 特定：部署名称 */
    deploymentName?: string;
    /** 自定义请求头 */
    customHeaders?: Record<string, string>;
    /** 高级参数：Temperature (0-2) */
    temperature?: number;
    /** 高级参数：Max Tokens */
    maxTokens?: number;
    /** 高级参数：Top P (0-1) */
    topP?: number;
    isActive?: boolean;
    createdAt?: number;
    updatedAt?: number;
};

type ApiProviderInfo = {
    id: ApiProvider;
    name: string;
    description: string;
    icon?: string;
};

type ProviderConfig = {
    baseURL: string;
    models: string[];
    defaultModel: string;
    description: string;
};

type EventPayloadMapping = {
    statistics: Statistics;
    getStaticData: StaticData;
    "generate-session-title": string;
    "get-recent-cwds": string[];
    "select-directory": string | null;
    "get-api-config": ApiConfig | null;
    "get-api-config-by-id": ApiConfig | null;
    "save-api-config": { success: boolean; error?: string };
    "check-api-config": { hasConfig: boolean; config: ApiConfig | null };
    "validate-api-config": { valid: boolean; errors: string[] };
    "test-api-connection": { success: boolean; message: string; details?: string; responseTime?: number };
    "get-supported-providers": ApiProviderInfo[];
    "get-provider-config": ProviderConfig;
    "get-anthropic-format-urls": Record<string, string>;
    "get-all-preset-urls": Array<{ provider: string; name: string; url: string; description: string }>;
    "send-log": void;
    "open-external": { success: boolean; error?: string };
    "session.rename": { success: boolean; error?: string };
    // MCP 操作
    "test-mcp-server": { success: boolean; message: string; details?: string };
    // Skills 操作
    "get-skills-list": Array<{ name: string; description: string; prompt: string; createdAt: number; updatedAt: number }>;
    "create-skill": { success: boolean; error?: string };
    "delete-skill": { success: boolean; error?: string };
    "open-skills-directory": { success: boolean; error?: string };
    // Agents 操作
    "get-agents-list": Array<{
        id: string;
        name: string;
        description: string;
        type: 'builtin' | 'custom';
        systemPrompt: string;
        maxSubAgents?: number;
        timeoutSeconds?: number;
        allowedTools?: string[];
        allowedMcpServers?: string[];
        enableMemory?: boolean;
        memoryCapacity?: number;
        createdAt?: number;
        updatedAt?: number;
    }>;
    "get-agent-detail": {
        id: string;
        name: string;
        description: string;
        type: 'builtin' | 'custom';
        systemPrompt: string;
        maxSubAgents?: number;
        timeoutSeconds?: number;
        allowedTools?: string[];
        allowedMcpServers?: string[];
        enableMemory?: boolean;
        memoryCapacity?: number;
        createdAt?: number;
        updatedAt?: number;
    } | null;
    "get-global-agent-config": {
        maxSubAgents: number;
        defaultAgentId: string;
        autoEnableSubAgents: boolean;
        timeoutSeconds: number;
    };
    "save-global-agent-config": { success: boolean; error?: string };
    "create-agent": { success: boolean; error?: string };
    "update-agent": { success: boolean; error?: string };
    "delete-agent": { success: boolean; error?: string };
    "open-agents-directory": { success: boolean; error?: string };
    // Agent 编排配置操作
    "get-orchestration-config": {
        mode: 'parallel' | 'sequential' | 'alternating' | 'cyclic';
        agentSequence: string[];
        maxConcurrency?: number;
        cycleCount?: number;
        stopOnFailure?: boolean;
        agentTimeout?: number;
        enableAggregation?: boolean;
        aggregationStrategy?: 'first' | 'all' | 'majority' | 'concatenate';
    };
    "save-orchestration-config": { success: boolean; error?: string };
    "validate-orchestration-config": { valid: boolean; errors: string[] };
    "get-orchestration-mode-description": string;
    "get-aggregation-strategy-description": string;
    // Hooks 操作
    "get-hooks-config": { preToolUse: Array<{ hook: string; command: string; description?: string }>; postToolUse: Array<{ hook: string; command: string; description?: string }> };
    "save-hook": { success: boolean; error?: string };
    "delete-hook": { success: boolean; error?: string };
    // Permissions 操作
    "get-permissions-config": { allowedTools: string[]; customRules: Array<{ tool: string; allowed: boolean; description?: string }> };
    "save-permission-rule": { success: boolean; error?: string };
    "delete-permission-rule": { success: boolean; error?: string };
    // Output 操作
    "get-output-config": { format: 'markdown' | 'plain'; theme: 'default' | 'dark' | 'light'; codeHighlight: boolean; showLineNumbers: boolean; fontSize: 'small' | 'medium' | 'large'; wrapCode: boolean; renderer: 'standard' | 'enhanced' };
    "save-output-config": { success: boolean; error?: string };
    "get-renderer-options": Array<{ value: string; label: string; description: string }>;
    // Session Recovery 操作
    "get-sessions-list": Array<{ sessionId: string; title: string; cwd: string; updatedAt: number; createdAt: number; messageCount?: number }>;
    "get-session-history": any;
    "recover-session": { success: boolean; error?: string; sessionId?: string };
    "delete-session": { success: boolean; error?: string };
}

interface Window {
    electron: {
        subscribeStatistics: (callback: (statistics: Statistics) => void) => UnsubscribeFunction;
        getStaticData: () => Promise<StaticData>;
        // Claude Agent IPC APIs
        sendClientEvent: (event: any) => void;
        onServerEvent: (callback: (event: any) => void) => UnsubscribeFunction;
        generateSessionTitle: (userInput: string | null) => Promise<string>;
        getRecentCwds: (limit?: number) => Promise<string[]>;
        selectDirectory: () => Promise<string | null>;
        getApiConfig: () => Promise<ApiConfig | null>;
        getApiConfigById: (configId: string) => Promise<ApiConfig | null>;
        getAllApiConfigs: () => Promise<{ activeConfigId?: string; configs: ApiConfig[] }>;
        saveApiConfig: (config: ApiConfig) => Promise<{ success: boolean; error?: string }>;
        deleteApiConfig: (configId: string) => Promise<{ success: boolean; error?: string }>;
        setActiveApiConfig: (configId: string) => Promise<{ success: boolean; error?: string }>;
        checkApiConfig: () => Promise<{ hasConfig: boolean; config: ApiConfig | null }>;
        validateApiConfig: (config: ApiConfig) => Promise<{ valid: boolean; errors: string[] }>;
        testApiConnection: (config: ApiConfig) => Promise<{ success: boolean; message: string; details?: string; responseTime?: number }>;
        /** 获取支持的厂商列表 */
        getSupportedProviders: () => Promise<ApiProviderInfo[]>;
        /** 获取厂商配置 */
        getProviderConfig: (provider: string) => Promise<ProviderConfig>;
        /** 获取支持 Anthropic 格式的 URL 列表 */
        getAnthropicFormatUrls: () => Promise<Record<string, string>>;
        /** 获取所有预设 URL 列表 */
        getAllPresetUrls: () => Promise<Array<{ provider: string; name: string; url: string; description: string }>>;
        /** 发送前端日志到主进程 */
        sendLog: (logMessage: { level: string; message: string; meta?: unknown; timestamp: string }) => Promise<void>;
        /** 打开外部链接 */
        openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
        /** 重命名会话 */
        renameSession: (sessionId: string, newTitle: string) => Promise<{ success: boolean; error?: string }>;
        /** 获取可用的斜杠命令和技能列表 */
        getSlashCommands: () => Promise<Array<{ name: string; description: string; source: string; isSlashCommand: boolean }>>;
        /** MCP 服务器操作 */
        getMcpServers: () => Promise<Record<string, {
            name: string;
            displayName?: string;
            type?: 'stdio' | 'sse' | 'streamableHttp';
            command?: string;
            args?: string[];
            env?: Record<string, string>;
            url?: string;
            disabled?: boolean;
            description?: string;
        }>>;
        getMcpServerList: () => Promise<Array<{ name: string; config: {
            name: string;
            displayName?: string;
            type?: 'stdio' | 'sse' | 'streamableHttp';
            command?: string;
            args?: string[];
            env?: Record<string, string>;
            url?: string;
            disabled?: boolean;
            description?: string;
        } }>>;
        saveMcpServer: (name: string, config: {
            name: string;
            displayName?: string;
            type?: 'stdio' | 'sse' | 'streamableHttp';
            command?: string;
            args?: string[];
            env?: Record<string, string>;
            url?: string;
            disabled?: boolean;
            description?: string;
        }) => Promise<{ success: boolean; error?: string }>;
        deleteMcpServer: (name: string) => Promise<{ success: boolean; error?: string }>;
        validateMcpServer: (config: {
            name: string;
            displayName?: string;
            type?: 'stdio' | 'sse' | 'streamableHttp';
            command?: string;
            args?: string[];
            env?: Record<string, string>;
            url?: string;
            disabled?: boolean;
            description?: string;
        }) => Promise<{ valid: boolean; errors: string[] }>;
        testMcpServer: (config: {
            name: string;
            displayName?: string;
            type?: 'stdio' | 'sse' | 'streamableHttp';
            command?: string;
            args?: string[];
            env?: Record<string, string>;
            url?: string;
            disabled?: boolean;
            description?: string;
        }) => Promise<{ success: boolean; message: string; details?: string }>;
        getMcpTemplates: () => Promise<Record<string, {
            name: string;
            displayName?: string;
            type?: 'stdio' | 'sse' | 'streamableHttp';
            command?: string;
            args?: string[];
            env?: Record<string, string>;
            url?: string;
            disabled?: boolean;
            description?: string;
        }>>;
        /** Skills 操作 */
        getSkillsList: () => Promise<Array<{ name: string; description: string; prompt: string; script?: { type: 'javascript' | 'python'; content?: string; path?: string }; createdAt: number; updatedAt: number }>>;
        createSkill: (config: { name: string; description: string; prompt: string; script?: { type: 'javascript' | 'python'; content?: string; path?: string } }) => Promise<{ success: boolean; error?: string }>;
        deleteSkill: (skillName: string) => Promise<{ success: boolean; error?: string }>;
        openSkillsDirectory: () => Promise<{ success: boolean; error?: string }>;
        /** 技能元数据操作 */
        getSkillMetadata: (skillName: string) => Promise<{ metadata: { skillName: string; note?: string; tags: string[]; updatedAt: number } | null; tags: Array<{ id: string; name: string; color: string; createdAt: number }> } | null>;
        getAllSkillsMetadata: () => Promise<Record<string, { metadata: { skillName: string; note?: string; tags: string[]; updatedAt: number }; tags: Array<{ id: string; name: string; color: string; createdAt: number }> }>>;
        setSkillNote: (skillName: string, note: string) => Promise<{ success: boolean; error?: string }>;
        deleteSkillNote: (skillName: string) => Promise<{ success: boolean; error?: string }>;
        /** 标签操作 */
        getAllTags: () => Promise<Array<{ id: string; name: string; color: string; createdAt: number }>>;
        createTag: (name: string, color: string) => Promise<{ success: boolean; tag?: { id: string; name: string; color: string; createdAt: number }; error?: string }>;
        deleteTag: (tagId: string) => Promise<{ success: boolean; error?: string }>;
        updateTag: (tagId: string, updates: { name?: string; color?: string }) => Promise<{ success: boolean; tag?: { id: string; name: string; color: string; createdAt: number }; error?: string }>;
        addTagToSkill: (skillName: string, tagId: string) => Promise<{ success: boolean; error?: string }>;
        removeTagFromSkill: (skillName: string, tagId: string) => Promise<{ success: boolean; error?: string }>;
        /** Plugins 操作 */
        openPluginsDirectory: () => Promise<{ success: boolean; error?: string }>;
        /** Agents 操作 */
        getAgentsList: () => Promise<Array<{
            id: string;
            name: string;
            description: string;
            type: 'builtin' | 'custom';
            systemPrompt: string;
            maxSubAgents?: number;
            timeoutSeconds?: number;
            allowedTools?: string[];
            allowedMcpServers?: string[];
            enableMemory?: boolean;
            memoryCapacity?: number;
            createdAt?: number;
            updatedAt?: number;
        }>>;
        getAgentDetail: (agentId: string) => Promise<{
            id: string;
            name: string;
            description: string;
            type: 'builtin' | 'custom';
            systemPrompt: string;
            maxSubAgents?: number;
            timeoutSeconds?: number;
            allowedTools?: string[];
            allowedMcpServers?: string[];
            enableMemory?: boolean;
            memoryCapacity?: number;
            createdAt?: number;
            updatedAt?: number;
        } | null>;
        getGlobalAgentConfig: () => Promise<{
            maxSubAgents: number;
            defaultAgentId: string;
            autoEnableSubAgents: boolean;
            timeoutSeconds: number;
        }>;
        saveGlobalAgentConfig: (config: {
            maxSubAgents: number;
            defaultAgentId: string;
            autoEnableSubAgents: boolean;
            timeoutSeconds: number;
        }) => Promise<{ success: boolean; error?: string }>;
        createAgent: (config: {
            id: string;
            name: string;
            description: string;
            systemPrompt: string;
            maxSubAgents?: number;
            timeoutSeconds?: number;
            allowedTools?: string[];
            allowedMcpServers?: string[];
            enableMemory?: boolean;
            memoryCapacity?: number;
        }) => Promise<{ success: boolean; error?: string }>;
        updateAgent: (agentId: string, config: {
            name?: string;
            description?: string;
            systemPrompt?: string;
            maxSubAgents?: number;
            timeoutSeconds?: number;
            allowedTools?: string[];
            allowedMcpServers?: string[];
            enableMemory?: boolean;
            memoryCapacity?: number;
        }) => Promise<{ success: boolean; error?: string }>;
        deleteAgent: (agentId: string) => Promise<{ success: boolean; error?: string }>;
        openAgentsDirectory: () => Promise<{ success: boolean; error?: string }>;
        /** Agent 编排配置操作 */
        getOrchestrationConfig: () => Promise<{
            mode: 'parallel' | 'sequential' | 'alternating' | 'cyclic';
            agentSequence: string[];
            maxConcurrency?: number;
            cycleCount?: number;
            stopOnFailure?: boolean;
            agentTimeout?: number;
            enableAggregation?: boolean;
            aggregationStrategy?: 'first' | 'all' | 'majority' | 'concatenate';
        }>;
        saveOrchestrationConfig: (config: {
            mode: 'parallel' | 'sequential' | 'alternating' | 'cyclic';
            agentSequence: string[];
            maxConcurrency?: number;
            cycleCount?: number;
            stopOnFailure?: boolean;
            agentTimeout?: number;
            enableAggregation?: boolean;
            aggregationStrategy?: 'first' | 'all' | 'majority' | 'concatenate';
        }) => Promise<{ success: boolean; error?: string }>;
        validateOrchestrationConfig: (config: {
            mode: 'parallel' | 'sequential' | 'alternating' | 'cyclic';
            agentSequence: string[];
            maxConcurrency?: number;
            cycleCount?: number;
            stopOnFailure?: boolean;
            agentTimeout?: number;
            enableAggregation?: boolean;
            aggregationStrategy?: 'first' | 'all' | 'majority' | 'concatenate';
        }) => Promise<{ valid: boolean; errors: string[] }>;
        getOrchestrationModeDescription: (mode: 'parallel' | 'sequential' | 'alternating' | 'cyclic') => Promise<string>;
        getAggregationStrategyDescription: (strategy: 'first' | 'all' | 'majority' | 'concatenate') => Promise<string>;
        /** Hooks 操作 */
        getHooksConfig: () => Promise<{ preToolUse: Array<{ hook: string; command: string; description?: string }>; postToolUse: Array<{ hook: string; command: string; description?: string }> }>;
        saveHook: (config: { type: string; hook: string; command: string; description?: string }) => Promise<{ success: boolean; error?: string }>;
        deleteHook: (hookType: string, hookName: string) => Promise<{ success: boolean; error?: string }>;
        /** Permissions 操作 */
        getPermissionsConfig: () => Promise<{ allowedTools: string[]; customRules: Array<{ tool: string; allowed: boolean; description?: string }> }>;
        savePermissionRule: (rule: { tool: string; allowed: boolean; description?: string }) => Promise<{ success: boolean; error?: string }>;
        deletePermissionRule: (toolName: string) => Promise<{ success: boolean; error?: string }>;
        /** Output 操作 */
        getOutputConfig: () => Promise<{ format: 'markdown' | 'plain'; theme: 'default' | 'dark' | 'light'; codeHighlight: boolean; showLineNumbers: boolean; fontSize: 'small' | 'medium' | 'large'; wrapCode: boolean; renderer: 'standard' | 'enhanced' }>;
        saveOutputConfig: (config: any) => Promise<{ success: boolean; error?: string }>;
        getRendererOptions: () => Promise<Array<{ value: string; label: string; description: string }>>;
        /** Session Recovery 操作 */
        getSessionsList: () => Promise<Array<{ sessionId: string; title: string; cwd: string; updatedAt: number; createdAt: number; messageCount?: number }>>;
        getSessionHistory: (sessionId: string) => Promise<any>;
        recoverSession: (sessionId: string) => Promise<{ success: boolean; error?: string; sessionId?: string }>;
        deleteSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
        /** Memvid Memory 操作 */
        memoryPutDocument: (input: {
            title: string;
            label?: string;
            text: string;
            metadata?: Record<string, any>;
            uri?: string;
            tags?: string[];
        }) => Promise<{ success: boolean; error?: string; id?: string }>;
        memoryPutDocuments: (inputs: Array<{
            title: string;
            label?: string;
            text: string;
            metadata?: Record<string, any>;
            uri?: string;
            tags?: string[];
        }>) => Promise<{ success: boolean; error?: string; count?: number }>;
        memoryFindDocuments: (query: string, options?: {
            mode?: 'lex' | 'sem' | 'auto';
            k?: number;
        }) => Promise<{
            success: boolean;
            error?: string;
            results?: {
                hits: Array<{ id: string; score: number; doc: any }>;
                query: string;
                mode: string;
            };
        }>;
        memoryAskQuestion: (question: string, options?: {
            k?: number;
            mode?: 'lex' | 'sem' | 'auto';
            contextOnly?: boolean;
        }) => Promise<{ success: boolean; error?: string; answer?: string; context?: string }>;
        memoryGetStats: () => Promise<{
            success: boolean;
            error?: string;
            stats?: {
                frame_count: number;
                size_bytes: number;
                has_lex_index: boolean;
                has_vec_index: boolean;
            };
        }>;
        memoryGetTimeline: (options?: {
            limit?: number;
            since?: number;
            reverse?: boolean;
        }) => Promise<{ success: boolean; error?: string; entries?: any[] }>;
        memoryGetDocument: (id: string) => Promise<{ success: boolean; error?: string; document?: any }>;
        memoryUpdateDocument: (id: string, updates: {
            title?: string;
            text?: string;
            label?: string;
            tags?: string[];
        }) => Promise<{ success: boolean; error?: string }>;
        memoryDeleteDocument: (id: string) => Promise<{ success: boolean; error?: string }>;
        memoryClear: () => Promise<{ success: boolean; error?: string }>;
        /** Memory 配置操作 */
        memoryGetConfig: () => Promise<{
            success: boolean;
            error?: string;
            config?: {
                enabled: boolean;
                autoStore: boolean;
                autoStoreCategories: string[];
                searchMode: string;
                defaultK: number;
                availableTags?: string[];
            };
        }>;
        memorySetConfig: (config: {
            enabled?: boolean;
            autoStore?: boolean;
            autoStoreCategories?: string[];
            searchMode?: string;
            defaultK?: number;
            availableTags?: string[];
        }) => Promise<{ success: boolean; error?: string }>;
        memoryImportFile: (filePath: string) => Promise<{ success: boolean; error?: string; count?: number }>;
        /** Rules 操作 */
        getRulesList: () => Promise<{
            success: boolean;
            error?: string;
            rules: Array<{ name: string; path: string; content: string; language: string; modified: number }>;
        }>;
        saveRule: (rulePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
        createRule: (name: string, content: string) => Promise<{ success: boolean; error?: string; path?: string }>;
        deleteRule: (rulePath: string) => Promise<{ success: boolean; error?: string }>;
        /** Claude.md 配置操作 */
        getClaudeConfig: () => Promise<{
            success: boolean;
            error?: string;
            config?: {
                path: string;
                content: string;
                exists: boolean;
                modified?: number;
            };
        }>;
        saveClaudeConfig: (content: string) => Promise<{ success: boolean; error?: string }>;
        deleteClaudeConfig: () => Promise<{ success: boolean; error?: string }>;
        openClaudeDirectory: () => Promise<{ success: boolean; error?: string }>;
    }
}
