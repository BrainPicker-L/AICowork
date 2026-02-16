/**
 * 钉钉机器人核心服务（多机器人）
 * 使用 BotInstance Map 管理多个机器人实例
 *
 * 参考 openclaw 设计：
 * - AI Card 流式回复（CREATE → STREAM → FINISH）
 * - API 重试 + 卡片降级
 * - 会话生命周期管理
 */

import { DWClient, TOPIC_ROBOT, EventAck } from "dingtalk-stream";
import axios from "axios";
import { log } from "../logger.js";
import { getSessionStore } from "../storage/session-store.js";
import { runClaude, type RunnerHandle } from "../libs/runner.js";
import type {
  DingTalkConfig,
  DingTalkConnectionStatus,
  DingTalkInboundMessage,
  DingTalkSessionMeta,
  DingTalkBotSummary,
  AICardInstance,
  ServerEvent,
} from "../types.js";

// ==================== 类型定义 ====================

type EmitFn = (event: ServerEvent) => void;

interface TokenCache {
  accessToken: string;
  expiry: number;
}

interface BotInstance {
  name: string;
  config: DingTalkConfig;
  client: DWClient | null;
  status: DingTalkConnectionStatus;
  peerSessionMap: Map<string, string>;
  runnerHandles: Map<string, RunnerHandle>;
  processedMessages: Map<string, number>;
  reconnectAttempts: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
}

// ==================== 模块状态 ====================

const botInstances = new Map<string, BotInstance>();

// 共享 Token 缓存（按 clientId 做 key）
const tokenCache = new Map<string, TokenCache>();

// 常量
const MESSAGE_DEDUP_TTL = 60_000;
const MESSAGE_DEDUP_MAX_SIZE = 1000;
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 60_000;
const RECONNECT_JITTER = 0.3;

// 流式卡片常量
const CARD_STREAM_INTERVAL_MS = 500;
const CARD_STREAM_MIN_CHARS = 200;
// Token 即将过期的安全缓冲（60s）
const TOKEN_EXPIRY_BUFFER_MS = 60_000;
// 长时间卡片需要刷新 Token 的阈值（1.5h）
const CARD_TOKEN_REFRESH_THRESHOLD_MS = 90 * 60 * 1000;

// ==================== 工具函数 ====================

/**
 * 掩码敏感数据（仅显示前3后3字符）
 */
function maskSensitive(value: string): string {
  if (!value || value.length <= 8) return "***";
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}

/**
 * 判断错误是否可重试（401/429/5xx）
 */
function isRetryableError(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  const status = err.response?.status;
  return status === 401 || status === 429 || (status !== undefined && status >= 500);
}

/**
 * 带指数退避的重试包装器
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 200, label = "API call" } = options;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isRetryableError(err) || attempt === maxRetries) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt);
      log.warn(`[dingtalk] ${label} failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}

// ==================== 公开 API ====================

/**
 * 获取指定机器人连接状态
 */
export function getDingTalkStatus(name: string): DingTalkConnectionStatus {
  const bot = botInstances.get(name);
  return bot?.status ?? "disconnected";
}

/**
 * 获取所有机器人状态摘要
 */
export function getAllDingTalkStatuses(): DingTalkBotSummary[] {
  const summaries: DingTalkBotSummary[] = [];
  for (const [name, bot] of botInstances) {
    summaries.push({
      name,
      enabled: bot.config.enabled,
      status: bot.status,
      clientId: bot.config.clientId,
    });
  }
  return summaries;
}

/**
 * 连接指定机器人
 */
export async function connectDingTalk(
  name: string,
  config: DingTalkConfig,
  emit: EmitFn
): Promise<void> {
  if (botInstances.has(name)) {
    await disconnectDingTalk(name, emit);
  }

  const bot: BotInstance = {
    name,
    config,
    client: null,
    status: "connecting",
    peerSessionMap: new Map(),
    runnerHandles: new Map(),
    processedMessages: new Map(),
    reconnectAttempts: 0,
    reconnectTimer: null,
  };
  botInstances.set(name, bot);

  emit({ type: "dingtalk.status", payload: { botName: name, status: "connecting" } });

  try {
    bot.client = new DWClient({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      debug: false,
    });

    bot.client.registerAllEventListener((msg: any) => {
      // 仅记录日志，不处理消息——实际机器人消息由 registerCallbackListener 处理
      // 之前的 `|| msg.data` 条件过于宽泛，会把非机器人事件也当聊天处理，导致串台
      log.debug(`[dingtalk:${name}] Received EVENT: topic=${msg.headers?.topic}, type=${msg.type}`);
      return { status: EventAck.SUCCESS, message: "OK" };
    });

    bot.client.registerCallbackListener(TOPIC_ROBOT, async (res: any) => {
      log.info(`[dingtalk:${name}] Received CALLBACK: topic=${res.headers?.topic}, messageId=${res.headers?.messageId}`);
      try {
        const data: DingTalkInboundMessage = JSON.parse(res.data);
        await handleInboundMessage(bot, data, emit);
      } catch (err) {
        log.error(`[dingtalk:${name}] Failed to handle callback message:`, err);
      }
      try {
        bot.client?.socketCallBackResponse(res.headers.messageId, { status: "SUCCESS", message: "OK" });
      } catch {
        // ignore ack error
      }
    });

    await bot.client.connect();

    bot.status = "connected";
    bot.reconnectAttempts = 0;
    emit({ type: "dingtalk.status", payload: { botName: name, status: "connected" } });
    log.info(`[dingtalk:${name}] Connected successfully`);
  } catch (error) {
    bot.status = "failed";
    const errorMsg = error instanceof Error ? error.message : String(error);
    emit({ type: "dingtalk.status", payload: { botName: name, status: "failed", error: errorMsg } });
    log.error(`[dingtalk:${name}] Connection failed:`, error);

    scheduleReconnect(bot, emit);
  }
}

/**
 * 断开指定机器人
 */
export async function disconnectDingTalk(name: string, emit: EmitFn): Promise<void> {
  const bot = botInstances.get(name);
  if (!bot) return;

  if (bot.reconnectTimer) {
    clearTimeout(bot.reconnectTimer);
    bot.reconnectTimer = null;
  }
  bot.reconnectAttempts = 0;

  if (bot.client) {
    try {
      bot.client.disconnect();
    } catch (err) {
      log.warn(`[dingtalk:${name}] Error during disconnect:`, err);
    }
    bot.client = null;
  }

  bot.status = "disconnected";
  botInstances.delete(name);
  emit({ type: "dingtalk.status", payload: { botName: name, status: "disconnected" } });
  log.info(`[dingtalk:${name}] Disconnected`);
}

/**
 * 断开所有机器人（用于 cleanup）
 */
export async function disconnectAllDingTalk(emit: EmitFn): Promise<void> {
  const names = [...botInstances.keys()];
  for (const name of names) {
    await disconnectDingTalk(name, emit);
  }
}

/**
 * 测试钉钉连接（无状态）
 */
export async function testDingTalkConnection(
  config: Partial<DingTalkConfig>
): Promise<{ success: boolean; message: string }> {
  if (!config.clientId || !config.clientSecret) {
    return { success: false, message: "Client ID and Client Secret are required" };
  }

  try {
    const token = await fetchAccessToken(config.clientId, config.clientSecret);
    if (token) {
      return { success: true, message: "Connection successful" };
    }
    return { success: false, message: "Failed to obtain access token" };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Connection failed: ${msg}` };
  }
}

/**
 * 应用启动时自动连接所有 enabled 的机器人
 */
export async function autoConnectDingTalk(emit: EmitFn): Promise<void> {
  try {
    const { loadDingTalkBots } = await import("../storage/dingtalk-store.js");
    const bots = await loadDingTalkBots();

    for (const [name, config] of Object.entries(bots)) {
      if (config.enabled && config.clientId && config.clientSecret) {
        log.info(`[dingtalk] Auto-connecting bot '${name}'...`);
        connectDingTalk(name, config, emit).catch((error) => {
          log.error(`[dingtalk] Auto-connect failed for bot '${name}':`, error);
        });
      }
    }
  } catch (error) {
    log.error("[dingtalk] Auto-connect failed:", error);
  }
}

// ==================== 消息处理 ====================

async function handleInboundMessage(
  bot: BotInstance,
  data: DingTalkInboundMessage,
  emit: EmitFn
): Promise<void> {
  if (isMessageProcessed(bot, data.msgId)) {
    log.debug(`[dingtalk:${bot.name}] Duplicate message ignored: ${data.msgId}`);
    return;
  }
  markMessageProcessed(bot, data.msgId);

  if (!checkPolicy(data, bot.config)) {
    log.info(
      `[dingtalk:${bot.name}] Message blocked by policy: sender=${data.senderId}, type=${data.conversationType}`
    );
    return;
  }

  const text = extractMessageText(data);
  if (!text.trim()) {
    log.debug(`[dingtalk:${bot.name}] Empty message, ignoring`);
    return;
  }

  const isGroup = data.conversationType === "2";
  const peerId = isGroup ? data.conversationId : data.senderId;
  const senderName = data.senderNick || data.senderId;
  const title = isGroup
    ? `[钉钉群] ${data.conversationTitle || data.conversationId}`
    : `[钉钉] ${senderName}`;

  log.info(
    `[dingtalk:${bot.name}] Received from ${senderName} (${isGroup ? "group" : "dm"}): ${text.slice(0, 100)}`
  );

  const meta: DingTalkSessionMeta = {
    botName: bot.name,
    senderId: data.senderId,
    senderStaffId: data.senderStaffId,
    senderNick: data.senderNick,
    conversationType: data.conversationType,
    conversationId: data.conversationId,
    conversationTitle: data.conversationTitle,
    sessionWebhook: data.sessionWebhook,
  };

  const sessions = getSessionStore();
  let existingSessionId = bot.peerSessionMap.get(peerId);

  // 内存缓存命中 → 检查 session 是否仍然存在
  if (existingSessionId) {
    const session = sessions.getSession(existingSessionId);
    if (session) {
      await continueSession(bot, existingSessionId, text, meta, emit);
      return;
    }
    // session 已被删除，清理过期映射
    bot.peerSessionMap.delete(peerId);
    bot.runnerHandles.delete(existingSessionId);
    existingSessionId = undefined;
  }

  // 内存缓存未命中（如应用重启后）→ 从 DB 恢复映射
  if (!existingSessionId) {
    const dbSession = sessions.findDingTalkSession(bot.name, peerId);
    if (dbSession) {
      log.info(`[dingtalk:${bot.name}] Restored session ${dbSession.id} from DB for peer ${peerId}`);
      bot.peerSessionMap.set(peerId, dbSession.id);
      await continueSession(bot, dbSession.id, text, meta, emit);
      return;
    }
  }

  // 完全没有历史 session → 新建
  await startNewSession(bot, peerId, title, text, meta, emit);
}

function checkPolicy(data: DingTalkInboundMessage, config: DingTalkConfig): boolean {
  const isGroup = data.conversationType === "2";

  if (!isGroup) {
    if (config.dmPolicy === "allowlist") {
      return config.allowFrom.some(
        (id) => id.toLowerCase() === data.senderId.toLowerCase()
      );
    }
    return true;
  } else {
    if (config.groupPolicy === "allowlist") {
      return config.allowGroups.some(
        (id) => id.toLowerCase() === data.conversationId.toLowerCase()
      );
    }
    return true;
  }
}

function extractMessageText(data: DingTalkInboundMessage): string {
  if (data.msgtype === "text") {
    return data.text?.content?.trim() || "";
  }
  if (data.msgtype === "richText") {
    const parts = data.content?.richText || [];
    let text = "";
    for (const part of parts) {
      if (part.text && (part.type === "text" || part.type === undefined)) {
        text += part.text;
      }
      if (part.type === "at" && part.atName) {
        text += `@${part.atName} `;
      }
    }
    return text.trim() || "[富文本消息]";
  }
  if (data.msgtype === "audio" && data.content?.recognition) {
    return data.content.recognition;
  }
  return data.text?.content?.trim() || `[${data.msgtype}消息]`;
}

// ==================== 会话桥接 ====================

async function startNewSession(
  bot: BotInstance,
  peerId: string,
  title: string,
  prompt: string,
  meta: DingTalkSessionMeta,
  emit: EmitFn
): Promise<void> {
  const sessions = getSessionStore();
  const session = sessions.createSession({
    title,
    prompt,
    source: "dingtalk",
    dingtalkMeta: meta,
  });

  bot.peerSessionMap.set(peerId, session.id);
  sessions.updateSession(session.id, { status: "running", lastPrompt: prompt });

  emit({
    type: "session.status",
    payload: { sessionId: session.id, status: "running", title: session.title, source: "dingtalk" },
  });
  emit({
    type: "stream.user_prompt",
    payload: { sessionId: session.id, prompt },
  });

  const replyCollector = createReplyCollector(bot, session.id, meta, bot.config, emit);

  try {
    const handle = await runClaude({
      prompt,
      session,
      resumeSessionId: session.claudeSessionId,
      onEvent: replyCollector,
      onSessionUpdate: (updates) => {
        sessions.updateSession(session.id, updates);
      },
    });
    bot.runnerHandles.set(session.id, handle);
  } catch (error) {
    log.error(`[dingtalk:${bot.name}] Session ${session.id} failed to start:`, error);
    sessions.updateSession(session.id, { status: "error" });
    emit({
      type: "session.status",
      payload: { sessionId: session.id, status: "error", error: String(error) },
    });
  }
}

async function continueSession(
  bot: BotInstance,
  sessionId: string,
  prompt: string,
  meta: DingTalkSessionMeta,
  emit: EmitFn
): Promise<void> {
  const sessions = getSessionStore();
  const session = sessions.getSession(sessionId);
  if (!session) return;

  // 更新动态 meta（sessionWebhook 等字段可能随每条消息变化）
  sessions.updateDingtalkMeta(sessionId, meta);

  // 已完成或出错的会话 → 复用同一 session，仅清理旧 runner handle
  // (用户, 机器人) 始终保持 1 个 session，不再新建
  if (session.status === "completed" || session.status === "error") {
    bot.runnerHandles.delete(sessionId);
    // fall through 到下面的"创建新 runner"逻辑
  }

  const existingHandle = bot.runnerHandles.get(sessionId);

  if (existingHandle) {
    sessions.updateSession(sessionId, { status: "running", lastPrompt: prompt });
    emit({
      type: "session.status",
      payload: { sessionId, status: "running", title: session.title, source: "dingtalk" },
    });
    emit({
      type: "stream.user_prompt",
      payload: { sessionId, prompt },
    });
    existingHandle.addUserInput(prompt);
    return;
  }

  // runner handle 不存在（会话已完成/出错/异常退出），需要创建新的 runner
  if (session.status === "running") {
    log.warn(`[dingtalk:${bot.name}] Session ${sessionId} is 'running' but has no runner handle, re-creating runner`);
  }

  sessions.updateSession(sessionId, { status: "running", lastPrompt: prompt });
  emit({
    type: "session.status",
    payload: { sessionId, status: "running", title: session.title, source: "dingtalk" },
  });
  emit({
    type: "stream.user_prompt",
    payload: { sessionId, prompt },
  });

  const replyCollector = createReplyCollector(bot, sessionId, meta, bot.config, emit);

  try {
    const handle = await runClaude({
      prompt,
      session,
      resumeSessionId: session.claudeSessionId,
      onEvent: replyCollector,
      onSessionUpdate: (updates) => {
        sessions.updateSession(sessionId, updates);
      },
    });
    bot.runnerHandles.set(sessionId, handle);
  } catch (error) {
    log.error(`[dingtalk:${bot.name}] Session ${sessionId} failed to continue:`, error);
    sessions.updateSession(sessionId, { status: "error" });
    emit({
      type: "session.status",
      payload: { sessionId, status: "error", error: String(error) },
    });
  }
}

// ==================== 流式回复收集器 ====================

/**
 * 创建回复收集器，根据消息类型选择回复策略：
 * - Card 模式：创建 AI 卡片 → 流式更新 → 终结（实时体验）
 * - Markdown 模式：累积完整回复后一次性发送
 *
 * 卡片创建失败时自动降级为 Markdown。
 */
function createReplyCollector(
  bot: BotInstance,
  sessionId: string,
  meta: DingTalkSessionMeta,
  config: DingTalkConfig,
  originalEmit: EmitFn
): EmitFn {
  let replyText = "";
  const useCard = config.messageType === "card" && !!config.cardTemplateId;

  // Card 模式的流式状态
  let cardInstance: AICardInstance | null = null;
  let cardFallback = false;  // 卡片失败后降级标志
  let streamBuffer = "";
  let streamTimer: ReturnType<typeof setTimeout> | null = null;
  let isCreatingCard = false;

  /**
   * 将缓冲区内容流式推送到卡片
   */
  const flushCardStream = async (finalize: boolean) => {
    if (streamTimer) {
      clearTimeout(streamTimer);
      streamTimer = null;
    }

    if (!cardInstance || cardInstance.status === "FAILED") return;

    const content = replyText;
    if (!content && !finalize) return;

    try {
      await streamAICard(cardInstance, config, content, finalize);
      streamBuffer = "";
      if (finalize) {
        cardInstance.status = "FINISHED";
      } else if (cardInstance.status === "PROCESSING") {
        cardInstance.status = "INPUTING";
      }
    } catch (err) {
      log.error(`[dingtalk:${meta.botName}] Card stream update failed:`, err);
      cardInstance.status = "FAILED";
      cardFallback = true;
    }
  };

  /**
   * 调度缓冲刷新（节流）
   */
  const scheduleFlush = () => {
    if (streamTimer) return;
    if (streamBuffer.length >= CARD_STREAM_MIN_CHARS) {
      flushCardStream(false).catch(() => {});
    } else {
      streamTimer = setTimeout(() => {
        streamTimer = null;
        flushCardStream(false).catch(() => {});
      }, CARD_STREAM_INTERVAL_MS);
    }
  };

  /**
   * 初始化 AI 卡片（首次收到内容时调用）
   */
  const initCard = async () => {
    if (isCreatingCard || cardInstance || cardFallback) return;
    isCreatingCard = true;
    try {
      cardInstance = await createAICard(config, meta);
      log.info(`[dingtalk:${meta.botName}] AI card created: ${cardInstance.outTrackId}`);
    } catch (err) {
      log.warn(`[dingtalk:${meta.botName}] Card creation failed, falling back to markdown:`, err);
      cardFallback = true;
    } finally {
      isCreatingCard = false;
    }
  };

  return (event: ServerEvent) => {
    originalEmit(event);

    if (event.type !== "stream.message" || event.payload.sessionId !== sessionId) {
      return;
    }

    const message = event.payload.message;

    // === Card 模式：监听 stream_event 获取实时文本增量 ===
    if (useCard && !cardFallback && "type" in message && message.type === "stream_event") {
      const evt = (message as any).event;
      if (evt?.type === "content_block_delta" && evt.delta?.text) {
        const delta = evt.delta.text as string;
        replyText += delta;
        streamBuffer += delta;

        if (!cardInstance && !isCreatingCard) {
          initCard().then(() => {
            if (cardInstance) scheduleFlush();
          }).catch(() => {});
        } else if (cardInstance) {
          scheduleFlush();
        }
      }
    }

    // === 通用：assistant 消息作为内容校正（完整文本） ===
    if ("type" in message && message.type === "assistant" && "message" in message) {
      const content = (message as any).message?.content;
      if (typeof content === "string") {
        replyText = content;
      } else if (Array.isArray(content)) {
        replyText = content
          .filter((block: any) => block.type === "text")
          .map((block: any) => block.text)
          .join("\n");
      }
    }

    // === result 消息：终结回复 ===
    if ("type" in message && message.type === "result") {
      // 清理 runner handle，使后续消息能正确创建新会话
      bot.runnerHandles.delete(sessionId);

      if (!replyText.trim()) return;

      if (useCard && cardInstance && !cardFallback) {
        // Card 模式：终结卡片
        flushCardStream(true).catch((err) => {
          log.error(`[dingtalk:${meta.botName}] Card finalize failed, falling back to markdown:`, err);
          sendMarkdownFallback(config, meta, replyText);
        });
      } else {
        // Markdown 模式 或 Card 降级后
        sendDingTalkReply(config, meta, replyText).catch((err) => {
          logApiError(meta.botName, "send reply", err);
        });
      }

      replyText = "";
      streamBuffer = "";
      if (streamTimer) {
        clearTimeout(streamTimer);
        streamTimer = null;
      }
    }
  };
}

// ==================== AI 卡片操作 ====================

/**
 * 创建 AI 流式卡片
 */
async function createAICard(
  config: DingTalkConfig,
  meta: DingTalkSessionMeta
): Promise<AICardInstance> {
  const token = await getAccessToken(config);
  const isGroup = meta.conversationType === "2";
  const robotCode = config.robotCode || config.clientId;
  const cardTemplateKey = config.cardTemplateKey || "content";
  const outTrackId = `card_${crypto.randomUUID()}`;

  const userId = meta.senderStaffId || meta.senderId;
  const openSpaceId = isGroup
    ? `dtv1.card//IM_GROUP.${meta.conversationId}`
    : `dtv1.card//IM_ROBOT.${userId}`;

  const createBody: Record<string, any> = {
    cardTemplateId: config.cardTemplateId,
    outTrackId,
    cardData: { cardParamMap: {} },
    callbackType: "STREAM",
    imGroupOpenSpaceModel: { supportForward: true },
    imRobotOpenSpaceModel: { supportForward: true },
    openSpaceId,
    userIdType: 1,
  };

  if (isGroup) {
    createBody.imGroupOpenDeliverModel = { robotCode };
  } else {
    createBody.imRobotOpenDeliverModel = { spaceType: "IM_ROBOT" };
  }

  await retryWithBackoff(
    () => axios.post(
      "https://api.dingtalk.com/v1.0/card/instances/createAndDeliver",
      createBody,
      { headers: { "x-acs-dingtalk-access-token": token, "Content-Type": "application/json" } }
    ),
    { label: "createAICard" }
  );

  // 发送初始"思考中"内容
  await retryWithBackoff(
    () => axios.put(
      "https://api.dingtalk.com/v1.0/card/streaming",
      {
        outTrackId,
        guid: crypto.randomUUID(),
        key: cardTemplateKey,
        content: "思考中...",
        isFull: true,
        isFinalize: false,
        isError: false,
      },
      { headers: { "x-acs-dingtalk-access-token": token, "Content-Type": "application/json" } }
    ),
    { label: "createAICard:initStream" }
  );

  return {
    outTrackId,
    cardTemplateKey,
    status: "PROCESSING",
    createdAt: Date.now(),
    token,
  };
}

/**
 * 流式更新卡片内容
 */
async function streamAICard(
  card: AICardInstance,
  config: DingTalkConfig,
  content: string,
  finalize: boolean
): Promise<void> {
  // 长时间卡片需要刷新 token
  let token = card.token;
  if (Date.now() - card.createdAt > CARD_TOKEN_REFRESH_THRESHOLD_MS) {
    token = await getAccessToken(config);
    card.token = token;
  }

  await retryWithBackoff(
    () => axios.put(
      "https://api.dingtalk.com/v1.0/card/streaming",
      {
        outTrackId: card.outTrackId,
        guid: crypto.randomUUID(),
        key: card.cardTemplateKey,
        content,
        isFull: true,
        isFinalize: finalize,
        isError: false,
      },
      { headers: { "x-acs-dingtalk-access-token": token, "Content-Type": "application/json" } }
    ),
    { label: finalize ? "finishAICard" : "streamAICard" }
  );
}

// ==================== 消息发送 ====================

async function getAccessToken(config: DingTalkConfig): Promise<string> {
  return fetchAccessToken(config.clientId, config.clientSecret);
}

async function fetchAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const cacheKey = clientId;
  const now = Date.now();
  const cached = tokenCache.get(cacheKey);

  if (cached && cached.expiry > now + TOKEN_EXPIRY_BUFFER_MS) {
    return cached.accessToken;
  }

  const response = await retryWithBackoff(
    () => axios.post(
      "https://api.dingtalk.com/v1.0/oauth2/accessToken",
      { appKey: clientId, appSecret: clientSecret }
    ),
    { label: "fetchAccessToken" }
  );

  const { accessToken, expireIn } = response.data;
  tokenCache.set(cacheKey, {
    accessToken,
    expiry: now + expireIn * 1000,
  });

  return accessToken;
}

async function sendDingTalkReply(
  config: DingTalkConfig,
  meta: DingTalkSessionMeta,
  replyText: string
): Promise<void> {
  const token = await getAccessToken(config);
  const isGroup = meta.conversationType === "2";

  // Card 模式走流式卡片（在 createReplyCollector 中处理），这里只处理非流式场景
  if (config.messageType === "card" && config.cardTemplateId) {
    await sendCardMessageOneShot(token, config, meta, replyText, isGroup);
  } else {
    await sendMarkdownMessage(token, config, meta, replyText, isGroup);
  }
}

/**
 * Markdown 降级兜底发送
 */
function sendMarkdownFallback(config: DingTalkConfig, meta: DingTalkSessionMeta, text: string): void {
  getAccessToken(config).then((token) => {
    const isGroup = meta.conversationType === "2";
    return sendMarkdownMessage(token, config, meta, text, isGroup);
  }).catch((err) => {
    logApiError(meta.botName, "markdown fallback", err);
  });
}

async function sendMarkdownMessage(
  token: string,
  config: DingTalkConfig,
  meta: DingTalkSessionMeta,
  text: string,
  isGroup: boolean
): Promise<void> {
  const robotCode = config.robotCode || config.clientId;
  const hasMarkdown = /^[#*>-]|[*_`#[\]]/.test(text) || text.includes("\n");
  const msgKey = hasMarkdown ? "sampleMarkdown" : "sampleText";

  const title = text
    .split("\n")[0]
    .replace(/^[#*\s\->]+/, "")
    .slice(0, 20) || "AICowork";

  const msgParam = hasMarkdown
    ? JSON.stringify({ title, text })
    : JSON.stringify({ content: text });

  const url = isGroup
    ? "https://api.dingtalk.com/v1.0/robot/groupMessages/send"
    : "https://api.dingtalk.com/v1.0/robot/oToMessages/batchSend";

  const payload: Record<string, any> = { robotCode, msgKey, msgParam };

  if (isGroup) {
    payload.openConversationId = meta.conversationId;
  } else {
    const userId = meta.senderStaffId || meta.senderId;
    payload.userIds = [userId];
  }

  log.info(
    `[dingtalk:${meta.botName}] Sending markdown reply: msgKey=${msgKey}`
  );

  await retryWithBackoff(
    () => axios.post(url, payload, {
      headers: {
        "x-acs-dingtalk-access-token": token,
        "Content-Type": "application/json",
      },
    }),
    { label: "sendMarkdownMessage" }
  );

  log.info(`[dingtalk:${meta.botName}] Reply sent to ${isGroup ? "group" : "user"}`);
}

/**
 * 一次性卡片消息（非流式场景的兜底）
 */
async function sendCardMessageOneShot(
  token: string,
  config: DingTalkConfig,
  meta: DingTalkSessionMeta,
  text: string,
  isGroup: boolean
): Promise<void> {
  const robotCode = config.robotCode || config.clientId;
  const cardTemplateKey = config.cardTemplateKey || "content";
  const cardInstanceId = `card_${crypto.randomUUID()}`;

  const userId = meta.senderStaffId || meta.senderId;
  const openSpaceId = isGroup
    ? `dtv1.card//IM_GROUP.${meta.conversationId}`
    : `dtv1.card//IM_ROBOT.${userId}`;

  const createBody: Record<string, any> = {
    cardTemplateId: config.cardTemplateId,
    outTrackId: cardInstanceId,
    cardData: { cardParamMap: {} },
    callbackType: "STREAM",
    imGroupOpenSpaceModel: { supportForward: true },
    imRobotOpenSpaceModel: { supportForward: true },
    openSpaceId,
    userIdType: 1,
  };

  if (isGroup) {
    createBody.imGroupOpenDeliverModel = { robotCode };
  } else {
    createBody.imRobotOpenDeliverModel = { spaceType: "IM_ROBOT" };
  }

  try {
    await retryWithBackoff(
      () => axios.post(
        "https://api.dingtalk.com/v1.0/card/instances/createAndDeliver",
        createBody,
        { headers: { "x-acs-dingtalk-access-token": token, "Content-Type": "application/json" } }
      ),
      { label: "sendCardOneShot:create" }
    );

    await retryWithBackoff(
      () => axios.put(
        "https://api.dingtalk.com/v1.0/card/streaming",
        {
          outTrackId: cardInstanceId,
          guid: crypto.randomUUID(),
          key: cardTemplateKey,
          content: text,
          isFull: true,
          isFinalize: true,
          isError: false,
        },
        { headers: { "x-acs-dingtalk-access-token": token, "Content-Type": "application/json" } }
      ),
      { label: "sendCardOneShot:stream" }
    );

    log.info(`[dingtalk:${meta.botName}] Card reply sent to ${isGroup ? "group" : "user"}`);
  } catch (err) {
    log.warn(`[dingtalk:${meta.botName}] Card one-shot failed, falling back to markdown:`, err);
    await sendMarkdownMessage(token, config, meta, text, isGroup);
  }
}

// ==================== 日志工具 ====================

function logApiError(botName: string, action: string, err: unknown): void {
  if (axios.isAxiosError(err) && err.response) {
    const token = err.config?.headers?.["x-acs-dingtalk-access-token"];
    const maskedToken = typeof token === "string" ? maskSensitive(token) : "N/A";
    log.error(
      `[dingtalk:${botName}] Failed to ${action}: status=${err.response.status}, token=${maskedToken}`,
      JSON.stringify(err.response.data)
    );
  } else {
    log.error(`[dingtalk:${botName}] Failed to ${action}:`, err);
  }
}

// ==================== 重连 ====================

function scheduleReconnect(bot: BotInstance, emit: EmitFn): void {
  if (bot.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    log.error(`[dingtalk:${bot.name}] Max reconnection attempts reached`);
    bot.status = "failed";
    emit({
      type: "dingtalk.status",
      payload: { botName: bot.name, status: "failed", error: "Max reconnection attempts reached" },
    });
    return;
  }

  const baseDelay = Math.min(
    INITIAL_RECONNECT_DELAY * Math.pow(2, bot.reconnectAttempts),
    MAX_RECONNECT_DELAY
  );
  const jitter = baseDelay * RECONNECT_JITTER * (Math.random() * 2 - 1);
  const delay = Math.max(0, baseDelay + jitter);

  bot.reconnectAttempts++;
  log.info(
    `[dingtalk:${bot.name}] Reconnect attempt ${bot.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${Math.round(delay)}ms`
  );

  bot.reconnectTimer = setTimeout(async () => {
    bot.reconnectTimer = null;
    try {
      await connectDingTalk(bot.name, bot.config, emit);
    } catch (err) {
      log.error(`[dingtalk:${bot.name}] Reconnect failed:`, err);
    }
  }, delay);
}

// ==================== 消息去重 ====================

function isMessageProcessed(bot: BotInstance, msgId: string): boolean {
  const expiresAt = bot.processedMessages.get(msgId);
  if (expiresAt === undefined) return false;
  if (Date.now() >= expiresAt) {
    bot.processedMessages.delete(msgId);
    return false;
  }
  return true;
}

function markMessageProcessed(bot: BotInstance, msgId: string): void {
  bot.processedMessages.set(msgId, Date.now() + MESSAGE_DEDUP_TTL);

  if (bot.processedMessages.size > MESSAGE_DEDUP_MAX_SIZE) {
    const now = Date.now();
    for (const [key, expiry] of bot.processedMessages.entries()) {
      if (now >= expiry) {
        bot.processedMessages.delete(key);
      }
    }
  }
}
