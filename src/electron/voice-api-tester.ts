/**
 * 语音 API 连接测试：校验 Base URL、API Key、接口类型是否可用
 * - whisper：POST /audio/transcriptions（最小 multipart）
 * - qwen-asr：POST /chat/completions（最小 input_audio）
 */

import type { VoiceApiConfig } from "./storage/voice-store.js";
import { log } from "./logger.js";

export interface VoiceTestResult {
  success: boolean;
  message: string;
  details?: string;
  responseTime?: number;
}

// 最小音频占位（仅用于测试连通性与鉴权，不期望返回有效转写）
const MINIMAL_AUDIO = Buffer.alloc(64);

function buildWhisperMultipart(model: string): { body: Buffer; boundary: string } {
  const boundary = "----VoiceTestBoundary" + Date.now();
  const CRLF = "\r\n";
  const parts: Buffer[] = [];
  const field = (name: string, value: string) => {
    parts.push(
      Buffer.from(
        `--${boundary}${CRLF}Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}${value}${CRLF}`,
        "utf-8"
      )
    );
  };
  const file = (name: string, filename: string, buffer: Buffer, mime: string) => {
    parts.push(
      Buffer.from(
        `--${boundary}${CRLF}Content-Disposition: form-data; name="${name}"; filename="${filename}"${CRLF}Content-Type: ${mime}${CRLF}${CRLF}`,
        "utf-8"
      )
    );
    parts.push(buffer);
    parts.push(Buffer.from(CRLF, "utf-8"));
  };
  field("model", model);
  file("file", "audio.webm", MINIMAL_AUDIO, "audio/webm");
  parts.push(Buffer.from(`--${boundary}--${CRLF}`, "utf-8"));
  return { body: Buffer.concat(parts), boundary };
}

async function testWhisper(config: VoiceApiConfig): Promise<VoiceTestResult> {
  const start = Date.now();
  const baseURL = config.baseURL.replace(/\/$/, "");
  const url = `${baseURL}/audio/transcriptions`;
  const model = config.model?.trim() || "whisper-1";
  const { body, boundary } = buildWhisperMultipart(model);

  log.info("[voice-api-tester] Testing Whisper", { url, model });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": String(body.length),
    },
    body: new Uint8Array(body),
  });

  const responseTime = Date.now() - start;

  if (res.ok) {
    return {
      success: true,
      message: "连接成功",
      details: "语音 API 配置正确，可以正常使用",
      responseTime,
    };
  }

  switch (res.status) {
    case 400:
      return {
        success: true,
        message: "连接成功",
        details: "端点与鉴权正常；当前为测试音频，实际录音转写请以使用为准。",
        responseTime,
      };
    case 401:
      return {
        success: false,
        message: "认证失败",
        details: "API Key 不正确或已过期",
        responseTime,
      };
    case 403:
      return {
        success: false,
        message: "权限被拒绝",
        details: "API Key 没有访问此资源的权限",
        responseTime,
      };
    case 404:
      return {
        success: false,
        message: "API 端点不存在",
        details: `请检查 Base URL 是否包含 /audio/transcriptions 或接口类型是否选错。当前请求: ${url}`,
        responseTime,
      };
    default:
      const text = await res.text();
      return {
        success: false,
        message: `请求失败 (${res.status})`,
        details: text || res.statusText,
        responseTime,
      };
  }
}

async function testQwenAsr(config: VoiceApiConfig): Promise<VoiceTestResult> {
  const start = Date.now();
  const baseURL = config.baseURL.replace(/\/$/, "");
  const url = `${baseURL}/chat/completions`;
  const model = config.model?.trim() || "qwen3-asr-flash";
  const base64 = MINIMAL_AUDIO.toString("base64");
  const dataUri = `data:audio/webm;base64,${base64}`;

  log.info("[voice-api-tester] Testing Qwen-ASR", { url, model });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        {
          role: "user",
          content: [{ type: "input_audio", input_audio: { data: dataUri } }],
        },
      ],
    }),
  });

  const responseTime = Date.now() - start;

  if (res.ok) {
    return {
      success: true,
      message: "连接成功",
      details: "语音 API 配置正确，可以正常使用",
      responseTime,
    };
  }

  switch (res.status) {
    case 400:
      return {
        success: true,
        message: "连接成功",
        details: "端点与鉴权正常；当前为测试音频，实际录音转写请以使用为准。",
        responseTime,
      };
    case 401:
      return {
        success: false,
        message: "认证失败",
        details: "API Key 不正确或已过期",
        responseTime,
      };
    case 403:
      return {
        success: false,
        message: "权限被拒绝",
        details: "API Key 没有访问此资源的权限",
        responseTime,
      };
    case 404:
      return {
        success: false,
        message: "API 端点不存在",
        details: `请检查 Base URL（通常为 .../compatible-mode/v1）。当前请求: ${url}`,
        responseTime,
      };
    default:
      const text = await res.text();
      return {
        success: false,
        message: `请求失败 (${res.status})`,
        details: text || res.statusText,
        responseTime,
      };
  }
}

export async function testVoiceApiConnection(
  config: VoiceApiConfig
): Promise<VoiceTestResult> {
  if (!config.baseURL?.trim() || !config.apiKey?.trim()) {
    return {
      success: false,
      message: "配置不完整",
      details: "请填写 Base URL 和 API Key",
    };
  }

  try {
    const apiType = config.apiType ?? "whisper";
    if (apiType === "qwen-asr") {
      return await testQwenAsr(config);
    }
    return await testWhisper(config);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log.error("[voice-api-tester] Test failed", err);
    if (message.includes("fetch") || (err as NodeJS.ErrnoException).code === "ENOTFOUND") {
      return {
        success: false,
        message: "无法解析服务器地址",
        details: `请检查 Base URL 是否正确。当前: ${config.baseURL}`,
      };
    }
    if ((err as NodeJS.ErrnoException).code === "ECONNREFUSED") {
      return {
        success: false,
        message: "连接被拒绝",
        details: "请检查 Base URL 和网络",
      };
    }
    if ((err as NodeJS.ErrnoException).code === "ETIMEDOUT") {
      return {
        success: false,
        message: "连接超时",
        details: "请检查网络或稍后重试",
      };
    }
    return {
      success: false,
      message: "测试失败",
      details: message,
    };
  }
}
