/**
 * Output Styles 设置区域
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";

type OutputConfig = {
  format: 'markdown' | 'plain' | 'html' | 'json';
  theme: 'default' | 'dark' | 'light' | 'monokai' | 'github' | 'dracula' | 'nord';
  codeHighlight: boolean;
  showLineNumbers: boolean;
  fontSize: 'small' | 'medium' | 'large';
  wrapCode: boolean;
  renderer: 'standard' | 'enhanced';
};

export function OutputSection() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<OutputConfig>({
    format: 'markdown',
    theme: 'default',
    codeHighlight: true,
    showLineNumbers: true,
    fontSize: 'medium',
    wrapCode: false,
    renderer: 'enhanced',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 加载配置
  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const currentConfig = await window.electron.getOutputConfig();
        setConfig(currentConfig);
      } catch (error) {
        console.error('Failed to load output config:', error);
        setError('加载配置失败');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // 自动清除成功提示
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // 更新配置
  const updateConfig = (key: keyof OutputConfig, value: OutputConfig[keyof OutputConfig]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSuccess(false);
  };

  // 保存配置
  const handleSave = async () => {
    setError(null);
    setSaving(true);

    try {
      const result = await window.electron.saveOutputConfig(config);

      if (result.success) {
        setSuccess(true);
        setHasChanges(false);
      } else {
        setError(result.error || '保存配置失败');
      }
    } catch (err) {
      setError('保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  // 重置配置
  const handleReset = async () => {
    const defaultConfig: OutputConfig = {
      format: 'markdown',
      theme: 'default',
      codeHighlight: true,
      showLineNumbers: true,
      fontSize: 'medium',
      wrapCode: false,
      renderer: 'enhanced',
    };
    setConfig(defaultConfig);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <TooltipProvider>
        <section className="space-y-6">
          <header>
            <h1 className="text-2xl font-semibold text-ink-900">{t("output.title")}</h1>
            <p className="mt-2 text-sm text-muted">
              {t("output.subtitle")}
            </p>
          </header>

          <div className="flex items-center justify-center py-12">
            <svg aria-hidden="true" className="w-8 h-8 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </section>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">{t("output.title")}</h1>
        <p className="mt-2 text-sm text-muted">
          {t("output.subtitle")}
        </p>
      </header>

      <div className="space-y-4">
        {/* 输出格式 */}
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted">输出格式</label>
          <select
            className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
            value={config.format}
            onChange={(e) => updateConfig('format', e.target.value as OutputConfig['format'])}
          >
            <option value="markdown">Markdown</option>
            <option value="plain">纯文本</option>
            <option value="html">HTML</option>
            <option value="json">JSON</option>
          </select>
        </div>

        {/* 主题选择 */}
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted">代码主题</label>
          <select
            className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
            value={config.theme}
            onChange={(e) => updateConfig('theme', e.target.value as OutputConfig['theme'])}
          >
            <option value="default">默认</option>
            <option value="dark">暗色</option>
            <option value="light">亮色</option>
            <option value="monokai">Monokai</option>
            <option value="github">GitHub</option>
            <option value="dracula">Dracula</option>
            <option value="nord">Nord</option>
          </select>
        </div>

        {/* 字号选择 */}
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted">字号大小</label>
          <select
            className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
            value={config.fontSize}
            onChange={(e) => updateConfig('fontSize', e.target.value as OutputConfig['fontSize'])}
          >
            <option value="small">小</option>
            <option value="medium">中</option>
            <option value="large">大</option>
          </select>
        </div>

        {/* 开关选项 */}
        <div className="space-y-3 pt-2">
          {/* 代码高亮 */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.codeHighlight}
                onChange={(e) => updateConfig('codeHighlight', e.target.checked)}
              />
              <div className="w-9 h-5 bg-ink-900/20 rounded-full peer-checked:bg-accent transition-colors"></div>
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4"></div>
            </div>
            <span className="text-sm text-ink-700">启用代码高亮</span>
          </label>

          {/* 显示行号 */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.showLineNumbers}
                onChange={(e) => updateConfig('showLineNumbers', e.target.checked)}
              />
              <div className="w-9 h-5 bg-ink-900/20 rounded-full peer-checked:bg-accent transition-colors"></div>
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4"></div>
            </div>
            <span className="text-sm text-ink-700">显示代码行号</span>
          </label>

          {/* 代码换行 */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.wrapCode}
                onChange={(e) => updateConfig('wrapCode', e.target.checked)}
              />
              <div className="w-9 h-5 bg-ink-900/20 rounded-full peer-checked:bg-accent transition-colors"></div>
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4"></div>
            </div>
            <span className="text-sm text-ink-700">代码自动换行</span>
          </label>

          {/* 渲染器选择 */}
          <div className="grid gap-1.5 pt-2">
            <label className="text-xs font-medium text-muted">Markdown 渲染器</label>
            <select
              className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
              value={config.renderer}
              onChange={(e) => updateConfig('renderer', e.target.value as OutputConfig['renderer'])}
            >
              <option value="standard">标准渲染器（轻量快速）</option>
              <option value="enhanced">增强渲染器（支持图表、SVG等）</option>
            </select>
            <p className="text-xs text-muted-light">
              {config.renderer === 'enhanced'
                ? '支持柱状图、饼图、折线图、流程图等可视化内容'
                : '基础 Markdown 渲染，性能更好'}
            </p>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="rounded-xl border border-error/20 bg-error-light px-4 py-2.5 text-sm text-error">
            {error}
          </div>
        )}

        {/* 成功提示 */}
        {success && (
          <div className="rounded-xl border border-success/20 bg-success-light px-4 py-2.5 text-sm text-success">
            配置保存成功
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                onClick={handleSave}
                disabled={saving || !hasChanges}
              >
                {saving ? '保存中...' : '保存配置'}
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
              {saving ? '保存中...' : '保存输出样式配置'}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="rounded-xl border border-ink-900/10 bg-surface px-4 py-2.5 text-sm text-ink-700 hover:bg-surface-tertiary transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                onClick={handleReset}
                disabled={saving}
              >
                重置为默认
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
              将所有配置重置为默认值
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <aside className="p-4 rounded-xl bg-surface-secondary border border-ink-900/5">
        <p className="text-xs text-muted">
          <strong>提示：</strong>配置将应用于所有新的对话输出。当前会话的输出样式不会实时更新。
        </p>
      </aside>
    </section>
    </TooltipProvider>
  );
}
