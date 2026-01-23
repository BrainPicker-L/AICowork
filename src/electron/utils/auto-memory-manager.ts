/**
 * 自动记忆管理器
 * 使用钩子机制自动触发记忆存储和搜索
 * 确保 AI 在关键时刻自动处理记忆，而不仅仅依赖提示词
 * 支持语义分析和动态检测，不仅限于关键词匹配
 */

import { log } from '../logger.js';

/**
 * 记忆触发时机
 */
export interface MemoryTrigger {
  /** 触发类型 */
  type: 'pre_task' | 'post_task' | 'on_error' | 'on_success' | 'periodic';
  /** 触发条件 */
  condition: string;
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 记忆存储配置
 */
export interface AutoMemoryConfig {
  /** 是否启用自动记忆 */
  enabled: boolean;
  /** 触发时机配置 */
  triggers: MemoryTrigger[];
  /** 自动记忆的关键词模式 */
  keywords: string[];
  /** 需要自动记忆的工具名称 */
  toolsToRemember: string[];
  /** 重要性阈值（0-100），低于此分数不存储 */
  importanceThreshold?: number;
}

/**
 * 重要性分数
 */
export interface ImportanceScore {
  /** 分数 0-100 */
  score: number;
  /** 评分原因 */
  reasons: string[];
  /** 分类 */
  category: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * 会话消息
 */
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * 话题
 */
interface Topic {
  name: string;
  confidence: number;
  keywords: string[];
}

/**
 * 问题-解决方案对
 */
interface ProblemSolution {
  problem: string;
  solution: string;
  timestamp: number;
}

/**
 * 增强的记忆上下文（包含会话内容和语义分析）
 */
interface EnhancedMemoryContext {
  /** 任务开始时的用户输入 */
  taskStart: string;
  /** 已执行的工具调用 */
  toolCalls: Array<{ tool: string; input: any; timestamp: number }>;
  /** 重要的输出内容 */
  importantOutputs: string[];
  /** 检测到的关键词 */
  detectedKeywords: string[];
  /** 会话消息历史 */
  conversationHistory: ChatMessage[];
  /** 检测到的话题 */
  topics: Topic[];
  /** 问题-解决方案对 */
  problemSolutions: ProblemSolution[];
  /** 重要性分数 */
  importanceScore?: ImportanceScore;
}

/**
 * 默认自动记忆配置
 */
const DEFAULT_AUTO_MEMORY_CONFIG: AutoMemoryConfig = {
  enabled: true,
  triggers: [
    {
      type: 'pre_task',
      condition: 'always',
      enabled: true
    },
    {
      type: 'post_task',
      condition: 'on_completion',
      enabled: true
    }
  ],
  keywords: [
    '配置', 'config', 'configuration',
    '决策', 'decision', '决定',
    '方案', 'solution', '解决方案',
    '问题', 'problem', 'issue', 'bug',
    '修复', 'fix', 'solved',
    '架构', 'architecture',
    '设计', 'design', 'pattern',
    '命令', 'command', 'cli',
    '约定', 'convention', '规范'
  ],
  toolsToRemember: [
    'Edit', 'Write', // 文件编辑操作
    'Bash',          // 命令执行
    'Task',          // 子任务完成
    'commit',        // Git 提交
  ],
  importanceThreshold: 30 // 默认阈值30分
};

/**
 * 当前配置
 */
let autoMemoryConfig: AutoMemoryConfig = { ...DEFAULT_AUTO_MEMORY_CONFIG };

/**
 * 增强的记忆上下文
 */
let currentContext: EnhancedMemoryContext = {
  taskStart: '',
  toolCalls: [],
  importantOutputs: [],
  detectedKeywords: [],
  conversationHistory: [],
  topics: [],
  problemSolutions: []
};

/**
 * 技术话题模式（用于语义分析）
 */
const TECHNICAL_PATTERNS = {
  architecture: ['架构', 'architecture', '设计模式', 'design pattern', '模块化', 'modular'],
  configuration: ['配置', 'config', 'setting', '环境变量', 'env', '部署', 'deploy'],
  debugging: ['调试', 'debug', '错误', 'error', '异常', 'exception', '问题', 'problem'],
  api: ['API', '接口', 'endpoint', '请求', 'request', '响应', 'response'],
  database: ['数据库', 'database', 'SQL', '查询', 'query', '表', 'table'],
  frontend: ['前端', 'frontend', 'UI', '组件', 'component', '样式', 'style'],
  backend: ['后端', 'backend', '服务', 'service', '逻辑', 'business logic'],
  performance: ['性能', 'performance', '优化', 'optimize', '缓存', 'cache'],
  security: ['安全', 'security', '认证', 'auth', '权限', 'permission'],
  git: ['git', '提交', 'commit', '分支', 'branch', '合并', 'merge'],
};

/**
 * 问题模式（用于检测问题）
 * 注意：不使用 g 标志，避免正则状态问题
 */
const PROBLEM_PATTERNS = [
  /如何|how to|怎么|怎样|如何解决/i,
  /错误|error|失败|failed|问题|problem|bug/i,
  /不能|无法|can't|cannot|unable/i,
  /报错|异常|exception/i,
];

/**
 * 解决方案模式
 * 注意：不使用 g 标志，避免正则状态问题
 */
const SOLUTION_PATTERNS = [
  /解决|solved|fixed|修复|fix/i,
  /方法|method|方案|solution/i,
  /通过.*实现|implemented|使用/i,
  /成功|successfully|完成|completed/i,
];

/**
 * 设置自动记忆配置
 */
export function setAutoMemoryConfig(config: Partial<AutoMemoryConfig>): void {
  autoMemoryConfig = { ...autoMemoryConfig, ...config };
  log.info('[Auto Memory] Config updated:', config);
}

/**
 * 获取自动记忆配置
 */
export function getAutoMemoryConfig(): AutoMemoryConfig {
  return autoMemoryConfig;
}

/**
 * 重置记忆上下文
 */
export function resetMemoryContext(): void {
  currentContext = {
    taskStart: '',
    toolCalls: [],
    importantOutputs: [],
    detectedKeywords: [],
    conversationHistory: [],
    topics: [],
    problemSolutions: []
  };
}

/**
 * 记录任务开始
 */
export function recordTaskStart(prompt: string): void {
  currentContext.taskStart = prompt;
  currentContext.detectedKeywords = detectKeywords(prompt);

  // 记录为用户消息
  recordUserMessage(prompt);

  // 分析话题
  const topics = analyzeTopics(prompt);
  currentContext.topics.push(...topics);

  log.info('[Auto Memory] Task started, keywords detected:', currentContext.detectedKeywords);
  log.info('[Auto Memory] Topics detected:', topics.map(t => t.name));
}

/**
 * 记录工具调用
 */
export function recordToolCall(toolName: string, input: any): void {
  currentContext.toolCalls.push({
    tool: toolName,
    input,
    timestamp: Date.now()
  });

  // 检测工具输入中的关键词
  if (input && typeof input === 'object') {
    const inputStr = JSON.stringify(input);
    const keywords = detectKeywords(inputStr);
    if (keywords.length > 0) {
      currentContext.detectedKeywords.push(...keywords);
    }
  }
}

/**
 * 记录用户消息
 */
export function recordUserMessage(content: string): void {
  currentContext.conversationHistory.push({
    role: 'user',
    content,
    timestamp: Date.now()
  });

  // 检测问题-解决方案对
  detectProblemSolutionPairs(content, 'user');
}

/**
 * 记录 AI 响应
 */
export function recordAIResponse(content: string): void {
  currentContext.conversationHistory.push({
    role: 'assistant',
    content,
    timestamp: Date.now()
  });

  // 检测问题-解决方案对
  detectProblemSolutionPairs(content, 'assistant');
}

/**
 * 检测关键词
 */
function detectKeywords(text: string): string[] {
  const detected: string[] = [];
  const lowerText = text.toLowerCase();

  for (const keyword of autoMemoryConfig.keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      detected.push(keyword);
    }
  }

  return [...new Set(detected)]; // 去重
}

/**
 * 分析话题（语义分析，超越关键词）
 */
export function analyzeTopics(text: string): Topic[] {
  const topics: Topic[] = [];
  const lowerText = text.toLowerCase();

  for (const [category, patterns] of Object.entries(TECHNICAL_PATTERNS)) {
    let matchCount = 0;
    const matchedPatterns: string[] = [];

    for (const pattern of patterns) {
      if (lowerText.includes(pattern.toLowerCase())) {
        matchCount++;
        matchedPatterns.push(pattern);
      }
    }

    if (matchCount > 0) {
      // 计算置信度（基于匹配数量）
      const confidence = Math.min(matchCount * 0.3, 1.0);
      topics.push({
        name: category,
        confidence,
        keywords: matchedPatterns
      });
    }
  }

  return topics;
}

/**
 * 检测问题-解决方案对
 */
function detectProblemSolutionPairs(text: string, source: 'user' | 'assistant'): void {
  // 检测是否包含问题
  const hasProblem = PROBLEM_PATTERNS.some(pattern => pattern.test(text));

  if (hasProblem) {
    // 如果是用户消息，记录问题
    if (source === 'user') {
      // 查找最近的未匹配问题
      const existingPair = currentContext.problemSolutions.find(p => !p.solution);

      if (!existingPair) {
        currentContext.problemSolutions.push({
          problem: text.substring(0, 200),
          solution: '',
          timestamp: Date.now()
        });
      }
    }
  }

  // 检测是否包含解决方案
  const hasSolution = SOLUTION_PATTERNS.some(pattern => pattern.test(text));

  if (hasSolution && source === 'assistant') {
    // 找到最近的问题并添加解决方案
    const unsolvedProblem = [...currentContext.problemSolutions].reverse().find(p => !p.solution);

    if (unsolvedProblem) {
      unsolvedProblem.solution = text.substring(0, 200);
      log.info('[Auto Memory] Problem-solution pair detected');
    }
  }
}

/**
 * 计算重要性分数（0-100）
 */
export function calculateImportanceScore(): ImportanceScore {
  const reasons: string[] = [];
  let score = 0;

  // 1. 工具调用评分 (最多40分)
  const toolCount = currentContext.toolCalls.length;
  if (toolCount >= 5) {
    score += 20;
    reasons.push(`大量工具调用 (${toolCount}个)`);
  } else if (toolCount >= 3) {
    score += 10;
    reasons.push(`中等工具调用 (${toolCount}个)`);
  }

  // 检查是否有重要工具
  const hasImportantTools = currentContext.toolCalls.some(call =>
    autoMemoryConfig.toolsToRemember.some(tool =>
      call.tool.includes(tool) || tool.includes(call.tool)
    )
  );

  if (hasImportantTools) {
    score += 20;
    reasons.push('包含重要工具操作 (Edit/Write/Bash/commit)');
  }

  // 2. 关键词评分 (最多20分)
  const keywordCount = currentContext.detectedKeywords.length;
  if (keywordCount >= 3) {
    score += 15;
    reasons.push(`多个关键词 (${keywordCount}个)`);
  } else if (keywordCount >= 1) {
    score += 5;
    reasons.push(`检测到关键词 (${keywordCount}个)`);
  }

  // 3. 技术话题评分 (最多15分)
  const highConfidenceTopics = currentContext.topics.filter(t => t.confidence >= 0.6);
  if (highConfidenceTopics.length >= 2) {
    score += 15;
    reasons.push(`多个技术话题 (${highConfidenceTopics.map(t => t.name).join(', ')})`);
  } else if (highConfidenceTopics.length === 1) {
    score += 8;
    reasons.push(`技术话题: ${highConfidenceTopics[0].name}`);
  }

  // 4. 会话内容评分 (最多15分)
  const conversationRounds = Math.floor(currentContext.conversationHistory.length / 2);
  if (conversationRounds >= 3) {
    score += 10;
    reasons.push(`多轮对话 (${conversationRounds}轮)`);
  } else if (conversationRounds >= 1) {
    score += 5;
    reasons.push(`有对话交互`);
  }

  // 检查输入长度
  const totalInputLength = currentContext.conversationHistory.reduce((sum, msg) => sum + msg.content.length, 0);
  if (totalInputLength > 500) {
    score += 5;
    reasons.push('会话内容较长');
  }

  // 5. 问题-解决方案对评分 (最多10分)
  const completedPairs = currentContext.problemSolutions.filter(p => p.solution).length;
  if (completedPairs >= 1) {
    score += 10;
    reasons.push(`问题-解决方案对 (${completedPairs}个)`);
  }

  // 确定分数不超过100
  score = Math.min(score, 100);

  // 确定分类
  let category: 'critical' | 'high' | 'medium' | 'low';
  if (score >= 80) {
    category = 'critical';
  } else if (score >= 60) {
    category = 'high';
  } else if (score >= 40) {
    category = 'medium';
  } else {
    category = 'low';
  }

  currentContext.importanceScore = { score, reasons, category };

  log.info('[Auto Memory] Importance score calculated:', { score, category, reasons });

  return { score, reasons, category };
}

/**
 * 判断是否应该自动存储记忆（基于重要性分数）
 */
export function shouldAutoStoreMemory(): boolean {
  if (!autoMemoryConfig.enabled) {
    return false;
  }

  // 计算重要性分数
  const { score, category } = calculateImportanceScore();

  // 检查是否超过阈值
  const threshold = autoMemoryConfig.importanceThreshold ?? 30;
  const shouldStore = score >= threshold;

  log.info('[Auto Memory] Should store memory:', {
    score,
    threshold,
    category,
    shouldStore,
    reasons: currentContext.importanceScore?.reasons
  });

  return shouldStore;
}

/**
 * 生成自动记忆内容
 */
export function generateAutoMemoryContent(): { title: string; text: string; label: string } | null {
  // 即使没有工具调用，如果有会话内容也可以生成记忆
  const hasContent = currentContext.toolCalls.length > 0 ||
                     currentContext.conversationHistory.length > 0 ||
                     currentContext.topics.length > 0;

  if (!hasContent) {
    return null;
  }

  // 提取关键信息
  const keywords = [...new Set(currentContext.detectedKeywords)];
  const tools = [...new Set(currentContext.toolCalls.map(c => c.tool))];
  const topics = [...new Set(currentContext.topics.map(t => t.name))];

  // 生成标题
  const title = generateMemoryTitle(keywords, tools, topics);

  // 生成内容
  const text = generateMemoryText(tools, keywords, topics);

  // 确定标签
  const label = determineMemoryLabel(keywords, tools, topics);

  return { title, text, label };
}

/**
 * 生成记忆标题
 */
function generateMemoryTitle(keywords: string[], tools: string[], topics: string[]): string {
  // 优先使用话题生成标题
  if (topics.length > 0) {
    return topics.slice(0, 2).join('/') + '记录';
  }

  // 使用关键词生成标题
  if (keywords.length > 0) {
    return keywords.slice(0, 2).join('/') + '操作记录';
  }

  // 使用工具名称生成标题
  if (tools.includes('Edit') || tools.includes('Write')) {
    return '文件修改记录';
  }
  if (tools.includes('Bash')) {
    return '命令执行记录';
  }
  if (tools.includes('commit')) {
    return 'Git提交记录';
  }

  return '任务执行记录';
}

/**
 * 生成记忆内容（增强版，包含会话和话题）
 */
function generateMemoryText(tools: string[], keywords: string[], topics: string[]): string {
  const lines: string[] = [];

  // 添加任务概要
  if (currentContext.taskStart) {
    lines.push(`## 任务`);
    lines.push(currentContext.taskStart.substring(0, 200));
    lines.push('');
  }

  // 添加检测到的话题
  if (topics.length > 0) {
    lines.push(`## 涉及话题`);
    lines.push(topics.join(', '));
    lines.push('');
  }

  // 添加检测到的关键词
  if (keywords.length > 0) {
    lines.push(`## 关键词`);
    lines.push(keywords.join(', '));
    lines.push('');
  }

  // 添加使用的工具
  if (tools.length > 0) {
    lines.push(`## 使用的工具`);
    lines.push(tools.join(', '));
    lines.push('');
  }

  // 添加问题-解决方案对
  const completedPairs = currentContext.problemSolutions.filter(p => p.solution);
  if (completedPairs.length > 0) {
    lines.push(`## 问题与解决方案`);
    for (const pair of completedPairs.slice(0, 3)) {
      lines.push(`**问题**: ${pair.problem.substring(0, 100)}`);
      lines.push(`**解决**: ${pair.solution.substring(0, 100)}`);
      lines.push('');
    }
  }

  // 添加会话摘要
  if (currentContext.conversationHistory.length > 0) {
    lines.push(`## 会话摘要`);
    const rounds = Math.floor(currentContext.conversationHistory.length / 2);
    lines.push(`共 ${rounds} 轮对话`);
    lines.push('');
  }

  // 添加工具调用详情
  if (currentContext.toolCalls.length > 0) {
    lines.push(`## 操作详情`);
    for (const call of currentContext.toolCalls.slice(0, 5)) {
      lines.push(`- ${call.tool}: ${JSON.stringify(call.input).substring(0, 100)}`);
    }
    if (currentContext.toolCalls.length > 5) {
      lines.push(`- ... 共 ${currentContext.toolCalls.length} 个操作`);
    }
  }

  // 添加重要性分数
  if (currentContext.importanceScore) {
    lines.push('');
    lines.push(`## 重要性评分`);
    lines.push(`分数: ${currentContext.importanceScore.score}/100`);
    lines.push(`分类: ${currentContext.importanceScore.category}`);
  }

  return lines.join('\n');
}

/**
 * 确定记忆标签（增强版，考虑话题）
 */
function determineMemoryLabel(keywords: string[], tools: string[], topics: string[]): string {
  // 优先级：preference > project > technical > custom
  const prefKeywords = ['偏好', '设置', '配置', 'preference', 'config', 'setting'];
  const prefTopics = ['configuration'];

  const projKeywords = ['项目', '工程', '约定', '规范', 'project', 'convention'];
  const projTopics = ['architecture'];

  if (keywords.some(k => prefKeywords.some(pk => k.toLowerCase().includes(pk))) ||
      topics.some(t => prefTopics.some(pt => t.toLowerCase().includes(pt)))) {
    return 'preference';
  }
  if (keywords.some(k => projKeywords.some(pk => k.toLowerCase().includes(pk))) ||
      topics.some(t => projTopics.some(pt => t.toLowerCase().includes(pt)))) {
    return 'project';
  }
  if (tools.includes('Edit') || tools.includes('Write') || tools.includes('Bash')) {
    return 'technical';
  }

  return 'custom';
}

/**
 * 创建 SDK 钩子配置，用于自动记忆
 */
export function createAutoMemoryHooks() {
  return {
    PostToolUse: [
      {
        hooks: [
          async (input: any) => {
            try {
              const { tool_name, result } = input;

              // 记录工具调用
              recordToolCall(tool_name, input);

              // 如果工具返回了重要结果，记录下来
              if (result && typeof result === 'object') {
                const resultStr = JSON.stringify(result);
                if (resultStr.length > 50 && resultStr.length < 1000) {
                  currentContext.importantOutputs.push(resultStr);
                }
              }

              log.debug(`[Auto Memory Hook] Recorded tool call: ${tool_name}`);

              return { continue: true };
            } catch (error) {
              log.warn('[Auto Memory Hook] Error in PostToolUse:', error);
              return { continue: true };
            }
          }
        ]
      }
    ]
  };
}

/**
 * 获取当前上下文（用于调试）
 */
export function getCurrentContext(): EnhancedMemoryContext {
  return { ...currentContext };
}

/**
 * 更新会话上下文（批量导入历史消息）
 */
export function updateConversationContext(messages: Array<{ role: 'user' | 'assistant'; content: string }>): void {
  for (const msg of messages) {
    if (msg.role === 'user') {
      recordUserMessage(msg.content);
    } else {
      recordAIResponse(msg.content);
    }
  }

  // 分析所有消息的话题
  const allText = messages.map(m => m.content).join('\n');
  const topics = analyzeTopics(allText);
  currentContext.topics.push(...topics.filter(t =>
    !currentContext.topics.some(ct => ct.name === t.name)
  ));

  log.info(`[Auto Memory] Updated context with ${messages.length} messages`);
}
