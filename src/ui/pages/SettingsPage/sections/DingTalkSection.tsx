/**
 * 钉钉机器人设置页面（多机器人）
 * list / add / edit 三模式
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ArrowLeft, Trash2, Pencil } from 'lucide-react';

type DingTalkConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'failed';

interface DingTalkConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  robotCode?: string;
  corpId?: string;
  dmPolicy: 'open' | 'allowlist';
  groupPolicy: 'open' | 'allowlist';
  allowFrom: string[];
  allowGroups: string[];
  messageType: 'markdown' | 'card';
  cardTemplateId?: string;
  cardTemplateKey?: string;
}

interface BotListItem {
  name: string;
  config: DingTalkConfig;
}

type ViewMode = 'list' | 'add' | 'edit';

const DEFAULT_CONFIG: DingTalkConfig = {
  enabled: false,
  clientId: '',
  clientSecret: '',
  dmPolicy: 'open',
  groupPolicy: 'open',
  allowFrom: [],
  allowGroups: [],
  messageType: 'markdown',
};

const STATUS_COLORS: Record<DingTalkConnectionStatus, string> = {
  disconnected: 'bg-ink-400',
  connecting: 'bg-yellow-400 animate-pulse',
  connected: 'bg-green-500',
  failed: 'bg-red-500',
};

export function DingTalkSection() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [bots, setBots] = useState<BotListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 每个 bot 的连接状态
  const [botStatuses, setBotStatuses] = useState<Record<string, DingTalkConnectionStatus>>({});

  // 表单状态
  const [editingName, setEditingName] = useState<string>('');
  const [botName, setBotName] = useState('');
  const [config, setConfig] = useState<DingTalkConfig>(DEFAULT_CONFIG);
  const [allowFromInput, setAllowFromInput] = useState('');
  const [allowGroupsInput, setAllowGroupsInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // 加载机器人列表
  const loadBots = useCallback(async () => {
    try {
      const result = await (window as any).electron.getDingTalkBotList();
      setBots(result || []);
    } catch (err) {
      console.error('Failed to load DingTalk bots:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBots();
  }, [loadBots]);

  // 监听连接状态变化
  useEffect(() => {
    if (!(window as any).electron) return;
    const unsubscribe = (window as any).electron.onServerEvent((event: any) => {
      if (event.type === 'dingtalk.status') {
        const { botName: name, status, error: err } = event.payload;
        setBotStatuses(prev => ({ ...prev, [name]: status }));
        if (err) {
          console.warn(`[DingTalk] Bot '${name}' error: ${err}`);
        }
      }
    });
    return () => unsubscribe?.();
  }, []);

  // 初始化：获取已连接 bot 的状态
  useEffect(() => {
    async function loadStatuses() {
      try {
        const statuses = await (window as any).electron.getDingTalkStatus();
        if (Array.isArray(statuses)) {
          const map: Record<string, DingTalkConnectionStatus> = {};
          for (const s of statuses) {
            map[s.name] = s.status;
          }
          setBotStatuses(map);
        }
      } catch {
        // ignore
      }
    }
    loadStatuses();
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
    setTestResult(null);
  }, []);

  const resetForm = useCallback(() => {
    setBotName('');
    setConfig(DEFAULT_CONFIG);
    setAllowFromInput('');
    setAllowGroupsInput('');
    setEditingName('');
    clearMessages();
  }, [clearMessages]);

  // 进入新增模式
  const handleAddBot = () => {
    resetForm();
    setViewMode('add');
  };

  // 进入编辑模式
  const handleEditBot = async (name: string) => {
    clearMessages();
    try {
      const loadedConfig = await (window as any).electron.getDingTalkBot(name);
      if (loadedConfig) {
        setEditingName(name);
        setBotName(name);
        setConfig({ ...DEFAULT_CONFIG, ...loadedConfig });
        setAllowFromInput((loadedConfig.allowFrom || []).join(', '));
        setAllowGroupsInput((loadedConfig.allowGroups || []).join(', '));
        setViewMode('edit');
      }
    } catch (err) {
      console.error('Failed to load bot config:', err);
    }
  };

  // 删除机器人
  const handleDeleteBot = async (name: string) => {
    if (!confirm(t('dingtalk.confirmDelete', { name }))) return;

    try {
      // 先断开
      (window as any).electron.sendClientEvent({
        type: 'dingtalk.disconnect',
        payload: { botName: name },
      });
      await (window as any).electron.deleteDingTalkBot(name);
      setBotStatuses(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      await loadBots();
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  };

  // 连接/断开
  const handleToggleConnection = (name: string) => {
    const currentStatus = botStatuses[name] || 'disconnected';
    if (currentStatus === 'connected' || currentStatus === 'connecting') {
      (window as any).electron.sendClientEvent({
        type: 'dingtalk.disconnect',
        payload: { botName: name },
      });
    } else {
      (window as any).electron.sendClientEvent({
        type: 'dingtalk.connect',
        payload: { botName: name },
      });
    }
  };

  // 保存配置
  const handleSave = async () => {
    clearMessages();

    if (!botName.trim()) {
      setError(t('dingtalk.botNameRequired'));
      return;
    }

    // 新增模式下检查名称是否重复
    if (viewMode === 'add' && bots.some(b => b.name === botName.trim())) {
      setError(t('dingtalk.botNameDuplicate'));
      return;
    }

    setSaving(true);
    try {
      const configToSave: DingTalkConfig = {
        ...config,
        allowFrom: allowFromInput.split(',').map(s => s.trim()).filter(Boolean),
        allowGroups: allowGroupsInput.split(',').map(s => s.trim()).filter(Boolean),
      };

      const validation = await (window as any).electron.validateDingTalkConfig(configToSave);
      if (!validation.valid) {
        setError(validation.errors.join('; '));
        return;
      }

      const saveName = viewMode === 'edit' ? editingName : botName.trim();
      await (window as any).electron.saveDingTalkBot(saveName, configToSave);

      // 如果启用且有凭证，自动连接
      if (configToSave.enabled && configToSave.clientId && configToSave.clientSecret) {
        (window as any).electron.sendClientEvent({
          type: 'dingtalk.connect',
          payload: { botName: saveName },
        });
      } else if (!configToSave.enabled) {
        (window as any).electron.sendClientEvent({
          type: 'dingtalk.disconnect',
          payload: { botName: saveName },
        });
      }

      setSuccess(t('dingtalk.saveSuccess'));
      setTimeout(() => setSuccess(null), 3000);

      await loadBots();
      setViewMode('list');
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // 测试连接
  const handleTest = async () => {
    clearMessages();
    setTesting(true);
    try {
      const result = await (window as any).electron.testDingTalkConnection({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
      });
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  // ==================== 列表模式 ====================

  if (loading) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-ink-900">{t('dingtalk.title')}</h1>
        </header>
        <div className="flex items-center justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </section>
    );
  }

  if (viewMode === 'list') {
    return (
      <section className="space-y-6">
        <header>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-ink-900">{t('dingtalk.title')}</h1>
              <p className="mt-2 text-sm text-muted">{t('dingtalk.description')}</p>
            </div>
            <button
              type="button"
              onClick={handleAddBot}
              className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {t('dingtalk.addBot')}
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-error/20 bg-error-light px-3 py-2 text-sm text-error">
            {error}
          </div>
        )}

        {bots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-900/20 bg-surface p-8 text-center">
            <p className="text-sm text-muted">{t('dingtalk.noBots')}</p>
            <button
              type="button"
              onClick={handleAddBot}
              className="mt-3 text-sm text-accent hover:underline cursor-pointer"
            >
              {t('dingtalk.addFirstBot')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {bots.map(({ name, config: botConfig }) => {
              const st = botStatuses[name] || 'disconnected';
              const isActive = st === 'connected' || st === 'connecting';
              return (
                <div
                  key={name}
                  className="rounded-2xl border border-ink-900/10 bg-surface p-4 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[st]}`} />
                      <div>
                        <h3 className="text-sm font-medium text-ink-900">{name}</h3>
                        <p className="text-xs text-muted">
                          {botConfig.clientId ? `${botConfig.clientId.slice(0, 8)}...` : t('dingtalk.notConfigured')}
                          {' '}&middot;{' '}
                          {t(`dingtalk.status.${st}`)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* 连接/断开按钮 */}
                      {botConfig.enabled && botConfig.clientId && (
                        <button
                          type="button"
                          onClick={() => handleToggleConnection(name)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                            isActive
                              ? 'border border-error/20 text-error hover:bg-error-light'
                              : 'border border-success/20 text-success hover:bg-success-light'
                          }`}
                        >
                          {isActive ? t('dingtalk.disconnect') : t('dingtalk.connect')}
                        </button>
                      )}
                      {/* 编辑 */}
                      <button
                        type="button"
                        onClick={() => handleEditBot(name)}
                        className="rounded-lg p-1.5 text-muted hover:text-ink-900 hover:bg-surface-secondary transition-colors cursor-pointer"
                        title={t('dingtalk.editBot')}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {/* 删除 */}
                      <button
                        type="button"
                        onClick={() => handleDeleteBot(name)}
                        className="rounded-lg p-1.5 text-muted hover:text-error hover:bg-error-light transition-colors cursor-pointer"
                        title={t('dingtalk.deleteBot')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Help */}
        <div className="rounded-2xl border border-ink-900/10 bg-surface p-4">
          <p className="text-xs text-muted">
            {t('dingtalk.helpText')}{' '}
            <button
              type="button"
              onClick={() => (window as any).electron.openExternal('https://open-dev.dingtalk.com/')}
              className="text-accent hover:underline cursor-pointer"
            >
              {t('dingtalk.helpLink')}
            </button>
          </p>
        </div>
      </section>
    );
  }

  // ==================== 添加/编辑模式 ====================

  return (
    <section className="space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setViewMode('list'); resetForm(); }}
            className="rounded-lg p-1.5 text-muted hover:text-ink-900 hover:bg-surface-secondary transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-semibold text-ink-900">
            {viewMode === 'add' ? t('dingtalk.addBot') : t('dingtalk.editBot')}
          </h1>
        </div>
      </header>

      {/* Messages */}
      {error && (
        <div className="rounded-xl border border-error/20 bg-error-light px-3 py-2 text-sm text-error">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-success/20 bg-success-light px-3 py-2 text-sm text-success">
          {success}
        </div>
      )}
      {testResult && (
        <div className={`rounded-xl border px-3 py-2 text-sm ${
          testResult.success
            ? 'border-success/20 bg-success-light text-success'
            : 'border-error/20 bg-error-light text-error'
        }`}>
          {testResult.message}
        </div>
      )}

      {/* Bot Name */}
      <div className="space-y-4 rounded-2xl border border-ink-900/10 bg-surface p-5">
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted">{t('dingtalk.botName')} <span className="text-error">*</span></span>
          <input
            type="text"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            placeholder={t('dingtalk.botNamePlaceholder')}
            disabled={viewMode === 'edit'}
            className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors disabled:opacity-50"
          />
        </label>
      </div>

      {/* Enable Toggle */}
      <div className="flex items-center justify-between rounded-2xl border border-ink-900/10 bg-surface p-4">
        <div>
          <h3 className="text-sm font-medium text-ink-900">{t('dingtalk.enabled')}</h3>
          <p className="text-xs text-muted mt-0.5">{t('dingtalk.enabledDesc')}</p>
        </div>
        <button
          type="button"
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
            config.enabled ? 'bg-accent' : 'bg-ink-900/20'
          }`}
          onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
            config.enabled ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {/* Credentials */}
      <div className="space-y-4 rounded-2xl border border-ink-900/10 bg-surface p-5">
        <h3 className="text-sm font-semibold text-ink-900">{t('dingtalk.credentials')}</h3>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted">{t('dingtalk.clientId')}</span>
          <input
            type="text"
            value={config.clientId}
            onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
            placeholder="dingxxxxxxxxx"
            className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted">{t('dingtalk.clientSecret')}</span>
          <input
            type="password"
            value={config.clientSecret}
            onChange={(e) => setConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
            placeholder="••••••••"
            className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted">{t('dingtalk.robotCode')} <span className="text-muted-light">({t('dingtalk.optional')})</span></span>
          <input
            type="text"
            value={config.robotCode || ''}
            onChange={(e) => setConfig(prev => ({ ...prev, robotCode: e.target.value || undefined }))}
            placeholder={t('dingtalk.robotCodePlaceholder')}
            className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
          />
        </label>

        <button
          type="button"
          onClick={handleTest}
          disabled={testing || !config.clientId || !config.clientSecret}
          className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2 text-sm text-ink-700 hover:bg-surface-tertiary transition-colors disabled:opacity-50 cursor-pointer"
        >
          {testing ? t('dingtalk.testing') : t('dingtalk.testConnection')}
        </button>
      </div>

      {/* Security Policy */}
      <div className="space-y-4 rounded-2xl border border-ink-900/10 bg-surface p-5">
        <h3 className="text-sm font-semibold text-ink-900">{t('dingtalk.securityPolicy')}</h3>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted">{t('dingtalk.dmPolicy.label')}</span>
          <select
            value={config.dmPolicy}
            onChange={(e) => setConfig(prev => ({ ...prev, dmPolicy: e.target.value as 'open' | 'allowlist' }))}
            className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
          >
            <option value="open">{t('dingtalk.dmPolicy.open')}</option>
            <option value="allowlist">{t('dingtalk.dmPolicy.allowlist')}</option>
          </select>
        </label>

        {config.dmPolicy === 'allowlist' && (
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted">{t('dingtalk.allowFrom')}</span>
            <input
              type="text"
              value={allowFromInput}
              onChange={(e) => setAllowFromInput(e.target.value)}
              placeholder={t('dingtalk.allowFromPlaceholder')}
              className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
            />
            <p className="text-[10px] text-muted-light">{t('dingtalk.allowFromHint')}</p>
          </label>
        )}

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted">{t('dingtalk.groupPolicy.label')}</span>
          <select
            value={config.groupPolicy}
            onChange={(e) => setConfig(prev => ({ ...prev, groupPolicy: e.target.value as 'open' | 'allowlist' }))}
            className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
          >
            <option value="open">{t('dingtalk.groupPolicy.open')}</option>
            <option value="allowlist">{t('dingtalk.groupPolicy.allowlist')}</option>
          </select>
        </label>

        {config.groupPolicy === 'allowlist' && (
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted">{t('dingtalk.allowGroups')}</span>
            <input
              type="text"
              value={allowGroupsInput}
              onChange={(e) => setAllowGroupsInput(e.target.value)}
              placeholder={t('dingtalk.allowGroupsPlaceholder')}
              className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
            />
            <p className="text-[10px] text-muted-light">{t('dingtalk.allowGroupsHint')}</p>
          </label>
        )}
      </div>

      {/* Message Type */}
      <div className="space-y-4 rounded-2xl border border-ink-900/10 bg-surface p-5">
        <h3 className="text-sm font-semibold text-ink-900">{t('dingtalk.messageTypeLabel')}</h3>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted">{t('dingtalk.messageType.label')}</span>
          <select
            value={config.messageType}
            onChange={(e) => setConfig(prev => ({ ...prev, messageType: e.target.value as 'markdown' | 'card' }))}
            className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
          >
            <option value="markdown">{t('dingtalk.messageType.markdown')}</option>
            <option value="card">{t('dingtalk.messageType.card')}</option>
          </select>
        </label>

        {config.messageType === 'card' && (
          <>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted">{t('dingtalk.cardTemplateId')}</span>
              <input
                type="text"
                value={config.cardTemplateId || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, cardTemplateId: e.target.value || undefined }))}
                placeholder="xxxxx-xxxxx-xxxxx.schema"
                className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted">{t('dingtalk.cardTemplateKey')}</span>
              <input
                type="text"
                value={config.cardTemplateKey || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, cardTemplateKey: e.target.value || undefined }))}
                placeholder="content"
                className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
              />
            </label>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? t('dingtalk.saving') : t('dingtalk.save')}
        </button>
        <button
          type="button"
          onClick={() => { setViewMode('list'); resetForm(); }}
          className="rounded-xl border border-ink-900/10 px-4 py-2.5 text-sm text-ink-700 hover:bg-surface-secondary transition-colors cursor-pointer"
        >
          {t('dingtalk.cancel')}
        </button>
      </div>
    </section>
  );
}
