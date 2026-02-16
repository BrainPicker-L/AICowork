/**
 * dingtalk-service.ts 单元测试
 * 测试钉钉服务的工具函数和核心逻辑
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock 所有外部依赖
vi.mock('dingtalk-stream', () => ({
  DWClient: vi.fn(),
  TOPIC_ROBOT: '/v1.0/im/bot/messages/get',
  EventAck: { SUCCESS: 'SUCCESS', LATER: 'LATER' },
}));

vi.mock('axios', () => {
  const axiosError = new Error('test error') as any;
  axiosError.isAxiosError = true;
  axiosError.response = { status: 500 };
  return {
    default: {
      post: vi.fn(),
      put: vi.fn(),
      isAxiosError: (err: any) => err?.isAxiosError === true,
    },
  };
});

vi.mock('../../src/electron/logger', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    session: vi.fn(),
  },
}));

vi.mock('../../src/electron/storage/session-store', () => ({
  getSessionStore: vi.fn(() => ({
    createSession: vi.fn(() => ({ id: 'session-1', title: 'test', claudeSessionId: 'c-1' })),
    getSession: vi.fn(),
    updateSession: vi.fn(),
    listSessions: vi.fn(() => []),
    findDingTalkSession: vi.fn(),
    updateDingtalkMeta: vi.fn(),
    recordMessage: vi.fn(),
  })),
}));

vi.mock('../../src/electron/libs/runner', () => ({
  runClaude: vi.fn(() => Promise.resolve({
    addUserInput: vi.fn(),
    abort: vi.fn(),
  })),
}));

vi.mock('../../src/electron/storage/dingtalk-store', () => ({
  loadDingTalkBots: vi.fn(() => Promise.resolve({})),
}));

import {
  getDingTalkStatus,
  getAllDingTalkStatuses,
  testDingTalkConnection,
} from '../../src/electron/services/dingtalk-service';

describe('dingtalk-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDingTalkStatus', () => {
    it('应该在机器人不存在时返回 disconnected', () => {
      const status = getDingTalkStatus('nonexistent');
      expect(status).toBe('disconnected');
    });
  });

  describe('getAllDingTalkStatuses', () => {
    it('应该在没有机器人时返回空数组', () => {
      const statuses = getAllDingTalkStatuses();
      expect(statuses).toEqual([]);
    });
  });

  describe('testDingTalkConnection', () => {
    it('应该在缺少 clientId 时返回失败', async () => {
      const result = await testDingTalkConnection({ clientSecret: 'test' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('required');
    });

    it('应该在缺少 clientSecret 时返回失败', async () => {
      const result = await testDingTalkConnection({ clientId: 'test' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('required');
    });
  });
});

/**
 * 独立测试工具函数的纯逻辑（不依赖模块状态）
 */
describe('dingtalk-service utility logic', () => {
  describe('maskSensitive', () => {
    // 直接从源码复制 maskSensitive 逻辑来测试，因为它是内部函数
    function maskSensitive(value: string): string {
      if (!value || value.length <= 8) return '***';
      return `${value.slice(0, 3)}...${value.slice(-3)}`;
    }

    it('应该对短字符串返回 ***', () => {
      expect(maskSensitive('')).toBe('***');
      expect(maskSensitive('short')).toBe('***');
      expect(maskSensitive('12345678')).toBe('***');
    });

    it('应该掩码长字符串为前3后3', () => {
      expect(maskSensitive('abcdefghij')).toBe('abc...hij');
      expect(maskSensitive('my-super-secret-token-123')).toBe('my-...123');
    });
  });

  describe('isRetryableError', () => {
    function isRetryableError(err: unknown): boolean {
      if (!(err as any)?.isAxiosError) return false;
      const status = (err as any).response?.status;
      return status === 401 || status === 429 || (status !== undefined && status >= 500);
    }

    it('应该对非 axios 错误返回 false', () => {
      expect(isRetryableError(new Error('generic'))).toBe(false);
      expect(isRetryableError(null)).toBe(false);
    });

    it('应该对 401/429/5xx 返回 true', () => {
      const make = (status: number) => ({ isAxiosError: true, response: { status } });
      expect(isRetryableError(make(401))).toBe(true);
      expect(isRetryableError(make(429))).toBe(true);
      expect(isRetryableError(make(500))).toBe(true);
      expect(isRetryableError(make(503))).toBe(true);
    });

    it('应该对 400/403/404 返回 false', () => {
      const make = (status: number) => ({ isAxiosError: true, response: { status } });
      expect(isRetryableError(make(400))).toBe(false);
      expect(isRetryableError(make(403))).toBe(false);
      expect(isRetryableError(make(404))).toBe(false);
    });
  });

  describe('checkPolicy', () => {
    // 复制 checkPolicy 逻辑
    function checkPolicy(data: any, config: any): boolean {
      const isGroup = data.conversationType === '2';
      if (!isGroup) {
        if (config.dmPolicy === 'allowlist') {
          return config.allowFrom.some(
            (id: string) => id.toLowerCase() === data.senderId.toLowerCase()
          );
        }
        return true;
      } else {
        if (config.groupPolicy === 'allowlist') {
          return config.allowGroups.some(
            (id: string) => id.toLowerCase() === data.conversationId.toLowerCase()
          );
        }
        return true;
      }
    }

    it('应该在 open 模式允许所有私聊', () => {
      const result = checkPolicy(
        { conversationType: '1', senderId: 'user1' },
        { dmPolicy: 'open', allowFrom: [] }
      );
      expect(result).toBe(true);
    });

    it('应该在 allowlist 模式拦截非白名单用户', () => {
      const result = checkPolicy(
        { conversationType: '1', senderId: 'user1' },
        { dmPolicy: 'allowlist', allowFrom: ['user2', 'user3'] }
      );
      expect(result).toBe(false);
    });

    it('应该在 allowlist 模式允许白名单用户（大小写不敏感）', () => {
      const result = checkPolicy(
        { conversationType: '1', senderId: 'User1' },
        { dmPolicy: 'allowlist', allowFrom: ['user1'] }
      );
      expect(result).toBe(true);
    });

    it('应该在 open 模式允许所有群聊', () => {
      const result = checkPolicy(
        { conversationType: '2', conversationId: 'group1' },
        { groupPolicy: 'open', allowGroups: [] }
      );
      expect(result).toBe(true);
    });

    it('应该在 allowlist 模式拦截非白名单群', () => {
      const result = checkPolicy(
        { conversationType: '2', conversationId: 'group1' },
        { groupPolicy: 'allowlist', allowGroups: ['group2'] }
      );
      expect(result).toBe(false);
    });
  });

  describe('extractMessageText', () => {
    function extractMessageText(data: any): string {
      if (data.msgtype === 'text') {
        return data.text?.content?.trim() || '';
      }
      if (data.msgtype === 'richText') {
        const parts = data.content?.richText || [];
        let text = '';
        for (const part of parts) {
          if (part.text && (part.type === 'text' || part.type === undefined)) {
            text += part.text;
          }
          if (part.type === 'at' && part.atName) {
            text += `@${part.atName} `;
          }
        }
        return text.trim() || '[富文本消息]';
      }
      if (data.msgtype === 'audio' && data.content?.recognition) {
        return data.content.recognition;
      }
      return data.text?.content?.trim() || `[${data.msgtype}消息]`;
    }

    it('应该提取文本消息', () => {
      expect(extractMessageText({
        msgtype: 'text',
        text: { content: '  hello world  ' },
      })).toBe('hello world');
    });

    it('应该处理空文本消息', () => {
      expect(extractMessageText({
        msgtype: 'text',
        text: { content: '' },
      })).toBe('');
    });

    it('应该提取富文本消息', () => {
      expect(extractMessageText({
        msgtype: 'richText',
        content: {
          richText: [
            { type: 'text', text: 'Hello' },
            { type: 'at', atName: 'Bot' },
            { text: ' World' },
          ],
        },
      })).toBe('Hello@Bot  World');
    });

    it('应该提取音频识别文本', () => {
      expect(extractMessageText({
        msgtype: 'audio',
        content: { recognition: '这是语音识别结果' },
      })).toBe('这是语音识别结果');
    });

    it('应该对未知类型返回占位符', () => {
      expect(extractMessageText({
        msgtype: 'image',
      })).toBe('[image消息]');
    });
  });

  describe('消息去重逻辑', () => {
    it('应该对同一 msgId 进行去重', () => {
      const processedMessages = new Map<string, number>();
      const MESSAGE_DEDUP_TTL = 60_000;

      function isProcessed(msgId: string): boolean {
        const expiresAt = processedMessages.get(msgId);
        if (expiresAt === undefined) return false;
        if (Date.now() >= expiresAt) {
          processedMessages.delete(msgId);
          return false;
        }
        return true;
      }

      function markProcessed(msgId: string): void {
        processedMessages.set(msgId, Date.now() + MESSAGE_DEDUP_TTL);
      }

      expect(isProcessed('msg-1')).toBe(false);
      markProcessed('msg-1');
      expect(isProcessed('msg-1')).toBe(true);
      expect(isProcessed('msg-2')).toBe(false);
    });
  });

  describe('peerId 计算逻辑', () => {
    it('私聊应使用 senderId', () => {
      const data = { conversationType: '1', senderId: 'user-a', conversationId: 'conv-1' };
      const peerId = data.conversationType === '1' ? data.senderId : data.conversationId;
      expect(peerId).toBe('user-a');
    });

    it('群聊应使用 conversationId', () => {
      const data = { conversationType: '2', senderId: 'user-a', conversationId: 'group-x' };
      const peerId = data.conversationType === '1' ? data.senderId : data.conversationId;
      expect(peerId).toBe('group-x');
    });
  });
});
