/**
 * 显示设置区域
 */

import { useTranslation } from "react-i18next";
import { useAppStore } from "../../../store/useAppStore";

export function DisplaySection() {
  const { t } = useTranslation();
  const showTokenUsage = useAppStore((state) => state.showTokenUsage);
  const showSystemMessage = useAppStore((state) => state.showSystemMessage);
  const setShowTokenUsage = useAppStore((state) => state.setShowTokenUsage);
  const setShowSystemMessage = useAppStore((state) => state.setShowSystemMessage);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">{t('display.title')}</h1>
        <p className="mt-2 text-sm text-muted">
          {t('display.description')}
        </p>
      </header>

      <div className="space-y-4">
        {/* Token 耗时信息开关 */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-ink-900/10 bg-surface">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-ink-900">{t('display.tokenUsage.title')}</h3>
            <p className="mt-1 text-xs text-muted">{t('display.tokenUsage.description')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showTokenUsage}
            onClick={() => setShowTokenUsage(!showTokenUsage)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
              showTokenUsage 
                ? 'bg-accent border-accent' 
                : 'bg-gray-300 border-gray-400'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out ${
                showTokenUsage 
                  ? 'translate-x-5 bg-white' 
                  : 'translate-x-0 bg-white border border-gray-300'
              }`}
            />
          </button>
        </div>

        {/* 系统环境消息开关 */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-ink-900/10 bg-surface">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-ink-900">{t('display.systemMessage.title')}</h3>
            <p className="mt-1 text-xs text-muted">{t('display.systemMessage.description')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showSystemMessage}
            onClick={() => setShowSystemMessage(!showSystemMessage)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
              showSystemMessage 
                ? 'bg-accent border-accent' 
                : 'bg-gray-300 border-gray-400'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out ${
                showSystemMessage 
                  ? 'translate-x-5 bg-white' 
                  : 'translate-x-0 bg-white border border-gray-300'
              }`}
            />
          </button>
        </div>
      </div>

      <aside className="p-4 rounded-xl bg-surface-secondary border border-ink-900/5">
        <p className="text-xs text-muted">
          <strong>{t('display.hint.label')}：</strong>{t('display.hint.text')}
        </p>
      </aside>
    </section>
  );
}
