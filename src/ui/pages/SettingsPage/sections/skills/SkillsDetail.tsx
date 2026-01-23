/**
 * SkillsDetail - 技能详情浏览组件
 * 显示技能的完整信息
 */

import type { SkillConfig, SkillMetadata, SkillTag } from "../../../../electron.d";

interface SkillsDetailProps {
  skill: SkillConfig;
  metadata?: SkillMetadata | null;
  tags?: SkillTag[];
  onBack?: () => void;
}

export function SkillsDetail({ skill, metadata, tags, onBack }: SkillsDetailProps) {
  const note = metadata?.note || '';

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            className="text-muted hover:text-ink-700"
            onClick={onBack}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div>
          <h2 className="text-lg font-semibold text-ink-900">{skill.name}</h2>
          <p className="text-xs text-muted">技能详情</p>
        </div>
      </div>

      {/* 技能信息 */}
      <div className="space-y-4">
        <div className="rounded-lg border border-ink-900/10 bg-surface p-4">
          <h3 className="text-sm font-medium text-ink-900 mb-3">基本信息</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">名称:</span>
              <span className="text-ink-800">{skill.name}</span>
            </div>
            {skill.script && (
              <div className="flex justify-between">
                <span className="text-muted">脚本类型:</span>
                <span className="text-accent">{skill.script.type}</span>
              </div>
            )}
            {tags && tags.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted">标签:</span>
                <div className="flex gap-1">
                  {tags.map(tag => (
                    <span
                      key={tag.id}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ backgroundColor: tag.color + '20', color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-ink-900/10 bg-surface p-4">
          <h3 className="text-sm font-medium text-ink-900 mb-3">描述</h3>
          <p className="text-sm text-ink-700">{skill.description}</p>
        </div>

        {note && (
          <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
            <h3 className="text-sm font-medium text-accent mb-3">我的备注</h3>
            <p className="text-sm text-ink-700">{note}</p>
          </div>
        )}

        <div className="rounded-lg border border-ink-900/10 bg-surface p-4">
          <h3 className="text-sm font-medium text-ink-900 mb-3">指导内容</h3>
          <pre className="text-sm text-ink-800 whitespace-pre-wrap font-sans">
            {skill.prompt}
          </pre>
        </div>

        {skill.script?.content && (
          <div className="rounded-lg border border-ink-900/10 bg-surface p-4">
            <h3 className="text-sm font-medium text-ink-900 mb-3">脚本内容</h3>
            <pre className="text-xs text-ink-800 whitespace-pre-wrap font-mono bg-surface-secondary p-3 rounded">
              {skill.script.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
