/**
 * 语音转写服务：支持 Whisper 兼容接口 与 阿里百炼 Qwen3-ASR（OpenAI 兼容 chat/completions）
 */

import type { VoiceApiConfig } from "../storage/voice-store.js";
import { log } from "../logger.js";

// ========== Whisper 兼容：POST /audio/transcriptions multipart ==========

function buildMultipartBody(audioBuffer: Buffer, model: string): { body: Buffer; boundary: string } {
  const boundary = "----VoiceTaskBoundary" + Date.now();
  const CRLF = "\r\n";
  const parts: Buffer[] = [];

  const field = (name: string, value: string) => {
    parts.push(Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}${value}${CRLF}`, "utf-8"));
  };
  const file = (name: string, filename: string, buffer: Buffer, mime: string) => {
    parts.push(Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="${name}"; filename="${filename}"${CRLF}Content-Type: ${mime}${CRLF}${CRLF}`, "utf-8"));
    parts.push(buffer);
    parts.push(Buffer.from(CRLF, "utf-8"));
  };

  field("model", model);
  file("file", "audio.webm", audioBuffer, "audio/webm");
  parts.push(Buffer.from(`--${boundary}--${CRLF}`, "utf-8"));

  return { body: Buffer.concat(parts), boundary };
}

async function transcribeWhisper(audioBuffer: Buffer, config: VoiceApiConfig): Promise<string> {
  const baseURL = config.baseURL.replace(/\/$/, "");
  const url = `${baseURL}/audio/transcriptions`;
  const model = config.model?.trim() || "whisper-1";

  const { body, boundary } = buildMultipartBody(audioBuffer, model);
  const bodyInit = new Uint8Array(body);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": String(body.length),
    },
    body: bodyInit,
  });

  if (!res.ok) {
    const text = await res.text();
    log.error("[voice-service] Whisper API error", { status: res.status, body: text });
    throw new Error(`语音 API 请求失败: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { text?: string; data?: Array<{ text?: string }> };
  const text = json.text ?? json.data?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) {
    log.warn("[voice-service] Empty Whisper response", json);
    throw new Error("语音 API 返回内容为空");
  }
  return text.trim();
}

// ========== 阿里百炼 Qwen3-ASR：OpenAI 兼容 POST /chat/completions ==========
// 文档：https://help.aliyun.com/zh/model-studio/qwen-asr-api-reference（或控制台 #/api/?type=model&url=2986952）
// 入参：model、messages（role=user, content=[{ type:"input_audio", input_audio:{ data } }]）、stream、asr_options（可选）
// input_audio.data：公网 URL 或 Base64 的 Data URL（data:<mime>;base64,<base64>）。文档示例 MIME：audio/wav、audio/mpeg。
// 当前使用浏览器录音格式 audio/webm；若识别异常可考虑转为 wav/mp3。编码后总大小需 ≤10MB。
async function transcribeQwenAsr(audioBuffer: Buffer, config: VoiceApiConfig): Promise<string> {
  const baseURL = config.baseURL.replace(/\/$/, "");
  const url = `${baseURL}/chat/completions`;
  const model = config.model?.trim() || "qwen3-asr-flash";

  // 文档：Base64 用 Data URL 格式 data:<mime>;base64,<base64>
  // 我们录音格式为 webm，MIME 为 audio/webm
  const base64 = audioBuffer.toString("base64");
  const dataUri = `data:audio/webm;base64,${base64}`;

  const body = {
    model,
    stream: false,
    messages: [
      {
        role: "user" as const,
        content: [
          {
            type: "input_audio" as const,
            input_audio: { data: dataUri },
          },
        ],
      },
    ],
    asr_options: {
      enable_itn: false,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    log.error("[voice-service] Qwen-ASR API error", { status: res.status, body: text });
    throw new Error(`语音 API 请求失败: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    log.warn("[voice-service] Empty Qwen-ASR response", json);
    throw new Error("语音 API 返回内容为空");
  }
  return text.trim();
}

// ========== 统一入口 ==========

/**
 * 调用语音 API 进行转写
 * - apiType 为 whisper（默认）：走 OpenAI Whisper 兼容 POST /audio/transcriptions
 * - apiType 为 qwen-asr：走阿里百炼 Qwen3-ASR，OpenAI 兼容 POST /chat/completions
 */
export async function transcribeWithVoiceApi(
  audioBuffer: Buffer,
  config: VoiceApiConfig
): Promise<string> {
  const apiType = config.apiType ?? "whisper";
  if (apiType === "qwen-asr") {
    return transcribeQwenAsr(audioBuffer, config);
  }
  return transcribeWhisper(audioBuffer, config);
}
