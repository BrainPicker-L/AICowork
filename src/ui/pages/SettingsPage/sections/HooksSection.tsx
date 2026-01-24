/**
 * Hooks 管理区域
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { HookConfig, HooksStore } from "../../../electron.d";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";

type ViewMode = 'list' | 'create';

export function HooksSection() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [hooks, setHooks] = useState<HooksStore>({ preToolUse: [], postToolUse: [] });
  const [loading, setLoading] = useState(false);

  // 创建钩子表单状态
  const [hookType, setHookType] = useState<'preToolUse' | 'postToolUse'>('preToolUse');
  const [hookName, setHookName] = useState('');
  const [hookCommand, setHookCommand] = useState('');
  const [hookDescription, setHookDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 加载钩子配置
  const loadHooks = async () => {
    setLoading(true);
    try {
      const hooksConfig = await window.electron.getHooksConfig();
      setHooks(hooksConfig);
    } catch (error) {
      console.error('Failed to load hooks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHooks();
  }, []);

  // 自动清除成功提示
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // 创建钩子
  const handleCreateHook = async () => {
    // 验证输入
    if (!hookName.trim()) {
      setError('钩子名称不能为空');
      return;
    }
    // 检查钩子唯一性
    const hookExists = hooks[hookType].some(h => h.hook === hookName.trim());
    if (hookExists) {
      setError('已存在同名钩子');
      return;
    }
    if (!hookCommand.trim()) {
      setError('钩子命令不能为空');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const config: HookConfig = {
        type: hookType,
        hook: hookName.trim(),
        command: hookCommand.trim(),
        description: hookDescription.trim() || undefined,
      };

      const result = await window.electron.saveHook(config);

      if (result.success) {
        setSuccess(true);
        // 重置表单
        setHookName('');
        setHookCommand('');
        setHookDescription('');
        // 重新加载列表
        await loadHooks();
      } else {
        setError(result.error || '创建钩子失败');
      }
    } catch (err) {
      setError('创建钩子失败');
    } finally {
      setSaving(false);
    }
  };

  // 删除钩子
  const handleDeleteHook = async (hookType: string, hookName: string) => {
    if (!confirm(`确定要删除钩子 "${hookName}" 吗？`)) {
      return;
    }

    try {
      const result = await window.electron.deleteHook(hookType, hookName);
      if (result.success) {
        await loadHooks();
      } else {
        setError(result.error || '删除钩子失败');
      }
    } catch (err) {
      setError('删除钩子失败');
    }
  };

  return (
    <TooltipProvider>
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">{t('hooks.title')}</h1>
        <p className="mt-2 text-sm text-muted">
          {t('hooks.description')}
        </p>
      </header>

      {viewMode === 'create' ? (
        // 创建钩子表单 - 左右50%分栏
        <div className="flex gap-6">
          {/* 左侧：表单编辑区 - 占50% */}
          <div className="w-1/2 space-y-4">
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted">钩子类型</label>
              <select
                className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                value={hookType}
                onChange={(e) => setHookType(e.target.value as 'preToolUse' | 'postToolUse')}
              >
                <option value="preToolUse">工具使用前 (Pre-Tool-Use)</option>
                <option value="postToolUse">工具使用后 (Post-Tool-Use)</option>
              </select>
              <p className="text-xs text-muted-light">
                {hookType === 'preToolUse'
                  ? '在工具调用之前执行此钩子'
                  : '在工具调用完成后执行此钩子'}
              </p>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted">钩子名称</label>
              <input
                type="text"
                className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                placeholder="my-hook"
                value={hookName}
                onChange={(e) => setHookName(e.target.value)}
              />
              <p className="text-xs text-muted-light">用于标识此钩子的唯一名称</p>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted">执行命令</label>
              <input
                type="text"
                className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                placeholder="/path/to/script.sh"
                value={hookCommand}
                onChange={(e) => setHookCommand(e.target.value)}
              />
              <p className="text-xs text-muted-light">要执行的脚本或命令路径</p>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted">描述（可选）</label>
              <input
                type="text"
                className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                placeholder="描述此钩子的用途..."
                value={hookDescription}
                onChange={(e) => setHookDescription(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-error/20 bg-error-light px-4 py-2.5 text-sm text-error">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-success/20 bg-success-light px-4 py-2.5 text-sm text-success">
                钩子创建成功
              </div>
            )}

            <div className="flex gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    onClick={handleCreateHook}
                    disabled={saving}
                  >
                    {saving ? '保存中...' : '保存钩子'}
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                  保存钩子配置
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="rounded-xl border border-ink-900/10 bg-surface px-4 py-2.5 text-sm text-ink-700 hover:bg-surface-tertiary transition-colors cursor-pointer"
                    onClick={() => setViewMode('list')}
                  >
                    取消
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                  取消创建钩子
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* 右侧：配置说明和预览 - 占50% */}
          <div className="w-1/2 space-y-4">
            <h3 className="text-lg font-medium text-ink-900">配置预览</h3>

            {/* JSON配置预览 */}
            <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4">
              <h4 className="text-xs font-medium text-muted mb-2">JSON 配置</h4>
              <pre className="text-xs bg-surface rounded-lg p-3 overflow-x-auto text-muted font-mono leading-relaxed">
                {JSON.stringify({
                  type: hookType,
                  hook: hookName || 'hook-name',
                  command: hookCommand || '/path/to/script.sh',
                  description: hookDescription || undefined,
                }, null, 2)}
              </pre>
            </div>

            {/* 钩子说明 */}
            <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4">
              <h4 className="text-xs font-medium text-muted mb-2">钩子说明</h4>
              <div className="text-xs text-ink-700 space-y-2 leading-relaxed">
                <div>
                  <strong className="text-ink-900">钩子类型：</strong>
                  {hookType === 'preToolUse' ? ' 工具使用前' : ' 工具使用后'}
                </div>
                <div><strong className="text-ink-900">钩子名称：</strong>唯一标识符</div>
                <div><strong className="text-ink-900">执行命令：</strong>要执行的脚本路径</div>
                <div className="mt-3 pt-3 border-t border-ink-900/10">
                  <p className="text-muted text-xs">配置保存位置：<code className="px-1 py-0.5 rounded bg-ink-900/5">{t('hooks.hintPath')}</code></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // 钩子列表
        <>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg aria-hidden="true" className="w-6 h-6 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : hooks.preToolUse.length === 0 && hooks.postToolUse.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted">暂无已配置的钩子</p>
              <p className="text-xs text-muted mt-2">
                点击上方"添加新钩子"按钮开始
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pre-Tool-Use 钩子 */}
              {hooks.preToolUse.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-ink-900 flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                      工具使用前
                    </span>
                    <span className="text-xs text-muted">Pre-Tool-Use</span>
                  </h3>
                  {hooks.preToolUse.map((hook) => (
                    <div key={hook.hook} className="p-4 rounded-xl border border-ink-900/10 bg-surface">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-ink-900">{hook.hook}</h4>
                            {hook.description && (
                              <span className="text-xs text-muted">{hook.description}</span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-light font-mono bg-surface-secondary px-2 py-1 rounded">
                            {hook.command}
                          </p>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="text-xs text-muted hover:text-error p-1 cursor-pointer"
                              onClick={() => handleDeleteHook('preToolUse', hook.hook)}
                            >
                              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                            删除钩子
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Post-Tool-Use 钩子 */}
              {hooks.postToolUse.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-ink-900 flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                      工具使用后
                    </span>
                    <span className="text-xs text-muted">Post-Tool-Use</span>
                  </h3>
                  {hooks.postToolUse.map((hook) => (
                    <div key={hook.hook} className="p-4 rounded-xl border border-ink-900/10 bg-surface">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-ink-900">{hook.hook}</h4>
                            {hook.description && (
                              <span className="text-xs text-muted">{hook.description}</span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-light font-mono bg-surface-secondary px-2 py-1 rounded">
                            {hook.command}
                          </p>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="text-xs text-muted hover:text-error p-1 cursor-pointer"
                              onClick={() => handleDeleteHook('postToolUse', hook.hook)}
                            >
                              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                            删除钩子
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex-1 py-3 rounded-xl bg-accent text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors cursor-pointer"
                  onClick={() => setViewMode('create')}
                >
                  添加新钩子
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                创建新的钩子配置
              </TooltipContent>
            </Tooltip>
          </div>

          <aside className="p-4 rounded-xl bg-surface-secondary border border-ink-900/5">
            <p className="text-xs text-muted">
              <strong>提示：</strong>钩子允许在特定事件（如工具调用前后）自动执行自定义脚本。配置的钩子将保存在应用数据目录中。
            </p>
          </aside>
        </>
      )}
    </section>
    </TooltipProvider>
  );
}
