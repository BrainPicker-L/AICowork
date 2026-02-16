import { BrowserWindow, app, ipcMain } from "electron";
import type { ClientEvent, ServerEvent } from "./types.js";
import type { RunnerHandle } from "./libs/runner.js";
import { SessionStore, initSessionStore } from './storage/session-store.js';
import { join } from "path";
import { log } from "./logger.js";
import { setAILanguagePreference, getAILanguagePreference } from "./services/language-preference-store.js";
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
import { connectDingTalk, disconnectDingTalk } from './services/dingtalk-service.js';
import { loadDingTalkBot } from './storage/dingtalk-store.js';

let sessions: SessionStore;
const runnerHandles = new Map<string, RunnerHandle>();

/**
 * 初始化 SessionStore
 * 使用全局单例模式，确保 runner 也能访问同一个实例
 */
function initializeSessions() {
  if (!sessions) {
    const DB_PATH = join(app.getPath("userData"), "sessions.db");
    log.info(`Initializing session store at: ${DB_PATH}`);
    // 使用新的 initSessionStore 函数，确保全局单例
    sessions = initSessionStore(DB_PATH);
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
      handleSessionContinue(sessions, runnerHandles, emit, payload.sessionId, payload.prompt, payload.cwd);
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
    "dingtalk.connect": async () => {
      const payload = (event as Extract<ClientEvent, { type: "dingtalk.connect" }>).payload;
      const botName = payload.botName;
      try {
        const config = await loadDingTalkBot(botName);
        if (!config) {
          emit({ type: "dingtalk.status", payload: { botName, status: "failed", error: `Bot '${botName}' not found` } });
          return;
        }
        await connectDingTalk(botName, config, emit);
      } catch (error) {
        log.error(`[IPC] 钉钉连接失败 (${botName}):`, error);
        emit({ type: "dingtalk.status", payload: { botName, status: "failed", error: error instanceof Error ? error.message : String(error) } });
      }
    },
    "dingtalk.disconnect": async () => {
      const payload = (event as Extract<ClientEvent, { type: "dingtalk.disconnect" }>).payload;
      const botName = payload.botName;
      try {
        await disconnectDingTalk(botName, emit);
      } catch (error) {
        log.error(`[IPC] 钉钉断开失败 (${botName}):`, error);
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

/**
 * 注册语言偏好相关的 IPC 处理器
 * 必须在应用初始化时调用
 */
export function registerLanguageHandlers(): void {
  // 设置 AI 回复语言偏好
  ipcMain.handle('language:set-preference', async (_event, language: string) => {
    try {
      setAILanguagePreference(language);
      log.info(`[IPC] Language preference updated: ${language}`);
      return { success: true };
    } catch (error) {
      log.error('[IPC] Failed to set language preference:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // 获取当前 AI 回复语言偏好
  ipcMain.handle('language:get-preference', async () => {
    try {
      const language = getAILanguagePreference();
      return { success: true, language };
    } catch (error) {
      log.error('[IPC] Failed to get language preference:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  log.info('[IPC] Language preference handlers registered');
}

/**
 * 获取 emit 函数（供外部模块使用）
 * 确保 sessions 已初始化
 */
export function getEmit(): (event: ServerEvent) => void {
  initializeSessions();
  return emit;
}

export { sessions };
