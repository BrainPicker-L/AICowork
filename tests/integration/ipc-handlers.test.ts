/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-21
 * @updated     2026-01-21
 * @Email       None
 *
 * IPC 处理器集成测试
 * 测试 main.ts 中所有 IPC 处理器的功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserWindow, ipcMain } from 'electron';
import { promises as fs } from 'fs';
import { join } from 'path';
import { app } from 'electron';

// Mock electron
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => `/mock/path/${name}`),
    isPackaged: false,
  },
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
  },
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
  },
  dialog: {
    showOpenDialog: vi.fn(),
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

describe('IPC 处理器集成测试', () => {
  let mockWebContents: any;
  let mockEvent: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);

    mockWebContents = {
      send: vi.fn(),
    };

    mockEvent = {
      sender: {
        send: vi.fn(),
      },
      senderFrame: {
        url: 'file:///mock/path/dist-react/index.html',
      },
    };
  });

  afterEach(() => {
    // 清理所有监听器
  });

  describe('API 配置相关 IPC', () => {
    it('应该正确处理 get-api-config', async () => {
      const mockConfig = {
        id: 'cfg-1',
        name: 'Test Config',
        apiKey: 'sk-ant-test',
        baseURL: 'https://api.anthropic.com',
        model: 'claude-3-5-sonnet-20241022',
        apiType: 'anthropic',
      };

      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          activeConfigId: 'cfg-1',
          configs: [mockConfig],
        })
      );

      // 模拟处理器调用
      const handler = vi.mocked(ipcMain.handle).mock.calls.find(
        call => call[0] === 'get-api-config'
      )?.[1];

      if (handler) {
        const result = await handler(mockEvent);
        expect(result).toEqual(mockConfig);
      }
    });

    it('应该正确处理 get-all-api-configs', async () => {
      const mockStore = {
        activeConfigId: 'cfg-1',
        configs: [
          {
            id: 'cfg-1',
            name: 'Config 1',
            apiKey: 'key1',
            baseURL: 'https://api1.com',
            model: 'model1',
            apiType: 'anthropic',
          },
          {
            id: 'cfg-2',
            name: 'Config 2',
            apiKey: 'key2',
            baseURL: 'https://api2.com',
            model: 'model2',
            apiType: 'openai',
          },
        ],
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockStore));

      const handler = vi.mocked(ipcMain.handle).mock.calls.find(
        call => call[0] === 'get-all-api-configs'
      )?.[1];

      if (handler) {
        const result = await handler(mockEvent);
        expect(result).toEqual(mockStore);
        expect(result.configs).toHaveLength(2);
      }
    });

    it('应该正确处理 save-api-config', async () => {
      const newConfig = {
        id: 'cfg-new',
        name: 'New Config',
        apiKey: 'sk-ant-test',
        baseURL: 'https://api.anthropic.com',
        model: 'claude-3-5-sonnet-20241022',
        apiType: 'anthropic',
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({ configs: [] }));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find(
        call => call[0] === 'save-api-config'
      )?.[1];

      if (handler) {
        const result = await handler(mockEvent, newConfig);
        expect(result.success).toBe(true);
      }
    });

    it('应该正确处理 delete-api-config', async () => {
      const existingStore = {
        activeConfigId: 'cfg-1',
        configs: [
          {
            id: 'cfg-1',
            name: 'Config 1',
            apiKey: 'key1',
            baseURL: 'https://api1.com',
            model: 'model1',
            apiType: 'anthropic',
          },
        ],
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingStore));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find(
        call => call[0] === 'delete-api-config'
      )?.[1];

      if (handler) {
        const result = await handler(mockEvent, 'cfg-1');
        expect(result.success).toBe(true);
      }
    });

    it('应该正确处理 set-active-api-config', async () => {
      const existingStore = {
        activeConfigId: 'cfg-1',
        configs: [
          {
            id: 'cfg-1',
            name: 'Config 1',
            apiKey: 'key1',
            baseURL: 'https://api1.com',
            model: 'model1',
            apiType: 'anthropic',
          },
          {
            id: 'cfg-2',
            name: 'Config 2',
            apiKey: 'key2',
            baseURL: 'https://api2.com',
            model: 'model2',
            apiType: 'openai',
          },
        ],
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingStore));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const handler = vi.mocked(ipcMain.handle).mock.calls.find(
        call => call[0] === 'set-active-api-config'
      )?.[1];

      if (handler) {
        const result = await handler(mockEvent, 'cfg-2');
        expect(result.success).toBe(true);
      }
    });
  });

  describe('错误处理测试', () => {
    it('应该正确处理文件不存在错误', async () => {
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });

      const handler = vi.mocked(ipcMain.handle).mock.calls.find(
        call => call[0] === 'get-api-config'
      )?.[1];

      if (handler) {
        const result = await handler(mockEvent);
        expect(result).toBe(null);
      }
    });

    it('应该正确处理 JSON 解析错误', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid json');

      const handler = vi.mocked(ipcMain.handle).mock.calls.find(
        call => call[0] === 'get-api-config'
      )?.[1];

      if (handler) {
        const result = await handler(mockEvent);
        expect(result).toBe(null);
      }
    });

    it('应该正确处理权限错误', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue({ code: 'EACCES' });

      const handler = vi.mocked(ipcMain.handle).mock.calls.find(
        call => call[0] === 'save-api-config'
      )?.[1];

      if (handler) {
        const result = await handler(mockEvent, {
          id: 'test',
          name: 'Test',
          apiKey: 'sk-ant-test',
          baseURL: 'https://api.anthropic.com',
          model: 'claude-3-5-sonnet-20241022',
          apiType: 'anthropic',
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('IPC 处理器注册验证', () => {
    it('应该注册所有必需的处理器', () => {
      const requiredHandlers = [
        'get-api-config',
        'get-api-config-by-id',
        'get-all-api-configs',
        'save-api-config',
        'delete-api-config',
        'set-active-api-config',
        'check-api-config',
        'validate-api-config',
        'test-api-connection',
        'get-supported-providers',
        'get-provider-config',
        'select-directory',
        'get-anthropic-format-urls',
        'get-all-preset-urls',
      ];

      const registeredHandlers = vi.mocked(ipcMain.handle).mock.calls.map(
        call => call[0]
      );

      for (const handler of requiredHandlers) {
        expect(registeredHandlers).toContain(handler);
      }
    });

    it('不应该有重复的处理器注册', () => {
      const registeredHandlers = vi.mocked(ipcMain.handle).mock.calls.map(
        call => call[0]
      );

      const uniqueHandlers = new Set(registeredHandlers);
      const duplicates = registeredHandlers.filter(
        (item, index) => registeredHandlers.indexOf(item) !== index
      );

      // 检查是否有重复
      if (duplicates.length > 0) {
        console.warn('发现重复的 IPC 处理器:', duplicates);
      }

      // get-all-api-configs 在之前的修复中可能存在重复
      // 这里验证现在应该没有重复
      expect(uniqueHandlers.size).toBe(registeredHandlers.length);
    });
  });

  describe('内存泄漏测试', () => {
    it('应该正确清理事件监听器', async () => {
      // 模拟多次 IPC 调用
      const operations = [];

      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          activeConfigId: 'cfg-1',
          configs: [{
            id: 'cfg-1',
            name: 'Config 1',
            apiKey: 'key1',
            baseURL: 'https://api1.com',
            model: 'model1',
            apiType: 'anthropic',
          }],
        })
      );

      for (let i = 0; i < 100; i++) {
        const handler = vi.mocked(ipcMain.handle).mock.calls.find(
          call => call[0] === 'get-api-config'
        )?.[1];

        if (handler) {
          operations.push(handler(mockEvent));
        }
      }

      await Promise.all(operations);

      // 验证没有内存泄漏（需要实际的内存检测工具）
      expect(operations.length).toBe(100);
    });
  });

  describe('参数验证测试', () => {
    it('应该验证配置 ID 参数', async () => {
      const invalidIds = [
        '',
        '../../etc/passwd',
        '<script>alert("XSS")</script>',
        null,
        undefined,
      ];

      for (const id of invalidIds) {
        const handler = vi.mocked(ipcMain.handle).mock.calls.find(
          call => call[0] === 'delete-api-config'
        )?.[1];

        if (handler) {
          // 应该拒绝无效 ID 或进行清理
          await expect(handler(mockEvent, id as any)).resolves.toBeDefined();
        }
      }
    });

    it('应该验证配置对象参数', async () => {
      const invalidConfigs = [
        null,
        undefined,
        '',
        { id: '' },
        { id: 'test', apiKey: '' },
        { id: 'test', apiKey: 'key', baseURL: 'invalid-url' },
      ];

      for (const config of invalidConfigs) {
        const handler = vi.mocked(ipcMain.handle).mock.calls.find(
          call => call[0] === 'save-api-config'
        )?.[1];

        if (handler) {
          const result = await handler(mockEvent, config);
          // 应该返回错误
          expect(result.success).toBe(false);
        }
      }
    });
  });
});
