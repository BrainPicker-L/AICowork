/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @Email       None
 *
 * API 设置模态框 - 支持多厂商配置和高级参数
 */

import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { APP_CONFIG } from "../config/constants";
import { log } from "../utils/logger";
import type { ServerEvent } from "../../electron/types";

interface SettingsModalProps {
  onClose: () => void;
}

// 高级参数接口
interface AdvancedParams {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

// 模型限制接口
interface ModelLimits {
  max_tokens?: number;
  min_tokens?: number;
  lastUpdated?: number;
}

// API 配置接口（简化版）
interface ApiConfigItem {
  id: string;
  name: string;
  apiType?: string;
  model: string;
  baseURL: string;
  isActive?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

type ViewMode = 'form' | 'list';

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { t } = useTranslation();

  // 视图模式
  const [viewMode, setViewMode] = useState<ViewMode>('form');

  // 所有配置列表
  const [allConfigs, setAllConfigs] = useState<{ activeConfigId?: string; configs: ApiConfigItem[] }>({ configs: [] });
  const [loadingConfigs, setLoadingConfigs] = useState(false);

  const [apiKey, setApiKey] = useState("");
  const [baseURL, setBaseURL] = useState("");
  const [model, setModel] = useState("");
  const [apiType, setApiType] = useState<string>("anthropic");
  const [configId, setConfigId] = useState(""); // 当前编辑的配置 ID
  const [configName, setConfigName] = useState(""); // 配置名称
  const [resourceName, setResourceName] = useState(""); // Azure 专用
  const [deploymentName, setDeploymentName] = useState(""); // Azure 专用

  // 高级参数
  const [advancedParams, setAdvancedParams] = useState<AdvancedParams>({
    temperature: undefined,
    maxTokens: undefined,
    topP: undefined,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: string; responseTime?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 动态模型列表和限制
  const [dynamicModels, setDynamicModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelLimits, setModelLimits] = useState<ModelLimits | null>(null);

  // 厂商列表和配置
  const [providers, setProviders] = useState<Array<{ id: string; name: string; description: string; icon?: string }>>([]);
  const [providerModels, setProviderModels] = useState<string[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const isInitializing = useRef(true);
  const previousApiType = useRef<string | null>(null);

  // 加载支持的厂商列表
  useEffect(() => {
    const loadProviders = async () => {
      setLoadingProviders(true);
      try {
        const providerList = await window.electron.getSupportedProviders();
        setProviders(providerList);
      } catch (err) {
        log.error("Failed to load providers", err);
      } finally {
        setLoadingProviders(false);
      }
    };
    loadProviders();
  }, []);

  // 加载所有配置列表
  const loadAllConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const configs = await window.electron.getAllApiConfigs();
      setAllConfigs(configs);
    } catch (err) {
      log.error("Failed to load all configs", err);
    } finally {
      setLoadingConfigs(false);
    }
  };

  // 切换到配置列表视图时加载所有配置
  useEffect(() => {
    if (viewMode === 'list') {
      loadAllConfigs();
    }
  }, [viewMode]);

  // 加载当前配置
  useEffect(() => {
    setLoading(true);
    window.electron.getApiConfig()
      .then((config) => {
        if (config) {
          setApiKey(config.apiKey);
          setBaseURL(config.baseURL);
          setModel(config.model);
          const currentApiType = config.apiType || "anthropic";
          setApiType(currentApiType);
          previousApiType.current = currentApiType;
          setResourceName(config.resourceName || "");
          setDeploymentName(config.deploymentName || "");
          // 加载高级参数
          const configAny = config as any;
          if (configAny.temperature) setAdvancedParams(prev => ({ ...prev, temperature: configAny.temperature }));
          if (configAny.maxTokens) setAdvancedParams(prev => ({ ...prev, maxTokens: configAny.maxTokens }));
          if (configAny.topP) setAdvancedParams(prev => ({ ...prev, topP: configAny.topP }));
        }
        // 初始化完成后标记，并触发模型列表获取
        setTimeout(() => {
          isInitializing.current = false;
          // 如果有 API Key 和 BaseURL，自动获取模型列表
          if (config?.apiKey && config?.baseURL) {
            fetchDynamicModelList();
          }
        }, 100);
      })
      .catch((err) => {
        log.error("Failed to load API config", err);
        setError(t("errors.failedToLoadConfig"));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [t]);

  // 当厂商改变时，加载对应的模型列表
  useEffect(() => {
    const loadProviderModels = async () => {
      if (!apiType) return;
      try {
        const providerConfig = await window.electron.getProviderConfig(apiType);
        setBaseURL(providerConfig.baseURL);
        setProviderModels(providerConfig.models);
        // 只在用户主动切换厂商时（不是初始化）才更新默认模型
        if (!isInitializing.current && previousApiType.current && previousApiType.current !== apiType) {
          // 用户主动切换了厂商，使用新厂商的默认模型
          setModel(providerConfig.defaultModel);
          // 如果有 API Key，触发模型列表获取
          if (apiKey.trim()) {
            fetchDynamicModelList();
          }
        }
        previousApiType.current = apiType;
      } catch (err) {
        log.error("Failed to load provider config", err);
      }
    };
    loadProviderModels();
  }, [apiType]);

  // 监听服务器事件（模型列表和模型限制）
  useEffect(() => {
    const unsubscribe = window.electron.onServerEvent((event: ServerEvent) => {
      if (event.type === "api.modelList") {
        setLoadingModels(false);
        if (event.payload.error) {
          log.error("获取模型列表失败:", event.payload.error);
          // 出错时使用预定义的模型列表
          setDynamicModels([]);
        } else if (event.payload.models) {
          setDynamicModels(event.payload.models);
        }
      } else if (event.type === "api.modelLimits") {
        setTesting(false);
        if (event.payload.error) {
          // 模型限制获取失败不是致命错误，静默处理
          setModelLimits(null);
        } else if (event.payload.limits) {
          setModelLimits(event.payload.limits);
        }
      }
    });
    return unsubscribe;
  }, []);

  // 动态获取模型列表
  const fetchDynamicModelList = async () => {
    if (!apiKey.trim() || !baseURL.trim()) {
      return;
    }
    setLoadingModels(true);
    setDynamicModels([]);
    window.electron.sendClientEvent({
      type: "api.fetchModelList",
      payload: {
        apiKey: apiKey.trim(),
        baseURL: baseURL.trim(),
        apiType: apiType,
      },
    });
  };

  // 当 API Key 或 BaseURL 改变时，延迟自动获取模型列表
  useEffect(() => {
    if (!isInitializing.current && apiKey.trim() && baseURL.trim()) {
      const timer = setTimeout(() => {
        fetchDynamicModelList();
      }, 800); // 800ms 延迟，避免频繁请求
      return () => clearTimeout(timer);
    }
  }, [apiKey, baseURL, apiType]);

  const handleSave = async () => {
    // 验证输入
    if (!apiKey.trim()) {
      setError(t("errors.apiKeyRequired"));
      return;
    }
    if (!baseURL.trim()) {
      setError(t("errors.baseUrlRequired"));
      return;
    }
    if (!model.trim()) {
      setError(t("errors.modelRequired"));
      return;
    }

    // Azure 需要额外的资源名称和部署名称
    if (apiType === "azure") {
      if (!resourceName.trim()) {
        setError("Azure 资源名称不能为空");
        return;
      }
      if (!deploymentName.trim()) {
        setError("Azure 部署名称不能为空");
        return;
      }
    }

    // 验证 URL 格式
    try {
      new URL(baseURL);
    } catch {
      setError(t("errors.invalidBaseUrl"));
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const configToSave: any = {
        apiKey: apiKey.trim(),
        baseURL: baseURL.trim(),
        model: model.trim(),
        apiType: apiType,
        resourceName: apiType === "azure" ? resourceName.trim() : undefined,
        deploymentName: apiType === "azure" ? deploymentName.trim() : undefined,
      };
      // 如果有配置 ID，表示更新现有配置
      if (configId) {
        configToSave.id = configId;
      }
      // 如果有配置名称，使用它；否则使用默认名称
      if (configName.trim()) {
        configToSave.name = configName.trim();
      }
      // 添加高级参数
      if (advancedParams.temperature !== undefined) configToSave.temperature = advancedParams.temperature;
      if (advancedParams.maxTokens !== undefined) configToSave.maxTokens = advancedParams.maxTokens;
      if (advancedParams.topP !== undefined) configToSave.topP = advancedParams.topP;

      const result = await window.electron.saveApiConfig(configToSave);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1000);
      } else {
        setError(result.error || t("errors.failedToSaveConfig"));
      }
    } catch (err) {
      log.error("Failed to save API config", err);
      setError(t("errors.failedToSaveConfig"));
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    // 验证输入
    if (!apiKey.trim()) {
      setError(t("errors.apiKeyRequired"));
      return;
    }
    if (!baseURL.trim()) {
      setError(t("errors.baseUrlRequired"));
      return;
    }
    if (!model.trim()) {
      setError(t("errors.modelRequired"));
      return;
    }

    // Azure 需要额外的资源名称和部署名称
    if (apiType === "azure") {
      if (!resourceName.trim() || !deploymentName.trim()) {
        setError("Azure 需要填写资源名称和部署名称");
        return;
      }
    }

    // 验证 URL 格式
    try {
      new URL(baseURL);
    } catch {
      setError(t("errors.invalidBaseUrl"));
      return;
    }

    setError(null);
    setTestResult(null);
    setTesting(true);

    try {
      // 测试连接
      const result = await window.electron.testApiConnection({
        id: configId || 'test',
        name: configName || '测试配置',
        apiKey: apiKey.trim(),
        baseURL: baseURL.trim(),
        model: model.trim(),
        apiType: apiType as any,
        resourceName: apiType === "azure" ? resourceName.trim() : undefined,
        deploymentName: apiType === "azure" ? deploymentName.trim() : undefined,
      });
      setTestResult(result);

      // 同时获取模型参数限制
      window.electron.sendClientEvent({
        type: "api.fetchModelLimits",
        payload: {
          apiKey: apiKey.trim(),
          baseURL: baseURL.trim(),
          model: model.trim(),
          apiType: apiType,
        },
      });
    } catch (err) {
      console.error("Failed to test API connection:", err);
      setTestResult({
        success: false,
        message: "测试失败",
        details: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setTesting(false);
    }
  };

  // 新建配置
  const handleNewConfig = () => {
    setConfigId("");
    setConfigName("");
    setApiKey("");
    setBaseURL("");
    setModel("");
    setApiType("anthropic");
    setResourceName("");
    setDeploymentName("");
    setAdvancedParams({ temperature: undefined, maxTokens: undefined, topP: undefined });
    setError(null);
    setTestResult(null);
    setModelLimits(null);
    setDynamicModels([]);
    setViewMode('form');
  };

  // 编辑配置
  const handleEditConfig = (config: ApiConfigItem) => {
    setConfigId(config.id);
    setConfigName(config.name);
    setApiKey("");
    setBaseURL(config.baseURL);
    setModel(config.model);
    setApiType(config.apiType || "anthropic");
    setResourceName("");
    setDeploymentName("");
    setError(null);
    setTestResult(null);
    setModelLimits(null);
    setDynamicModels([]);
    setViewMode('form');
    // 重新加载完整配置来获取 apiKey
    window.electron.getApiConfig().then(fullConfig => {
      if (fullConfig && fullConfig.id === config.id) {
        setApiKey(fullConfig.apiKey);
      }
    });
  };

  // 切换激活配置
  const handleSetActiveConfig = async (configId: string) => {
    try {
      const result = await window.electron.setActiveApiConfig(configId);
      if (result.success) {
        await loadAllConfigs();
        // 重新加载当前激活的配置
        const config = await window.electron.getApiConfig();
        if (config) {
          setApiKey(config.apiKey);
          setBaseURL(config.baseURL);
          setModel(config.model);
          setApiType(config.apiType || "anthropic");
          setConfigId(config.id);
          setConfigName(config.name);
        }
      }
    } catch (err) {
      log.error("Failed to set active config", err);
    }
  };

  // 删除配置
  const handleDeleteConfig = async (idToDelete: string) => {
    if (!confirm("确定要删除此配置吗？")) {
      return;
    }
    try {
      const result = await window.electron.deleteApiConfig(idToDelete);
      if (result.success) {
        await loadAllConfigs();
        // 如果删除的是当前编辑的配置，重置表单
        if (idToDelete === configId) {
          handleNewConfig();
        }
      }
    } catch (err) {
      log.error("Failed to delete config", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/20 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-ink-900/5 bg-surface p-6 shadow-elevated">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-ink-800">{t("settings.title")}</span>
            {/* 视图切换按钮 */}
            <button
              onClick={() => setViewMode(viewMode === 'form' ? 'list' : 'form')}
              className="group relative flex items-center justify-center w-6 h-6 rounded-full bg-surface-secondary border border-ink-900/10 text-muted hover:text-accent hover:border-accent/50 transition-colors"
              aria-label={viewMode === 'form' ? '查看配置列表' : '添加配置'}
              title={viewMode === 'form' ? '查看所有已保存的配置' : '添加新配置'}
            >
              {viewMode === 'form' ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
              <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {viewMode === 'form' ? '查看配置列表' : '添加新配置'}
              </span>
            </button>
            <button
              onClick={() => window.electron.openExternal(APP_CONFIG.helpUrl)}
              className="group relative flex items-center justify-center w-6 h-6 rounded-full bg-surface-secondary border border-ink-900/10 text-muted hover:text-accent hover:border-accent/50 transition-colors"
              aria-label="帮助"
              title="点击查看 API 配置帮助"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M9.5 9c0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5c0 1.5-2.5 2-2.5 4" />
                <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none" />
              </svg>
              <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                点击查看 API 配置帮助
              </span>
            </button>
            <button
              onClick={() => window.electron.openExternal("https://docs.qq.com/form/page/DRm5uV1pSZFB3VHNv")}
              className="group relative flex items-center justify-center w-6 h-6 rounded-full bg-surface-secondary border border-ink-900/10 text-muted hover:text-accent hover:border-accent/50 transition-colors"
              aria-label="反馈"
              title="点击提交反馈"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M8 10h.01M12 10h.01M16 10h.01" />
              </svg>
              <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                点击提交反馈
              </span>
            </button>
          </div>
          <button
            className="rounded-full p-1.5 text-muted hover:bg-surface-tertiary hover:text-ink-700 transition-colors"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">{t("settings.description")}</p>

        {loading ? (
          <div className="mt-5 flex items-center justify-center py-8">
            <svg aria-hidden="true" className="w-6 h-6 animate-spin text-accent" viewBox="0 0 100 101" fill="none">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" opacity="0.3" />
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor" />
            </svg>
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            {/* 表单视图 */}
            {viewMode === 'form' && (
            <>
            {/* API 厂商选择 */}
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted">API 厂商</span>
              <select
                className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                value={apiType}
                onChange={(e) => setApiType(e.target.value)}
                disabled={loadingProviders}
              >
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.icon ? `${provider.icon} ` : ""}{provider.name}
                  </option>
                ))}
              </select>
              {providers.find((p) => p.id === apiType)?.description && (
                <span className="text-xs text-muted-light">
                  {providers.find((p) => p.id === apiType)?.description}
                </span>
              )}
            </label>

            {/* Azure 专用字段 */}
            {apiType === "azure" && (
              <>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted">Azure 资源名称</span>
                  <input
                    type="text"
                    className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                    placeholder="your-resource-name"
                    value={resourceName}
                    onChange={(e) => setResourceName(e.target.value)}
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted">Azure 部署名称</span>
                  <input
                    type="text"
                    className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                    placeholder="your-deployment-name"
                    value={deploymentName}
                    onChange={(e) => setDeploymentName(e.target.value)}
                  />
                </label>
              </>
            )}

            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted">{t("settings.baseUrl")}</span>
              <input
                type="url"
                className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                placeholder="https://..."
                value={baseURL}
                onChange={(e) => setBaseURL(e.target.value)}
                required
              />
              <span className="text-xs text-muted-light">
                💡 支持 URL 路径格式：例如 <code className="px-1 py-0.5 rounded bg-surface-tertiary">/anthropic</code>、<code className="px-1 py-0.5 rounded bg-surface-tertiary">/openai</code>、<code className="px-1 py-0.5 rounded bg-surface-tertiary">/v1</code> 等。
                对于 <code className="px-1 py-0.5 rounded bg-surface-tertiary">https://****/anthropic</code> 格式的 URL，请选择厂商为 <strong>anthropic</strong>
              </span>
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted">{t("settings.apiKey")}</span>
              <input
                type="password"
                className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </label>

            {/* 模型名称 - 始终允许自定义输入 */}
            <label className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted">{t("settings.modelName")}</span>
                <div className="flex items-center gap-2">
                  {/* 刷新模型列表按钮 */}
                  <button
                    className="text-xs text-muted hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    onClick={fetchDynamicModelList}
                    disabled={loadingModels || !apiKey.trim() || !baseURL.trim()}
                    title="刷新模型列表"
                  >
                    {loadingModels ? (
                      <>
                        <svg aria-hidden="true" className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                        </svg>
                      </>
                    )}
                  </button>
                  <button
                    className="text-xs text-accent hover:text-accent-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    onClick={handleTestConnection}
                    disabled={testing || !apiKey.trim() || !baseURL.trim() || !model.trim()}
                  >
                    {testing ? (
                      <>
                        <svg aria-hidden="true" className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        测试中
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        测试连接
                      </>
                    )}
                  </button>
                </div>
              </div>
              <input
                type="text"
                className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                placeholder="输入模型名称或从下方选择"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setTestResult(null);
                }}
                required
                list="model-suggestions"
              />
              {/* 模型建议列表（datalist）- 合并动态和预定义的模型 */}
              <datalist id="model-suggestions">
                {[...dynamicModels, ...providerModels]
                  .filter((model, index, self) => self.indexOf(model) === index)
                  .map((modelOption) => (
                    <option key={modelOption} value={modelOption}>
                      {modelOption}
                    </option>
                  ))}
              </datalist>
              {/* 模型限制信息 */}
              {modelLimits && (
                <span className="text-xs text-muted-light">
                  🔧 模型限制: max_tokens ∈ [{modelLimits.min_tokens ?? 1}, {modelLimits.max_tokens ?? 'N/A'}]
                </span>
              )}
            </label>

            {/* 高级参数折叠面板 */}
            <div className="rounded-xl border border-ink-900/10 bg-surface-secondary overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-ink-700 hover:bg-surface-tertiary transition-colors"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span className="font-medium">高级参数（可选）</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showAdvanced && (
                <div className="px-4 pb-4 grid gap-3 border-t border-ink-900/10 pt-3">
                  {/* Temperature */}
                  <label className="grid gap-1">
                    <span className="text-xs text-muted">Temperature (0-2)</span>
                    <input
                      type="number"
                      className="rounded-lg border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none transition-colors"
                      placeholder="默认值"
                      min="0"
                      max="2"
                      step="0.1"
                      value={advancedParams.temperature ?? ""}
                      onChange={(e) => setAdvancedParams(prev => ({
                        ...prev,
                        temperature: e.target.value ? parseFloat(e.target.value) : undefined
                      }))}
                    />
                  </label>
                  {/* Max Tokens */}
                  <label className="grid gap-1">
                    <span className="text-xs text-muted">Max Tokens</span>
                    <input
                      type="number"
                      className="rounded-lg border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none transition-colors"
                      placeholder="默认值"
                      min="1"
                      value={advancedParams.maxTokens ?? ""}
                      onChange={(e) => setAdvancedParams(prev => ({
                        ...prev,
                        maxTokens: e.target.value ? parseInt(e.target.value) : undefined
                      }))}
                    />
                  </label>
                  {/* Top P */}
                  <label className="grid gap-1">
                    <span className="text-xs text-muted">Top P (0-1)</span>
                    <input
                      type="number"
                      className="rounded-lg border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none transition-colors"
                      placeholder="默认值"
                      min="0"
                      max="1"
                      step="0.1"
                      value={advancedParams.topP ?? ""}
                      onChange={(e) => setAdvancedParams(prev => ({
                        ...prev,
                        topP: e.target.value ? parseFloat(e.target.value) : undefined
                      }))}
                    />
                  </label>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-error/20 bg-error-light px-4 py-2.5 text-sm text-error">
                {error}
              </div>
            )}

            {testResult && (
              <div className={`rounded-xl border px-4 py-2.5 text-sm ${
                testResult.success
                  ? 'border-success/20 bg-success-light text-success'
                  : 'border-error/20 bg-error-light text-error'
              }`}>
                <div className="font-medium">{testResult.message}</div>
                {testResult.details && (
                  <div className="mt-1 text-xs opacity-80">{testResult.details}</div>
                )}
                {testResult.responseTime && (
                  <div className="mt-1 text-xs opacity-60">响应时间: {testResult.responseTime}ms</div>
                )}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-success/20 bg-success-light px-4 py-2.5 text-sm text-success">
                {t("settings.saved")}
              </div>
            )}

            <div className="flex gap-3">
              <button
                className="flex-1 rounded-xl border border-ink-900/10 bg-surface px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-surface-tertiary transition-colors"
                onClick={onClose}
                disabled={saving}
              >
                {t("settings.cancel")}
              </button>
              <button
                className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-accent-hover transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleSave}
                disabled={saving || !apiKey.trim() || !baseURL.trim() || !model.trim()}
              >
                {saving ? (
                  <svg aria-hidden="true" className="mx-auto w-5 h-5 animate-spin" viewBox="0 0 100 101" fill="none">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" opacity="0.3" />
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="white" />
                  </svg>
                ) : t("settings.save")}
              </button>
            </div>
            </>
          )}

            {/* 配置列表视图 */}
            {viewMode === 'list' && (
              <div className="space-y-3">
                {loadingConfigs ? (
                  <div className="flex items-center justify-center py-8">
                    <svg aria-hidden="true" className="w-6 h-6 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : allConfigs.configs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted">暂无保存的配置</p>
                    <button
                      className="mt-3 text-sm text-accent hover:text-accent-hover"
                      onClick={handleNewConfig}
                    >
                      + 添加第一个配置
                    </button>
                  </div>
                ) : (
                  allConfigs.configs.map((config) => (
                    <div
                      key={config.id}
                      className={`p-4 rounded-xl border transition-colors ${
                        config.id === allConfigs.activeConfigId
                          ? 'border-accent bg-accent/5'
                          : 'border-ink-900/10 bg-surface-secondary hover:border-ink-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {config.id === allConfigs.activeConfigId && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-accent bg-accent/20">
                                当前
                              </span>
                            )}
                            <h3 className="text-sm font-medium text-ink-800 truncate">{config.name}</h3>
                          </div>
                          <p className="text-xs text-muted mt-1">
                            {config.apiType} · {config.model}
                          </p>
                          <p className="text-xs text-muted-light truncate" title={config.baseURL}>
                            {config.baseURL}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {config.id !== allConfigs.activeConfigId && (
                            <button
                              className="text-xs text-muted hover:text-accent p-1"
                              onClick={() => handleSetActiveConfig(config.id)}
                              title="设为当前配置"
                            >
                              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="9" />
                              <circle cx="12" cy="12" r="3" fill="currentColor" />
                            </svg>
                            </button>
                          )}
                          <button
                            className="text-xs text-muted hover:text-accent p-1"
                            onClick={() => handleEditConfig(config)}
                            title="编辑配置"
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-5.5 5.5" />
                            </svg>
                          </button>
                          <button
                            className="text-xs text-muted hover:text-error p-1"
                            onClick={() => handleDeleteConfig(config.id)}
                            title="删除配置"
                          >
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <button
                  className="w-full mt-4 rounded-xl border border-dashed border-ink-900/20 px-4 py-3 text-sm text-muted hover:border-accent/50 hover:text-accent transition-colors"
                  onClick={handleNewConfig}
                >
                  + 添加新配置
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsModal;
