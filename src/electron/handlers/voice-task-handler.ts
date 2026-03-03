/**
 * 语音任务流水线：收到音频 → 转写 → 创建会话并启动
 */

import type { ServerEvent } from "../types.js";
import type { SessionStore } from "../storage/session-store.js";
import type { RunnerHandle } from "../libs/runner.js";
import { getVoiceSettings } from "../storage/voice-store.js";
import { transcribeWithVoiceApi } from "../services/voice-service.js";
import { handleSessionStart } from "./session-handlers.js";
import { generateSessionTitle } from "../utils/util.js";
import { log } from "../logger.js";

const DEFAULT_ALLOWED_TOOLS = "Read,Edit,Bash";

let cancelCurrentVoiceTask: (() => void) | null = null;

/**
 * 运行语音任务：转写 → 生成标题 → session.start
 * 通过 emit 发送 voice-task.status；可被 cancel 中断
 * mimeType 由渲染进程根据语音 API 类型传入（qwen-asr 用 audio/wav，whisper 用 audio/webm）
 */
export function runVoiceTask(
  audioBase64: string,
  mimeType: "audio/wav" | "audio/webm",
  sessions: SessionStore,
  runnerHandles: Map<string, RunnerHandle>,
  emit: (event: ServerEvent) => void
): void {
  let cancelled = false;
  cancelCurrentVoiceTask = () => {
    cancelled = true;
  };

  const settings = getVoiceSettings();
  const config = settings.voiceApiConfig;
  const voiceCwd = settings.voiceCwd?.trim();

  if (!config?.baseURL?.trim() || !config?.apiKey?.trim()) {
    emit({
      type: "voice-task.status",
      payload: { stage: "error", error: "未配置语音大模型" },
    });
    cancelCurrentVoiceTask = null;
    return;
  }
  if (!voiceCwd) {
    emit({
      type: "voice-task.status",
      payload: { stage: "error", error: "未配置语音任务工作目录" },
    });
    cancelCurrentVoiceTask = null;
    return;
  }

  const done = (result: { stage: "done"; sessionId: string } | { stage: "error"; error: string; rawText?: string }) => {
    cancelCurrentVoiceTask = null;
    emit({ type: "voice-task.status", payload: result });
  };

  (async () => {
    emit({ type: "voice-task.status", payload: { stage: "transcribing" } });

    let text: string;
    try {
      const buffer = Buffer.from(audioBase64, "base64");
      if (cancelled) return;
      text = await transcribeWithVoiceApi(buffer, config, mimeType);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error("[voice-task] Transcribe failed", err);
      done({ stage: "error", error: message });
      return;
    }

    if (cancelled) return;
    if (!text?.trim()) {
      done({ stage: "error", error: "转写结果为空", rawText: text });
      return;
    }

    emit({ type: "voice-task.status", payload: { stage: "session_starting" } });

    let title: string;
    try {
      title = await generateSessionTitle(text);
    } catch (err) {
      log.error("[voice-task] Generate title failed", err);
      done({ stage: "error", error: "生成标题失败", rawText: text });
      return;
    }

    if (cancelled) return;

    try {
      const sessionId = handleSessionStart(sessions, runnerHandles, emit, {
        title,
        prompt: text,
        cwd: voiceCwd,
        allowedTools: DEFAULT_ALLOWED_TOOLS,
      });
      emit({ type: "voice-task.status", payload: { stage: "running", sessionId } });
      done({ stage: "done", sessionId });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error("[voice-task] Session start failed", err);
      done({ stage: "error", error: message, rawText: text });
    }
  })();
}

/**
 * 取消当前正在执行的语音任务
 */
export function cancelVoiceTask(): void {
  if (cancelCurrentVoiceTask) {
    cancelCurrentVoiceTask();
    cancelCurrentVoiceTask = null;
  }
}
