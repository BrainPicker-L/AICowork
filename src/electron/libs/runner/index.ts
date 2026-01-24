/**
 * Runner 模块主入口
 * 负责协调 Claude SDK 会话的执行
 */

import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import type { RunnerOptions, RunnerHandle, MemoryConfig } from "./types.js";

import {
  buildEnvForConfig,
  getClaudeCodePath
} from "../../services/claude-settings.js";
import { getCachedApiConfig } from "../../managers/sdk-config-cache.js";
import { getEnhancedEnv } from "../../utils/util.js";
import { addLanguagePreference } from "../../utils/language-detector.js";
import { getMemoryToolConfig } from "../../utils/memory-tools.js";

import { PerformanceMonitor } from "./performance-monitor.js";
import { triggerAutoMemoryAnalysis, clearMemoryGuidanceCache } from "./memory-manager.js";
import { createPermissionHandler, handleToolUseEvent } from "./permission-handler.js";
import { clearMcpServerCache } from "../../managers/mcp-server-manager.js";

const DEFAULT_CWD = process.cwd();

// ========== 全局缓存 - 跨会话复用 ==========

/**
 * 清除全局缓存（在配置更改时调用）
 * 注意：这会关闭所有缓存的 MCP 服务器
 */
export function clearRunnerCache(): void {
  // 使用 MCP 服务器管理器清除缓存
  clearMcpServerCache();

  // 清除记忆提示缓存
  clearMemoryGuidanceCache();
}

// 重新导出类型
export type { RunnerOptions, RunnerHandle, MemoryConfig } from "./types.js";
export { PerformanceMonitor } from "./performance-monitor.js";
export { triggerAutoMemoryAnalysis } from "./memory-manager.js";

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

  // 在函数开始就导入 logger，确保日志可用
  const { log } = await import("../../logger.js");
  log.info(`[Runner] Starting Claude query for session ${session.id}`, { promptLength: prompt.length });

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
      // 1. 获取并验证 API 配置（使用预加载的缓存）
      log.debug(`[Runner] Fetching API config...`);
      const config = await getCachedApiConfig();

      if (!config) {
        log.error(`[Runner] No API config found for session ${session.id}`);
        onEvent({
          type: "session.status",
          payload: { sessionId: session.id, status: "error", title: session.title, cwd: session.cwd, error: "API configuration not found. Please configure API settings." }
        });
        return;
      }
      log.info(`[Runner] API config loaded`, { baseURL: config.baseURL, model: config.model });

      // 2. 构建环境变量（直连模式）
      perfMonitor.mark('Environment Setup');
      const env = buildEnvForConfig(config);
      const mergedEnv = {
        ...getEnhancedEnv(),
        ...env
      };
      perfMonitor.measure('Environment Setup');

      // 3. 处理提示词（添加语言偏好，斜杠命令由 SDK 直接处理）
      const enhancedPrompt = addLanguagePreference(prompt);
      const languageHint = enhancedPrompt !== prompt ? enhancedPrompt.split('\n\n')[0] : undefined;

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

      // 5. 获取 Memory MCP 服务器（自定义的，不在 settings.json 中）
      perfMonitor.mark('Memory MCP Server Loading');
      const { getCachedMemoryMcpServer } = await import("../../managers/sdk-config-cache.js");
      let memoryMcpServer: any = null;
      if (memConfig.enabled) {
        memoryMcpServer = await getCachedMemoryMcpServer();
        if (memoryMcpServer) {
          log.debug(`[Runner] Memory MCP server loaded from cache`);
        }
      }
      perfMonitor.measure('Memory MCP Server Loading');

      // 6. 获取语言提示（轻量级，只包含语言偏好）
      const languagePrompt = languageHint;

      // 7. 确定权限模式（使用最严格的默认值）
      const permissionMode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'delegate' | 'dontAsk' =
        "default";  // 使用最严格的默认模式，防止权限绕过

      log.debug(`[Runner] Permission mode: ${permissionMode}`);

      // 8. 记录会话启动完成
      perfMonitor.measureTotal();

      // 9. 创建并执行查询
      log.info(`[Runner] Starting SDK query for session ${session.id}`);

      // ⚡ 渐进式加载优化：不自动注入记忆上下文
      // AI 可以通过 Memory MCP 工具主动检索记忆
      // 记忆工具会自动出现在工具列表中，AI 可以自然发现并使用
      // 对于阿里云，不使用 CLI 进程模式，避免兼容性问题
      const claudeCodePath = (config.apiType === 'alibaba') ? undefined : getClaudeCodePath();

      log.info(`[Runner] CLI mode: ${claudeCodePath ? 'enabled' : 'disabled (HTTP API mode)'} for provider: ${config.apiType}`);

      const q = query({
        prompt: prompt,  // SDK 直接处理斜杠命令
        options: {
          cwd: session.cwd ?? DEFAULT_CWD,
          resume: resumeSessionId,
          abortController,
          env: mergedEnv,
          // 阿里云不传递 CLI 路径，使用纯 HTTP API 模式
          ...(claudeCodePath ? { pathToClaudeCodeExecutable: claudeCodePath } : {}),
          permissionMode,
          includePartialMessages: true,
          // ⭐ 设置 settingSources 让 SDK 自动加载 ~/.claude/settings.json
          // SDK 将自动处理：enabledPlugins, mcpServers, agents, permissions, hooks 等
          // 这样就不需要手动扫描和转换配置了
          settingSources: ['user'],
          // 系统提示（只包含语言偏好，轻量级）
          ...(languagePrompt ? { extraArgs: { 'append-system-prompt': languagePrompt } } : {}),
          // Memory MCP 服务器（自定义的，需要显式传递，因为不在 settings.json 中）
          ...(memoryMcpServer ? { mcpServers: { 'memory-tools': memoryMcpServer } as any } : {}),
          // 权限处理
          canUseTool: createPermissionHandler(session, sendPermissionRequest)
        }
      });

      // 12. 处理消息流
      log.debug(`[Runner] Starting message loop for session ${session.id}`);
      let messageCount = 0;
      for await (const message of q) {
        messageCount++;
        if (messageCount === 1 || messageCount % 10 === 0) {
          log.debug(`[Runner] Received message ${messageCount} of type: ${message.type}`);
        }
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

      // 13. 查询正常完成 - 触发自动记忆分析（异步执行，不阻塞会话完成）
      log.info(`[Runner] Message loop completed for session ${session.id}, total messages: ${messageCount}`);
      if (session.status === "running") {
        if (memConfig.enabled && memConfig.autoStore) {
          // 异步执行记忆分析，不等待完成
          triggerAutoMemoryAnalysis(session, prompt, memConfig, onEvent).catch((error) => {
            log.error('[Auto Memory] Background analysis failed:', error);
          });
        }

        onEvent({
          type: "session.status",
          payload: { sessionId: session.id, status: "completed", title: session.title }
        });
      }
    } catch (error) {
      const errorName = (error as Error).name;
      const errorMessage = (error as Error).message;
      if (errorName === "AbortError") {
        // 会话被中止，不视为错误
        log.info(`[Runner] Session ${session.id} aborted by user`);
        return;
      }
      log.error(`[Runner] Error in session ${session.id}:`, error);
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
