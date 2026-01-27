export interface ApiConfig {
  id: string;
  name: string;
  apiKey: string;
  baseURL: string;
  model: string;
  apiType?: string;
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
}

/** MCP 服务器配置 */
export interface McpServerConfig {
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
  validateMcpServer: (config: McpServerConfig) => Promise<ValidationResult>;
  testMcpServer: (config: McpServerConfig) => Promise<TestApiResult>;
  getMcpServerTools: (config: McpServerConfig) => Promise<Array<{ name: string; description?: string; inputSchema?: Record<string, unknown>; outputSchema?: Record<string, unknown> }>>;
  getMcpTemplates: () => Promise<Record<string, McpServerConfig>>;
  /** Skills 操作 */
  getSkillsList: () => Promise<SkillConfig[]>;
  createSkill: (config: { name: string; description: string; prompt: string; script?: { type: 'javascript' | 'python'; content?: string; path?: string } }) => Promise<{ success: boolean; error?: string }>;
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
  /** Memory 配置操作 */
  memoryGetConfig: () => Promise<{ success: boolean; config?: { enabled: boolean; autoStore: boolean; autoStoreCategories: string[]; searchMode: string; defaultK: number; availableTags?: string[] } }>;
  memorySetConfig: (config: { enabled: boolean; autoStore: boolean; autoStoreCategories: string[]; searchMode: string; defaultK: number; availableTags?: string[] }) => Promise<{ success: boolean; error?: string }>;
  /** Memory 数据操作 */
  memoryGetStats: () => Promise<{ success: boolean; error?: string; stats?: { frame_count: number; size_bytes: number; has_lex_index: boolean; has_vec_index: boolean } }>;
  memoryGetTimeline: (options?: { limit?: number; reverse?: boolean }) => Promise<{ success: boolean; error?: string; entries?: any[] }>;
  memoryPutDocument: (input: any) => Promise<{ success: boolean; error?: string; id?: string }>;
  memoryFindDocuments: (query: string, options?: any) => Promise<{ success: boolean; error?: string; results?: any }>;
  memoryAskQuestion: (question: string, options?: any) => Promise<{ success: boolean; error?: string; answer?: string; context?: string }>;
  memoryGetDocument: (id: string) => Promise<{ success: boolean; error?: string; document?: any }>;
  memoryUpdateDocument: (id: string, updates: { title?: string; text?: string; label?: string; tags?: string[] }) => Promise<{ success: boolean; error?: string }>;
  memoryDeleteDocument: (id: string) => Promise<{ success: boolean; error?: string }>;
  memoryClear: () => Promise<{ success: boolean; error?: string }>;
  memoryImportFile: (filePath: string) => Promise<{ success: boolean; error?: string; count?: number }>;
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
