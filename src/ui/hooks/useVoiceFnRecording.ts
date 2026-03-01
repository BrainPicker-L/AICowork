/**
 * Fn 键语音录入：当设置满足时监听 Fn 按下/松开，录音并提交到主进程。
 * 支持两种触发方式：① 窗口内 keydown/keyup（仅窗口焦点时）；② 主进程全局 Fn 监听（通过独立 IPC 通道 voice-fn-key 下发，避免被长任务时的 server-event 队列阻塞）。
 */

import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "../store/useAppStore";
import type { ClientEvent } from "../types";

function isFnKey(ev: KeyboardEvent): boolean {
  return ev.key === "Fn" || ev.code === "Fn" || (ev as { keyCode?: number }).keyCode === 63;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      resolve(base64 ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function useVoiceFnRecording(
  voiceSettings: { fnVoiceEnabled: boolean; voiceApiConfig?: { baseURL?: string; apiKey?: string } | null; voiceCwd?: string } | null,
  sendEvent: (event: ClientEvent) => void
) {
  const setVoiceTaskStatus = useAppStore((s) => s.setVoiceTaskStatus);
  const recordingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const canStart = Boolean(
    voiceSettings?.fnVoiceEnabled &&
      voiceSettings?.voiceApiConfig?.baseURL?.trim() &&
      voiceSettings?.voiceApiConfig?.apiKey?.trim() &&
      voiceSettings?.voiceCwd?.trim()
  );

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    const stream = streamRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
    }
    stream?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    recordingRef.current = false;
  }, []);

  useEffect(() => {
    if (!canStart || !sendEvent) return;

    const handleKeyDown = async (ev?: KeyboardEvent) => {
      if (ev && !isFnKey(ev)) return;
      if (recordingRef.current) return;
      ev?.preventDefault();
      recordingRef.current = true;
      setVoiceTaskStatus({ stage: "recording" });
      sendEvent({ type: "voice-task.recording-started" });
      chunksRef.current = [];

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr;
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        mr.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          if (blob.size < 2000) {
            setVoiceTaskStatus({ stage: "error", error: "录音过短，请按住 Fn 说话后再松开" });
            stopRecording();
            return;
          }
          const base64 = await blobToBase64(blob);
          sendEvent({ type: "voice-task.submit-audio", payload: { audioBase64: base64 } });
          stopRecording();
        };
        mr.start(100);
      } catch (err) {
        setVoiceTaskStatus({ stage: "error", error: "无法访问麦克风" });
        recordingRef.current = false;
      }
    };

    const handleKeyUp = (ev?: KeyboardEvent) => {
      if (ev && !isFnKey(ev)) return;
      ev?.preventDefault();
      const mr = mediaRecorderRef.current;
      if (mr && mr.state === "recording") {
        mr.stop();
      } else if (recordingRef.current) {
        recordingRef.current = false;
        setVoiceTaskStatus(null);
      }
    };

    // 窗口内按键（仅窗口焦点时）
    window.addEventListener("keydown", handleKeyDown as (ev: KeyboardEvent) => void, true);
    window.addEventListener("keyup", handleKeyUp as (ev: KeyboardEvent) => void, true);

    // 主进程全局 Fn 键：独立通道，长任务时不被 server-event 队列阻塞
    let unregisterVoiceFn: (() => void) | undefined;
    if (window.electron?.registerVoiceFnKey) {
      unregisterVoiceFn = window.electron.registerVoiceFnKey((key) => {
        if (key === "down") handleKeyDown();
        else handleKeyUp();
      });
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown as (ev: KeyboardEvent) => void, true);
      window.removeEventListener("keyup", handleKeyUp as (ev: KeyboardEvent) => void, true);
      unregisterVoiceFn?.();
      stopRecording();
    };
  }, [canStart, sendEvent, setVoiceTaskStatus, stopRecording]);

  return canStart;
}
