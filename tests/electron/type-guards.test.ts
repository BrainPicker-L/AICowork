/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @Email       None
 *
 * 类型守卫单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  isObject,
  isString,
  isNumber,
  isBoolean,
  isSessionStatus,
  isValidServerEvent,
  isValidStreamMessage,
  validateApiConfig,
} from '../../src/electron/utils/type-guards';

describe('基础类型守卫', () => {
  describe('isObject', () => {
    it('应该识别普通对象', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
    });

    it('应该拒绝 null', () => {
      expect(isObject(null)).toBe(false);
    });

    it('应该拒绝数组', () => {
      expect(isObject([])).toBe(false);
      expect(isObject([1, 2, 3])).toBe(false);
    });

    it('应该拒绝基本类型', () => {
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject(true)).toBe(false);
    });
  });

  describe('isString', () => {
    it('应该识别字符串', () => {
      expect(isString('hello')).toBe(true);
      expect(isString('')).toBe(true);
    });

    it('应该拒绝非字符串', () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('应该识别数字', () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-1)).toBe(true);
      expect(isNumber(1.5)).toBe(true);
    });

    it('应该拒绝 NaN', () => {
      expect(isNumber(NaN)).toBe(false);
    });

    it('应该拒绝非数字', () => {
      expect(isNumber('123')).toBe(false);
      expect(isNumber(null)).toBe(false);
    });
  });

  describe('isBoolean', () => {
    it('应该识别布尔值', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
    });

    it('应该拒绝非布尔值', () => {
      expect(isBoolean('true')).toBe(false);
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean(null)).toBe(false);
    });
  });
});

describe('会话状态类型守卫', () => {
  describe('isSessionStatus', () => {
    it('应该识别有效的会话状态', () => {
      expect(isSessionStatus('idle')).toBe(true);
      expect(isSessionStatus('running')).toBe(true);
      expect(isSessionStatus('completed')).toBe(true);
      expect(isSessionStatus('error')).toBe(true);
    });

    it('应该拒绝无效的会话状态', () => {
      expect(isSessionStatus('pending')).toBe(false);
      expect(isSessionStatus('unknown')).toBe(false);
      expect(isSessionStatus('')).toBe(false);
    });
  });
});

describe('事件类型守卫', () => {
  describe('isValidServerEvent', () => {
    it('应该识别有效的事件类型', () => {
      const validTypes = [
        'session.list',
        'session.history',
        'session.status',
        'session.deleted',
        'stream.message',
        'stream.user_prompt',
        'permission.request',
        'runner.error',
      ];

      validTypes.forEach(type => {
        expect(isValidServerEvent({ type })).toBe(true);
      });
    });

    it('应该拒绝无效的事件类型', () => {
      expect(isValidServerEvent({ type: 'unknown.event' })).toBe(false);
      expect(isValidServerEvent({ type: '' })).toBe(false);
    });

    it('应该拒绝非对象', () => {
      expect(isValidServerEvent(null)).toBe(false);
      expect(isValidServerEvent('string')).toBe(false);
      expect(isValidServerEvent(123)).toBe(false);
    });

    it('应该拒绝缺少 type 字段的对象', () => {
      expect(isValidServerEvent({})).toBe(false);
      expect(isValidServerEvent({ payload: {} })).toBe(false);
    });

    it('应该拒绝 type 字段不是字符串的对象', () => {
      expect(isValidServerEvent({ type: 123 })).toBe(false);
      expect(isValidServerEvent({ type: null })).toBe(false);
    });
  });

  describe('isValidStreamMessage', () => {
    it('应该识别有效的消息类型', () => {
      const validTypes = [
        'text',
        'image',
        'tool_use',
        'tool_result',
        'user_prompt',
        'error',
        'stream_event',
      ];

      validTypes.forEach(type => {
        expect(isValidStreamMessage({ type })).toBe(true);
      });
    });

    it('应该拒绝无效的消息类型', () => {
      expect(isValidStreamMessage({ type: 'unknown' })).toBe(false);
      expect(isValidStreamMessage({ type: '' })).toBe(false);
    });

    it('应该拒绝非对象', () => {
      expect(isValidStreamMessage(null)).toBe(false);
      expect(isValidStreamMessage('string')).toBe(false);
    });
  });
});

describe('validateApiConfig', () => {
  it('应该验证有效的 API 配置', () => {
    const config = {
      apiKey: 'sk-ant-1234567890abcdefghijklmnopqrstuvwxyz',
      baseURL: 'https://api.anthropic.com',
      model: 'claude-sonnet',
    };

    const result = validateApiConfig(config);
    expect(result.valid).toBe(true);
    expect(result.config).toEqual(config);
  });

  it('应该拒绝非对象配置', () => {
    expect(validateApiConfig(null).valid).toBe(false);
    expect(validateApiConfig('string').valid).toBe(false);
    expect(validateApiConfig(123).valid).toBe(false);
  });

  it('应该拒绝过短的 API Key', () => {
    const config = {
      apiKey: 'short',
      baseURL: 'https://api.anthropic.com',
      model: 'claude-sonnet',
    };

    const result = validateApiConfig(config);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('应该拒绝空字符串 API Key', () => {
    const config = {
      apiKey: '',
      baseURL: 'https://api.anthropic.com',
      model: 'claude-sonnet',
    };

    const result = validateApiConfig(config);
    expect(result.valid).toBe(false);
  });

  it('应该拒绝非字符串 API Key', () => {
    const config = {
      apiKey: 123 as any,
      baseURL: 'https://api.anthropic.com',
      model: 'claude-sonnet',
    };

    const result = validateApiConfig(config);
    expect(result.valid).toBe(false);
  });

  it('应该拒绝空字符串 baseURL', () => {
    const config = {
      apiKey: 'sk-ant-1234567890abcdefghijklmnopqrstuvwxyz',
      baseURL: '',
      model: 'claude-sonnet',
    };

    const result = validateApiConfig(config);
    expect(result.valid).toBe(false);
  });

  it('应该拒绝空字符串 model', () => {
    const config = {
      apiKey: 'sk-ant-1234567890abcdefghijklmnopqrstuvwxyz',
      baseURL: 'https://api.anthropic.com',
      model: '',
    };

    const result = validateApiConfig(config);
    expect(result.valid).toBe(false);
  });
});
