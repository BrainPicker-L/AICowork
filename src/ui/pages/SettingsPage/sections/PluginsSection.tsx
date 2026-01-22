/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-21
 * @updated     2026-01-21
 * @Email       None
 *
 * Plugins 管理区域
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface PluginInfo {
  name: string;
  displayName: string;
  description: string;
  commands: string[];
  installed: boolean;
}

// 内置插件列表
const BUILTIN_PLUGINS: PluginInfo[] = [
  {
    name: 'pr-review-toolkit',
    displayName: 'PR Review Toolkit',
    description: 'Pull Request 代码审查工具包',
    commands: ['/pr-review-toolkit:review-pr'],
    installed: true,
  },
  {
    name: 'ralph-loop',
    displayName: 'Ralph Loop',
    description: '循环执行助手插件',
    commands: ['/ralph-loop:ralph-loop', '/ralph-loop:cancel-ralph'],
    installed: true,
  },
];

export function PluginsSection() {
  const { t } = useTranslation();
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // 模拟加载插件列表
    setTimeout(() => {
      setPlugins(BUILTIN_PLUGINS);
      setLoading(false);
    }, 300);
  }, []);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">{t('plugins.title')}</h1>
        <p className="mt-2 text-sm text-muted">
          {t('plugins.description')}
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <svg aria-hidden="true" className="w-6 h-6 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : plugins.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted">暂无已安装的插件</p>
          <p className="text-xs text-muted mt-2">
            插件通常作为技能系统的一部分自动加载
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plugins.map((plugin) => (
            <div key={plugin.name} className="p-4 rounded-xl border border-ink-900/10 bg-surface">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-ink-900">{plugin.displayName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      plugin.installed
                        ? 'bg-success/20 text-success'
                        : 'bg-muted-light text-muted'
                    }`}>
                      {plugin.installed ? '已安装' : '未安装'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{plugin.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {plugin.commands.map((cmd) => (
                      <code key={cmd} className="px-2 py-0.5 rounded bg-ink-900/5 text-xs text-muted">
                        {cmd}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          className="flex-1 py-3 rounded-xl bg-accent text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors"
          onClick={async () => {
            // 打开插件目录创建新插件
            try {
              const result = await window.electron.openPluginsDirectory();
              if (!result.success) {
                console.error('Failed to open plugins directory:', result.error);
              }
            } catch (error) {
              console.error('Error opening plugins directory:', error);
            }
          }}
        >
          创建新插件
        </button>
        <button
          className="py-3 px-6 rounded-xl border border-ink-900/10 bg-surface text-sm text-muted hover:bg-surface-tertiary hover:text-ink-700 transition-colors"
          onClick={async () => {
            // 打开插件目录
            try {
              const result = await window.electron.openPluginsDirectory();
              if (!result.success) {
                console.error('Failed to open plugins directory:', result.error);
              }
            } catch (error) {
              console.error('Error opening plugins directory:', error);
            }
          }}
        >
          打开目录
        </button>
      </div>

      <aside className="p-4 rounded-xl bg-surface-secondary border border-ink-900/5">
        <p className="text-xs text-muted">
          <strong>提示：</strong>插件命令格式为 <code className="px-1 py-0.5 rounded bg-ink-900/5">/plugin-name:command-name</code>
        </p>
      </aside>
    </section>
  );
}
