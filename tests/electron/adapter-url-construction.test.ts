/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-21
 * @Email       None
 *
 * API 适配器 URL 构造测试
 * 测试各种厂商的 URL 构造是否正确（baseURL + endpoint）
 */

import { describe, it, expect } from 'vitest';
import { getApiAdapter, getProviderDefaults } from '../../src/electron/libs/api-adapter.js';
import type { ApiConfig } from '../../src/electron/libs/config-store.js';
import type { ApiProvider } from '../../src/electron/config/constants.js';

describe('API 适配器 URL 构造', () => {
  describe('Anthropic Passthrough 适配器', () => {
    const anthropicCompatibleProviders: ApiProvider[] = [
      'anthropic', 'zhipu', 'deepseek', 'alibaba', 'qiniu', 'moonshot', 'n1n', 'minimax',
    ];

    anthropicCompatibleProviders.forEach(provider => {
      it(`${provider} 应该构造正确的 Anthropic 消息端点 URL`, () => {
        const adapter = getApiAdapter(provider);
        const defaults = getProviderDefaults(provider);

        const config: ApiConfig = {
          apiKey: 'test-key',
          baseURL: defaults.baseURL,
          model: defaults.defaultModel,
          apiType: provider,
        };

        const request = {
          model: defaults.defaultModel,
          messages: [{ role: 'user' as const, content: 'test' }],
        };

        const result = adapter.transformRequest(request, config);

        // Passthrough 适配器应该添加 /v1/messages
        expect(result.url).toBe(`${defaults.baseURL}/v1/messages`);
      });

      it(`${provider} 应该设置正确的 Anthropic 请求头`, () => {
        const adapter = getApiAdapter(provider);
        const defaults = getProviderDefaults(provider);

        const config: ApiConfig = {
          apiKey: 'sk-test-key-12345',
          baseURL: defaults.baseURL,
          model: defaults.defaultModel,
          apiType: provider,
        };

        const request = {
          model: defaults.defaultModel,
          messages: [{ role: 'user' as const, content: 'test' }],
        };

        const result = adapter.transformRequest(request, config);

        expect(result.headers).toHaveProperty('Content-Type', 'application/json');
        expect(result.headers).toHaveProperty('x-api-key', 'sk-test-key-12345');
        expect(result.headers).toHaveProperty('anthropic-version', '2023-06-01');
      });
    });
  });

  describe('OpenAI 适配器', () => {
    const openAIFormatProviders: ApiProvider[] = [
      'huawei', 'ollama', 'openai', 'xingchen', 'tencent', 'iflytek',
      'spark', 'sensetime', 'stepfun', 'lingyi', '01ai', 'abd',
      'bestex', 'puyu', 'volcengine', 'doubao', 'hunyuan', 'wenxin',
    ];

    openAIFormatProviders.forEach(provider => {
      it(`${provider} 应该构造正确的 OpenAI 聊天端点 URL`, () => {
        const adapter = getApiAdapter(provider);
        const defaults = getProviderDefaults(provider);

        const config: ApiConfig = {
          apiKey: 'test-key',
          baseURL: defaults.baseURL,
          model: defaults.defaultModel,
          apiType: provider,
        };

        const request = {
          model: defaults.defaultModel,
          messages: [{ role: 'user' as const, content: 'test' }],
        };

        const result = adapter.transformRequest(request, config);

        // OpenAI 适配器应该添加 /v1/chat/completions
        expect(result.url).toBe(`${defaults.baseURL}/v1/chat/completions`);
      });

      it(`${provider} 应该设置正确的 OpenAI 请求头`, () => {
        const adapter = getApiAdapter(provider);
        const defaults = getProviderDefaults(provider);

        const config: ApiConfig = {
          apiKey: 'sk-test-key-12345',
          baseURL: defaults.baseURL,
          model: defaults.defaultModel,
          apiType: provider,
        };

        const request = {
          model: defaults.defaultModel,
          messages: [{ role: 'user' as const, content: 'test' }],
        };

        const result = adapter.transformRequest(request, config);

        expect(result.headers).toHaveProperty('Content-Type', 'application/json');
        expect(result.headers).toHaveProperty('Authorization', 'Bearer sk-test-key-12345');
      });
    });
  });

  describe('自定义路径厂商', () => {
    it('智谱 AI 应该保留 /api/anthropic 路径', () => {
      const adapter = getApiAdapter('zhipu');
      const defaults = getProviderDefaults('zhipu');

      const config: ApiConfig = {
        apiKey: 'test-key',
        baseURL: defaults.baseURL,
        model: defaults.defaultModel,
        apiType: 'zhipu',
      };

      const request = {
        model: defaults.defaultModel,
        messages: [{ role: 'user' as const, content: 'test' }],
      };

      const result = adapter.transformRequest(request, config);

      expect(result.url).toBe('https://open.bigmodel.cn/api/anthropic/v1/messages');
    });

    it('阿里云应该保留 /apps/anthropic 路径', () => {
      const adapter = getApiAdapter('alibaba');
      const defaults = getProviderDefaults('alibaba');

      const config: ApiConfig = {
        apiKey: 'test-key',
        baseURL: defaults.baseURL,
        model: defaults.defaultModel,
        apiType: 'alibaba',
      };

      const request = {
        model: defaults.defaultModel,
        messages: [{ role: 'user' as const, content: 'test' }],
      };

      const result = adapter.transformRequest(request, config);

      expect(result.url).toBe('https://dashscope.aliyuncs.com/apps/anthropic/v1/messages');
    });

    it('DeepSeek 应该保留 /anthropic 路径', () => {
      const adapter = getApiAdapter('deepseek');
      const defaults = getProviderDefaults('deepseek');

      const config: ApiConfig = {
        apiKey: 'test-key',
        baseURL: defaults.baseURL,
        model: defaults.defaultModel,
        apiType: 'deepseek',
      };

      const request = {
        model: defaults.defaultModel,
        messages: [{ role: 'user' as const, content: 'test' }],
      };

      const result = adapter.transformRequest(request, config);

      expect(result.url).toBe('https://api.deepseek.com/anthropic/v1/messages');
    });
  });

  describe('URL 不应包含重复路径', () => {
    it('ollama 不应该有 /v1/v1/chat/completions', () => {
      const adapter = getApiAdapter('ollama');
      const defaults = getProviderDefaults('ollama');

      const config: ApiConfig = {
        apiKey: 'test-key',
        baseURL: defaults.baseURL,
        model: defaults.defaultModel,
        apiType: 'ollama',
      };

      const request = {
        model: defaults.defaultModel,
        messages: [{ role: 'user' as const, content: 'test' }],
      };

      const result = adapter.transformRequest(request, config);

      expect(result.url).not.toContain('/v1/v1/');
      expect(result.url).toBe('http://localhost:11434/v1/chat/completions');
    });

    it('openai 不应该有 /v1/v1/chat/completions', () => {
      const adapter = getApiAdapter('openai');
      const defaults = getProviderDefaults('openai');

      const config: ApiConfig = {
        apiKey: 'test-key',
        baseURL: defaults.baseURL,
        model: defaults.defaultModel,
        apiType: 'openai',
      };

      const request = {
        model: defaults.defaultModel,
        messages: [{ role: 'user' as const, content: 'test' }],
      };

      const result = adapter.transformRequest(request, config);

      expect(result.url).not.toContain('/v1/v1/');
      expect(result.url).toBe('https://api.openai.com/v1/chat/completions');
    });

    it('huawei 不应该有 /v1/v1/chat/completions', () => {
      const adapter = getApiAdapter('huawei');
      const defaults = getProviderDefaults('huawei');

      const config: ApiConfig = {
        apiKey: 'test-key',
        baseURL: defaults.baseURL,
        model: defaults.defaultModel,
        apiType: 'huawei',
      };

      const request = {
        model: defaults.defaultModel,
        messages: [{ role: 'user' as const, content: 'test' }],
      };

      const result = adapter.transformRequest(request, config);

      expect(result.url).not.toContain('/v1/v1/');
      expect(result.url).toBe('https://maas-model.cn-north-4.myhuaweicloud.com/v1/chat/completions');
    });
  });

  describe('OpenAI 适配器请求体转换', () => {
    it('应该正确转换消息格式', () => {
      const adapter = getApiAdapter('openai');

      const config: ApiConfig = {
        apiKey: 'test-key',
        baseURL: 'https://api.openai.com',
        model: 'gpt-4o',
        apiType: 'openai',
      };

      const request = {
        model: 'gpt-4o',
        messages: [
          { role: 'user' as const, content: 'Hello' },
          { role: 'assistant' as const, content: 'Hi there!' },
          { role: 'user' as const, content: 'How are you?' },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      };

      const result = adapter.transformRequest(request, config);

      expect(result.body).toHaveProperty('model', 'gpt-4o');
      expect(result.body).toHaveProperty('temperature', 0.7);
      expect(result.body).toHaveProperty('max_tokens', 1000);
      expect(result.body).toHaveProperty('messages');
      expect(result.body.messages).toHaveLength(3);
    });

    it('应该转换工具定义', () => {
      const adapter = getApiAdapter('openai');

      const config: ApiConfig = {
        apiKey: 'test-key',
        baseURL: 'https://api.openai.com',
        model: 'gpt-4o',
        apiType: 'openai',
      };

      const request = {
        model: 'gpt-4o',
        messages: [{ role: 'user' as const, content: 'test' }],
        tools: [{
          name: 'search',
          description: 'Search the web',
          input_schema: {
            type: 'object' as const,
            properties: {
              query: { type: 'string' as const, description: 'Search query' },
            },
            required: ['query'],
          },
        }],
      };

      const result = adapter.transformRequest(request, config);

      expect(result.body).toHaveProperty('tools');
      expect(result.body.tools).toHaveLength(1);
      expect(result.body.tools[0]).toHaveProperty('type', 'function');
      expect(result.body.tools[0].function).toHaveProperty('name', 'search');
    });
  });
});

describe('getProviderDefaults baseURL 验证', () => {
  const testCases: Array<{ provider: ApiProvider; expectedURL: string }> = [
    { provider: 'anthropic', expectedURL: 'https://api.anthropic.com' },
    { provider: 'zhipu', expectedURL: 'https://open.bigmodel.cn/api/anthropic' },
    { provider: 'deepseek', expectedURL: 'https://api.deepseek.com/anthropic' },
    { provider: 'alibaba', expectedURL: 'https://dashscope.aliyuncs.com/apps/anthropic' },
    { provider: 'qiniu', expectedURL: 'https://api.qnaigc.com' },
    { provider: 'moonshot', expectedURL: 'https://api.moonshot.cn' },
    { provider: 'huawei', expectedURL: 'https://maas-model.cn-north-4.myhuaweicloud.com' },
    { provider: 'ollama', expectedURL: 'http://localhost:11434' },
    { provider: 'n1n', expectedURL: 'https://api.n1n.ai' },
    { provider: 'minimax', expectedURL: 'https://api.minimaxi.com' },
    { provider: 'openai', expectedURL: 'https://api.openai.com' },
  ];

  testCases.forEach(({ provider, expectedURL }) => {
    it(`${provider} 的 baseURL 应该是 ${expectedURL}`, () => {
      const defaults = getProviderDefaults(provider);
      expect(defaults.baseURL).toBe(expectedURL);
    });
  });

  it('所有 baseURL 都不应该以 /v1 或 /anthropic 结尾（除特殊情况）', () => {
    const specialPaths = ['/api/anthropic', '/apps/anthropic', '/anthropic'];
    const providers: ApiProvider[] = [
      'anthropic', 'zhipu', 'deepseek', 'alibaba', 'qiniu', 'moonshot',
      'huawei', 'ollama', 'n1n', 'minimax', 'openai',
    ];

    providers.forEach(provider => {
      const defaults = getProviderDefaults(provider);
      const hasStandardPathEnding = defaults.baseURL.endsWith('/v1');

      // 检查是否有非预期的标准路径结尾
      if (hasStandardPathEnding && !specialPaths.some(path => defaults.baseURL.endsWith(path))) {
        throw new Error(`${provider} baseURL 不应该以 /v1 结尾: ${defaults.baseURL}`);
      }
    });
  });
});
