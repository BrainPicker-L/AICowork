# 任务计划 - Agent Cowork 功能完善与优化

## 原始请求
> 用户提出32项功能改进需求，包括翻译完善、UI优化、新功能实现等

---

## 任务分解与依赖关系

### Batch #1: 翻译修复与文案更新（无依赖，可并行执行）

| ID | 任务 | 文件 | 说明 |
|----|------|------|------|
| T-01 | 完善中文翻译 | `src/ui/i18n/locales/zh.ts` | 补充缺失的翻译键 |
| T-02 | 修复 zh-TW 显示 | `src/ui/i18n/locales/zh-TW.ts` | 修复繁体中文选项显示问题 |
| T-03 | 修复语言变量显示 | `src/ui/pages/SettingsPage/sections/LanguageSection.tsx` | 修复 language.tip 字段显示问题 |
| T-04 | 更新产品名称 | `src/ui/pages/SettingsPage/sections/AboutSection.tsx` | 改为 "AI 协作工作台——Agent Cowork！" |
| T-05 | 更新副标题 | `src/ui/i18n/locales/zh.ts` | 改为 "工作协作伙伴" |
| T-06 | 更新许可证 | `src/ui/pages/SettingsPage/sections/AboutSection.tsx` | 改为 MIT |
| T-07 | 更新帮助链接 | `src/ui/pages/SettingsPage/sections/HelpSection.tsx` | 更新为新的链接 |
| T-08 | 更新反馈链接 | `src/ui/pages/SettingsPage/sections/FeedbackSection.tsx` | 更新为新的链接 |
| T-09 | 添加其他语言翻译 | `src/ui/i18n/locales/*.ts` | 补充 de/es/fr/ja/ko/pt/ru 翻译 |

### Batch #2: UI 布局优化（无依赖，可并行执行）

| ID | 任务 | 文件 | 说明 |
|----|------|------|------|
| T-10 | 统一设置卡片宽度 | `src/ui/pages/SettingsPage/SettingsContent.tsx` | 所有设置区域使用 max-w-4xl |
| T-11 | MCP 卡片宽度统一 | `src/ui/pages/SettingsPage/sections/McpSection.tsx` | 280px 卡片宽度 |
| T-12 | 移除首页语言配置 | `src/ui/App.tsx` | 移除重复的语言设置选项 |
| T-13 | 优化按钮位置（Skills） | `src/ui/pages/SettingsPage/sections/SkillsSection.tsx` | 重新设计按钮布局 |
| T-14 | 优化按钮位置（Plugins） | `src/ui/pages/SettingsPage/sections/PluginsSection.tsx` | 添加创建按钮 |
| T-15 | 优化按钮位置（Hooks） | `src/ui/pages/SettingsPage/sections/HooksSection.tsx` | 移动按钮到列表底部 |
| T-16 | 优化按钮位置（Permissions） | `src/ui/pages/SettingsPage/sections/PermissionsSection.tsx` | 移动按钮到列表底部 |

### Batch #3: 功能增强与修复（部分依赖 Batch #2）

| ID | 任务 | 文件 | 说明 |
|----|------|------|------|
| T-17 | 修复 API 默认配置选项 | `src/ui/pages/SettingsPage/sections/ApiSection.tsx` | 恢复默认配置选项 |
| T-18 | MCP 添加测试按钮 | `src/ui/pages/SettingsPage/sections/McpSection.tsx` | 实现测试连接功能 |
| T-19 | 技能右侧预览面板 | `src/ui/pages/SettingsPage/sections/SkillsSection.tsx` | 文档+代码分两部分显示 |
| T-20 | 插件右侧编辑面板 | `src/ui/pages/SettingsPage/sections/PluginsSection.tsx` | 多插件上下编辑 |
| T-21 | 修复会话恢复刷新 | `src/ui/pages/SettingsPage/sections/RecoverySection.tsx` | 修复按钮位置和刷新功能 |
| T-22 | 会话恢复右侧浏览 | `src/ui/pages/SettingsPage/sections/RecoverySection.tsx` | 两栏布局预览 |

### Batch #4: 新功能实现（依赖 Batch #1-3）

| ID | 任务 | 文件 | 说明 |
|----|------|------|------|
| T-23 | Memory 功能实现 | `src/electron/services/memvid-service.ts`<br>`src/ui/pages/SettingsPage/sections/MemorySection.tsx` | 集成 Memvid SDK |
| T-24 | AI Agents 配置 | `src/ui/pages/SettingsPage/sections/AgentsSection.tsx`<br>`src/electron/libs/agents-store.ts` | 代理编排功能 |
| T-25 | 输出样式配置 | `src/ui/pages/SettingsPage/sections/OutputSection.tsx` | 更多格式支持 |
| T-26 | 渲染器支持 | `src/ui/components/` | SVG/Markdown/图像等 |
| T-27 | 协作模式配置 | `src/ui/pages/SettingsPage/sections/AgentsSection.tsx` | 并发/串流/交替/循环 |

### Batch #5: 测试与打包（依赖所有功能实现）

| ID | 任务 | 说明 |
|----|------|------|
| T-28 | 编写单元测试 | 测试所有新功能 |
| T-29 | 编写集成测试 | 端到端测试 |
| T-30 | 修复测试发现的 Bug | 回归测试 |
| T-31 | 最终测试 | 确保无破坏性变更 |
| T-32 | 打包项目 | 构建生产版本 |

---

## 执行顺序说明

```
Batch #1 (翻译文案) ──────┐
                           ├───> Batch #4 (新功能) ──> Batch #5 (测试打包)
Batch #2 (UI布局) ────────┤
                           │
Batch #3 (功能修复) ───────┘
```

---

## 风险与注意事项

1. **Memory 功能**：需要安装 `@memvid/sdk`，涉及后端服务集成
2. **AI Agents 功能**：需要设计编排模式的 UI 和数据结构
3. **渲染器功能**：可能需要额外的 npm 包（如 mermaid, highlight.js 等）
4. **测试覆盖**：32个改动范围很大，需要仔细回归测试

---

**@author Alan**
**@created 2026-01-21**
**@version 2.0.0**
