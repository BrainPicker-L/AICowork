import { ipcMain, WebContents, WebFrameMain } from "electron";
import { log } from "./logger.js";

export const DEV_PORT = 5173;

/**
 * IPC 通道类型映射
 * 定义所有 IPC 通道的名称和负载类型
 */
export interface EventPayloadMapping {
    // 统计信息
    "statistics": any;
    // 静态数据
    "getStaticData": any;
    // 客户端事件
    "sendClientEvent": any;
    // 服务器事件（单向）
    "server-event": string;
    // 会话标题生成
    "generate-session-title": string;
    // 最近工作目录
    "get-recent-cwds": string[];
    // 目录选择
    "select-directory": string | null;
    // API 配置
    "get-api-config": any | null;
    "get-api-config-by-id": any | null;
    "get-all-api-configs": { activeConfigId?: string; configs: any[] };
    "check-api-config": { hasConfig: boolean; config: any | null };
    "save-api-config": { success: boolean; error?: string };
    "delete-api-config": { success: boolean; error?: string };
    "set-active-api-config": { success: boolean; error?: string };
    "validate-api-config": { valid: boolean; errors: string[] };
    // 厂商信息
    "get-supported-providers": Array<{ id: string; name: string; description: string; icon?: string }>;
    "get-provider-config": { baseURL: string; models: string[]; defaultModel: string; description: string };
    "get-anthropic-format-urls": Record<string, string>;
    "get-all-preset-urls": Array<{ provider: string; name: string; url: string; description: string }>;
    // API 连接测试
    "test-api-connection": { success: boolean; message: string; details?: string; responseTime?: number };
    // 日志
    "send-log": void;
    // 打开外部链接
    "open-external": { success: boolean; error?: string };
    // 会话重命名
    "session.rename": { success: boolean; error?: string };
    // 斜杠命令
    "get-slash-commands": Array<{ name: string; description: string; source: string }>;
    // Skills 操作
    "get-skills-list": Array<{ name: string; description: string; prompt: string; script?: { type: 'javascript' | 'python' }; createdAt: number; updatedAt: number }>;
    "create-skill": { success: boolean; error?: string };
    "delete-skill": { success: boolean; error?: string };
    "open-skills-directory": { success: boolean; error?: string };
    // 技能元数据操作
    "get-skill-metadata": { metadata: { skillName: string; note?: string; tags: string[]; updatedAt: number } | null; tags: Array<{ id: string; name: string; color: string; createdAt: number }> } | null;
    "get-all-skills-metadata": Record<string, { metadata: { skillName: string; note?: string; tags: string[]; updatedAt: number }; tags: Array<{ id: string; name: string; color: string; createdAt: number }> }>;
    "set-skill-note": { success: boolean; error?: string };
    "delete-skill-note": { success: boolean; error?: string };
    // 标签操作
    "get-all-tags": Array<{ id: string; name: string; color: string; createdAt: number }>;
    "create-tag": { success: boolean; tag?: { id: string; name: string; color: string; createdAt: number }; error?: string };
    "delete-tag": { success: boolean; error?: string };
    "update-tag": { success: boolean; tag?: { id: string; name: string; color: string; createdAt: number }; error?: string };
    "add-tag-to-skill": { success: boolean; error?: string };
    "remove-tag-from-skill": { success: boolean; error?: string };
    // Plugins 操作
    "open-plugins-directory": { success: boolean; error?: string };
    // Hooks 操作
    "get-hooks-config": { preToolUse: Array<{ hook: string; command: string; description?: string }>; postToolUse: Array<{ hook: string; command: string; description?: string }> };
    "save-hook": { success: boolean; error?: string };
    "delete-hook": { success: boolean; error?: string };
    // Permissions 操作
    "get-permissions-config": { allowedTools: string[]; customRules: Array<{ tool: string; allowed: boolean; description?: string }> };
    "save-permission-rule": { success: boolean; error?: string };
    "delete-permission-rule": { success: boolean; error?: string };
    // Output 操作
    "get-output-config": { format: 'markdown' | 'plain'; theme: 'default' | 'dark' | 'light'; codeHighlight: boolean; showLineNumbers: boolean; fontSize: 'small' | 'medium' | 'large'; wrapCode: boolean };
    "save-output-config": { success: boolean; error?: string };
    // Session Recovery 操作
    "get-sessions-list": Array<{ sessionId: string; title: string; cwd: string; updatedAt: number; createdAt: number; messageCount?: number }>;
    "get-session-history": any;
    "recover-session": { success: boolean; error?: string; sessionId?: string };
    "delete-session": { success: boolean; error?: string };
    // MCP 服务器操作
    "get-mcp-servers": Record<string, {
        name: string;
        displayName?: string;
        type?: 'stdio' | 'sse' | 'streamableHttp';
        command?: string;
        args?: string[];
        env?: Record<string, string>;
        url?: string;
        disabled?: boolean;
        description?: string;
    }>;
    "get-mcp-server-list": Array<{ name: string; config: {
        name: string;
        displayName?: string;
        type?: 'stdio' | 'sse' | 'streamableHttp';
        command?: string;
        args?: string[];
        env?: Record<string, string>;
        url?: string;
        disabled?: boolean;
        description?: string;
    } }>;
    "save-mcp-server": { success: boolean; error?: string };
    "delete-mcp-server": { success: boolean; error?: string };
    "validate-mcp-server": { valid: boolean; errors: string[] };
    "get-mcp-templates": Record<string, {
        name: string;
        displayName?: string;
        type?: 'stdio' | 'sse' | 'streamableHttp';
        command?: string;
        args?: string[];
        env?: Record<string, string>;
        url?: string;
        disabled?: boolean;
        description?: string;
    }>;
    // MCP 测试
    "test-mcp-server": { success: boolean; message: string; details?: string };
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
    // Output 渲染器选项
    "get-renderer-options": Array<{ value: string; label: string; description: string }>;
    // Memory/Memvid 操作
    "memory-put-document": { success: boolean; error?: string; id?: string };
    "memory-put-documents": { success: boolean; error?: string; count?: number };
    "memory-find-documents": { success: boolean; error?: string; results?: { hits: Array<{ id: string; score: number; doc: any }>; query: string; mode: string } };
    "memory-ask-question": { success: boolean; error?: string; answer?: string; context?: string };
    "memory-get-stats": { success: boolean; error?: string; stats?: { frame_count: number; size_bytes: number; has_lex_index: boolean; has_vec_index: boolean } };
    "memory-get-timeline": { success: boolean; error?: string; entries?: any[] };
    "memory-get-document": { success: boolean; error?: string; document?: any };
    "memory-update-document": { success: boolean; error?: string };
    "memory-delete-document": { success: boolean; error?: string };
    "memory-clear": { success: boolean; error?: string };
    "memory-get-config": { success: boolean; error?: string; config?: { enabled: boolean; autoStore: boolean; autoStoreCategories: string[]; searchMode: string; defaultK: number } };
    "memory-set-config": { success: boolean; error?: string };
    "memory-import-file": { success: boolean; error?: string; count?: number };
    // Rules 操作
    "get-rules-list": { success: boolean; error?: string; rules: Array<{ name: string; path: string; content: string; language: string; modified: number }> };
    "save-rule": { success: boolean; error?: string };
    "create-rule": { success: boolean; error?: string; path?: string };
    "delete-rule": { success: boolean; error?: string };
    // Claude.md 配置操作
    "get-claude-config": { success: boolean; error?: string; config?: { path: string; content: string; exists: boolean; modified?: number } };
    "save-claude-config": { success: boolean; error?: string };
    "delete-claude-config": { success: boolean; error?: string };
    "open-claude-directory": { success: boolean; error?: string };
}

// Checks if you are in development mode
export function isDev(): boolean {
    return process.env.NODE_ENV == "development";
}

// Making IPC Typesafe
export function ipcMainHandle<Key extends keyof EventPayloadMapping>(key: Key, handler: (...args: any[]) => EventPayloadMapping[Key] | Promise<EventPayloadMapping[Key]>) {
    ipcMain.handle(key, (event, ...args) => {
        if (event.senderFrame) validateEventFrame(event.senderFrame);

        return handler(event, ...args)
    });
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(key: Key, webContents: WebContents, payload: EventPayloadMapping[Key]) {
    webContents.send(key, payload);
}

/**
 * 验证 IPC 事件来源的合法性
 * 使用路径片段匹配，避免 .asar 文件和中文路径的编码问题
 */
export function validateEventFrame(frame: WebFrameMain): void {
    try {
        const frameUrl = frame.url;
        log.info(`[IPC Security] Checking: ${frameUrl}`);

        // 开发环境：检查是否来自本地开发服务器
        if (isDev()) {
            try {
                const url = new URL(frameUrl);
                if (url.host === `localhost:${DEV_PORT}`) {
                    log.info(`[IPC Security] Dev mode: allowed`);
                    return;
                }
            } catch {
                // URL 解析失败，继续下面的检查
            }
        }

        // 生产环境：验证是否来自合法的本地文件
        const url = new URL(frameUrl);

        // 必须是 file:// 协议
        if (url.protocol !== 'file:') {
            log.warn(`[IPC Security] BLOCKED: not file:// (${url.protocol})`);
            throw new Error("Malicious event");
        }

        // 检查路径是否包含预期的关键片段
        const pathname = decodeURIComponent(url.pathname);

        // 检查是否包含 dist-react/index.html（应用入口文件）
        if (!pathname.includes('dist-react') || !pathname.includes('index.html')) {
            log.warn(`[IPC Security] BLOCKED: invalid path (${pathname})`);
            throw new Error("Malicious event");
        }

        log.info(`[IPC Security] ALLOWED: ${pathname}`);
    } catch (error) {
        if (error instanceof Error && error.message === "Malicious event") {
            throw error;
        }
        log.error(`[IPC Security] ERROR:`, error);
        throw new Error("Malicious event");
    }
}
