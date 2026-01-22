/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-22
 * @updated     2026-01-22
 * @Email       None
 *
 * SkillsList - 技能列表组件
 * 显示技能列表，如果有备注则显示备注，否则显示原描述
 */

import { useState, useEffect } from "react";
import type { SkillConfig, SkillMetadata } from "../../../../electron.d";

interface SkillWithMetadata {
  skill: SkillConfig;
  metadata: SkillMetadata | null;
}

export function SkillsList() {
  const [items, setItems] = useState<SkillWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  // 备注编辑状态
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [skillsList, metadata] = await Promise.all([
        window.electron.getSkillsList(),
        window.electron.getAllSkillsMetadata(),
      ]);

      const combined: SkillWithMetadata[] = skillsList.map(skill => ({
        skill,
        metadata: metadata[skill.name]?.metadata || null,
      }));

      setItems(combined);
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 保存备注
  const handleSaveNote = async (skillName: string) => {
    setSavingNote(true);
    try {
      await window.electron.setSkillNote(skillName, noteText);
      setEditingNote(null);
      setNoteText('');
      await loadData();
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setSavingNote(false);
    }
  };

  // 删除备注
  const handleDeleteNote = async (skillName: string) => {
    try {
      await window.electron.deleteSkillNote(skillName);
      await loadData();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">技能列表</h2>
          <p className="text-sm text-muted">查看和管理你的技能</p>
        </div>
      </div>

      {/* 技能列表 */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-900/20 bg-surface-secondary p-8 text-center">
          <div className="text-muted">暂无技能</div>
          <div className="mt-2 text-xs text-muted-light">
            技能文件存放在 ~/.claude/skills/ 目录
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(({ skill, metadata }) => {
            const note = metadata?.note || '';
            const hasNote = !!note;

            return (
              <div
                key={skill.name}
                className="rounded-lg border border-ink-900/10 bg-surface p-3 hover:border-ink-900/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink-900 text-sm">{skill.name}</span>
                      {skill.script && (
                        <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent">
                          {skill.script.type}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-ink-700 mt-1">
                      {hasNote ? note : skill.description}
                    </p>
                    {hasNote && (
                      <div className="text-xs text-muted-light mt-0.5">
                        原描述: {skill.description}
                      </div>
                    )}
                  </div>

                  {/* 备注操作 */}
                  <div className="flex items-center gap-2">
                    {editingNote === skill.name ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="w-40 rounded border border-ink-900/10 bg-surface px-2 py-1 text-sm focus:border-accent focus:outline-none"
                          placeholder="添加备注..."
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          autoFocus
                        />
                        <button
                          className="text-xs text-accent hover:text-accent-hover disabled:opacity-50"
                          onClick={() => handleSaveNote(skill.name)}
                          disabled={savingNote}
                        >
                          {savingNote ? '...' : '保存'}
                        </button>
                        <button
                          className="text-xs text-muted hover:text-ink-700"
                          onClick={() => {
                            setEditingNote(null);
                            setNoteText('');
                          }}
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          className="text-xs text-muted hover:text-accent"
                          onClick={() => {
                            setEditingNote(skill.name);
                            setNoteText(note);
                          }}
                        >
                          {hasNote ? '编辑' : '备注'}
                        </button>
                        {hasNote && (
                          <button
                            className="text-xs text-muted hover:text-error"
                            onClick={() => handleDeleteNote(skill.name)}
                          >
                            删除
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
