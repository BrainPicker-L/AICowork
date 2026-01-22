/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-21
 * @updated     2026-01-21
 * @Email       None
 *
 * 反馈区域
 */

import { useTranslation } from "react-i18next";

export function FeedbackSection() {
  const { t } = useTranslation();

  // 反馈链接配置
  const feedbackLinks = {
    bugReport: 'https://github.com/Pan519/AICowork',
    featureRequest: 'https://docs.qq.com/form/page/DRm5uV1pSZFB3VHNv',
  };

  // 统一使用浏览器打开链接
  const openLink = (url: string) => {
    window.electron.openExternal(url);
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">{t('feedback.title')}</h1>
        <p className="mt-2 text-sm text-muted">
          {t('feedback.subtitle')}
        </p>
      </header>

      <div className="space-y-4">
        <div
          className="p-4 rounded-xl border border-ink-900/10 bg-surface hover:border-accent/30 transition-colors cursor-pointer"
          onClick={() => openLink(feedbackLinks.bugReport)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-ink-900">{t('feedback.bugReport.title')}</h3>
              <p className="mt-2 text-sm text-muted">{t('feedback.bugReport.description')}</p>
              <p className="mt-2 inline-flex items-center gap-1 text-sm text-accent">
                {t('feedback.bugReport.link')}
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17L17 7M7 7h10v10" />
                </svg>
              </p>
            </div>
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-muted ml-3" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </div>
        </div>

        <div
          className="p-4 rounded-xl border border-ink-900/10 bg-surface hover:border-accent/30 transition-colors cursor-pointer"
          onClick={() => openLink(feedbackLinks.featureRequest)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-ink-900">{t('feedback.featureRequest.title')}</h3>
              <p className="mt-2 text-sm text-muted">{t('feedback.featureRequest.description')}</p>
            </div>
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </div>
        </div>
      </div>

      <aside className="p-4 rounded-xl bg-surface-secondary border border-ink-900/5">
        <p className="text-xs text-muted">
          {t('feedback.thankYou')}
        </p>
      </aside>
    </section>
  );
}
