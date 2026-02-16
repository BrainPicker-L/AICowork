import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  PermissionResult,
  SDKAssistantMessage,
  SDKMessage,
  SDKResultMessage,
  SDKUserMessage
} from "@qwen-code/sdk";
import type { StreamMessage } from "../types";
import type { PermissionRequest } from "../store/useAppStore";
import { useAppStore } from "../store/useAppStore";
import MDContent from "../render/markdown";
import MDContentEnhanced from "../render/markdown-enhanced";
import { DecisionPanel } from "./DecisionPanel";

// 渲染器类型
type RendererType = 'standard' | 'enhanced';

// 获取当前渲染器类型
async function getRendererType(): Promise<RendererType> {
  try {
    const config = await window.electron.getOutputConfig();
    return config.renderer || 'enhanced';
  } catch {
    return 'enhanced';
  }
}

// Markdown 渲染器组件
function MDRenderer({ text }: { text: string }) {
  const [renderer, setRenderer] = useState<RendererType>('enhanced');

  useEffect(() => {
    getRendererType().then(setRenderer);
  }, []);

  if (renderer === 'enhanced') {
    return <MDContentEnhanced text={text} />;
  }
  return <MDContent text={text} />;
}

type MessageContent = SDKAssistantMessage["message"]["content"][number];
type ToolResultContent = SDKUserMessage["message"]["content"][number];
type ToolStatus = "pending" | "success" | "error";
const toolStatusMap = new Map<string, ToolStatus>();
const toolStatusListeners = new Set<() => void>();
const MAX_VISIBLE_LINES = 3;

type AskUserQuestionInput = {
  questions?: Array<{
    question: string;
    header?: string;
    options?: Array<{ label: string; description?: string }>;
    multiSelect?: boolean;
  }>;
};

const getAskUserQuestionSignature = (input?: AskUserQuestionInput | null) => {
  if (!input?.questions?.length) return "";
  return input.questions.map((question) => {
    const options = (question.options ?? []).map((o) => `${o.label}|${o.description ?? ""}`).join(",");
    return `${question.question}|${question.header ?? ""}|${question.multiSelect ? "1" : "0"}|${options}`;
  }).join("||");
};

const setToolStatus = (toolUseId: string | undefined, status: ToolStatus) => {
  if (!toolUseId) return;
  toolStatusMap.set(toolUseId, status);
  toolStatusListeners.forEach((listener) => listener());
};

const useToolStatus = (toolUseId: string | undefined) => {
  const [status, setStatus] = useState<ToolStatus | undefined>(() =>
    toolUseId ? toolStatusMap.get(toolUseId) : undefined
  );
  useEffect(() => {
    if (!toolUseId) return;
    const handleUpdate = () => setStatus(toolStatusMap.get(toolUseId));
    toolStatusListeners.add(handleUpdate);
    return () => { toolStatusListeners.delete(handleUpdate); };
  }, [toolUseId]);
  return status;
};

const StatusDot = ({ variant = "accent", isActive = false, isVisible = true }: {
  variant?: "accent" | "success" | "error"; isActive?: boolean; isVisible?: boolean;
}) => {
  if (!isVisible) return null;
  const colorClass = variant === "success" ? "bg-success" : variant === "error" ? "bg-error" : "bg-accent";
  return (
    <span className="relative flex h-2 w-2">
      {isActive && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${colorClass} opacity-75`} />}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${colorClass}`} />
    </span>
  );
};

const SessionResult = ({ message }: { message: SDKResultMessage }) => {
  const { t } = useTranslation();
  const showTokenUsage = useAppStore((state) => state.showTokenUsage);
  
  // 如果设置为不显示，返回 null
  if (!showTokenUsage) {
    return null;
  }

  const formatMinutes = (ms: number | undefined) => typeof ms !== "number" ? "-" : `${(ms / 60000).toFixed(2)} min`;
  const formatUsd = (usd: number | undefined) => typeof usd !== "number" ? "-" : usd.toFixed(2);
  const formatMillions = (tokens: number | undefined) => typeof tokens !== "number" ? "-" : `${(tokens / 1_000_000).toFixed(4)} M`;

  return (
    <div className="flex flex-col gap-2 mt-4">
      <div className="header text-accent">{t('events.sessionResult')}</div>
      <div className="flex flex-col rounded-xl px-4 py-3 border border-ink-900/10 bg-surface-secondary space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-[14px]">
          <span className="font-normal">{t('events.duration')}</span>
          <span className="inline-flex items-center rounded-full bg-surface-tertiary px-2.5 py-0.5 text-ink-700 text-[13px]">{formatMinutes(message.duration_ms)}</span>
          <span className="font-normal">API</span>
          <span className="inline-flex items-center rounded-full bg-surface-tertiary px-2.5 py-0.5 text-ink-700 text-[13px]">{formatMinutes(message.duration_api_ms)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[14px]">
          <span className="font-normal">{t('events.usage')}</span>
          <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-accent text-[13px]">{t('events.cost')} ${formatUsd((message as any).total_cost_usd)}</span>
          <span className="inline-flex items-center rounded-full bg-surface-tertiary px-2.5 py-0.5 text-ink-700 text-[13px]">{t('events.input')} {formatMillions(message.usage?.input_tokens)}</span>
          <span className="inline-flex items-center rounded-full bg-surface-tertiary px-2.5 py-0.5 text-ink-700 text-[13px]">{t('events.output')} {formatMillions(message.usage?.output_tokens)}</span>
        </div>
      </div>
    </div>
  );
};

export function isMarkdown(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const patterns: RegExp[] = [/^#{1,6}\s+/m, /```[\s\S]*?```/];
  return patterns.some((pattern) => pattern.test(text));
}

function extractTagContent(input: string, tag: string): string | null {
  const match = input.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? match[1] : null;
}

const ToolResult = ({ messageContent }: { messageContent: ToolResultContent }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isFirstRender = useRef(true);
  let lines: string[] = [];

  if (typeof messageContent === 'string' || (messageContent as any).type !== "tool_result") return null;

  const toolUseId = (messageContent as any).tool_use_id;
  const status: ToolStatus = (messageContent as any).is_error ? "error" : "success";
  const isError = (messageContent as any).is_error;

  if ((messageContent as any).is_error) {
    lines = [extractTagContent(String((messageContent as any).content), "tool_use_error") || String((messageContent as any).content)];
  } else {
    try {
      const content = (messageContent as any).content;
      if (Array.isArray(content)) {
        // 检查是否是带 text 属性的对象数组
        const hasTextProperty = content.length > 0 &&
          content[0] && typeof content[0] === 'object' &&
          'text' in content[0];

        if (hasTextProperty) {
          lines = content.map((item: any) => item.text || "").join("\n").split("\n");
        } else {
          // 纯数组（如资源列表），格式化为易读形式
          const formatted = JSON.stringify(content, null, 2);
          lines = formatted.split("\n");
        }
      } else if (typeof content === 'object' && content !== null) {
        // 对象类型，格式化显示
        const formatted = JSON.stringify(content, null, 2);
        lines = formatted.split("\n");
      } else {
        lines = String(content).split("\n");
      }
    } catch { lines = [JSON.stringify(messageContent, null, 2)]; }
  }

  const isMarkdownContent = isMarkdown(lines.join("\n"));
  const hasMoreLines = lines.length > MAX_VISIBLE_LINES;
  const visibleContent = hasMoreLines && !isExpanded ? lines.slice(0, MAX_VISIBLE_LINES).join("\n") : lines.join("\n");

  useEffect(() => { setToolStatus(toolUseId, status); }, [toolUseId, status]);
  useEffect(() => {
    if (!hasMoreLines || isFirstRender.current) { isFirstRender.current = false; return; }
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [hasMoreLines, isExpanded]);

  return (
    <div className="flex flex-col mt-4">
      <div className="header text-accent">{t('events.output')}</div>
      <div className="mt-2 rounded-xl bg-surface-tertiary p-3">
        <pre className={`text-sm whitespace-pre-wrap break-words font-mono ${isError ? "text-red-500" : "text-ink-700"}`}>
          {isMarkdownContent ? <MDRenderer text={visibleContent} /> : visibleContent}
        </pre>
        {hasMoreLines && (
          <button onClick={() => setIsExpanded(!isExpanded)} className="mt-2 text-sm text-accent hover:text-accent-hover transition-colors flex items-center gap-1">
            <span>{isExpanded ? "▲" : "▼"}</span>
            <span>{isExpanded ? t('events.collapse') : t('events.showMoreLines', { count: lines.length - MAX_VISIBLE_LINES })}</span>
          </button>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

const AssistantBlockCard = ({ text }: { title: string; text: string; showIndicator?: boolean }) => (
  <div className="flex flex-col mt-4">
    <MDRenderer text={text} />
  </div>
);

const ToolUseCard = ({ messageContent, showIndicator = false }: { messageContent: MessageContent; showIndicator?: boolean }) => {
  if (messageContent.type !== "tool_use") return null;
  
  const toolStatus = useToolStatus(messageContent.id);
  const statusVariant = toolStatus === "error" ? "error" : "success";
  const isPending = !toolStatus || toolStatus === "pending";
  const shouldShowDot = toolStatus === "success" || toolStatus === "error" || showIndicator;

  useEffect(() => {
    if (messageContent?.id && !toolStatusMap.has(messageContent.id)) setToolStatus(messageContent.id, "pending");
  }, [messageContent?.id]);

  const getToolInfo = (): string | null => {
    const input = messageContent.input as Record<string, any>;
    switch (messageContent.name) {
      case "Bash": return input?.command || null;
      case "Read": case "Write": case "Edit": return input?.file_path || null;
      case "Glob": case "Grep": return input?.pattern || null;
      case "Task": return input?.description || null;
      case "WebFetch": return input?.url || null;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-[1rem] bg-surface-tertiary px-3 py-2 mt-4 overflow-hidden">
      <div className="flex flex-row items-center gap-2 min-w-0">
        <StatusDot variant={statusVariant} isActive={isPending && showIndicator} isVisible={shouldShowDot} />
        <div className="flex flex-row items-center gap-2 tool-use-item min-w-0 flex-1">
          <span className="inline-flex items-center rounded-md text-accent py-0.5 text-sm font-medium shrink-0">{messageContent.name}</span>
          <span className="text-sm text-muted truncate">{getToolInfo()}</span>
        </div>
      </div>
    </div>
  );
};

const AskUserQuestionCard = ({
  messageContent,
  permissionRequest,
  onPermissionResult
}: {
  messageContent: MessageContent;
  permissionRequest?: PermissionRequest;
  onPermissionResult?: (toolUseId: string, result: PermissionResult) => void;
}) => {
  if (messageContent.type !== "tool_use") return null;
  
  const input = messageContent.input as AskUserQuestionInput | null;
  const questions = input?.questions ?? [];
  const currentSignature = getAskUserQuestionSignature(input);
  const requestSignature = getAskUserQuestionSignature(permissionRequest?.input as AskUserQuestionInput | undefined);
  const isActiveRequest = permissionRequest && currentSignature === requestSignature;

  if (isActiveRequest && onPermissionResult) {
    return (
      <div className="mt-4">
        <DecisionPanel
          request={permissionRequest}
          onSubmit={(result) => onPermissionResult(permissionRequest.toolUseId, result)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-[1rem] bg-surface-tertiary px-3 py-2 mt-4">
      <div className="flex flex-row items-center gap-2">
        <StatusDot variant="success" isActive={false} isVisible={true} />
        <span className="inline-flex items-center rounded-md text-accent py-0.5 text-sm font-medium">AskUserQuestion</span>
      </div>
      {questions.map((q, idx) => (
        <div key={idx} className="text-sm text-ink-700 ml-4">{q.question}</div>
      ))}
    </div>
  );
};

const SystemInfoCard = ({ message, showIndicator = false }: { message: SDKMessage; showIndicator?: boolean }) => {
  const { t } = useTranslation();
  const showSystemMessage = useAppStore((state) => state.showSystemMessage);
  
  // 如果设置为不显示，返回 null
  if (!showSystemMessage) {
    return null;
  }
  
  if (message.type !== "system" || !("subtype" in message) || message.subtype !== "init") return null;

  const systemMsg = message as any;

  const InfoItem = ({ name, value }: { name: string; value: string }) => (
    <div className="text-[14px]">
      <span className="mr-4 font-normal">{name}</span>
      <span className="font-light">{value}</span>
    </div>
  );

  const displayModel = systemMsg.configuredModel || systemMsg.model || "-";

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="header text-accent flex items-center gap-2">
        <StatusDot variant="success" isActive={showIndicator} isVisible={showIndicator} />
        {t('events.systemInit')}
      </div>
      <div className="flex flex-col rounded-xl px-4 py-2 border border-ink-900/10 bg-surface-secondary space-y-1">
        <InfoItem name={t('events.sessionId')} value={systemMsg.session_id || "-"} />
        <InfoItem name={t('events.modelName')} value={displayModel} />
        <InfoItem name={t('events.permissionMode')} value={systemMsg.permissionMode || "-"} />
        <InfoItem name={t('events.workingDirectory')} value={systemMsg.cwd || "-"} />
      </div>
    </div>
  );
};

const UserMessageCard = ({ message }: { message: { type: "user_prompt"; prompt: string } }) => {
  return (
    <div className="flex justify-end mt-4">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-surface-tertiary px-4 py-3 text-ink-800">
        <div className="prose max-w-none">
          <MDContent text={message.prompt} />
        </div>
      </div>
    </div>
  );
};

export function MessageCard({
  message,
  isLast = false,
  isRunning = false,
  permissionRequest,
  onPermissionResult
}: {
  message: StreamMessage;
  isLast?: boolean;
  isRunning?: boolean;
  permissionRequest?: PermissionRequest;
  onPermissionResult?: (toolUseId: string, result: PermissionResult) => void;
}) {
  const showIndicator = isLast && isRunning;

  // 过滤掉不应显示的系统消息类型
  // 这些是内部系统消息，不应在用户界面显示
  // 使用类型断言避免类型检查冲突
  const messageType = message.type as string;
  if (messageType === "status" ||
      messageType === "hook_response" ||
      messageType === "tool_progress" ||
      messageType === "auth_status" ||
      messageType === "task_notification" ||
      messageType === "compact_boundary") {
    return null;
  }

  if (message.type === "user_prompt") {
    return <UserMessageCard message={message} />;
  }

  const sdkMessage = message as SDKMessage;

  // 使用 SystemInfoCard 组件（内部会根据设置决定是否显示）
  if (sdkMessage.type === "system") {
    return <SystemInfoCard message={sdkMessage} showIndicator={showIndicator} />;
  }

  if (sdkMessage.type === "result") {
    if (sdkMessage.subtype === "success") {
      return <SessionResult message={sdkMessage} />;
    }
    return (
      <div className="flex flex-col gap-2 mt-4">
        <div className="header text-error">Session Error</div>
        <div className="rounded-xl bg-error-light p-3">
          <pre className="text-sm text-error whitespace-pre-wrap">{JSON.stringify(sdkMessage, null, 2)}</pre>
        </div>
      </div>
    );
  }

  if (sdkMessage.type === "assistant") {
    const { t } = useTranslation();
    const contents = sdkMessage.message.content;

    return (
      <>
        {contents.map((content: MessageContent, idx: number) => {
          const isLastContent = idx === contents.length - 1;
          if (content.type === "thinking") {
            // 只跳过明确标记为 "(no content)" 的内容
            if (content.thinking && content.thinking.trim() === "(no content)") {
              return null;
            }
            return <AssistantBlockCard key={idx} title={t('events.thinking')} text={content.thinking || ""} showIndicator={isLastContent && showIndicator} />;
          }
          if (content.type === "text") {
            // 只跳过明确标记为 "(no content)" 的内容
            if (content.text && content.text.trim() === "(no content)") {
              return null;
            }
            return <AssistantBlockCard key={idx} title={t('events.assistant')} text={content.text || ""} showIndicator={isLastContent && showIndicator} />;
          }
          if (content.type === "tool_use") {
            if (content.name === "AskUserQuestion") {
              return <AskUserQuestionCard key={idx} messageContent={content} permissionRequest={permissionRequest} onPermissionResult={onPermissionResult} />;
            }
            return <ToolUseCard key={idx} messageContent={content} showIndicator={isLastContent && showIndicator} />;
          }
          return null;
        })}
      </>
    );
  }

  if (sdkMessage.type === "user") {
    const contents = sdkMessage.message.content;
    if (Array.isArray(contents)) {
      return (
        <>
          {contents.map((content: any, idx: number) => {
            if (content.type === "tool_result") {
              return <ToolResult key={idx} messageContent={content} />;
            }
            return null;
          })}
        </>
      );
    }
  }

  return null;
}

export { MessageCard as EventCard };
