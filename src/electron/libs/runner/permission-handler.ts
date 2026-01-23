/**
 * 权限处理模块
 * 处理工具使用权限请求和响应
 */

import type { PermissionResult } from "@anthropic-ai/claude-agent-sdk";
import type { PermissionRequest } from "./types.js";
import { checkIfDeletionOperation } from "../../../shared/deletion-detection.js";
import { RUNNER_TIMEOUT } from "../../config/constants.js";
import type { Session } from "../../storage/session-store.js";
import type { ServerEvent } from "../../types.js";

/**
 * 创建权限请求回调函数
 * @param session - 当前会话
 * @param sendPermissionRequest - 发送权限请求的函数
 * @returns canUseTool 回调函数
 */
export function createPermissionHandler(
  session: Session,
  sendPermissionRequest: (toolUseId: string, toolName: string, input: unknown) => void
) {
  return async function canUseTool(
    toolName: string,
    input: unknown,
    { signal }: { signal: AbortSignal }
  ): Promise<PermissionResult> {
    const { log } = await import("../../logger.js");

    // 检测删除操作 - 需要用户确认
    const isDeletionOperation = checkIfDeletionOperation(toolName, input);

    // 记录所有工具调用（使用 info 级别确保输出）
    log.info(`[Tool] toolName=${toolName}, isDeletion=${isDeletionOperation}`);
    if (toolName === "Bash") {
      const cmd = (input as Record<string, unknown>).command;
      log.info(`[Tool] Bash command: ${cmd}`);
    }
    if (toolName === "Write") {
      const filePath = (input as Record<string, unknown>).path;
      const content = (input as Record<string, unknown>).content;
      log.info(`[Tool] Write file=${filePath}, contentLength=${String(content).length}`);
    }

    // AskUserQuestion 或删除操作都需要用户响应
    if (toolName === "AskUserQuestion" || isDeletionOperation) {
      const toolUseId = crypto.randomUUID();

      // 发送权限请求到前端
      sendPermissionRequest(toolUseId, toolName, input);

      // 创建一个 Promise，等待用户响应
      return new Promise<PermissionResult>((resolve) => {
        // 添加超时机制，防止 Promise 永不 resolve 导致内存泄漏
        const timeout = setTimeout(() => {
          session.pendingPermissions.delete(toolUseId);
          log.warn(`Permission request timeout for ${toolName}`, { toolUseId, toolName });
          resolve({ behavior: "deny", message: "Permission request timeout" });
        }, RUNNER_TIMEOUT);

        session.pendingPermissions.set(toolUseId, {
          toolUseId,
          toolName,
          input,
          resolve: (result) => {
            clearTimeout(timeout);
            session.pendingPermissions.delete(toolUseId);
            resolve(result as PermissionResult);
          }
        });

        // 处理中止
        signal.addEventListener("abort", () => {
          clearTimeout(timeout);
          session.pendingPermissions.delete(toolUseId);
          resolve({ behavior: "deny", message: "Session aborted" });
        });
      });
    }

    // 自动批准其他工具
    return { behavior: "allow", updatedInput: input as Record<string, unknown> };
  };
}

/**
 * 处理工具使用事件
 * 检测特殊工具（记忆工具、删除操作）并发送相应的状态事件
 *
 * @param toolName - 工具名称
 * @param toolInput - 工具输入参数
 * @param memConfig - 记忆配置
 * @param session - 当前会话
 * @param onEvent - 事件回调函数
 */
export async function handleToolUseEvent(
  toolName: string,
  toolInput: unknown,
  memConfig: { enabled: boolean; autoStore?: boolean },
  session: Session,
  onEvent: (event: ServerEvent) => void
): Promise<void> {
  const { log } = await import("../../logger.js");

  // 记忆工具调用处理
  if (memConfig.enabled) {
    // 快速记忆工具
    if (toolName === "memory_search" || toolName === "memory_store" || toolName === "memory_ask") {
      log.info(`[Memory Tool] Quick tool called: ${toolName}`, toolInput);

      if (toolName === "memory_store") {
        onEvent({
          type: "memory.status",
          payload: {
            sessionId: session.id,
            stored: false,
            message: `正在存储记忆: ${(toolInput as Record<string, unknown>).title || '无标题'}`
          }
        });
      } else if (toolName === "memory_search") {
        onEvent({
          type: "memory.status",
          payload: {
            sessionId: session.id,
            stored: false,
            message: `正在搜索记忆: ${(toolInput as Record<string, unknown>).query?.toString().substring(0, 30) || ''}...`
          }
        });
      }
    }
    // Claude Memory Tool 命令
    else if (toolName === "memory") {
      log.info(`[Memory Tool] File tool called: ${toolName}`, toolInput);

      const subCommand = (toolInput as Record<string, unknown>)?.command || (toolInput as Record<string, unknown>)?.subcommand;
      if (subCommand === "create") {
        onEvent({
          type: "memory.status",
          payload: {
            sessionId: session.id,
            stored: false,
            message: `正在创建记忆文件`
          }
        });
      }
    }
  }

  // 记录删除操作（用于日志和调试）
  if (toolName === "Bash") {
    const cmd = (toolInput as Record<string, unknown>)?.command;
    if (cmd && checkIfDeletionOperation("Bash", { command: cmd })) {
      log.info(`[Deletion Detected] Tool use detected: ${cmd}`);
    }
  }
}
