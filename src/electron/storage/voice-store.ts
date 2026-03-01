/**
 * 语音相关配置存储
 * - 语音大模型配置（Base URL、API Key、可选模型）
 * - 语音任务默认工作目录（cwd）
 * - 是否开启 Fn 键语音转写
 */

import { app } from "electron";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { log } from "../logger.js";

/** 语音 API 接口类型 */
export type VoiceApiType = "whisper" | "qwen-asr";

export type VoiceApiConfig = {
  baseURL: string;
  apiKey: string;
  model?: string;
  /** 接口类型：whisper=OpenAI Whisper 兼容 /audio/transcriptions；qwen-asr=百炼 Qwen3-ASR chat/completions */
  apiType?: VoiceApiType;
};

export type VoiceSettings = {
  voiceApiConfig?: VoiceApiConfig | null;
  voiceCwd?: string;
  fnVoiceEnabled: boolean;
};

const FILENAME = "voice-settings.json";
const DEFAULT_SETTINGS: VoiceSettings = {
  voiceApiConfig: null,
  voiceCwd: "",
  fnVoiceEnabled: false,
};

function getVoiceSettingsPath(): string {
  return join(app.getPath("userData"), FILENAME);
}

function loadRaw(): VoiceSettings {
  const path = getVoiceSettingsPath();
  if (!existsSync(path)) {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw) as Partial<VoiceSettings>;
    return {
      voiceApiConfig: parsed.voiceApiConfig ?? DEFAULT_SETTINGS.voiceApiConfig,
      voiceCwd: parsed.voiceCwd ?? DEFAULT_SETTINGS.voiceCwd,
      fnVoiceEnabled: parsed.fnVoiceEnabled ?? DEFAULT_SETTINGS.fnVoiceEnabled,
    };
  } catch (e) {
    log.warn("[voice-store] Failed to load voice settings, using defaults", e);
    return { ...DEFAULT_SETTINGS };
  }
}

function save(settings: VoiceSettings): void {
  const filePath = getVoiceSettingsPath();
  const dir = app.getPath("userData");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, JSON.stringify(settings, null, 2), "utf-8");
}

let cached: VoiceSettings | null = null;

function getSettings(): VoiceSettings {
  if (!cached) {
    cached = loadRaw();
  }
  return { ...cached };
}

function writeSettings(update: Partial<VoiceSettings>): void {
  const current = getSettings();
  cached = { ...current, ...update };
  save(cached!);
}

/**
 * 获取语音设置（含语音大模型配置、cwd、Fn 开关）
 */
export function getVoiceSettings(): VoiceSettings {
  return getSettings();
}

/**
 * 设置语音大模型配置
 */
export function setVoiceApiConfig(config: VoiceApiConfig | null): void {
  writeSettings({ voiceApiConfig: config ?? undefined });
}

/**
 * 设置语音任务默认工作目录
 */
export function setVoiceCwd(cwd: string): void {
  writeSettings({ voiceCwd: cwd });
}

/**
 * 设置是否开启 Fn 键语音转写
 */
export function setFnVoiceEnabled(enabled: boolean): void {
  writeSettings({ fnVoiceEnabled: enabled });
}

/**
 * 是否满足语音流程前置条件：已配置语音大模型、已配置 cwd、已开启 Fn 开关
 */
export function canStartVoiceTask(): boolean {
  const s = getSettings();
  return Boolean(
    s.fnVoiceEnabled &&
      s.voiceApiConfig?.baseURL?.trim() &&
      s.voiceApiConfig?.apiKey?.trim() &&
      s.voiceCwd?.trim()
  );
}
