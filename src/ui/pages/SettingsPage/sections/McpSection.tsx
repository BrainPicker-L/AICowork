/**
 * MCP 设置区域 - 简化版
 * 用户只需输入服务器名称和 JSON 配置
 */

import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp, Wifi, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";
import * as Dialog from "@radix-ui/react-dialog";

interface McpServerConfig {
  name: string;
  [key: string]: any;  // 允许任意 JSON 配置
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

  // 表单状态
  const [displayName, setDisplayName] = useState<string>('');
  const [jsonConfig, setJsonConfig] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [, setEditingServer] = useState<ServerListItem | null>(null);

  // 展开/折叠状态
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());
  
  // 测试连接状态
  const [testingServers, setTestingServers] = useState<Set<string>>(new Set());
  
  // 工具列表状态
  const [serverTools, setServerTools] = useState<Map<string, Array<{ name: string; description?: string }>>>(new Map());
  
  // 弹框状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<{
    serverName: string;
    testResult: { success: boolean; message: string; details?: string };
    tools: Array<{ name: string; description?: string }>;
  } | null>(null);

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

  // 重置表单
  const resetForm = () => {
    setDisplayName('');
    setJsonConfig('');
    setError(null);
    setSuccess(false);
  };

  // 新建服务器
  const handleAdd = () => {
    setViewMode('add');
    setEditingServer(null);
    resetForm();
    // 提供示例配置（完整的 mcpServers 格式）
    setJsonConfig(JSON.stringify({
      mcpServers: {
        "github-mcp-server": {
          type: "stdio",
          command: "npx",
          args: ["@modelcontextprotocol/server-github"],
          env: {
            GITHUB_TOKEN: "your-token-here"
          }
        }
      }
    }, null, 2));
  };

  // 编辑服务器
  const handleEdit = (server: ServerListItem) => {
    setEditingServer(server);
    
    // 提取 displayName
    const { name, displayName: existingDisplayName, ...configWithoutNameAndDisplayName } = server.config;
    setDisplayName(existingDisplayName || '');
    
    // 构造完整的 mcpServers 格式（不包含 displayName，因为它会单独输入）
    const fullConfig = {
      mcpServers: {
        [server.name]: configWithoutNameAndDisplayName
      }
    };
    setJsonConfig(JSON.stringify(fullConfig, null, 2));
    setError(null);
    setViewMode('edit');
  };


  // 保存服务器
  const handleSave = async () => {
    setError(null);

    // 验证 JSON 配置
    let parsedConfig: any;
    try {
      parsedConfig = JSON.parse(jsonConfig);
    } catch (e) {
      setError(t('mcp.errors.invalidJson'));
      return;
    }

    // 确保配置是对象
    if (typeof parsedConfig !== 'object' || parsedConfig === null || Array.isArray(parsedConfig)) {
      setError('配置必须是对象格式');
      return;
    }

    // 检查是否包含 mcpServers 字段
    if (!parsedConfig.mcpServers || typeof parsedConfig.mcpServers !== 'object') {
      setError('配置必须包含 mcpServers 字段，格式：{ "mcpServers": { "server-name": {...} } }');
      return;
    }

    // 提取第一个服务器配置
    const serverEntries = Object.entries(parsedConfig.mcpServers);
    if (serverEntries.length === 0) {
      setError('mcpServers 对象不能为空');
      return;
    }

    if (serverEntries.length > 1) {
      setError('一次只能添加一个服务器，请确保 mcpServers 对象中只有一个服务器配置');
      return;
    }

    const [serverName, serverConfig] = serverEntries[0];

    // 确保服务器配置是对象
    if (typeof serverConfig !== 'object' || serverConfig === null || Array.isArray(serverConfig)) {
      setError('服务器配置必须是对象');
      return;
    }

    setSaving(true);

    try {
      // 构建最终配置
      const finalConfig = { ...serverConfig } as any;
      
      // 如果用户填写了别名，添加到配置中
      if (displayName.trim()) {
        finalConfig.displayName = displayName.trim();
      }
      
      // 新增服务器时，默认 enabled 为 true（如果配置中没有指定）
      if (viewMode === 'add' && !('enabled' in finalConfig)) {
        finalConfig.enabled = true;
      }
      
      // 调用验证
      const validation = await window.electron.validateMcpServer(finalConfig);
      
      // 显示警告（如果有）
      if (validation.warnings && validation.warnings.length > 0) {
        console.warn('MCP 配置警告:', validation.warnings);
      }
      
      // 如果有错误，阻止保存
      if (!validation.valid) {
        setError(validation.errors.join('; '));
        setSaving(false);
        return;
      }

      const result = await window.electron.saveMcpServer(serverName, finalConfig);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setViewMode('list');
          setEditingServer(null);
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

  // 取消操作
  const handleCancel = () => {
    setViewMode('list');
    setEditingServer(null);
    resetForm();
  };


  // 测试 MCP 服务器连接
  const handleTestConnection = async (server: ServerListItem) => {
    const serverName = server.name;
    setTestingServers(prev => new Set(prev).add(serverName));
    
    try {
      const result = await window.electron.testMcpServer(server.config);
      
      // 如果测试成功，加载工具列表并显示弹框
      if (result.success) {
        let tools: Array<{ name: string; description?: string }> = [];
        try {
          const toolsResult = await window.electron.getMcpServerTools(server.config);
          tools = Array.isArray(toolsResult) ? toolsResult : [];
        } catch (toolsErr) {
          console.error("Failed to get MCP server tools:", toolsErr);
          tools = [];
        }
        
        // 显示弹框
        setDialogData({
          serverName,
          testResult: result,
          tools
        });
        setDialogOpen(true);
        
        // 同时更新本地状态
        setServerTools(prev => {
          const next = new Map(prev);
          next.set(serverName, tools);
          return next;
        });
      } else {
        // 测试失败，显示错误信息
        setError(result.message || '连接测试失败');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error("Failed to test MCP server:", err);
      setError('测试失败: ' + String(err));
      setTimeout(() => setError(null), 3000);
    } finally {
      setTestingServers(prev => {
        const next = new Set(prev);
        next.delete(serverName);
        return next;
      });
    }
  };


  // 切换 MCP 服务器的启用状态
  const handleToggleEnabled = async (serverName: string, currentEnabled: boolean) => {
    try {
      const newEnabled = !currentEnabled;
      const result = await window.electron.toggleMcpServerEnabled(serverName, newEnabled);
      if (result.success) {
        // 重新加载服务器列表以更新 UI
        await loadServers();
      } else {
        setError(result.error || t('mcp.errors.toggleFailed'));
        // 3秒后清除错误
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error("Failed to toggle MCP server:", err);
      setError(t('mcp.errors.toggleFailed'));
      setTimeout(() => setError(null), 3000);
    }
  };

  // 删除 MCP 服务器
  const handleDelete = async (serverName: string) => {
    // 确认删除
    if (!confirm(`确定要删除 MCP 服务器 "${serverName}" 吗？`)) {
      return;
    }

    try {
      const result = await window.electron.deleteMcpServer(serverName);
      if (result.success) {
        // 重新加载服务器列表
        await loadServers();
      } else {
        setError(result.error || '删除失败');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error("Failed to delete MCP server:", err);
      setError('删除失败: ' + String(err));
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <TooltipProvider>
      <section className="space-y-6">
        {/* MCP 测试结果弹框 */}
        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-50" />
            <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-2xl max-h-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl z-50 overflow-y-auto">
              <div className="flex items-start justify-between gap-4 mb-4">
                <Dialog.Title className="text-lg font-semibold text-ink-900">
                  MCP 服务器测试结果
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="rounded-full p-1 text-muted hover:bg-surface-secondary transition-colors">
                    <X className="w-5 h-5" strokeWidth={2} />
                  </button>
                </Dialog.Close>
              </div>

              {dialogData && (
                <div className="space-y-4">
                  {/* 连接信息 */}
                  <div className="rounded-xl border border-success/20 bg-success-light p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                        <Wifi className="w-4 h-4 text-success" strokeWidth={2} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-ink-900 mb-1">
                          {dialogData.testResult.message}
                        </h3>
                        {dialogData.testResult.details && (
                          <p className="text-xs text-muted">
                            {dialogData.testResult.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 工具列表 */}
                  <div>
                    <h3 className="text-sm font-semibold text-ink-900 mb-3">
                      可用工具 ({(dialogData.tools ?? []).length})
                    </h3>
                    {(dialogData.tools ?? []).length === 0 ? (
                      <div className="text-center py-8 text-muted text-sm">
                        该服务器未提供任何工具
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {(dialogData.tools ?? []).map((tool, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-ink-900/10 bg-surface p-3 hover:bg-surface-secondary transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent mt-1.5" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-ink-900 font-mono mb-1">
                                  {tool.name}
                                </div>
                                {tool.description && (
                                  <div className="text-xs text-muted leading-relaxed">
                                    {tool.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 关闭按钮 */}
                  <div className="flex justify-end pt-2">
                    <Dialog.Close asChild>
                      <button className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors">
                        关闭
                      </button>
                    </Dialog.Close>
                  </div>
                </div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <header>
          <h1 className="text-2xl font-semibold text-ink-900">{t('mcp.title')}</h1>
          <p className="mt-2 text-sm text-muted">
            {t('mcp.description')}
          </p>
        </header>

        {/* 列表视图 */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            <button
              className="w-full rounded-xl border-2 border-dashed border-ink-900/20 bg-surface-secondary px-4 py-3 text-sm font-medium text-accent hover:border-accent/50 hover:bg-accent/5 transition-colors"
              onClick={handleAdd}
            >
              {t('mcp.addServer')}
            </button>

            {loading ? (
              <div className="text-center py-8 text-muted">{t('common.loading')}</div>
            ) : servers.length === 0 ? (
              <div className="text-center py-8 text-muted">{t('mcp.noServers')}</div>
            ) : (
              servers.map((server) => {
                const isExpanded = expandedServers.has(server.name);
                return (
                  <div
                    key={server.name}
                    className="rounded-xl border border-ink-900/10 bg-surface overflow-hidden transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => toggleExpand(server.name)}
                          className="flex-shrink-0 p-1 rounded-lg text-muted hover:text-ink-700 hover:bg-surface-tertiary transition-colors cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" strokeWidth={2} />
                          ) : (
                            <ChevronDown className="w-4 h-4" strokeWidth={2} />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-ink-900 truncate">
                            {server.config.displayName || server.name}
                          </h3>
                          {server.config.description && (
                            <p className="text-xs text-muted truncate mt-0.5">
                              {server.config.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Toggle Switch - 启用/禁用开关 */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleToggleEnabled(server.name, server.config.enabled !== false)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                server.config.enabled !== false ? 'bg-accent' : 'bg-ink-900/20'
                              }`}
                              aria-label={server.config.enabled !== false ? t('mcp.status.enabled') : t('mcp.status.disabled')}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
                                  server.config.enabled !== false ? 'translate-x-5' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                            {server.config.enabled !== false ? t('mcp.status.enabled') : t('mcp.status.disabled')}
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleEdit(server)}
                              className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-surface-tertiary transition-colors"
                            >
                              <svg className="w-4 h-4" strokeWidth={2} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                            {t('mcp.actions.edit')}
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleTestConnection(server)}
                              disabled={testingServers.has(server.name)}
                              className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-surface-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {testingServers.has(server.name) ? (
                                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                              ) : (
                                <Wifi className="w-4 h-4" strokeWidth={2} />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                            测试连接
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleDelete(server.name)}
                              className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-error-light transition-colors"
                            >
                              <X className="w-4 h-4" strokeWidth={2} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                            删除服务器
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* 展开的配置详情 */}
                    {isExpanded && (
                      <div className="px-4 pb-3 border-t border-ink-900/10 pt-3 space-y-3">
                        {/* 工具列表 */}
                        {serverTools.has(server.name) && (
                          <div>
                            <h4 className="text-xs font-medium text-muted mb-2">
                              可用工具 ({serverTools.get(server.name)!.length})
                            </h4>
                            <div className="space-y-2">
                              {serverTools.get(server.name)!.map((tool, idx) => (
                                <div
                                  key={idx}
                                  className="bg-surface-secondary rounded-lg p-2 border border-ink-900/10"
                                >
                                  <div className="flex items-start gap-2">
                                    <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-1.5" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium text-ink-900 font-mono">
                                        {tool.name}
                                      </div>
                                      {tool.description && (
                                        <div className="text-xs text-muted mt-0.5">
                                          {tool.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* JSON 配置 */}
                        <div>
                          <h4 className="text-xs font-medium text-muted mb-2">JSON 配置</h4>
                          <pre className="text-xs bg-surface-secondary rounded-lg p-3 overflow-x-auto text-ink-700 font-mono leading-relaxed border border-ink-900/10">
                            {JSON.stringify(
                              (() => {
                                const { name, ...rest } = server.config;
                                return rest;
                              })(),
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 添加/编辑表单 */}
        {(viewMode === 'add' || viewMode === 'edit') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-ink-900">
                {viewMode === 'add' ? t('mcp.form.addTitle') : t('mcp.form.editTitle')}
              </h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleCancel}
                    className="p-1.5 rounded-full text-muted hover:bg-surface-tertiary hover:text-ink-700 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" strokeWidth={2} />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-ink-900 text-white text-xs px-2 py-1 rounded-md">
                  取消操作
                </TooltipContent>
              </Tooltip>
            </div>

            {/* 别名输入框 */}
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted">显示别名（可选）</span>
              <input
                type="text"
                className="rounded-xl border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                placeholder="例如：必应搜索、GitHub 助手"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <p className="text-[10px] text-muted-light">
                为服务器设置一个友好的显示名称，用于前端展示。如果不填写，将使用配置中的服务器名称
              </p>
            </label>

            {/* JSON 配置 */}
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted">MCP 服务器配置</span>
              <textarea
                className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors font-mono resize-none"
                placeholder={`{\n  "mcpServers": {\n    "server-name": {\n      "type": "stdio",\n      "command": "npx",\n      "args": ["@modelcontextprotocol/server-github"]\n    }\n  }\n}`}
                value={jsonConfig}
                onChange={(e) => setJsonConfig(e.target.value)}
                rows={16}
                required
              />
              <p className="text-[10px] text-muted-light">
                粘贴完整的 mcpServers 配置，格式：{`{ "mcpServers": { "服务器名称": {...配置...} } }`}
              </p>
            </label>

            {/* 配置示例 */}
            <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4">
              <h4 className="text-xs font-medium text-muted mb-2">配置示例</h4>
              <div className="space-y-3 text-xs text-ink-700">
                <div>
                  <strong className="text-ink-900">stdio 类型（本地命令）：</strong>
                  <pre className="mt-1 text-[10px] bg-surface rounded-lg p-2 overflow-x-auto font-mono leading-relaxed">
{`{
  "mcpServers": {
    "github-mcp-server": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-token"
      }
    }
  }
}`}
                  </pre>
                </div>
                <div>
                  <strong className="text-ink-900">http 类型（远程 HTTP 服务，推荐）：</strong>
                  <pre className="mt-1 text-[10px] bg-surface rounded-lg p-2 overflow-x-auto font-mono leading-relaxed">
{`{
  "mcpServers": {
    "必应搜索": {
      "httpUrl": "https://mcp.api-inference.modelscope.net/127876a63bfd49/mcp"
    }
  }
}`}
                  </pre>
                </div>
                <div>
                  <strong className="text-ink-900">sse 类型（SSE 服务，旧版）：</strong>
                  <pre className="mt-1 text-[10px] bg-surface rounded-lg p-2 overflow-x-auto font-mono leading-relaxed">
{`{
  "mcpServers": {
    "custom-sse-server": {
      "url": "https://api.example.com/mcp/sse",
      "headers": {
        "Authorization": "Bearer your-token"
      }
    }
  }
}`}
                  </pre>
                </div>
              </div>
            </div>

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
        )}

        {/* 说明文字 */}
        <aside className="p-4 rounded-xl bg-surface-secondary border border-ink-900/5">
          <p className="text-xs text-muted">
            <strong>💡 提示：</strong>
            MCP 服务器配置存储在 <code className="px-1 py-0.5 rounded bg-ink-900/5">~/.qwen/settings.json</code> 中。
            SDK 会自动启动配置的 MCP 服务器并将工具注册到会话中。
          </p>
          <p className="text-xs text-muted mt-2">
            <strong>📖 文档：</strong>
            <a
              href="https://qwenlm.github.io/qwen-code-docs/zh/developers/tools/mcp-server/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline ml-1"
            >
              Qwen Code MCP 服务器配置指南
            </a>
          </p>
        </aside>
      </section>
    </TooltipProvider>
  );
}
