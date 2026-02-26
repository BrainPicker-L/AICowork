import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ServerEvent, SessionStatus, StreamMessage } from "../types";

export type PermissionRequest = {
  toolUseId: string;
  toolName: string;
  input: unknown;
};

export type SessionView = {
  id: string;
  title: string;
  status: SessionStatus;
  cwd?: string;
  source?: string;
  messages: StreamMessage[];
  permissionRequests: PermissionRequest[];
  lastPrompt?: string;
  createdAt?: number;
  updatedAt?: number;
  hydrated: boolean;
};

/**
 * 设置页面区域类型
 */
export type SettingsSection =
  | 'feedback'
  | 'about'
  | 'language'
  | 'display'
  | 'api'
  | 'mcp'
  | 'skills'
  | 'jarvis'
  | 'memory'
  | 'dingtalk';

interface AppState {
  sessions: Record<string, SessionView>;
  activeSessionId: string | null;
  prompt: string;
  cwd: string;
  pendingStart: boolean;
  globalError: string | null;
  sessionsLoaded: boolean;
  showStartModal: boolean;
  showSettingsModal: boolean;
  historyRequested: Set<string>;
  apiConfigChecked: boolean;
  selectedModelConfigId: string | null; // 新增：当前选中的模型配置ID

  // 新增：页面状态
  currentPage: 'main' | 'settings';
  settingsSection: SettingsSection;

  // 显示设置
  showTokenUsage: boolean;
  showSystemMessage: boolean;

  setPrompt: (prompt: string) => void;
  setCwd: (cwd: string) => void;
  setPendingStart: (pending: boolean) => void;
  setGlobalError: (error: string | null) => void;
  setShowStartModal: (show: boolean) => void;
  setShowSettingsModal: (show: boolean) => void;
  setActiveSessionId: (id: string | null) => void;
  setApiConfigChecked: (checked: boolean) => void;
  setSelectedModelConfigId: (configId: string | null) => void; // 新增：设置选中的模型配置
  markHistoryRequested: (sessionId: string) => void;
  resolvePermissionRequest: (sessionId: string, toolUseId: string) => void;
  renameSession: (sessionId: string, newTitle: string) => void;
  handleServerEvent: (event: ServerEvent) => void;

  // 新增：页面切换方法
  setCurrentPage: (page: 'main' | 'settings') => void;
  setSettingsSection: (section: SettingsSection) => void;

  // 显示设置方法
  setShowTokenUsage: (show: boolean) => void;
  setShowSystemMessage: (show: boolean) => void;
}

function createSession(id: string): SessionView {
  return { id, title: "", status: "idle", messages: [], permissionRequests: [], hydrated: false };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      sessions: {},
      activeSessionId: null,
      prompt: "",
      cwd: "",
      pendingStart: false,
      globalError: null,
      sessionsLoaded: false,
      showStartModal: false,
      showSettingsModal: false,
      historyRequested: new Set(),
      apiConfigChecked: false,
      selectedModelConfigId: null, // 新增：初始化为 null

      // 新增：页面状态
      currentPage: 'main',
      settingsSection: 'api' as SettingsSection,

      // 显示设置（默认开启）
      showTokenUsage: true,
      showSystemMessage: true,

      setPrompt: (prompt) => set({ prompt }),
      setCwd: (cwd) => set({ cwd }),
      setPendingStart: (pendingStart) => set({ pendingStart }),
      setGlobalError: (globalError) => set({ globalError }),
      setShowStartModal: (showStartModal) => set({ showStartModal }),
      setShowSettingsModal: (showSettingsModal) => set({ showSettingsModal }),
      setActiveSessionId: (id) => {
        const state = get();

        // 切换任务时同步工作目录
        if (id && state.sessions[id]?.cwd) {
          set({ activeSessionId: id, cwd: state.sessions[id].cwd });
        } else {
          set({ activeSessionId: id });
        }
      },
      setApiConfigChecked: (apiConfigChecked) => set({ apiConfigChecked }),
      setSelectedModelConfigId: (configId) => set({ selectedModelConfigId: configId }), // 新增：设置方法

      // 新增：页面切换方法
      setCurrentPage: (currentPage) => set({ currentPage }),
      setSettingsSection: (settingsSection) => set({ settingsSection }),

      // 显示设置方法
      setShowTokenUsage: (showTokenUsage) => set({ showTokenUsage }),
      setShowSystemMessage: (showSystemMessage) => set({ showSystemMessage }),

      renameSession: (sessionId, newTitle) => {
    set((state) => {
      const existing = state.sessions[sessionId];
      if (!existing) return {};
      return {
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...existing,
            title: newTitle,
            updatedAt: Date.now()
          }
        }
      };
      });
      },

      markHistoryRequested: (sessionId) => {
    set((state) => {
      const next = new Set(state.historyRequested);
      next.add(sessionId);
        return { historyRequested: next };
      });
      },

      resolvePermissionRequest: (sessionId, toolUseId) => {
    set((state) => {
      const existing = state.sessions[sessionId];
      if (!existing) return {};
      return {
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...existing,
            permissionRequests: existing.permissionRequests.filter(req => req.toolUseId !== toolUseId)
          }
          }
        };
      });
      },

          handleServerEvent: (event) => {
        const state = get();

        switch (event.type) {
          case "session.list": {
        const nextSessions: Record<string, SessionView> = {};
        for (const session of event.payload.sessions) {
          const existing = state.sessions[session.id] ?? createSession(session.id);
          nextSessions[session.id] = {
            ...existing,
            status: session.status,
            title: session.title,
            cwd: session.cwd,
            source: session.source,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
          };
        }

        set({ sessions: nextSessions, sessionsLoaded: true });

        const hasSessions = event.payload.sessions.length > 0;
        set({ showStartModal: !hasSessions });

        // ✅ 只在首次加载且没有 activeSessionId 时才自动选择最新会话
        // 不再在 session.list 中清空 activeSessionId，避免会话完成后刷新列表时错误清空
        // activeSessionId 只应该由 session.deleted 事件清空
        if (!state.activeSessionId && event.payload.sessions.length > 0) {
          const sorted = [...event.payload.sessions].sort((a, b) => {
            const aTime = a.updatedAt ?? a.createdAt ?? 0;
            const bTime = b.updatedAt ?? b.createdAt ?? 0;
            return aTime - bTime;
          });
          const latestSession = sorted[sorted.length - 1];
          if (latestSession) {
            get().setActiveSessionId(latestSession.id);
          }
        }
            break;
          }

          case "session.history": {
        const { sessionId, messages, status } = event.payload;
        set((state) => {
          const existing = state.sessions[sessionId] ?? createSession(sessionId);
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: { ...existing, status, messages, hydrated: true }
            }
          };
          });
            break;
          }

          case "session.status": {
        const { sessionId, status, title, cwd, source } = event.payload;
        
        set((state) => {
          const existing = state.sessions[sessionId] ?? createSession(sessionId);
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...existing,
                status,
                title: title ?? existing.title,
                cwd: cwd ?? existing.cwd,
                source: source ?? existing.source,
                updatedAt: Date.now()
              }
            }
          };
        });

        // 确保 activeSessionId 被正确设置
        if (state.pendingStart) {
          get().setActiveSessionId(sessionId);
          set({ pendingStart: false, showStartModal: false });
        }
        // 仅自动激活本地会话；钉钉会话在后台运行，不抢占用户当前上下文
        else if (!state.activeSessionId && status === "running" && source !== "dingtalk") {
          get().setActiveSessionId(sessionId);
        }
            break;
          }

          case "session.deleted": {
        const { sessionId } = event.payload;
        const state = get();

        const nextSessions = { ...state.sessions };
        delete nextSessions[sessionId];

        const nextHistoryRequested = new Set(state.historyRequested);
        nextHistoryRequested.delete(sessionId);

        const hasRemaining = Object.keys(nextSessions).length > 0;

        set({
          sessions: nextSessions,
          historyRequested: nextHistoryRequested,
          showStartModal: !hasRemaining
        });

        if (state.activeSessionId === sessionId) {
          const remaining = Object.values(nextSessions).sort(
            (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
          );
          get().setActiveSessionId(remaining[0]?.id ?? null);
          }
            break;
          }

          case "stream.message": {
        const { sessionId, message } = event.payload;
        set((state) => {
          const existing = state.sessions[sessionId] ?? createSession(sessionId);
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: { ...existing, messages: [...existing.messages, message] }
            }
          };
          });
            break;
          }

          case "stream.user_prompt": {
        const { sessionId, prompt } = event.payload;
        set((state) => {
          const existing = state.sessions[sessionId] ?? createSession(sessionId);
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...existing,
                messages: [...existing.messages, { type: "user_prompt", prompt }]
              }
            }
          };
          });
            break;
          }

          case "permission.request": {
        const { sessionId, toolUseId, toolName, input } = event.payload;
        set((state) => {
          const existing = state.sessions[sessionId] ?? createSession(sessionId);
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...existing,
                permissionRequests: [...existing.permissionRequests, { toolUseId, toolName, input }]
              }
            }
          };
          });
            break;
          }

          case "runner.error": {
            set({ globalError: event.payload.message });
            break;
          }

        }
      }
    }),
    {
      name: 'aicowork-app-storage',
      partialize: (state) => ({
        activeSessionId: state.activeSessionId,
        cwd: state.cwd,
        selectedModelConfigId: state.selectedModelConfigId,
        currentPage: state.currentPage,
        settingsSection: state.settingsSection,
        showTokenUsage: state.showTokenUsage,
        showSystemMessage: state.showSystemMessage,
      }),
    }
  )
);
