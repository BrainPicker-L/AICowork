/**
 * 设置页面主容器
 */

import { ArrowLeft } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { SettingsNavigation } from './SettingsNavigation';
import { SettingsContent } from './SettingsContent';

export function SettingsPage() {
  const { setCurrentPage, settingsSection, setSettingsSection } = useAppStore();

  return (
    <div className="flex h-screen bg-surface">
      {/* 顶部标题栏 */}
      <header className="fixed top-0 left-0 right-0 z-10 h-12 bg-surface border-b border-ink-900/10 flex items-center px-4">
        <button
          onClick={() => setCurrentPage('main')}
          className="p-2 rounded-lg hover:bg-surface-tertiary transition-colors duration-200 cursor-pointer"
          aria-label="返回"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2} />
        </button>
        <h1 className="ml-4 text-lg font-semibold text-ink-900">设置</h1>
      </header>

      {/* 主内容区 */}
      <div className="flex pt-12">
        {/* 左侧导航 */}
        <SettingsNavigation
          activeSection={settingsSection}
          onSectionChange={setSettingsSection}
          className="fixed left-0 top-12 bottom-0 w-[280px] overflow-y-auto"
        />

        {/* 右侧内容 */}
        <SettingsContent className="flex-1 ml-[280px]" />
      </div>
    </div>
  );
}
