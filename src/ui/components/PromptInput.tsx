import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ClientEvent } from "../types";
import { useAppStore } from "../store/useAppStore";
import { log } from "../utils/logger";

const DEFAULT_ALLOWED_TOOLS = "Read,Edit,Bash";
const MAX_ROWS = 12;
const LINE_HEIGHT = 21;
const MAX_HEIGHT = MAX_ROWS * LINE_HEIGHT;

// 斜杠命令接口
interface SlashCommand {
  name: string;
  description: string;
  source?: string;
}

interface PromptInputProps {
  sendEvent: (event: ClientEvent) => void;
  onSendMessage?: () => void;
  disabled?: boolean;
}

export function usePromptActions(sendEvent: (event: ClientEvent) => void) {
  const { t } = useTranslation();
  const prompt = useAppStore((state) => state.prompt);
  const cwd = useAppStore((state) => state.cwd);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const sessions = useAppStore((state) => state.sessions);
  const setPrompt = useAppStore((state) => state.setPrompt);
  const setPendingStart = useAppStore((state) => state.setPendingStart);
  const setGlobalError = useAppStore((state) => state.setGlobalError);

  const activeSession = activeSessionId ? sessions[activeSessionId] : undefined;
  const isRunning = activeSession?.status === "running";

  const handleSend = useCallback(async () => {
    if (!prompt.trim()) return;

    if (!activeSessionId) {
      let title = "";
      try {
        setPendingStart(true);
        title = await window.electron.generateSessionTitle(prompt);
      } catch (error) {
        log.error("Failed to generate session title", error);
        setPendingStart(false);
        setGlobalError(t("errors.failedToGetSessionTitle"));
        return;
      }
      sendEvent({
        type: "session.start",
        payload: { title, prompt, cwd: cwd.trim() || undefined, allowedTools: DEFAULT_ALLOWED_TOOLS }
      });
    } else {
      if (activeSession?.status === "running") {
        setGlobalError(t("errors.sessionStillRunning"));
        return;
      }
      sendEvent({ type: "session.continue", payload: { sessionId: activeSessionId, prompt } });
    }
    setPrompt("");
  }, [activeSession, activeSessionId, cwd, prompt, sendEvent, setGlobalError, setPendingStart, setPrompt, t]);

  const handleStop = useCallback(() => {
    if (!activeSessionId) return;
    sendEvent({ type: "session.stop", payload: { sessionId: activeSessionId } });
  }, [activeSessionId, sendEvent]);

  const handleStartFromModal = useCallback(() => {
    if (!cwd.trim()) {
      setGlobalError(t("errors.workingDirectoryRequired"));
      return;
    }
    handleSend();
  }, [cwd, handleSend, setGlobalError, t]);

  return { prompt, setPrompt, isRunning, handleSend, handleStop, handleStartFromModal };
}

export function PromptInput({ sendEvent, onSendMessage, disabled = false }: PromptInputProps) {
  const { t } = useTranslation();
  const { prompt, setPrompt, isRunning, handleSend, handleStop } = usePromptActions(sendEvent);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // 斜杠命令自动补全状态
  const [showCommands, setShowCommands] = useState(false);
  const [allCommands, setAllCommands] = useState<SlashCommand[]>([]);
  const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadingCommands, setLoadingCommands] = useState(false);

  // 加载可用的斜杠命令
  useEffect(() => {
    const loadSlashCommands = async () => {
      setLoadingCommands(true);
      try {
        const commands = await window.electron.getSlashCommands();
        setAllCommands(commands);
        log.debug(`[PromptInput] Loaded ${commands.length} slash commands`);
      } catch (error) {
        log.error("[PromptInput] Failed to load slash commands", error);
        // 使用内置命令作为回退
        setAllCommands([
          { name: "/plan", description: "制定实施计划", source: "builtin" },
          { name: "/help", description: "显示帮助信息", source: "builtin" },
          { name: "/bug", description: "报告 Bug", source: "builtin" },
          { name: "/clear", description: "清除屏幕", source: "builtin" },
          { name: "/exit", description: "退出会话", source: "builtin" },
          { name: "/new", description: "新建会话", source: "builtin" },
          { name: "/sessions", description: "会话管理", source: "builtin" },
          { name: "/commit", description: "创建 Git 提交", source: "builtin" },
          { name: "/review", description: "代码审查", source: "builtin" },
          { name: "/test", description: "运行测试", source: "builtin" },
          { name: "/build", description: "构建项目", source: "builtin" },
          { name: "/lint", description: "代码检查", source: "builtin" },
          { name: "/format", description: "代码格式化", source: "builtin" },
          { name: "/plugins", description: "管理插件", source: "builtin" },
          { name: "/mcp", description: "Model Context Protocol 服务器", source: "builtin" },
          { name: "/memory", description: "记忆管理", source: "builtin" },
          { name: "/agents", description: "代理管理", source: "builtin" },
          { name: "/hooks", description: "钩子配置", source: "builtin" },
          { name: "/permissions", description: "权限设置", source: "builtin" },
          { name: "/output", description: "输出样式设置", source: "builtin" },
          { name: "/settings", description: "设置", source: "builtin" },
          { name: "/customize", description: "自定义配置", source: "builtin" },
          { name: "/config", description: "配置管理", source: "builtin" },
          { name: "/env", description: "环境变量", source: "builtin" },
          { name: "/provider", description: "API 提供商", source: "builtin" },
          { name: "/model", description: "模型设置", source: "builtin" },
          { name: "/token", description: "Token 使用情况", source: "builtin" },
        ]);
      } finally {
        setLoadingCommands(false);
      }
    };

    loadSlashCommands();
  }, []);

  // 获取当前光标位置的命令前缀
  const getCommandPrefix = (text: string, cursorPosition: number): string => {
    const beforeCursor = text.substring(0, cursorPosition);
    const lastSlashIndex = beforeCursor.lastIndexOf("/");
    if (lastSlashIndex === -1) return "";

    // 检查斜杠后是否有空格（如果有空格，说明命令已结束）
    const afterSlash = beforeCursor.substring(lastSlashIndex + 1);
    if (afterSlash.includes(" ")) return "";

    return "/" + afterSlash;
  };

  // 过滤命令 - 对所有斜杠命令进行自动补全
  useEffect(() => {
    if (!promptRef.current || loadingCommands) return;

    const cursorPosition = promptRef.current.selectionStart;
    const prefix = getCommandPrefix(prompt, cursorPosition);

    if (prefix) {
      // 匹配所有斜杠命令
      const filtered = allCommands.filter(cmd =>
        cmd.name.toLowerCase().startsWith(prefix.toLowerCase())
      );
      setFilteredCommands(filtered);
      setShowCommands(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setShowCommands(false);
      setFilteredCommands([]);
    }
  }, [prompt, allCommands, loadingCommands]);

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommands) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        selectCommand(filteredCommands[selectedIndex].name);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowCommands(false);
        return;
      }
    }

    if (disabled && !isRunning) return;
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    if (isRunning) { handleStop(); return; }
    onSendMessage?.();
    handleSend();
  };

  // 选择命令
  const selectCommand = (commandName: string) => {
    if (!promptRef.current) return;

    const cursorPosition = promptRef.current.selectionStart;
    const beforeCursor = prompt.substring(0, cursorPosition);
    const afterCursor = prompt.substring(cursorPosition);
    const lastSlashIndex = beforeCursor.lastIndexOf("/");

    // 替换命令前缀为完整命令
    const newPrompt =
      beforeCursor.substring(0, lastSlashIndex) +
      commandName +
      " " +
      afterCursor;

    setPrompt(newPrompt);
    setShowCommands(false);

    // 设置光标位置到命令后面
    setTimeout(() => {
      if (promptRef.current) {
        const newPosition = lastSlashIndex + commandName.length + 1;
        promptRef.current.setSelectionRange(newPosition, newPosition);
        promptRef.current.focus();
      }
    }, 0);
  };

  const handleButtonClick = () => {
    if (disabled && !isRunning) return;
    if (isRunning) {
      handleStop();
    } else {
      onSendMessage?.();
      handleSend();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = "auto";
    const scrollHeight = target.scrollHeight;
    if (scrollHeight > MAX_HEIGHT) {
      target.style.height = `${MAX_HEIGHT}px`;
      target.style.overflowY = "auto";
    } else {
      target.style.height = `${scrollHeight}px`;
      target.style.overflowY = "hidden";
    }
  };

  useEffect(() => {
    if (!promptRef.current) return;
    promptRef.current.style.height = "auto";
    const scrollHeight = promptRef.current.scrollHeight;
    if (scrollHeight > MAX_HEIGHT) {
      promptRef.current.style.height = `${MAX_HEIGHT}px`;
      promptRef.current.style.overflowY = "auto";
    } else {
      promptRef.current.style.height = `${scrollHeight}px`;
      promptRef.current.style.overflowY = "hidden";
    }
  }, [prompt]);

  return (
    <section className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-surface via-surface to-transparent pb-6 px-2 lg:pb-8 pt-8 lg:ml-[280px]">
      <div className="mx-auto relative w-full max-w-full lg:max-w-3xl">
        <div className="flex items-end gap-3 rounded-2xl border border-ink-900/10 bg-surface px-4 py-3 shadow-card">
          <textarea
            rows={1}
            className="flex-1 resize-none bg-transparent py-1.5 text-sm text-ink-800 placeholder:text-muted focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            placeholder={disabled ? t("promptInput.placeholderDisabled") : t("promptInput.placeholder")}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            ref={promptRef}
            disabled={disabled && !isRunning}
          />
          {/* 斜杠命令快捷按钮 */}
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-ink-800 hover:bg-surface-tertiary transition-colors disabled:cursor-not-allowed disabled:opacity-60 text-base font-medium"
            onClick={() => {
              // 插入斜杠并聚焦输入框
              const newValue = prompt + (prompt.length > 0 && !prompt.endsWith(' ') ? ' ' : '') + '/';
              setPrompt(newValue);
              setTimeout(() => {
                if (promptRef.current) {
                  promptRef.current.focus();
                  const pos = newValue.length;
                  promptRef.current.setSelectionRange(pos, pos);
                }
              }, 0);
            }}
            aria-label="斜杠命令"
            disabled={disabled && !isRunning}
            title="斜杠命令"
          >
            /
          </button>
          <button
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${isRunning ? "bg-error text-white hover:bg-error/90" : "bg-accent text-white hover:bg-accent-hover"}`}
            onClick={handleButtonClick}
            aria-label={isRunning ? t("promptInput.stopSession") : t("promptInput.sendPrompt")}
            disabled={disabled && !isRunning}
          >
            {isRunning ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path d="M3.4 20.6 21 12 3.4 3.4l2.8 7.2L16 12l-9.8 1.4-2.8 7.2Z" fill="currentColor" /></svg>
            )}
          </button>
        </div>

        {/* 斜杠命令自动补全下拉框 */}
        {showCommands && filteredCommands.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute bottom-full left-0 right-0 mb-2 mx-4 max-h-60 overflow-y-auto rounded-xl border border-ink-900/10 bg-surface shadow-lg"
          >
            {filteredCommands.map((cmd, index) => (
              <button
                key={cmd.name}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  index === selectedIndex
                    ? "bg-accent/10 text-accent"
                    : "text-ink-800 hover:bg-surface-secondary"
                }`}
                onClick={() => selectCommand(cmd.name)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{cmd.name}</span>
                  {cmd.source === "builtin" && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">内置</span>
                  )}
                  {cmd.source === "skill" && (
                    <>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">自然语言技能</span>
                      <span className="text-xs text-muted">(说"帮我{cmd.name}..."触发)</span>
                    </>
                  )}
                  {cmd.source === "plugin" && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">插件</span>
                  )}
                  {cmd.source === "mcp" && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">MCP</span>
                  )}
                  {cmd.source === "hook" && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">钩子</span>
                  )}
                </div>
                <div className="text-xs text-muted">{cmd.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
