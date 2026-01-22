/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-21
 * @updated     2026-01-21
 * @Email       None
 *
 * 关于区域
 */

import { useTranslation } from "react-i18next";

export function AboutSection() {
  const { t } = useTranslation();

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">{t('about.title')}</h1>
        <p className="mt-2 text-sm text-muted">
          {t('about.subtitle')}
        </p>
      </header>

      <div className="space-y-4">
        <div className="p-4 rounded-xl border border-ink-900/10 bg-surface">
          <h3 className="text-sm font-medium text-ink-900">{t('about.version.title')}</h3>
          <p className="mt-2 text-sm text-muted">{t('about.version.description')}</p>
        </div>

        <div className="p-4 rounded-xl border border-ink-900/10 bg-surface">
          <h3 className="text-sm font-medium text-ink-900">{t('about.techStack.title')}</h3>
          <ul className="mt-2 text-sm text-muted space-y-1">
            <li>{t('about.techStack.electron')}</li>
            <li>{t('about.techStack.react')}</li>
            <li>{t('about.techStack.tailwind')}</li>
            <li>{t('about.techStack.claude')}</li>
          </ul>
        </div>

        <div className="p-4 rounded-xl border border-ink-900/10 bg-surface">
          <h3 className="text-sm font-medium text-ink-900">{t('about.license.title')}</h3>
          <p className="mt-2 text-sm text-muted">{t('about.license.description')}</p>
        </div>
      </div>

      <aside className="p-4 rounded-xl bg-surface-secondary border border-ink-900/5">
        <p className="text-xs text-muted">
          {t('about.tagline')}
        </p>
      </aside>
    </section>
  );
}
