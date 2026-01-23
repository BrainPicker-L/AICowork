/**
 * Runner 模块主入口
 * 负责协调 Claude SDK 会话的执行
 */

import { query, type SDKMessage, type PermissionResult } from "@anthropic-ai/claude-agent-sdk";
import type { ServerEvent } from "../../types.js";
import type { RunnerOptions, RunnerHandle, MemoryConfig } from "./types.js";
import type { Session } from "../../storage/session-store.js";
import type { SdkNativeConfig } from "../../utils/sdk-native-loader.js";

import {
  getCurrentApiConfig,
  buildEnvForConfig,
  buildEnvForConfigWithProxy,
  checkProxyNeeded,
  getClaudeCodePath
} from "../../services/claude-settings.js";
import { getEnhancedEnv } from "../../utils/util.js";
import { addLanguagePreference } from "../../utils/language-detector.js";
import { transformSlashCommand } from "../../services/slash-commands.js";
import { getMemoryToolConfig } from "../../utils/memory-tools.js";
import { getCachedSdkNativeConfig } from "../../managers/sdk-config-cache.js";

import { PerformanceMonitor } from "./performance-monitor.js";
import { getMemoryGuidancePrompt, triggerAutoMemoryAnalysis } from "./memory-manager.js";
import { createPermissionHandler, handleToolUseEvent } from "./permission-handler.js";

const DEFAULT_CWD = process.cwd();

// ========== 全局缓存 - 跨会话复用 ==========

/**
 * 清除全局缓存（在配置更改时调用）
 * 注意：这会关闭所有缓存的 MCP 服务器
 */
export function clearRunnerCache(): void {
  // 使用 MCP 服务器管理器清除缓存
  const { clearMcpServerCache } = require("../mcp-server-manager.js");
  clearMcpServerCache();

  // 清除记忆提示缓存
  const { clearMemoryGuidanceCache } = require("./memory-manager.js");
  clearMemoryGuidanceCache();
}

// 重新导出类型
export type { RunnerOptions, RunnerHandle, MemoryConfig } from "./types.js";
export { PerformanceMonitor } from "./performance-monitor.js";
export { triggerAutoMemoryAnalysis, getMemoryGuidancePrompt } from "./memory-manager.js";

/**
 * 执行 Claude SDK 会话
 *
 * @param options - 运行选项
 * @returns 可中止的运行句柄
 */
export async function runClaude(options: RunnerOptions): Promise<RunnerHandle> {
  const { prompt, session, resumeSessionId, onEvent, onSessionUpdate } = options;
  const abortController = new AbortController();

  // 开始性能监控
  const perfMonitor = new PerformanceMonitor();
  perfMonitor.start();

  const sendMessage = (message: SDKMessage) => {
    onEvent({
      type: "stream.message",
      payload: { sessionId: session.id, message }
    });
  };

  const sendPermissionRequest = (toolUseId: string, toolName: string, input: unknown) => {
    onEvent({
      type: "permission.request",
      payload: { sessionId: session.id, toolUseId, toolName, input }
    });
  };

  // Start the query in the background
  (async () => {
    try {
      // 1. 获取并验证 API 配置
      const config = getCurrentApiConfig();

      if (!config) {
        onEvent({
          type: "session.status",
          payload: { sessionId: session.id, status: "error", title: session.title, cwd: session.cwd, error: "API configuration not found. Please configure API settings." }
        });
        return;
      }

      // 2. 检测代理需求并构建环境变量
      perfMonitor.mark('Proxy Detection');
      const needsProxy = await checkProxyNeeded(config);
      const env = needsProxy
        ? buildEnvForConfigWithProxy(config)
        : buildEnvForConfig(config);
      perfMonitor.measure('Proxy Detection');

      const mergedEnv = {
        ...getEnhancedEnv(),
        ...env
      };

      // 3. 处理提示词转换（语言偏好 + 斜杠命令）
      const enhancedPrompt = addLanguagePreference(prompt);
      const languageHint = enhancedPrompt !== prompt ? enhancedPrompt.split('\n\n')[0] : undefined;
      const transformedPrompt = transformSlashCommand(prompt);

      // 4. 获取记忆配置并发送初始状态
      const memConfig = getMemoryToolConfig() as MemoryConfig & { autoStore: boolean };
      if (memConfig.enabled) {
        onEvent({
          type: "memory.status",
          payload: {
            sessionId: session.id,
            stored: false,
            message: memConfig.autoStore ? "会话结束后自动分析" : "记忆功能已启用"
          }
        });
      }

      // 5. 加载 SDK 原生配置（使用缓存）
      perfMonitor.mark('SDK Config Loading');
      const { log } = await import("../../logger.js");
      const sdkNativeConfig: SdkNativeConfig = await getCachedSdkNativeConfig();
      log.info(`[Runner] SDK native config loaded: plugins=${sdkNativeConfig.plugins?.length || 0}, agents=${Object.keys(sdkNativeConfig.agents || {}).length}`);
      perfMonitor.measure('SDK Config Loading');

      // 6. 获取 MCP 服务器（使用管理器实例池）
      perfMonitor.mark('MCP Server Acquisition');
      const { getMcpServerManager } = await import("../../managers/mcp-server-manager.js");
      const mcpManager = getMcpServerManager();
      const mcpServers = await mcpManager.acquireServers();
      perfMonitor.measure('MCP Server Acquisition');

      // 7. 构建记忆指南系统提示（使用缓存）
      const memoryGuidancePrompt = memConfig.enabled ? getMemoryGuidancePrompt() : undefined;

      // 8. 合并系统提示（语言提示 + 记忆指南）
      const combinedSystemPrompt = memoryGuidancePrompt
        ? `${memoryGuidancePrompt}\n${languageHint || ''}`.trim()
        : languageHint;

      // 9. 确定权限模式
      const hasExplicitPermissions = (sdkNativeConfig.allowedTools && sdkNativeConfig.allowedTools.length > 0) ||
                                     (sdkNativeConfig.disallowedTools && sdkNativeConfig.disallowedTools.length > 0);
      const permissionMode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'delegate' | 'dontAsk' =
        hasExplicitPermissions ? "default" : "acceptEdits";

      log.info(`[Runner] Permission mode: ${permissionMode}, hasExplicitPermissions: ${hasExplicitPermissions}`);

      // 10. 记录会话启动完成
      perfMonitor.measureTotal();

      // 11. 创建并执行查询
      const q = query({
        prompt: transformedPrompt,
        options: {
          cwd: session.cwd ?? DEFAULT_CWD,
          resume: resumeSessionId,
          abortController,
          env: mergedEnv,
          pathToClaudeCodeExecutable: getClaudeCodePath(),
          permissionMode,
          includePartialMessages: true,
          // 系统提示
          ...(combinedSystemPrompt ? { extraArgs: { 'append-system-prompt': combinedSystemPrompt } } : {}),
          // MCP 服务器
          ...(Object.keys(mcpServers).length > 0 ? { mcpServers } : {}),
          // SDK 原生配置
          ...(sdkNativeConfig.plugins && sdkNativeConfig.plugins.length > 0 ? { plugins: sdkNativeConfig.plugins } : {}),
          ...(sdkNativeConfig.agents && Object.keys(sdkNativeConfig.agents).length > 0 ? { agents: sdkNativeConfig.agents } : {}),
          ...(sdkNativeConfig.agent ? { agent: sdkNativeConfig.agent } : {}),
          ...(sdkNativeConfig.allowedTools && sdkNativeConfig.allowedTools.length > 0 ? { allowedTools: sdkNativeConfig.allowedTools } : {}),
          ...(sdkNativeConfig.disallowedTools && sdkNativeConfig.disallowedTools.length > 0 ? { disallowedTools: sdkNativeConfig.disallowedTools } : {}),
          ...(sdkNativeConfig.hooks && Object.keys(sdkNativeConfig.hooks).length > 0 ? { hooks: sdkNativeConfig.hooks } : {}),
          ...(sdkNativeConfig.maxTurns ? { maxTurns: sdkNativeConfig.maxTurns } : {}),
          ...(sdkNativeConfig.maxBudgetUsd ? { maxBudgetUsd: sdkNativeConfig.maxBudgetUsd } : {}),
          ...(sdkNativeConfig.persistSession !== undefined ? { persistSession: sdkNativeConfig.persistSession } : {}),
          ...(sdkNativeConfig.enableFileCheckpointing !== undefined ? { enableFileCheckpointing: sdkNativeConfig.enableFileCheckpointing } : {}),
          // 权限处理
          canUseTool: createPermissionHandler(session, sendPermissionRequest)
        }
      });

      // 12. 处理消息流
      for await (const message of q) {
        // 提取 session_id
        if (message.type === "system" && "subtype" in message && message.subtype === "init") {
          const sdkSessionId = message.session_id;
          if (sdkSessionId) {
            session.claudeSessionId = sdkSessionId;
            onSessionUpdate?.({ claudeSessionId: sdkSessionId });
          }
        }

        // 处理工具使用事件
        if (message.type === "assistant") {
          const assistantMsg = message as any;
          if (assistantMsg.message && assistantMsg.message.content) {
            for (const content of assistantMsg.message.content) {
              if (content.type === "tool_use") {
                await handleToolUseEvent(content.name, content.input, memConfig, session, onEvent);
              }
            }
          }
        }

        // 发送消息到前端
        sendMessage(message);

        // 检查结果以更新会话状态
        if (message.type === "result") {
          const status = message.subtype === "success" ? "completed" : "error";
          onEvent({
            type: "session.status",
            payload: { sessionId: session.id, status, title: session.title }
          });
        }
      }

      // 13. 查询正常完成 - 触发自动记忆分析
      if (session.status === "running") {
        if (memConfig.enabled && memConfig.autoStore) {
          await triggerAutoMemoryAnalysis(session, transformedPrompt, memConfig, onEvent);
        }

        onEvent({
          type: "session.status",
          payload: { sessionId: session.id, status: "completed", title: session.title }
        });
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        // 会话被中止，不视为错误
        return;
      }
      onEvent({
        type: "session.status",
        payload: { sessionId: session.id, status: "error", title: session.title, error: String(error) }
      });
    }
  })();

  return {
    abort: () => abortController.abort()
  };
}
