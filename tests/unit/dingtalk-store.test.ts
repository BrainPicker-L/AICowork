/**
 * dingtalk-store.ts 单元测试
 * 测试钉钉配置存储的多机器人 CRUD 功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { promises as fs } from 'fs';

// Mock electron
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/userData'),
  },
}));

// Mock fs
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    access: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../src/electron/logger', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  loadDingTalkBots,
  loadDingTalkBot,
  saveDingTalkBot,
  deleteDingTalkBot,
  getDingTalkBotList,
  validateDingTalkConfig,
} from '../../src/electron/storage/dingtalk-store';

describe('dingtalk-store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadDingTalkBots', () => {
    it('应该在文件不存在时返回空对象', async () => {
      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' } as never);

      const result = await loadDingTalkBots();
      expect(result).toEqual({});
    });

    it('应该加载多机器人配置', async () => {
      const mockStore = {
        bots: {
          'bot-a': { enabled: true, clientId: 'id-a', clientSecret: 'secret-a', dmPolicy: 'open', groupPolicy: 'open', allowFrom: [], allowGroups: [], messageType: 'markdown' },
          'bot-b': { enabled: false, clientId: 'id-b', clientSecret: 'secret-b', dmPolicy: 'open', groupPolicy: 'open', allowFrom: [], allowGroups: [], messageType: 'card' },
        },
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockStore));

      const result = await loadDingTalkBots();
      expect(Object.keys(result)).toHaveLength(2);
      expect(result['bot-a'].clientId).toBe('id-a');
      expect(result['bot-b'].enabled).toBe(false);
    });

    it('应该迁移旧版单机器人格式', async () => {
      const legacyConfig = {
        clientId: 'old-id',
        clientSecret: 'old-secret',
        enabled: true,
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(legacyConfig));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const result = await loadDingTalkBots();
      expect(result['default']).toBeDefined();
      expect(result['default'].clientId).toBe('old-id');
      // 应该触发写入迁移后的格式
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('loadDingTalkBot', () => {
    it('应该返回指定名称的配置（合并默认值）', async () => {
      const mockStore = {
        bots: {
          'my-bot': { enabled: true, clientId: 'test-id', clientSecret: 'test-secret' },
        },
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockStore));

      const result = await loadDingTalkBot('my-bot');
      expect(result).not.toBeNull();
      expect(result!.clientId).toBe('test-id');
      // 确保默认值被合并
      expect(result!.dmPolicy).toBe('open');
      expect(result!.messageType).toBe('markdown');
    });

    it('应该在机器人不存在时返回 null', async () => {
      const mockStore = { bots: {} };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockStore));

      const result = await loadDingTalkBot('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('saveDingTalkBot', () => {
    it('应该保存新机器人配置', async () => {
      const mockStore = { bots: {} };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockStore));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const newConfig = {
        enabled: true,
        clientId: 'new-id',
        clientSecret: 'new-secret',
        dmPolicy: 'open' as const,
        groupPolicy: 'open' as const,
        allowFrom: [],
        allowGroups: [],
        messageType: 'markdown' as const,
      };

      await saveDingTalkBot('new-bot', newConfig);

      expect(fs.writeFile).toHaveBeenCalledTimes(1);
      const writtenData = JSON.parse(vi.mocked(fs.writeFile).mock.calls[0][1] as string);
      expect(writtenData.bots['new-bot'].clientId).toBe('new-id');
    });
  });

  describe('deleteDingTalkBot', () => {
    it('应该删除指定机器人', async () => {
      const mockStore = {
        bots: {
          'bot-a': { enabled: true, clientId: 'id-a', clientSecret: 'secret-a' },
          'bot-b': { enabled: false, clientId: 'id-b', clientSecret: 'secret-b' },
        },
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockStore));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await deleteDingTalkBot('bot-a');

      const writtenData = JSON.parse(vi.mocked(fs.writeFile).mock.calls[0][1] as string);
      expect(writtenData.bots['bot-a']).toBeUndefined();
      expect(writtenData.bots['bot-b']).toBeDefined();
    });

    it('应该在机器人不存在时静默返回', async () => {
      const mockStore = { bots: {} };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockStore));

      await deleteDingTalkBot('nonexistent');
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('getDingTalkBotList', () => {
    it('应该返回格式化的机器人列表', async () => {
      const mockStore = {
        bots: {
          'bot-a': { enabled: true, clientId: 'id-a', clientSecret: 'secret-a' },
          'bot-b': { enabled: false, clientId: 'id-b', clientSecret: 'secret-b' },
        },
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockStore));

      const result = await getDingTalkBotList();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('bot-a');
      expect(result[0].config.dmPolicy).toBe('open'); // 默认值被合并
    });
  });

  describe('validateDingTalkConfig', () => {
    it('应该在 clientId 和 clientSecret 都有值时验证通过', () => {
      const result = validateDingTalkConfig({
        clientId: 'test-id',
        clientSecret: 'test-secret',
        messageType: 'markdown',
        dmPolicy: 'open',
        groupPolicy: 'open',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该在缺少 clientId 时验证失败', () => {
      const result = validateDingTalkConfig({
        clientSecret: 'test-secret',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Client ID (AppKey) is required');
    });

    it('应该在 card 模式缺少 templateId 时验证失败', () => {
      const result = validateDingTalkConfig({
        clientId: 'test-id',
        clientSecret: 'test-secret',
        messageType: 'card',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Card Template ID'))).toBe(true);
    });

    it('应该在 allowlist 模式无白名单时验证失败', () => {
      const result = validateDingTalkConfig({
        clientId: 'test-id',
        clientSecret: 'test-secret',
        dmPolicy: 'allowlist',
        allowFrom: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('allowed user ID'))).toBe(true);
    });
  });
});
