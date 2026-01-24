/**
 * Rules 规则管理区域
 * 管理项目自定义规则文件（.claude/rules/）
 */

import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";

// 规则文件接口
interface RuleFile {
  name: string;
  path: string;
  content: string;
  language: string;
  modified: number;
}

// 预置规则模板
const RULE_TEMPLATES = [
  {
    name: 'language.md',
    description: '语言规则 - 定义代码注释和沟通语言',
    content: `# 语言规则

## 代码注释
- 所有代码注释使用简体中文
- 变量和函数名使用英文

## 沟通语言
- 自动检测用户语言，使用用户当前语言
- 技术术语保持原文
`,
    language: 'markdown'
  },
  {
    name: 'coding-style.md',
    description: '编码风格 - 定义代码格式化和风格规范',
    content: `# 编码风格

## JavaScript/TypeScript
- 使用 2 空格缩进
- 使用单引号
- 使用分号

## Python
- 使用 4 空格缩进
- 遵循 PEP 8 规范
`,
    language: 'markdown'
  },
  {
    name: 'git-commit.md',
    description: 'Git 提交规则 - 定义提交信息格式',
    content: `# Git 提交规则

## 提交信息格式
\`\`
<类型>(<范围>): <主题>

<详细说明>
\`\`

## 类型说明
- feat: 新功能
- fix: Bug 修复
- docs: 文档变更
- refactor: 重构
`,
    language: 'markdown'
  }
];

export function RulesSection() {
  const [rules, setRules] = useState<RuleFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRule, setSelectedRule] = useState<RuleFile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  // 加载规则列表
  const loadRules = async () => {
    setLoading(true);
    try {
      const result = await window.electron.getRulesList();
      if (result.success && result.rules) {
        setRules(result.rules);
      }
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  // 选择规则进行编辑
  const handleSelectRule = async (rule: RuleFile) => {
    setSelectedRule(rule);
    setEditContent(rule.content);
    setEditing(false);
  };

  // 保存规则
  const handleSaveRule = async () => {
    if (!selectedRule) return;

    setSaving(true);
    try {
      const result = await window.electron.saveRule(selectedRule.path, editContent);
      if (result.success) {
        setEditing(false);
        setSelectedRule({ ...selectedRule, content: editContent });
        loadRules();
      } else {
        alert(result.error || '保存失败');
      }
    } catch (err) {
      console.error('Failed to save rule:', err);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 创建新规则
  const handleCreateRule = async () => {
    // 使用简单的默认文件名，避免 prompt() 在 Electron 中的问题
    const timestamp = Date.now();
    const defaultName = `rule-${timestamp}.md`;

    try {
      const result = await window.electron.createRule(defaultName, '# 新规则\n\n请在此添加规则内容...');
      if (result.success) {
        await loadRules();
        if (result.path) {
          // 自动选中新创建的规则
          const newRule = {
            name: defaultName,
            path: result.path,
            content: '# 新规则\n\n请在此添加规则内容...',
            language: 'markdown',
            modified: Date.now()
          };
          handleSelectRule(newRule);
        }
      } else {
        alert(result.error || '创建失败');
      }
    } catch (err) {
      console.error('Failed to create rule:', err);
      alert('创建失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  // 删除规则
  const handleDeleteRule = async (rule: RuleFile) => {
    if (!confirm(`确定要删除规则 "${rule.name}" 吗？`)) {
      return;
    }

    try {
      const result = await window.electron.deleteRule(rule.path);
      if (result.success) {
        if (selectedRule?.path === rule.path) {
          setSelectedRule(null);
        }
        loadRules();
      } else {
        alert(result.error || '删除失败');
      }
    } catch (err) {
      console.error('Failed to delete rule:', err);
      alert('删除失败');
    }
  };

  // 从模板创建
  const handleCreateFromTemplate = async (template: typeof RULE_TEMPLATES[0]) => {
    try {
      const result = await window.electron.createRule(template.name, template.content);
      if (result.success) {
        loadRules();
      } else {
        alert(result.error || '创建失败');
      }
    } catch (err) {
      console.error('Failed to create rule from template:', err);
      alert('创建失败');
    }
  };

  return (
    <TooltipProvider>
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">规则管理</h1>
        <p className="mt-2 text-sm text-muted">
          管理项目自定义规则文件（.claude/rules/），用于控制 AI 行为和代码风格
        </p>
      </header>

      <div className="flex gap-6">
        {/* 左侧：规则列表 - 占40% */}
        <div className="w-2/5 space-y-4">
          <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink-900">规则文件 ({rules.length})</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-sm px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors shadow-soft cursor-pointer"
                onClick={handleCreateRule}
              >
                + 新建
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
              创建新的规则文件
            </TooltipContent>
          </Tooltip>
        </div>

          {/* 从模板创建 */}
          <div className="space-y-2">
            <p className="text-xs text-muted">从模板创建：</p>
            <div className="flex flex-wrap gap-2">
              {RULE_TEMPLATES.map((template) => (
                <Tooltip key={template.name}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-sm px-4 py-2 rounded-lg border border-ink-900/10 bg-surface hover:bg-surface-tertiary hover:border-accent/50 transition-colors cursor-pointer"
                      onClick={() => handleCreateFromTemplate(template)}
                    >
                      {template.name}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                    {template.description}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* 规则列表 */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <svg aria-hidden="true" className="w-6 h-6 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted">暂无规则文件</p>
                <p className="text-xs text-muted mt-2">点击"新建"或使用模板创建</p>
              </div>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.path}
                  className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedRule?.path === rule.path
                      ? 'border-accent/50 bg-accent/5'
                      : 'border-ink-900/10 hover:border-ink-900/20 hover:bg-surface-tertiary'
                  }`}
                  onClick={() => handleSelectRule(rule)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-ink-900 truncate">{rule.name}</h3>
                      <p className="text-xs text-muted-light mt-0.5">
                        {new Date(rule.modified).toLocaleString()}
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-xs text-muted hover:text-error p-1 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRule(rule);
                          }}
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                        删除规则文件
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右侧：编辑区 - 占60% */}
        <div className="w-3/5 space-y-4">
          {!selectedRule ? (
            <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-ink-900/10 bg-surface p-12">
              <div className="text-center">
                <p className="text-sm text-muted">选择一个规则文件进行编辑</p>
                <p className="text-xs text-muted mt-2">或创建新的规则文件</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-ink-900">{selectedRule.name}</h2>
                <div className="flex gap-2">
                  {!editing ? (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-xs px-3 py-1.5 rounded-lg border border-ink-900/10 bg-surface hover:bg-surface-tertiary transition-colors cursor-pointer"
                            onClick={() => setEditing(true)}
                          >
                            编辑
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                          开始编辑规则文件
                        </TooltipContent>
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-xs px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
                            onClick={handleSaveRule}
                            disabled={saving}
                          >
                            {saving ? '保存中...' : '保存'}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                          {saving ? '保存中...' : '保存规则文件'}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-xs px-3 py-1.5 rounded-lg border border-ink-900/10 bg-surface hover:bg-surface-tertiary transition-colors cursor-pointer"
                            onClick={() => {
                              setEditing(false);
                              setEditContent(selectedRule.content);
                            }}
                          >
                            取消
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                          取消编辑，恢复原始内容
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>
              </div>

              {/* 编辑器 */}
              <div className="rounded-xl border border-ink-900/10 bg-surface p-4">
                {!editing ? (
                  <pre className="text-xs text-ink-700 whitespace-pre-wrap break-words font-mono leading-relaxed max-h-[500px] overflow-y-auto">
                    {selectedRule.content}
                  </pre>
                ) : (
                  <textarea
                    className="w-full h-[500px] rounded-lg border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 font-mono resize-none focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="输入规则内容（支持 Markdown 格式）..."
                  />
                )}
              </div>

              {/* 规则说明 */}
              <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4">
                <h4 className="text-xs font-medium text-muted mb-2">规则说明</h4>
                <div className="text-xs text-ink-700 space-y-2 leading-relaxed">
                  <p>• <strong>规则位置：</strong>.claude/rules/ 目录</p>
                  <p>• <strong>文件格式：</strong>Markdown (.md)</p>
                  <p>• <strong>作用范围：</strong>影响 AI 在该项目中的行为和输出</p>
                  <p>• <strong>常用规则：</strong>语言风格、编码规范、Git 提交格式等</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
    </TooltipProvider>
  );
}
