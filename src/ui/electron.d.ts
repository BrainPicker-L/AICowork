export interface ApiConfig {
  id: string;
  name: string;
  apiKey: string;
  baseURL: string;
  model: string;
  apiType?: string;
  /** API 规范类型：openai、anthropic、gemini、vertex-ai */
  apiSpec?: 'openai' | 'anthropic' | 'gemini' | 'vertex-ai';
  /** Azure 特定：资源名称 */
  resourceName?: string;
  /** Azure 特定：部署名称 */
  deploymentName?: string;
  /** 自定义请求头 */
  customHeaders?: Record<string, string>;
  /** 高级参数：Temperature (0-2) */
  temperature?: number;
  /** 高级参数：Max Tokens */
  maxTokens?: number;
  /** 高级参数：Top P (0-1) */
  topP?: number;
  isActive?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface ApiProvider {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface ProviderConfig {
  baseURL: string;
  models: string[];
  defaultModel: string;
  description: string;
}

export interface TestApiResult {
  success: boolean;
  message: string;
  details?: string;
  responseTime?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/** MCP 服务器配置 */
export interface McpServerConfig {
  // 传输类型（可选，SDK 会自动识别）
  type?: 'stdio' | 'sse' | 'http' | 'streamable_http';
  
  // stdio 类型
  command?: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  
  // sse 类型
  url?: string;
  
  // http/streamable_http 类型
  httpUrl?: string;
  
  headers?: Record<string, string>;
  
  // 通用字段
  displayName?: string;
  description?: string;
  enabled?: boolean;
  timeout?: number;
  trust?: boolean;
  includeTools?: string[];
  excludeTools?: string[];
  
  // 已废弃（兼容）
  disabled?: boolean;
  name?: string;
}

/** Skills 配置 */
export interface SkillConfig {
  name: string;
  description: string;
  prompt: string;
  script?: {
    type: 'javascript' | 'python';
    content?: string;
    path?: string;
  };
  createdAt?: number;
  updatedAt?: number;
}

/** 贾维斯元信息 */
export interface JarvisMetadata {
  name: string;
  description: string;
  version: string;
  author: string;
  authorEmail?: string;
  tags: string[];
}

/** MCP 服务器配置（扩展） */
export interface JarvisMcpServerConfig extends McpServerConfig {
  description?: string;
  requiresUserInput?: Record<string, {
    description: string;
    type: 'text' | 'password';
    required: boolean;
  }>;
}

/** 贾维斯完整配置 */
export interface JarvisConfig {
  jarvis: JarvisMetadata & {
    createdAt: string;
    updatedAt: string;
  };
  mcpServers: Record<string, JarvisMcpServerConfig>;
  skills: string[];
  dependencies: {
    npm: string[];
    python: string[];
  };
  statistics: {
    mcpServersCount: number;
    skillsCount: number;
    totalSize: string;
  };
}

/** 贾维斯导入选项 */
export interface ImportOptions {
  skipExisting?: boolean;
  overwrite?: boolean;
  userInputs?: Record<string, Record<string, string>>;
}

/** 贾维斯导入结果 */
export interface ImportResult {
  success: boolean;
  imported: {
    mcpServers: string[];
    skills: string[];
  };
  skipped: {
    mcpServers: string[];
    skills: string[];
  };
  errors: string[];
}

/** 技能标签 */
export interface SkillTag {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

/** 技能元数据（用户备注和标签） */
export interface SkillMetadata {
  skillName: string;
  note?: string;
  tags: string[];
  updatedAt: number;
}

/** Agent 配置 */
export interface AgentConfig {
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

/** 全局 Agent 配置 */
export interface GlobalAgentConfig {
  maxSubAgents: number;
  defaultAgentId: string;
  autoEnableSubAgents: boolean;
  timeoutSeconds: number;
}

/** 编排配置 */
export interface OrchestrationConfig {
  mode: 'parallel' | 'sequential' | 'alternating' | 'cyclic';
  agentSequence: string[];
  maxConcurrency?: number;
  cycleCount?: number;
  stopOnFailure?: boolean;
  agentTimeout?: number;
  enableAggregation?: boolean;
  aggregationStrategy?: 'first' | 'all' | 'majority' | 'concatenate';
}

/** Hooks 配置 */
export interface HookConfig {
  type: 'preToolUse' | 'postToolUse';
  hook: string;
  command: string;
  description?: string;
}

export interface HooksStore {
  preToolUse: Array<{ hook: string; command: string; description?: string }>;
  postToolUse: Array<{ hook: string; command: string; description?: string }>;
}

/** Permissions 配置 */
export interface PermissionRule {
  tool: string;
  allowed: boolean;
  description?: string;
}

export interface PermissionsStore {
  allowedTools: string[];
  customRules: PermissionRule[];
}

/** Output 配置 */
export interface OutputConfig {
  format: 'markdown' | 'plain' | 'html' | 'json';
  theme: 'default' | 'dark' | 'light' | 'monokai' | 'github' | 'dracula' | 'nord';
  codeHighlight: boolean;
  showLineNumbers: boolean;
  fontSize: 'small' | 'medium' | 'large';
  wrapCode: boolean;
  renderer?: 'standard' | 'enhanced';
}

/** Session 信息 */
export interface SessionInfo {
  sessionId: string;
  title: string;
  cwd: string;
  updatedAt: number;
  createdAt: number;
  messageCount?: number;
}

/** 记忆种类 */
export interface MemoryKind {
  id: string;
  name: string;
  description?: string;
  color?: string;
  schema?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

/** 记忆条目 */
export interface MemoryEntry {
  id: string;
  kindId: string;
  content: string;
  summary?: string;
  entities?: string[];
  importance?: 'low' | 'medium' | 'high';
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface ElectronAPI {
  subscribeStatistics: (callback: (stats: any) => void) => () => void;
  getStaticData: () => Promise<any>;
  sendClientEvent: (event: any) => void;
  onServerEvent: (callback: (event: any) => void) => () => void;
  generateSessionTitle: (userInput: string | null) => Promise<string>;
  getRecentCwds: (limit?: number) => Promise<string[]>;
  selectDirectory: () => Promise<string | null>;
  getApiConfig: () => Promise<ApiConfig | null>;
  getApiConfigById: (configId: string) => Promise<ApiConfig | null>;
  getAllApiConfigs: () => Promise<{ activeConfigId?: string; configs: ApiConfig[] }>;
  saveApiConfig: (config: ApiConfig) => Promise<{ success: boolean; error?: string }>;
  deleteApiConfig: (configId: string) => Promise<{ success: boolean; error?: string }>;
  setActiveApiConfig: (configId: string) => Promise<{ success: boolean; error?: string }>;
  checkApiConfig: () => Promise<{ hasConfig: boolean; config: ApiConfig | null }>;
  /** 验证 API 配置 */
  validateApiConfig: (config: ApiConfig) => Promise<ValidationResult>;
  /** 获取支持的厂商列表 */
  getSupportedProviders: () => Promise<ApiProvider[]>;
  /** 获取厂商配置 */
  getProviderConfig: (provider: string) => Promise<ProviderConfig>;
  /** 获取支持 Anthropic 格式的 URL 列表 */
  getAnthropicFormatUrls: () => Promise<Record<string, string>>;
  /** 获取所有预设 URL 列表 */
  getAllPresetUrls: () => Promise<Array<{ provider: string; name: string; url: string; description: string }>>;
  testApiConnection: (config: ApiConfig) => Promise<TestApiResult>;
  /** 发送前端日志到主进程 */
  sendLog: (logMessage: { level: string; message: string; meta?: unknown; timestamp: string }) => Promise<void>;
  /** 打开外部链接 */
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
  /** 重命名会话 */
  renameSession: (sessionId: string, newTitle: string) => Promise<{ success: boolean; error?: string }>;
  /** MCP 服务器操作 */
  getMcpServers: () => Promise<Record<string, McpServerConfig>>;
  getMcpServerList: () => Promise<Array<{ name: string; config: McpServerConfig }>>;
  saveMcpServer: (name: string, config: McpServerConfig) => Promise<{ success: boolean; error?: string }>;
  deleteMcpServer: (name: string) => Promise<{ success: boolean; error?: string }>;
  toggleMcpServerEnabled: (name: string, enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  validateMcpServer: (config: McpServerConfig) => Promise<ValidationResult>;
  testMcpServer: (config: McpServerConfig) => Promise<TestApiResult>;
  getMcpServerTools: (config: McpServerConfig) => Promise<Array<{ name: string; description?: string; inputSchema?: Record<string, unknown>; outputSchema?: Record<string, unknown> }>>;
  getMcpTemplates: () => Promise<Record<string, McpServerConfig>>;
  /** 记忆操作 */
  getMemoryKinds: () => Promise<MemoryKind[]>;
  getMemoryKind: (id: string) => Promise<MemoryKind | null>;
  createMemoryKind: (kind: Omit<MemoryKind, 'id' | 'createdAt' | 'updatedAt'>) => Promise<MemoryKind>;
  updateMemoryKind: (id: string, patch: Partial<Omit<MemoryKind, 'id' | 'createdAt'>>) => Promise<{ success: boolean; error?: string }>;
  deleteMemoryKind: (id: string) => Promise<{ success: boolean; error?: string }>;
  getMemoryEntries: (kindId?: string, options?: { includeDeleted?: boolean }) => Promise<MemoryEntry[]>;
  getMemoryEntry: (id: string) => Promise<MemoryEntry | null>;
  createMemoryEntry: (entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<MemoryEntry>;
  updateMemoryEntry: (id: string, patch: Partial<Omit<MemoryEntry, 'id' | 'createdAt'>>) => Promise<{ success: boolean; error?: string }>;
  deleteMemoryEntry: (id: string, soft?: boolean) => Promise<{ success: boolean; error?: string }>;
  searchMemoryEntries: (params: { kindId?: string; query?: string; importance?: MemoryEntry['importance']; limit?: number }) => Promise<MemoryEntry[]>;
  /** Skills 操作 */
  getSkillsList: () => Promise<SkillConfig[]>;
  importSkill: (sourcePath: string) => Promise<{ success: boolean; error?: string }>;
  deleteSkill: (skillName: string) => Promise<{ success: boolean; error?: string }>;
  openSkillsDirectory: () => Promise<{ success: boolean; error?: string }>;
  openPluginsDirectory: () => Promise<{ success: boolean; error?: string }>;
  /** 技能元数据操作 */
  getSkillMetadata: (skillName: string) => Promise<{ metadata: SkillMetadata | null; tags: SkillTag[] } | null>;
  getAllSkillsMetadata: () => Promise<Record<string, { metadata: SkillMetadata; tags: SkillTag[] }>>;
  setSkillNote: (skillName: string, note: string) => Promise<{ success: boolean; error?: string }>;
  deleteSkillNote: (skillName: string) => Promise<{ success: boolean; error?: string }>;
  /** 标签操作 */
  getAllTags: () => Promise<SkillTag[]>;
  createTag: (name: string, color: string) => Promise<{ success: boolean; tag?: SkillTag; error?: string }>;
  deleteTag: (tagId: string) => Promise<{ success: boolean; error?: string }>;
  updateTag: (tagId: string, updates: { name?: string; color?: string }) => Promise<{ success: boolean; tag?: SkillTag; error?: string }>;
  addTagToSkill: (skillName: string, tagId: string) => Promise<{ success: boolean; error?: string }>;
  removeTagFromSkill: (skillName: string, tagId: string) => Promise<{ success: boolean; error?: string }>;
  /** Agents 操作 */
  getAgentsList: () => Promise<AgentConfig[]>;
  getAgentDetail: (agentId: string) => Promise<AgentConfig | null>;
  getGlobalAgentConfig: () => Promise<GlobalAgentConfig>;
  saveGlobalAgentConfig: (config: GlobalAgentConfig) => Promise<{ success: boolean; error?: string }>;
  createAgent: (agentConfig: Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
  updateAgent: (agentId: string, config: Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
  deleteAgent: (agentId: string) => Promise<{ success: boolean; error?: string }>;
  getOrchestrationConfig: () => Promise<OrchestrationConfig>;
  saveOrchestrationConfig: (config: OrchestrationConfig) => Promise<{ success: boolean; error?: string }>;
  openAgentsDirectory: () => Promise<{ success: boolean; error?: string }>;
  /** Hooks 操作 */
  getHooksConfig: () => Promise<HooksStore>;
  saveHook: (config: HookConfig) => Promise<{ success: boolean; error?: string }>;
  deleteHook: (hookType: string, hookName: string) => Promise<{ success: boolean; error?: string }>;
  /** Permissions 操作 */
  getPermissionsConfig: () => Promise<PermissionsStore>;
  savePermissionRule: (rule: PermissionRule) => Promise<{ success: boolean; error?: string }>;
  deletePermissionRule: (toolName: string) => Promise<{ success: boolean; error?: string }>;
  /** Output 操作 */
  getOutputConfig: () => Promise<OutputConfig>;
  saveOutputConfig: (config: Partial<OutputConfig>) => Promise<{ success: boolean; error?: string }>;
  /** Rules 操作 */
  getRulesList: () => Promise<{ success: boolean; rules?: Array<{ path: string; content: string }> }>;
  saveRule: (rulePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  createRule: (name: string, content: string) => Promise<{ success: boolean; error?: string }>;
  deleteRule: (rulePath: string) => Promise<{ success: boolean; error?: string }>;
  /** Claude.md 配置操作 */
  getClaudeConfig: () => Promise<{ success: boolean; exists: boolean; config?: string }>;
  saveClaudeConfig: (content: string) => Promise<{ success: boolean; error?: string }>;
  deleteClaudeConfig: () => Promise<{ success: boolean; error?: string }>;
  openClaudeDirectory: () => Promise<{ success: boolean; error?: string }>;
  /** Jarvis 配置操作 */
  exportJarvisConfig: (metadata: JarvisMetadata, outputPath: string) => Promise<{ success: boolean; error?: string }>;
  previewJarvisConfig: (jarvisPath: string) => Promise<{ success: boolean; config?: JarvisConfig; error?: string }>;
  importJarvisConfig: (jarvisPath: string, options: ImportOptions) => Promise<ImportResult>;
  saveJarvisDialog: () => Promise<string | null>;
  openJarvisDialog: () => Promise<string | null>;
  /** Session Recovery 操作 */
  getSessionsList: () => Promise<SessionInfo[]>;
  getSessionHistory: (sessionId: string) => Promise<any>;
  recoverSession: (sessionId: string) => Promise<{ success: boolean; error?: string; sessionId?: string }>;
  deleteSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  /** Language Preference 操作 */
  setLanguagePreference: (language: string) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
