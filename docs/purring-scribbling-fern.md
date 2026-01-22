# Claude-Cowork Skill/Rule/Plugin 系统实现计划

> **项目**: Claude-Cowork - Skill/Rule/Plugin 功能实现
> **作者**: Alan
> **创建日期**: 2026-01-20
> **预计工期**: 约 18-20 天

---

## 一、需求概述

参考 Claude 官方的 Claude-cowork，为 Claude-Cowork 桌面应用添加以下功能：

1. **Skill（技能）系统** - 技能卡片展示、启用/禁用、参数配置
2. **Scenario（场景）系统** - 场景卡片、快速启动、收藏功能
3. **Rule（规则）系统** - 规则列表、触发器、自动化执行
4. **Plugin（插件）系统** - 插件市场、安装/卸载、权限管理

---

## 二、现有架构分析

### 技术栈
- **前端**: React 19 + TypeScript + Tailwind CSS 4.1 + Zustand
- **后端**: Electron 39
- **UI组件**: shadcn/ui (Radix UI 无头组件)

### 架构模式（参考现有代码）
- **Handler 模式**: 函数式处理器（`session-handlers.ts`）
  - 纯函数，不是类
  - 函数命名：`handle{Action}{Resource}`
  - 参数注入模式
  - 返回 `void`，通过 `emit` 发送事件

- **Store 模式**: JSON 文件存储（`config-store.ts`）
  - 不使用类，直接导出函数
  - 同步和异步版本
  - 使用 `app.getPath("userData")` 获取存储路径

- **Zustand**: 使用 `create` 函数，状态用 `Record<string, T>` 模式

- **类型定义**: 在 `types.ts` 中扩展，使用 `Extract` 提取事件类型

### 关键现有文件
| 文件路径 | 用途 |
|----------|------|
| `src/electron/handlers/session-handlers.ts` | 会话 IPC 处理器（参考模式） |
| `src/electron/libs/config-store.ts` | 配置存储（参考模式） |
| `src/electron/types.ts` | IPC 事件类型定义 |
| `src/ui/store/useAppStore.ts` | Zustand 状态管理 |

---

## 三、数据模型设计

**类型定义位置**: `src/electron/types.ts`（扩展现有文件）

```typescript
// ==================== Skill ====================
export type SkillCategory = 'development' | 'documentation' | 'automation' | 'analysis' | 'creative' | 'system' | 'custom';
export type SkillStatus = 'enabled' | 'disabled' | 'error';

export type SkillMetadata = {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  category: SkillCategory;
  icon: string;              // emoji 图标
  tags: string[];
  handlerType: 'builtin' | 'plugin' | 'external';
  parameters: SkillParameter[];
  permissions: {
    requiresNetwork?: boolean;
    requiresFileSystem?: boolean;
    allowedPaths?: string[];
  };
  status: SkillStatus;
  usageCount: number;
  lastUsed?: number;
  createdAt: number;
  updatedAt: number;
};

export type SkillParameter = {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'file';
  description?: string;
  required: boolean;
  defaultValue?: unknown;
  options?: string[];
};

// ==================== Scenario ====================
export type ScenarioCard = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  preConfigured: {
    skills: string[];
    rules?: string[];
    cwd?: string;
    initialPrompt?: string;
  };
  isBuiltIn: boolean;
  isFavorite: boolean;
  useCount: number;
  lastUsed?: number;
  createdAt: number;
};

// ==================== Rule ====================
export type RuleScope = 'global' | 'project' | 'session';
export type RuleMetadata = {
  id: string;
  name: string;
  description: string;
  scope: RuleScope;
  triggers: RuleTrigger[];
  actions: RuleAction[];
  priority: number;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
  triggerCount: number;
};

export type RuleTrigger = {
  eventType?: 'session.start' | 'skill.execute' | 'message.send';
  skillId?: string;
  pattern?: string;
};

export type RuleAction = {
  type: 'enable_skill' | 'disable_skill' | 'set_parameter' | 'send_message';
  target?: string;
  parameters?: Record<string, unknown>;
  message?: string;
};

// ==================== Plugin ====================
export type PluginStatus = 'installed' | 'active' | 'inactive' | 'error';
export type PluginManifest = {
  name: string;
  displayName: string;
  version: string;
  description: string;
  author: string;
  type: 'skill-pack' | 'extension' | 'theme';
  main: string;
  skills: string[];
  permissions: {
    network?: { domains?: string[] };
    filesystem?: { paths?: string[] };
  };
};
export type InstalledPlugin = {
  id: string;
  manifest: PluginManifest;
  status: PluginStatus;
  installPath: string;
  enabled: boolean;
  installedAt: number;
};

// ==================== IPC Events ====================
// 扩展 ServerEvent
export type ServerEvent =
  | // ... 现有事件
  | { type: "skill.list"; payload: { skills: SkillMetadata[] } }
  | { type: "skill.updated"; payload: { skillId: string; skill: SkillMetadata } }
  | { type: "scenario.list"; payload: { scenarios: ScenarioCard[] } }
  | { type: "scenario.launched"; payload: { scenarioId: string; sessionId: string } }
  | { type: "plugin.list"; payload: { plugins: InstalledPlugin[] } };

// 扩展 ClientEvent
export type ClientEvent =
  | // ... 现有事件
  | { type: "skill.list" }
  | { type: "skill.enable"; payload: { skillId: string } }
  | { type: "skill.disable"; payload: { skillId: string } }
  | { type: "scenario.list" }
  | { type: "scenario.launch"; payload: { scenarioId: string } }
  | { type: "scenario.toggleFavorite"; payload: { scenarioId: string } }
  | { type: "plugin.list" };
```

---

## 四、数据存储设计

**存储方式**: JSON 缓存 + SQLite 持久化混合方案

### 混合存储架构

```
┌─────────────────────────────────────────────────────────┐
│                    应用层                              │
├─────────────────────────────────────────────────────────┤
│  读操作：先读 JSON 缓存 → 缓存未命中则从 SQLite 加载   │
│  写操作：写 JSON 缓存 → 后台异步同步到 SQLite          │
└─────────────────────────────────────────────────────────┘
           ↓                    ↓
    ┌──────────────┐    ┌──────────────┐
    │ JSON 缓存    │←───→│  SQLite     │
    │ (快速读写)   │    │  (持久化)   │
    └──────────────┘    └──────────────┘
```

### 存储文件结构

```
userData/
├── cache/                   # JSON 缓存目录（新增）
│   ├── skills.json          # 技能缓存
│   ├── rules.json           # 规则缓存
│   ├── plugins.json         # 插件缓存
│   └── scenarios.json       # 场景缓存
├── skills.db                # SQLite 持久化数据库（新增）
├── api-config.json          # 现有
└── plugins/                 # 插件安装目录
```

### 设计优势

| 特性 | JSON 缓存 | SQLite 持久化 |
|------|----------|--------------|
| **读取速度** | 极快（内存映射） | 较慢（磁盘 I/O） |
| **写入速度** | 快（直接覆盖） | 较慢（事务+锁） |
| **并发问题** | 无锁 | 有库锁风险 |
| **复杂查询** | 不支持 | 支持（SQL） |
| **数据关系** | 手动维护 | 外键约束 |
| **持久化** | 应用关闭时 | 实时/定期同步 |

### 实现：混合存储基类（hybrid-store.ts）

```typescript
/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 *
 * 混合存储基类
 * JSON 缓存 + SQLite 持久化
 */

import { app } from "electron";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import Database from "better-sqlite3";
import { log } from "../logger.js";

// 同步间隔（毫秒）
const SYNC_INTERVAL = 5000; // 5秒

abstract class HybridStore<T> {
  protected db: Database.Database;
  protected cacheFileName: string;
  protected tableName: string;
  private syncTimer?: NodeJS.Timeout;
  private pendingSync = false;

  constructor(
    cacheFileName: string,
    dbFileName: string,
    tableName: string
  ) {
    this.cacheFileName = cacheFileName;
    this.tableName = tableName;

    // 初始化 SQLite
    const userDataPath = app.getPath("userData");
    const dbPath = join(userDataPath, dbFileName);
    this.db = new Database(dbPath);
    this.initializeSchema();

    // 启动定期同步
    this.startPeriodicSync();
  }

  /**
   * 初始化数据库表结构（子类实现）
   */
  protected abstract initializeSchema(): void;

  /**
   * 从 JSON 缓存加载数据
   */
  protected loadFromCache(): T[] {
    try {
      const cachePath = this.getCacheFilePath();
      if (existsSync(cachePath)) {
        const raw = readFileSync(cachePath, "utf8");
        const data = JSON.parse(raw);
        return data.items || [];
      }
    } catch (error) {
      log.warn(`[${this.tableName}] Cache load failed, loading from DB`, error);
    }
    return [];
  }

  /**
   * 保存到 JSON 缓存
   */
  protected saveToCache(items: T[]): void {
    try {
      const cachePath = this.getCacheFilePath();
      const cacheDir = join(app.getPath("userData"), "cache");
      if (!existsSync(cacheDir)) {
        mkdirSync(cacheDir, { recursive: true });
      }
      writeFileSync(cachePath, JSON.stringify({ items }, null, 2), "utf8");
      this.markPendingSync();
    } catch (error) {
      log.error(`[${this.tableName}] Cache save failed`, error);
    }
  }

  /**
   * 从 SQLite 加载数据（缓存未命中时调用）
   */
  protected loadFromDatabase(): T[] {
    try {
      const stmt = this.db.prepare(`SELECT * FROM ${this.tableName}`);
      const rows = stmt.all() as any[];
      // 转换为对象
      return rows.map(row => ({
        ...row,
        // JSON 字段解析
        ...(row.tags && { tags: JSON.parse(row.tags) }),
        ...(row.parameters && { parameters: JSON.parse(row.parameters) }),
        ...(row.permissions && { permissions: JSON.parse(row.permissions) }),
      }));
    } catch (error) {
      log.error(`[${this.tableName}] DB load failed`, error);
      return [];
    }
  }

  /**
   * 同步到 SQLite（后台异步）
   */
  protected syncToDatabase(items: T[]): void {
    try {
      const transaction = this.db.transaction((item: any) => {
        const stmt = this.db.prepare(`
          INSERT OR REPLACE INTO ${this.tableName} (
            id, name, description, version, category, icon, tags,
            status, usage_count, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          item.id,
          item.name,
          item.description,
          item.version,
          item.category,
          item.icon,
          JSON.stringify(item.tags || []),
          item.status,
          item.usageCount || 0,
          item.createdAt,
          item.updatedAt
        );
      });

      for (const item of items) {
        transaction(item);
      }

      log.info(`[${this.tableName}] Synced ${items.length} items to database`);
      this.pendingSync = false;
    } catch (error) {
      log.error(`[${this.tableName}] DB sync failed`, error);
    }
  }

  /**
   * 标记待同步
   */
  private markPendingSync(): void {
    this.pendingSync = true;
  }

  /**
   * 定期同步到数据库
   */
  private startPeriodicSync(): void {
    this.syncTimer = setInterval(() => {
      if (this.pendingSync) {
        const items = this.loadFromCache();
        this.syncToDatabase(items);
      }
    }, SYNC_INTERVAL);
  }

  /**
   * 应用退出前强制同步
   */
  public forceSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    if (this.pendingSync) {
      const items = this.loadFromCache();
      this.syncToDatabase(items);
    }
  }

  private getCacheFilePath(): string {
    return join(app.getPath("userData"), "cache", this.cacheFileName);
  }
}

export { HybridStore };
```

### 技能存储实现（skill-store.ts）

```typescript
/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @Email       None
 *
 * 技能存储管理
 * JSON 缓存 + SQLite 持久化
 */

import { log } from "../logger.js";
import { HybridStore } from "./hybrid-store.js";
import type { SkillMetadata, SkillStatus } from "../types.js";
import { getBuiltinSkills } from "../builtin/builtin-skills.js";

class SkillStore extends HybridStore<SkillMetadata> {
  constructor() {
    super("skills.json", "skills.db", "skills");
  }

  protected initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS skills (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        version TEXT NOT NULL,
        author TEXT,
        category TEXT NOT NULL,
        icon TEXT NOT NULL,
        tags TEXT,
        handler_type TEXT NOT NULL,
        parameters TEXT,
        permissions TEXT,
        status TEXT NOT NULL,
        usage_count INTEGER DEFAULT 0,
        last_used INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
      CREATE INDEX IF NOT EXISTS idx_skills_status ON skills(status);
    `);
  }

  /**
   * 加载所有技能（先缓存，后数据库）
   */
  loadAll(): SkillMetadata[] {
    let items = this.loadFromCache();

    if (items.length === 0) {
      log.info("[skill-store] Cache empty, loading from database");
      items = this.loadFromDatabase();

      if (items.length === 0) {
        log.info("[skill-store] Database empty, initializing with builtin skills");
        items = getBuiltinSkills();
        this.saveAll(items);
      } else {
        // 缓存从数据库加载的数据
        this.saveToCache(items);
      }
    }

    return items;
  }

  /**
   * 保存所有技能（更新缓存 + 标记同步）
   */
  saveAll(skills: SkillMetadata[]): void {
    this.saveToCache(skills);
    // 不立即同步到数据库，等待定期同步或 forceSync
  }

  /**
   * 获取单个技能
   */
  get(skillId: string): SkillMetadata | undefined {
    return this.loadAll().find(s => s.id === skillId);
  }

  /**
   * 设置技能状态
   */
  setStatus(skillId: string, status: SkillStatus): boolean {
    const skills = this.loadAll();
    const skill = skills.find(s => s.id === skillId);

    if (!skill) return false;

    skill.status = status;
    skill.updatedAt = Date.now();
    this.saveAll(skills);
    return true;
  }

  /**
   * 记录技能使用
   */
  recordUsage(skillId: string): void {
    const skills = this.loadAll();
    const skill = skills.find(s => s.id === skillId);

    if (skill) {
      skill.usageCount = (skill.usageCount || 0) + 1;
      skill.lastUsed = Date.now();
      skill.updatedAt = Date.now();
      this.saveAll(skills);
    }
  }

  /**
   * 搜索技能
   */
  search(query: string): SkillMetadata[] {
    const skills = this.loadAll();
    const lowerQuery = query.toLowerCase();
    return skills.filter(s =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery) ||
      s.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
}

// 单例实例
const skillStore = new SkillStore();

// 导出函数式 API
export function loadSkills(): SkillMetadata[] {
  return skillStore.loadAll();
}

export function getSkill(skillId: string): SkillMetadata | undefined {
  return skillStore.get(skillId);
}

export function setSkillStatus(skillId: string, status: SkillStatus): boolean {
  return skillStore.setStatus(skillId, status);
}

export function recordSkillUsage(skillId: string): void {
  skillStore.recordUsage(skillId);
}

export function searchSkills(query: string): SkillMetadata[] {
  return skillStore.search(query);
}

// 应用退出时调用
export function forceSyncSkills(): void {
  skillStore.forceSync();
}
```

---

## 五、后端架构实现

### 新增文件结构

```
src/electron/
├── libs/
│   ├── hybrid-store.ts         # 混合存储基类
│   ├── skill-store.ts          # 技能存储（继承 HybridStore）
│   ├── scenario-store.ts       # 场景存储
│   ├── rule-store.ts           # 规则存储
│   └── plugin-store.ts         # 插件存储
├── handlers/
│   ├── skill-handlers.ts       # 技能 IPC 处理器
│   ├── scenario-handlers.ts    # 场景 IPC 处理器
│   └── ...
└── builtin/
    ├── builtin-skills.ts       # 内置技能定义
    └── builtin-scenarios.ts    # 内置场景定义
```

### 应用退出时强制同步

**在 `main.ts` 中添加**：

```typescript
import { forceSyncSkills, forceSyncScenarios } from "./libs/skill-store.js";

app.on("before-quit", () => {
  // 强制同步所有数据到 SQLite
  forceSyncSkills();
  forceSyncScenarios();
  // ... 其他 store 的同步
});
```

---

## 六、前端架构实现

### Zustand Store 扩展

**文件**: `src/ui/store/useAppStore.ts`（扩展现有文件）

在 `interface AppState` 中添加：

```typescript
interface AppState {
  // ... 现有状态

  // 新增：技能状态
  skills: Record<string, SkillMetadata>;
  skillsLoaded: boolean;

  // 新增：场景状态
  scenarios: Record<string, ScenarioCard>;
  favoriteScenarios: string[];

  // 新增：插件状态
  plugins: Record<string, InstalledPlugin>;

  // 技能操作
  setSkills: (skills: SkillMetadata[]) => void;
  enableSkill: (skillId: string) => void;
  disableSkill: (skillId: string) => void;

  // 场景操作
  setScenarios: (scenarios: ScenarioCard[]) => void;
  launchScenario: (scenarioId: string) => void;
  toggleFavoriteScenario: (scenarioId: string) => void;
}
```

在 `handleServerEvent` 的 switch 中添加：

```typescript
case "skill.list": {
  const nextSkills: Record<string, SkillMetadata> = {};
  for (const skill of event.payload.skills) {
    nextSkills[skill.id] = skill;
  }
  set({ skills: nextSkills, skillsLoaded: true });
  break;
}

case "skill.updated": {
  const { skillId, skill } = event.payload;
  set((state) => ({
    skills: { ...state.skills, [skillId]: skill }
  }));
  break;
}

case "scenario.list": {
  const nextScenarios: Record<string, ScenarioCard> = {};
  for (const scenario of event.payload.scenarios) {
    nextScenarios[scenario.id] = scenario;
  }
  set({ scenarios: nextScenarios });
  break;
}
```

### 新增 UI 组件

```
src/ui/components/
├── Skill/
│   ├── SkillCard.tsx           # 技能卡片
│   └── SkillList.tsx           # 技能列表
├── Scenario/
│   ├── ScenarioGrid.tsx        # 场景网格
│   └── ScenarioCard.tsx        # 场景卡片
└── Plugin/
    └── PluginCard.tsx          # 插件卡片
```

---

## 七、AI 上下文注入机制

### 核心问题：如何让 AI 知道使用什么技能？

**解决方案**：在会话启动时，将技能/规则/场景信息注入到系统提示词中。

### 技能上下文构建器（skill-context-builder.ts）

```typescript
/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @Email       None
 *
 * 技能上下文构建器
 * 将技能信息转换为 AI 可理解的上下文
 */

import type { SkillMetadata } from "../types.js";

/**
 * 构建技能的系统提示词上下文
 */
export function buildSkillContext(skills: SkillMetadata[]): string {
  const enabledSkills = skills.filter(s => s.status === 'enabled');

  if (enabledSkills.length === 0) {
    return '';
  }

  return `
## 可用技能

你拥有以下技能，应该根据用户需求主动使用：

${enabledSkills.map(skill => `
### ${skill.icon} ${skill.name}
${skill.description}

**使用场景**: ${skill.tags.join(', ')}
**参数**: ${skill.parameters.map(p => `${p.name} (${p.type})`).join(', ') || '无'}
`).join('\n')}

**重要指示**:
1. 当用户的请求与某个技能的功能匹配时，你应该主动说明将使用该技能
2. 使用技能时，如果需要参数，应该向用户询问具体值
3. 技能执行结果应该清晰地向用户展示
  `.trim();
}

/**
 * 将技能转换为 Claude Tool Use 格式
 */
export function buildToolSchema(skill: SkillMetadata): object {
  return {
    name: skill.id,
    description: `${skill.name}: ${skill.description}`,
    input_schema: {
      type: "object",
      properties: skill.parameters.reduce((acc, p) => {
        acc[p.name] = {
          type: p.type,
          description: p.description || p.displayName,
        };
        if (p.defaultValue !== undefined) {
          acc[p.name].default = p.defaultValue;
        }
        if (p.options) {
          acc[p.name].enum = p.options;
        }
        return acc;
      }, {} as Record<string, any>),
      required: skill.parameters.filter(p => p.required).map(p => p.name)
    }
  };
}

/**
 * 构建规则上下文
 */
export function buildRuleContext(rules: RuleMetadata[]): string {
  const enabledRules = rules.filter(r => r.enabled);

  if (enabledRules.length === 0) {
    return '';
  }

  return `
## 自动化规则

以下自动化规则已启用，你需要自动执行：

${enabledRules.map(rule => `
### ${rule.name}
${rule.description}
**触发条件**: ${rule.triggers.map(t => t.eventType).join(', ')}
**执行动作**: ${rule.actions.map(a => `${a.type} ${a.target || ''}`).join(', ')}
`).join('\n')}
  `.trim();
}
```

### 场景启动器扩展（scenario-launcher.ts）

```typescript
/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @Email       None
 *
 * 场景启动器 - 集成技能上下文和 CLAUDE.md
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { log } from "../logger.js";
import * as SkillStore from "../libs/skill-store.js";
import * as ScenarioStore from "../libs/scenario-store.js";
import { buildSkillContext, buildToolSchema } from "../libs/skill-context-builder.js";
import { runClaude, type RunnerHandle } from "../libs/runner.js";
import type { SessionStore } from "../libs/session-store.js";
import type { ServerEvent } from "../types.js";

/**
 * 启动场景（集成所有上下文）
 */
export async function launchScenario(
  scenarioId: string,
  scenarios: ScenarioStore,
  sessions: SessionStore,
  runnerHandles: Map<string, RunnerHandle>,
  emit: (event: ServerEvent) => void
): Promise<void> {
  // 1. 获取场景配置
  const scenario = scenarios.getScenario(scenarioId);
  if (!scenario) {
    emit({ type: "runner.error", payload: { message: `场景不存在: ${scenarioId}` } });
    return;
  }

  log.info(`[scenario-launcher] Launching scenario: ${scenario.name}`);

  // 2. 获取启用的技能
  const skills = scenario.preConfigured.skills
    .map(id => SkillStore.getSkill(id))
    .filter(Boolean);

  // 3. 构建完整提示词
  let fullPrompt = scenario.preConfigured.initialPrompt || '';

  // 3.1 添加技能上下文
  fullPrompt += buildSkillContext(skills);

  // 3.2 添加规则上下文
  // const rules = scenario.preConfigured.rules
  //   .map(id => RuleStore.getRule(id))
  //   .filter(Boolean);
  // fullPrompt += buildRuleContext(rules);

  // 3.3 添加 CLAUDE.md 项目上下文
  if (scenario.preConfigured.cwd) {
    const claudeMdContext = await loadClaudeMd(scenario.preConfigured.cwd);
    if (claudeMdContext) {
      fullPrompt += `\n\n## 项目上下文\n\n${claudeMdContext}`;
    }
  }

  // 4. 创建会话
  const session = sessions.createSession({
    cwd: scenario.preConfigured.cwd,
    title: scenario.name,
    prompt: fullPrompt
  });

  // 5. 启动 Claude（传递工具）
  const toolDefinitions = skills
    .filter(s => s.status === 'enabled')
    .map(s => buildToolSchema(s));

  runClaude({
    prompt: fullPrompt,
    session,
    resumeSessionId: session.claudeSessionId,
    tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
    onEvent: emit,
    onSessionUpdate: (updates) => {
      sessions.updateSession(session.id, updates);
    }
  })
    .then((handle) => {
      runnerHandles.set(session.id, handle);
      // 记录场景使用
      scenarios.recordScenarioUsage(scenarioId);
      log.info(`[scenario-launcher] Scenario launched: ${scenario.name}`);
    })
    .catch((error) => {
      log.error(`[scenario-launcher] Scenario launch failed`, error);
      sessions.updateSession(session.id, { status: "error" });
      emit({
        type: "runner.error",
        payload: {
          sessionId: session.id,
          message: `场景启动失败: ${error instanceof Error ? error.message : String(error)}`
        }
      });
    });

  emit({
    type: "scenario.launched",
    payload: { scenarioId, sessionId: session.id }
  });
}

/**
 * 加载 CLAUDE.md 文件内容
 */
async function loadClaudeMd(cwd: string): Promise<string | null> {
  try {
    const claudeMdPath = join(cwd, '.claude', 'CLAUDE.md');

    if (!existsSync(claudeMdPath)) {
      log.info(`[scenario-launcher] No CLAUDE.md found in ${cwd}`);
      return null;
    }

    const content = readFileSync(claudeMdPath, 'utf8');
    log.info(`[scenario-launcher] Loaded CLAUDE.md from ${cwd} (${content.length} chars)`);
    return content;
  } catch (error) {
    log.warn(`[scenario-launcher] Failed to load CLAUDE.md`, error);
    return null;
  }
}
```

### CLAUDE.md 功能说明

**CLAUDE.md** 是 Claude 官方的**项目上下文功能**，位于项目根目录：

```
项目根目录/
├── .claude/
│   └── CLAUDE.md          # 项目级别上下文文件
├── src/
└── package.json
```

**功能**：
- Claude Code 自动读取 `.claude/CLAUDE.md`
- 内容注入到系统提示词中
- AI 了解项目特定规则、架构、风格

**典型内容**：

```markdown
# 项目名称 - 开发指南

## 项目概述
这是一个 Electron + React 的桌面应用...

## 技术栈
- 前端: React 19, TypeScript, Tailwind CSS
- 后端: Electron 39

## 代码规范
- 使用函数式组件
- 文件头注释：@author, @copyright, @created

## 常用命令
- 开发: `bun dev`
- 构建: `bun run build`
```

**集成方式**：
- 场景启动时自动读取工作目录的 CLAUDE.md
- 内容附加到系统提示词中
- AI 即可获得项目特定上下文

---

## 八、Token 优化和上下文管理策略

### 核心问题

随着技能、规则、CLAUDE.md 的累积，系统提示词会变得非常长，可能导致：
1. **Token 浪费** - 每次请求都发送大量重复的上下文
2. **上下文超限** - 超过模型的 token 限制
3. **响应变慢** - 处理大量上下文增加延迟

### 解决方案 1：上下文分层加载

**策略**：只在需要时才加载详细上下文

```typescript
/**
 * 上下文构建器 - 支持分层加载
 */
export class ContextBuilder {
  private baseContext: string;
  private skillsContext: string;
  private claudeMdContext: string;
  private rulesContext: string;

  constructor(private skills: SkillMetadata[], private claudeMdPath?: string) {
    // 基础上下文（始终包含）
    this.baseContext = `你是一个智能助手，可以根据用户需求使用各种技能帮助完成任务。`;

    // 技能上下文（按需加载）
    this.skillsContext = buildSkillContext(skills);

    // CLAUDE.md 上下文（按需加载）
    this.claudeMdContext = ''; // 延迟加载

    // 规则上下文（按需加载）
    this.rulesContext = '';
  }

  /**
   * 构建轻量级上下文（首次启动）
   */
  buildLight(): string {
    return this.baseContext + `
## 可用技能
你拥有 ${this.skills.length} 个可用技能，会在需要时使用。
`;
  }

  /**
   * 构建完整上下文（用户明确需要时）
   */
  async buildFull(): Promise<string> {
    let context = this.baseContext;

    // 添加技能上下文
    context += this.skillsContext;

    // 添加 CLAUDE.md（如果有）
    if (this.claudeMdPath) {
      const claudeMd = await this.loadClaudeMdLazy();
      if (claudeMd) {
        context += `\n\n${claudeMd}`;
      }
    }

    return context;
  }

  /**
   * 懒加载 CLAUDE.md
   */
  private async loadClaudeMdLazy(): Promise<string | null> {
    if (this.claudeMdContext) return this.claudeMdContext;

    // 只有在用户实际需要项目信息时才加载
    if (!existsSync(this.claudeMdPath)) return null;

    const content = readFileSync(this.claudeMdPath, 'utf8');
    this.claudeMdContext = this.summarizeClaudeMd(content);
    return this.claudeMdContext;
  }

  /**
   * CLAUDE.md 智能摘要
   */
  private summarizeClaudeMd(content: string): string {
    const lines = content.split('\n');
    const maxLines = 50; // 限制行数

    if (lines.length <= maxLines) {
      return content;
    }

    // 保留关键部分
    const keySections = ['## 项目概述', '## 技术栈', '## 代码规范', '## 常用命令'];
    const summary: string[] = [];

    for (const line of lines) {
      // 保留标题和其后的 2 行内容
      if (line.startsWith('#')) {
        summary.push(line);
        const index = lines.indexOf(line);
        summary.push(...lines.slice(index + 1, index + 3));
      }
    }

    return summary.join('\n') + '\n\n... (内容已摘要，完整版本请查看 .claude/CLAUDE.md)';
  }
}
```

### 解决方案 2：技能上下文压缩

**策略**：只注入用户可能需要的技能

```typescript
/**
 * 智能技能选择器
 */
export class SmartSkillSelector {
  /**
   * 根据用户意图选择相关技能
   */
  selectRelevantSkills(
    allSkills: SkillMetadata[],
    userQuery: string
  ): SkillMetadata[] {
    const keywords = this.extractKeywords(userQuery);
    const relevantSkills: SkillMetadata[] = [];

    for (const skill of allSkills) {
      // 计算技能与查询的相关度
      const score = this.calculateRelevance(skill, keywords);
      if (score > 0.3) {
        relevantSkills.push({ ...skill, _relevance: score });
      }
    }

    // 按相关度排序，只保留前 5 个
    return relevantSkills
      .sort((a, b) => b._relevance - a._relevance)
      .slice(0, 5)
      .map(({ _relevance, ...skill }) => skill);
  }

  private extractKeywords(query: string): string[] {
    // 简单的关键词提取（实际可以使用更复杂的 NLP）
    return query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  }

  private calculateRelevance(skill: SkillMetadata, keywords: string[]): number {
    let score = 0;
    const skillText = `${skill.name} ${skill.description} ${skill.tags.join(' ')}`.toLowerCase();

    for (const keyword of keywords) {
      if (skillText.includes(keyword)) {
        score += 0.5;
      }
    }

    return Math.min(score, 1);
  }
}
```

### 解决方案 3：上下文缓存和复用

```typescript
/**
 * 上下文缓存管理器
 */
class ContextCache {
  private cache = new Map<string, { context: string; timestamp: number }>();
  private ttl = 60000; // 60秒缓存

  set(key: string, context: string): void {
    this.cache.set(key, { context, timestamp: Date.now() });
  }

  get(key: string): string | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.context;
  }

  clear(): void {
    this.cache.clear();
  }
}
```

### 解决方案 4：Token 预算和限制

```typescript
/**
 * Token 计数器和限制器
 */
class TokenLimiter {
  private MAX_TOKENS = 180000; // Claude 3.5 Sonnet 上下文限制

  /**
   * 估算 token 数量（粗略估计）
   * 中文约 1.5 token/字符，英文约 4 token/单词
   */
  estimateTokens(text: string): number {
    // 粗略估计：英文 4 chars/token，中文 1.5 chars/token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 1.5 + englishChars / 4);
  }

  /**
   * 截断上下文以适应 token 限制
   */
  truncateToFit(context: string, reservedForUserMessage: number = 10000): string {
    const contextTokens = this.estimateTokens(context);
    const availableTokens = this.MAX_TOKENS - reservedForUserMessage;

    if (contextTokens <= availableTokens) {
      return context;
    }

    // 按比例截断各部分
    const sections = context.split('\n## ');
    let result = '';
    let currentTokens = 0;

    for (const section of sections) {
      const sectionTokens = this.estimateTokens(section);
      if (currentTokens + sectionTokens > availableTokens) {
        break;
      }
      result += (result ? '\n## ' : '') + section;
      currentTokens += sectionTokens;
    }

    return result + '\n\n(注：部分上下文已截断以适应 token 限制)';
  }

  /**
   * 检查提示词是否超限
   */
  willExceedLimit(prompt: string): boolean {
    return this.estimateTokens(prompt) > this.MAX_TOKENS * 0.95;
  }
}
```

### 解决方案 5：分批加载上下文

```typescript
/**
 * 分批上下文加载器
 * 当上下文过大时，分批注入
 */
export class BatchedContextLoader {
  async loadScenarioInBatches(
    scenario: ScenarioCard,
    sessions: SessionStore
  ): Promise<void> {
    // 第一批：只发送基础信息和场景描述
    const initialPrompt = scenario.preConfigured.initialPrompt || '';

    const session = sessions.createSession({
      cwd: scenario.preConfig.cwd,
      title: scenario.name,
      prompt: initialPrompt
    });

    // 等待用户第一条消息后，再注入技能上下文
    // 这样可以避免首次启动就发送大量上下文
  }

  async injectSkillsAfterFirstMessage(
    sessionId: string,
    skills: SkillMetadata[]
  ): Promise<void> {
    // 在用户发送第一条消息后，通过系统消息注入技能信息
    const skillPrompt = `
**技能已激活**
${buildSkillContext(skills)}

你可以在需要时使用这些技能。
    `;

    // 发送系统消息
    // (需要扩展 session 支持系统消息)
  }
}
```

### 最佳实践总结

| 策略 | 适用场景 | Token 节省 |
|------|----------|------------|
| **分层加载** | 所有场景 | 30-50% |
| **智能选择** | 技能数量多 | 40-60% |
| **CLAUDE.md 摘要** | 大项目文件 | 50-70% |
| **上下文缓存** | 重复场景 | 20-30% |
| **分批加载** | 超大上下文 | 50-80% |

### 实现建议

**优先级**：
1. **Phase 1**: 实现基础的 Token 预算和截断
2. **Phase 2**: 实现 CLAUDE.md 智能摘要
3. **Phase 3**: 实现智能技能选择
4. **Phase 4**: 实现上下文缓存

**关键文件**：
- `src/electron/libs/context-builder.ts` - 上下文构建器
- `src/electron/libs/token-limiter.ts` - Token 限制器
- `src/electron/libs/smart-skill-selector.ts` - 智能技能选择器

---

## 九、UI 设计方案

### 设计风格

- **颜色**: 使用 shadcn/ui 默认主题（蓝色主色调）
- **图标**: emoji 作为技能/场景图标
- **字体**: Inter (sans), JetBrains Mono (mono)
- **间距**: 4px 栅格系统
- **动画**: `transition-all duration-200`

### 技能卡片组件（SkillCard.tsx）

```tsx
interface SkillCardProps {
  skill: SkillMetadata;
  enabled: boolean;
  onToggle: (skillId: string) => void;
  onClick: (skillId: string) => void;
}

export function SkillCard({ skill, enabled, onToggle, onClick }: SkillCardProps) {
  return (
    <div
      className={`
        group relative p-4 rounded-xl border transition-all duration-200
        hover:shadow-lg hover:border-primary/50 cursor-pointer
        ${enabled ? 'bg-card border-primary/30' : 'bg-card/50 border-border opacity-70'}
      `}
      onClick={() => onClick(skill.id)}
    >
      {/* 头部：图标 + 名称 + 开关 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{skill.icon}</span>
          <div>
            <h3 className="font-semibold text-foreground">{skill.name}</h3>
            <span className="text-xs text-muted-foreground">{skill.category}</span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(skill.id); }}
          className={`w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-muted'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* 描述 */}
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {skill.description}
      </p>

      {/* 标签 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {skill.tags.slice(0, 3).map(tag => (
          <span key={tag} className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-md">
            #{tag}
          </span>
        ))}
      </div>

      {/* 使用统计 */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>使用 {skill.usageCount} 次</span>
      </div>
    </div>
  );
}
```

### 场景卡片组件（ScenarioCard.tsx）

```tsx
interface ScenarioCardProps {
  scenario: ScenarioCard;
  isFavorite: boolean;
  onLaunch: (scenarioId: string) => void;
  onToggleFavorite: (scenarioId: string) => void;
}

export function ScenarioCard({ scenario, isFavorite, onLaunch, onToggleFavorite }: ScenarioCardProps) {
  return (
    <div className="group relative p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-lg">
      {/* 收藏按钮 */}
      <button
        onClick={() => onToggleFavorite(scenario.id)}
        className="absolute top-4 right-4 text-muted-foreground hover:text-yellow-500"
      >
        {isFavorite ? '' : '☆'}
      </button>

      {/* 图标 */}
      <div className="text-4xl mb-4">{scenario.icon}</div>

      {/* 名称 */}
      <h3 className="text-lg font-semibold text-foreground mb-2">{scenario.name}</h3>

      {/* 描述 */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{scenario.description}</p>

      {/* 启动按钮 */}
      <button
        onClick={() => onLaunch(scenario.id)}
        className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
      >
        开始
      </button>

      {/* 使用次数 */}
      <div className="mt-3 text-xs text-muted-foreground">使用 {scenario.useCount} 次</div>
    </div>
  );
}
```

### 响应式网格布局

```tsx
// 场景网格
export function ScenarioGrid({ scenarios, onLaunch }: ScenarioGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {scenarios.map(scenario => (
        <ScenarioCard key={scenario.id} scenario={scenario} onLaunch={onLaunch} />
      ))}
    </div>
  );
}
```

---

## 八、实现优先级（分阶段交付）

### Phase 1: 数据模型和存储（2-3天）
- [ ] 扩展 `src/electron/types.ts` 添加新类型
- [ ] 实现 `skill-store.ts`（函数式，JSON 存储）
- [ ] 实现 `scenario-store.ts`
- [ ] 实现 `builtin-skills.ts` 和 `builtin-scenarios.ts`
- [ ] 在 `main.ts` 中注册新的 IPC 事件处理器

**关键文件**:
- `src/electron/types.ts`
- `src/electron/libs/skill-store.ts`
- `src/electron/libs/scenario-store.ts`
- `src/electron/builtin/builtin-skills.ts`
- `src/electron/builtin/builtin-scenarios.ts`

### Phase 2: 技能系统（3-4天）
- [ ] 实现 `skill-handlers.ts`
- [ ] 扩展 `useAppStore.ts` 添加技能状态
- [ ] 实现 `SkillCard.tsx` 组件
- [ ] 实现 `SkillList.tsx` 页面
- [ ] 在 Sidebar 添加技能管理入口

**关键文件**:
- `src/electron/handlers/skill-handlers.ts`
- `src/ui/store/useAppStore.ts`
- `src/ui/components/Skill/SkillCard.tsx`
- `src/ui/components/Skill/SkillList.tsx`

### Phase 3: 场景系统（2-3天）
- [ ] 实现 `scenario-handlers.ts`
- [ ] 实现 `ScenarioCard.tsx` 组件
- [ ] 实现 `ScenarioGrid.tsx` 页面
- [ ] 在首页展示场景网格

**关键文件**:
- `src/electron/handlers/scenario-handlers.ts`
- `src/ui/components/Scenario/ScenarioCard.tsx`
- `src/ui/components/Scenario/ScenarioGrid.tsx`

### Phase 4: 规则系统（3-4天）
- [ ] 实现 `rule-store.ts`
- [ ] 实现 `rule-handlers.ts`
- [ ] 实现 `RuleList.tsx` 和 `RuleEditor.tsx`

**关键文件**:
- `src/electron/libs/rule-store.ts`
- `src/electron/handlers/rule-handlers.ts`
- `src/ui/components/Rule/*.tsx`

### Phase 5: 插件系统（4-5天）
- [ ] 实现 `plugin-store.ts`
- [ ] 实现 `plugin-handlers.ts`
- [ ] 实现 `PluginCard.tsx` 和 `PluginList.tsx`
- [ ] 实现插件安装功能

**关键文件**:
- `src/electron/libs/plugin-store.ts`
- `src/electron/handlers/plugin-handlers.ts`
- `src/ui/components/Plugin/*.tsx`

### Phase 6: 高级功能和优化（3-4天）
- [ ] 搜索和过滤功能
- [ ] 技能执行器实现
- [ ] 规则引擎实现
- [ ] 性能优化

### Phase 7: 测试和文档（2-3天）
- [ ] 单元测试
- [ ] 集成测试
- [ ] 用户文档
- [ ] 开发者文档

---

## 九、关键文件清单

### 后端核心文件
1. `src/electron/types.ts` - 类型定义扩展
2. `src/electron/libs/hybrid-store.ts` - 混合存储基类
3. `src/electron/libs/skill-store.ts` - 技能存储
4. `src/electron/libs/scenario-store.ts` - 场景存储
5. `src/electron/libs/skill-context-builder.ts` - AI 上下文构建器
6. `src/electron/handlers/skill-handlers.ts` - 技能 IPC 处理器
7. `src/electron/handlers/scenario-handlers.ts` - 场景 IPC 处理器
8. `src/electron/builtin/builtin-skills.ts` - 内置技能
9. `src/electron/builtin/builtin-scenarios.ts` - 内置场景

### 前端核心文件
10. `src/ui/store/useAppStore.ts` - Zustand 状态扩展
11. `src/ui/components/Skill/SkillCard.tsx` - 技能卡片
12. `src/ui/components/Scenario/ScenarioCard.tsx` - 场景卡片
13. `src/ui/components/Scenario/ScenarioGrid.tsx` - 场景网格

### 新增：AI 上下文文件
14. `src/electron/libs/scenario-launcher.ts` - 场景启动器（集成 CLAUDE.md）

### 配置文件
15. `src/electron/main.ts` - 应用退出时强制同步数据

---

## 十、验证测试计划

### 功能测试
1. 启动应用，验证场景卡片正常显示
2. 点击场景卡片，验证会话正确启动
3. 进入技能管理，验证技能列表正常显示
4. 切换技能开关，验证状态正确同步

### UI 测试
1. 验证浅色/深色模式切换
2. 验证响应式布局
3. 验证 hover 状态动画

### 集成测试
1. 启动场景后，预配置技能是否正确启用
2. 技能状态变化是否实时同步到前端
3. JSON 缓存与 SQLite 持久化是否正确同步

### AI 上下文测试（新增）
1. **技能上下文注入**：
   - 启用技能后，AI 是否在提示词中看到技能说明
   - AI 是否根据技能主动提供帮助
2. **CLAUDE.md 集成**：
   - 在有 CLAUDE.md 的项目中启动场景
   - 验证 AI 是否获得项目上下文信息
   - 验证 AI 的回复是否符合项目规范
3. **场景启动**：
   - 场景启动后，初始提示词是否正确
   - 预配置的技能是否正确声明为工具

---

**备注**: 本计划完全基于现有项目架构，遵循 `session-handlers.ts` 和 `config-store.ts` 的代码模式。
