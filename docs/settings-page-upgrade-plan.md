# Agent Cowork 设置页面升级计划

## 项目概述

将 Agent Cowork 的 API 配置功能升级为完整的设置页面系统，从弹出式模态框改为独立的全页面设置。

---

## 一、当前架构分析

### 1.1 现有结构
- **路由方式**: 单页面应用，Zustand 状态控制
- **布局**: Sidebar (280px) + 主内容区 (ml-[280px])
- **设置**: 模态框形式 (SettingsModal.tsx)
- **状态管理**: Zustand (useAppStore)
- **样式**: Tailwind CSS 4 + CSS 变量

### 1.2 现有设计系统

```css
/* 颜色 */
--color-surface: #FFFFFF
--color-surface-secondary: #F5F4F1
--color-surface-tertiary: #EFEEE9
--color-accent: #D97757 (Claude 橙色)
--color-ink-900: #1A1915 (主要文字)

/* 组件样式 */
按钮: rounded-full/bg-accent 或 rounded-xl/border
输入框: rounded-xl/border/bg-surface-secondary
卡片: rounded-2xl/border/shadow
圆角: xl (12px), 2xl (16px), full (9999px)
阴影: shadow-soft, shadow-card, shadow-elevated
```

### 1.3 关键文件路径

| 文件 | 用途 |
|------|------|
| `src/ui/store/useAppStore.ts` | 核心状态管理 |
| `src/ui/components/App.tsx` | 应用主入口 |
| `src/ui/components/Sidebar.tsx` | 侧边栏组件 |
| `src/ui/components/SettingsModal.tsx` | 现有 API 设置模态框 |
| `src/electron/libs/config-store.ts` | API 配置存储 |
| `src/electron/libs/slash-commands.ts` | MCP 加载逻辑 |

---

## 二、设计方案

### 2.1 页面布局

```
┌──────────────────────────────────────────────────────────────┐
│  Agent Cowork                                               │
├───────────┬──────────────────────────────────────────────────┤
│  Sidebar  │  ┌────────────┬─────────────────────────────┐       │
│  (280px)  │  │  返回按钮  │  设置页面标题            │       │
│           │  └────────────┴─────────────────────────────┘       │
│  [设置] →  │  ┌────────────┬─────────────────────────────┐       │
│  [新建]   │  │            │                             │       │
│  [会话]   │  │  左侧导航   │      右侧内容区            │       │
│           │  │  (280px)   │      (Flex-1)               │       │
│           │  │            │                             │       │
│           │  │  帮助      │  ┌─────────────────────┐     │       │
│           │  │  反馈      │  │  设置内容          │     │       │
│           │  │  关于      │  │  + 说明文字        │     │       │
│           │  │  ────────   │  │                     │     │       │
│           │  │  API设置    │  │  [表单/列表]       │     │       │
│           │  │  MCP设置   │  │                     │     │       │
│           │  │  Skills    │  │                     │     │       │
│  ...      │  │  Plugins   │  │                     │     │       │
│           │  │  Memory    │  │                     │     │       │
│           │  │  Agents    │  │                     │     │       │
│           │  │  Hooks     │  │                     │     │       │
│           │  │  Permissions│ │                     │     │       │
│           │  │  会话恢复  │  │                     │     │       │
│           │  └────────────┴─────────────────────────────┘     │
│           └────────────┴───────────────────────────────────────┘
└───────────┴───────────────────────────────────────────────────────┘

左右列比例：1:3 (左侧 280px，右侧 Flex-1)
```

### 2.2 左侧导航结构

```typescript
const SETTINGS_SECTIONS = [
  // 常规
  { id: 'help', label: '帮助', icon: HelpCircle, group: 'general' },
  { id: 'feedback', label: '反馈', icon: MessageSquare, group: 'general' },
  { id: 'about', label: '关于', icon: Info, group: 'general' },

  // API 配置
  { id: 'api', label: 'API 设置', icon: Key, group: 'api' },
  { id: 'mcp', label: 'MCP 设置', icon: Plug, group: 'api' },

  // 功能扩展
  { id: 'skills', label: 'Skills', icon: Zap, group: 'features' },
  { id: 'plugins', label: 'Plugins', icon: Puzzle, group: 'features' },
  { id: 'memory', label: 'Memory', icon: Database, group: 'features' },
  { id: 'agents', label: 'Agents', icon: Bot, group: 'features' },
  { id: 'hooks', label: 'Hooks', icon: GitBranch, group: 'features' },

  // 系统
  { id: 'permissions', label: 'Permissions', icon: Shield, group: 'system' },
  { id: 'output', label: 'Output Styles', icon: Palette, group: 'system' },
  { id: 'recovery', label: '会话恢复', icon: History, group: 'system' },
];
```

**图标使用**: 使用 Lucide React (已安装)，SVG 格式，viewBox="0 0 24 24"

### 2.3 右侧内容区域设计

每个设置区域包含：

```typescript
<section className="space-y-6">
  {/* 标题区 */}
  <header>
    <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
    <p className="mt-2 text-sm text-muted">{description}</p>
  </header>

  {/* 设置内容 */}
  <div className="space-y-4">
    {content}
  </div>

  {/* 说明文字 */}
  <aside className="mt-6 p-4 rounded-xl bg-surface-secondary border border-ink-900/5">
    <p className="text-xs text-muted">{说明文字}</p>
  </aside>
</section>
```

---

## 三、技术实现

### 3.1 目录结构

```
src/ui/
├── pages/
│   └── SettingsPage/
│       ├── SettingsPage.tsx           # 主页面容器
│       ├── SettingsNavigation.tsx     # 左侧导航
│       ├── SettingsContent.tsx        # 右侧内容容器
│       └── sections/                 # 各设置区域
│           ├── HelpSection.tsx
│           ├── FeedbackSection.tsx
│           ├── AboutSection.tsx
│           ├── ApiSection.tsx          # 迁移自 SettingsModal
│           ├── McpSection.tsx          # 新增
│           ├── SkillsSection.tsx
│           ├── PluginsSection.tsx
│           ├── MemorySection.tsx       # 预留 memvid 功能
│           ├── AgentsSection.tsx
│           ├── HooksSection.tsx
│           ├── PermissionsSection.tsx
│           ├── OutputSection.tsx
│           └── RecoverySection.tsx
├── components/
│   ├── App.tsx                        # 修改：添加页面切换
│   └── Sidebar.tsx                    # 修改：设置按钮行为
├── store/
│   └── useAppStore.ts                 # 扩展：添加页面状态
└── hooks/
    ├── useApiConfig.ts                # 提取 API 配置逻辑
    └── useMcpConfig.ts                 # MCP 配置逻辑
```

### 3.2 状态管理扩展

```typescript
// src/ui/store/useAppStore.ts

interface AppState {
  // 现有字段...

  // 新增
  currentPage: 'main' | 'settings';
  settingsSection: SettingsSection;
  showSettingsModal: boolean;  // 保留兼容
}

type SettingsSection =
  | 'help' | 'feedback' | 'about'
  | 'api' | 'mcp'
  | 'skills' | 'plugins' | 'memory' | 'agents' | 'hooks'
  | 'permissions' | 'output' | 'recovery';
```

### 3.3 核心：SettingsPage 组件

```typescript
// src/ui/pages/SettingsPage/SettingsPage.tsx

export function SettingsPage() {
  const { settingsSection, setSettingsSection, setCurrentPage } = useAppStore();

  return (
    <div className="flex h-screen bg-surface">
      {/* 顶部标题栏 */}
      <header className="fixed top-0 left-0 right-0 h-12 bg-surface border-b border-ink-900/10 flex items-center px-4 z-10">
        <button
          onClick={() => setCurrentPage('main')}
          className="p-2 rounded-lg hover:bg-surface-tertiary transition-colors cursor-pointer"
          aria-label="返回"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="ml-4 text-lg font-semibold text-ink-900">设置</h1>
      </header>

      {/* 主内容区 */}
      <div className="flex pt-12">
        {/* 左侧导航 */}
        <SettingsNavigation
          activeSection={settingsSection}
          onSectionChange={setSettingsSection}
          className="fixed left-0 top-12 bottom-0 w-[280px] overflow-y-auto"
        />

        {/* 右侧内容 */}
        <SettingsContent
          activeSection={settingsSection}
          className="flex-1 ml-[280px]"
        />
      </div>
    </div>
  );
}
```

### 3.4 左侧导航组件

```typescript
// src/ui/pages/SettingsPage/SettingsNavigation.tsx

import { HelpCircle, MessageSquare, Info, Key, Plug, Zap, Puzzle, Database, Bot, GitBranch, Shield, Palette, History } from 'lucide-react';

const SETTINGS_SECTIONS = [
  { id: 'help', label: '帮助', icon: HelpCircle, group: 'general' },
  { id: 'feedback', label: '反馈', icon: MessageSquare, group: 'general' },
  { id: 'about', label: '关于', icon: Info, group: 'general' },
  { id: 'api', label: 'API 设置', icon: Key, group: 'api' },
  { id: 'mcp', label: 'MCP 设置', icon: Plug, group: 'api' },
  { id: 'skills', label: 'Skills', icon: Zap, group: 'features' },
  { id: 'plugins', label: 'Plugins', icon: Puzzle, group: 'features' },
  { id: 'memory', label: 'Memory', icon: Database, group: 'features' },
  { id: 'agents', label: 'Agents', icon: Bot, group: 'features' },
  { id: 'hooks', label: 'Hooks', icon: GitBranch, group: 'features' },
  { id: 'permissions', label: 'Permissions', icon: Shield, group: 'system' },
  { id: 'output', label: 'Output Styles', icon: Palette, group: 'system' },
  { id: 'recovery', label: '会话恢复', icon: History, group: 'system' },
];

export function SettingsNavigation({ activeSection, onSectionChange }: Props) {
  return (
    <nav className="px-4 py-6 space-y-1">
      {/* 分组渲染 */}
      {['general', 'api', 'features', 'system'].map(group => (
        <div key={group} className="mb-6">
          {SETTINGS_SECTIONS
            .filter(s => getGroup(s.id) === group)
            .map(section => (
              <button
                key={section.id}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer",
                  activeSection === section.id
                    ? "bg-accent/10 text-accent"
                    : "text-ink-700 hover:bg-surface-tertiary"
                )}
                onClick={() => onSectionChange(section.id)}
              >
                <section.icon className="w-5 h-5" strokeWidth={2} />
                <span>{section.label}</span>
              </button>
            ))}
        </div>
      ))}
    </nav>
  );
}
```

### 3.5 MCP 功能集成

#### 3.5.1 后端存储

```typescript
// src/electron/libs/mcp-store.ts

interface McpConfig {
  servers: Record<string, McpServerConfig>;
}

interface McpServerConfig {
  name: string;
  command?: string;
  args?: string[];
  url?: string;
  type?: 'stdio' | 'sse' | 'streamableHttp';
  disabled?: boolean;
  env?: Record<string, string>;
}

export async function loadMcpConfig(): Promise<McpConfig> {
  // 从 settings.json 读取 mcpServers
}

export async function saveMcpConfig(config: McpConfig): Promise<void> {
  // 写入 settings.json
}
```

#### 3.5.2 会话集成

```typescript
// src/electron/libs/runner.ts

// 在启动会话时，将 MCP 配置传递给 SDK
const mcpServers = await loadMcpConfig();
const env = {
  ...buildEnvForConfig(config),
  MCP_SERVERS: JSON.stringify(mcpServers.servers),
};

const q = query({
  prompt,
  options: {
    env,
    // ...
  }
});
```

#### 3.5.3 MCP 设置界面

```typescript
// src/ui/pages/SettingsPage/sections/McpSection.tsx

export function McpSection() {
  const [servers, setServers] = useState<McpServerConfig[]>([]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">MCP 设置</h1>
        <p className="text-sm text-muted">
          配置 Model Context Protocol 服务器，让 AI 会话能够调用外部工具
        </p>
      </header>

      {/* 服务器列表 */}
      <div className="space-y-3">
        {servers.map(server => (
          <McpServerCard key={server.name} server={server} />
        ))}
      </div>

      {/* 添加服务器按钮 */}
      <button className="w-full py-3 rounded-xl border-2 border-dashed border-ink-900/10 text-sm text-muted hover:border-accent/50 transition-colors duration-200 cursor-pointer">
        + 添加 MCP 服务器
      </button>

      <aside className="p-4 rounded-xl bg-surface-secondary border border-ink-900/5">
        <p className="text-xs text-muted">
          <strong>提示：</strong>MCP 服务器会在会话启动时自动加载。
          配置的命令工具将可供 AI 调用。
        </p>
      </aside>
    </div>
  );
}
```

---

## 四、实现步骤

### 阶段一：基础架构（优先级：高）

1. **创建目录结构**
   ```bash
   mkdir -p src/ui/pages/SettingsPage/sections
   ```

2. **扩展状态管理**
   - 修改 [src/ui/store/useAppStore.ts](src/ui/store/useAppStore.ts)
   - 添加 `currentPage` 和 `settingsSection`

3. **创建核心组件**
   - SettingsPage.tsx
   - SettingsNavigation.tsx
   - SettingsContent.tsx

4. **修改 App.tsx**
   - 添加页面切换条件渲染
   - 保留现有主界面

5. **修改 Sidebar.tsx**
   - 设置按钮切换到设置页面

### 阶段二：API 设置迁移（优先级：高）

1. **创建 useApiConfig hook**
   - 提取 SettingsModal 的状态和逻辑

2. **创建 ApiSection.tsx**
   - 迁移表单功能
   - 迁移配置列表功能
   - 保持 UI 风格一致

### 阶段三：MCP 功能（优先级：高）

1. **后端实现**
   - mcp-store.ts
   - 修改 runner.ts 集成 MCP
   - 添加 IPC 处理器

2. **前端实现**
   - McpSection.tsx
   - MCP 组件（卡片、对话框）
   - 扩展 electron.d.ts

### 阶段四：其他区域（优先级：中）

1. **创建框架组件**
   - HelpSection, FeedbackSection, AboutSection
   - SkillsSection, PluginsSection, MemorySection（预留 memvid）
   - AgentsSection, HooksSection
   - PermissionsSection, OutputSection, RecoverySection

2. **会话恢复功能**
   - 读取会话列表
   - 点击恢复会话
   - 显示会话历史

### 阶段五：完善优化（优先级：低）

1. **国际化**
   - 添加翻译文件

2. **动画效果**
   - 页面切换过渡
   - 设置区域切换动画

3. **测试**
   - 单元测试
   - 集成测试

---

## 五、设计规范（基于 ui-ux-pro-max）

### 5.1 图标规范
- ✅ 使用 Lucide React SVG 图标
- ✅ 固定 viewBox="0 0 24 24"
- ✅ 尺寸：w-5 h-5 (20px)
- ✅ strokeWidth: 2
- ❌ 不使用 emoji 作为 UI 图标

### 5.2 交互规范
- ✅ 可点击元素：`cursor-pointer`
- ✅ 悬停反馈：`hover:bg-surface-tertiary`
- ✅ 平滑过渡：`transition-colors duration-200`
- ❌ 避免使用 scale 变换（布局偏移）

### 5.3 颜色对比
- ✅ 主要文字：`text-ink-900` (#1A1915)
- ✅ 次要文字：`text-ink-700` (#4A4A45)
- ✅ 说明文字：`text-muted` (derived color)
- ✅ 玻璃效果（浅色模式）：`bg-white/80`

### 5.4 布局规范
- ✅ 固定元素添加边距避开内容
- ✅ 响应式断点：320px, 768px, 1024px, 1440px
- ✅ 内容区最大宽度：`max-w-4xl`

---

## 六、关键文件清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| [src/ui/store/useAppStore.ts](src/ui/store/useAppStore.ts) | 扩展 | 添加页面状态 |
| [src/ui/components/App.tsx](src/ui/components/App.tsx) | 修改 | 添加页面切换 |
| [src/ui/components/Sidebar.tsx](src/ui/components/Sidebar.tsx) | 修改 | 设置按钮行为 |
| [src/ui/components/SettingsModal.tsx](src/ui/components/SettingsModal.tsx) | 迁移 | 提取逻辑到 ApiSection |
| [src/electron/libs/runner.ts](src/electron/libs/runner.ts) | 修改 | 集成 MCP 配置 |
| [src/ui/electron.d.ts](src/ui/electron.d.ts) | 扩展 | MCP IPC 接口 |

---

## 七、验收标准

### 功能验收
- [ ] 13 个设置区域全部实现
- [ ] API 设置功能完整迁移
- [ ] MCP 配置可保存和加载
- [ ] 会话恢复功能正常

### UI 验收
- [ ] 页面切换流畅
- [ ] 左右列比例协调（1:3）
- [ ] 与现有设计风格一致
- [ ] 所有图标使用 SVG（Lucide）

### 技术验收
- [ ] TypeScript 类型完整
- [ ] 无 console 错误
- [ ] 响应式布局正常
- [ ] 向后兼容保留

---

## 八、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 页面切换性能 | 中 | 使用条件渲染优化 |
| MCP 集成复杂度 | 中 | 分阶段实现，先配置后集成 |
| UI 一致性 | 低 | 遵循现有设计系统 |
| 向后兼容 | 低 | 保留模态框入口 |

---

**预估工作量**: 3-5 天
**建议优先级**: 先实现基础架构 + API 设置 + MCP 功能，其他区域可后续迭代

---

**作者**: Alan, Muprprpr
**创建日期**: 2026-01-21
**许可证**: AGCPA v3.0
