import { BrowserWindow } from "electron";
import type { ClientEvent, ServerEvent } from "./types.js";
import { runClaude, type RunnerHandle } from "./libs/runner.js";
import { SessionStore } from './storage/session-store.js';
import { app } from "electron";
import { join } from "path";
import { log } from "./logger.js";
import {
  handleSessionList,
  handleSessionHistory,
  handleSessionStart,
  handleSessionContinue,
  handleSessionStop,
  handleSessionDelete,
  handlePermissionResponse,
} from "./handlers/session-handlers.js";
import { fetchModelList, fetchModelLimits } from './storage/config-store.js';
import type { ApiConfig } from './storage/config-store.js';

let sessions: SessionStore;
const runnerHandles = new Map<string, RunnerHandle>();

function initializeSessions() {
  if (!sessions) {
    const DB_PATH = join(app.getPath("userData"), "sessions.db");
    log.info(`Initializing session store at: ${DB_PATH}`);
    sessions = new SessionStore(DB_PATH);
  }
  return sessions;
}

function broadcast(event: ServerEvent) {
  const payload = JSON.stringify(event);
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    win.webContents.send("server-event", payload);
  }
}

function hasLiveSession(sessionId: string): boolean {
  if (!sessions) return false;
  return Boolean(sessions.getSession(sessionId));
}

function emit(event: ServerEvent) {
  // If a session was deleted, drop late events that would resurrect it in the UI.
  // (Session history lookups are DB-backed, so these late events commonly lead to "Unknown session".)
  if (
    (event.type === "session.status" ||
      event.type === "stream.message" ||
      event.type === "stream.user_prompt" ||
      event.type === "permission.request") &&
    !hasLiveSession(event.payload.sessionId)
  ) {
    return;
  }

  if (event.type === "session.status") {
    sessions.updateSession(event.payload.sessionId, { status: event.payload.status });
  }
  if (event.type === "stream.message") {
    sessions.recordMessage(event.payload.sessionId, event.payload.message);
  }
  if (event.type === "stream.user_prompt") {
    sessions.recordMessage(event.payload.sessionId, {
      type: "user_prompt",
      prompt: event.payload.prompt
    });
  }
  broadcast(event);
}

/**
 * 处理客户端 IPC 事件
 * 使用事件处理器映射替代大型 switch-case，提高可读性和可维护性
 */
export function handleClientEvent(event: ClientEvent) {
  // Initialize sessions on first event
  const sessions = initializeSessions();

  // 事件处理器映射 - 使用查找表替代多重 if 语句
  // 使用类型断言来处理联合类型的 payload 访问
  const eventHandlers = {
    "session.list": () => handleSessionList(sessions, emit),
    "session.history": () => {
      const payload = (event as Extract<ClientEvent, { type: "session.history" }>).payload;
      handleSessionHistory(sessions, emit, payload.sessionId);
    },
    "session.start": () => {
      const payload = (event as Extract<ClientEvent, { type: "session.start" }>).payload;
      handleSessionStart(sessions, runnerHandles, emit, payload);
    },
    "session.continue": () => {
      const payload = (event as Extract<ClientEvent, { type: "session.continue" }>).payload;
      handleSessionContinue(sessions, runnerHandles, emit, payload.sessionId, payload.prompt);
    },
    "session.stop": () => {
      const payload = (event as Extract<ClientEvent, { type: "session.stop" }>).payload;
      handleSessionStop(sessions, runnerHandles, emit, payload.sessionId);
    },
    "session.delete": () => {
      const payload = (event as Extract<ClientEvent, { type: "session.delete" }>).payload;
      handleSessionDelete(sessions, runnerHandles, emit, payload.sessionId);
    },
    "permission.response": () => {
      const payload = (event as Extract<ClientEvent, { type: "permission.response" }>).payload;
      handlePermissionResponse(sessions, payload.sessionId, payload.toolUseId, payload.result);
    },
    "api.fetchModelList": async () => {
      const payload = (event as Extract<ClientEvent, { type: "api.fetchModelList" }>).payload;
      try {
        const config: ApiConfig = {
          id: 'temp',
          name: 'temp',
          apiKey: payload.apiKey,
          baseURL: payload.baseURL,
          model: '',
          apiType: payload.apiType as any,
        };
        const models = await fetchModelList(config);
        emit({ type: "api.modelList", payload: { models, error: undefined } });
      } catch (error) {
        log.error('[IPC] 获取模型列表失败:', error);
        emit({ type: "api.modelList", payload: { models: null, error: error instanceof Error ? error.message : String(error) } });
      }
    },
    "api.fetchModelLimits": async () => {
      const payload = (event as Extract<ClientEvent, { type: "api.fetchModelLimits" }>).payload;
      try {
        const config: ApiConfig = {
          id: 'temp',
          name: 'temp',
          apiKey: payload.apiKey,
          baseURL: payload.baseURL,
          model: payload.model,
          apiType: payload.apiType as any,
        };
        const limits = await fetchModelLimits(config);
        emit({ type: "api.modelLimits", payload: { limits, error: undefined } });
      } catch (error) {
        log.error('[IPC] 获取模型限制失败:', error);
        emit({ type: "api.modelLimits", payload: { limits: null, error: error instanceof Error ? error.message : String(error) } });
      }
    },
  } as const;

  // 获取并执行对应的事件处理器
  const handler = eventHandlers[event.type];
  if (handler) {
    handler();
  } else {
    log.warn(`Unknown event type: ${event.type}`);
  }
}

export function cleanupAllSessions(): void {
  const count = runnerHandles.size;
  if (count > 0) {
    log.info(`Cleaning up ${count} active session(s)`);
    for (const [sessionId, handle] of runnerHandles) {
      log.session(sessionId, 'Aborting during cleanup');
      handle.abort();
    }
  }
  runnerHandles.clear();
  if (sessions) {
    sessions.close();
    log.info('Session store closed');
  }
}

export { sessions };
