/**
 * Agents 管理区域
 * 支持全局配置和自定义 Agent 管理
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
// Radix UI Tooltip components
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";

// Agent 配置接口
interface AgentConfig {
  id: string;
  name: string;
  description: string;
  type: 'builtin' | 'custom';
  systemPrompt: string;
  maxSubAgents?: number;
  timeoutSeconds?: number;
  allowedTools?: string[];
  allowedMcpServers?: string[];
  enableMemory?: boolean;
  memoryCapacity?: number;
  createdAt?: number;
  updatedAt?: number;
}

// 全局配置接口
interface GlobalConfig {
  maxSubAgents: number;
  defaultAgentId: string;
  autoEnableSubAgents: boolean;
  timeoutSeconds: number;
}

// 编排配置接口
interface OrchestrationConfig {
  mode: 'parallel' | 'sequential' | 'alternating' | 'cyclic';
  agentSequence: string[];
  maxConcurrency?: number;
  cycleCount?: number;
  stopOnFailure?: boolean;
  agentTimeout?: number;
  enableAggregation?: boolean;
  aggregationStrategy?: 'first' | 'all' | 'majority' | 'concatenate';
}

// 视图模式
type ViewMode = 'list' | 'create' | 'edit';

// 内置 Agent 模板
const BUILTIN_AGENTS = [
  { id: 'general-purpose', name: '通用型', description: '适用于大多数任务，平衡处理能力和成本' },
  { id: 'explore', name: '探索型', description: '擅长信息收集和探索，适合研究类任务' },
  { id: 'code', name: '代码型', description: '专注于代码相关任务，对编程问题优化' },
];

export function AgentsSection() {
  const { t } = useTranslation();

  // 全局配置状态
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({
    maxSubAgents: 3,
    defaultAgentId: 'general-purpose',
    autoEnableSubAgents: true,
    timeoutSeconds: 300,
  });

  // 编排配置状态
  const [orchestration, setOrchestration] = useState<OrchestrationConfig>({
    mode: 'parallel',
    agentSequence: [],
    maxConcurrency: 3,
    cycleCount: 1,
    stopOnFailure: true,
    agentTimeout: 300,
    enableAggregation: true,
    aggregationStrategy: 'all',
  });
  const [orchestrationHasChanges, setOrchestrationHasChanges] = useState(false);

  // Agents 列表状态
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 视图模式
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);

  // 新建/编辑表单状态
  const [form, setForm] = useState({
    id: '',
    name: '',
    description: '',
    systemPrompt: '',
    maxSubAgents: 3,
    timeoutSeconds: 300,
    allowedTools: [] as string[],
    allowedMcpServers: [] as string[],
    enableMemory: true,
    memoryCapacity: 100,
  });

  // 加载配置（批量加载优化：单次 IPC 调用获取所有配置）
  useEffect(() => {
    loadAllConfigs();
  }, []);

  // 批量加载所有 Agent 配置
  const loadAllConfigs = async () => {
    setLoading(true);
    try {
      const configs = await window.electron.getAllAgentConfigs();
      setGlobalConfig(configs.globalConfig);
      setOrchestration(configs.orchestrationConfig);
      setAgents(configs.agentsList);
    } catch (err) {
      console.error('Failed to load agent configs:', err);
    } finally {
      setLoading(false);
    }
  };

  // 加载编排配置（单独调用，用于配置更新后刷新）
  const loadOrchestrationConfig = async () => {
    try {
      const config = await window.electron.getOrchestrationConfig();
      setOrchestration(config);
    } catch (err) {
      console.error('Failed to load orchestration config:', err);
    }
  };

  // 自动清除成功提示
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // 加载全局配置（单独调用，用于配置更新后刷新）
  const loadGlobalConfig = async () => {
    setLoading(true);
    try {
      const config = await window.electron.getGlobalAgentConfig();
      setGlobalConfig(config);
    } catch (err) {
      console.error('Failed to load global config:', err);
    } finally {
      setLoading(false);
    }
  };

  // 加载 Agents 列表（单独调用，用于列表更新后刷新）
  const loadAgentsList = async () => {
    try {
      const list = await window.electron.getAgentsList();
      setAgents(list);
    } catch (err) {
      console.error('Failed to load agents list:', err);
    }
  };

  // 更新全局配置
  const updateGlobalConfig = (key: keyof GlobalConfig, value: GlobalConfig[keyof GlobalConfig]) => {
    setGlobalConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSuccess(false);
  };

  // 保存全局配置
  const handleSaveGlobalConfig = async () => {
    setError(null);
    setSaving(true);

    try {
      const result = await window.electron.saveGlobalAgentConfig(globalConfig);
      if (result.success) {
        // 保存成功后从服务器刷新配置，确保数据同步
        await loadGlobalConfig();
        setSuccess(true);
        setHasChanges(false);
      } else {
        setError(result.error || '保存失败');
      }
    } catch (err) {
      setError('保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  // 重置全局配置
  const handleResetGlobalConfig = () => {
    setGlobalConfig({
      maxSubAgents: 3,
      defaultAgentId: 'general-purpose',
      autoEnableSubAgents: true,
      timeoutSeconds: 300,
    });
    setHasChanges(true);
  };

  // 更新编排配置
  const updateOrchestration = (key: keyof OrchestrationConfig, value: OrchestrationConfig[keyof OrchestrationConfig]) => {
    setOrchestration(prev => ({ ...prev, [key]: value }));
    setOrchestrationHasChanges(true);
    setSuccess(false);
  };

  // 保存编排配置
  const handleSaveOrchestrationConfig = async () => {
    setError(null);
    setSaving(true);

    try {
      const result = await window.electron.saveOrchestrationConfig(orchestration);
      if (result.success) {
        // 保存成功后从服务器刷新配置，确保数据同步
        await loadOrchestrationConfig();
        setSuccess(true);
        setOrchestrationHasChanges(false);
      } else {
        setError(result.error || '保存失败');
      }
    } catch (err) {
      setError('保存编排配置失败');
    } finally {
      setSaving(false);
    }
  };

  // 重置编排配置
  const handleResetOrchestrationConfig = () => {
    setOrchestration({
      mode: 'parallel',
      agentSequence: [],
      maxConcurrency: 3,
      cycleCount: 1,
      stopOnFailure: true,
      agentTimeout: 300,
      enableAggregation: true,
      aggregationStrategy: 'all',
    });
    setOrchestrationHasChanges(true);
  };

  // 创建 Agent
  const handleCreateAgent = async () => {
    setError(null);
    setSaving(true);

    try {
      const result = await window.electron.createAgent(form);
      if (result.success) {
        setSuccess(true);
        setViewMode('list');
        resetForm();
        loadAgentsList();
      } else {
        setError(result.error || '创建失败');
      }
    } catch (err) {
      setError('创建 Agent 失败');
    } finally {
      setSaving(false);
    }
  };

  // 更新 Agent
  const handleUpdateAgent = async () => {
    if (!editingAgent) return;

    setError(null);
    setSaving(true);

    try {
      const result = await window.electron.updateAgent(editingAgent.id, form);
      if (result.success) {
        setSuccess(true);
        setViewMode('list');
        resetForm();
        setEditingAgent(null);
        loadAgentsList();
      } else {
        setError(result.error || '更新失败');
      }
    } catch (err) {
      setError('更新 Agent 失败');
    } finally {
      setSaving(false);
    }
  };

  // 删除 Agent
  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('确定要删除这个 Agent 吗？')) {
      return;
    }

    try {
      const result = await window.electron.deleteAgent(agentId);
      if (result.success) {
        loadAgentsList();
      } else {
        setError(result.error || '删除失败');
      }
    } catch (err) {
      setError('删除 Agent 失败');
    }
  };

  // 编辑 Agent
  const handleEditAgent = async (agentId: string) => {
    try {
      const detail = await window.electron.getAgentDetail(agentId);
      if (detail) {
        setEditingAgent(detail);
        setForm({
          id: detail.id,
          name: detail.name,
          description: detail.description,
          systemPrompt: detail.systemPrompt,
          maxSubAgents: detail.maxSubAgents || 3,
          timeoutSeconds: detail.timeoutSeconds || 300,
          allowedTools: detail.allowedTools || [],
          allowedMcpServers: detail.allowedMcpServers || [],
          enableMemory: detail.enableMemory ?? true,
          memoryCapacity: detail.memoryCapacity || 100,
        });
        setViewMode('edit');
      }
    } catch (err) {
      setError('加载 Agent 详情失败');
    }
  };

  // 重置表单
  const resetForm = () => {
    setForm({
      id: '',
      name: '',
      description: '',
      systemPrompt: '',
      maxSubAgents: 3,
      timeoutSeconds: 300,
      allowedTools: [],
      allowedMcpServers: [],
      enableMemory: true,
      memoryCapacity: 100,
    });
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setViewMode('list');
    resetForm();
    setEditingAgent(null);
    setError(null);
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-ink-900">{t('agents.title')}</h1>
          <p className="mt-2 text-sm text-muted">
            {t('agents.description')}
          </p>
        </header>

        <div className="flex items-center justify-center py-12">
          <svg aria-hidden="true" className="w-8 h-8 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </section>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-ink-900">{t('agents.title')}</h1>
          <p className="mt-2 text-sm text-muted">
            {t('agents.description')}
          </p>
        </header>

      {/* 全局配置 */}
      <div className="p-4 rounded-xl border border-ink-900/10 bg-surface">
        <h2 className="text-sm font-medium text-ink-900 mb-4">全局配置</h2>

        <div className="space-y-4">
          {/* 最大子代理数量 */}
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted">最大子代理数量</label>
            <input
              type="range"
              min="1"
              max="10"
              value={globalConfig.maxSubAgents}
              onChange={(e) => updateGlobalConfig('maxSubAgents', parseInt(e.target.value))}
              className="w-full h-2 bg-ink-900/10 rounded-lg appearance-none cursor-pointer accent"
            />
            <div className="flex items-center justify-between text-xs text-muted">
              <span>1</span>
              <span className="text-accent font-medium">{globalConfig.maxSubAgents}</span>
              <span>10</span>
            </div>
          </div>

          {/* 默认 Agent 类型 */}
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted">默认 Agent 类型</label>
            <select
              className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
              value={globalConfig.defaultAgentId}
              onChange={(e) => updateGlobalConfig('defaultAgentId', e.target.value)}
            >
              {BUILTIN_AGENTS.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
              {agents.filter(a => a.type === 'custom').map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name} (自定义)</option>
              ))}
            </select>
          </div>

          {/* 超时设置 */}
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted">子代理超时时间（秒）</label>
            <input
              type="number"
              min="30"
              max="600"
              step="30"
              value={globalConfig.timeoutSeconds}
              onChange={(e) => updateGlobalConfig('timeoutSeconds', parseInt(e.target.value) || 300)}
              className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
            />
          </div>

          {/* 自动启用开关 */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={globalConfig.autoEnableSubAgents}
                  onChange={(e) => updateGlobalConfig('autoEnableSubAgents', e.target.checked)}
                />
                <div className="w-9 h-5 bg-ink-900/20 rounded-full peer-checked:bg-accent transition-colors"></div>
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4"></div>
              </div>
              <div>
                <span className="text-sm text-ink-700">自动启用子代理</span>
                <p className="text-xs text-muted">启用后，Task 工具将自动使用子代理并行处理</p>
              </div>
            </label>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleSaveGlobalConfig}
              disabled={saving || !hasChanges}
            >
              {saving ? '保存中...' : '保存全局配置'}
            </button>
            <button
              className="rounded-xl border border-ink-900/10 bg-surface px-4 py-2.5 text-sm text-ink-700 hover:bg-surface-tertiary transition-colors"
              onClick={handleResetGlobalConfig}
              disabled={saving}
            >
              重置
            </button>
          </div>
        </div>
      </div>

      {/* Agent 编排配置 */}
      <div className="p-4 rounded-xl border border-ink-900/10 bg-surface">
        <h2 className="text-sm font-medium text-ink-900 mb-4">Agent 编排配置</h2>

        <div className="space-y-4">
          {/* 编排模式选择 */}
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted">编排模式</label>
            <select
              className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
              value={orchestration.mode}
              onChange={(e) => updateOrchestration('mode', e.target.value as OrchestrationConfig['mode'])}
            >
              <option value="parallel">并发 (Parallel)</option>
              <option value="sequential">串行 (Sequential)</option>
              <option value="alternating">交替 (Alternating)</option>
              <option value="cyclic">循环 (Cyclic)</option>
            </select>
            <p className="text-xs text-muted-light">
              {orchestration.mode === 'parallel' && '并发模式：所有 Agent 同时执行任务，适合处理独立任务'}
              {orchestration.mode === 'sequential' && '串行模式：按顺序执行 Agent，每个 Agent 的输出会传递给下一个'}
              {orchestration.mode === 'alternating' && '交替模式：在 Agent 之间交替执行，适合需要多种视角的任务'}
              {orchestration.mode === 'cyclic' && '循环模式：循环执行 Agent，适合需要反复验证的场景'}
            </p>
          </div>

          {/* Agent 序列配置 */}
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted">Agent 执行序列</label>
            <div className="p-3 rounded-lg border border-ink-900/10 bg-surface-secondary min-h-[80px]">
              {orchestration.agentSequence.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">
                  从下方选择要添加到序列中的 Agent
                </p>
              ) : (
                <div className="space-y-2">
                  {orchestration.agentSequence.map((agentId, index) => {
                    const agent = [...BUILTIN_AGENTS, ...agents].find(a => a.id === agentId);
                    return (
                      <div key={agentId} className="flex items-center justify-between p-2 rounded bg-surface">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted w-6">{index + 1}.</span>
                          <span className="text-sm text-ink-900">{agent?.name || agentId}</span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="text-xs text-error hover:text-error-hover cursor-pointer"
                              onClick={() => {
                                const newSequence = orchestration.agentSequence.filter(id => id !== agentId);
                                updateOrchestration('agentSequence', newSequence);
                              }}
                            >
                              移除
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-ink-900 text-white text-xs px-3 py-1.5 rounded-md shadow-lg">
                            <p>从序列中移除此Agent</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 添加 Agent 到序列 */}
            <div className="flex gap-2 flex-wrap">
              {BUILTIN_AGENTS.map(agent => (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      key={agent.id}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        orchestration.agentSequence.includes(agent.id)
                          ? 'bg-accent text-white'
                          : 'bg-surface-secondary text-ink-700 hover:bg-ink-900/5'
                      }`}
                      onClick={() => {
                        if (!orchestration.agentSequence.includes(agent.id)) {
                          updateOrchestration('agentSequence', [...orchestration.agentSequence, agent.id]);
                        }
                      }}
                    >
                      {agent.name}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-ink-900 text-white text-xs px-3 py-1.5 rounded-md shadow-lg">
                    <p>将{agent.name}添加到序列</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {agents.filter(a => a.type === 'custom').map(agent => (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      key={agent.id}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        orchestration.agentSequence.includes(agent.id)
                          ? 'bg-accent text-white'
                          : 'bg-surface-secondary text-ink-700 hover:bg-ink-900/5'
                      }`}
                      onClick={() => {
                        if (!orchestration.agentSequence.includes(agent.id)) {
                          updateOrchestration('agentSequence', [...orchestration.agentSequence, agent.id]);
                        }
                      }}
                    >
                      {agent.name}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-ink-900 text-white text-xs px-3 py-1.5 rounded-md shadow-lg">
                    <p>将{agent.name}添加到序列</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* 根据模式显示特定配置 */}
          {orchestration.mode === 'parallel' && (
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted">最大并发数</label>
              <input
                type="number"
                min="1"
                max="10"
                value={orchestration.maxConcurrency || 3}
                onChange={(e) => updateOrchestration('maxConcurrency', parseInt(e.target.value) || 3)}
                className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
              />
            </div>
          )}

          {orchestration.mode === 'cyclic' && (
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted">循环次数 (0 = 无限循环)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={orchestration.cycleCount || 1}
                onChange={(e) => updateOrchestration('cycleCount', parseInt(e.target.value) || 1)}
                className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
              />
            </div>
          )}

          {/* 通用配置 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted">Agent 超时时间（秒）</label>
              <input
                type="number"
                min="10"
                max="600"
                value={orchestration.agentTimeout || 300}
                onChange={(e) => updateOrchestration('agentTimeout', parseInt(e.target.value) || 300)}
                className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted">聚合策略</label>
              <select
                className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                value={orchestration.aggregationStrategy || 'all'}
                onChange={(e) => updateOrchestration('aggregationStrategy', e.target.value as OrchestrationConfig['aggregationStrategy'])}
              >
                <option value="first">首个结果</option>
                <option value="all">全部结果</option>
                <option value="majority">多数结果</option>
                <option value="concatenate">合并结果</option>
              </select>
            </div>
          </div>

          {/* 开关配置 */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={orchestration.stopOnFailure ?? true}
                  onChange={(e) => updateOrchestration('stopOnFailure', e.target.checked)}
                />
                <div className="w-9 h-5 bg-ink-900/20 rounded-full peer-checked:bg-accent transition-colors"></div>
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4"></div>
              </div>
              <div>
                <span className="text-sm text-ink-700">失败时停止</span>
                <p className="text-xs text-muted">任一 Agent 失败时停止整个流程</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={orchestration.enableAggregation ?? true}
                  onChange={(e) => updateOrchestration('enableAggregation', e.target.checked)}
                />
                <div className="w-9 h-5 bg-ink-900/20 rounded-full peer-checked:bg-accent transition-colors"></div>
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4"></div>
              </div>
              <div>
                <span className="text-sm text-ink-700">启用结果聚合</span>
                <p className="text-xs text-muted">根据聚合策略处理多个 Agent 的结果</p>
              </div>
            </label>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleSaveOrchestrationConfig}
              disabled={saving || !orchestrationHasChanges}
            >
              {saving ? '保存中...' : '保存编排配置'}
            </button>
            <button
              className="rounded-xl border border-ink-900/10 bg-surface px-4 py-2.5 text-sm text-ink-700 hover:bg-surface-tertiary transition-colors"
              onClick={handleResetOrchestrationConfig}
              disabled={saving}
            >
              重置
            </button>
          </div>
        </div>
      </div>

      {/* 自定义 Agents 管理 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-ink-900">自定义 Agents</h2>
          {viewMode === 'list' && (
            <button
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors"
              onClick={() => setViewMode('create')}
            >
              + 新建 Agent
            </button>
          )}
        </div>

        {/* 列表视图 */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {/* 内置 Agents */}
            <div className="p-3 rounded-xl border border-ink-900/5 bg-surface-secondary">
              <h3 className="text-xs font-medium text-muted mb-2">内置 Agents</h3>
              <div className="space-y-2">
                {BUILTIN_AGENTS.map(agent => (
                  <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-surface">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-ink-900">{agent.name}</h4>
                      <p className="text-xs text-muted">{agent.description}</p>
                    </div>
                    <span className="text-xs text-muted px-2 py-1 rounded-full bg-ink-900/5">内置</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 自定义 Agents */}
            <div className="p-3 rounded-xl border border-ink-900/5 bg-surface-secondary">
              <h3 className="text-xs font-medium text-muted mb-2">自定义 Agents</h3>
              {agents.filter(a => a.type === 'custom').length === 0 ? (
                <p className="text-xs text-muted text-center py-4">暂无自定义 Agent</p>
              ) : (
                <div className="space-y-2">
                  {agents.filter(a => a.type === 'custom').map(agent => (
                    <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-surface">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-ink-900">{agent.name}</h4>
                        <p className="text-xs text-muted truncate">{agent.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="text-xs text-accent hover:text-accent-hover px-2 py-1 cursor-pointer"
                              onClick={() => handleEditAgent(agent.id)}
                            >
                              编辑
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-ink-900 text-white text-xs px-3 py-1.5 rounded-md shadow-lg">
                            <p>编辑此自定义Agent</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="text-xs text-error hover:text-error-hover px-2 py-1 cursor-pointer"
                              onClick={() => handleDeleteAgent(agent.id)}
                            >
                              删除
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-ink-900 text-white text-xs px-3 py-1.5 rounded-md shadow-lg">
                            <p>删除此自定义Agent</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 创建/编辑视图 - 50-50 分栏布局 */}
        {(viewMode === 'create' || viewMode === 'edit') && (
          <div className="flex gap-6">
            {/* 左侧：表单编辑区 - 占50% */}
            <div className="w-1/2 space-y-4">
              <h3 className="text-lg font-medium text-ink-900">
                {viewMode === 'create' ? '创建自定义 Agent' : '编辑 Agent'}
              </h3>

              {/* Agent ID (仅创建时显示) */}
              {viewMode === 'create' && (
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-muted">Agent ID</label>
                  <input
                    type="text"
                    className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                    placeholder="例如：my-custom-agent"
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                  />
                  <p className="text-xs text-muted-light">唯一标识符，只能包含字母、数字、连字符和下划线</p>
                </div>
              )}

              {/* 名称 */}
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted">显示名称</label>
                <input
                  type="text"
                  className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                  placeholder="例如：数据分析专家"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* 描述 */}
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted">描述</label>
                <input
                  type="text"
                  className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                  placeholder="简要描述这个 Agent 的用途"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* 系统提示词 */}
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted">系统提示词</label>
                <textarea
                  className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors min-h-[120px]"
                  placeholder="定义 Agent 的行为和角色..."
                  value={form.systemPrompt}
                  onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                />
                <p className="text-xs text-muted-light">长度：{form.systemPrompt.length} / 10000</p>
              </div>

              {/* 参数设置 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-muted">最大子代理数</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={form.maxSubAgents}
                    onChange={(e) => setForm({ ...form, maxSubAgents: parseInt(e.target.value) || 3 })}
                    className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-muted">超时时间（秒）</label>
                  <input
                    type="number"
                    min="30"
                    max="600"
                    step="30"
                    value={form.timeoutSeconds}
                    onChange={(e) => setForm({ ...form, timeoutSeconds: parseInt(e.target.value) || 300 })}
                    className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                  />
                </div>
              </div>

              {/* 记忆设置 */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={form.enableMemory}
                      onChange={(e) => setForm({ ...form, enableMemory: e.target.checked })}
                    />
                    <div className="w-9 h-5 bg-ink-900/20 rounded-full peer-checked:bg-accent transition-colors"></div>
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4"></div>
                  </div>
                  <div>
                    <span className="text-sm text-ink-700">启用记忆</span>
                    <p className="text-xs text-muted">允许 Agent 记住之前的对话内容</p>
                  </div>
                </label>
                {form.enableMemory && (
                  <div className="mt-3 grid gap-1.5">
                    <label className="text-xs font-medium text-muted">记忆容量</label>
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      value={form.memoryCapacity}
                      onChange={(e) => setForm({ ...form, memoryCapacity: parseInt(e.target.value) || 100 })}
                      className="rounded-xl border border-ink-900/10 bg-surface-secondary px-3 py-2 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-2">
                <button
                  className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={viewMode === 'create' ? handleCreateAgent : handleUpdateAgent}
                  disabled={saving || !form.id || !form.name || !form.systemPrompt}
                >
                  {saving ? '保存中...' : (viewMode === 'create' ? '创建 Agent' : '保存修改')}
                </button>
                <button
                  className="rounded-xl border border-ink-900/10 bg-surface px-4 py-2.5 text-sm text-ink-700 hover:bg-surface-tertiary transition-colors"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  取消
                </button>
              </div>
            </div>

            {/* 右侧：配置预览和说明 - 占50% */}
            <div className="w-1/2 space-y-4">
              <h3 className="text-lg font-medium text-ink-900">配置预览</h3>

              {/* JSON 配置预览 */}
              <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4">
                <h4 className="text-xs font-medium text-muted mb-2">JSON 配置</h4>
                <pre className="text-xs bg-surface rounded-lg p-3 overflow-x-auto text-muted font-mono leading-relaxed">
                  {JSON.stringify({
                    id: form.id || 'agent-id',
                    name: form.name || 'Agent Name',
                    description: form.description || 'Agent description',
                    systemPrompt: form.systemPrompt.substring(0, 100) + (form.systemPrompt.length > 100 ? '...' : ''),
                    maxSubAgents: form.maxSubAgents,
                    timeoutSeconds: form.timeoutSeconds,
                    enableMemory: form.enableMemory,
                    memoryCapacity: form.memoryCapacity,
                  }, null, 2)}
                </pre>
              </div>

              {/* Agent 说明 */}
              <div className="rounded-xl border border-ink-900/10 bg-surface-secondary p-4">
                <h4 className="text-xs font-medium text-muted mb-2">Agent 说明</h4>
                <div className="text-xs text-ink-700 space-y-2 leading-relaxed">
                  <div>
                    <strong className="text-ink-900">Agent ID：</strong>唯一标识符
                  </div>
                  <div>
                    <strong className="text-ink-900">系统提示词：</strong>定义 Agent 的行为和角色
                  </div>
                  <div>
                    <strong className="text-ink-900">最大子代理数：</strong>{form.maxSubAgents} 个
                  </div>
                  <div>
                    <strong className="text-ink-900">超时时间：</strong>{form.timeoutSeconds} 秒
                  </div>
                  <div className="mt-3 pt-3 border-t border-ink-900/10">
                    <p className="text-muted text-xs">配置保存位置：<code className="px-1 py-0.5 rounded bg-ink-900/5">userData/agents/</code></p>
                  </div>
                </div>
              </div>

              {/* 使用提示 */}
              <div className="rounded-xl border border-accent/20 bg-accent-light p-4">
                <h4 className="text-xs font-medium text-accent mb-2">使用提示</h4>
                <ul className="text-xs text-ink-700 space-y-1 leading-relaxed">
                  <li>• Agent ID 创建后不可修改</li>
                  <li>• 系统提示词长度应在 10-10000 字符之间</li>
                  <li>• 子代理数量会影响 API 调用成本</li>
                  <li>• 启用记忆会增加 Token 消耗</li>
                </ul>
              </div>
            </div>
          </div>
        )}
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
          操作成功
        </div>
      )}

      {/* 说明卡片 */}
      <div className="grid gap-4">
        <div className="p-4 rounded-xl border border-ink-900/10 bg-surface">
          <h3 className="text-sm font-medium text-ink-900 mb-2">SubAgents（子代理）</h3>
          <p className="text-xs text-muted mb-3">
            SubAgents 是 Claude Agent SDK 的核心功能，允许同时启动多个子代理并行处理任务。
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <p className="text-xs text-muted">
                <strong>并行处理</strong>：最多可同时启动 10 个子代理，显著提高处理效率
              </p>
            </div>
            <div className="flex items-start gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9" />
                <path d="M9 18v6" />
              </svg>
              <p className="text-xs text-muted">
                <strong>自动协调</strong>：主代理自动分配和协调子代理的任务
              </p>
            </div>
            <div className="flex items-start gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5" />
              </svg>
              <p className="text-xs text-muted">
                <strong>成本考虑</strong>：子代理数量会线性增加 API 调用成本（N×）
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-ink-900/10 bg-surface">
          <h3 className="text-sm font-medium text-ink-900 mb-2">使用方式</h3>
          <p className="text-xs text-muted mb-3">
            Agents 通过分布式任务编排（Distributed Task Orchestrator）自动管理。
          </p>
          <div className="bg-surface-secondary rounded-lg p-3">
            <p className="text-xs text-muted mb-2">在对话中使用：</p>
            <code className="block text-xs bg-ink-900/5 px-2 py-1 rounded text-muted">
              使用 Task 工具并行处理这些任务...
            </code>
          </div>
        </div>
      </div>

      <aside className="p-4 rounded-xl bg-surface-secondary border border-ink-900/5">
        <p className="text-xs text-muted">
          <strong>提示：</strong>Agents 功能由 Claude Agent SDK 自动管理。使用 Task 工具时会自动调用子代理并行处理。
        </p>
      </aside>
    </section>
    </TooltipProvider>
  );
}
