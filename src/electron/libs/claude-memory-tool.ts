/**
 * Claude Memory Tool 处理器
 * 实现 memory_20250818 工具类型的标准命令
 * 支持 view/create/str_replace/insert/delete/rename 操作
 */

import { promises as fs } from 'fs';
import { join, resolve, normalize, relative } from 'path';
import { app } from 'electron';
import { log } from '../logger.js';

/**
 * 获取记忆目录路径
 */
function getMemoriesDir(): string {
  const userDataPath = app.getPath('userData');
  return join(userDataPath, 'memories');
}

/**
 * 确保记忆目录存在
 */
async function ensureMemoriesDir(): Promise<void> {
  const memoriesDir = getMemoriesDir();
  try {
    await fs.mkdir(memoriesDir, { recursive: true });
  } catch (error) {
    log.error('[Memory Tool] Failed to create memories directory:', error);
    throw error;
  }
}

/**
 * 验证路径安全性（防止目录遍历攻击）
 */
function validatePath(path: string): { valid: boolean; resolvedPath?: string; error?: string } {
  try {
    // 路径必须以 /memories 开头
    if (!path.startsWith('/memories')) {
      return {
        valid: false,
        error: `路径必须以 /memories 开头，收到: ${path}`
      };
    }

    const memoriesDir = getMemoriesDir();
    const resolvedPath = resolve(memoriesDir, path.slice(1)); // 去掉开头的 /

    // 确保解析后的路径在 memories 目录内
    const rel = relative(memoriesDir, resolvedPath);
    if (rel.startsWith('..') || path.includes('..')) {
      return {
        valid: false,
        error: `路径试图访问 memories 目录外: ${path}`
      };
    }

    return { valid: true, resolvedPath };
  } catch (error) {
    return {
      valid: false,
      error: `路径验证失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)}${units[unitIndex]}`;
}

/**
 * 处理 view 命令
 */
async function handleView(path: string, viewRange?: [number, number]): Promise<string> {
  await ensureMemoriesDir();

  const validation = validatePath(path);
  if (!validation.valid) {
    return `Error: ${validation.error}`;
  }

  const targetPath = validation.resolvedPath!;

  try {
    const stats = await fs.stat(targetPath);

    if (stats.isDirectory()) {
      // 列出目录内容
      const entries = await fs.readdir(targetPath, { withFileTypes: true });

      // 递归获取子目录（最多2级深度）
      const lines: string[] = [];
      lines.push(`Here're the files and directories up to 2 levels deep in ${path}, excluding hidden items and node_modules:`);

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue; // 跳过隐藏文件
        if (entry.name === 'node_modules') continue; // 跳过 node_modules

        const entryPath = join(targetPath, entry.name);
        const entryStats = await fs.stat(entryPath);
        const size = formatFileSize(entryStats.size);
        lines.push(`${size}\t${path}/${entry.name}`);

        // 如果是目录，列出其直接子项
        if (entry.isDirectory()) {
          try {
            const subEntries = await fs.readdir(entryPath, { withFileTypes: true });
            for (const subEntry of subEntries) {
              if (subEntry.name.startsWith('.')) continue;
              const subPath = join(entryPath, subEntry.name);
              const subStats = await fs.stat(subPath);
              const subSize = formatFileSize(subStats.size);
              lines.push(`${subSize}\t${path}/${entry.name}/${subEntry.name}`);
            }
          } catch {
            // 忽略无法访问的子目录
          }
        }
      }

      return lines.join('\n');
    } else {
      // 读取文件内容
      const content = await fs.readFile(targetPath, 'utf-8');
      const lines = content.split('\n');

      // 检查行数限制
      if (lines.length > 999999) {
        return `Error: File ${path} exceeds maximum line limit of 999,999 lines.`;
      }

      let resultLines: string[];

      if (viewRange) {
        const [start, end] = viewRange;
        resultLines = lines.slice(Math.max(0, start - 1), Math.min(lines.length, end));
      } else {
        resultLines = lines;
      }

      // 格式化为带行号的内容
      const formatted = resultLines
        .map((line, index) => {
          const lineNum = (viewRange ? viewRange[0] + index : index + 1).toString().padStart(6, ' ');
          return `${lineNum}\t${line}`;
        })
        .join('\n');

      return `Here's the content of ${path} with line numbers:\n${formatted}`;
    }
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      return `Error: The path ${path} does not exist. Please provide a valid path.`;
    }
    return `Error: Failed to view ${path}: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * 处理 create 命令
 */
async function handleCreate(path: string, fileText: string): Promise<string> {
  await ensureMemoriesDir();

  const validation = validatePath(path);
  if (!validation.valid) {
    return `Error: ${validation.error}`;
  }

  const targetPath = validation.resolvedPath!;

  try {
    // 检查文件是否已存在
    await fs.access(targetPath);
    return `Error: File ${path} already exists`;
  } catch {
    // 文件不存在，可以创建
    try {
      // 确保父目录存在
      const parentDir = join(targetPath, '..');
      await fs.mkdir(parentDir, { recursive: true });

      await fs.writeFile(targetPath, fileText, 'utf-8');
      return `File created successfully at: ${path}`;
    } catch (error) {
      return `Error: Failed to create file: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}

/**
 * 处理 str_replace 命令
 */
async function handleStrReplace(path: string, oldStr: string, newStr: string): Promise<string> {
  await ensureMemoriesDir();

  const validation = validatePath(path);
  if (!validation.valid) {
    return `Error: ${validation.error}`;
  }

  const targetPath = validation.resolvedPath!;

  try {
    const stats = await fs.stat(targetPath);
    if (stats.isDirectory()) {
      return `Error: The path ${path} does not exist. Please provide a valid path.`;
    }

    let content = await fs.readFile(targetPath, 'utf-8');

    // 检查 old_str 是否存在
    if (!content.includes(oldStr)) {
      return `No replacement was performed, old_str \`${oldStr}\` did not appear verbatim in ${path}.`;
    }

    // 检查是否重复出现
    const occurrences = (content.match(new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (occurrences > 1) {
      const lines: number[] = [];
      let currentIndex = 0;
      while ((currentIndex = content.indexOf(oldStr, currentIndex)) !== -1) {
        const lineNumber = content.substring(0, currentIndex).split('\n').length;
        lines.push(lineNumber);
        currentIndex += oldStr.length;
      }
      return `No replacement was performed. Multiple occurrences of old_str \`${oldStr}\` in lines: ${lines.join(', ')}. Please ensure it is unique`;
    }

    // 执行替换
    content = content.replace(oldStr, newStr);
    await fs.writeFile(targetPath, content, 'utf-8');

    // 返回编辑后的代码片段
    const lines = content.split('\n');
    const startIndex = content.indexOf(newStr);
    const startLine = content.substring(0, startIndex).split('\n').length;

    const snippetLines = lines.slice(Math.max(0, startLine - 2), startLine + 4);
    const snippet = snippetLines
      .map((line, index) => {
        const lineNum = (startLine - 2 + index + 1).toString().padStart(6, ' ');
        return `${lineNum}\t${line}`;
      })
      .join('\n');

    return `The memory file has been edited.\n${snippet}`;
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      return `Error: The path ${path} does not exist. Please provide a valid path.`;
    }
    return `Error: Failed to edit file: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * 处理 insert 命令
 */
async function handleInsert(path: string, insertLine: number, insertText: string): Promise<string> {
  await ensureMemoriesDir();

  const validation = validatePath(path);
  if (!validation.valid) {
    return `Error: ${validation.error}`;
  }

  const targetPath = validation.resolvedPath!;

  try {
    const stats = await fs.stat(targetPath);
    if (stats.isDirectory()) {
      return `Error: The path ${path} does not exist`;
    }

    const content = await fs.readFile(targetPath, 'utf-8');
    const lines = content.split('\n');

    // 验证 insert_line 参数
    if (insertLine < 0 || insertLine > lines.length) {
      return `Error: Invalid \`insert_line\` parameter: ${insertLine}. It should be within the range of lines of the file: [0, ${lines.length}]`;
    }

    // 插入文本
    lines.splice(insertLine, 0, insertText);
    const newContent = lines.join('\n');
    await fs.writeFile(targetPath, newContent, 'utf-8');

    return `The file ${path} has been edited.`;
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      return `Error: The path ${path} does not exist`;
    }
    return `Error: Failed to insert into file: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * 处理 delete 命令
 */
async function handleDelete(path: string): Promise<string> {
  await ensureMemoriesDir();

  const validation = validatePath(path);
  if (!validation.valid) {
    return `Error: ${validation.error}`;
  }

  const targetPath = validation.resolvedPath!;

  try {
    await fs.unlink(targetPath);
    return `Successfully deleted ${path}`;
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      return `Error: The path ${path} does not exist`;
    }
    return `Error: Failed to delete: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * 处理 rename 命令
 */
async function handleRename(oldPath: string, newPath: string): Promise<string> {
  await ensureMemoriesDir();

  const oldValidation = validatePath(oldPath);
  if (!oldValidation.valid) {
    return `Error: The path ${oldPath} does not exist`;
  }

  const newValidation = validatePath(newPath);
  if (!newValidation.valid) {
    return `Error: ${newValidation.error}`;
  }

  const resolvedOldPath = oldValidation.resolvedPath!;
  const resolvedNewPath = newValidation.resolvedPath!;

  try {
    // 检查源是否存在
    await fs.access(resolvedOldPath);

    // 检查目标是否已存在
    try {
      await fs.access(resolvedNewPath);
      return `Error: The destination ${newPath} already exists`;
    } catch {
      // 目标不存在，可以重命名
    }

    // 确保目标父目录存在
    const parentDir = join(resolvedNewPath, '..');
    await fs.mkdir(parentDir, { recursive: true });

    await fs.rename(resolvedOldPath, resolvedNewPath);
    return `Successfully renamed ${oldPath} to ${newPath}`;
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      return `Error: The path ${oldPath} does not exist`;
    }
    return `Error: Failed to rename: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * 处理 Memory Tool 命令
 */
export async function handleMemoryToolCommand(
  command: string,
  params: any
): Promise<string> {
  log.info(`[Memory Tool] Command: ${command}`, params);

  switch (command) {
    case 'view':
      return await handleView(params.path, params.view_range);

    case 'create':
      return await handleCreate(params.path, params.file_text);

    case 'str_replace':
      return await handleStrReplace(params.path, params.old_str, params.new_str);

    case 'insert':
      return await handleInsert(params.path, params.insert_line, params.insert_text);

    case 'delete':
      return await handleDelete(params.path);

    case 'rename':
      return await handleRename(params.old_path, params.new_path);

    default:
      return `Error: Unknown command: ${command}`;
  }
}

/**
 * 获取记忆目录路径（用于调试和配置）
 */
export function getMemoriesDirectoryPath(): string {
  return getMemoriesDir();
}
