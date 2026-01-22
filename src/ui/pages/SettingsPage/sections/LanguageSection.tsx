/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-21
 * @Email       None
 *
 * 语言设置区域
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: 'zh', nameKey: 'zh', nameEn: 'Simplified Chinese' },
  { code: 'zh-TW', nameKey: 'zh-TW', nameEn: 'Traditional Chinese' },
  { code: 'en', nameKey: 'en', nameEn: 'English' },
  { code: 'ja', nameKey: 'ja', nameEn: 'Japanese' },
  { code: 'ko', nameKey: 'ko', nameEn: 'Korean' },
  { code: 'es', nameKey: 'es', nameEn: 'Spanish' },
  { code: 'fr', nameKey: 'fr', nameEn: 'French' },
  { code: 'de', nameKey: 'de', nameEn: 'German' },
  { code: 'ru', nameKey: 'ru', nameEn: 'Russian' },
  { code: 'pt', nameKey: 'pt', nameEn: 'Portuguese' },
];

export function LanguageSection() {
  const { t, i18n } = useTranslation();
  const { language } = i18n;
  const [currentLang, setCurrentLang] = useState(language);
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageChange = async (langCode: string) => {
    if (langCode === currentLang || isChanging) return;

    setIsChanging(true);
    try {
      await i18n.changeLanguage(langCode);
      setCurrentLang(langCode);
      // 可以在这里保存用户偏好到本地存储
      localStorage.setItem('user-language', langCode);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  // 组件挂载时从本地存储读取用户偏好
  useEffect(() => {
    const savedLang = localStorage.getItem('user-language');
    if (savedLang && savedLang !== currentLang) {
      setCurrentLang(savedLang);
      // 不同步调用 changeLanguage，避免阻塞
      i18n.changeLanguage(savedLang).catch(console.error);
    }
  }, []);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">{t('language.title')}</h1>
        <p className="mt-2 text-sm text-muted">
          {t('language.description')}
        </p>
      </header>

      <div className="space-y-3">
        {LANGUAGES.map((lang) => {
          const isSelected = lang.code === currentLang;
          return (
            <button
              key={lang.code}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors duration-200 ${
                isSelected
                  ? 'border-accent bg-accent/5 text-accent'
                  : 'border-ink-900/10 bg-surface hover:bg-surface-tertiary text-ink-700'
              }`}
              onClick={() => handleLanguageChange(lang.code)}
              disabled={isChanging}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{t(`languageNames.${lang.nameKey}`)}</span>
                <span className="text-xs text-muted">{lang.nameEn}</span>
              </div>
              {isSelected && (
                <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {isChanging && (
        <div className="flex items-center justify-center py-3">
          <svg className="w-5 h-5 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="ml-2 text-sm text-muted">{t('language.switching')}</span>
        </div>
      )}

      <aside className="p-4 rounded-xl bg-surface-secondary border border-ink-900/5">
        <p className="text-xs text-muted">
          <strong>{t('language.tip.label')}：</strong>{t('language.tip.text')}
        </p>
      </aside>
    </section>
  );
}
