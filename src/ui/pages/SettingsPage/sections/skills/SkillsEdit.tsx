/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-22
 * @updated     2026-01-22
 * @Email       None
 *
 * SkillsEdit - 技能编辑组件
 * 编辑技能的名称、描述、指导内容和脚本
 */

import { useState, useEffect } from "react";
import type { SkillConfig, SkillMetadata } from "../../../../electron.d";

interface SkillsEditProps {
  skillName: string;
  onCancel: () => void;
  onSave: () => void;
}

export function SkillsEdit({ skillName, onCancel, onSave }: SkillsEditProps) {
  const [skill, setSkill] = useState<SkillConfig | null>(null);
  const [metadata, setMetadata] = useState<SkillMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 表单状态
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  // 脚本相关暂未实现
  // const [scriptType, setScriptType] = useState<ScriptType>('none');
  // const [scriptContent, setScriptContent] = useState('');

  // 加载技能详情
  useEffect(() => {
    const loadSkill = async () => {
      setLoading(true);
      try {
        // 从技能列表中找到这个技能
        const skills = await window.electron.getSkillsList();
        const found = skills.find(s => s.name === skillName);
        if (found) {
          setSkill(found);
          setDescription(found.description);
          setPrompt(found.prompt);
          // 脚本功能暂未实现
          // if (found.script) {
          //   setScriptType(found.script.type);
          // }
        }

        // 加载元数据
        const allMetadata = await window.electron.getAllSkillsMetadata();
        const meta = allMetadata[skillName]?.metadata || null;
        if (meta) {
          setMetadata(meta);
          setNote(meta.note || '');
        }
      } catch (error) {
        console.error('Failed to load skill:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSkill();
  }, [skillName]);

  // 保存技能
  const handleSave = async () => {
    setSaving(true);
    try {
      // 这里调用后端更新技能
      // 需要后端实现 updateSkill 接口
      onSave();
    } catch (error) {
      console.error('Failed to save skill:', error);
    } finally {
      setSaving(false);
    }
  };

  // 保存备注
  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await window.electron.setSkillNote(skillName, note);
      setMetadata({
        skillName,
        note,
        tags: metadata?.tags || [],
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted">加载中...</div>;
  }

  if (!skill) {
    return <div className="text-center py-8 text-error">技能不存在</div>;
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="text-muted hover:text-ink-700"
            onClick={onCancel}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-semibold text-ink-900">编辑技能</h2>
            <p className="text-xs text-muted">{skill.name}</p>
          </div>
        </div>
      </div>

      {/* 编辑表单 */}
      <div className="space-y-4">
        <div className="rounded-lg border border-ink-900/10 bg-surface p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted block mb-2">技能名称</label>
            <input
              type="text"
              className="w-full rounded border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800"
              value={skill.name}
              disabled
            />
            <p className="text-xs text-muted-light mt-1">技能名称不可修改</p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted block mb-2">技能描述</label>
            <input
              type="text"
              className="w-full rounded border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted block mb-2">我的备注</label>
            <textarea
              className="w-full rounded border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 min-h-[60px] resize-y"
              placeholder="添加中文备注..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              className="text-xs text-accent hover:text-accent-hover mt-2 disabled:opacity-50"
              onClick={handleSaveNote}
              disabled={savingNote}
            >
              {savingNote ? '保存中...' : '保存备注'}
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-muted block mb-2">技能指导</label>
            <textarea
              className="w-full rounded border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 min-h-[120px] resize-y"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存更改'}
          </button>
          <button
            className="rounded-lg border border-ink-900/10 bg-surface px-4 py-2 text-sm text-ink-700 hover:bg-surface-tertiary"
            onClick={onCancel}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
