/**
 * 语音任务状态小图标：固定右下角，四阶段状态，点击跳转本次对话
 */

import { useCallback } from "react";
import { useAppStore } from "../store/useAppStore";
import type { VoiceTaskStage } from "../types";

const STAGE_ICON: Record<VoiceTaskStage, string> = {
  recording: "🔴",
  transcribing: "⏳",
  session_starting: "⏳",
  running: "⏳",
  done: "✓",
  error: "!",
};

export function VoiceTaskIcon() {
  const voiceTaskStatus = useAppStore((s) => s.voiceTaskStatus);
  const setActiveSessionId = useAppStore((s) => s.setActiveSessionId);
  const setVoiceTaskStatus = useAppStore((s) => s.setVoiceTaskStatus);

  const handleClick = useCallback(() => {
    if (!voiceTaskStatus) return;
    if (voiceTaskStatus.sessionId) {
      setActiveSessionId(voiceTaskStatus.sessionId);
    }
    if (voiceTaskStatus.stage === "done" || voiceTaskStatus.stage === "error") {
      setVoiceTaskStatus(null);
    }
  }, [voiceTaskStatus, setActiveSessionId, setVoiceTaskStatus]);

  if (!voiceTaskStatus) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-ink-900/10 bg-surface shadow-elevated transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent"
      title={voiceTaskStatus.sessionId ? "跳转到本次对话" : undefined}
      aria-label="语音任务状态"
    >
      <span className="text-lg" role="img" aria-hidden>
        {STAGE_ICON[voiceTaskStatus.stage]}
      </span>
    </button>
  );
}
