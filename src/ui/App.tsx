import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PermissionResult } from "@qwen-code/sdk";
import { useIPC } from "./hooks/useIPC";
import { useMessageWindow } from "./hooks/useMessageWindow";
import { useAppStore } from "./store/useAppStore";
import type { ServerEvent } from "./types";
import { Sidebar } from "./components/Sidebar";
import { StartSessionModal } from "./components/StartSessionModal";
import { PromptInput, usePromptActions } from "./components/PromptInput";
import { SettingsPage } from "./pages/SettingsPage/SettingsPage";
import { MessageCard } from "./components/EventCard";
import { DeletionConfirmDialog } from "./components/DeletionConfirmDialog";
import { SessionStatusIndicator, type SessionStatusType } from "./components/SessionStatusIndicator";
import MDContent from "./render/markdown";
import { isDeletionPermissionRequest } from "@/shared/deletion-detection";
import { log } from "./utils/logger";
import {
  SCROLL_THRESHOLD,
  PARTIAL_MESSAGE_CLEAR_DELAY,
  SCROLL_RESTORE_DELAY,
} from "./config/constants";

// isDeletionPermissionRequest 已从共享模块导入

function App() {
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const partialMessageRef = useRef("");
  const [partialMessage, setPartialMessage] = useState("");
  const [showPartialMessage, setShowPartialMessage] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const prevMessagesLengthRef = useRef(0);
  const scrollHeightBeforeLoadRef = useRef(0);
  const shouldRestoreScrollRef = useRef(false);

  // 会话状态管理
  const [sessionStatus, setSessionStatus] = useState<SessionStatusType>('idle');
  const [responseStartTime, setResponseStartTime] = useState<number | null>(null);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const responseCheckTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const updateRafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  const sessions = useAppStore((s) => s.sessions);
  const activeSessionId = useAppStore((s) => s.activeSessionId);
  const showStartModal = useAppStore((s) => s.showStartModal);
  const setShowStartModal = useAppStore((s) => s.setShowStartModal);
  const globalError = useAppStore((s) => s.globalError);
  const setGlobalError = useAppStore((s) => s.setGlobalError);
  const historyRequested = useAppStore((s) => s.historyRequested);
  const markHistoryRequested = useAppStore((s) => s.markHistoryRequested);
  const resolvePermissionRequest = useAppStore((s) => s.resolvePermissionRequest);
  const handleServerEvent = useAppStore((s) => s.handleServerEvent);
  const prompt = useAppStore((s) => s.prompt);
  const setPrompt = useAppStore((s) => s.setPrompt);
  const cwd = useAppStore((s) => s.cwd);
  const setCwd = useAppStore((s) => s.setCwd);
  const pendingStart = useAppStore((s) => s.pendingStart);
  const apiConfigChecked = useAppStore((s) => s.apiConfigChecked);
  const setApiConfigChecked = useAppStore((s) => s.setApiConfigChecked);
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

  // 在 hooks 前定义 activeSession 和 isRunning，供后续使用
  const activeSession = activeSessionId ? sessions[activeSessionId] : undefined;
  const isRunning = activeSession?.status === "running";

  // Helper function to extract partial message content
  const getPartialMessageContent = (eventMessage: any) => {
    try {
      const realType = eventMessage.delta.type.split("_")[0];
      return eventMessage.delta[realType];
    } catch (error) {
      log.error("Failed to extract partial message content", error);
      return "";
    }
  };

  // 超时检查逻辑
  useEffect(() => {
    // 清除之前的定时器
    if (responseCheckTimerRef.current) {
      clearInterval(responseCheckTimerRef.current);
      responseCheckTimerRef.current = null;
    }

    // 如果不在运行状态，重置所有状态
    if (!isRunning) {
      setSessionStatus('idle');
      setResponseStartTime(null);
      setShowTimeoutWarning(false);
      return;
    }

    // 开始响应时记录时间
    if (!responseStartTime) {
      setResponseStartTime(Date.now());
    }

    // 设置定时检查
    responseCheckTimerRef.current = setInterval(() => {
      if (responseStartTime) {
        const elapsedSeconds = Math.floor((Date.now() - responseStartTime) / 1000);
        // 30秒后显示超时警告
        if (elapsedSeconds >= 30 && !showTimeoutWarning) {
          setShowTimeoutWarning(true);
        }
      }
    }, 1000);

    return () => {
      if (responseCheckTimerRef.current) {
        clearInterval(responseCheckTimerRef.current);
      }
    };
  }, [isRunning, responseStartTime, showTimeoutWarning]);

  // Handle partial messages from stream events
  const handlePartialMessages = useCallback((partialEvent: ServerEvent) => {
    if (partialEvent.type !== "stream.message" || partialEvent.payload.message.type !== "stream_event") return;
    // 仅处理当前活跃会话的流式事件，避免后台会话（如钉钉）的响应干扰当前界面
    if (partialEvent.payload.sessionId !== activeSessionId) return;

    const message = partialEvent.payload.message as any;
    if (message.event.type === "content_block_start") {
      partialMessageRef.current = "";
      setPartialMessage(partialMessageRef.current);
      setShowPartialMessage(true);
      // 开始接收内容时更新状态为"正在输入"
      setSessionStatus('typing');
      setShowTimeoutWarning(false);
    }

    if (message.event.type === "content_block_delta") {
      // 取消之前的更新请求
      if (updateRafRef.current) {
        cancelAnimationFrame(updateRafRef.current);
      }

      // 使用 requestAnimationFrame 批量更新，避免频繁渲染
      updateRafRef.current = requestAnimationFrame(() => {
        partialMessageRef.current += getPartialMessageContent(message.event) || "";
        setPartialMessage(partialMessageRef.current);

        // 使用节流优化滚动，避免频繁滚动
        if (shouldAutoScroll) {
          if (scrollRafRef.current) {
            cancelAnimationFrame(scrollRafRef.current);
          }
          scrollRafRef.current = requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          });
        } else {
          setHasNewMessages(true);
        }
      });
    }

    if (message.event.type === "content_block_stop") {
      setShowPartialMessage(false);
      setTimeout(() => {
        partialMessageRef.current = "";
        setPartialMessage(partialMessageRef.current);
      }, PARTIAL_MESSAGE_CLEAR_DELAY);
    }
  }, [shouldAutoScroll, activeSessionId]);

  // Combined event handler
  const onEvent = useCallback((event: ServerEvent) => {
    handleServerEvent(event);
    handlePartialMessages(event);

    // 同步会话状态到状态栏
    if (event.type === "session.status" && event.payload.sessionId === activeSessionId) {
      const { status } = event.payload;
      if (status === "running") {
        // 会话开始运行
        if (!responseStartTime) {
          setResponseStartTime(Date.now());
        }
      } else if (status === "completed" || status === "error" || status === "idle") {
        // 会话结束，重置状态
        setSessionStatus('idle');
        setResponseStartTime(null);
        setShowTimeoutWarning(false);
      }
    }
  }, [handleServerEvent, handlePartialMessages, activeSessionId, responseStartTime, setSessionStatus, setResponseStartTime, setShowTimeoutWarning]);

  const { connected, sendEvent } = useIPC(onEvent);
  const { handleStartFromModal } = usePromptActions(sendEvent);

  const messages = activeSession?.messages ?? [];
  const permissionRequests = activeSession?.permissionRequests ?? [];

  const {
    visibleMessages,
    hasMoreHistory,
    isLoadingHistory,
    loadMoreMessages,
    resetToLatest,
    totalMessages,
  } = useMessageWindow(messages, permissionRequests, activeSessionId);

  // 启动时检查 API 配置
  useEffect(() => {
    if (!apiConfigChecked) {
      // 安全检查：确保 window.electron 已加载
      if (!window.electron) {
        console.warn('[App] window.electron is not available yet, retrying...');
        const timer = setTimeout(() => {
          setApiConfigChecked(false);
        }, 100);
        return () => clearTimeout(timer);
      }

      window.electron.checkApiConfig().then((result) => {
        setApiConfigChecked(true);
        if (!result.hasConfig) {
          // 跳转到新的设置页面
          setCurrentPage('settings');
        }
      }).catch((err) => {
        log.error("Failed to check API config", err);
        setApiConfigChecked(true);
      });
    }
  }, [apiConfigChecked, setApiConfigChecked, setCurrentPage]);

  useEffect(() => {
    if (connected) sendEvent({ type: "session.list" });
  }, [connected, sendEvent]);

  useEffect(() => {
    if (!activeSessionId || !connected) return;
    const session = sessions[activeSessionId];
    if (session && !session.hydrated && !historyRequested.has(activeSessionId)) {
      markHistoryRequested(activeSessionId);
      sendEvent({ type: "session.history", payload: { sessionId: activeSessionId } });
    }
  }, [activeSessionId, connected, sessions, historyRequested, markHistoryRequested, sendEvent]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD;

    if (isAtBottom !== shouldAutoScroll) {
      setShouldAutoScroll(isAtBottom);
      if (isAtBottom) {
        setHasNewMessages(false);
      }
    }
  }, [shouldAutoScroll]);

  // Set up IntersectionObserver for top sentinel
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMoreHistory && !isLoadingHistory) {
          scrollHeightBeforeLoadRef.current = container.scrollHeight;
          shouldRestoreScrollRef.current = true;
          loadMoreMessages();
        }
      },
      {
        root: container,
        rootMargin: "100px 0px 0px 0px",
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMoreHistory, isLoadingHistory, loadMoreMessages]);

  // Restore scroll position after loading history
  useEffect(() => {
    if (shouldRestoreScrollRef.current && !isLoadingHistory) {
      const container = scrollContainerRef.current;
      if (container) {
        const newScrollHeight = container.scrollHeight;
        const scrollDiff = newScrollHeight - scrollHeightBeforeLoadRef.current;
        container.scrollTop += scrollDiff;
      }
      shouldRestoreScrollRef.current = false;
    }
  }, [visibleMessages, isLoadingHistory]);

  // Reset scroll state and partial message on session change
  useEffect(() => {
    // 切换会话时立即清空上一个会话的流式残留，避免内容串台
    partialMessageRef.current = "";
    setPartialMessage("");
    setShowPartialMessage(false);

    setShouldAutoScroll(true);
    setHasNewMessages(false);
    prevMessagesLengthRef.current = 0;
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, SCROLL_RESTORE_DELAY);

    // 清理 animation frames
    return () => {
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
      if (updateRafRef.current) {
        cancelAnimationFrame(updateRafRef.current);
        updateRafRef.current = null;
      }
    };
  }, [activeSessionId]);

  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (messages.length > prevMessagesLengthRef.current && prevMessagesLengthRef.current > 0) {
      setHasNewMessages(true);
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, partialMessage, shouldAutoScroll]);

  const scrollToBottom = useCallback(() => {
    setShouldAutoScroll(true);
    setHasNewMessages(false);
    resetToLatest();
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [resetToLatest]);

  const handleNewSession = useCallback(() => {
    setShowStartModal(true);
  }, [setShowStartModal]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    sendEvent({ type: "session.delete", payload: { sessionId } });
  }, [sendEvent]);

  const handleRenameSession = useCallback(async (sessionId: string, newTitle: string) => {
    // 先更新本地状态（乐观更新）
    useAppStore.getState().renameSession(sessionId, newTitle);

    // 然后同步到后端数据库
    if (!window.electron) {
      log.error("window.electron is not available");
      return;
    }

    try {
      await window.electron.renameSession(sessionId, newTitle);
    } catch (error) {
      log.error("Failed to rename session in backend", error);
    }
  }, []);

  const handlePermissionResult = useCallback((toolUseId: string, result: PermissionResult) => {
    if (!activeSessionId) return;
    sendEvent({ type: "permission.response", payload: { sessionId: activeSessionId, toolUseId, result } });
    resolvePermissionRequest(activeSessionId, toolUseId);
  }, [activeSessionId, sendEvent, resolvePermissionRequest]);

  const handleSendMessage = useCallback(() => {
    setShouldAutoScroll(true);
    setHasNewMessages(false);
    resetToLatest();
    // 开始发送消息时设置状态为"正在思考"
    setSessionStatus('thinking');
    setResponseStartTime(Date.now());
    setShowTimeoutWarning(false);
  }, [resetToLatest]);

  // 设置页面模式
  if (currentPage === 'settings') {
    return <SettingsPage />;
  }

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar
        connected={connected}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
      />

      <main className="flex flex-1 flex-col ml-[280px] bg-surface-cream">
        <div
          className="flex items-center justify-between gap-2 h-12 border-b border-ink-900/10 bg-surface-cream select-none relative z-10 px-4"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <span className="text-sm font-medium text-ink-700 flex-1 text-center">{activeSession?.title || "AICowork"}</span>
          <button
            onClick={() => setCurrentPage('settings')}
            className="p-2 rounded-lg hover:bg-surface-tertiary transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="设置"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-ink-700" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        {/* 固定的会话状态指示器栏 - 合并显示状态和超时提示 */}
        <div className="sticky top-0 z-10 bg-surface-cream/95 backdrop-blur-sm border-b border-ink-900/5 px-8 py-1.5 empty-none">
          <SessionStatusIndicator
            status={sessionStatus}
            elapsedSeconds={showTimeoutWarning && responseStartTime ? Math.floor((Date.now() - responseStartTime) / 1000) : undefined}
          />
        </div>

        {/* 删除操作确认弹窗 - z-index 最高，强制用户确认 */}
        {isDeletionPermissionRequest(permissionRequests[0]) && (
          <DeletionConfirmDialog
            request={permissionRequests[0]}
            onSubmit={(result) => handlePermissionResult(permissionRequests[0].toolUseId, result)}
          />
        )}

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-8 pb-40 pt-6"
        >
          <div className="mx-auto max-w-3xl">
            <div ref={topSentinelRef} className="h-1" />

            {!hasMoreHistory && totalMessages > 0 && (
              <div className="flex items-center justify-center py-4 mb-4">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <div className="h-px w-12 bg-ink-900/10" />
                  <span>{t("app.beginningOfConversation")}</span>
                  <div className="h-px w-12 bg-ink-900/10" />
                </div>
              </div>
            )}

            {isLoadingHistory && (
              <div className="flex items-center justify-center py-4 mb-4">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{t("app.loadingMessages")}</span>
                </div>
              </div>
            )}

      {/* AskUserQuestion 的 DecisionPanel 在消息流中显示，但删除操作用全局弹窗 */}
      {!isDeletionPermissionRequest(permissionRequests[0]) && visibleMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-lg font-medium text-ink-700">{t("app.noMessagesYet")}</div>
                <p className="mt-2 text-sm text-muted">{t("app.startConversation")}</p>
              </div>
            ) : (
              visibleMessages.map((item, idx) => (
                <MessageCard
                  key={`${activeSessionId}-msg-${item.originalIndex}`}
                  message={item.message}
                  isLast={idx === visibleMessages.length - 1}
                  isRunning={isRunning}
                  permissionRequest={permissionRequests[0]}
                  onPermissionResult={handlePermissionResult}
                />
              ))
            )}

            {/* Partial message display with skeleton loading */}
            {showPartialMessage && (
              <div className="partial-message">
                <MDContent text={partialMessage} />
                <div className="mt-3 flex flex-col gap-2 px-1">
                  <div className="relative h-3 w-2/12 overflow-hidden rounded-full bg-ink-900/10">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ink-900/30 to-transparent animate-shimmer" />
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-ink-900/10">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ink-900/30 to-transparent animate-shimmer" />
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-ink-900/10">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ink-900/30 to-transparent animate-shimmer" />
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-ink-900/10">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ink-900/30 to-transparent animate-shimmer" />
                  </div>
                  <div className="relative h-3 w-4/12 overflow-hidden rounded-full bg-ink-900/10">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ink-900/30 to-transparent animate-shimmer" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <PromptInput sendEvent={sendEvent} onSendMessage={handleSendMessage} disabled={visibleMessages.length === 0} />

        {hasNewMessages && !shouldAutoScroll && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-28 left-1/2 ml-[140px] z-40 -translate-x-1/2 flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:bg-accent-hover hover:scale-105 animate-bounce-subtle"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
            <span>{t("app.newMessages")}</span>
          </button>
        )}
      </main>

      {showStartModal && (
        <StartSessionModal
          cwd={cwd}
          prompt={prompt}
          pendingStart={pendingStart}
          onCwdChange={setCwd}
          onPromptChange={setPrompt}
          onStart={handleStartFromModal}
          onClose={() => setShowStartModal(false)}
        />
      )}

      {globalError && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-error/20 bg-error-light px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm text-error">{globalError}</span>
            <button className="text-error hover:text-error/80" onClick={() => setGlobalError(null)}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
