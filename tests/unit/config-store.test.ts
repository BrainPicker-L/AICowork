/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-21
 * @updated     2026-01-21
 * @Email       None
 *
 * config-store.ts 单元测试
 * 测试 API 配置存储的所有功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { app } from 'electron';
import {
  loadApiConfig,
  loadAllApiConfigs,
  saveApiConfig,
  deleteApiConfig,
  setActiveApiConfig,
  validateApiConfig,
  getSupportedProviders,
  getProviderConfig,
} from '../../src/electron/libs/config-store';

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => `/mock/path/${name}`),
    isPackaged: false,
  },
}));

// Mock fs
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    access: vi.fn(),
    mkdir: vi.fn(),
  },
}));

describe('config-store', () => {
  const mockUserDataPath = '/mock/path/userData';
  const mockConfigPath = join(mockUserDataPath, 'api-config.json');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateApiConfig', () => {
    it('应该验证有效的 Anthropic 配置', () => {
      const config = {
        id: 'test-1',
        name: 'Test Config',
        apiKey: 'sk-ant-api123-1234567890' + 'a'.repeat(70),
        baseURL: 'https://api.anthropic.com',
        model: 'claude-3-5-sonnet-20241022',
        apiType: 'anthropic' as const,
      };
      const result = validateApiConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该拒绝无效的 API Key', () => {
      const config = {
        id: 'test-1',
        name: 'Test Config',
        apiKey: 'short',
        baseURL: 'https://api.anthropic.com',
        model: 'claude-3-5-sonnet-20241022',
        apiType: 'anthropic' as const,
      };
      const result = validateApiConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('API Key'))).toBe(true);
    });

    it('应该拒绝无效的 Base URL', () => {
      const config = {
        id: 'test-1',
        name: 'Test Config',
        apiKey: 'sk-ant-api123-1234567890' + 'a'.repeat(70),
        baseURL: 'not-a-url',
        model: 'claude-3-5-sonnet-20241022',
        apiType: 'anthropic' as const,
      };
      const result = validateApiConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Base URL'))).toBe(true);
    });

    it('应该拒绝无效的模型名称', () => {
      const config = {
        id: 'test-1',
        name: 'Test Config',
        apiKey: 'sk-ant-api123-1234567890' + 'a'.repeat(70),
        baseURL: 'https://api.anthropic.com',
        model: 'ab',
        apiType: 'anthropic' as const,
      };
      const result = validateApiConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('模型名称'))).toBe(true);
    });

    it('应该拒绝包含非法字符的 API Key', () => {
      const config = {
        id: 'test-1',
        name: 'Test Config',
        apiKey: 'sk-ant-api123-<>{}',
        baseURL: 'https://api.anthropic.com',
        model: 'claude-3-5-sonnet-20241022',
        apiType: 'anthropic' as const,
      };
      const result = validateApiConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('非法字符'))).toBe(true);
    });

    it('应该接受 Ollama 的空 API Key', () => {
      const config = {
        id: 'test-1',
        name: 'Ollama Config',
        apiKey: '',
        baseURL: 'http://localhost:11434',
        model: 'llama2',
        apiType: 'ollama' as const,
      };
      const result = validateApiConfig(config);
      expect(result.valid).toBe(true);
    });
  });

  describe('loadApiConfig', () => {
    it('应该在文件不存在时返回 null', async () => {
      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' } as never);

      const result = loadApiConfig();
      expect(result).toBe(null);
    });

    it('应该加载有效的配置文件', async () => {
      const mockConfig = {
        activeConfigId: 'cfg-1',
        configs: [{
          id: 'cfg-1',
          name: 'Test Config',
          apiKey: 'sk-ant-test',
          baseURL: 'https://api.anthropic.com',
          model: 'claude-3-5-sonnet-20241022',
          apiType: 'anthropic' as const,
        }],
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockConfig));

      const result = loadApiConfig();
      expect(result).not.toBe(null);
      expect(result?.id).toBe('cfg-1');
    });

    it('应该迁移旧格式配置', async () => {
      const oldConfig = {
        apiKey: 'sk-ant-test',
        baseURL: 'https://api.anthropic.com',
        model: 'claude-3-5-sonnet-20241022',
        apiType: 'anthropic',
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(oldConfig));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const result = loadApiConfig();
      expect(result).not.toBe(null);
      expect(result?.apiType).toBe('anthropic');
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('应该处理 JSON 解析错误', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid json');

      const result = loadApiConfig();
      expect(result).toBe(null);
    });
  });

  describe('loadAllApiConfigs', () => {
    it('应该在文件不存在时返回空配置', async () => {
      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' } as never);

      const result = loadAllApiConfigs();
      expect(result).toEqual({ configs: [] });
    });

    it('应该加载所有配置', async () => {
      const mockStore = {
        activeConfigId: 'cfg-1',
        configs: [
          {
            id: 'cfg-1',
            name: 'Config 1',
            apiKey: 'key1',
            baseURL: 'https://api1.com',
            model: 'model1',
            apiType: 'anthropic' as const,
          },
          {
            id: 'cfg-2',
            name: 'Config 2',
            apiKey: 'key2',
            baseURL: 'https://api2.com',
            model: 'model2',
            apiType: 'openai' as const,
          },
        ],
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockStore));

      const result = loadAllApiConfigs();
      expect(result?.configs).toHaveLength(2);
      expect(result?.activeConfigId).toBe('cfg-1');
    });
  });

  describe('saveApiConfig', () => {
    it('应该保存新配置', async () => {
      const newConfig = {
        id: 'cfg-new',
        name: 'New Config',
        apiKey: 'sk-ant-test',
        baseURL: 'https://api.anthropic.com',
        model: 'claude-3-5-sonnet-20241022',
        apiType: 'anthropic' as const,
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ configs: [] }));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      saveApiConfig(newConfig);

      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('应该更新现有配置', async () => {
      const existingStore = {
        activeConfigId: 'cfg-1',
        configs: [{
          id: 'cfg-1',
          name: 'Config 1',
          apiKey: 'key1',
          baseURL: 'https://api1.com',
          model: 'model1',
          apiType: 'anthropic' as const,
        }],
      };

      const updatedConfig = {
        id: 'cfg-1',
        name: 'Updated Config',
        apiKey: 'new-key',
        baseURL: 'https://api.anthropic.com',
        model: 'claude-3-5-sonnet-20241022',
        apiType: 'anthropic' as const,
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingStore));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      saveApiConfig(updatedConfig);

      const writtenData = vi.mocked(fs.writeFile).mock.calls[0][1] as string;
      const parsed = JSON.parse(writtenData);
      expect(parsed.configs[0].name).toBe('Updated Config');
    });

    it('应该拒绝无效配置', () => {
      const invalidConfig = {
        id: 'cfg-1',
        name: 'Invalid',
        apiKey: 'short',
        baseURL: 'not-a-url',
        model: 'ab',
        apiType: 'anthropic' as const,
      };

      expect(() => saveApiConfig(invalidConfig)).toThrow();
    });

    it('应该为新配置生成 ID', async () => {
      const configWithoutId = {
        name: 'New Config',
        apiKey: 'sk-ant-test',
        baseURL: 'https://api.anthropic.com',
        model: 'claude-3-5-sonnet-20241022',
        apiType: 'anthropic' as const,
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ configs: [] }));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      saveApiConfig(configWithoutId as any);

      const writtenData = vi.mocked(fs.writeFile).mock.calls[0][1] as string;
      const parsed = JSON.parse(writtenData);
      expect(parsed.configs[0].id).toBeDefined();
      expect(parsed.configs[0].id).toMatch(/^cfg_\d+_\w+$/);
    });
  });

  describe('deleteApiConfig', () => {
    it('应该删除指定配置', async () => {
      const existingStore = {
        activeConfigId: 'cfg-1',
        configs: [
          {
            id: 'cfg-1',
            name: 'Config 1',
            apiKey: 'key1',
            baseURL: 'https://api1.com',
            model: 'model1',
            apiType: 'anthropic' as const,
          },
          {
            id: 'cfg-2',
            name: 'Config 2',
            apiKey: 'key2',
            baseURL: 'https://api2.com',
            model: 'model2',
            apiType: 'openai' as const,
          },
        ],
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingStore));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      deleteApiConfig('cfg-1');

      const writtenData = vi.mocked(fs.writeFile).mock.calls[0][1] as string;
      const parsed = JSON.parse(writtenData);
      expect(parsed.configs).toHaveLength(1);
      expect(parsed.configs[0].id).toBe('cfg-2');
    });

    it('应该更新激活配置 ID', async () => {
      const existingStore = {
        activeConfigId: 'cfg-1',
        configs: [
          {
            id: 'cfg-1',
            name: 'Config 1',
            apiKey: 'key1',
            baseURL: 'https://api1.com',
            model: 'model1',
            apiType: 'anthropic' as const,
          },
          {
            id: 'cfg-2',
            name: 'Config 2',
            apiKey: 'key2',
            baseURL: 'https://api2.com',
            model: 'model2',
            apiType: 'openai' as const,
          },
        ],
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingStore));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      deleteApiConfig('cfg-1');

      const writtenData = vi.mocked(fs.writeFile).mock.calls[0][1] as string;
      const parsed = JSON.parse(writtenData);
      expect(parsed.activeConfigId).toBe('cfg-2');
    });

    it('删除最后一个配置时应该清除激活 ID', async () => {
      const existingStore = {
        activeConfigId: 'cfg-1',
        configs: [
          {
            id: 'cfg-1',
            name: 'Config 1',
            apiKey: 'key1',
            baseURL: 'https://api1.com',
            model: 'model1',
            apiType: 'anthropic' as const,
          },
        ],
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingStore));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      deleteApiConfig('cfg-1');

      const writtenData = vi.mocked(fs.writeFile).mock.calls[0][1] as string;
      const parsed = JSON.parse(writtenData);
      expect(parsed.activeConfigId).toBeUndefined();
    });
  });

  describe('setActiveApiConfig', () => {
    it('应该设置激活配置', async () => {
      const existingStore = {
        activeConfigId: 'cfg-1',
        configs: [
          {
            id: 'cfg-1',
            name: 'Config 1',
            apiKey: 'key1',
            baseURL: 'https://api1.com',
            model: 'model1',
            apiType: 'anthropic' as const,
          },
          {
            id: 'cfg-2',
            name: 'Config 2',
            apiKey: 'key2',
            baseURL: 'https://api2.com',
            model: 'model2',
            apiType: 'openai' as const,
          },
        ],
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingStore));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      setActiveApiConfig('cfg-2');

      const writtenData = vi.mocked(fs.writeFile).mock.calls[0][1] as string;
      const parsed = JSON.parse(writtenData);
      expect(parsed.activeConfigId).toBe('cfg-2');
    });

    it('应该拒绝不存在的配置 ID', () => {
      const existingStore = {
        activeConfigId: 'cfg-1',
        configs: [{
          id: 'cfg-1',
          name: 'Config 1',
          apiKey: 'key1',
          baseURL: 'https://api1.com',
          model: 'model1',
          apiType: 'anthropic' as const,
        }],
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingStore));

      expect(() => setActiveApiConfig('cfg-nonexistent')).toThrow();
    });
  });

  describe('getSupportedProviders', () => {
    it('应该返回支持的厂商列表', () => {
      const providers = getSupportedProviders();
      expect(providers.length).toBeGreaterThan(0);
      expect(providers[0]).toHaveProperty('id');
      expect(providers[0]).toHaveProperty('name');
      expect(providers[0]).toHaveProperty('description');
    });

    it('应该包含 Anthropic', () => {
      const providers = getSupportedProviders();
      const anthropic = providers.find(p => p.id === 'anthropic');
      expect(anthropic).toBeDefined();
      expect(anthropic?.name).toContain('Anthropic');
    });
  });

  describe('getProviderConfig', () => {
    it('应该返回厂商默认配置', () => {
      const config = getProviderConfig('anthropic');
      expect(config).toHaveProperty('baseURL');
      expect(config).toHaveProperty('models');
      expect(config).toHaveProperty('defaultModel');
      expect(config.models.length).toBeGreaterThan(0);
    });

    it('Anthropic baseURL 应该是官方地址', () => {
      const config = getProviderConfig('anthropic');
      expect(config.baseURL).toBe('https://api.anthropic.com');
    });
  });
});
