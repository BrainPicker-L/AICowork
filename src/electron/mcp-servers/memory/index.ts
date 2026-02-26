/**
 * 内置记忆 MCP 服务器（独立 Node 进程，无 Electron）
 * 通过 stdio 与 SDK 通信，读写与设置页相同的 memory 目录（由 env MEMORY_DB_PATH 指定）
 * 暴露 memory_recall / memory_store / memory_forget，供对话中模型检索与存储记忆
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as z from 'zod';

const MEMORY_DB_PATH = process.env.MEMORY_DB_PATH || (() => {
  const idx = process.argv.indexOf('--db');
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return '';
})();

if (!MEMORY_DB_PATH) {
  console.error('[dtazzicowork-memory] MEMORY_DB_PATH env or --db <path> required');
  process.exit(1);
}

const kindsPath = () => join(MEMORY_DB_PATH, 'kinds.json');
const entriesPath = () => join(MEMORY_DB_PATH, 'entries.json');

async function ensureDir(): Promise<void> {
  try {
    await fs.access(MEMORY_DB_PATH);
  } catch {
    await fs.mkdir(MEMORY_DB_PATH, { recursive: true });
  }
}

async function readKinds(): Promise<Array<{ id: string; name: string; description?: string; createdAt: number; updatedAt: number }>> {
  try {
    const raw = await fs.readFile(kindsPath(), 'utf-8');
    return JSON.parse(raw);
  } catch (e: any) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

async function readEntries(): Promise<Array<{
  id: string; kindId: string; content: string; summary?: string; importance?: string;
  createdAt: number; updatedAt: number; deletedAt?: number;
}>> {
  try {
    const raw = await fs.readFile(entriesPath(), 'utf-8');
    return JSON.parse(raw);
  } catch (e: any) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

async function writeEntries(entries: any[]): Promise<void> {
  await ensureDir();
  const tmp = entriesPath() + '.tmp.' + Date.now();
  await fs.writeFile(tmp, JSON.stringify(entries, null, 2), 'utf-8');
  await fs.rename(tmp, entriesPath());
}

function text(content: string) {
  return { content: [{ type: 'text' as const, text: content }] };
}

const mcpServer = new McpServer({
  name: 'dtazzicowork-memory',
  version: '1.0.0',
});

// memory_recall: 按 query / kindId / limit 检索，返回匹配条目（摘要/标题优先）
mcpServer.registerTool('memory_recall', {
  description: '从用户记忆中按关键词或种类检索条目。建议用简短关键词（如「工号」「偏好」）检索；标题/摘要匹配的会优先返回。',
  inputSchema: {
    query: z.string().optional().describe('检索关键词，匹配标题(摘要)和内容'),
    kindId: z.string().optional().describe('限定记忆种类 id'),
    limit: z.number().optional().describe('最多返回条数，默认 20'),
  },
}, async (args) => {
  await ensureDir();
  let entries = await readEntries();
  entries = entries.filter((e) => e.deletedAt == null);
  const limit = args.limit ?? 20;
  if (args.kindId) entries = entries.filter((e) => e.kindId === args.kindId);
  if (args.query && args.query.trim()) {
    const q = args.query.trim().toLowerCase();
    entries = entries.filter(
      (e) =>
        (e.summary && e.summary.toLowerCase().includes(q)) ||
        e.content.toLowerCase().includes(q)
    );
    entries.sort((a, b) => {
      const aSummary = a.summary && a.summary.toLowerCase().includes(q) ? 1 : 0;
      const bSummary = b.summary && b.summary.toLowerCase().includes(q) ? 1 : 0;
      if (bSummary !== aSummary) return bSummary - aSummary;
      return (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt);
    });
  } else {
    entries.sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt));
  }
  const list = entries.slice(0, limit);
  const lines = list.map((e) => `- [${e.summary || '(无标题)'}] ${e.content.slice(0, 200)}${e.content.length > 200 ? '…' : ''}`);
  return text(list.length === 0 ? '未找到匹配记忆。' : `找到 ${list.length} 条记忆：\n${lines.join('\n')}`);
});

// memory_store: 存储一条记忆（content 必填，summary 建议填作标题/检索索引）
mcpServer.registerTool('memory_store', {
  description: '存储一条记忆。content 为完整内容；summary 建议填写为标题（用于检索，如「张三的工号」），便于后续 memory_recall 命中。',
  inputSchema: {
    content: z.string().describe('记忆内容'),
    summary: z.string().optional().describe('标题/摘要，建议填写以便检索'),
    kindId: z.string().optional().describe('记忆种类 id，不填则需先有种类'),
    importance: z.enum(['low', 'medium', 'high']).optional().describe('重要性'),
  },
}, async (args) => {
  if (!args.content || !args.content.trim()) return text('错误：content 不能为空。');
  await ensureDir();
  const kinds = await readKinds();
  const kindId = args.kindId && kinds.some((k) => k.id === args.kindId) ? args.kindId : (kinds[0]?.id ?? '');
  if (!kindId) return text('错误：尚未创建任何记忆种类，请先在设置中创建记忆种类。');
  const entries = await readEntries();
  const now = Date.now();
  const newEntry = {
    id: crypto.randomUUID(),
    kindId,
    content: args.content.trim(),
    summary: args.summary?.trim() || undefined,
    importance: args.importance || 'medium',
    createdAt: now,
    updatedAt: now,
  };
  entries.push(newEntry);
  await writeEntries(entries);
  return text(`已存储记忆。${args.summary ? `标题：${args.summary}` : '（建议下次填写 summary 作为标题便于检索）'}`);
});

// memory_forget: 软删一条记忆
mcpServer.registerTool('memory_forget', {
  description: '软删除一条记忆（按 id）。',
  inputSchema: {
    id: z.string().describe('记忆条目的 id'),
  },
}, async (args) => {
  if (!args.id) return text('错误：需要提供 id。');
  await ensureDir();
  const entries = await readEntries();
  const idx = entries.findIndex((e) => e.id === args.id);
  if (idx === -1) return text('未找到该记忆。');
  entries[idx].deletedAt = Date.now();
  entries[idx].updatedAt = Date.now();
  await writeEntries(entries);
  return text('已删除该记忆。');
});

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
}

main().catch((err) => {
  console.error('[dtazzicowork-memory]', err);
  process.exit(1);
});
