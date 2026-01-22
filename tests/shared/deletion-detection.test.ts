/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @Email       None
 *
 * 删除检测模块单元测试
 */

import { describe, it, expect } from 'vitest';
import { checkIfDeletionOperation, isDeletionPermissionRequest } from '../../src/shared/deletion-detection';

describe('checkIfDeletionOperation', () => {
  describe('Bash 工具删除检测', () => {
    it('应该检测 PowerShell Remove-Item 命令', () => {
      const input = { command: 'Remove-Item -Path "test.txt"' };
      expect(checkIfDeletionOperation('Bash', input)).toBe(true);
    });

    it('应该检测 PowerShell Delete-Item 命令', () => {
      const input = { command: 'Delete-Item "file.txt"' };
      expect(checkIfDeletionOperation('Bash', input)).toBe(true);
    });

    it('应该检测 PowerShell 通过子Shell调用', () => {
      const input = { command: 'powershell -Command "Remove-Item test.txt"' };
      expect(checkIfDeletionOperation('Bash', input)).toBe(true);
    });

    it('应该检测 CMD del 命令', () => {
      const input = { command: 'cmd /c "del test.txt"' };
      expect(checkIfDeletionOperation('Bash', input)).toBe(true);
    });

    it('应该检测 CMD erase 命令', () => {
      const input = { command: 'cmd /c "erase file.txt"' };
      expect(checkIfDeletionOperation('Bash', input)).toBe(true);
    });

    it('应该检测 Unix rm 命令（修复：简单文件名）', () => {
      const input = { command: 'rm file.txt' };
      expect(checkIfDeletionOperation('Bash', input)).toBe(true);
    });

    it('应该检测 Unix rm -rf 命令', () => {
      const input = { command: 'rm -rf directory' };
      expect(checkIfDeletionOperation('Bash', input)).toBe(true);
    });

    it('应该检测 Unix rm -f 命令', () => {
      const input = { command: 'rm -f file.txt' };
      expect(checkIfDeletionOperation('Bash', input)).toBe(true);
    });

    it('应该检测 rmdir 命令', () => {
      const input = { command: 'rmdir directory' };
      expect(checkIfDeletionOperation('Bash', input)).toBe(true);
    });

    it('应该检测 unlink 命令', () => {
      const input = { command: 'unlink file.txt' };
      expect(checkIfDeletionOperation('Bash', input)).toBe(true);
    });

    it('应该检测 bash 子Shell中的 rm 命令', () => {
      const input = { command: 'bash -c "rm file.txt"' };
      expect(checkIfDeletionOperation('Bash', input)).toBe(true);
    });

    it('应该检测 sh 子Shell中的 rm 命令', () => {
      const input = { command: 'sh -c "rm file.txt"' };
      expect(checkIfDeletionOperation('Bash', input)).toBe(true);
    });

    it('应该检测通过管道传递的 del 命令', () => {
      const input = { command: 'cat files.txt | del file.txt' };
      expect(checkIfDeletionOperation('Bash', input)).toBe(true);
    });

    it('应该不检测非删除命令', () => {
      const input = { command: 'ls -la' };
      expect(checkIfDeletionOperation('Bash', input)).toBe(false);
    });

    it('应该不检测 cat 命令', () => {
      const input = { command: 'cat file.txt' };
      expect(checkIfDeletionOperation('Bash', input)).toBe(false);
    });

    it('应该不检测 echo 命令', () => {
      const input = { command: 'echo "hello"' };
      expect(checkIfDeletionOperation('Bash', input)).toBe(false);
    });

    // 边界情况：单独的 "rm" 不带参数不应该被检测
    it('应该不检测单独的 rm 命令（没有参数）', () => {
      const input = { command: 'rm' };
      expect(checkIfDeletionOperation('Bash', input)).toBe(false);
    });

    // 边界情况：rm 后面跟空格和换行
    it('应该检测 rm 后面跟空格的命令', () => {
      const input = { command: 'rm file.txt' };
      expect(checkIfDeletionOperation('Bash', input)).toBe(true);
    });
  });

  describe('Write 工具删除检测', () => {
    it('应该检测空内容写入作为潜在删除操作', () => {
      const input = { path: 'test.txt', content: '' };
      expect(checkIfDeletionOperation('Write', input)).toBe(true);
    });

    it('应该检测仅包含空格的写入作为潜在删除操作', () => {
      const input = { path: 'test.txt', content: '   ' };
      expect(checkIfDeletionOperation('Write', input)).toBe(true);
    });

    it('应该不检测非空内容写入', () => {
      const input = { path: 'test.txt', content: 'hello world' };
      expect(checkIfDeletionOperation('Write', input)).toBe(false);
    });
  });

  describe('其他工具', () => {
    it('应该不检测 Read 工具', () => {
      const input = { path: 'test.txt' };
      expect(checkIfDeletionOperation('Read', input)).toBe(false);
    });

    it('应该不检测未知工具', () => {
      const input = { some: 'input' };
      expect(checkIfDeletionOperation('UnknownTool', input)).toBe(false);
    });

    it('应该处理 null 输入', () => {
      expect(checkIfDeletionOperation('Bash', null)).toBe(false);
    });

    it('应该处理 undefined 输入', () => {
      expect(checkIfDeletionOperation('Bash', undefined)).toBe(false);
    });

    it('应该处理非对象输入', () => {
      expect(checkIfDeletionOperation('Bash', 'string')).toBe(false);
    });
  });
});

describe('isDeletionPermissionRequest', () => {
  it('应该检测 Bash 删除命令的权限请求', () => {
    const request = {
      toolName: 'Bash',
      input: { command: 'rm file.txt' },
    };
    expect(isDeletionPermissionRequest(request)).toBe(true);
  });

  it('应该检测 Write 空内容写入的权限请求', () => {
    const request = {
      toolName: 'Write',
      input: { path: 'test.txt', content: '' },
    };
    expect(isDeletionPermissionRequest(request)).toBe(true);
  });

  it('应该不检测非删除操作的权限请求', () => {
    const request = {
      toolName: 'Bash',
      input: { command: 'ls -la' },
    };
    expect(isDeletionPermissionRequest(request)).toBe(false);
  });

  it('应该处理 undefined 请求', () => {
    expect(isDeletionPermissionRequest(undefined)).toBe(false);
  });
});
