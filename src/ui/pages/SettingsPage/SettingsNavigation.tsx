/**
 * 设置页面左侧导航组件
 */

import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  MessageCircle,
  Info,
  Key,
  Plug,
  Languages,
  Zap,
  Package,
  Brain,
  Monitor
} from 'lucide-react';
import type { SettingsSection } from '../../store/useAppStore';

interface SettingsNavigationProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  className?: string;
}

// 设置区域定义（分组：常规 / 连接与模型 / 工具与扩展 / 能力）
interface SectionDef {
  id: SettingsSection;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  group: 'general' | 'connection' | 'tools' | 'capabilities';
}

const SETTINGS_SECTIONS: SectionDef[] = [
  // 常规
  { id: 'feedback', icon: MessageSquare, group: 'general' },
  { id: 'about', icon: Info, group: 'general' },
  { id: 'language', icon: Languages, group: 'general' },
  { id: 'display', icon: Monitor, group: 'general' },

  // 连接与模型
  { id: 'api', icon: Key, group: 'connection' },
  { id: 'dingtalk', icon: MessageCircle, group: 'connection' },

  // 工具与扩展
  { id: 'mcp', icon: Plug, group: 'tools' },
  { id: 'skills', icon: Zap, group: 'tools' },
  { id: 'jarvis', icon: Package, group: 'tools' },

  // 能力
  { id: 'memory', icon: Brain, group: 'capabilities' },
];

const GROUP_ORDER: Array<SectionDef['group']> = ['general', 'connection', 'tools', 'capabilities'];

export function SettingsNavigation({ activeSection, onSectionChange, className }: SettingsNavigationProps) {
  const { t } = useTranslation();

  // 获取导航标签翻译
  const getNavLabel = (id: SettingsSection): string => {
    return t(`settingsPage.navigation.${id}`);
  };

  // 获取分组标题翻译
  const getGroupLabel = (group: SectionDef['group']): string => {
    return t(`settingsPage.sections.${group}`);
  };

  return (
    <nav className={className}>
      <div className="px-4 py-6 space-y-6">
        {GROUP_ORDER.map((group) => {
          const groupSections = SETTINGS_SECTIONS.filter((s) => s.group === group);
          if (groupSections.length === 0) return null;

          return (
            <div key={group}>
              {/* 分组标题 */}
              <h3 className="mb-2 px-3 text-xs font-semibold text-ink-500 uppercase tracking-wider">
                {getGroupLabel(group)}
              </h3>

              {/* 分组菜单项 */}
              <div className="space-y-1">
                {groupSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-accent/10 text-accent'
                          : 'text-ink-700 hover:bg-surface-tertiary'
                      }`}
                      onClick={() => onSectionChange(section.id)}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                      <span>{getNavLabel(section.id)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
