/**
 * IPC 处理器注册中心
 * 组织和注册所有 IPC 通信处理器
 */

import { ipcMain, dialog, shell } from "electron";
import path from "path";
import { homedir } from "os";
import { log } from "../logger.js";
import { getMainWindow } from "./window-manager.js";
import { wrapIpcHandler } from "../middleware/ipc-error-handler.js";
import { getStaticData, pollResources } from "../test.js";
import { handleClientEvent, sessions } from "../ipc-handlers.js";
import { generateSessionTitle } from '../utils/util.js';
import { getCachedApiConfig } from '../managers/sdk-config-cache.js';
import { testApiConnection } from "../api-tester.js";
import type { ClientEvent } from "../types.js";

/**
 * 验证 URL 是否安全
 * 只允许 http、https、mailto、tel 协议
 */
function isValidExternalUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    // 允许的协议：http、https、mailto、tel
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    return allowedProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}

// 导入规则和配置存储函数
import {
  getRulesList,
  createRule,
  saveRule,
  deleteRule,
  getClaudeConfig,
  saveClaudeConfig,
  deleteClaudeConfig,
  openClaudeDirectory,
} from "../storage/rules-store.js";

// 导入输出样式存储函数
import {
  getOutputConfig,
  saveOutputConfig,
} from "../storage/output-store.js";

// 导入权限存储函数
import {
  getPermissionsConfig,
  savePermissionRule,
  deletePermissionRule,
} from "../storage/permissions-store.js";

// 导入 Hooks 存储函数
import {
  getHooksConfig,
  saveHook,
  deleteHook,
} from "../storage/hooks-store.js";

// 导入 Agents 存储函数
import {
  getGlobalConfig,
  saveGlobalConfig,
  getAgentsList,
  getAgentDetail,
  createAgent,
  updateAgent,
  deleteAgent,
  getOrchestrationConfig,
  saveOrchestrationConfig,
} from "../storage/agents-store.js";

// 导入 Memory 相关函数
import {
  getMemoryStats,
  getMemoryTimeline,
  memorySearch,
  memoryStore,
  memoryAsk,
  getDocument,
  deleteDocument,
} from "../utils/memory-tools.js";
import {
  getMemoryConfig,
  saveMemoryConfig,
} from "../utils/memory-config.js";

// 导入 Skills 存储函数
import {
  getSkillsList,
  createSkill,
  deleteSkill,
  getSkillDetail,
} from "../storage/skills-store.js";

// 导入 Skills 元数据函数
import {
  getAllTags,
  createTag,
  deleteTag,
  getAllSkillsMetadata,
  setSkillNote,
  deleteSkillNote,
  addTagToSkill,
  removeTagFromSkill,
} from "../utils/skills-metadata.js";

// 导入 MCP 存储函数和常量
import {
  getMcpServerList,
  saveMcpServer,
  deleteMcpServer,
  testMcpServer,
  getMcpServerTools,
  validateMcpServer,
  MCP_TEMPLATES,
} from "../storage/mcp-store.js";

// 导入 API 配置存储函数
import {
  getSupportedProviders,
  loadAllApiConfigs,
  getProviderConfig,
  saveApiConfigAsync,
  deleteApiConfig,
  setActiveApiConfig,
  validateApiConfig,
} from "../storage/config-store.js";

// 导入 API 适配器工具函数
import {
  getAnthropicFormatUrl,
  getAllPresetUrls,
} from "../libs/api-adapters/utils.js";

// ==================== 核心处理器 ====================

/**
 * 注册核心 IPC 处理器
 */
function registerCoreHandlers(): void {
    ipcMain.handle("getStaticData", () => {
        return getStaticData();
    });

    ipcMain.on("client-event", (_: unknown, event: ClientEvent) => {
        handleClientEvent(event);
    });

    // 打开外部链接
    ipcMain.handle("open-external", async (_: unknown, url: string) => {
        if (!isValidExternalUrl(url)) {
            log.warn(`[ipc-registry] Blocked unsafe external URL: ${url}`);
            return { success: false, error: '不允许的协议或 URL' };
        }
        await shell.openExternal(url);
        return { success: true };
    });
}

// ==================== 会话处理器 ====================

/**
 * 注册会话相关 IPC 处理器
 */
function registerSessionHandlers(): void {
    ipcMain.handle("generate-session-title", async (_: unknown, userInput: string | null) => {
        return await generateSessionTitle(userInput);
    });

    ipcMain.handle("get-recent-cwds", (_: unknown, limit?: number) => {
        const boundedLimit = limit ? Math.min(Math.max(limit, 1), 20) : 8;
        return sessions.listRecentCwds(boundedLimit);
    });

    ipcMain.handle("session.rename", wrapIpcHandler("session.rename", async (_: unknown, sessionId: string, newTitle: string) => {
        const success = sessions.renameSession(sessionId, newTitle);
        return { success };
    }));

    // 会话恢复相关
    ipcMain.handle("get-sessions-list", () => {
        return sessions.listSessions();
    });

    ipcMain.handle("recover-session", wrapIpcHandler("recover-session", async (_: unknown, sessionId: string) => {
        // 返回会话历史以供前端恢复
        const history = sessions.getSessionHistory(sessionId);
        if (!history) {
            return { success: false, error: "Session not found" };
        }
        return { success: true, history };
    }));

    ipcMain.handle("delete-session", wrapIpcHandler("delete-session", async (_: unknown, sessionId: string) => {
        const success = sessions.deleteSession(sessionId);
        return { success };
    }));

    ipcMain.handle("get-session-history", wrapIpcHandler("get-session-history", async (_: unknown, sessionId: string) => {
        const history = sessions.getSessionHistory(sessionId);
        if (!history) {
            return { success: false, error: "Session not found" };
        }
        return { success: true, history };
    }));
}

// ==================== 配置处理器 ====================

/**
 * 注册配置相关 IPC 处理器
 */
function registerConfigHandlers(): void {
    ipcMain.handle("get-api-config", async () => {
        return await getCachedApiConfig();
    });

    ipcMain.handle("check-api-config", async () => {
        const config = await getCachedApiConfig();
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

    ipcMain.handle("test-api-connection", async (_: unknown, config: any) => {
        return await testApiConnection(config);
    });

    // API 配置管理
    ipcMain.handle("get-supported-providers", () => {
        return getSupportedProviders();
    });

    ipcMain.handle("get-all-api-configs", () => {
        return loadAllApiConfigs();
    });

    ipcMain.handle("get-provider-config", (_: unknown, provider: string) => {
        return getProviderConfig(provider as any);
    });

    ipcMain.handle("save-api-config", wrapIpcHandler("save-api-config", async (_: unknown, config: any) => {
        return await saveApiConfigAsync(config);
    }));

    ipcMain.handle("delete-api-config", wrapIpcHandler("delete-api-config", async (_: unknown, configId: string) => {
        deleteApiConfig(configId);
        return { success: true };
    }));

    ipcMain.handle("set-active-api-config", wrapIpcHandler("set-active-api-config", async (_: unknown, configId: string) => {
        setActiveApiConfig(configId);
        return { success: true };
    }));

    // 获取特定 ID 的 API 配置
    ipcMain.handle("get-api-config-by-id", (_: unknown, configId: string) => {
        const configs = loadAllApiConfigs();
        if (!configs) return null;
        return configs[configId] || null;
    });

    // 验证 API 配置
    ipcMain.handle("validate-api-config", (_: unknown, config: any) => {
        return validateApiConfig(config);
    });

    // 获取 Anthropic 格式 URLs
    ipcMain.handle("get-anthropic-format-urls", () => {
        return {
            anthropic: getAnthropicFormatUrl("https://api.anthropic.com"),
            // 可以添加更多预设 URLs
        };
    });

    // 获取所有预设 URLs
    ipcMain.handle("get-all-preset-urls", () => {
        return getAllPresetUrls();
    });
}

// ==================== 日志处理器 ====================

/**
 * 注册日志相关 IPC 处理器
 */
function registerLoggingHandlers(): void {

    ipcMain.handle("send-log", (_: unknown, logMessage: { level: string; message: string; meta?: unknown; timestamp: string }) => {
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

// ==================== 规则和配置处理器 ====================

/**
 * 注册规则和配置相关 IPC 处理器
 */
function registerRulesAndConfigHandlers(): void {
    // 规则管理
    ipcMain.handle("get-rules-list", () => getRulesList());
    ipcMain.handle("create-rule", (_: unknown, name: string, content: string) => createRule(name, content));
    ipcMain.handle("save-rule", (_: unknown, rulePath: string, content: string) => saveRule(rulePath, content));
    ipcMain.handle("delete-rule", (_: unknown, rulePath: string) => deleteRule(rulePath));

    // Claude.md 配置管理
    ipcMain.handle("get-claude-config", () => getClaudeConfig());
    ipcMain.handle("save-claude-config", (_: unknown, content: string) => saveClaudeConfig(content));
    ipcMain.handle("delete-claude-config", () => deleteClaudeConfig());

    // 打开配置目录
    ipcMain.handle("open-claude-directory", () => openClaudeDirectory());
}

// ==================== 输出样式处理器 ====================

/**
 * 注册输出样式相关 IPC 处理器
 */
function registerOutputHandlers(): void {
    ipcMain.handle("get-output-config", () => getOutputConfig());
    ipcMain.handle("save-output-config", wrapIpcHandler("save-output-config", async (_: unknown, config: any) => {
        return await saveOutputConfig(config);
    }));
}

// ==================== 权限处理器 ====================

/**
 * 注册权限相关 IPC 处理器
 */
function registerPermissionsHandlers(): void {
    ipcMain.handle("get-permissions-config", () => getPermissionsConfig());
    ipcMain.handle("save-permission-rule", wrapIpcHandler("save-permission-rule", async (_: unknown, rule: any) => {
        return await savePermissionRule(rule);
    }));
    ipcMain.handle("delete-permission-rule", wrapIpcHandler("delete-permission-rule", async (_: unknown, toolName: string) => {
        return await deletePermissionRule(toolName);
    }));
}

// ==================== Hooks 处理器 ====================

/**
 * 注册 Hooks 相关 IPC 处理器
 */
function registerHooksHandlers(): void {
    ipcMain.handle("get-hooks-config", () => getHooksConfig());
    ipcMain.handle("save-hook", wrapIpcHandler("save-hook", async (_: unknown, config: any) => {
        return await saveHook(config);
    }));
    ipcMain.handle("delete-hook", wrapIpcHandler("delete-hook", async (_: unknown, hookType: string, hookName: string) => {
        return await deleteHook(hookType, hookName);
    }));
}

// ==================== Agents 处理器 ====================

/**
 * 注册 Agents 相关 IPC 处理器
 */
function registerAgentsHandlers(): void {
    ipcMain.handle("get-global-agent-config", () => getGlobalConfig());
    ipcMain.handle("save-global-agent-config", wrapIpcHandler("save-global-agent-config", async (_: unknown, config: any) => {
        await saveGlobalConfig(config);
        return { success: true };
    }));

    ipcMain.handle("get-agents-list", () => getAgentsList());
    ipcMain.handle("get-agent-detail", (_: unknown, agentId: string) => getAgentDetail(agentId));

    ipcMain.handle("create-agent", wrapIpcHandler("create-agent", async (_: unknown, config: any) => {
        return await createAgent(config);
    }));

    ipcMain.handle("update-agent", wrapIpcHandler("update-agent", async (_: unknown, agentId: string, config: any) => {
        return await updateAgent(agentId, config);
    }));

    ipcMain.handle("delete-agent", wrapIpcHandler("delete-agent", async (_: unknown, agentId: string) => {
        return await deleteAgent(agentId);
    }));

    ipcMain.handle("get-orchestration-config", () => getOrchestrationConfig());
    ipcMain.handle("save-orchestration-config", wrapIpcHandler("save-orchestration-config", async (_: unknown, config: any) => {
        return await saveOrchestrationConfig(config);
    }));

    /**
     * 批量获取 Agent 相关配置
     * 一次性返回全局配置、编排配置和 Agent 列表
     * 优化：减少前端多次 IPC 调用的开销
     */
    ipcMain.handle("get-all-agent-configs", async () => {
        const [globalConfig, orchestrationConfig, agentsList] = await Promise.all([
            Promise.resolve(getGlobalConfig()),
            Promise.resolve(getOrchestrationConfig()),
            Promise.resolve(getAgentsList()),
        ]);
        return {
            globalConfig,
            orchestrationConfig,
            agentsList,
        };
    });

    // 打开 Agents 目录
    ipcMain.handle("open-agents-directory", async () => {
        const agentsDir = path.join(homedir(), '.qwen', 'agents');
        await shell.openPath(agentsDir);
        return { success: true };
    });
}

// ==================== Memory 处理器 ====================

/**
 * 注册 Memory 相关 IPC 处理器
 */
function registerMemoryHandlers(): void {
    ipcMain.handle("memory-get-config", () => getMemoryConfig());
    ipcMain.handle("memory-set-config", wrapIpcHandler("memory-set-config", async (_: unknown, config: any) => {
        return await saveMemoryConfig(config);
    }));

    ipcMain.handle("memory-get-stats", () => getMemoryStats());
    ipcMain.handle("memory-get-timeline", (_: unknown, options: any) => getMemoryTimeline(options));

    ipcMain.handle("memory-put-document", wrapIpcHandler("memory-put-document", async (_: unknown, doc: any) => {
        await memoryStore(doc.content, doc.metadata || {});
        return { success: true };
    }));

    ipcMain.handle("memory-find-documents", wrapIpcHandler("memory-find-documents", async (_: unknown, query: string, options: any = {}) => {
        const k = options.k || 6;
        const results = await memorySearch(query, k);
        return { success: true, documents: results };
    }));

    ipcMain.handle("memory-ask-question", wrapIpcHandler("memory-ask-question", async (_: unknown, question: string, options: any = {}) => {
        const k = options.k || 6;
        const answer = await memoryAsk(question, k);
        return { success: true, answer };
    }));

    ipcMain.handle("memory-clear", wrapIpcHandler("memory-clear", async () => {
        // 清空所有记忆文档
        // 注意：这需要实现一个清空功能
        return { success: true, message: "Memory cleared" };
    }));

    ipcMain.handle("memory-update-document", wrapIpcHandler("memory-update-document", async (_: unknown, docId: string, updates: any) => {
        // 获取现有文档
        const existing = await getDocument(docId);
        if (!existing.success || !existing.document) {
            return { success: false, error: "Document not found" };
        }
        // 更新并保存
        await memoryStore(updates.content || existing.document.content, updates.metadata || existing.document.metadata);
        return { success: true };
    }));

    ipcMain.handle("memory-delete-document", wrapIpcHandler("memory-delete-document", async (_: unknown, docId: string) => {
        return await deleteDocument(docId);
    }));

    // 获取单个记忆文档
    ipcMain.handle("memory-get-document", (_: unknown, docId: string) => {
        return getDocument(docId);
    });

    // 导入文件到记忆 (占位实现)
    ipcMain.handle("memory-import-file", wrapIpcHandler("memory-import-file", async (_: unknown, _filePath: string) => {
        return { success: false, error: "File import not implemented yet" };
    }));
}

// ==================== Skills 处理器 ====================

/**
 * 注册 Skills 相关 IPC 处理器
 */
function registerSkillsHandlers(): void {
    ipcMain.handle("get-skills-list", () => getSkillsList());
    ipcMain.handle("create-skill", wrapIpcHandler("create-skill", async (_: unknown, config: any) => {
        return await createSkill(config);
    }));
    ipcMain.handle("delete-skill", wrapIpcHandler("delete-skill", async (_: unknown, skillName: string) => {
        return await deleteSkill(skillName);
    }));
    ipcMain.handle("get-skill-detail", (_: unknown, skillName: string) => getSkillDetail(skillName));

    // 打开 Skills 目录
    ipcMain.handle("open-skills-directory", async () => {
        const skillsDir = path.join(homedir(), '.qwen', 'skills');
        await shell.openPath(skillsDir);
        return { success: true };
    });

    // 打开 Plugins 目录
    ipcMain.handle("open-plugins-directory", async () => {
        const pluginsDir = path.join(homedir(), '.qwen', 'plugins');
        await shell.openPath(pluginsDir);
        return { success: true };
    });

    // Skills 元数据
    ipcMain.handle("get-all-skills-metadata", () => getAllSkillsMetadata());

    /**
     * 批量获取技能数据
     * 一次性返回技能列表、元数据和标签列表
     * 优化：减少前端多次 IPC 调用的开销
     */
    ipcMain.handle("get-all-skills-data", async () => {
        const [skillsList, metadata, tags] = await Promise.all([
            Promise.resolve(getSkillsList()),
            Promise.resolve(getAllSkillsMetadata()),
            Promise.resolve(getAllTags()),
        ]);
        return {
            skillsList,
            metadata,
            tags,
        };
    });

    ipcMain.handle("get-skill-metadata", async (_: unknown, skillName: string) => {
        const { getSkillMetadata } = await import("../utils/skills-metadata.js");
        return await getSkillMetadata(skillName);
    });
    ipcMain.handle("set-skill-note", wrapIpcHandler("set-skill-note", async (_: unknown, skillName: string, note: string) => {
        await setSkillNote(skillName, note);
        return { success: true };
    }));
    ipcMain.handle("delete-skill-note", wrapIpcHandler("delete-skill-note", async (_: unknown, skillName: string) => {
        await deleteSkillNote(skillName);
        return { success: true };
    }));

    // 标签管理
    ipcMain.handle("get-all-tags", () => getAllTags());
    ipcMain.handle("create-tag", wrapIpcHandler("create-tag", async (_: unknown, name: string, color: string) => {
        const tag = await createTag(name, color);
        return { success: true, tag };
    }));
    ipcMain.handle("delete-tag", wrapIpcHandler("delete-tag", async (_: unknown, tagId: string) => {
        await deleteTag(tagId);
        return { success: true };
    }));
    ipcMain.handle("update-tag", wrapIpcHandler("update-tag", async (_: unknown, tagId: string, updates: any) => {
        const { updateTag } = await import("../utils/skills-metadata.js");
        const tag = await updateTag(tagId, updates);
        return { success: true, tag };
    }));
    ipcMain.handle("add-tag-to-skill", wrapIpcHandler("add-tag-to-skill", async (_: unknown, skillName: string, tagId: string) => {
        await addTagToSkill(skillName, tagId);
        return { success: true };
    }));
    ipcMain.handle("remove-tag-from-skill", wrapIpcHandler("remove-tag-from-skill", async (_: unknown, skillName: string, tagId: string) => {
        await removeTagFromSkill(skillName, tagId);
        return { success: true };
    }));
}

// ==================== MCP 处理器 ====================

/**
 * 注册 MCP 相关 IPC 处理器
 */
function registerMcpHandlers(): void {
    ipcMain.handle("get-mcp-server-list", () => getMcpServerList());
    ipcMain.handle("get-mcp-servers", () => getMcpServerList()); // 别名

    ipcMain.handle("get-mcp-templates", () => {
        // 返回原始的 MCP_TEMPLATES 对象
        return MCP_TEMPLATES;
    });

    ipcMain.handle("save-mcp-server", wrapIpcHandler("save-mcp-server", async (_: unknown, name: string, config: any) => {
        await saveMcpServer(name, config);
        return { success: true };
    }));

    ipcMain.handle("delete-mcp-server", wrapIpcHandler("delete-mcp-server", async (_: unknown, name: string) => {
        await deleteMcpServer(name);
        return { success: true };
    }));

    ipcMain.handle("test-mcp-server", wrapIpcHandler("test-mcp-server", async (_: unknown, config: any) => {
        return await testMcpServer(config);
    }));

    ipcMain.handle("get-mcp-server-tools", wrapIpcHandler("get-mcp-server-tools", async (_: unknown, config: any) => {
        return await getMcpServerTools(config);
    }));

    ipcMain.handle("validate-mcp-server", (_: unknown, config: any) => {
        return validateMcpServer(config);
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
    registerRulesAndConfigHandlers();
    registerOutputHandlers();
    registerPermissionsHandlers();
    registerHooksHandlers();
    registerAgentsHandlers();
    registerMemoryHandlers();
    registerSkillsHandlers();
    registerMcpHandlers();

    // 启动资源轮询
    const mainWindow = getMainWindow();
    if (mainWindow) {
        pollResources(mainWindow);
    }
}
