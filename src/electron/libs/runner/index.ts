/**
 * Runner 模块主入口
 * 负责协调 Claude SDK 会话的执行
 */

import { query, type SDKMessage } from "@qwen-code/sdk";
import type { RunnerOptions, RunnerHandle, MemoryConfig } from "./types.js";

import {
  buildEnvForConfig,
  getQwenCodePath
} from "../../services/qwen-settings.js";
import { getCachedApiConfig } from "../../managers/sdk-config-cache.js";
import { getEnhancedEnv } from "../../utils/util.js";
import { addLanguagePreference } from "../../utils/language-detector.js";
import { getMemoryToolConfig } from "../../utils/memory-tools.js";
import { getAILanguagePreference } from "../../services/language-preference-store.js";

import { PerformanceMonitor } from "./performance-monitor.js";
import { triggerAutoMemoryAnalysis } from "./memory-manager.js";
import { createPermissionHandler, handleToolUseEvent, mapPermissionMode } from "./permission-handler.js";
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

  // 注意：记忆配置缓存不再需要清除
  // SDK 通过 Memory MCP 自动处理记忆功能
  // 清除配置缓存会导致记忆功能意外返回默认禁用状态
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
    // 在 try 块外部声明变量，便于 catch 块访问
    let config: Awaited<ReturnType<typeof getCachedApiConfig>> = null;
    let claudeCodePath: string | undefined = undefined;

    try {
      // 1. 获取并验证 API 配置（使用预加载的缓存）
      log.debug(`[Runner] Fetching API config...`);
      config = await getCachedApiConfig();

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

      // 3. 处理提示词（使用用户设置的语言偏好）
      // ✅ 获取用户在设置中选择的 AI 回复语言
      const userLanguage = getAILanguagePreference();
      
      // ✅ 使用用户设置的语言强制添加语言偏好
      const enhancedPrompt = addLanguagePreference(prompt, userLanguage);
      
      log.debug(`[Runner] Using user-preferred AI language: ${userLanguage}`);

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

      // 6. 加载外部 MCP 服务器配置（从 ~/.qwen/settings.json）
      perfMonitor.mark('External MCP Servers Loading');
      const { getMcpServers } = await import("../../managers/mcp-server-manager.js");
      const externalMcpServers = await getMcpServers();
      log.info(`[Runner] Loaded ${Object.keys(externalMcpServers).length} external MCP server configs`);
      // 详细记录每个 MCP 服务器的名称（避免序列化循环引用）
      for (const [name, config] of Object.entries(externalMcpServers)) {
        log.debug(`[Runner] MCP Server "${name}": command=${config.command}, args=${config.args?.join(' ') || 'none'}`);
      }
      perfMonitor.measure('External MCP Servers Loading');

      // 7. 确定权限模式（使用最严格的默认值）
      const claudePermissionMode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'delegate' | 'dontAsk' =
        "default";  // 使用最严格的默认模式，防止权限绕过
      
      // 映射到 Qwen SDK 的权限模式
      const qwenPermissionMode = mapPermissionMode(claudePermissionMode);

      log.debug(`[Runner] Permission mode: ${claudePermissionMode} → ${qwenPermissionMode}`);

      // 8. 合并所有 MCP 服务器配置
      const allMcpServers: Record<string, any> = {
        // Memory MCP 服务器（如果启用）
        ...(memoryMcpServer ? { 'memory-tools': memoryMcpServer } : {}),
        // 外部 MCP 服务器（从 settings.json 读取）
        ...externalMcpServers,
      };

      log.info(`[Runner] Total MCP servers to load: ${Object.keys(allMcpServers).length}`);
      if (Object.keys(allMcpServers).length > 0) {
        log.debug(`[Runner] MCP server names:`, Object.keys(allMcpServers));
        // 注意：不序列化完整配置，因为可能包含循环引用
        log.debug(`[Runner] MCP servers loaded successfully`);
      } else {
        log.warn(`[Runner] No MCP servers to load!`);
      }

      // 9. 记录会话启动完成
      perfMonitor.measureTotal();

      // 10. 创建并执行查询
      log.info(`[Runner] Starting SDK query for session ${session.id}`);

      // ⚡ 渐进式加载优化：不自动注入记忆上下文
      // AI 可以通过 Memory MCP 工具主动检索记忆
      // 记忆工具会自动出现在工具列表中，AI 可以自然发现并使用
      // 对于阿里云，不使用 CLI 进程模式，避免兼容性问题
      claudeCodePath = (config.apiType === 'alibaba') ? undefined : getQwenCodePath();

      log.info(`[Runner] CLI mode: ${claudeCodePath ? 'enabled' : 'disabled (HTTP API mode)'} for provider: ${config.apiType}`);

      // 验证阿里云配置
      if (config.apiType === 'alibaba') {
        log.info('[Runner] Using Alibaba cloud API mode - CLI disabled by design');
      } else if (!claudeCodePath) {
        log.warn('[Runner] CLI path not found, falling back to HTTP API mode');
      }

      // ========== 记录详细的 API 请求信息 ==========
      try {
        const apiEndpoint = buildApiEndpoint(config);
        const requestHeaders = buildApiHeaders(config);
        const requestBody = buildApiRequestBody(config, enhancedPrompt);

        // 打印详细的请求信息（类似 api-tester.ts 的格式）
        log.info('========================================');
        log.info('=== API Request Details ===');
        log.info(`Session ID: ${session.id}`);
        log.info(`URL: ${apiEndpoint}`);
        log.info('Method: POST');
        log.info(`Headers: ${JSON.stringify(requestHeaders, null, 2)}`);
        log.info(`Body: ${JSON.stringify(requestBody, null, 2)}`);
        log.info('========================================');
      } catch (logError) {
        log.warn('[Runner] Failed to log API request details:', logError);
      }
      // ========== 结束：API 请求信息记录 ==========

      const q = query({
        // ✅ 使用增强后的 prompt（包含用户设置的语言偏好）
        prompt: enhancedPrompt,
        options: {
          cwd: session.cwd ?? DEFAULT_CWD,
          // ❌ Qwen SDK 不支持 resume 参数，会话恢复功能已移除
          // resume: resumeSessionId,
          abortController,
          env: mergedEnv,
          // 阿里云不传递 CLI 路径，使用纯 HTTP API 模式
          // ✅ 参数名更新：pathToClaudeCodeExecutable → pathToQwenExecutable
          ...(claudeCodePath ? { pathToQwenExecutable: claudeCodePath } : {}),
          // ✅ 使用映射后的 Qwen 权限模式
          permissionMode: qwenPermissionMode,
          includePartialMessages: true,
          // ❌ Qwen SDK 不支持 settingSources 参数
          // settingSources: ['user'],
          // ❌ Qwen SDK 不支持 extraArgs 参数，语言偏好提示已移除
          // 注意：如需添加系统提示，应该在 prompt 中直接包含
          // ✅ 动态传递所有 MCP 服务器配置（包括 Memory 和外部服务器）
          ...(Object.keys(allMcpServers).length > 0 ? { mcpServers: allMcpServers as any } : {}),
          // 权限处理
          canUseTool: createPermissionHandler(session, sendPermissionRequest)
        }
      });

      // 11. 处理消息流
      log.debug(`[Runner] Starting message loop for session ${session.id}`);
      let messageCount = 0;
      for await (const message of q) {
        messageCount++;
        if (messageCount === 1 || messageCount % 10 === 0) {
          log.debug(`[Runner] Received message ${messageCount} of type: ${message.type}`);
        }
        // 提取 session_id 并附加实际配置的模型名称
        if (message.type === "system" && "subtype" in message && message.subtype === "init") {
          const sdkSessionId = message.session_id;
          if (sdkSessionId) {
            session.claudeSessionId = sdkSessionId;
            onSessionUpdate?.({ claudeSessionId: sdkSessionId });
          }
          
          // ✅ 附加实际配置的模型名称（覆盖 SDK 返回的 coder-model）
          // 这样前端可以显示用户实际配置的模型名称
          (message as any).configuredModel = config.model;
          log.debug(`[Runner] System init message enhanced with configured model: ${config.model}`);
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

      // 12. 查询正常完成 - 触发自动记忆分析（异步执行，不阻塞会话完成）
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
      if (errorName === "AbortError") {
        // 会话被中止，不视为错误
        log.info(`[Runner] Session ${session.id} aborted by user`);
        return;
      }
      // 详细的错误日志记录
      const errorDetails = {
        name: errorName,
        message: (error as Error).message,
        stack: (error as Error).stack,
        sessionId: session.id,
        apiType: config?.apiType,
        claudeCodePath: claudeCodePath ?? 'undefined (HTTP API mode)',
      };
      log.error(`[Runner] Error in session ${session.id}:`, errorDetails);
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

// ========== 辅助函数：构建 API 请求信息（用于日志记录） ==========

/**
 * 检测厂商类型（基于 Base URL）
 */
function detectProviderType(baseURL: string): 'anthropic' | 'openai' {
  const url = baseURL.toLowerCase();
  
  // OpenAI 兼容的厂商列表
  const openaiProviders = [
    'api.deepseek.com',
    'api.openai.com',
    'api.moonshot.cn',
    'dashscope.aliyuncs.com/compatible-mode', // 阿里云百炼
    'antchat.alipay.com', // 矽塔（蚂蚁聊天）
  ];
  
  for (const provider of openaiProviders) {
    if (url.includes(provider)) {
      return 'openai';
    }
  }
  
  // 默认使用 Anthropic 格式
  return 'anthropic';
}

/**
 * 构建 API 端点 URL
 * 根据厂商类型使用不同的 API 格式
 */
function buildApiEndpoint(config: { baseURL: string }): string {
  const baseUrl = config.baseURL.replace(/\/+$/, ''); // 移除尾部斜杠
  const providerType = detectProviderType(config.baseURL);

  // 使用正则检查 URL 是否以特定路径结尾（完整端点）
  const endsWithPath = (pattern: string) => new RegExp(`${pattern}/?$`).test(baseUrl);

  // 如果 URL 已包含完整的 API 端点路径，直接使用
  if (endsWithPath('/messages') || endsWithPath('/chat/completions')) {
    return baseUrl;
  }

  // 阿里云百炼特殊处理：compatible-mode/v1 使用 OpenAI 格式
  if (baseUrl.includes('dashscope.aliyuncs.com/compatible-mode/v1')) {
    return `${baseUrl}/chat/completions`;
  }

  // 根据厂商类型构建端点
  if (providerType === 'openai') {
    // OpenAI 格式：/v1/chat/completions
    if (endsWithPath('/v1')) return `${baseUrl}/chat/completions`;
    return `${baseUrl}/v1/chat/completions`;
  } else {
    // Anthropic 格式：/v1/messages
    if (endsWithPath('/v1')) return `${baseUrl}/messages`;
    return `${baseUrl}/v1/messages`;
  }
}

/**
 * 构造 API 请求头（脱敏显示）
 * 根据厂商类型使用不同的格式
 */
function buildApiHeaders(config: { baseURL: string; apiKey: string }): Record<string, string> {
  const providerType = detectProviderType(config.baseURL);
  
  // 脱敏处理：只显示前 10 个字符
  const maskedApiKey = config.apiKey.length > 10 
    ? `${config.apiKey.substring(0, 10)}...` 
    : '***';
  
  if (providerType === 'openai') {
    // OpenAI 格式：使用 Authorization Bearer
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${maskedApiKey}`
    };
  } else {
    // Anthropic 格式：使用 x-api-key
    return {
      'Content-Type': 'application/json',
      'x-api-key': maskedApiKey,
      'anthropic-version': '2023-06-01'
    };
  }
}

/**
 * 构造 API 请求体（用于日志显示）
 * 根据厂商类型使用不同的格式
 */
function buildApiRequestBody(
  config: { baseURL: string; model: string; maxTokens?: number; temperature?: number }, 
  prompt: string
): any {
  const providerType = detectProviderType(config.baseURL);
  
  // 截断过长的 prompt 用于日志显示
  const truncatedPrompt = prompt.length > 200 
    ? `${prompt.substring(0, 200)}... (total ${prompt.length} chars)` 
    : prompt;
  
  if (providerType === 'openai') {
    // OpenAI 格式
    return {
      model: config.model,
      max_tokens: config.maxTokens || 8192,
      temperature: config.temperature || 1.0,
      messages: [{ role: 'user', content: truncatedPrompt }]
    };
  } else {
    // Anthropic 格式
    return {
      model: config.model,
      max_tokens: config.maxTokens || 8192,
      temperature: config.temperature || 1.0,
      messages: [{ role: 'user', content: truncatedPrompt }]
    };
  }
}
