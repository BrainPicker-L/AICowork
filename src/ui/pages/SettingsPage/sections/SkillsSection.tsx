/**
 * Skills 管理区域 - 支持程序脚本编辑和右侧预览
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { SkillConfig } from "../../../electron.d";

type ViewMode = 'list' | 'create';

// 脚本类型定义
type ScriptType = 'none' | 'javascript' | 'python';

export function SkillsSection() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [skills, setSkills] = useState<SkillConfig[]>([]);
  const [loading, setLoading] = useState(false);

  // 创建技能表单状态
  const [skillName, setSkillName] = useState('');
  const [skillDescription, setSkillDescription] = useState('');
  const [skillPrompt, setSkillPrompt] = useState('');
  const [scriptType, setScriptType] = useState<ScriptType>('none');
  const [scriptContent, setScriptContent] = useState('');
  const [scriptPath, setScriptPath] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 预览状态
  const [showPreview, setShowPreview] = useState(true);

  // 加载技能列表
  const loadSkills = async () => {
    setLoading(true);
    try {
      const skillsList = await window.electron.getSkillsList();
      setSkills(skillsList);
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  // 自动清除成功提示
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // 生成预览数据
  const previewData = {
    name: skillName.trim() || 'my-skill',
    description: skillDescription.trim() || '技能描述',
    prompt: skillPrompt.trim() || '技能指导内容...',
    script: scriptType !== 'none' ? {
      type: scriptType,
      content: scriptContent.trim() || '// 脚本内容',
      path: scriptPath.trim() || undefined,
    } : undefined,
  };

  // 创建技能
  const handleCreateSkill = async () => {
    // 验证输入
    if (!skillName.trim()) {
      setError('技能名称不能为空');
      return;
    }
    // 验证技能名称格式（与后端保持一致）
    const nameRegex = /^[a-zA-Z0-9_-]{1,64}$/;
    if (!nameRegex.test(skillName.trim())) {
      setError('技能名称只能包含字母、数字、连字符和下划线，长度1-64字符');
      return;
    }
    if (!skillDescription.trim()) {
      setError('技能描述不能为空');
      return;
    }
    if (!skillPrompt.trim()) {
      setError('技能指导不能为空');
      return;
    }

    // 如果选择了脚本类型，验证脚本内容
    if (scriptType !== 'none' && !scriptContent.trim() && !scriptPath.trim()) {
      setError('请提供脚本内容或脚本路径');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const skillConfig: {
        name: string;
        description: string;
        prompt: string;
        script?: { type: 'javascript' | 'python'; content?: string; path?: string };
      } = {
        name: skillName.trim(),
        description: skillDescription.trim(),
        prompt: skillPrompt.trim(),
      };

      if (scriptType !== 'none') {
        skillConfig.script = {
          type: scriptType,
          content: scriptContent.trim() || undefined,
          path: scriptPath.trim() || undefined,
        };
      }

      const result = await window.electron.createSkill(skillConfig);

      if (result.success) {
        setSuccess(true);
        // 重置表单
        setSkillName('');
        setSkillDescription('');
        setSkillPrompt('');
        setScriptType('none');
        setScriptContent('');
        setScriptPath('');
        // 重新加载列表
        await loadSkills();
      } else {
        setError(result.error || '创建技能失败');
      }
    } catch (err) {
      setError('创建技能失败');
    } finally {
      setSaving(false);
    }
  };

  // 删除技能
  const handleDeleteSkill = async (skillName: string) => {
    if (!confirm(`确定要删除技能 "${skillName}" 吗？`)) {
      return;
    }

    try {
      const result = await window.electron.deleteSkill(skillName);
      if (result.success) {
        await loadSkills();
      } else {
        setError(result.error || '删除技能失败');
      }
    } catch (err) {
      setError('删除技能失败');
    }
  };

  // 打开技能目录
  const handleOpenDirectory = async () => {
    try {
      const result = await window.electron.openSkillsDirectory();
      if (!result.success) {
        console.error('Failed to open skills directory:', result.error);
      }
    } catch (error) {
      console.error('Error opening skills directory:', error);
    }
  };

  // 代码示例模板
  const getCodeTemplate = (type: ScriptType): string => {
    switch (type) {
      case 'javascript':
        return `/**
 * 技能脚本示例
 * 可用于处理复杂逻辑或与外部服务交互
 */

async function execute(input) {
  // input 包含用户输入和上下文
  console.log('Executing skill with input:', input);

  // 在这里实现你的逻辑
  const result = {
    success: true,
    data: '处理结果',
  };

  return result;
}

module.exports = { execute };
`;
      case 'python':
        return `"""
技能脚本示例
可用于处理复杂逻辑或与外部服务交互
"""

import json
from typing import Dict, Any

def execute(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    执行技能逻辑
    """
    # input_data 包含用户输入和上下文
    print(f'Executing skill with input: {input_data}')

    # 在这里实现你的逻辑
    result = {
        'success': True,
        'data': '处理结果',
    }

    return result

if __name__ == '__main__':
    # 测试代码
    test_input = {'test': True}
    print(execute(test_input))
`;
      default:
        return '';
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">{t('skills.title')}</h1>
        <p className="mt-2 text-sm text-muted">
          {t('skills.description')}
        </p>
      </header>

      {viewMode === 'create' ? (
        // 创建技能表单 - 左右分栏，中间分隔线
        <div className="flex">
          {/* 左侧：表单编辑区 - 占50% */}
          <div className="w-1/2 pr-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted">技能名称</label>
              <input
                type="text"
                className="w-full rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                placeholder="my-skill"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
              />
              <p className="text-xs text-muted-light">只能包含字母、数字、连字符和下划线</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted">技能描述</label>
              <input
                type="text"
                className="w-full rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                placeholder="这个技能的功能是什么..."
                value={skillDescription}
                onChange={(e) => setSkillDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted">技能指导</label>
              <textarea
                className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors min-h-[120px] resize-y"
                placeholder="描述 AI 如何执行这个技能..."
                value={skillPrompt}
                onChange={(e) => setSkillPrompt(e.target.value)}
              />
            </div>

            {/* 程序脚本配置 */}
            <div className="p-4 rounded-xl border border-ink-900/10 bg-surface-secondary space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted">程序脚本（可选）</label>
                <select
                  className="text-xs rounded-lg border border-ink-900/10 bg-surface px-3 py-1.5 text-ink-800 focus:border-accent focus:outline-none"
                  value={scriptType}
                  onChange={(e) => {
                    const newType = e.target.value as ScriptType;
                    setScriptType(newType);
                    if (newType !== 'none' && !scriptContent) {
                      setScriptContent(getCodeTemplate(newType));
                    }
                  }}
                >
                  <option value="none">无脚本</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                </select>
              </div>

              {scriptType !== 'none' && (
                <>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-muted">脚本内容</label>
                    <textarea
                      className="rounded-xl border border-ink-900/10 bg-surface px-3 py-2 text-xs font-mono text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors min-h-[150px] resize-y font-mono"
                      placeholder={`// ${scriptType} 脚本内容...`}
                      value={scriptContent}
                      onChange={(e) => setScriptContent(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-muted">脚本路径（可选）</label>
                    <input
                      type="text"
                      className="rounded-xl border border-ink-900/10 bg-surface px-3 py-2 text-xs text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                      placeholder="/path/to/script.js"
                      value={scriptPath}
                      onChange={(e) => setScriptPath(e.target.value)}
                    />
                    <p className="text-xs text-muted-light">如果提供，将优先使用指定路径的脚本文件</p>
                  </div>
                </>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-error/20 bg-error-light px-4 py-2.5 text-sm text-error">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-success/20 bg-success-light px-4 py-2.5 text-sm text-success">
                技能创建成功
              </div>
            )}

            <div className="flex gap-3">
              <button
                className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleCreateSkill}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存技能'}
              </button>
              <button
                className="rounded-xl border border-ink-900/10 bg-surface px-4 py-2.5 text-sm text-ink-700 hover:bg-surface-tertiary transition-colors"
                onClick={() => setViewMode('list')}
              >
                取消
              </button>
            </div>
          </div>

          {/* 右侧：预览面板 - 占50% */}
          <div className="w-1/2 pl-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
            <div className="sticky top-0 space-y-6">
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-sm font-medium text-ink-900">配置预览</h3>
                <button
                  className="text-xs text-muted hover:text-accent"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? '隐藏' : '显示'}
                </button>
              </div>

              {showPreview && (
                <div className="space-y-6">
                  {/* 技能文档预览 */}
                  <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-6">
                    <h4 className="text-sm font-medium text-ink-900 mb-4">技能文档预览</h4>
                    <div className="bg-surface rounded-lg p-5 overflow-x-auto">
                      <pre className="text-xs text-ink-800 whitespace-pre-wrap font-sans leading-relaxed">
{`# ${previewData.name}

## 描述
${previewData.description}

## 指导内容
${previewData.prompt}
${previewData.script ? `
## 脚本说明
- 类型: ${previewData.script.type}
- 脚本将作为该技能的程序化扩展执行
` : ''}`}
                      </pre>
                    </div>
                  </div>

                  {/* 代码效果预览 */}
                  {previewData.script && (
                    <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-6">
                      <h4 className="text-sm font-medium text-ink-900 mb-4">代码效果预览</h4>
                      <div className="bg-surface rounded-lg p-5 overflow-x-auto">
                        <pre className="text-xs text-ink-800 whitespace-pre-wrap font-mono leading-relaxed">
{previewData.script.content}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* JSON 配置 */}
                  <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-6">
                    <h4 className="text-sm font-medium text-ink-900 mb-4">JSON 配置</h4>
                    <pre className="text-xs bg-surface rounded-lg p-4 overflow-x-auto text-muted leading-relaxed">
                      {JSON.stringify(previewData, null, 2)}
                    </pre>
                  </div>

                  {/* 文件结构 */}
                  <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-6">
                    <h4 className="text-sm font-medium text-ink-900 mb-4">文件结构</h4>
                    <div className="text-xs bg-surface rounded-lg p-4 font-mono leading-relaxed">
                      <div className="text-accent">📁 skills/</div>
                      <div className="ml-6 text-muted">├── 📄 {previewData.name}.md</div>
                      {previewData.script && (
                        <>
                          <div className="ml-6 text-muted">└── 📄 {previewData.name}.{previewData.script.type === 'javascript' ? 'js' : 'py'}</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 使用示例 */}
                  <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-6">
                    <h4 className="text-sm font-medium text-ink-900 mb-4">使用示例</h4>
                    <div className="text-xs bg-surface rounded-lg p-4">
                      <p className="text-muted mb-3">在对话中触发：</p>
                      <code className="text-accent text-sm">
                        /{previewData.name}
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // 技能列表
        <>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg aria-hidden="true" className="w-6 h-6 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : skills.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted">暂无已创建的技能</p>
              <p className="text-xs text-muted mt-2">
                点击下方"创建新技能"按钮开始
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {skills.map((skill) => (
                <div key={skill.name} className="p-4 rounded-xl border border-ink-900/10 bg-surface">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-ink-900">{skill.name}</h3>
                        {skill.script && (
                          <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent">
                            {skill.script.type}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted line-clamp-2">{skill.description}</p>
                      {skill.script?.path && (
                        <p className="mt-1 text-xs text-muted-light font-mono">{skill.script.path}</p>
                      )}
                    </div>
                    <button
                      className="text-xs text-muted hover:text-error p-1"
                      onClick={() => handleDeleteSkill(skill.name)}
                      title="删除技能"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              className="flex-1 py-3 rounded-xl bg-accent text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors"
              onClick={() => setViewMode('create')}
            >
              创建新技能
            </button>
            <button
              className="py-3 px-6 rounded-xl border border-ink-900/10 bg-surface text-sm text-muted hover:bg-surface-tertiary hover:text-ink-700 transition-colors"
              onClick={handleOpenDirectory}
            >
              打开目录
            </button>
          </div>

          <aside className="p-4 rounded-xl bg-surface-secondary border border-ink-900/5">
            <p className="text-xs text-muted">
              <strong>提示：</strong>技能支持纯文本指导或程序脚本。程序脚本可以处理复杂逻辑，支持 JavaScript 和 Python。
            </p>
          </aside>
        </>
      )}
    </section>
  );
}
