/**
 * TagsManage - 标签管理组件
 * 创建、编辑、删除标签，管理技能与标签的关联
 */

import { useState, useEffect } from "react";
import type { SkillTag, SkillMetadata, SkillConfig } from "../../../../electron.d";

export function TagsManage() {
  const [tags, setTags] = useState<SkillTag[]>([]);
  const [skills, setSkills] = useState<SkillConfig[]>([]);
  const [skillsMetadata, setSkillsMetadata] = useState<Record<string, { metadata: SkillMetadata; tags: SkillTag[] }>>({});
  const [loading, setLoading] = useState(true);

  // 创建标签表单
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1');
  const [creatingTag, setCreatingTag] = useState(false);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [tagsList, skillsList, metadata] = await Promise.all([
        window.electron.getAllTags(),
        window.electron.getSkillsList(),
        window.electron.getAllSkillsMetadata(),
      ]);

      setTags(tagsList);
      setSkills(skillsList);
      setSkillsMetadata(metadata);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 创建标签
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setCreatingTag(true);
    try {
      await window.electron.createTag(newTagName.trim(), newTagColor);
      setNewTagName('');
      setNewTagColor('#6366f1');
      await loadData();
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setCreatingTag(false);
    }
  };

  // 删除标签
  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('确定要删除这个标签吗？')) return;

    try {
      await window.electron.deleteTag(tagId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  // 添加标签到技能
  const handleAddTagToSkill = async (skillName: string, tagId: string) => {
    try {
      await window.electron.addTagToSkill(skillName, tagId);
      await loadData();
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  // 从技能移除标签
  const handleRemoveTagFromSkill = async (skillName: string, tagId: string) => {
    try {
      await window.electron.removeTagFromSkill(skillName, tagId);
      await loadData();
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <h2 className="text-lg font-semibold text-ink-900">标签管理</h2>
        <p className="text-sm text-muted">创建标签并为技能分类</p>
      </div>

      {/* 创建标签 */}
      <div className="rounded-lg border border-ink-900/10 bg-surface p-4">
        <h3 className="text-sm font-medium text-ink-900 mb-3">创建新标签</h3>
        <div className="flex items-center gap-3">
          <input
            type="text"
            className="flex-1 rounded border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm"
            placeholder="标签名称..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
          />
          <input
            type="color"
            className="w-10 h-10 rounded border border-ink-900/10"
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
          />
          <button
            className="rounded-lg bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover disabled:opacity-50"
            onClick={handleCreateTag}
            disabled={creatingTag || !newTagName.trim()}
          >
            {creatingTag ? '创建中...' : '创建'}
          </button>
        </div>
      </div>

      {/* 标签列表 */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-ink-900">所有标签</h3>
        {tags.length === 0 ? (
          <div className="text-center py-4 text-muted text-sm">暂无标签</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {tags.map(tag => {
              const skillsWithTag = skills.filter(skill => {
                const data = skillsMetadata[skill.name];
                return data?.metadata?.tags?.includes(tag.id);
              });

              return (
                <div
                  key={tag.id}
                  className="rounded-lg border border-ink-900/10 bg-surface p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm font-medium text-ink-900">{tag.name}</span>
                    </div>
                    <button
                      className="text-xs text-muted hover:text-error"
                      onClick={() => handleDeleteTag(tag.id)}
                    >
                      删除
                    </button>
                  </div>
                  <div className="text-xs text-muted">
                    {skillsWithTag.length} 个技能使用
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 技能标签分配 */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-ink-900">技能标签</h3>
        <div className="space-y-2">
          {skills.map(skill => {
            const data = skillsMetadata[skill.name];
            const skillTags = data?.tags || [];

            return (
              <div
                key={skill.name}
                className="rounded-lg border border-ink-900/10 bg-surface p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-ink-900">{skill.name}</span>
                    <div className="flex gap-1">
                      {skillTags.map(tag => (
                        <span
                          key={tag.id}
                          className="text-xs px-2 py-0.5 rounded flex items-center gap-1"
                          style={{ backgroundColor: tag.color + '20', color: tag.color }}
                        >
                          {tag.name}
                          <button
                            className="hover:opacity-70"
                            onClick={() => handleRemoveTagFromSkill(skill.name, tag.id)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <select
                    className="text-xs rounded border border-ink-900/10 bg-surface px-2 py-1"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddTagToSkill(skill.name, e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">+ 添加标签</option>
                    {tags
                      .filter(tag => !skillTags.find(t => t.id === tag.id))
                      .map(tag => (
                        <option key={tag.id} value={tag.id}>
                          {tag.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
