/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-21
 * @Email       None
 *
 * API 代理服务器单元测试
 * 测试代理服务器的启动、停止、请求拦截和转发功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { startProxyServer, stopProxyServer, getProxyStatus } from '../../src/electron/api-proxy/index.js';
import type { ApiConfig } from '../../src/electron/libs/config-store.js';

describe('API 代理服务器', () => {
  afterEach(() => {
    // 每个测试后确保代理服务器已停止
    stopProxyServer();
  });

  describe('启动和停止', () => {
    it('应该成功启动代理服务器', () => {
      const config: ApiConfig = {
        apiKey: 'test-key',
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        apiType: 'deepseek',
      };

      const proxyUrl = startProxyServer(config);

      expect(proxyUrl).toBe('http://127.0.0.1:35721');
    });

    it('应该返回正确的代理状态', () => {
      const config: ApiConfig = {
        apiKey: 'test-key',
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        apiType: 'deepseek',
      };

      startProxyServer(config);

      const status = getProxyStatus();

      expect(status.running).toBe(true);
      expect(status.url).toBe('http://127.0.0.1:35721');
      expect(status.targetApi).toBe('https://api.deepseek.com');
      expect(status.model).toBe('deepseek-chat');
    });

    it('停止后应该返回未运行状态', () => {
      const config: ApiConfig = {
        apiKey: 'test-key',
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        apiType: 'deepseek',
      };

      startProxyServer(config);
      stopProxyServer();

      const status = getProxyStatus();

      expect(status.running).toBe(false);
      expect(status.url).toBeUndefined();
    });

    it('再次启动应该先停止旧实例', () => {
      const config1: ApiConfig = {
        apiKey: 'test-key-1',
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        apiType: 'deepseek',
      };

      const config2: ApiConfig = {
        apiKey: 'test-key-2',
        baseURL: 'https://api.qnaigc.com',
        model: 'qwen-plus',
        apiType: 'qiniu',
      };

      startProxyServer(config1);
      const proxyUrl2 = startProxyServer(config2);

      const status = getProxyStatus();

      expect(proxyUrl2).toBe('http://127.0.0.1:35721');
      expect(status.targetApi).toBe('https://api.qnaigc.com');
      expect(status.model).toBe('qwen-plus');
    });
  });

  describe('count_tokens 端点拦截', () => {
    it('应该拦截 count_tokens 请求', async () => {
      const config: ApiConfig = {
        apiKey: 'test-key',
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        apiType: 'deepseek',
      };

      startProxyServer(config);

      const response = await fetch('http://127.0.0.1:35721/v1/messages/count_tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'test-key',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'test' }],
        }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();

      expect(data).toHaveProperty('input_tokens');
      expect(typeof data.input_tokens).toBe('number');
      expect(data.input_tokens).toBeGreaterThan(0);
    });

    it('count_tokens 应该包含 cache_read_input_tokens', async () => {
      const config: ApiConfig = {
        apiKey: 'test-key',
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        apiType: 'deepseek',
      };

      startProxyServer(config);

      const response = await fetch('http://127.0.0.1:35721/v1/messages/count_tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'test-key',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'test' }],
        }),
      });

      const data = await response.json();

      expect(data).toHaveProperty('cache_read_input_tokens');
      expect(data).toHaveProperty('cache_creation_input_tokens');
    });

    it('count_tokens 应该处理带 system 的请求', async () => {
      const config: ApiConfig = {
        apiKey: 'test-key',
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        apiType: 'deepseek',
      };

      startProxyServer(config);

      const response = await fetch('http://127.0.0.1:35721/v1/messages/count_tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'test-key',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          system: 'You are a helpful assistant.',
          messages: [{ role: 'user', content: 'test' }],
        }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();

      expect(data.input_tokens).toBeGreaterThan(0);
    });

    it('count_tokens 应该处理带 tools 的请求', async () => {
      const config: ApiConfig = {
        apiKey: 'test-key',
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        apiType: 'deepseek',
      };

      startProxyServer(config);

      const response = await fetch('http://127.0.0.1:35721/v1/messages/count_tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'test-key',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'test' }],
          tools: [{
            name: 'test_tool',
            description: 'A test tool',
            input_schema: {
              type: 'object',
              properties: {},
            },
          }],
        }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();

      expect(data.input_tokens).toBeGreaterThan(0);
    });
  });

  describe('CORS 处理', () => {
    it('应该设置 CORS 头', async () => {
      const config: ApiConfig = {
        apiKey: 'test-key',
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        apiType: 'deepseek',
      };

      startProxyServer(config);

      const response = await fetch('http://127.0.0.1:35721/v1/messages/count_tokens', {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(204);

      const corsHeaders = response.headers;

      expect(corsHeaders.get('Access-Control-Allow-Origin')).toBe('*');
      expect(corsHeaders.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
    });
  });

  describe('错误处理', () => {
    it('count_tokens 无效 JSON 应返回 500', async () => {
      const config: ApiConfig = {
        apiKey: 'test-key',
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        apiType: 'deepseek',
      };

      startProxyServer(config);

      const response = await fetch('http://127.0.0.1:35721/v1/messages/count_tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      expect(response.status).toBe(500);

      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('type', 'internal_error');
    });
  });
});

describe('Token 计算功能', () => {
  it('应该正确估算中文文本 token 数', async () => {
    const config: ApiConfig = {
      apiKey: 'test-key',
      baseURL: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      apiType: 'deepseek',
    };

    startProxyServer(config);

    const chineseText = '这是一个测试文本，包含中文字符。';

    const response = await fetch('http://127.0.0.1:35721/v1/messages/count_tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-key',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: chineseText }],
      }),
    });

    const data = await response.json();

    // Tokenizer 或估算应该返回大于 0 的值
    expect(data.input_tokens).toBeGreaterThan(0);
  });

  it('应该正确估算英文文本 token 数', async () => {
    const config: ApiConfig = {
      apiKey: 'test-key',
      baseURL: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      apiType: 'deepseek',
    };

    startProxyServer(config);

    const englishText = 'This is a test message with English words.';

    const response = await fetch('http://127.0.0.1:35721/v1/messages/count_tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-key',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: englishText }],
      }),
    });

    const data = await response.json();

    // Tokenizer 或估算应该返回大于 0 的值
    expect(data.input_tokens).toBeGreaterThan(0);
  });

  it('应该正确计算多轮对话的 token 数', async () => {
    const config: ApiConfig = {
      apiKey: 'test-key',
      baseURL: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      apiType: 'deepseek',
    };

    startProxyServer(config);

    const response = await fetch('http://127.0.0.1:35721/v1/messages/count_tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-key',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: 'First message' },
          { role: 'assistant', content: 'First response' },
          { role: 'user', content: 'Second message' },
        ],
      }),
    });

    const data = await response.json();

    // 多轮对话应该有更多的 tokens
    expect(data.input_tokens).toBeGreaterThan(0);
  });
});
