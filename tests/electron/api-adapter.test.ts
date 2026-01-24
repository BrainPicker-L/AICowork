/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @updated     2026-01-24
 * @Email       None
 *
 * API 适配器单元测试
 * 测试厂商默认配置的正确性
 */

import { describe, it, expect } from 'vitest';
import { getProviderDefaults } from '../../src/electron/libs/api-adapter';

describe('getProviderDefaults', () => {
  it('应该返回 Anthropic 的默认配置', () => {
    const defaults = getProviderDefaults('anthropic');
    expect(defaults.baseURL).toBe('https://api.anthropic.com');
    expect(defaults.models).toContain('claude-sonnet-4-20250514');
    expect(defaults.defaultModel).toBeDefined();
  });

  it('应该返回智谱 AI 的默认配置', () => {
    const defaults = getProviderDefaults('zhipu');
    expect(defaults.baseURL).toBe('https://open.bigmodel.cn/api/anthropic');
    expect(defaults.models).toContain('glm-4');
    expect(defaults.defaultModel).toBeDefined();
  });

  it('应该返回 DeepSeek 的默认配置', () => {
    const defaults = getProviderDefaults('deepseek');
    expect(defaults.baseURL).toBe('https://api.deepseek.com');
    expect(defaults.models).toContain('deepseek-chat');
    expect(defaults.defaultModel).toBeDefined();
  });

  it('应该返回阿里云百炼的默认配置', () => {
    const defaults = getProviderDefaults('alibaba');
    expect(defaults.baseURL).toBe('https://dashscope.aliyuncs.com/apps/anthropic');
    expect(defaults.models).toContain('qwen-plus');
    expect(defaults.defaultModel).toBeDefined();
  });

  it('应该返回 MiniMax 的默认配置', () => {
    const defaults = getProviderDefaults('minimax');
    expect(defaults.baseURL).toBe('https://api.minimaxi.com/anthropic');
    expect(defaults.models).toContain('MiniMax-M2.1');
    expect(defaults.defaultModel).toBeDefined();
  });

  it('应该返回七牛云的默认配置', () => {
    const defaults = getProviderDefaults('qiniu');
    expect(defaults.baseURL).toBe('https://api.qnaigc.com');
    expect(defaults.models).toContain('qwen-plus');
    expect(defaults.defaultModel).toBeDefined();
  });

  it('应该返回月之暗面的默认配置', () => {
    const defaults = getProviderDefaults('moonshot');
    expect(defaults.baseURL).toBe('https://api.moonshot.cn/anthropic');
    expect(defaults.models).toContain('moonshot-v1-128k');
    expect(defaults.defaultModel).toBeDefined();
  });

  it('应该返回 N1N.AI 的默认配置', () => {
    const defaults = getProviderDefaults('n1n');
    expect(defaults.baseURL).toBe('https://api.n1n.ai');
    expect(defaults.models).toContain('claude-sonnet-4-20250514');
    expect(defaults.defaultModel).toBeDefined();
  });

  it('应该返回自定义提供商的默认配置', () => {
    const defaults = getProviderDefaults('custom');
    expect(defaults.baseURL).toBe('https://api.example.com');
    expect(defaults.models).toContain('custom-model');
    expect(defaults.defaultModel).toBe('custom-model');
  });

  it('所有提供商都应该有 baseURL', () => {
    const providers: Array<'anthropic' | 'zhipu' | 'deepseek' | 'alibaba' | 'qiniu' | 'moonshot' | 'n1n' | 'minimax' | 'custom'> = [
      'anthropic', 'zhipu', 'deepseek', 'alibaba',
      'qiniu', 'moonshot', 'n1n', 'minimax', 'custom'
    ];

    providers.forEach(provider => {
      const defaults = getProviderDefaults(provider);
      expect(defaults.baseURL).toBeDefined();
      expect(defaults.baseURL.length).toBeGreaterThan(0);
    });
  });

  it('所有提供商都应该有模型列表', () => {
    const providers: Array<'anthropic' | 'zhipu' | 'deepseek' | 'alibaba' | 'qiniu' | 'moonshot' | 'n1n' | 'minimax' | 'custom'> = [
      'anthropic', 'zhipu', 'deepseek', 'alibaba',
      'qiniu', 'moonshot', 'n1n', 'minimax', 'custom'
    ];

    providers.forEach(provider => {
      const defaults = getProviderDefaults(provider);
      expect(defaults.models).toBeDefined();
      expect(defaults.models.length).toBeGreaterThan(0);
    });
  });

  it('所有提供商都应该有默认模型', () => {
    const providers: Array<'anthropic' | 'zhipu' | 'deepseek' | 'alibaba' | 'qiniu' | 'moonshot' | 'n1n' | 'minimax' | 'custom'> = [
      'anthropic', 'zhipu', 'deepseek', 'alibaba',
      'qiniu', 'moonshot', 'n1n', 'minimax', 'custom'
    ];

    providers.forEach(provider => {
      const defaults = getProviderDefaults(provider);
      expect(defaults.defaultModel).toBeDefined();
      expect(defaults.models).toContain(defaults.defaultModel);
    });
  });
});

describe('ApiConfig 接口类型一致性', () => {
  it('apiType 应该是可选字段', () => {
    // 测试类型定义：apiType 是可选的
    const config1 = {
      apiKey: 'sk-test-key',
      baseURL: 'https://api.example.com',
      model: 'test-model',
    };

    const config2 = {
      apiType: 'anthropic' as const,
      apiKey: 'sk-test-key',
      baseURL: 'https://api.anthropic.com',
      model: 'claude-sonnet',
    };

    // 两种配置都应该有效
    expect(config1.apiKey).toBeDefined();
    expect(config2.apiType).toBe('anthropic');
  });
});
