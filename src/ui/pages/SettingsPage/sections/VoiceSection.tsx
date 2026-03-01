/**
 * 语音输入设置：语音大模型配置、默认工作目录、Fn 键开关
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Mic } from "lucide-react";
type VoiceApiConfig = { baseURL: string; apiKey: string; model?: string; apiType?: "whisper" | "qwen-asr" };
type VoiceSettings = { voiceApiConfig?: VoiceApiConfig | null; voiceCwd?: string; fnVoiceEnabled: boolean };

const VOICE_API_TYPES: { value: "whisper" | "qwen-asr"; labelKey: string }[] = [
  { value: "qwen-asr", labelKey: "voice.apiType.qwenAsr" },
  { value: "whisper", labelKey: "voice.apiType.whisper" },
];

export function VoiceSection() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<VoiceSettings | null>(null);
  const [baseURL, setBaseURL] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [apiType, setApiType] = useState<"whisper" | "qwen-asr">("whisper");
  const [voiceCwd, setVoiceCwd] = useState("");
  const [fnEnabled, setFnEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: string; responseTime?: number } | null>(null);
  const [platform, setPlatform] = useState<string>("");
  useEffect(() => {
    if (!window.electron?.getVoiceSettings) return;
    window.electron.getVoiceSettings().then((s: VoiceSettings) => {
      setSettings(s);
      if (s?.voiceApiConfig) {
        setBaseURL(s.voiceApiConfig.baseURL || "");
        setApiKey(s.voiceApiConfig.apiKey || "");
        setModel(s.voiceApiConfig.model || "");
        setApiType(s.voiceApiConfig.apiType === "qwen-asr" ? "qwen-asr" : "whisper");
      }
      setVoiceCwd(s?.voiceCwd ?? "");
      setFnEnabled(s?.fnVoiceEnabled ?? false);
    });
  }, []);
  useEffect(() => {
    if (!window.electron?.getStaticData) return;
    window.electron.getStaticData().then((d) => {
      setPlatform(d?.platform ?? "");
    });
  }, []);

  const handleSaveConfig = async () => {
    if (!window.electron?.setVoiceApiConfig || !window.electron?.setVoiceCwd) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const config: VoiceApiConfig = {
        baseURL: baseURL.trim(),
        apiKey: apiKey.trim(),
        model: model.trim() || undefined,
        apiType: apiType === "qwen-asr" ? "qwen-asr" : "whisper",
      };
      if (config.baseURL && config.apiKey) {
        await window.electron.setVoiceApiConfig(config);
      } else {
        await window.electron.setVoiceApiConfig(null);
      }
      await window.electron.setVoiceCwd(voiceCwd.trim());
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleFnToggle = async (next: boolean) => {
    if (!window.electron?.setFnVoiceEnabled) return;
    if (next) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch (e) {
        setError(t("voice.microphonePermission"));
        return;
      }
    }
    await window.electron.setFnVoiceEnabled(next);
    setFnEnabled(next);
  };

  const handleBrowseCwd = async () => {
    const dir = await window.electron?.selectDirectory?.();
    if (dir) setVoiceCwd(dir);
  };

  const handleTestConnection = async () => {
    if (!baseURL.trim() || !apiKey.trim() || !window.electron?.testVoiceApiConnection) return;
    setError(null);
    setTestResult(null);
    setTesting(true);
    try {
      const result = await window.electron.testVoiceApiConnection({
        baseURL: baseURL.trim(),
        apiKey: apiKey.trim(),
        model: model.trim() || undefined,
        apiType: apiType === "qwen-asr" ? "qwen-asr" : "whisper",
      });
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        message: t("api.testFailed"),
        details: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setTesting(false);
    }
  };

  if (settings === null && !window.electron?.getVoiceSettings) {
    return (
      <section className="space-y-6">
        <p className="text-sm text-muted">{t("voice.description")}</p>
        <p className="text-sm text-muted">语音功能在此环境中不可用。</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900 flex items-center gap-2">
          <Mic className="w-7 h-7 text-accent" />
          {t("voice.title")}
        </h1>
        <p className="mt-2 text-sm text-muted">{t("voice.description")}</p>
      </header>

      {/* 语音大模型配置 */}
      <div className="space-y-4 rounded-xl border border-ink-900/10 bg-surface p-4">
        <h3 className="text-sm font-medium text-ink-900">{t("voice.api.title")}</h3>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted">{t("voice.api.apiType")}</span>
          <select
            value={apiType}
            onChange={(e) => setApiType(e.target.value as "whisper" | "qwen-asr")}
            className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
          >
            {VOICE_API_TYPES.map(({ value, labelKey }) => (
              <option key={value} value={value}>
                {t(labelKey)}
              </option>
            ))}
          </select>
          {apiType === "qwen-asr" && (
            <span className="text-xs text-muted">
              {t("voice.api.qwenAsrHint")}
            </span>
          )}
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted">{t("voice.api.baseUrl")}</span>
          <input
            type="url"
            className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
            placeholder={apiType === "qwen-asr" ? "https://dashscope.aliyuncs.com/compatible-mode/v1" : t("voice.api.baseUrlPlaceholder")}
            value={baseURL}
            onChange={(e) => setBaseURL(e.target.value)}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted">{t("voice.api.apiKey")}</span>
          <input
            type="password"
            className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
            placeholder={t("voice.api.apiKeyPlaceholder")}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted">{t("voice.api.model")}</span>
          <input
            type="text"
            className="rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
            placeholder={apiType === "qwen-asr" ? "qwen3-asr-flash" : t("voice.api.modelPlaceholder")}
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || !baseURL.trim() || !apiKey.trim()}
            className="rounded-xl border border-ink-900/20 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 hover:bg-surface-tertiary disabled:opacity-50 transition-colors"
          >
            {testing ? t("api.testing") : t("api.actions.test")}
          </button>
          {testResult && (
            <div
              className={`rounded-xl border px-4 py-2.5 text-sm min-w-[200px] ${
                testResult.success
                  ? "border-green-500/30 bg-green-50 text-green-800"
                  : "border-red-500/30 bg-red-50 text-red-800"
              }`}
            >
              <div className="font-medium">{testResult.message}</div>
              {testResult.details && (
                <div className="mt-1 text-xs opacity-90">{testResult.details}</div>
              )}
              {testResult.responseTime != null && (
                <div className="mt-1 text-xs opacity-70">
                  {t("api.responseTime", { time: testResult.responseTime })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 语音任务默认工作目录 */}
      <div className="space-y-2 rounded-xl border border-ink-900/10 bg-surface p-4">
        <h3 className="text-sm font-medium text-ink-900">{t("voice.cwd.title")}</h3>
        <p className="text-xs text-muted">{t("voice.cwd.description")}</p>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-xl border border-ink-900/10 bg-surface-secondary px-4 py-2.5 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
            placeholder={t("voice.cwd.placeholder")}
            value={voiceCwd}
            onChange={(e) => setVoiceCwd(e.target.value)}
          />
          <button
            type="button"
            onClick={handleBrowseCwd}
            className="rounded-xl border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-700 hover:bg-surface-tertiary transition-colors"
          >
            {t("voice.cwd.browse")}
          </button>
        </div>
      </div>

      {/* Fn 键开关 */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-ink-900/10 bg-surface">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-ink-900">{t("voice.fnSwitch.title")}</h3>
          <p className="mt-1 text-xs text-muted">{t("voice.fnSwitch.description")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={fnEnabled}
          onClick={() => handleFnToggle(!fnEnabled)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 ${
            fnEnabled ? "bg-accent border-accent" : "bg-ink-400 border-ink-400"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out ${
              fnEnabled ? "translate-x-5 bg-white" : "translate-x-0 bg-white"
            }`}
          />
        </button>
      </div>

      {/* macOS：Fn 全局监听需「输入监控」权限 */}
      {fnEnabled && platform === "darwin" && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/80">
          <p className="text-sm text-amber-800">{t("voice.fnSwitch.macPermissionHint")}</p>
          <button
            type="button"
            onClick={() => window.electron?.openInputMonitoringSettings?.()}
            className="mt-2 text-sm font-medium text-amber-700 underline hover:no-underline"
          >
            {t("voice.fnSwitch.openInputMonitoring")}
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSaveConfig}
          disabled={saving}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {saving ? "..." : t("voice.api.save")}
        </button>
        {success && <span className="text-sm text-green-600">{t("voice.saveSuccess")}</span>}
      </div>
    </section>
  );
}
