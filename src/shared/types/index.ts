/**
 * 共享类型定义
 * 前后端共享的 TypeScript 类型
 */

import type { SDKMessage, PermissionResult } from "@qwen-code/sdk";
import type { DingTalkConnectionStatus, DingTalkSessionMeta } from "./dingtalk.js";

// ==================== 消息类型 ====================

/**
 * 用户提示消息
 */
export type UserPromptMessage = {
  type: "user_prompt";
  prompt: string;
};

/**
 * 流式消息类型
 */
export type StreamMessage = SDKMessage | UserPromptMessage;

// ==================== 会话类型 ====================

/**
 * 会话状态
 */
export type SessionStatus = "idle" | "running" | "completed" | "error";

/**
 * 会话来源
 */
export type SessionSource = 'local' | 'dingtalk';

/**
 * 会话信息
 */
export type SessionInfo = {
  id: string;
  title: string;
  status: SessionStatus;
  claudeSessionId?: string;
  cwd?: string;
  source?: SessionSource;
  dingtalkMeta?: DingTalkSessionMeta;
  createdAt: number;
  updatedAt: number;
};

// ==================== 事件类型 ====================

/**
 * 服务端 -> 客户端事件
 */
export type ServerEvent =
  | { type: "stream.message"; payload: { sessionId: string; message: StreamMessage } }
  | { type: "stream.user_prompt"; payload: { sessionId: string; prompt: string } }
  | { type: "session.status"; payload: { sessionId: string; status: SessionStatus; title?: string; cwd?: string; error?: string; source?: SessionSource } }
  | { type: "session.list"; payload: { sessions: SessionInfo[] } }
  | { type: "session.history"; payload: { sessionId: string; status: SessionStatus; messages: StreamMessage[] } }
  | { type: "session.deleted"; payload: { sessionId: string } }
  | { type: "permission.request"; payload: { sessionId: string; toolUseId: string; toolName: string; input: unknown } }
  | { type: "runner.error"; payload: { sessionId?: string; message: string } }
  | { type: "api.modelList"; payload: { models: string[] | null; error?: string } }
  | { type: "api.modelLimits"; payload: { limits: { max_tokens?: number; min_tokens?: number } | null; error?: string } }
  | { type: "dingtalk.status"; payload: { botName: string; status: DingTalkConnectionStatus; error?: string } };

/**
 * 客户端 -> 服务端事件
 */
export type ClientEvent =
  | { type: "session.start"; payload: { title: string; prompt: string; cwd?: string; allowedTools?: string } }
  | { type: "session.continue"; payload: { sessionId: string; prompt: string; cwd?: string } }
  | { type: "session.stop"; payload: { sessionId: string } }
  | { type: "session.delete"; payload: { sessionId: string } }
  | { type: "session.list" }
  | { type: "session.history"; payload: { sessionId: string } }
  | { type: "permission.response"; payload: { sessionId: string; toolUseId: string; result: PermissionResult } }
  | { type: "api.fetchModelList"; payload: { apiKey: string; baseURL: string; apiType?: string } }
  | { type: "api.fetchModelLimits"; payload: { apiKey: string; baseURL: string; model: string; apiType?: string } }
  | { type: "dingtalk.connect"; payload: { botName: string } }
  | { type: "dingtalk.disconnect"; payload: { botName: string } };

// ==================== 重新导出 SDK 类型 ====================

export type { SDKMessage, PermissionResult };
export type { DingTalkConfig, DingTalkConnectionStatus, DingTalkInboundMessage, DingTalkSessionMeta, DingTalkBotSummary, AICardInstance, AICardStatus } from "./dingtalk.js";
export { DEFAULT_DINGTALK_CONFIG } from "./dingtalk.js";
