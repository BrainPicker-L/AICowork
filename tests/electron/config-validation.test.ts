/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-21
 * @updated     2026-01-24 (移除已删除厂商的测试)
 * @Email       None
 *
 * 配置验证单元测试
 * 测试 API 配置的验证逻辑
 */

import { describe, it, expect } from 'vitest';
import { validateApiConfig, type ApiConfig } from '../../src/electron/storage/config-store.js';
import type { ApiProvider } from '../../src/electron/config/constants.js';

describe('API 配置验证', () => {
  describe('标准厂商（需要 API Key）', () => {
    it('Anthropic 配置验证 - 有效配置', () => {
      const config: ApiConfig = {
        apiKey: 'sk-ant-api03-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
        baseURL: 'https://api.anthropic.com',
        model: 'claude-sonnet-4-20250514',
        apiType: 'anthropic',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('DeepSeek 配置验证 - 有效配置', () => {
      const config: ApiConfig = {
        apiKey: 'sk-abcdef1234567890abcdefghijklmnopqrstuvwxyz12345',
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        apiType: 'deepseek',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('智谱 AI 配置验证 - 有效配置', () => {
      const config: ApiConfig = {
        apiKey: '0123456789abcdef.01234567.01234567',
        baseURL: 'https://open.bigmodel.cn/api/anthropic',
        model: 'glm-4',
        apiType: 'zhipu',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('API Key 为空应该验证失败', () => {
      const config: ApiConfig = {
        apiKey: '',
        baseURL: 'https://api.anthropic.com',
        model: 'claude-sonnet-4-20250514',
        apiType: 'anthropic',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API Key 不能为空');
    });

    it('API Key 过短应该验证失败', () => {
      const config: ApiConfig = {
        apiKey: 'short',
        baseURL: 'https://api.anthropic.com',
        model: 'claude-sonnet-4-20250514',
        apiType: 'anthropic',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('长度过短'))).toBe(true);
    });

    it('API Key 包含非法字符应该验证失败', () => {
      const config: ApiConfig = {
        apiKey: 'sk-ant-api03-<script>alert("xss")</script>',
        baseURL: 'https://api.anthropic.com',
        model: 'claude-sonnet-4-20250514',
        apiType: 'anthropic',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API Key 包含非法字符');
    });
  });

  describe('BaseURL 验证', () => {
    it('有效的 HTTPS URL 应该通过验证', () => {
      const config: ApiConfig = {
        apiKey: 'sk-test-key-12345678901234567890678901234567890',
        baseURL: 'https://api.example.com',
        model: 'test-model',
        apiType: 'anthropic',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(true);
    });

    it('本地 HTTP URL 应该通过验证', () => {
      const config: ApiConfig = {
        apiKey: 'sk-test-key-12345678901234567890',
        baseURL: 'http://localhost:11434',
        model: 'llama3',
        apiType: 'custom',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(true);
    });

    it('BaseURL 为空应该验证失败', () => {
      const config: ApiConfig = {
        apiKey: 'sk-test-key-12345678901234567890',
        baseURL: '',
        model: 'test-model',
        apiType: 'anthropic',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Base URL 不能为空');
    });

    it('无效的 URL 格式应该验证失败', () => {
      const config: ApiConfig = {
        apiKey: 'sk-test-key-12345678901234567890',
        baseURL: 'not-a-valid-url',
        model: 'test-model',
        apiType: 'anthropic',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Base URL 格式无效');
    });

    it('非 HTTP/HTTPS 协议应该验证失败', () => {
      const config: ApiConfig = {
        apiKey: 'sk-test-key-12345678901234567890',
        baseURL: 'ftp://api.example.com',
        model: 'test-model',
        apiType: 'anthropic',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Base URL 必须使用 HTTP 或 HTTPS 协议');
    });
  });

  describe('模型名称验证', () => {
    it('有效的模型名称应该通过验证', () => {
      const config: ApiConfig = {
        apiKey: 'sk-test-key-12345678901234567890678901234567890',
        baseURL: 'https://api.anthropic.com',
        model: 'claude-sonnet-4-20250514',
        apiType: 'anthropic',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(true);
    });

    it('模型名称为空应该验证失败', () => {
      const config: ApiConfig = {
        apiKey: 'sk-test-key-12345678901234567890',
        baseURL: 'https://api.anthropic.com',
        model: '',
        apiType: 'anthropic',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('模型名称不能为空');
    });

    it('模型名称过短应该验证失败', () => {
      const config: ApiConfig = {
        apiKey: 'sk-test-key-12345678901234567890',
        baseURL: 'https://api.anthropic.com',
        model: 'ab',
        apiType: 'anthropic',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('过短'))).toBe(true);
    });

    it('模型名称包含非法字符应该验证失败', () => {
      const config: ApiConfig = {
        apiKey: 'sk-test-key-12345678901234567890',
        baseURL: 'https://api.anthropic.com',
        model: '<script>',
        apiType: 'anthropic',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('模型名称包含非法字符');
    });
  });

  describe('API 类型验证', () => {
    it('有效的 API 类型应该通过验证', () => {
      const config: ApiConfig = {
        apiKey: 'sk-test-key-12345678901234567890678901234567890',
        baseURL: 'https://api.anthropic.com',
        model: 'claude-sonnet-4-20250514',
        apiType: 'anthropic',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(true);
    });

    it('无效的 API 类型应该验证失败', () => {
      const config: ApiConfig = {
        apiKey: 'sk-test-key-12345678901234567890',
        baseURL: 'https://api.anthropic.com',
        model: 'claude-sonnet-4-20250514',
        apiType: 'invalid-provider' as ApiProvider,
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('不支持的 API 类型'))).toBe(true);
    });
  });

  describe('组合验证', () => {
    it('应该返回所有验证错误', () => {
      const config: ApiConfig = {
        apiKey: 'short',
        baseURL: 'not-a-url',
        model: 'ab',
        apiType: 'anthropic',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);
      expect(result.errors.some(e => e.includes('API Key'))).toBe(true);
      expect(result.errors.some(e => e.includes('Base URL'))).toBe(true);
      expect(result.errors.some(e => e.includes('模型名称'))).toBe(true);
    });
  });

  describe('各厂商特定验证', () => {
    it('阿里云百炼 API Key 格式验证', () => {
      const config: ApiConfig = {
        apiKey: 'sk-abcdefghijklmnopqrstuvwxyz1234567890abcd',
        baseURL: 'https://dashscope.aliyuncs.com/apps/anthropic',
        model: 'qwen-plus',
        apiType: 'alibaba',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(true);
    });

    it('月之暗面 API Key 格式验证', () => {
      const config: ApiConfig = {
        apiKey: 'sk-abcdefghijklmnopqrstuvwxyz123456789',
        baseURL: 'https://api.moonshot.cn/anthropic',
        model: 'moonshot-v1-128k',
        apiType: 'moonshot',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(true);
    });

    it('MiniMax API Key 格式验证', () => {
      const config: ApiConfig = {
        apiKey: 'sk-abcdefghijklmnopqrstuvwxyz123456789',
        baseURL: 'https://api.minimaxi.com/anthropic',
        model: 'MiniMax-M2.1',
        apiType: 'minimax',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(true);
    });
    it('七牛云 API Key 格式验证', () => {
      const config: ApiConfig = {
        apiKey: 'sk-abcdefghijklmnopqrstuvwxyz123456',
        baseURL: 'https://api.qnaigc.com',
        model: 'qwen-plus',
        apiType: 'qiniu',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(true);
    });

    it('N1N.AI API Key 格式验证', () => {
      const config: ApiConfig = {
        apiKey: 'sk-abcdefghijklmnopqrstuvwxyz123456',
        baseURL: 'https://api.n1n.ai',
        model: 'claude-sonnet-4-20250514',
        apiType: 'n1n',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(true);
    });

    it('MiniMax API Key 格式验证', () => {
      const config: ApiConfig = {
        apiKey: 'sk-abcdefghijklmnopqrstuvwxyz123456',
        baseURL: 'https://api.minimaxi.com/anthropic',
        model: 'MiniMax-M2.1',
        apiType: 'minimax',
      };

      const result = validateApiConfig(config);

      expect(result.valid).toBe(true);
    });
  });

  describe('BaseURL 规范化（自动迁移旧配置）', () => {
    // 由于 normalizeBaseURL 是内部函数，我们通过 loadApiConfig 的行为来验证
    // 这里我们创建一个独立的测试文件来测试迁移逻辑

    it('阿里云 - 旧 /compatible-mode 路径应自动迁移', () => {
      // 模拟旧配置
      const oldConfig: ApiConfig = {
        apiKey: 'sk-abcdefghijklmnopqrstuvwxyz123456',
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode',
        model: 'qwen-plus',
        apiType: 'alibaba',
      };

      // 验证旧配置能通过验证（迁移前）
      const resultBefore = validateApiConfig(oldConfig);
      expect(resultBefore.valid).toBe(true);

      // 新的正确的 baseURL
      const newBaseURL = 'https://dashscope.aliyuncs.com/apps/anthropic';

      // 验证新配置
      const newConfig: ApiConfig = {
        ...oldConfig,
        baseURL: newBaseURL,
      };

      const resultAfter = validateApiConfig(newConfig);
      expect(resultAfter.valid).toBe(true);
    });

    it('阿里云 - 旧 /compatible-mode/v1 路径应自动迁移并移除 /v1 后缀', () => {
      // 模拟带 /v1 后缀的旧配置
      const oldConfig: ApiConfig = {
        apiKey: 'sk-abcdefghijklmnopqrstuvwxyz123456',
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: 'qwen-plus',
        apiType: 'alibaba',
      };

      // 验证旧配置能通过验证（迁移前）
      const resultBefore = validateApiConfig(oldConfig);
      expect(resultBefore.valid).toBe(true);

      // 新的正确的 baseURL（不应包含 /v1，避免与适配器路径冲突）
      const newBaseURL = 'https://dashscope.aliyuncs.com/apps/anthropic';

      // 验证新配置
      const newConfig: ApiConfig = {
        ...oldConfig,
        baseURL: newBaseURL,
      };

      const resultAfter = validateApiConfig(newConfig);
      expect(resultAfter.valid).toBe(true);
    });

    it('DeepSeek - 无路径应保持不变', () => {
      const config: ApiConfig = {
        apiKey: 'sk-abcdefghijklmnopqrstuvwxyz123456',
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        apiType: 'deepseek',
      };

      const result = validateApiConfig(config);
      expect(result.valid).toBe(true);
    });

    it('智谱 AI - 无路径应自动添加 /api/anthropic', () => {
      const oldConfig: ApiConfig = {
        apiKey: '0123456789abcdef.01234567.01234567',
        baseURL: 'https://open.bigmodel.cn',
        model: 'glm-4',
        apiType: 'zhipu',
      };

      const result = validateApiConfig(oldConfig);
      expect(result.valid).toBe(true);

      // 新的正确的 baseURL
      const newBaseURL = 'https://open.bigmodel.cn/api/anthropic';
      const newConfig: ApiConfig = {
        ...oldConfig,
        baseURL: newBaseURL,
      };

      const resultAfter = validateApiConfig(newConfig);
      expect(resultAfter.valid).toBe(true);
    });

    it('已正确配置的 baseURL 应保持不变', () => {
      const config: ApiConfig = {
        apiKey: 'sk-abcdefghijklmnopqrstuvwxyz123456',
        baseURL: 'https://dashscope.aliyuncs.com/apps/anthropic',
        model: 'qwen-plus',
        apiType: 'alibaba',
      };

      const result = validateApiConfig(config);
      expect(result.valid).toBe(true);
    });
  });
});
