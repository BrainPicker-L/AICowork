/**
 * 会话相关的 IPC 事件处理器
 * 将 handleClientEvent 中的大型 switch-case 拆分为独立处理器
 */

import { log } from "../logger.js";
import { runClaude, type RunnerHandle } from "../libs/runner.js";
import type { SessionStore } from '../storage/session-store.js';
import type { ClientEvent, ServerEvent } from "../types.js";

// 提取特定事件类型的辅助类型
type SessionStartEvent = Extract<ClientEvent, { type: "session.start" }>;
type PermissionResponseEvent = Extract<ClientEvent, { type: "permission.response" }>;

/**
 * 处理会话列表请求
 */
export function handleSessionList(sessions: SessionStore, emit: (event: ServerEvent) => void): void {
  emit({
    type: "session.list",
    payload: { sessions: sessions.listSessions() }
  });
}

/**
 * 处理会话历史请求
 */
export function handleSessionHistory(
  sessions: SessionStore,
  emit: (event: ServerEvent) => void,
  sessionId: string
): void {
  const history = sessions.getSessionHistory(sessionId);
  if (!history) {
    // Session may have been deleted
    emit({ type: "session.deleted", payload: { sessionId } });
    return;
  }
  emit({
    type: "session.history",
    payload: {
      sessionId: history.session.id,
      status: history.session.status,
      messages: history.messages
    }
  });
}

/**
 * 处理会话启动
 * @returns 新创建的会话 ID
 */
export function handleSessionStart(
  sessions: SessionStore,
  runnerHandles: Map<string, RunnerHandle>,
  emit: (event: ServerEvent) => void,
  payload: SessionStartEvent["payload"]
): string {
  const { cwd, title, allowedTools, prompt } = payload;
  const startTime = Date.now();

  const session = sessions.createSession({ cwd, title, allowedTools, prompt });

  // 使用会话日志记录到任务文件夹（如果有 cwd）
  if (cwd) {
    log.sessionCwd(session.id, cwd, "Session created", { id: session.id, cwd, title: session.title });
    log.sessionCwd(session.id, cwd, "Session starting", { prompt });
  } else {
    log.session(session.id, "Session created (no cwd)", { id: session.id, title: session.title });
  }

  sessions.updateSession(session.id, { status: "running", lastPrompt: prompt });
  emit({
    type: "session.status",
    payload: { sessionId: session.id, status: "running", title: session.title, cwd: session.cwd }
  });

  emit({
    type: "stream.user_prompt",
    payload: { sessionId: session.id, prompt }
  });

  runClaude({
    prompt,
    session,
    resumeSessionId: session.claudeSessionId,
    onEvent: emit,
    onSessionUpdate: (updates) => {
      sessions.updateSession(session.id, updates);
    }
  })
    .then((handle) => {
      runnerHandles.set(session.id, handle);
      sessions.setAbortController(session.id, undefined);
      const duration = Date.now() - startTime;
      log.performance(`Session ${session.id} start`, duration);
    })
    .catch((error) => {
      log.error(`Session ${session.id} failed to start`, error);
      sessions.updateSession(session.id, { status: "error" });
      emit({
        type: "session.status",
        payload: {
          sessionId: session.id,
          status: "error",
          title: session.title,
          cwd: session.cwd,
          error: String(error)
        }
      });
    });

  return session.id;
}

/**
 * 处理会话继续（发送新消息）
 */
export function handleSessionContinue(
  sessions: SessionStore,
  runnerHandles: Map<string, RunnerHandle>,
  emit: (event: ServerEvent) => void,
  sessionId: string,
  prompt: string,
  cwd?: string
): void {
  const session = sessions.getSession(sessionId);
  if (!session) {
    emit({ type: "session.deleted", payload: { sessionId } });
    emit({
      type: "runner.error",
      payload: { sessionId, message: "Session no longer exists." }
    });
    return;
  }

  // 如果提供了新的工作目录，更新会话的 cwd
  if (cwd !== undefined && cwd.trim() && cwd.trim() !== session.cwd) {
    const oldCwd = session.cwd;
    sessions.updateSession(sessionId, { cwd: cwd.trim() });
    log.session(sessionId, "Working directory changed", { oldCwd, newCwd: cwd.trim() });
    
    // 重新获取更新后的会话对象
    const updatedSession = sessions.getSession(sessionId);
    if (updatedSession) {
      Object.assign(session, updatedSession);
    }
  }

  // ✅ 检查是否已有运行中的 runner
  const existingHandle = runnerHandles.get(sessionId);
  
  if (existingHandle) {
    // ✅ 已有 runner，直接添加新的用户输入到队列
    log.session(sessionId, "Adding user input to existing session");
    
    sessions.updateSession(sessionId, { status: "running", lastPrompt: prompt });
    emit({
      type: "session.status",
      payload: { sessionId, status: "running", title: session.title, cwd: session.cwd }
    });

    emit({
      type: "stream.user_prompt",
      payload: { sessionId, prompt }
    });

    // ✅ 向队列添加新输入，触发 generator yield
    existingHandle.addUserInput(prompt);
    return;
  }

  // ✅ 没有 runner，创建新的（第一次对话）
  log.session(sessionId, "Starting new session");
  const startTime = Date.now();

  sessions.updateSession(sessionId, { status: "running", lastPrompt: prompt });
  emit({
    type: "session.status",
    payload: { sessionId, status: "running", title: session.title, cwd: session.cwd }
  });

  emit({
    type: "stream.user_prompt",
    payload: { sessionId, prompt }
  });

  runClaude({
    prompt,
    session,
    resumeSessionId: session.claudeSessionId,
    onEvent: emit,
    onSessionUpdate: (updates) => {
      sessions.updateSession(sessionId, updates);
    }
  })
    .then((handle) => {
      runnerHandles.set(sessionId, handle);
      const duration = Date.now() - startTime;
      log.performance(`Session ${sessionId} start`, duration);
    })
    .catch((error) => {
      log.error(`Session ${sessionId} failed to start`, error);
      sessions.updateSession(sessionId, { status: "error" });
      emit({
        type: "session.status",
        payload: {
          sessionId,
          status: "error",
          title: session.title,
          cwd: session.cwd,
          error: String(error)
        }
      });
    });
}

/**
 * 处理会话停止
 */
export function handleSessionStop(
  sessions: SessionStore,
  runnerHandles: Map<string, RunnerHandle>,
  emit: (event: ServerEvent) => void,
  sessionId: string
): void {
  const session = sessions.getSession(sessionId);
  if (!session) {
    log.warn(`Attempted to stop non-existent session: ${sessionId}`);
    return;
  }

  log.session(sessionId, "Stopping session");

  const handle = runnerHandles.get(sessionId);
  if (handle) {
    handle.abort();
    runnerHandles.delete(sessionId);
    log.session(sessionId, "Session aborted");
  }

  sessions.updateSession(sessionId, { status: "idle" });
  emit({
    type: "session.status",
    payload: { sessionId, status: "idle", title: session.title, cwd: session.cwd }
  });
}

/**
 * 处理会话删除
 */
export function handleSessionDelete(
  sessions: SessionStore,
  runnerHandles: Map<string, RunnerHandle>,
  emit: (event: ServerEvent) => void,
  sessionId: string
): void {
  log.session(sessionId, "Deleting session");

  try {
    const handle = runnerHandles.get(sessionId);
    if (handle) {
      handle.abort();
      runnerHandles.delete(sessionId);
    }

    sessions.deleteSession(sessionId);
    emit({
      type: "session.deleted",
      payload: { sessionId }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error(`Failed to delete session ${sessionId}`, error);

    emit({
      type: "runner.error",
      payload: {
        sessionId,
        message: `Failed to delete session: ${errorMessage}`
      }
    });
  }
}

/**
 * 处理权限响应
 */
export function handlePermissionResponse(
  sessions: SessionStore,
  sessionId: string,
  toolUseId: string,
  result: PermissionResponseEvent["payload"]["result"]
): void {
  const session = sessions.getSession(sessionId);
  if (!session) return;

  const pending = session.pendingPermissions.get(toolUseId);
  if (pending) {
    pending.resolve(result);
  }
}
