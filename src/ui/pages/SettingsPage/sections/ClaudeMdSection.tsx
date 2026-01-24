/**
 * Claude.md 配置管理区域
 * 管理项目级别的 CLAUDE.md 配置文件
 */

import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";

// Claude.md 配置接口
interface ClaudeConfig {
  path: string;
  content: string;
  exists: boolean;
  modified?: number;
}

// 预设模板
const CLAUDE_MD_TEMPLATES = [
  {
    name: '基础配置',
    description: '包含项目基本信息和开发者配置',
    content: `# Claude Code 项目配置

> **配置级别**: 项目级 (\`PROJECT/.claude/\`)
> **作用域**: 当前项目的所有任务
> **加载优先级**: 企业级 → 项目级 → **用户级(本文件)**
> **核心作用**: 为 Claude Code 提供跨项目的通用开发规范和工作原则

## 一、开发者画像

### 基本信息
- **身份**: 全栈开发者、技术创作者
- **工作模式**: 夜间高强度使用（22:00-23:00 高峰期）

### 技术栈
- **前端**: React, Vue, TypeScript, Tailwind CSS
- **后端**: Node.js (Express, Fastify), Python (FastAPI)
- **数据库**: PostgreSQL, MongoDB, Redis

## 二、AI 行为指导

### 核心原则
1. **思考优先** - 执行前先说明，重要修改先给方案等待确认
2. **代码优先** - 优先编辑现有文件
3. **简洁明确** - 避免过度设计
4. **安全第一** - 输入验证、输出转义

### 编码规范
- TypeScript: 2 空格缩进，严格模式
- Python: 4 空格缩进，PEP 8 规范
- Git: 使用中文提交信息
`,
  },
  {
    name: '前端项目',
    description: '前端开发项目的专用配置',
    content: `# 前端项目配置

## 技术栈
- React 19 + TypeScript
- Tailwind CSS 4.x
- Vite 构建工具

## 代码规范
- 组件使用 PascalCase
- hooks 使用 camelCase
- 常量使用 UPPER_SNAKE_CASE
- 文件名使用 kebab-case

## Git 工作流
- feature/* - 功能分支
- bugfix/* - 修复分支
- hotfix/* - 紧急修复
`,
  },
  {
    name: '后端项目',
    description: '后端开发项目的专用配置',
    content: `# 后端项目配置

## 技术栈
- Node.js + Express/Fastify
- Python + FastAPI
- PostgreSQL + Redis

## 代码规范
- 路由使用 kebab-case
- 中间件使用 camelCase
- 数据库模型使用 PascalCase

## API 设计
- RESTful 风格
- 统一错误处理
- API 版本控制
`,
  },
];

export function ClaudeMdSection() {
  const [config, setConfig] = useState<ClaudeConfig | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

  // 加载配置
  const loadConfig = async () => {
    try {
      const result = await window.electron.getClaudeConfig();
      if (result.success && result.config) {
        setConfig(result.config);
        setEditContent(result.config.content || '');
      }
    } catch (err) {
      console.error('Failed to load Claude config:', err);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // 保存配置
  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await window.electron.saveClaudeConfig(editContent);
      if (result.success) {
        setEditing(false);
        loadConfig();
      } else {
        alert(result.error || '保存失败');
      }
    } catch (err) {
      console.error('Failed to save config:', err);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 从模板创建
  const handleUseTemplate = (template: typeof CLAUDE_MD_TEMPLATES[0]) => {
    setEditContent(template.content);
    setEditing(true);
    setShowTemplate(false);
  };

  // 重置为默认
  const handleReset = async () => {
    if (!confirm('确定要重置为默认模板吗？当前内容将被覆盖。')) {
      return;
    }
    setEditContent(CLAUDE_MD_TEMPLATES[0].content);
    setEditing(true);
  };

  // 删除配置文件
  const handleDelete = async () => {
    if (!config?.exists) return;
    if (!confirm('确定要删除 CLAUDE.md 配置文件吗？')) {
      return;
    }

    try {
      const result = await window.electron.deleteClaudeConfig();
      if (result.success) {
        loadConfig();
        setEditing(false);
      } else {
        alert(result.error || '删除失败');
      }
    } catch (err) {
      console.error('Failed to delete config:', err);
      alert('删除失败');
    }
  };

  return (
    <TooltipProvider>
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Claude.md 配置</h1>
          <p className="mt-2 text-sm text-muted">
            管理项目级别的 Claude Code 配置文件（PROJECT/.claude/CLAUDE.md）
          </p>
        </div>
        {config?.modified && (
          <span className="text-xs text-muted">
            最后更新: {new Date(config.modified).toLocaleString()}
          </span>
        )}
      </header>

      <div className="flex gap-6">
        {/* 左侧：配置编辑 - 占50% */}
        <div className="w-1/2 space-y-4">
          {/* 操作按钮 */}
          <div className="flex gap-2">
            {config?.exists && !editing && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="text-xs px-3 py-1.5 rounded-lg border border-ink-900/10 bg-surface hover:bg-surface-tertiary transition-colors cursor-pointer"
                    onClick={() => setEditing(true)}
                  >
                    编辑
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                  开始编辑Claude.md配置文件
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-ink-900/10 text-muted hover:border-accent/50 hover:text-accent transition-colors cursor-pointer"
                  onClick={() => setShowTemplate(!showTemplate)}
                >
                  {showTemplate ? '关闭模板' : '使用模板'}
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                {showTemplate ? '关闭模板选择' : '选择模板创建配置'}
              </TooltipContent>
            </Tooltip>
            {config?.exists && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="text-xs px-3 py-1.5 rounded-lg border border-ink-900/10 text-muted hover:text-error hover:border-error/50 transition-colors cursor-pointer"
                    onClick={handleDelete}
                  >
                    删除
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                  删除Claude.md配置文件
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* 模板选择 */}
          {showTemplate && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted">选择模板：</p>
              <div className="grid gap-2">
                {CLAUDE_MD_TEMPLATES.map((template) => (
                <Tooltip key={template.name}>
                  <TooltipTrigger asChild>
                    <button
                      className="w-full text-left p-3 rounded-xl border border-ink-900/10 bg-surface hover:border-accent/50 hover:bg-accent/5 transition-colors cursor-pointer"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <div className="text-sm font-medium text-ink-900">{template.name}</div>
                      <p className="text-xs text-muted mt-1">{template.description}</p>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                    使用{template.name}模板创建配置
                  </TooltipContent>
                </Tooltip>
              ))}
              </div>
            </div>
          )}

          {/* 编辑器 */}
          <div className="rounded-xl border border-ink-900/10 bg-surface p-4">
            {!editing && !config?.content ? (
              <div className="h-[400px] flex items-center justify-center text-center">
                <div>
                  <p className="text-sm text-muted">CLAUDE.md 文件不存在</p>
                  <p className="text-xs text-muted mt-2">选择模板创建或手动编辑</p>
                </div>
              </div>
            ) : (
              <>
                {editing ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full h-[400px] rounded-lg border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 font-mono resize-y focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="输入 Claude.md 配置内容（支持 Markdown 格式）..."
                    />
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="flex-1 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
                            onClick={handleSave}
                            disabled={saving || !editContent.trim()}
                          >
                            {saving ? '保存中...' : '保存'}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                          {saving ? '保存中...' : '保存Claude.md配置'}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="rounded-xl border border-ink-900/10 bg-surface px-4 py-2 text-sm text-ink-700 hover:bg-surface-tertiary transition-colors cursor-pointer"
                            onClick={() => {
                              setEditing(false);
                              setEditContent(config?.content || '');
                            }}
                          >
                            取消
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                          取消编辑，恢复原始内容
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="rounded-xl border border-ink-900/10 bg-surface px-4 py-2 text-sm text-muted hover:text-accent hover:border-accent/50 transition-colors cursor-pointer"
                            onClick={handleReset}
                          >
                            重置
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                          重置为默认模板
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ) : (
                  <pre className="text-xs text-ink-700 whitespace-pre-wrap break-words font-mono leading-relaxed h-[400px] overflow-y-auto">
                    {config?.content || ''}
                  </pre>
                )}
              </>
            )}
          </div>

          {/* 配置说明 */}
          <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4">
            <h4 className="text-xs font-medium text-muted mb-2">配置说明</h4>
            <div className="text-xs text-ink-700 space-y-2 leading-relaxed">
              <p>• <strong>文件位置：</strong>PROJECT/.claude/CLAUDE.md</p>
              <p>• <strong>加载优先级：</strong>企业级 → 项目级 → 用户级</p>
              <p>• <strong>适用范围：</strong>当前项目的所有任务</p>
              <p>• <strong>常用配置：</strong>开发者画像、编码规范、AI 行为指导等</p>
            </div>
          </div>
        </div>

        {/* 右侧：配置预览和说明 - 占50% */}
        <div className="w-1/2 space-y-4">
          {/* 配置状态 */}
          <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4">
            <h3 className="text-sm font-medium text-ink-900 mb-3">配置状态</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">文件状态</span>
                <span className={`text-xs font-medium ${config?.exists ? 'text-success' : 'text-muted'}`}>
                  {config?.exists ? '✓ 已存在' : '✗ 未创建'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">文件大小</span>
                <span className="text-xs font-medium text-ink-700">
                  {config?.content ? `${(config.content.length / 1024).toFixed(2)} KB` : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">字符数</span>
                <span className="text-xs font-medium text-ink-700">
                  {config?.content?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* 配置结构说明 */}
          <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4">
            <h3 className="text-sm font-medium text-ink-900 mb-3">配置结构示例</h3>
            <pre className="text-xs bg-surface rounded-lg p-3 overflow-x-auto text-muted font-mono leading-relaxed">
{`# Claude Code 项目配置

## 一、开发者画像
### 基本信息
- 身份: 全栈开发者
- 技术栈: React, Node.js...

## 二、AI 行为指导
### 核心原则
1. 思考优先
2. 代码优先

## 三、编码规范
### TypeScript
- 2 空格缩进
- 严格模式`}
            </pre>
          </div>

          {/* 功能说明 */}
          <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4">
            <h3 className="text-sm font-medium text-ink-900 mb-3">功能说明</h3>
            <div className="text-xs text-ink-700 space-y-2 leading-relaxed">
              <p><strong>开发者画像：</strong>定义您的角色、技能栈和工作模式</p>
              <p><strong>AI 行为指导：</strong>控制 AI 的决策过程和代码风格</p>
              <p><strong>编码规范：</strong>指定不同语言的格式化和风格要求</p>
              <p><strong>Git 工作流：</strong>定义分支策略和提交信息格式</p>
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4">
            <h3 className="text-sm font-medium text-ink-900 mb-3">快捷操作</h3>
            <div className="space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="w-full text-left px-3 py-2 rounded-lg border border-ink-900/10 bg-surface hover:bg-surface-tertiary transition-colors text-xs text-ink-700 cursor-pointer"
                    onClick={() => {
                      window.electron.openClaudeDirectory();
                    }}
                  >
                    📂 打开配置目录
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                  打开Claude配置文件所在目录
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="w-full text-left px-3 py-2 rounded-lg border border-ink-900/10 bg-surface hover:bg-surface-tertiary transition-colors text-xs text-ink-700 cursor-pointer"
                    onClick={() => {
                      setEditContent(CLAUDE_MD_TEMPLATES[0].content);
                      setEditing(true);
                    }}
                  >
                    📋 加载基础模板
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                  加载基础配置模板到编辑器
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </section>
    </TooltipProvider>
  );
}
