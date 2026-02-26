import Database from "better-sqlite3";
import type { SessionStatus, SessionSource, StreamMessage, DingTalkSessionMeta } from "../types.js";

export type PendingPermission = {
  toolUseId: string;
  toolName: string;
  input: unknown;
  resolve: (result: { behavior: "allow" | "deny"; updatedInput?: unknown; message?: string }) => void;
};

export type Session = {
  id: string;
  title: string;
  claudeSessionId?: string;
  status: SessionStatus;
  cwd?: string;
  allowedTools?: string;
  lastPrompt?: string;
  source?: SessionSource;
  dingtalkMeta?: DingTalkSessionMeta;
  pendingPermissions: Map<string, PendingPermission>;
  abortController?: AbortController;
};

export type StoredSession = {
  id: string;
  title: string;
  status: SessionStatus;
  cwd?: string;
  allowedTools?: string;
  lastPrompt?: string;
  claudeSessionId?: string;
  source?: SessionSource;
  dingtalkMeta?: DingTalkSessionMeta;
  createdAt: number;
  updatedAt: number;
};

export type SessionHistory = {
  session: StoredSession;
  messages: StreamMessage[];
};

export class SessionStore {
  private sessions = new Map<string, Session>();
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initialize();
    this.loadSessions();
  }

  createSession(options: { cwd?: string; allowedTools?: string; prompt?: string; title: string; source?: SessionSource; dingtalkMeta?: DingTalkSessionMeta }): Session {
    const id = crypto.randomUUID();
    const now = Date.now();
    const session: Session = {
      id,
      title: options.title,
      status: "idle",
      cwd: options.cwd,
      allowedTools: options.allowedTools,
      lastPrompt: options.prompt,
      source: options.source,
      dingtalkMeta: options.dingtalkMeta,
      pendingPermissions: new Map()
    };
    this.sessions.set(id, session);
    this.db
      .prepare(
        `insert into sessions
          (id, title, claude_session_id, status, cwd, allowed_tools, last_prompt, source, dingtalk_meta, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        session.title,
        session.claudeSessionId ?? null,
        session.status,
        session.cwd ?? null,
        session.allowedTools ?? null,
        session.lastPrompt ?? null,
        session.source ?? null,
        session.dingtalkMeta ? JSON.stringify(session.dingtalkMeta) : null,
        now,
        now
      );
    return session;
  }

  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  listSessions(): StoredSession[] {
    const rows = this.db
      .prepare(
        `select id, title, claude_session_id, status, cwd, allowed_tools, last_prompt, source, dingtalk_meta, created_at, updated_at
         from sessions
         order by updated_at desc`
      )
      .all() as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      status: row.status as SessionStatus,
      cwd: row.cwd ? String(row.cwd) : undefined,
      allowedTools: row.allowed_tools ? String(row.allowed_tools) : undefined,
      lastPrompt: row.last_prompt ? String(row.last_prompt) : undefined,
      claudeSessionId: row.claude_session_id ? String(row.claude_session_id) : undefined,
      source: row.source ? String(row.source) as SessionSource : undefined,
      dingtalkMeta: row.dingtalk_meta ? JSON.parse(String(row.dingtalk_meta)) : undefined,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at)
    }));
  }

  listRecentCwds(limit = 8): string[] {
    const rows = this.db
      .prepare(
        `select cwd, max(updated_at) as latest
         from sessions
         where cwd is not null and trim(cwd) != ''
         group by cwd
         order by latest desc
         limit ?`
      )
      .all(limit) as Array<Record<string, unknown>>;
    return rows.map((row) => String(row.cwd));
  }

  getSessionHistory(id: string): SessionHistory | null {
    const sessionRow = this.db
      .prepare(
        `select id, title, claude_session_id, status, cwd, allowed_tools, last_prompt, source, dingtalk_meta, created_at, updated_at
         from sessions
         where id = ?`
      )
      .get(id) as Record<string, unknown> | undefined;
    if (!sessionRow) return null;

    const messages = (this.db
      .prepare(
        `select data from messages where session_id = ? order by created_at asc`
      )
      .all(id) as Array<Record<string, unknown>>)
      .map((row) => JSON.parse(String(row.data)) as StreamMessage);

    return {
      session: {
        id: String(sessionRow.id),
        title: String(sessionRow.title),
        status: sessionRow.status as SessionStatus,
        cwd: sessionRow.cwd ? String(sessionRow.cwd) : undefined,
        allowedTools: sessionRow.allowed_tools ? String(sessionRow.allowed_tools) : undefined,
        lastPrompt: sessionRow.last_prompt ? String(sessionRow.last_prompt) : undefined,
        claudeSessionId: sessionRow.claude_session_id ? String(sessionRow.claude_session_id) : undefined,
        source: sessionRow.source ? String(sessionRow.source) as SessionSource : undefined,
        dingtalkMeta: sessionRow.dingtalk_meta ? JSON.parse(String(sessionRow.dingtalk_meta)) : undefined,
        createdAt: Number(sessionRow.created_at),
        updatedAt: Number(sessionRow.updated_at)
      },
      messages
    };
  }

  updateSession(id: string, updates: Partial<Session>): Session | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    Object.assign(session, updates);
    this.persistSession(id, updates);
    return session;
  }

  setAbortController(id: string, controller: AbortController | undefined): void {
    const session = this.sessions.get(id);
    if (!session) return;
    session.abortController = controller;
  }

  recordMessage(sessionId: string, message: StreamMessage): void {
    const id = ('uuid' in message && message.uuid) ? String(message.uuid) : crypto.randomUUID();
    this.db
      .prepare(
        `insert or ignore into messages (id, session_id, data, created_at) values (?, ?, ?, ?)`
      )
      .run(id, sessionId, JSON.stringify(message), Date.now());
  }

  deleteSession(id: string): boolean {
    const existing = this.sessions.get(id);
    if (existing) {
      // 清理所有待处理的权限请求，防止内存泄漏
      for (const [_toolUseId, pending] of existing.pendingPermissions) {
        try {
          pending.resolve({ behavior: "deny", message: "Session deleted" });
        } catch (err) {
          // 忽略 resolve 可能抛出的错误
        }
      }
      existing.pendingPermissions.clear();
      this.sessions.delete(id);
    }
    this.db.prepare(`delete from messages where session_id = ?`).run(id);
    const result = this.db.prepare(`delete from sessions where id = ?`).run(id);
    const removedFromDb = result.changes > 0;
    return removedFromDb || Boolean(existing);
  }

  private persistSession(id: string, updates: Partial<Session>): void {
    const fields: string[] = [];
    const values: Array<string | number | null> = [];
    const updatable = {
      title: "title",
      claudeSessionId: "claude_session_id",
      status: "status",
      cwd: "cwd",
      allowedTools: "allowed_tools",
      lastPrompt: "last_prompt"
    } as const;

    for (const key of Object.keys(updates) as Array<keyof typeof updatable>) {
      const column = updatable[key];
      if (!column) continue;
      fields.push(`${column} = ?`);
      const value = updates[key];
      values.push(value === undefined ? null : (value as string));
    }

    if (fields.length === 0) return;
    fields.push("updated_at = ?");
    values.push(Date.now());
    values.push(id);
    this.db
      .prepare(`update sessions set ${fields.join(", ")} where id = ?`)
      .run(...values);
  }

  /**
   * 重命名会话
   * @param id 会话 ID
   * @param newTitle 新标题
   * @returns 是否成功
   */
  renameSession(id: string, newTitle: string): boolean {
    const session = this.sessions.get(id);
    if (!session) return false;

    session.title = newTitle;
    this.db
      .prepare(`update sessions set title = ?, updated_at = ? where id = ?`)
      .run(newTitle, Date.now(), id);
    return true;
  }

  private initialize(): void {
    this.db.exec(`pragma journal_mode = WAL;`);
    this.db.exec(
      `create table if not exists sessions (
        id text primary key,
        title text,
        claude_session_id text,
        status text not null,
        cwd text,
        allowed_tools text,
        last_prompt text,
        created_at integer not null,
        updated_at integer not null
      )`
    );
    this.db.exec(
      `create table if not exists messages (
        id text primary key,
        session_id text not null,
        data text not null,
        created_at integer not null,
        foreign key (session_id) references sessions(id)
      )`
    );
    this.db.exec(`create index if not exists messages_session_id on messages(session_id)`);

    // Migration: add source and dingtalk_meta columns
    try {
      this.db.exec(`alter table sessions add column source text`);
    } catch {
      // Column already exists
    }
    try {
      this.db.exec(`alter table sessions add column dingtalk_meta text`);
    } catch {
      // Column already exists
    }
  }

  private loadSessions(): void {
    const rows = this.db
      .prepare(
        `select id, title, claude_session_id, status, cwd, allowed_tools, last_prompt, source, dingtalk_meta
         from sessions`
      )
      .all();
    for (const row of rows as Array<Record<string, unknown>>) {
      const session: Session = {
        id: String(row.id),
        title: String(row.title),
        claudeSessionId: row.claude_session_id ? String(row.claude_session_id) : undefined,
        status: row.status as SessionStatus,
        cwd: row.cwd ? String(row.cwd) : undefined,
        allowedTools: row.allowed_tools ? String(row.allowed_tools) : undefined,
        lastPrompt: row.last_prompt ? String(row.last_prompt) : undefined,
        source: row.source ? String(row.source) as SessionSource : undefined,
        dingtalkMeta: row.dingtalk_meta ? JSON.parse(String(row.dingtalk_meta)) : undefined,
        pendingPermissions: new Map()
      };
      this.sessions.set(session.id, session);
    }
  }

  /**
   * 按钉钉元数据查找已有 session
   * 用于在 peerSessionMap 内存缓存丢失后（如应用重启）从 DB 恢复映射
   *
   * @param botName 机器人名称
   * @param peerId  senderId（私聊）或 conversationId（群聊）
   * @returns 最近一条匹配的 session，若无则返回 undefined
   */
  findDingTalkSession(botName: string, peerId: string): Session | undefined {
    const rows = this.db
      .prepare(
        `select id, dingtalk_meta
         from sessions
         where source = 'dingtalk' and dingtalk_meta is not null
         order by updated_at desc
         limit 100`
      )
      .all() as Array<Record<string, unknown>>;

    for (const row of rows) {
      try {
        const meta: DingTalkSessionMeta = JSON.parse(String(row.dingtalk_meta));
        if (meta.botName !== botName) continue;
        if (meta.senderId === peerId || meta.conversationId === peerId) {
          const sessionId = String(row.id);
          return this.sessions.get(sessionId);
        }
      } catch {
        // 跳过无法解析的行
      }
    }
    return undefined;
  }

  /**
   * 更新 session 的 dingtalkMeta（动态字段如 sessionWebhook 可能随消息变化）
   */
  updateDingtalkMeta(id: string, meta: DingTalkSessionMeta): void {
    const session = this.sessions.get(id);
    if (!session) return;
    session.dingtalkMeta = meta;
    this.db
      .prepare(`update sessions set dingtalk_meta = ?, updated_at = ? where id = ?`)
      .run(JSON.stringify(meta), Date.now(), id);
  }

  close(): void {
    this.db.close();
  }
}

// ========== SessionStore 实例管理 ==========

/**
 * 全局 SessionStore 实例
 * 用于在 runner 中访问会话历史
 */
let sessionStoreInstance: SessionStore | null = null;

/**
 * 初始化 SessionStore 实例
 * 应在应用启动时调用
 * 
 * @param dbPath - 数据库文件路径
 * @returns SessionStore 实例
 */
export function initSessionStore(dbPath: string): SessionStore {
  if (!sessionStoreInstance) {
    sessionStoreInstance = new SessionStore(dbPath);
  }
  return sessionStoreInstance;
}

/**
 * 获取 SessionStore 实例
 * 用于在 runner 等模块中访问会话历史
 * 
 * @returns SessionStore 实例
 * @throws 如果 SessionStore 未初始化则抛出错误
 */
export function getSessionStore(): SessionStore {
  if (!sessionStoreInstance) {
    throw new Error('SessionStore not initialized. Call initSessionStore first.');
  }
  return sessionStoreInstance;
}
