# 设置中「记忆」能力 — 前后端设计方案

## 一、目标与范围

- **目标**：在设置中增加「记忆」能力，支持用户自定义多种类的记忆数据，并通过 MCP 在对话中供模型存取（存储、回忆、遗忘）。
- **参考**：Claude Cowork / Claude Desktop 记忆、[claude-memory-mcp](https://github.com/WhenMoon-afk/claude-memory-mcp)（FTS5、memory_store / memory_recall / memory_forget）、官方 `@modelcontextprotocol/server-memory`。
- **原则**：本地优先、与现有 MCP/设置架构一致、种类可扩展。

---

## 二、产品概念

| 概念 | 说明 |
|------|------|
| **记忆种类（Memory Kind）** | 用户自定义的一类记忆，如「偏好」「项目决策」「待办」「人物信息」。可配置名称、描述、可选 schema。 |
| **记忆条目（Memory Entry）** | 单条记忆内容，属于某一种类；可含摘要、实体、重要性、时间等。 |
| **记忆 MCP** | 暴露 `memory_store` / `memory_recall` / `memory_forget` 等工具的 MCP 服务，读写上述存储，供 Qwen SDK 在会话中调用。 |

用户可在**设置 → 记忆**中：管理种类、可选地预填/查看条目；对话中由模型通过 MCP 自动存取记忆。

---

## 三、后端方案（Electron 主进程）

### 3.1 目录与职责

```
src/electron/
├── storage/
│   └── memory-store.ts        # 记忆种类 + 条目的持久化
├── mcp-servers/               # 可选：内置 MCP 实现
│   └── memory/
│       ├── index.ts           # MCP Server 入口，暴露 tools
│       └── adapter.ts         # 调用 memory-store 的读写
├── main/
│   └── ipc-registry.ts       # 注册记忆相关 IPC
└── managers/
    └── mcp-server-manager.ts  # 可选：注入内置记忆 MCP
```

- **memory-store**：唯一的数据源（种类 + 条目），供设置 UI（IPC）与内置 MCP 共用。
- **mcp-servers/memory**：可选；若不内置，则依赖用户自行配置外部 Memory MCP（如 `@modelcontextprotocol/server-memory` 或 claude-memory-mcp），设置里只做「种类/预填」管理。

### 3.2 数据模型（memory-store）

**存储位置**：与现有约定一致，例如：

- `app.getPath('userData')/memory/`  
或  
- `~/.qwen/memory/`（与 Qwen 生态统一）

**种类（Kind）**：

```ts
interface MemoryKind {
  id: string;           // 唯一，如 uuid
  name: string;         // 显示名，如「偏好」「项目决策」
  description?: string;
  color?: string;       // 可选，UI 标签色
  schema?: Record<string, unknown>; // 可选，约束条目结构
  createdAt: number;
  updatedAt: number;
}
```

**条目（Entry）**：

```ts
interface MemoryEntry {
  id: string;
  kindId: string;
  content: string;      // 原始内容
  summary?: string;     // 可选摘要（便于 recall 展示）
  entities?: string[];  // 可选实体标签
  importance?: 'low' | 'medium' | 'high';
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;   // 软删
}
```

**持久化形式**（二选一或组合）：

- **方案 A**：  
  - `memory/kinds.json`：`MemoryKind[]`  
  - `memory/entries.json`：`MemoryEntry[]`（或按 kindId 分文件）
- **方案 B**：SQLite（`memory/memory.db`）+ FTS5，便于后续做全文检索与 token 预算（对齐 claude-memory-mcp）。

建议：首版用 **方案 A** 实现简单、与现有 agents-store / rules-store 风格一致；后续若需要更强检索再引入 SQLite+FTS5。

### 3.3 memory-store API 设计

```ts
// 种类 CRUD
getMemoryKinds(): Promise<MemoryKind[]>;
getMemoryKind(id: string): Promise<MemoryKind | null>;
createMemoryKind(kind: Omit<MemoryKind, 'id' | 'createdAt' | 'updatedAt'>): Promise<MemoryKind>;
updateMemoryKind(id: string, patch: Partial<MemoryKind>): Promise<void>;
deleteMemoryKind(id: string): Promise<void>;

// 条目 CRUD（供设置预填 + MCP 使用）
getMemoryEntries(kindId?: string, options?: { includeDeleted?: boolean }): Promise<MemoryEntry[]>;
getMemoryEntry(id: string): Promise<MemoryEntry | null>;
createMemoryEntry(entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<MemoryEntry>;
updateMemoryEntry(id: string, patch: Partial<MemoryEntry>): Promise<void>;
deleteMemoryEntry(id: string, soft?: boolean): Promise<void>;

// 供 MCP recall 使用：按种类/关键词/重要性筛选（首版可简单实现为过滤 + 排序）
searchMemoryEntries(params: {
  kindId?: string;
  query?: string;
  importance?: MemoryEntry['importance'];
  limit?: number;
}): Promise<MemoryEntry[]>;
```

实现时注意：写文件用「先写临时文件再 rename」的原子写入，避免损坏。

### 3.4 内置记忆 MCP 与 Runner 集成

**目标**：Runner 启动会话时，除用户配置的 MCP 外，自动带上「内置记忆 MCP」，使模型能调用 memory_store / memory_recall / memory_forget。

**方式一：子进程 stdio MCP（推荐）**

- 在仓库内实现一个小型 MCP Server（如 `src/electron/mcp-servers/memory/index.ts`），使用 `@modelcontextprotocol/sdk` 的 `Server`，暴露工具：
  - `memory_store`：写入一条记忆（可带 kindId、content、importance 等）。
  - `memory_recall`：按 query / kindId / limit 查询，返回条目列表（含 content/summary）。
  - `memory_forget`：对指定 id 做软删。
- 该进程通过 **stdio** 与 SDK 通信；数据读写统一调用 memory-store（同一 userData 路径）。
- 在 **mcp-server-manager** 或 **runner** 中构造「内置记忆」配置，例如：

```ts
const memoryServerPath = path.join(__dirname, 'mcp-servers', 'memory', 'index.js');
const memoryStorePath = getMemoryStorePath(); // 与 memory-store 一致
allMcpServers['dtazzicowork-memory'] = {
  command: process.execPath,
  args: [memoryServerPath, '--db', memoryStorePath],
  env: { MEMORY_DB_PATH: memoryStorePath },
  enabled: true,
};
```

- 这样 `getMcpServers()` 返回的列表中包含 `dtazzicowork-memory`，Runner 已有逻辑会把 `allMcpServers` 传给 SDK，无需改 SDK 调用方式。

**方式二：仅使用外部 Memory MCP**

- 不实现内置 MCP，在设置「MCP」页引导用户配置例如 `@modelcontextprotocol/server-memory` 或 claude-memory-mcp。
- 设置「记忆」页只做：**种类管理** + **预填/查看条目**（通过 IPC 读写 memory-store）；若用户使用的外部 MCP 也写同一路径，则可打通；否则预填数据仅作「导出/说明」用，模型侧记忆仍完全由外部 MCP 管理。
- 优点：实现量小；缺点：预填与模型侧记忆可能不一致，需在 UI 上说明。

**推荐**：首版采用 **方式一**，内置一个最小可用的记忆 MCP，数据与设置页完全一致；种类与条目均存于 memory-store，MCP 仅作为「工具层」。

### 3.5 IPC 设计（ipc-registry + preload）

在 `ipc-registry.ts` 中新增：

- `memory.getKinds` → `getMemoryKinds()`
- `memory.getKind` → `getMemoryKind(id)`
- `memory.createKind` → `createMemoryKind(kind)`
- `memory.updateKind` → `updateMemoryKind(id, patch)`
- `memory.deleteKind` → `deleteMemoryKind(id)`
- `memory.getEntries` → `getMemoryEntries(kindId?, options?)`
- `memory.getEntry` → `getMemoryEntry(id)`
- `memory.createEntry` → `createMemoryEntry(entry)`
- `memory.updateEntry` → `updateMemoryEntry(id, patch)`
- `memory.deleteEntry` → `deleteMemoryEntry(id, soft?)`
- `memory.searchEntries` → `searchMemoryEntries(params)`（可选，供设置页「搜索」用）

preload 与 `electron.d.ts` 中为上述 API 增加类型与暴露，与现有 MCP/Agents 风格一致。

---

## 四、前端方案（设置页 + 数据流）

### 4.1 设置结构

- 在 **设置导航** 中增加一项：「记忆」（如 icon: Brain / Database）。
- `SettingsSection` 增加 `'memory'`。
- 在 **SettingsContent** 的 switch 中渲染 `MemorySection`。

### 4.2 MemorySection 功能与布局

- **顶部**：标题 + 简短说明（本地存储、种类可自定义、对话中通过 MCP 存取）。
- **记忆种类**：
  - 列表展示：名称、描述、条目数、更新时间；支持新增、编辑、删除。
  - 新增/编辑：弹窗或内联表单，字段：名称、描述、可选颜色。
- **记忆条目**（按种类或「全部」）：
  - 列表：内容摘要、所属种类、重要性、时间；支持搜索（调用 `memory.searchEntries`）、筛选种类。
  - 支持「手动添加一条」：选择种类、填写 content、可选 summary/importance。
  - 支持编辑、软删（或硬删）。
- **与 MCP 的关系**：说明「对话中 AI 会通过记忆 MCP 自动存储与回忆；此处可管理种类与预填内容」。

可选：在「MCP」设置页增加提示——若启用内置记忆，会看到 `dtazzicowork-memory`；或在该页提供「打开记忆设置」的快捷入口。

### 4.3 状态与请求

- 种类列表、当前选中的种类、条目列表、加载/保存状态用 React state 或轻量 store 即可。
- 所有持久化通过 `window.electron.memory.*` 调用 IPC，错误用 toast 或内联提示。

### 4.4 多语言

- 在 `en.ts` / `zh.ts` 等中增加 `memory.*`：标题、描述、种类名/描述、按钮（新增/编辑/删除/保存）、空状态、错误提示等。

---

## 五、MCP 工具与协议（内置实现时）

与社区习惯对齐，建议工具名与参数如下（可与 claude-memory-mcp / 官方 server-memory 求同存异）：

| 工具 | 说明 | 主要参数 |
|------|------|----------|
| `memory_store` | 存储一条记忆 | `content`（必填）, `kindId`?, `importance?`, `summary?`, `entities?` |
| `memory_recall` | 按条件回忆 | `query?`, `kindId?`, `limit?`, `importance?` |
| `memory_forget` | 软删一条 | `id`（条目 id） |
| `memory_list_kinds` | 列出所有种类（可选） | 无 |

实现时，这些工具内部调用 memory-store 的 `createMemoryEntry` / `searchMemoryEntries` / `deleteMemoryEntry` / `getMemoryKinds` 等。

---

## 六、实施顺序建议

1. **后端**  
   - 实现 `memory-store.ts`（种类 + 条目，JSON 持久化）。  
   - 在 ipc-registry + preload + electron.d.ts 中注册并暴露上述 IPC。
2. **前端**  
   - 增加设置导航项与 `MemorySection`；实现种类 CRUD 与条目列表/增删改/搜索（调用 IPC）。
3. **MCP**  
   - 实现内置记忆 MCP（stdio，读同一 memory-store），在 runner 或 mcp-server-manager 中注入 `dtazzicowork-memory`。
4. **打磨**  
   - 多语言、错误提示、空状态、可选「导出/导入」记忆数据。

按此顺序可先交付「设置内管理种类与预填记忆」，再交付「对话中通过 MCP 存取」，最终形成完整「设置中增加记忆能力 + 基于 MCP 从记忆中调用」的闭环。

---

## 七、参考与差异

| 参考 | 要点 | 本方案 |
|------|------|--------|
| Claude Cowork / Desktop | 对话历史本地、部分产品带记忆 | 我们做「用户自定义种类 + 条目」，更结构化 |
| claude-memory-mcp | FTS5、store/recall/forget、软删、token 预算 | 首版用 JSON + 简单筛选；后续可升级 SQLite+FTS5 |
| @modelcontextprotocol/server-memory | 官方记忆 MCP | 工具命名与参数尽量兼容，便于用户切换或复用 |
| 现有 DtazziCowork | MCP 在 mcp-store + runner 传入 SDK；设置用 IPC | 记忆数据独立 store，MCP 注入方式与现有 MCP 一致 |

以上为前后端整体设计方案，可直接作为开发任务拆解与实现的依据。
