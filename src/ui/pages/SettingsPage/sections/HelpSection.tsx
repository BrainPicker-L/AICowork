/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-21
 * @updated     2026-01-21
 * @Email       None
 *
 * 帮助区域
 */

import { useTranslation } from "react-i18next";

export function HelpSection() {
  const { t } = useTranslation();

  // 帮助文档链接配置
  const helpLinks = {
    quickStart: 'https://ima.qq.com/note/share/_AwZPbuK9wucK5gWaVdjNQ?channel=4',
    faq: 'https://ima.qq.com/note/share/_AwZPbuK9wucK5gWaVdjNQ?channel=4',
    docs: 'https://ima.qq.com/note/share/_AwZPbuK9wucK5gWaVdjNQ?channel=4',
  };

  // 统一使用浏览器打开链接
  const openLink = (url: string) => {
    window.electron.openExternal(url);
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">{t('help.title')}</h1>
        <p className="mt-2 text-sm text-muted">
          {t('help.subtitle')}
        </p>
      </header>

      <div className="space-y-4">
        <div
          className="p-4 rounded-xl border border-ink-900/10 bg-surface hover:border-accent/30 transition-colors cursor-pointer"
          onClick={() => openLink(helpLinks.quickStart)}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-ink-900">{t('help.quickStart.title')}</h3>
              <p className="mt-2 text-sm text-muted">{t('help.quickStart.description')}</p>
            </div>
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </div>
        </div>

        <div
          className="p-4 rounded-xl border border-ink-900/10 bg-surface hover:border-accent/30 transition-colors cursor-pointer"
          onClick={() => openLink(helpLinks.faq)}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-ink-900">{t('help.faq.title')}</h3>
              <p className="mt-2 text-sm text-muted">{t('help.faq.description')}</p>
            </div>
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </div>
        </div>

        <div
          className="p-4 rounded-xl border border-ink-900/10 bg-surface hover:border-accent/30 transition-colors cursor-pointer"
          onClick={() => openLink(helpLinks.docs)}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-ink-900">{t('help.docs.title')}</h3>
              <p className="mt-2 text-sm text-muted">{t('help.docs.description')}</p>
            </div>
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </div>
        </div>
      </div>

      <aside className="p-4 rounded-xl bg-surface-secondary border border-ink-900/5">
        <p className="text-xs text-muted">
          {t('help.tip')}
        </p>
      </aside>
    </section>
  );
}
