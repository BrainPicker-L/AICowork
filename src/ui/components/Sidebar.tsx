import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
// Radix UI Tooltip components
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { useAppStore } from "../store/useAppStore";
import { IS_MAC } from "../utils/device";

interface SidebarProps {
  connected: boolean;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
}

export function Sidebar({
  onNewSession,
  onDeleteSession,
  onRenameSession
}: SidebarProps) {
  const { t } = useTranslation();

  const sessions = useAppStore((state) => state.sessions);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const setActiveSessionId = useAppStore((state) => state.setActiveSessionId);
  const [resumeSessionId, setResumeSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const closeTimerRef = useRef<number | null>(null);

  const formatCwd = (cwd?: string) => {
    if (!cwd) return t("sidebar.workingDirUnavailable");
    const parts = cwd.split(/[\\/]+/).filter(Boolean);
    const tail = parts.slice(-2).join("/");
    return `/${tail || cwd}`;
  };

  const sessionList = useMemo(() => {
    const list = Object.values(sessions);
    list.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    return list;
  }, [sessions]);

  useEffect(() => {
    setCopied(false);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, [resumeSessionId]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  const handleCopyCommand = async () => {
    if (!resumeSessionId) return;
    const command = `claude --resume ${resumeSessionId}`;
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      return;
    }
    setCopied(true);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setResumeSessionId(null);
    }, 3000);
  };

  const handleStartRename = (sessionId: string) => {
    const session = sessions[sessionId];
    if (!session) return;
    setRenamingSessionId(sessionId);
    setRenameTitle(session.title);
  };

  const handleRenameConfirm = () => {
    if (!renamingSessionId || !renameTitle.trim()) return;
    onRenameSession(renamingSessionId, renameTitle.trim());
    setRenamingSessionId(null);
    setRenameTitle("");
  };

  const handleRenameCancel = () => {
    setRenamingSessionId(null);
    setRenameTitle("");
  };

  return (
    <aside className="fixed inset-y-0 left-0 flex h-full w-[280px] flex-col gap-4 border-r border-ink-900/5 bg-surface-cream px-4 pb-4 pt-12">
      {/* Electron 窗口拖拽区域 - 顶层 z-index 确保可点击，macOS 需为交通灯留出 no-drag 区域 */}
      <div
        className="absolute top-0 left-0 right-0 h-12 z-20"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />
      {IS_MAC && (
        <div
          className="absolute top-0 left-0 w-[70px] h-12 z-30"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          aria-hidden
        />
      )}
      <TooltipProvider>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex-1 cursor-pointer rounded-xl border border-ink-900/10 bg-surface px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-surface-tertiary hover:border-ink-900/20 transition-colors"
                onClick={onNewSession}
              >
                {t("sidebar.newTask")}
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-tooltip-bg text-tooltip-fg text-xs px-3 py-1.5 rounded-lg shadow-lg">
              {t("sidebar.tooltips.newTask")}
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
      <div className="flex flex-col gap-2 overflow-y-auto">
        {sessionList.length === 0 && (
          <div className="rounded-xl border border-ink-900/5 bg-surface px-4 py-5 text-center text-xs text-muted">
            {t("sidebar.noSessions")}
          </div>
        )}
        {sessionList.map((session) => (
          <div
            key={session.id}
            className={`cursor-pointer rounded-xl border px-2 py-3 text-left transition ${activeSessionId === session.id ? "border-accent/30 bg-accent-subtle" : "border-ink-900/5 bg-surface hover:bg-surface-tertiary"}`}
            onClick={() => setActiveSessionId(session.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveSessionId(session.id); } }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                <div className="flex items-center gap-1.5">
                  {session.source === 'dingtalk' && (
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-1 py-0.5 text-[9px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20 flex-shrink-0">
                      DingTalk
                    </span>
                  )}
                  <div className={`text-[12px] font-semibold truncate ${session.status === "running" ? "text-info" : session.status === "completed" ? "text-success" : session.status === "error" ? "text-error" : "text-ink-800"}`}>
                    {session.title}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-0.5 text-xs text-muted">
                  <span className="truncate">{formatCwd(session.cwd)}</span>
                </div>
              </div>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex-shrink-0 rounded-full p-1.5 text-ink-500 hover:bg-ink-900/10" aria-label="Open session menu" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <circle cx="5" cy="12" r="1.7" />
                      <circle cx="12" cy="12" r="1.7" />
                      <circle cx="19" cy="12" r="1.7" />
                    </svg>
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content className="z-50 min-w-[220px] rounded-xl border border-ink-900/10 bg-surface p-1 shadow-lg" align="center" sideOffset={8}>
                    <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 outline-none hover:bg-ink-900/5" onSelect={() => handleStartRename(session.id)}>
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink-500" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                      </svg>
                      重命名
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 outline-none hover:bg-ink-900/5" onSelect={() => setResumeSessionId(session.id)}>
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink-500" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 5h16v14H4z" /><path d="M7 9h10M7 12h6" /><path d="M13 15l3 2-3 2" />
                      </svg>
                      {t("sidebar.resumeInClaudeCode")}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-error hover:bg-error/5" onSelect={() => onDeleteSession(session.id)}>
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-error/80" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M7 7l1 12a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9l1-12" />
                      </svg>
                      {t("sidebar.deleteSession")}
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
        ))}
      </div>
      <Dialog.Root open={!!resumeSessionId} onOpenChange={(open) => !open && setResumeSessionId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <Dialog.Title className="text-lg font-semibold text-ink-800">{t("sidebar.resume")}</Dialog.Title>
              <Dialog.Close asChild>
                <button className="rounded-full p-1 text-ink-500 hover:bg-ink-900/10" aria-label={t("sidebar.close")}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6l-12 12" />
                  </svg>
                </button>
              </Dialog.Close>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-ink-900/10 bg-surface px-3 py-2 font-mono text-xs text-ink-700">
              <span className="flex-1 break-all">{resumeSessionId ? `claude --resume ${resumeSessionId}` : ""}</span>
              <button className="rounded-lg p-1.5 text-ink-600 hover:bg-ink-900/10" onClick={handleCopyCommand} aria-label={t("sidebar.copyResumeCommand")}>
                {copied ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l4 4L19 6" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={!!renamingSessionId} onOpenChange={(open) => !open && handleRenameCancel()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-ink-800">重命名会话</Dialog.Title>
            <div className="mt-4">
              <label className="block text-sm font-medium text-ink-700 mb-2">会话名称</label>
              <input
                type="text"
                className="w-full rounded-lg border border-ink-900/10 bg-surface px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                placeholder="输入会话名称"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameConfirm();
                  if (e.key === "Escape") handleRenameCancel();
                }}
                autoFocus
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-lg border border-ink-900/10 bg-surface px-4 py-2 text-sm font-medium text-ink-700 hover:bg-surface-tertiary"
                onClick={handleRenameCancel}
              >
                取消
              </button>
              <button
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleRenameConfirm}
                disabled={!renameTitle.trim()}
              >
                确定
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </aside>
  );
}
