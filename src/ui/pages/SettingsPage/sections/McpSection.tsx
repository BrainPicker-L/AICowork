/**
 * MCP 设置区域
 */

import { useState, useEffect } from "react";
import { Trash2, Edit2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface McpServerConfig {
  name: string;
  displayName?: string;
  type?: 'stdio' | 'sse' | 'streamableHttp';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  disabled?: boolean;
  description?: string;
}

type ViewMode = 'list' | 'add' | 'edit';

interface ServerListItem {
  name: string;
  config: McpServerConfig;
}

export function McpSection() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [servers, setServers] = useState<ServerListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Record<string, McpServerConfig>>({});

  // 表单状态
  const [editName, setEditName] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [serverType, setServerType] = useState<'stdio' | 'sse' | 'streamableHttp'>('stdio');
  const [command, setCommand] = useState<string>('');
  const [args, setArgs] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 测试状态
  const [testingServer, setTestingServer] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; details?: string }>>({});

  // 展开/折叠状态
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());

  // 加载服务器列表
  const loadServers = async () => {
    setLoading(true);
    try {
      const result = await window.electron.getMcpServerList();
      setServers(result || []);
    } catch (err) {
      console.error("Failed to load MCP servers:", err);
    } finally {
      setLoading(false);
    }
  };

  // 加载模板
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const result = await window.electron.getMcpTemplates();
        setTemplates(result);
      } catch (err) {
        console.error("Failed to load MCP templates:", err);
      }
    };
    loadTemplates();
  }, []);

  // 初始加载
  useEffect(() => {
    loadServers();
  }, []);

  // 切换展开/折叠
  const toggleExpand = (name: string) => {
    setExpandedServers(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  // 新建服务器
  const handleAdd = () => {
    setViewMode('add');
    resetForm();
  };

  // 编辑服务器
  const handleEdit = (server: ServerListItem) => {
    setEditName(server.name);
    setDisplayName(server.config.displayName || '');
    setServerType(server.config.type || 'stdio');
    setCommand(server.config.command || '');
    setArgs(server.config.args?.join(' ') || '');
    setUrl(server.config.url || '');
    setDescription(server.config.description || '');
    setError(null);
    setViewMode('edit');
  };

  // 删除服务器
  const handleDelete = async (name: string) => {
    if (!confirm(t('mcp.confirmDelete', { name }))) {
      return;
    }

    try {
      const result = await window.electron.deleteMcpServer(name);
      if (result.success) {
        await loadServers();
      } else {
        setError(result.error || t('mcp.errors.deleteFailed'));
      }
    } catch (err) {
      setError(t('mcp.errors.deleteFailed'));
    }
  };

  // 保存服务器
  const handleSave = async () => {
    setError(null);

    // 验证
    if (!editName.trim()) {
      setError(t('mcp.errors.nameRequired'));
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(editName)) {
      setError(t('mcp.errors.invalidNameFormat'));
      return;
    }

    if (serverType === 'stdio' && !command.trim()) {
      setError(t('mcp.errors.commandRequired'));
      return;
    }

    if ((serverType === 'sse' || serverType === 'streamableHttp') && !url.trim()) {
      setError(t('mcp.errors.urlRequired'));
      return;
    }

    // 验证 URL
    if ((serverType === 'sse' || serverType === 'streamableHttp') && url.trim()) {
      try {
        new URL(url.trim());
      } catch {
        setError(t('mcp.errors.invalidUrl'));
        return;
      }
    }

    setSaving(true);

    try {
      const config: McpServerConfig = {
        name: editName.trim(),
        displayName: displayName.trim() || undefined,
        type: serverType,
        command: serverType === 'stdio' ? command.trim() : undefined,
        args: serverType === 'stdio' && args.trim() ? args.trim().split(/\s+/) : undefined,
        url: (serverType === 'sse' || serverType === 'streamableHttp') ? url.trim() : undefined,
        description: description.trim() || undefined,
      };

      const result = await window.electron.saveMcpServer(editName.trim(), config);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setViewMode('list');
          loadServers();
        }, 1000);
      } else {
        setError(result.error || t('mcp.errors.saveFailed'));
      }
    } catch (err) {
      setError(t('mcp.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // 测试 MCP 服务器连接
  const handleTestServer = async (server: ServerListItem) => {
    setTestingServer(server.name);
    setTestResults(prev => ({ ...prev, [server.name]: { success: false, message: '测试中...', details: '' } }));

    try {
      const result = await window.electron.testMcpServer(server.config);
      setTestResults(prev => ({ ...prev, [server.name]: result }));
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [server.name]: {
          success: false,
          message: '测试失败',
          details: error?.message || String(error),
        },
      }));
    } finally {
      setTestingServer(null);
    }
  };
  const handleFromTemplate = (templateName: string) => {
    const template = templates[templateName];
    if (!template) return;

    setEditName(template.name);
    setDisplayName(template.displayName || '');
    setServerType(template.type || 'stdio');
    setCommand(template.command || '');
    setArgs(template.args?.join(' ') || '');
    setUrl(template.url || '');
    setDescription(template.description || '');
    setError(null);
    setViewMode('add');
  };

  // 重置表单
  const resetForm = () => {
    setEditName('');
    setDisplayName('');
    setServerType('stdio');
    setCommand('');
    setArgs('');
    setUrl('');
    setDescription('');
    setError(null);
  };

  // 取消编辑
  const handleCancel = () => {
    setViewMode('list');
    resetForm();
    setError(null);
  };

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">{t('mcp.title')}</h1>
          <p className="mt-2 text-sm text-muted">
            {t('mcp.description')}
          </p>
        </div>
        {viewMode === 'list' && (
          <button
            onClick={handleAdd}
            className="rounded-xl border border-ink-900/10 bg-surface px-4 py-2 text-sm text-ink-700 hover:bg-surface-tertiary transition-colors"
          >
            {t('mcp.addServer')}
          </button>
        )}
      </header>

      {/* 列表视图 */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg aria-hidden="true" className="w-6 h-6 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : servers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted">{t('mcp.noServers')}</p>
            </div>
          ) : (
            servers.map((server) => {
              const isExpanded = expandedServers.has(server.name);
              return (
                <div key={server.name} className="rounded-xl border border-ink-900/10 bg-surface-secondary overflow-hidden">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface-tertiary transition-colors"
                    onClick={() => toggleExpand(server.name)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted" strokeWidth={2} />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted" strokeWidth={2} />
                      )}
                      <div>
                        <h3 className="text-sm font-medium text-ink-900">
                          {server.config.displayName || server.name}
                        </h3>
                        <p className="text-xs text-muted mt-0.5">{server.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-surface transition-colors"
                        onClick={(e) => { e.stopPropagation(); handleEdit(server); }}
                        title={t('mcp.actions.edit')}
                      >
                        <Edit2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                      <button
                        className="p-1.5 rounded-lg text-muted hover:text-success hover:bg-surface transition-colors"
                        onClick={(e) => { e.stopPropagation(); handleTestServer(server); }}
                        title="测试连接"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      </button>
                      <button
                        className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-surface transition-colors"
                        onClick={(e) => { e.stopPropagation(); handleDelete(server.name); }}
                        title={t('mcp.actions.delete')}
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {/* 测试结果 - 始终可见 */}
                  {testResults[server.name] && (
                    <div className={`px-4 py-2 text-xs ${
                      testResults[server.name].success
                        ? 'bg-success/10 text-success'
                        : 'bg-error/10 text-error'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {testResults[server.name].success ? '✓' : '✗'} {testResults[server.name].message}
                        </span>
                        {testingServer === server.name && (
                          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        )}
                      </div>
                      {testResults[server.name].details && (
                        <div className="mt-1 text-xs opacity-80">{testResults[server.name].details}</div>
                      )}
                    </div>
                  )}

                  {isExpanded && (
                    <div className="px-4 pb-3 border-t border-ink-900/10 pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted">{t('mcp.view.type')}</span>
                        <span className="text-xs text-ink-700">{server.config.type || 'stdio'}</span>
                      </div>
                      {server.config.command && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted">{t('mcp.view.command')}</span>
                          <span className="text-xs text-ink-700 font-mono">{server.config.command}</span>
                        </div>
                      )}
                      {server.config.args && server.config.args.length > 0 && (
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-xs text-muted">{t('mcp.view.args')}</span>
                          <span className="text-xs text-ink-700 font-mono text-right">
                            {server.config.args.join(' ')}
                          </span>
                        </div>
                      )}
                      {server.config.url && (
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-xs text-muted">{t('mcp.view.url')}</span>
                          <span className="text-xs text-ink-700 font-mono text-right break-all">
                            {server.config.url}
                          </span>
                        </div>
                      )}
                      {server.config.description && (
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-xs text-muted">{t('mcp.view.description')}</span>
                          <span className="text-xs text-ink-700 text-right">{server.config.description}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 添加/编辑表单 - 左右50%分栏 */}
      {(viewMode === 'add' || viewMode === 'edit') && (
        <div className="flex gap-6">
          {/* 左侧：表单编辑区 - 占50% */}
          <div className="w-1/2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-ink-900">
                {viewMode === 'add' ? t('mcp.form.addTitle') : t('mcp.form.editTitle')}
              </h2>
              <button
                onClick={handleCancel}
                className="p-1.5 rounded-full text-muted hover:bg-surface-tertiary hover:text-ink-700 transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            {/* 从模板快速添加 */}
            {viewMode === 'add' && Object.keys(templates).length > 0 && (
              <div className="p-3 rounded-xl bg-surface-secondary border border-ink-900/10">
                <h3 className="text-xs font-medium text-muted mb-2">{t('mcp.templates.title')}</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(templates).map(([key, template]) => (
                    <button
                      key={key}
                      onClick={() => handleFromTemplate(key)}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-ink-900/10 text-xs text-ink-700 hover:border-accent/50 hover:text-accent transition-colors"
                    >
                      {template.displayName || key}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 服务器名称 */}
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted">{t('mcp.form.name.label')}</span>
              <input
                type="text"
                className={`rounded-xl border px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors ${
                  viewMode === 'edit' ? 'bg-surface border-ink-900/10' : 'bg-surface-secondary border-ink-900/10'
                }`}
                placeholder={t('mcp.form.name.placeholder')}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={viewMode === 'edit'}
                required
              />
            </label>

            {/* 显示名称 */}
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted">{t('mcp.form.displayName.label')}</span>
              <input
                type="text"
                className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                placeholder={t('mcp.form.displayName.placeholder')}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>

            {/* 服务器类型 */}
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted">{t('mcp.form.type.label')}</span>
              <select
                className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                value={serverType}
                onChange={(e) => setServerType(e.target.value as any)}
              >
                <option value="stdio">{t('mcp.form.type.stdio')}</option>
                <option value="sse">{t('mcp.form.type.sse')}</option>
                <option value="streamableHttp">{t('mcp.form.type.streamableHttp')}</option>
              </select>
            </label>

            {/* stdio 类型：命令和参数 */}
            {serverType === 'stdio' && (
              <>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted">{t('mcp.form.command.label')}</span>
                  <input
                    type="text"
                    className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                    placeholder={t('mcp.form.command.placeholder')}
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    required
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted">{t('mcp.form.args.label')}</span>
                  <input
                    type="text"
                    className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                    placeholder={t('mcp.form.args.placeholder')}
                    value={args}
                    onChange={(e) => setArgs(e.target.value)}
                  />
                </label>
              </>
            )}

            {/* SSE/HTTP 类型：URL */}
            {(serverType === 'sse' || serverType === 'streamableHttp') && (
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-muted">{t('mcp.form.url.label')}</span>
                <input
                  type="url"
                  className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                  placeholder={t('mcp.form.url.placeholder')}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </label>
            )}

            {/* 描述 */}
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted">{t('mcp.form.description.label')}</span>
              <input
                type="text"
                className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                placeholder={t('mcp.form.description.placeholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            {/* 错误/成功提示 */}
            {error && (
              <div className="rounded-xl border border-error/20 bg-error-light px-3 py-2 text-sm text-error">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-success/20 bg-success-light px-3 py-2 text-sm text-success">
                {t('mcp.errors.saveSuccess')}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-xl border border-ink-900/10 bg-surface px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-surface-tertiary transition-colors"
                onClick={handleCancel}
                disabled={saving}
              >
                {t('mcp.actions.cancel')}
              </button>
              <button
                className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? t('mcp.actions.saving') : t('mcp.actions.save')}
              </button>
            </div>
          </div>

          {/* 右侧：配置预览和说明 - 占50% */}
          <div className="w-1/2 space-y-4">
            <h3 className="text-lg font-medium text-ink-900">配置预览</h3>

            {/* JSON配置预览 */}
            <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4">
              <h4 className="text-xs font-medium text-muted mb-2">JSON 配置</h4>
              <pre className="text-xs bg-surface rounded-lg p-3 overflow-x-auto text-muted font-mono leading-relaxed">
                {JSON.stringify({
                  name: editName || 'server-name',
                  displayName: displayName || undefined,
                  type: serverType,
                  ...(serverType === 'stdio' ? {
                    command: command || 'command',
                    args: args ? args.split(/\s+/) : undefined
                  } : {}),
                  ...(serverType !== 'stdio' ? { url: url || 'https://example.com/mcp' } : {}),
                  description: description || undefined,
                }, null, 2)}
              </pre>
            </div>

            {/* 配置说明 */}
            <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4">
              <h4 className="text-xs font-medium text-muted mb-2">配置说明</h4>
              <div className="text-xs text-ink-700 space-y-2 leading-relaxed">
                <div>
                  <strong className="text-ink-900">服务器类型：</strong>
                  {serverType === 'stdio' && ' 标准输入输出，使用本地命令'}
                  {serverType === 'sse' && ' 服务器发送事件，通过 HTTP 连接'}
                  {serverType === 'streamableHttp' && ' 可流式 HTTP，支持长连接'}
                </div>
                {serverType === 'stdio' && (
                  <>
                    <div><strong className="text-ink-900">命令：</strong>执行的程序路径（如 npx）</div>
                    <div><strong className="text-ink-900">参数：</strong>空格分隔的参数列表</div>
                  </>
                )}
                {(serverType === 'sse' || serverType === 'streamableHttp') && (
                  <div><strong className="text-ink-900">URL：</strong>MCP 服务器地址</div>
                )}
                <div className="mt-3 pt-3 border-t border-ink-900/10">
                  <p className="text-muted text-xs">配置保存位置：<code className="px-1 py-0.5 rounded bg-ink-900/5">{t('mcp.hintPath')}</code></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 说明文字 */}
      <aside className="p-4 rounded-xl bg-surface-secondary border border-ink-900/5">
        <p className="text-xs text-muted">
          <strong>{t('mcp.hint')}</strong>
          <code className="px-1 py-0.5 rounded bg-ink-900/5">{t('mcp.hintPath')}</code>
        </p>
      </aside>
    </section>
  );
}
