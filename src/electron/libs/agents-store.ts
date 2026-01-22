/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-21
 * @updated     2026-01-21
 * @Email       None
 *
 * Agents 管理存储库
 * 管理自定义 Agent 类型的创建、读取、更新、删除操作
 */

import { promises as fs } from 'fs';
import { join, dirname, basename, normalize } from 'path';
import { app } from 'electron';
import { log } from '../logger.js';

/**
 * 验证并清理 Agent 名称，防止路径遍历攻击
 */
function validateAgentName(agentName: string): string {
  // 去除首尾空格
  const trimmed = agentName.trim();

  // 检查长度 (1-64 字符)
  if (trimmed.length < 1 || trimmed.length > 64) {
    throw new Error('Agent 名称长度必须在 1-64 字符之间');
  }

  // 使用 normalize 和 basename 清理路径
  const normalized = normalize(trimmed);
  const cleanName = basename(normalized);

  // 验证清理后的名称与原始输入一致
  if (cleanName !== trimmed || normalized !== trimmed) {
    throw new Error('Agent 名称包含非法字符或路径');
  }

  // 只允许字母、数字、连字符和下划线
  const validNameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!validNameRegex.test(cleanName)) {
    throw new Error('Agent 名称只能包含字母、数字、连字符和下划线');
  }

  return cleanName;
}

/**
 * Agent 编排模式
 */
export type AgentOrchestrationMode =
  | 'parallel'      // 并发：所有 Agent 同时执行
  | 'sequential'    // 串行：按顺序执行 Agent
  | 'alternating'   // 交替：在 Agent 之间交替执行
  | 'cyclic';       // 循环：循环执行 Agent

/**
 * Agent 编排配置
 */
export interface AgentOrchestrationConfig {
  /** 编排模式 */
  mode: AgentOrchestrationMode;
  /** Agent 执行顺序（ID 列表） */
  agentSequence: string[];
  /** 最大并发数（仅 parallel 模式） */
  maxConcurrency?: number;
  /** 循环次数（仅 cyclic 模式，0 表示无限循环） */
  cycleCount?: number;
  /** 是否在任一 Agent 失败时停止 */
  stopOnFailure?: boolean;
  /** Agent 之间的超时时间（秒） */
  agentTimeout?: number;
  /** 是否启用结果聚合 */
  enableAggregation?: boolean;
  /** 结果聚合策略 */
  aggregationStrategy?: 'first' | 'all' | 'majority' | 'concatenate';
}

/**
 * Agent 配置接口
 */
export interface AgentConfig {
  /** Agent 唯一标识 */
  id: string;
  /** Agent 显示名称 */
  name: string;
  /** Agent 描述 */
  description: string;
  /** Agent 类型（内置或自定义） */
  type: 'builtin' | 'custom';
  /** 系统提示词 */
  systemPrompt: string;
  /** 最大并行子代理数 */
  maxSubAgents?: number;
  /** 超时时间（秒） */
  timeoutSeconds?: number;
  /** 允许使用的工具列表 */
  allowedTools?: string[];
  /** 允许使用的 MCP 服务器列表 */
  allowedMcpServers?: string[];
  /** 是否启用记忆 */
  enableMemory?: boolean;
  /** 记忆容量 */
  memoryCapacity?: number;
  /** 创建时间 */
  createdAt?: number;
  /** 更新时间 */
  updatedAt?: number;
}

/**
 * Agent 全局配置
 */
export interface AgentGlobalConfig {
  /** 默认最大子代理数 */
  maxSubAgents: number;
  /** 默认 Agent 类型 */
  defaultAgentId: string;
  /** 自动启用子代理 */
  autoEnableSubAgents: boolean;
  /** 默认超时时间 */
  timeoutSeconds: number;
  /** 默认编排配置 */
  orchestration?: AgentOrchestrationConfig;
}

/**
 * 获取 Agents 目录路径
 */
function getAgentsDir(): string {
  const userDataPath = app.getPath('userData');
  return join(userDataPath, 'agents');
}

/**
 * 获取 Agent 文件路径（带安全验证）
 */
function getAgentFilePath(agentId: string): string {
  const cleanId = validateAgentName(agentId);
  return join(getAgentsDir(), cleanId, 'AGENT.json');
}

/**
 * 获取 Agent 目录路径（带安全验证）
 */
function getAgentDirPath(agentId: string): string {
  const cleanId = validateAgentName(agentId);
  return join(getAgentsDir(), cleanId);
}

/**
 * 确保 Agents 目录存在
 */
async function ensureAgentsDir(): Promise<void> {
  const agentsDir = getAgentsDir();
  try {
    await fs.access(agentsDir);
  } catch {
    await fs.mkdir(agentsDir, { recursive: true });
  }
}

/**
 * 获取全局配置文件路径
 */
function getGlobalConfigPath(): string {
  return join(getAgentsDir(), 'global-config.json');
}

/**
 * 获取默认全局配置
 */
function getDefaultGlobalConfig(): AgentGlobalConfig {
  return {
    maxSubAgents: 3,
    defaultAgentId: 'general-purpose',
    autoEnableSubAgents: true,
    timeoutSeconds: 300,
    orchestration: {
      mode: 'parallel',
      agentSequence: [],
      maxConcurrency: 3,
      stopOnFailure: true,
      enableAggregation: true,
      aggregationStrategy: 'all',
    },
  };
}

/**
 * 获取全局 Agent 配置
 */
export async function getGlobalConfig(): Promise<AgentGlobalConfig> {
  try {
    await ensureAgentsDir();
    const configPath = getGlobalConfigPath();

    try {
      await fs.access(configPath);
    } catch {
      // 配置文件不存在，创建默认配置
      const defaultConfig = getDefaultGlobalConfig();
      await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      return defaultConfig;
    }

    const content = await fs.readFile(configPath, 'utf-8');
    return { ...getDefaultGlobalConfig(), ...JSON.parse(content) };
  } catch (error) {
    log.error('[agents-store] Failed to get global config:', error);
    return getDefaultGlobalConfig();
  }
}

/**
 * 保存全局 Agent 配置
 */
export async function saveGlobalConfig(config: AgentGlobalConfig): Promise<void> {
  try {
    await ensureAgentsDir();
    const configPath = getGlobalConfigPath();
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
    log.info('[agents-store] Global config saved');
  } catch (error) {
    log.error('[agents-store] Failed to save global config:', error);
    throw new Error('保存全局配置失败');
  }
}

/**
 * 获取所有 Agent 列表
 */
export async function getAgentsList(): Promise<AgentConfig[]> {
  try {
    await ensureAgentsDir();
    const agentsDir = getAgentsDir();
    const entries = await fs.readdir(agentsDir, { withFileTypes: true });

    const agents: AgentConfig[] = [];

    // 首先添加内置 Agent
    agents.push(...getBuiltinAgents());

    // 然后读取自定义 Agent
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const agentPath = join(agentsDir, entry.name);
        const agentFile = join(agentPath, 'AGENT.json');

        try {
          await fs.access(agentFile);
          const content = await fs.readFile(agentFile, 'utf-8');
          const agentConfig: AgentConfig = JSON.parse(content);

          // 确保是自定义类型
          agentConfig.type = 'custom';

          agents.push(agentConfig);
        } catch (error) {
          log.warn(`[agents-store] Failed to read agent ${entry.name}:`, error);
        }
      }
    }

    return agents;
  } catch (error) {
    log.error('[agents-store] Failed to get agents list:', error);
    return getBuiltinAgents();
  }
}

/**
 * 获取内置 Agent 列表
 */
function getBuiltinAgents(): AgentConfig[] {
  return [
    {
      id: 'general-purpose',
      name: '通用型',
      description: '适用于大多数任务，平衡处理能力和成本',
      type: 'builtin',
      systemPrompt: 'You are a helpful AI assistant with general purpose capabilities.',
      maxSubAgents: 3,
      timeoutSeconds: 300,
      enableMemory: true,
      memoryCapacity: 100,
    },
    {
      id: 'explore',
      name: '探索型',
      description: '擅长信息收集和探索，适合研究类任务',
      type: 'builtin',
      systemPrompt: 'You are an exploration specialist. Your role is to gather information systematically and comprehensively.',
      maxSubAgents: 5,
      timeoutSeconds: 600,
      enableMemory: true,
      memoryCapacity: 200,
    },
    {
      id: 'code',
      name: '代码型',
      description: '专注于代码相关任务，对编程问题优化',
      type: 'builtin',
      systemPrompt: 'You are a code specialist. Your role is to help with programming, debugging, and software development tasks.',
      maxSubAgents: 2,
      timeoutSeconds: 300,
      enableMemory: true,
      memoryCapacity: 150,
    },
  ];
}

/**
 * 获取 Agent 详情
 */
export async function getAgentDetail(agentId: string): Promise<AgentConfig | null> {
  try {
    // 检查是否是内置 Agent
    const builtinAgents = getBuiltinAgents();
    const builtinAgent = builtinAgents.find(a => a.id === agentId);
    if (builtinAgent) {
      return builtinAgent;
    }

    // 读取自定义 Agent
    const agentFile = getAgentFilePath(agentId);
    const content = await fs.readFile(agentFile, 'utf-8');
    const agentConfig: AgentConfig = JSON.parse(content);
    agentConfig.type = 'custom';

    return agentConfig;
  } catch (error) {
    log.error('[agents-store] Failed to get agent detail:', error);
    return null;
  }
}

/**
 * 创建自定义 Agent
 */
export async function createAgent(config: AgentConfig): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAgentsDir();

    // 验证 Agent ID
    const cleanId = validateAgentName(config.id);

    // 检查是否与内置 Agent 冲突
    const builtinAgents = getBuiltinAgents();
    if (builtinAgents.find(a => a.id === cleanId)) {
      return { success: false, error: 'Agent ID 与内置 Agent 冲突' };
    }

    const agentDir = getAgentDirPath(cleanId);
    const agentFile = getAgentFilePath(cleanId);

    // 原子操作：先写临时文件，再重命名
    const tempFile = agentFile + '.tmp';

    // 生成 Agent 配置
    const now = Date.now();
    const agentConfig: AgentConfig = {
      ...config,
      id: cleanId,
      type: 'custom',
      createdAt: now,
      updatedAt: now,
    };

    // 确保目录存在
    await fs.mkdir(agentDir, { recursive: true });

    // 先写入临时文件
    await fs.writeFile(tempFile, JSON.stringify(agentConfig, null, 2), 'utf-8');

    // 原子性重命名
    try {
      await fs.rename(tempFile, agentFile);
    } catch (renameError: any) {
      // 删除临时文件
      try {
        await fs.unlink(tempFile);
      } catch {
        // 忽略删除临时文件的失败
      }

      if (renameError.code === 'EEXIST') {
        return { success: false, error: 'Agent 已存在' };
      }
      throw renameError;
    }

    log.info(`[agents-store] Agent created: ${cleanId}`);

    return { success: true };
  } catch (error: any) {
    // 处理验证错误
    if (error.message && error.message.includes('Agent 名称')) {
      return { success: false, error: error.message };
    }

    log.error('[agents-store] Failed to create agent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '创建 Agent 失败'
    };
  }
}

/**
 * 更新自定义 Agent
 */
export async function updateAgent(agentId: string, config: Partial<AgentConfig>): Promise<{ success: boolean; error?: string }> {
  try {
    // 不允许修改内置 Agent
    const builtinAgents = getBuiltinAgents();
    if (builtinAgents.find(a => a.id === agentId)) {
      return { success: false, error: '不能修改内置 Agent' };
    }

    const agentFile = getAgentFilePath(agentId);

    // 检查 Agent 是否存在
    try {
      await fs.access(agentFile);
    } catch {
      return { success: false, error: 'Agent 不存在' };
    }

    // 读取现有配置
    const content = await fs.readFile(agentFile, 'utf-8');
    const existingConfig: AgentConfig = JSON.parse(content);

    // 更新配置
    const updatedConfig: AgentConfig = {
      ...existingConfig,
      ...config,
      id: agentId, // 确保 ID 不变
      type: 'custom',
      updatedAt: Date.now(),
    };

    // 写入更新后的配置
    await fs.writeFile(agentFile, JSON.stringify(updatedConfig, null, 2), 'utf-8');

    log.info(`[agents-store] Agent updated: ${agentId}`);

    return { success: true };
  } catch (error: any) {
    log.error('[agents-store] Failed to update agent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新 Agent 失败'
    };
  }
}

/**
 * 删除自定义 Agent
 */
export async function deleteAgent(agentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 不允许删除内置 Agent
    const builtinAgents = getBuiltinAgents();
    if (builtinAgents.find(a => a.id === agentId)) {
      return { success: false, error: '不能删除内置 Agent' };
    }

    const agentDir = getAgentDirPath(agentId);

    // 检查 Agent 是否存在
    try {
      await fs.access(agentDir);
    } catch {
      return { success: false, error: 'Agent 不存在' };
    }

    // 删除整个 Agent 目录
    await fs.rm(agentDir, { recursive: true, force: true });
    log.info(`[agents-store] Agent deleted: ${agentId}`);

    return { success: true };
  } catch (error: any) {
    log.error('[agents-store] Failed to delete agent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除 Agent 失败'
    };
  }
}

/**
 * 验证 Agent 配置
 */
export function validateAgentConfig(config: AgentConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查 ID
  if (!config.id || typeof config.id !== 'string') {
    errors.push('Agent ID 不能为空');
  }

  // 检查名称
  if (!config.name || typeof config.name !== 'string') {
    errors.push('Agent 名称不能为空');
  }

  // 检查系统提示词
  if (!config.systemPrompt || typeof config.systemPrompt !== 'string') {
    errors.push('系统提示词不能为空');
  } else if (config.systemPrompt.length < 10) {
    errors.push('系统提示词太短（至少 10 个字符）');
  } else if (config.systemPrompt.length > 10000) {
    errors.push('系统提示词太长（最多 10000 个字符）');
  }

  // 检查数值参数
  if (config.maxSubAgents !== undefined) {
    if (typeof config.maxSubAgents !== 'number' || config.maxSubAgents < 1 || config.maxSubAgents > 10) {
      errors.push('最大子代理数必须在 1-10 之间');
    }
  }

  if (config.timeoutSeconds !== undefined) {
    if (typeof config.timeoutSeconds !== 'number' || config.timeoutSeconds < 30 || config.timeoutSeconds > 600) {
      errors.push('超时时间必须在 30-600 秒之间');
    }
  }

  if (config.memoryCapacity !== undefined) {
    if (typeof config.memoryCapacity !== 'number' || config.memoryCapacity < 10 || config.memoryCapacity > 1000) {
      errors.push('记忆容量必须在 10-1000 之间');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 获取编排配置
 */
export async function getOrchestrationConfig(): Promise<AgentOrchestrationConfig> {
  try {
    const globalConfig = await getGlobalConfig();
    return globalConfig.orchestration || {
      mode: 'parallel',
      agentSequence: [],
      maxConcurrency: 3,
      stopOnFailure: true,
      enableAggregation: true,
      aggregationStrategy: 'all',
    };
  } catch (error) {
    log.error('[agents-store] Failed to get orchestration config:', error);
    return {
      mode: 'parallel',
      agentSequence: [],
      maxConcurrency: 3,
      stopOnFailure: true,
      enableAggregation: true,
      aggregationStrategy: 'all',
    };
  }
}

/**
 * 保存编排配置
 */
export async function saveOrchestrationConfig(config: AgentOrchestrationConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const globalConfig = await getGlobalConfig();
    globalConfig.orchestration = config;
    await saveGlobalConfig(globalConfig);
    log.info('[agents-store] Orchestration config saved');
    return { success: true };
  } catch (error) {
    log.error('[agents-store] Failed to save orchestration config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '保存编排配置失败'
    };
  }
}

/**
 * 验证编排配置
 */
export function validateOrchestrationConfig(config: AgentOrchestrationConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查模式
  const validModes: AgentOrchestrationMode[] = ['parallel', 'sequential', 'alternating', 'cyclic'];
  if (!validModes.includes(config.mode)) {
    errors.push('无效的编排模式');
  }

  // 检查 Agent 序列
  if (!Array.isArray(config.agentSequence)) {
    errors.push('Agent 序列必须是数组');
  }

  // 检查并发数
  if (config.maxConcurrency !== undefined) {
    if (typeof config.maxConcurrency !== 'number' || config.maxConcurrency < 1 || config.maxConcurrency > 10) {
      errors.push('最大并发数必须在 1-10 之间');
    }
  }

  // 检查循环次数
  if (config.cycleCount !== undefined) {
    if (typeof config.cycleCount !== 'number' || config.cycleCount < 0) {
      errors.push('循环次数必须大于等于 0');
    }
  }

  // 检查超时时间
  if (config.agentTimeout !== undefined) {
    if (typeof config.agentTimeout !== 'number' || config.agentTimeout < 10 || config.agentTimeout > 600) {
      errors.push('Agent 超时时间必须在 10-600 秒之间');
    }
  }

  // 检查聚合策略
  const validStrategies = ['first', 'all', 'majority', 'concatenate'];
  if (config.aggregationStrategy && !validStrategies.includes(config.aggregationStrategy)) {
    errors.push('无效的聚合策略');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 获取编排模式的描述
 */
export function getOrchestrationModeDescription(mode: AgentOrchestrationMode): string {
  const descriptions: Record<AgentOrchestrationMode, string> = {
    parallel: '并发模式：所有 Agent 同时执行任务，适合处理独立任务',
    sequential: '串行模式：按顺序执行 Agent，每个 Agent 的输出会传递给下一个',
    alternating: '交替模式：在 Agent 之间交替执行，适合需要多种视角的任务',
    cyclic: '循环模式：循环执行 Agent，适合需要反复验证的场景',
  };
  return descriptions[mode] || '未知模式';
}

/**
 * 获取聚合策略的描述
 */
export function getAggregationStrategyDescription(strategy: 'first' | 'all' | 'majority' | 'concatenate'): string {
  const descriptions: Record<string, string> = {
    first: '首个结果：只返回第一个完成的结果',
    all: '全部结果：返回所有 Agent 的结果',
    majority: '多数结果：返回多数 Agent 同意的结果',
    concatenate: '合并结果：将所有结果合并返回',
  };
  return descriptions[strategy] || '未知策略';
}

