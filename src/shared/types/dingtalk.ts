/**
 * 钉钉机器人集成类型定义
 */

/**
 * 钉钉配置
 */
export interface DingTalkConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  robotCode?: string;
  corpId?: string;
  dmPolicy: 'open' | 'allowlist';
  groupPolicy: 'open' | 'allowlist';
  allowFrom: string[];
  allowGroups: string[];
  messageType: 'markdown' | 'card';
  cardTemplateId?: string;
  cardTemplateKey?: string;
}

/**
 * 钉钉连接状态
 */
export type DingTalkConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'failed';

/**
 * 钉钉机器人摘要（供列表展示）
 */
export interface DingTalkBotSummary {
  name: string;
  enabled: boolean;
  status: DingTalkConnectionStatus;
  clientId: string;
}

/**
 * 钉钉收到的消息
 */
export interface DingTalkInboundMessage {
  msgId: string;
  msgtype: string;
  createAt?: number;
  text?: { content: string };
  content?: {
    downloadCode?: string;
    fileName?: string;
    recognition?: string;
    richText?: Array<{
      type?: string;
      text?: string;
      atName?: string;
      downloadCode?: string;
    }>;
  };
  conversationType: string;
  conversationId: string;
  conversationTitle?: string;
  senderId: string;
  senderStaffId?: string;
  senderNick?: string;
  chatbotUserId?: string;
  sessionWebhook: string;
}

/**
 * 钉钉会话元信息（存储在 Session 中）
 */
export interface DingTalkSessionMeta {
  botName: string;
  senderId: string;
  senderStaffId?: string;
  senderNick?: string;
  conversationType: string;
  conversationId: string;
  conversationTitle?: string;
  sessionWebhook: string;
}

/**
 * AI 卡片实例状态
 */
export type AICardStatus = 'PROCESSING' | 'INPUTING' | 'FINISHED' | 'FAILED';

/**
 * AI 卡片实例（跟踪流式卡片生命周期）
 */
export interface AICardInstance {
  outTrackId: string;
  cardTemplateKey: string;
  status: AICardStatus;
  createdAt: number;
  token: string;
}

/**
 * 默认配置
 */
export const DEFAULT_DINGTALK_CONFIG: DingTalkConfig = {
  enabled: false,
  clientId: '',
  clientSecret: '',
  dmPolicy: 'open',
  groupPolicy: 'open',
  allowFrom: [],
  allowGroups: [],
  messageType: 'markdown',
};
