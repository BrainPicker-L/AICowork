/**
 * SDK 原生配置加载器
 * 加载插件、代理、钩子、权限、输出样式等 SDK 原生支持的配置
 *
 * 混合方案：优先使用 SDK 原生接口，无法实现时回退到自定义实现
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { app } from 'electron';
import { log } from '../logger.js';

/**
 * SDK 插件配置类型
 */
export interface SdkPluginConfig {
  type: 'local';
  path: string;
}

/**
 * SDK 代理配置类型（符合 SDK 的 AgentDefinition）
 */
export interface SdkAgentConfig {
  description: string;
  tools?: string[];
  disallowedTools?: string[];
  prompt: string;
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
  skills?: string[];
}

/**
 * 加载的 SDK 原生配置
 */
export interface SdkNativeConfig {
  /** 插件列表 */
  plugins?: SdkPluginConfig[];
  /** 代理配置 */
  agents?: Record<string, SdkAgentConfig>;
  /** 当前激活的代理 */
  agent?: string;
  /** 钩子配置 */
  hooks?: Record<string, any[]>;
  /** 允许的工具列表（自动批准） */
  allowedTools?: string[];
  /** 禁用的工具列表 */
  disallowedTools?: string[];
  /** 最大对话轮数 */
  maxTurns?: number;
  /** 最大预算（美元） */
  maxBudgetUsd?: number;
  /** 会话持久化 */
  persistSession?: boolean;
  /** 启用文件检查点 */
  enableFileCheckpointing?: boolean;
}

/**
 * 获取插件目录
 */
function getPluginsDir(): string {
  return join(homedir(), '.claude', 'plugins');
}

/**
 * 获取代理目录
 */
function getAgentsDir(): string {
  return join(app.getPath('userData'), 'agents');
}

/**
 * 获取 settings.json 路径
 */
function getSettingsPath(): string {
  return join(homedir(), '.claude', 'settings.json');
}

/**
 * 读取 settings.json
 */
async function readSettings(): Promise<any> {
  try {
    const content = await fs.readFile(getSettingsPath(), 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

/**
 * 加载插件列表
 * 从 ~/.claude/plugins 目录扫描插件
 * 降级机制：目录不存在 → 从 settings.json 读取 → 空列表
 */
async function loadPlugins(): Promise<SdkPluginConfig[]> {
  const plugins: SdkPluginConfig[] = [];
  const pluginsDir = getPluginsDir();

  // 方法 1: 从 plugins 目录扫描
  try {
    const entries = await fs.readdir(pluginsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pluginPath = join(pluginsDir, entry.name);
        // 检查是否有 SKILL.md 或 package.json 等插件标识文件
        try {
          const skillFile = join(pluginPath, 'SKILL.md');
          const packageFile = join(pluginPath, 'package.json');

          const hasSkill = await fs.access(skillFile).then(() => true).catch(() => false);
          const hasPackage = await fs.access(packageFile).then(() => true).catch(() => false);

          if (hasSkill || hasPackage) {
            plugins.push({
              type: 'local',
              path: pluginPath
            });
            log.info(`[SDK Loader] Loaded plugin: ${entry.name}`);
          }
        } catch {
          // 忽略单个插件的错误
        }
      }
    }

    if (plugins.length > 0) {
      log.info(`[SDK Loader] Total plugins loaded from directory: ${plugins.length}`);
      return plugins;
    }
  } catch (error) {
    log.warn('[SDK Loader] Failed to read plugins directory, trying fallback:', error);
  }

  // 方法 2: 降级 - 从 settings.json 读取已启用的插件
  try {
    const settings = await readSettings();
    if (settings.enabledPlugins && typeof settings.enabledPlugins === 'object') {
      // 遍历已启用的插件，检查是否有对应的目录
      for (const [pluginName, enabled] of Object.entries(settings.enabledPlugins)) {
        if (enabled) {
          // 尝试多个可能的路径
          const possiblePaths = [
            join(pluginsDir, pluginName),
            join(pluginsDir, pluginName.replace('@claude-plugins-official/', '')),
            join(pluginsDir, pluginName.replace(/@.*/, '')),
          ];

          for (const pluginPath of possiblePaths) {
            try {
              await fs.access(pluginPath);
              plugins.push({ type: 'local', path: pluginPath });
              log.info(`[SDK Loader] Loaded plugin from settings: ${pluginName}`);
              break;
            } catch {
              // 路径不存在，尝试下一个
            }
          }
        }
      }

      if (plugins.length > 0) {
        log.info(`[SDK Loader] Total plugins loaded from settings.json: ${plugins.length}`);
        return plugins;
      }
    }
  } catch (error) {
    log.warn('[SDK Loader] Failed to load plugins from settings.json:', error);
  }

  // 方法 3: 最后降级 - 返回空列表（不阻塞启动）
  log.info('[SDK Loader] No plugins found, continuing without plugins');
  return plugins;
}

/**
 * 加载代理配置
 * 从 userData/agents 目录、settings.json 和 UI 全局配置读取
 * 多套机制：SDK 配置 → UI 配置 → 默认值
 */
async function loadAgents(): Promise<{ agents: Record<string, SdkAgentConfig>; defaultAgent?: string }> {
  const agents: Record<string, SdkAgentConfig> = {};
  let defaultAgent: string | undefined;

  try {
    // 方法 1: 从 settings.json 读取 SDK 原生配置
    const settings = await readSettings();
    if (settings.agents?.defaultAgentId) {
      defaultAgent = settings.agents.defaultAgentId;
      log.info(`[SDK Loader] Default agent from SDK settings: ${defaultAgent}`);
    }

    // 方法 2: 从 UI 全局配置读取（userData/agents/global-config.json）
    if (!defaultAgent) {
      try {
        const { getGlobalConfig } = await import('../storage/agents-store.js');
        const uiGlobalConfig = await getGlobalConfig();
        if (uiGlobalConfig.defaultAgentId) {
          defaultAgent = uiGlobalConfig.defaultAgentId;
          log.info(`[SDK Loader] Default agent from UI config: ${defaultAgent}`);
        }
      } catch (error) {
        log.warn('[SDK Loader] Failed to load UI global config:', error);
      }
    }

    // 方法 3: 从 agents 目录加载代理配置
    const agentsDir = getAgentsDir();
    const entries = await fs.readdir(agentsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const configPath = join(agentsDir, entry.name, 'config.json');
        try {
          const content = await fs.readFile(configPath, 'utf-8');
          const config = JSON.parse(content);

          // 转换为 SDK 的 AgentDefinition 格式
          agents[entry.name] = {
            description: config.description || `Agent: ${entry.name}`,
            prompt: config.systemPrompt || config.prompt || '',
            tools: config.allowedTools,
            disallowedTools: config.disallowedTools,
            model: config.model === 'inherit' ? 'inherit' : config.model === 'haiku' ? 'haiku' : undefined,
            skills: config.skills
          };

          log.info(`[SDK Loader] Loaded agent: ${entry.name}`);
        } catch {
          // 跳过无效的代理配置
        }
      }
    }

    log.info(`[SDK Loader] Total agents loaded: ${Object.keys(agents).length}, default: ${defaultAgent || 'none'}`);
  } catch (error) {
    log.warn('[SDK Loader] Failed to load agents:', error);
  }

  return { agents, defaultAgent };
}

/**
 * 加载钩子配置
 * 从 settings.json 读取
 */
async function loadHooks(): Promise<Record<string, any[]>> {
  try {
    const settings = await readSettings();
    const hooks = settings.hooks || {};

    // 转换钩子配置为 SDK 期望的格式
    const sdkHooks: Record<string, any[]> = {};

    for (const [hookType, hookConfigs] of Object.entries(hooks)) {
      if (Array.isArray(hookConfigs)) {
        sdkHooks[hookType] = hookConfigs.map((config: any) => ({
          hooks: config.hooks || []
        }));
      }
    }

    log.info(`[SDK Loader] Loaded hooks for: ${Object.keys(sdkHooks).join(', ')}`);
    return sdkHooks;
  } catch (error) {
    log.warn('[SDK Loader] Failed to load hooks:', error);
    return {};
  }
}

/**
 * 加载权限配置
 * 从 settings.json 读取
 * 支持 permissions.allow 和 permissions.rules 两种格式
 */
async function loadPermissions(): Promise<{ allowedTools?: string[]; disallowedTools?: string[] }> {
  try {
    const settings = await readSettings();
    const permissions = settings.permissions || {};

    // 提取 allowedTools 和 disallowedTools
    const allowedTools: string[] = [];
    const disallowedTools: string[] = [];

    // 处理 permissions.allowedTools / disallowedTools（直接数组）
    if (permissions.allowedTools && Array.isArray(permissions.allowedTools)) {
      allowedTools.push(...permissions.allowedTools);
    }

    if (permissions.disallowedTools && Array.isArray(permissions.disallowedTools)) {
      disallowedTools.push(...permissions.disallowedTools);
    }

    // 处理 permissions.allow（字符串数组，格式：Tool(pattern) 或 Tool1(*), Tool2(*)）
    if (permissions.allow && Array.isArray(permissions.allow)) {
      for (const entry of permissions.allow) {
        // 解析格式如 "Bash(test:*)" 或 "Bash(*), Read(*), Edit(*), Write(*)"
        const parts = entry.split(',').map((s: string) => s.trim());
        for (const part of parts) {
          // 提取工具名（Bash(*), Read(*) -> Bash, Read）
          const toolMatch = part.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
          if (toolMatch) {
            const toolName = toolMatch[1];
            if (!allowedTools.includes(toolName)) {
              allowedTools.push(toolName);
            }
          }
        }
      }
    }

    // 处理 permissions.deny（同理）
    if (permissions.deny && Array.isArray(permissions.deny)) {
      for (const entry of permissions.deny) {
        const parts = entry.split(',').map((s: string) => s.trim());
        for (const part of parts) {
          const toolMatch = part.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
          if (toolMatch) {
            const toolName = toolMatch[1];
            if (!disallowedTools.includes(toolName)) {
              disallowedTools.push(toolName);
            }
          }
        }
      }
    }

    // 从权限规则中提取工具列表
    if (permissions.rules && Array.isArray(permissions.rules)) {
      for (const rule of permissions.rules) {
        // 处理 tools 数组格式
        if (rule.tools && Array.isArray(rule.tools)) {
          for (const tool of rule.tools) {
            if (rule.action === 'allow' || rule.allowed === true) {
              if (!allowedTools.includes(tool)) {
                allowedTools.push(tool);
              }
            } else if (rule.action === 'deny' || rule.allowed === false) {
              if (!disallowedTools.includes(tool)) {
                disallowedTools.push(tool);
              }
            }
          }
        }
        // 处理旧版 tool 单个字段格式
        if (rule.tool) {
          if (rule.allowed && !allowedTools.includes(rule.tool)) {
            allowedTools.push(rule.tool);
          } else if (!rule.allowed && !disallowedTools.includes(rule.tool)) {
            disallowedTools.push(rule.tool);
          }
        }
      }
    }

    log.info(`[SDK Loader] Loaded permissions: allowed=${allowedTools.length}, disallowed=${disallowedTools.length}`);
    return { allowedTools, disallowedTools };
  } catch (error) {
    log.warn('[SDK Loader] Failed to load permissions:', error);
    return {};
  }
}

/**
 * 加载所有 SDK 原生配置
 */
export async function loadSdkNativeConfig(): Promise<SdkNativeConfig> {
  const config: SdkNativeConfig = {};

  // 1. 加载插件
  try {
    const plugins = await loadPlugins();
    if (plugins.length > 0) {
      config.plugins = plugins;
    }
  } catch (error) {
    log.error('[SDK Loader] Error loading plugins:', error);
  }

  // 2. 加载代理
  try {
    const { agents, defaultAgent } = await loadAgents();
    if (Object.keys(agents).length > 0) {
      config.agents = agents;
    }
    if (defaultAgent) {
      config.agent = defaultAgent;
    }
  } catch (error) {
    log.error('[SDK Loader] Error loading agents:', error);
  }

  // 3. 加载钩子
  try {
    const hooks = await loadHooks();
    if (Object.keys(hooks).length > 0) {
      config.hooks = hooks;
    }
  } catch (error) {
    log.error('[SDK Loader] Error loading hooks:', error);
  }

  // 4. 加载权限配置
  try {
    const permissions = await loadPermissions();
    if (permissions.allowedTools && permissions.allowedTools.length > 0) {
      config.allowedTools = permissions.allowedTools;
    }
    if (permissions.disallowedTools && permissions.disallowedTools.length > 0) {
      config.disallowedTools = permissions.disallowedTools;
    }
  } catch (error) {
    log.error('[SDK Loader] Error loading permissions:', error);
  }

  log.info(`[SDK Loader] Final config: ${Object.keys(config).join(', ')}`);
  return config;
}
