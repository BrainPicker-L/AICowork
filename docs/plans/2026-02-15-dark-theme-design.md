# DtazziCowork 暗色主题设计方案

> 日期：2026-02-15
> 状态：待实现

## 1. 决策摘要

| 决策项 | 选择 | 说明 |
|--------|------|------|
| 用户控制方式 | 三选一（系统 / 暗色 / 亮色） | 设置页手动选择，默认跟随系统 |
| CSS 变量策略 | 基于现有 `index.css` 扩展 | 不迁移到 shadcn 体系，组件零改动 |
| CSS 切换机制 | `prefers-color-scheme` 媒体查询 | 由 Electron `nativeTheme.themeSource` 驱动 |
| 配色风格 | Claude 官方暖灰风格 | 不用纯黑，暖灰色调搭配橙色 accent |

## 2. 架构

### 数据流

```
用户选择 (DisplaySection UI)
  → IPC invoke: set-theme("dark")
  → 主进程: nativeTheme.themeSource = "dark"
  → Chromium 自动更新 prefers-color-scheme
  → CSS @media (prefers-color-scheme: dark) 生效
  → 所有 CSS 变量切换为暗色值
  → 同时持久化到 theme-preference.json
```

### 启动流程

```
app.ready
  → loadThemePreference()  // 读取 theme-preference.json
  → nativeTheme.themeSource = savedValue  // 在创建窗口前设置
  → createMainWindow()  // 窗口创建时已经是正确的主题
```

## 3. 文件改动清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/electron/storage/theme-store.ts` | 主题偏好持久化（~30 行） |

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/ui/index.css` | 新增 `@media (prefers-color-scheme: dark)` 暗色变量块；切换 highlight.js 主题；暗色滚动条 |
| `src/ui/pages/SettingsPage/sections/DisplaySection.tsx` | 新增主题三选一卡片 UI |
| `src/electron/main.ts` | `app.ready` 中读取并应用主题偏好 |
| `src/electron/preload.cts` | 新增 `get-theme` / `set-theme` IPC 通道 |
| `src/electron/main/ipc-registry.ts` | 注册主题相关 IPC handler |

### 无需修改

所有组件文件。组件已使用 `bg-surface`、`text-ink-900` 等语义化 Tailwind 类名，CSS 变量切换后自动生效。

## 4. 暗色配色表

基于 Claude 官方暖灰风格，对现有 `index.css` 中每个变量定义暗色值：

### Surface 颜色

| 变量 | 亮色值 | 暗色值 | 说明 |
|------|--------|--------|------|
| `--color-surface` | `#FFFFFF` | `#1A1915` | 主背景 - 深暖灰 |
| `--color-surface-secondary` | `#F5F4F1` | `#242320` | 次级面板 |
| `--color-surface-tertiary` | `#EFEEE9` | `#2D2C28` | 卡片/hover |
| `--color-surface-cream` | `#FAF9F6` | `#1F1E1A` | 奶油色 → 深暖灰 |

### Ink 颜色（文字）

| 变量 | 亮色值 | 暗色值 | 说明 |
|------|--------|--------|------|
| `--color-ink-900` | `#1A1915` | `#F5F4F1` | 主文字 - 近白 |
| `--color-ink-800` | `#2D2D2A` | `#E5E4DF` | 次级文字 |
| `--color-ink-700` | `#4A4A45` | `#B8B7B2` | 三级文字 |
| `--color-ink-600` | `#666661` | `#8A8985` | 辅助文字 |
| `--color-ink-500` | `#7A7A75` | `#6E6D69` | 弱化文字 |
| `--color-ink-400` | `#9B9B96` | `#555450` | 最弱文字 |

### Muted 颜色

| 变量 | 亮色值 | 暗色值 |
|------|--------|--------|
| `--color-muted` | `#6B6B66` | `#8A8985` |
| `--color-muted-light` | `#9B9B96` | `#6E6D69` |

### Accent 颜色（Claude 橙）

| 变量 | 亮色值 | 暗色值 | 说明 |
|------|--------|--------|------|
| `--color-accent` | `#D97757` | `#E08A6D` | 稍微提亮增强可见度 |
| `--color-accent-hover` | `#CC785C` | `#D9977E` | hover 态 |
| `--color-accent-light` | `#F5D0C5` | `#3D2A22` | 浅橙 → 深橙背景 |
| `--color-accent-subtle` | `#FDF4F1` | `#2A1F1A` | 极浅 → 极深橙背景 |

### Status 颜色

| 变量 | 亮色值 | 暗色值 |
|------|--------|--------|
| `--color-error` | `#DC2626` | `#F87171` |
| `--color-error-light` | `#FEE2E2` | `#3B1515` |
| `--color-success` | `#16A34A` | `#4ADE80` |
| `--color-success-light` | `#DCFCE7` | `#0D2818` |
| `--color-info` | `#2563EB` | `#60A5FA` |
| `--color-info-light` | `#DBEAFE` | `#1A2744` |

### Background 颜色

| 变量 | 亮色值 | 暗色值 | 说明 |
|------|--------|--------|------|
| `--color-bg-000` | `#FFFFFF` | `#131210` | 最深底层 |
| `--color-bg-100` | `#FAF9F6` | `#1A1915` | 主背景 |
| `--color-bg-200` | `#F5F4F1` | `#242320` | 面板 |
| `--color-bg-300` | `#EFEEE9` | `#2D2C28` | 卡片 |
| `--color-bg-400` | `#E5E4DF` | `#373630` | 边框/分隔线 |

### Shadow

| 变量 | 亮色值 | 暗色值 |
|------|--------|--------|
| `--shadow-soft` | `0 1px 2px rgba(0,0,0,0.05)` | `0 1px 2px rgba(0,0,0,0.2)` |
| `--shadow-card` | `0 4px 16px rgba(0,0,0,0.08)` | `0 4px 16px rgba(0,0,0,0.3)` |
| `--shadow-elevated` | `0 8px 32px rgba(0,0,0,0.12)` | `0 8px 32px rgba(0,0,0,0.4)` |

## 5. 设置 UI

在 `DisplaySection` 现有开关上方新增主题选择器，三个横排卡片：

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   ☀️          │  │   🌙          │  │   💻          │
│   亮色        │  │   暗色        │  │   跟随系统     │
│  ┌────────┐  │  │  ┌────────┐  │  │  ┌────────┐  │
│  │ 亮色预览 │  │  │ 暗色预览 │  │  │ 半亮半暗  │  │
│  └────────┘  │  │  └────────┘  │  │  └────────┘  │
└──────────────┘  └──────────────┘  └──────────────┘
```

- 选中状态：`accent` 色 2px 边框 + 浅橙背景
- 未选中：普通 `border-ink-900/10` 边框
- 默认值：`system`
- 预览色块用纯 CSS div 表示（surface 色背景 + ink 色文字条）

## 6. 代码高亮

同时引入亮色和暗色 highlight.js 主题，通过 CSS import 媒体查询自动切换：

```css
@import "highlight.js/styles/github.css" (prefers-color-scheme: light);
@import "highlight.js/styles/github-dark.css" (prefers-color-scheme: dark);
```

## 7. 滚动条

```css
@media (prefers-color-scheme: dark) {
  ::-webkit-scrollbar-thumb { background: #4A4A45; }
  ::-webkit-scrollbar-thumb:hover { background: #6E6D69; }
}
```

## 8. IPC 协议

### `get-theme`

- 方向：renderer → main
- 参数：无
- 返回：`"system" | "dark" | "light"`

### `set-theme`

- 方向：renderer → main
- 参数：`theme: "system" | "dark" | "light"`
- 行为：保存偏好到文件 + 设置 `nativeTheme.themeSource` + 即时生效
- 返回：`void`

## 9. 持久化

文件：`{userData}/theme-preference.json`

```json
{
  "theme": "system"
}
```

复用现有 `config-store.ts` 的文件存取模式（`app.getPath("userData")`）。

## 10. 实现顺序

1. `theme-store.ts` — 持久化层
2. `main.ts` + IPC — 主进程集成
3. `index.css` — 暗色变量 + 高亮 + 滚动条
4. `DisplaySection.tsx` — 设置 UI
5. 端到端测试验证
