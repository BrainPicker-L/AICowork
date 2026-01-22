/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-21
 * @updated     2026-01-21
 * @Email       None
 *
 * skills-store.ts 单元测试
 * 测试技能管理的所有功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { app } from 'electron';
import {
  getSkillsList,
  createSkill,
  deleteSkill,
  getSkillDetail,
} from '../../src/electron/libs/skills-store';

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => `/mock/path/${name}`),
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
    stat: vi.fn(),
  },
}));

describe('skills-store', () => {
  const mockUserDataPath = '/mock/path/userData';
  const mockSkillsDir = join(mockUserDataPath, 'skills');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
  });

  describe('路径安全验证', () => {
    it('应该阻止路径遍历攻击', async () => {
      const maliciousName = '../../etc/passwd';

      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'skill1', isDirectory: () => true },
      ]);

      await expect(createSkill({
        name: maliciousName,
        description: 'Malicious',
        prompt: 'test',
      })).rejects.toThrow();
    });

    it('应该阻止绝对路径', async () => {
      const absolutePath = '/etc/passwd';

      await expect(createSkill({
        name: absolutePath,
        description: 'Malicious',
        prompt: 'test',
      })).rejects.toThrow();
    });

    it('应该阻止包含特殊字符的名称', async () => {
      const specialChars = '../../../test<script>';

      await expect(createSkill({
        name: specialChars,
        description: 'Malicious',
        prompt: 'test',
      })).rejects.toThrow();
    });

    it('应该接受合法的技能名称', async () => {
      const validNames = [
        'test-skill',
        'test_skill',
        'TestSkill123',
        'my-skill-001',
      ];

      for (const name of validNames) {
        vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' } as never);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined);

        const result = await createSkill({
          name,
          description: 'Valid skill',
          prompt: 'test',
        });

        expect(result.success).toBe(true);
      }
    });

    it('应该拒绝过长的名称', async () => {
      const longName = 'a'.repeat(100);

      await expect(createSkill({
        name: longName,
        description: 'Too long',
        prompt: 'test',
      })).rejects.toThrow();
    });

    it('应该拒绝空名称', async () => {
      await expect(createSkill({
        name: '',
        description: 'Empty',
        prompt: 'test',
      })).rejects.toThrow();
    });
  });

  describe('getSkillsList', () => {
    it('应该在目录不存在时返回空数组', async () => {
      vi.mocked(fs.readdir).mockRejectedValue({ code: 'ENOENT' } as never);

      const result = await getSkillsList();
      expect(result).toEqual([]);
    });

    it('应该返回技能列表', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'skill1', isDirectory: () => true },
        { name: 'skill2', isDirectory: () => true },
      ] as any);

      vi.mocked(fs.stat).mockResolvedValue({
        mtime: new Date('2024-01-01'),
      } as any);

      vi.mocked(fs.readFile)
        .mockResolvedValueOnce('# Skill1\n\nTest content 1')
        .mockResolvedValueOnce('# Skill2\n\nTest content 2');

      const result = await getSkillsList();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('skill1');
      expect(result[1].name).toBe('skill2');
    });

    it('应该过滤掉非目录项', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'skill1', isDirectory: () => true },
        { name: 'readme.txt', isDirectory: () => false },
      ] as any);

      vi.mocked(fs.stat).mockResolvedValue({
        mtime: new Date('2024-01-01'),
      } as any);

      vi.mocked(fs.readFile).mockResolvedValue('# Skill1\n\nTest');

      const result = await getSkillsList();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('skill1');
    });
  });

  describe('createSkill', () => {
    it('应该创建新技能', async () => {
      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' } as never);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const result = await createSkill({
        name: 'test-skill',
        description: 'Test skill description',
        prompt: 'Test prompt',
      });

      expect(result.success).toBe(true);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('应该防止重复创建', async () => {
      // 第一次调用成功
      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' } as never);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await createSkill({
        name: 'test-skill',
        description: 'Test',
        prompt: 'Test',
      });

      // 第二次调用应该检测到已存在
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await createSkill({
        name: 'test-skill',
        description: 'Test',
        prompt: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('已存在');
    });

    it('应该创建正确的 SKILL.md 格式', async () => {
      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' } as never);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await createSkill({
        name: 'my-skill',
        description: 'My description',
        prompt: 'My prompt',
      });

      const writeArgs = vi.mocked(fs.writeFile).mock.calls[0];
      const content = writeArgs[1] as string;

      expect(content).toContain('# my-skill');
      expect(content).toContain('## 描述');
      expect(content).toContain('My description');
      expect(content).toContain('## 指导');
      expect(content).toContain('My prompt');
      expect(content).toContain('*Created:');
    });

    it('应该使用原子操作防止竞争条件', async () => {
      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' } as never);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked((() => require('fs')).promises.rename).mockResolvedValue(undefined);

      await createSkill({
        name: 'concurrent-skill',
        description: 'Test',
        prompt: 'Test',
      });

      // 验证先写临时文件
      const tempFileCalls = vi.mocked(fs.writeFile).mock.calls.filter(
        call => (call[0] as string).endsWith('.tmp')
      );
      expect(tempFileCalls.length).toBe(1);
    });
  });

  describe('deleteSkill', () => {
    it('应该删除技能', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.rm).mockResolvedValue(undefined);

      const result = await deleteSkill('test-skill');

      expect(result.success).toBe(true);
      expect(fs.rm).toHaveBeenCalledWith(
        expect.stringContaining('test-skill'),
        { recursive: true, force: true }
      );
    });

    it('应该拒绝删除不存在的技能', async () => {
      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' } as never);

      const result = await deleteSkill('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('不存在');
    });

    it('应该在删除时验证技能名称', async () => {
      await expect(deleteSkill('../../etc/passwd')).rejects.toThrow();
    });
  });

  describe('getSkillDetail', () => {
    it('应该返回技能详情', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        mtime: new Date('2024-01-01'),
        birthtime: new Date('2024-01-01'),
      } as any);

      vi.mocked(fs.readFile).mockResolvedValue(
        '# test-skill\n\n## 描述\nTest description\n\n## 指导\nTest prompt'
      );

      const result = await getSkillDetail('test-skill');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('test-skill');
      expect(result?.description).toBe('Test description');
      expect(result?.prompt).toBe('Test prompt');
    });

    it('应该在技能不存在时返回 null', async () => {
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' } as never);

      const result = await getSkillDetail('nonexistent');

      expect(result).toBeNull();
    });

    it('应该处理格式不正确的 SKILL.md', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        mtime: new Date('2024-01-01'),
        birthtime: new Date('2024-01-01'),
      } as any);

      vi.mocked(fs.readFile).mockResolvedValue(
        'Invalid content without proper sections'
      );

      const result = await getSkillDetail('test-skill');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('test-skill');
    });

    it('应该在获取详情时验证技能名称', async () => {
      await expect(getSkillDetail('../../etc/passwd')).rejects.toThrow();
    });
  });
});
