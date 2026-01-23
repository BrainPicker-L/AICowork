/**
 * Runner 模块类型定义
 */

import type { Session } from "../../storage/session-store.js";
import type { ServerEvent } from "../../types.js";
import type { PermissionResult } from "@anthropic-ai/claude-agent-sdk";

/**
 * Runner 运行选项
 */
export type RunnerOptions = {
  /** 用户输入的提示词 */
  prompt: string;
  /** 当前会话 */
  session: Session;
  /** 可选：恢复的会话 ID */
  resumeSessionId?: string;
  /** 事件回调函数 */
  onEvent: (event: ServerEvent) => void;
  /** 可选：会话更新回调 */
  onSessionUpdate?: (updates: Partial<Session>) => void;
};

/**
 * Runner 返回的句柄
 */
export type RunnerHandle = {
  /** 中止当前运行 */
  abort: () => void;
};

/**
 * 内存配置
 */
export type MemoryConfig = {
  /** 是否启用记忆功能 */
  enabled: boolean;
  /** 是否自动存储 */
  autoStore: boolean;
  /** 自动存储的分类 */
  autoStoreCategories: string[];
  /** 默认 K 值（检索数量） */
  defaultK: number;
};

/**
 * 权限请求
 */
export type PermissionRequest = {
  /** 工具使用 ID */
  toolUseId: string;
  /** 工具名称 */
  toolName: string;
  /** 工具输入参数 */
  input: unknown;
  /** 解析函数 */
  resolve: (result: PermissionResult) => void;
};

// 重新导出 SDK 的 PermissionResult 类型
export type { PermissionResult };
