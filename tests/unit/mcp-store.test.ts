/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-21
 * @updated     2026-01-21
 * @Email       None
 *
 * mcp-store.ts 单元测试
 * 测试 MCP 服务器配置存储的所有功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import {
  loadMcpServers,
  loadMcpServer,
  saveMcpServer,
  deleteMcpServer,
  getMcpServerList,
  validateMcpServer,
  createMcpServerFromTemplate,
  MCP_TEMPLATES,
} from '../../src/electron/libs/mcp-store';

// Mock os
vi.mock('os', () => ({
  homedir: vi.fn(() => '/mock/home'),
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

describe('mcp-store', () => {
  const mockHomeDir = '/mock/home';
  const mockSettingsPath = join(mockHomeDir, '.claude', 'settings.json');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
  });

  describe('loadMcpServers', () => {
    it('应该在文件不存在时返回空对象', async () => {
      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' } as never);

      const result = await loadMcpServers();
      expect(result).toEqual({});
    });

    it('应该加载所有 MCP 服务器配置', async () => {
      const mockSettings = {
        mcpServers: {
          github: {
            name: 'github',
            command: 'npx',
            args: ['@modelcontextprotocol/server-github'],
          },
          filesystem: {
            name: 'filesystem',
            command: 'npx',
            args: ['@modelcontextprotocol/server-filesystem', '/path'],
          },
        },
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSettings));

      const result = await loadMcpServers();
      expect(result).toHaveProperty('github');
      expect(result).toHaveProperty('filesystem');
    });

    it('应该处理 JSON 解析错误', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('invalid json');

      const result = await loadMcpServers();
      expect(result).toEqual({});
    });

    it('应该处理文件不存在错误', async () => {
      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' } as never);

      const result = await loadMcpServers();
      expect(result).toEqual({});
    });
  });

  describe('loadMcpServer', () => {
    it('应该返回指定的服务器配置', async () => {
      const mockSettings = {
        mcpServers: {
          github: {
            name: 'github',
            displayName: 'GitHub',
            command: 'npx',
            args: ['@modelcontextprotocol/server-github'],
          },
        },
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSettings));

      const result = await loadMcpServer('github');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('github');
    });

    it('应该在服务器不存在时返回 null', async () => {
      const mockSettings = {
        mcpServers: {
          github: {
            name: 'github',
            command: 'npx',
            args: ['@modelcontextprotocol/server-github'],
          },
        },
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSettings));

      const result = await loadMcpServer('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('saveMcpServer', () => {
    it('应该保存新服务器配置', async () => {
      const newServer = {
        name: 'test-server',
        command: 'npx',
        args: ['@test/server'],
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ mcpServers: {} }));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await saveMcpServer('test-server', newServer);

      expect(fs.writeFile).toHaveBeenCalled();
      const writtenData = JSON.parse(vi.mocked(fs.writeFile).mock.calls[0][1] as string);
      expect(writtenData.mcpServers['test-server']).toBeDefined();
    });

    it('应该更新现有服务器配置', async () => {
      const existingSettings = {
        mcpServers: {
          'test-server': {
            name: 'test-server',
            command: 'npx',
            args: ['@old/server'],
          },
        },
      };

      const updatedServer = {
        name: 'test-server',
        command: 'npx',
        args: ['@new/server'],
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingSettings));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await saveMcpServer('test-server', updatedServer);

      const writtenData = JSON.parse(vi.mocked(fs.writeFile).mock.calls[0][1] as string);
      expect(writtenData.mcpServers['test-server'].args).toEqual(['@new/server']);
    });

    it('应该添加时间戳', async () => {
      const server = {
        name: 'test',
        command: 'npx',
        args: ['@test'],
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ mcpServers: {} }));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await saveMcpServer('test', server);

      const writtenData = JSON.parse(vi.mocked(fs.writeFile).mock.calls[0][1] as string);
      expect(writtenData.mcpServers.test.updatedAt).toBeDefined();
      expect(typeof writtenData.mcpServers.test.updatedAt).toBe('number');
    });
  });

  describe('deleteMcpServer', () => {
    it('应该删除指定的服务器', async () => {
      const existingSettings = {
        mcpServers: {
          'test-server': {
            name: 'test-server',
            command: 'npx',
            args: ['@test'],
          },
        },
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingSettings));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await deleteMcpServer('test-server');

      const writtenData = JSON.parse(vi.mocked(fs.writeFile).mock.calls[0][1] as string);
      expect(writtenData.mcpServers['test-server']).toBeUndefined();
    });

    it('删除不存在的服务器不应该报错', async () => {
      const existingSettings = {
        mcpServers: {},
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingSettings));

      await expect(deleteMcpServer('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('getMcpServerList', () => {
    it('应该返回服务器列表数组', async () => {
      const mockSettings = {
        mcpServers: {
          github: { name: 'github', command: 'npx' },
          filesystem: { name: 'filesystem', command: 'npx' },
        },
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSettings));

      const result = await getMcpServerList();
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('config');
    });

    it('空配置应该返回空数组', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ mcpServers: {} }));

      const result = await getMcpServerList();
      expect(result).toHaveLength(0);
    });
  });

  describe('validateMcpServer', () => {
    it('应该验证有效的 stdio 配置', () => {
      const validConfig = {
        name: 'test-server',
        type: 'stdio' as const,
        command: 'npx',
        args: ['@test/server'],
      };

      const result = validateMcpServer(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该验证有效的 sse 配置', () => {
      const validConfig = {
        name: 'test-server',
        type: 'sse' as const,
        url: 'https://example.com/sse',
      };

      const result = validateMcpServer(validConfig);
      expect(result.valid).toBe(true);
    });

    it('应该拒绝缺少名称的配置', () => {
      const invalidConfig = {
        name: '',
        type: 'stdio' as const,
        command: 'npx',
      };

      const result = validateMcpServer(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('名称'))).toBe(true);
    });

    it('应该拒绝 stdio 类型缺少命令的配置', () => {
      const invalidConfig = {
        name: 'test',
        type: 'stdio' as const,
      };

      const result = validateMcpServer(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('命令'))).toBe(true);
    });

    it('应该拒绝 sse 类型缺少 URL 的配置', () => {
      const invalidConfig = {
        name: 'test',
        type: 'sse' as const,
      };

      const result = validateMcpServer(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('URL'))).toBe(true);
    });

    it('应该拒绝无效的 URL', () => {
      const invalidConfig = {
        name: 'test',
        type: 'sse' as const,
        url: 'not-a-valid-url',
      };

      const result = validateMcpServer(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('URL'))).toBe(true);
    });

    it('应该拒绝无效的服务器类型', () => {
      const invalidConfig = {
        name: 'test',
        type: 'invalid' as any,
      };

      const result = validateMcpServer(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('类型'))).toBe(true);
    });

    it('应该允许默认类型为 stdio', () => {
      const config = {
        name: 'test',
        command: 'npx',
      };

      const result = validateMcpServer(config as any);
      // 默认类型应该是 stdio，所以需要 command
      expect(result.errors.some(e => e.includes('命令'))).toBe(false);
    });
  });

  describe('MCP_TEMPLATES', () => {
    it('应该包含预定义的模板', () => {
      expect(MCP_TEMPLATES.github).toBeDefined();
      expect(MCP_TEMPLATES.filesystem).toBeDefined();
      expect(MCP_TEMPLATES.brave_search).toBeDefined();
    });

    it('模板应该包含必需字段', () => {
      const githubTemplate = MCP_TEMPLATES.github;
      expect(githubTemplate).toHaveProperty('name');
      expect(githubTemplate).toHaveProperty('displayName');
      expect(githubTemplate).toHaveProperty('command');
      expect(githubTemplate).toHaveProperty('args');
    });
  });

  describe('createMcpServerFromTemplate', () => {
    it('应该从模板创建服务器配置', () => {
      const config = createMcpServerFromTemplate('github');
      expect(config.name).toBe('github');
      expect(config.command).toBe('npx');
      expect(config.args).toContain('@modelcontextprotocol/server-github');
    });

    it('应该允许自定义名称', () => {
      const config = createMcpServerFromTemplate('github', 'my-github');
      expect(config.name).toBe('my-github');
    });

    it('应该拒绝未知模板', () => {
      expect(() => createMcpServerFromTemplate('unknown')).toThrow();
    });
  });
});
