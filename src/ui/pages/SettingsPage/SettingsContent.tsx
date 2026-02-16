/**
 * 设置页面右侧内容容器
 */

import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { FeedbackSection } from './sections/FeedbackSection';
import { AboutSection } from './sections/AboutSection';
import { LanguageSection } from './sections/LanguageSection';
import { DisplaySection } from './sections/DisplaySection';
import { ApiSection } from './sections/ApiSection';
import { McpSection } from './sections/McpSection';
import { MemorySection } from './sections/MemorySection';
import { SkillsSection } from './sections/SkillsSection';
import { JarvisSection } from './sections/JarvisSection';
import { DingTalkSection } from './sections/DingTalkSection';

interface SettingsContentProps {
  className?: string;
}

// 临时占位组件（用于未实现的区域）
function PlaceholderSection({ title, description }: { title: string; description: string }) {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
        <p className="mt-2 text-sm text-muted">{description}</p>
      </header>

      <div className="p-8 rounded-2xl border border-ink-900/10 bg-surface text-center">
        <p className="text-sm text-muted">此设置区域正在开发中...</p>
      </div>
    </section>
  );
}

export function SettingsContent({ className }: SettingsContentProps) {
  const { t } = useTranslation();
  const { settingsSection } = useAppStore();

  const renderContent = () => {
    switch (settingsSection) {
      case 'feedback':
        return <FeedbackSection />;
      case 'about':
        return <AboutSection />;
      case 'language':
        return <LanguageSection />;
      case 'display':
        return <DisplaySection />;
      case 'api':
        return <ApiSection />;
      case 'mcp':
        return <McpSection />;
      case 'memory':
        return <MemorySection />;
      case 'skills':
        return <SkillsSection />;
      case 'jarvis':
        return <JarvisSection />;
      case 'dingtalk':
        return <DingTalkSection />;
      default:
        return (
          <PlaceholderSection
            title={t('settingsPage.placeholder.title')}
            description={t('settingsPage.placeholder.description')}
          />
        );
    }
  };

  return (
    <main className={className}>
      <div className="px-8 py-6 max-w-4xl">
        {renderContent()}
      </div>
    </main>
  );
}
