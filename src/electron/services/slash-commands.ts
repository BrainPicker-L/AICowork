/**
 * 斜杠命令管理 - 动态获取可用的斜杠命令列表
 *
 * 实现机制：
 * - SDK 内置命令（如 /commit）直接发送
 * - 用户技能（如 /git-commit）转换为"请使用 X 技能"再发送
 */

import { join } from "path";
import { existsSync, readdirSync, readFileSync } from "fs";
import { log } from "../logger.js";
import { app } from "electron";

/**
 * Claude Code settings.json 配置结构
 */
interface ClaudeSettings {
  enabledPlugins?: Record<string, boolean>;
  mcpServers?: Record<string, McpServerConfig>;
  hooks?: Record<string, unknown>;
  permissions?: Record<string, unknown>;
}

interface McpServerConfig {
  command?: string;
  args?: string[];
  url?: string;
  type?: string;
  disabled?: boolean;
  env?: Record<string, string>;
}

/**
 * 获取用户主目录（兼容开发环境和打包环境）
 */
function getUserHomeDir(): string {
  try {
    return app.getPath('home');
  } catch (error) {
    log.warn('[slash-commands] Failed to get home dir from app, using fallback');
    return process.env.HOME || process.env.USERPROFILE || '';
  }
}

/**
 * SDK 内置斜杠命令列表
 * 包括 Claude Code 的核心功能和系统命令
 */
const BUILTIN_COMMANDS = [
  // 会话管理
  { name: "/plan", description: "制定实施计划", source: "builtin" },
  { name: "/help", description: "显示帮助信息", source: "builtin" },
  { name: "/bug", description: "报告 Bug", source: "builtin" },
  { name: "/clear", description: "清除屏幕", source: "builtin" },
  { name: "/exit", description: "退出会话", source: "builtin" },
  { name: "/quit", description: "退出会话", source: "builtin" },
  { name: "/new", description: "新建会话", source: "builtin" },
  { name: "/sessions", description: "会话管理", source: "builtin" },
  { name: "/resume", description: "恢复会话", source: "builtin" },

  // 代码操作
  { name: "/commit", description: "创建 Git 提交", source: "builtin" },
  { name: "/review", description: "代码审查", source: "builtin" },
  { name: "/test", description: "运行测试", source: "builtin" },
  { name: "/build", description: "构建项目", source: "builtin" },
  { name: "/lint", description: "代码检查", source: "builtin" },
  { name: "/format", description: "代码格式化", source: "builtin" },
  { name: "/refactor", description: "代码重构", source: "builtin" },

  // 系统功能
  { name: "/plugins", description: "管理插件", source: "builtin" },
  { name: "/mcp", description: "Model Context Protocol 服务器", source: "builtin" },
  { name: "/memory", description: "记忆管理", source: "builtin" },
  { name: "/agents", description: "代理管理", source: "builtin" },
  { name: "/hooks", description: "钩子配置", source: "builtin" },
  { name: "/permissions", description: "权限设置", source: "builtin" },
  { name: "/output", description: "输出样式设置", source: "builtin" },
  { name: "/settings", description: "设置", source: "builtin" },
  { name: "/customize", description: "自定义配置", source: "builtin" },
  { name: "/config", description: "配置管理", source: "builtin" },
  { name: "/env", description: "环境变量", source: "builtin" },
  { name: "/context", description: "上下文管理", source: "builtin" },
  { name: "/provider", description: "API 提供商", source: "builtin" },
  { name: "/model", description: "模型设置", source: "builtin" },
  { name: "/token", description: "Token 使用情况", source: "builtin" },
  { name: "/cost", description: "成本统计", source: "builtin" },
  { name: "/doctor", description: "健康检查", source: "builtin" },
  { name: "/update", description: "检查更新", source: "builtin" },
  { name: "/install", description: "安装组件", source: "builtin" },
  { name: "/version", description: "版本信息", source: "builtin" },
  { name: "/debug", description: "调试模式", source: "builtin" },
  { name: "/verbose", description: "详细输出", source: "builtin" },
];

/**
 * 解析技能的 SKILL.md 文件，提取技能信息
 */
function parseSkillFile(skillPath: string): { name: string; description: string; source: string } | null {
  try {
    const skillMarkdown = readFileSync(skillPath, 'utf-8');
    const dirName = skillPath.split(/[/\\]/).filter(Boolean).slice(-2, -1)[0];

    if (!dirName) {
      log.warn(`[slash-commands] Could not extract directory name from ${skillPath}`);
      return null;
    }

    // 尝试多种格式：
    // 1. YAML frontmatter 格式
    const frontmatterMatch = skillMarkdown.match(/^---\n([\s\S]*?)\n---/);
    let description = `技能: ${dirName}`;

    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const descMatch = frontmatter.match(/description:\s*(.+)/);

      if (descMatch) {
        description = descMatch[1].trim();
      }
    }

    log.debug(`[slash-commands] Parsed skill: ${dirName} - ${description}`);
    return {
      name: `/${dirName}`,
      description,
      source: "skill"
    };
  } catch (error) {
    log.warn(`[slash-commands] Failed to parse skill file ${skillPath}:`, error);
    return null;
  }
}

/**
 * 从用户的 ~/.claude/skills 目录读取已安装的技能
 * 降级机制：目录不存在 → 从 plugins 目录读取 → 空列表
 */
async function fetchUserSkills(): Promise<Array<{ name: string; description: string; source: string }>> {
  const commands: Array<{ name: string; description: string; source: string }> = [];

  // 方法 1: 从 skills 目录扫描
  try {
    const homeDir = getUserHomeDir();
    const skillsDir = join(homeDir, '.claude', 'skills');

    log.info(`[slash-commands] Looking for skills in: ${skillsDir}`);

    if (existsSync(skillsDir)) {
      const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      log.info(`[slash-commands] Found ${skillDirs.length} skill directories: ${skillDirs.join(', ')}`);

      for (const skillDir of skillDirs) {
        const skillFile = join(skillsDir, skillDir, 'SKILL.md');
        log.debug(`[slash-commands] Checking skill: ${skillDir} at ${skillFile}`);

        if (existsSync(skillFile)) {
          const skill = parseSkillFile(skillFile);
          if (skill) {
            commands.push(skill);
            log.info(`[slash-commands] ✓ Loaded skill: ${skill.name} - ${skill.description}`);
          } else {
            log.warn(`[slash-commands] ✗ Failed to parse skill: ${skillDir}`);
          }
        } else {
          log.debug(`[slash-commands] - No SKILL.md in: ${skillDir}`);
        }
      }

      if (commands.length > 0) {
        log.info(`[slash-commands] Loaded ${commands.length} user skills from skills/ directory`);
        return commands;
      }
    } else {
      log.warn('[slash-commands] Skills directory not found, trying fallback:', skillsDir);
    }
  } catch (error) {
    log.warn('[slash-commands] Failed to fetch from skills directory, trying fallback:', error);
  }

  // 方法 2: 降级 - 尝试从 plugins 目录读取（兼容性）
  try {
    const homeDir = getUserHomeDir();
    const pluginsDir = join(homeDir, '.claude', 'plugins');

    if (existsSync(pluginsDir)) {
      const pluginDirs = readdirSync(pluginsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      log.info(`[slash-commands] Fallback: checking ${pluginDirs.length} plugin directories`);

      for (const pluginDir of pluginDirs) {
        const skillFile = join(pluginsDir, pluginDir, 'SKILL.md');
        if (existsSync(skillFile)) {
          const skill = parseSkillFile(skillFile);
          if (skill) {
            commands.push({
              ...skill,
              source: "plugin"  // 标记为插件来源
            });
            log.info(`[slash-commands] ✓ Loaded skill from plugins/: ${skill.name}`);
          }
        }
      }

      if (commands.length > 0) {
        log.info(`[slash-commands] Loaded ${commands.length} skills from plugins/ directory (fallback)`);
        return commands;
      }
    }
  } catch (error) {
    log.warn('[slash-commands] Failed to fetch from plugins directory:', error);
  }

  // 方法 3: 最后降级 - 返回空列表
  log.info('[slash-commands] No user skills found, continuing without skills');
  return commands;
}

/**
 * 从 CLI 获取可用的插件命令
 */
async function fetchPluginCommands(): Promise<Array<{ name: string; description: string; source: string }>> {
  const commands: Array<{ name: string; description: string; source: string }> = [];

  try {
    const homeDir = getUserHomeDir();
    const pluginsDir = join(homeDir, '.claude', 'plugins');

    log.info(`[slash-commands] Looking for plugins in: ${pluginsDir}`);

    if (!existsSync(pluginsDir)) {
      return commands;
    }

    const pluginDirs = readdirSync(pluginsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    log.info(`[slash-commands] Found ${pluginDirs.length} plugin directories`);

    for (const pluginDir of pluginDirs) {
      const pluginFile = join(pluginsDir, pluginDir, 'SKILL.md');
      if (existsSync(pluginFile)) {
        const plugin = parseSkillFile(pluginFile);
        if (plugin) {
          commands.push({
            ...plugin,
            source: "plugin"
          });
        }
      }
    }

    log.info(`[slash-commands] Loaded ${commands.length} plugin commands`);
  } catch (error) {
    log.warn('[slash-commands] Failed to fetch plugin commands:', error);
  }

  return commands;
}

/**
 * 从 settings.json 读取已启用的插件
 * 优化：只读取一次 settings.json，避免重复 I/O 操作
 */
async function fetchEnabledPlugins(settings?: ClaudeSettings): Promise<Array<{ name: string; description: string; source: string }>> {
  const commands: Array<{ name: string; description: string; source: string }> = [];

  try {
    // 如果未传入 settings，从文件读取
    if (!settings) {
      const homeDir = getUserHomeDir();
      const settingsFile = join(homeDir, '.claude', 'settings.json');

      if (!existsSync(settingsFile)) {
        log.warn('[slash-commands] settings.json not found');
        return commands;
      }

      const settingsContent = readFileSync(settingsFile, 'utf-8');
      settings = JSON.parse(settingsContent);
    }

    if (!settings.enabledPlugins) {
      log.info('[slash-commands] No enabled plugins in settings.json');
      return commands;
    }

    for (const [pluginName, enabled] of Object.entries(settings.enabledPlugins)) {
      if (enabled) {
        // 移除 @claude-plugins-official 等后缀，提取插件名
        const baseName = pluginName.replace(/@.*/, '');
        // 插件命令格式：/plugin-name:command
        // 对于 pr-review-toolkit，命令应该是 /pr-review-toolkit:review-pr
        commands.push({
          name: `/${baseName}`,  // 保留原始插件名，让 SDK 处理具体命令
          description: `插件: ${baseName}`,
          source: "plugin"
        });
      }
    }

    log.info(`[slash-commands] Loaded ${commands.length} enabled plugins from settings.json`);
  } catch (error) {
    log.warn('[slash-commands] Failed to fetch enabled plugins:', error);
  }

  return commands;
}

/**
 * 从 settings.json 读取 MCP 服务器列表
 * 优化：只读取一次 settings.json，避免重复 I/O 操作
 */
async function fetchMcpServers(settings?: ClaudeSettings): Promise<Array<{ name: string; description: string; source: string }>> {
  const commands: Array<{ name: string; description: string; source: string }> = [];

  try {
    // 如果未传入 settings，从文件读取
    if (!settings) {
      const homeDir = getUserHomeDir();
      const settingsFile = join(homeDir, '.claude', 'settings.json');

      if (!existsSync(settingsFile)) {
        return commands;
      }

      const settingsContent = readFileSync(settingsFile, 'utf-8');
      settings = JSON.parse(settingsContent);
    }

    if (!settings.mcpServers) {
      log.info('[slash-commands] No MCP servers in settings.json');
      return commands;
    }

    for (const [serverName, serverConfig] of Object.entries(settings.mcpServers)) {
      // 跳过已禁用的服务器
      if (serverConfig.disabled) {
        continue;
      }

      // 根据服务器类型生成描述
      let description = `MCP: ${serverName}`;
      if (serverConfig.url) {
        description += ` (HTTP)`;
      } else if (serverConfig.command) {
        const cmdName = serverConfig.command.split('/').pop() || serverConfig.command;
        description += ` (${cmdName})`;
      }

      commands.push({
        name: `/${serverName}`,
        description,
        source: "mcp"
      });
    }

    log.info(`[slash-commands] Loaded ${commands.length} MCP servers from settings.json`);
  } catch (error) {
    log.warn('[slash-commands] Failed to fetch MCP servers:', error);
  }

  return commands;
}

/**
 * 从 settings.json 读取钩子配置
 * 优化：只读取一次 settings.json，避免重复 I/O 操作
 */
async function fetchHookConfigs(settings?: ClaudeSettings): Promise<Array<{ name: string; description: string; source: string }>> {
  const commands: Array<{ name: string; description: string; source: string }> = [];

  try {
    // 如果未传入 settings，从文件读取
    if (!settings) {
      const homeDir = getUserHomeDir();
      const settingsFile = join(homeDir, '.claude', 'settings.json');

      if (!existsSync(settingsFile)) {
        return commands;
      }

      const settingsContent = readFileSync(settingsFile, 'utf-8');
      settings = JSON.parse(settingsContent);
    }

    if (!settings.hooks) {
      return commands;
    }

    // 遍历钩子类型
    for (const [hookType, hookConfig] of Object.entries(settings.hooks)) {
      if (Array.isArray(hookConfig)) {
        commands.push({
          name: `/hook-${hookType.toLowerCase()}`,
          description: `钩子: ${hookType}`,
          source: "hook"
        });
      }
    }

    log.info(`[slash-commands] Loaded ${commands.length} hook configs from settings.json`);
  } catch (error) {
    log.warn('[slash-commands] Failed to fetch hook configs:', error);
  }

  return commands;
}

/**
 * 获取所有可用的斜杠命令
 * 包括内置命令、用户技能、插件、MCP 服务器和钩子
 *
 * 优化：只读取一次 settings.json，避免重复 I/O 操作
 *
 * 用户输入斜杠命令时，程序会自动转换为：
 * - 内置命令：直接发送给 SDK
 * - 用户技能：转换为"请使用 X 技能"再发送给 SDK
 */
export async function getSlashCommands(): Promise<Array<{ name: string; description: string; source: string }>> {
  const commands = [...BUILTIN_COMMANDS];

  try {
    // 从 skills 目录加载用户技能
    const userSkills = await fetchUserSkills();
    commands.push(...userSkills);

    // 从 plugins 目录加载插件
    const pluginCommands = await fetchPluginCommands();
    commands.push(...pluginCommands);

    // 优化：只读取一次 settings.json
    // 读取配置并传递给各个子函数，避免重复 I/O
    let settings: ClaudeSettings | null = null;
    try {
      const homeDir = getUserHomeDir();
      const settingsFile = join(homeDir, '.claude', 'settings.json');

      if (existsSync(settingsFile)) {
        const settingsContent = readFileSync(settingsFile, 'utf-8');
        settings = JSON.parse(settingsContent);
        log.debug('[slash-commands] 已加载 settings.json');
      }
    } catch (error) {
      log.warn('[slash-commands] 读取 settings.json 失败:', error);
    }

    // 从 settings 加载已启用的插件（传入 settings，避免重复读取）
    const enabledPlugins = await fetchEnabledPlugins(settings || undefined);
    commands.push(...enabledPlugins);

    // 从 settings 加载 MCP 服务器（传入 settings，避免重复读取）
    const mcpServers = await fetchMcpServers(settings || undefined);
    commands.push(...mcpServers);

    // 从 settings 加载钩子配置（传入 settings，避免重复读取）
    const hookConfigs = await fetchHookConfigs(settings || undefined);
    commands.push(...hookConfigs);

    commands.sort((a, b) => {
      if (a.source === "builtin" && b.source !== "builtin") return -1;
      if (a.source !== "builtin" && b.source === "builtin") return 1;
      return a.name.localeCompare(b.name);
    });

    // 去重（基于名称）
    const uniqueCommands = commands.filter((cmd, index, self) =>
      index === self.findIndex(c => c.name === cmd.name)
    );

    const builtinCount = uniqueCommands.filter(c => c.source === 'builtin').length;
    const skillCount = uniqueCommands.filter(c => c.source === 'skill').length;
    const pluginCount = uniqueCommands.filter(c => c.source === 'plugin').length;
    const mcpCount = uniqueCommands.filter(c => c.source === 'mcp').length;
    const hookCount = uniqueCommands.filter(c => c.source === 'hook').length;
    log.info(`[slash-commands] 总计: ${uniqueCommands.length} (${builtinCount} 内置, ${skillCount} 技能, ${pluginCount} 插件, ${mcpCount} MCP, ${hookCount} 钩子)`);

    return uniqueCommands;
  } catch (error) {
    log.error('[slash-commands] 获取命令时出错:', error);
    return commands;
  }
}

/**
 * 转换用户输入的斜杠命令为 SDK 可识别的格式
 *
 * 实现机制：
 * - SDK 内置命令：直接发送（如 /commit, /help 等）
 * - 插件命令：直接发送（格式：/plugin:command，如 /pr-review-toolkit:review-pr）
 * - MCP 服务器命令：直接发送（如 /github, /filesystem）
 * - 用户技能：转换为"请使用 X 技能"再发送
 *
 * @param userInput 用户输入的原始文本
 * @returns 转换后的 prompt
 */
export function transformSlashCommand(userInput: string): string {
  if (!userInput.trim().startsWith('/')) {
    return userInput;
  }

  // 提取命令名称（移除斜杠和参数），支持插件命令中的冒号
  const commandMatch = userInput.match(/^\/([a-zA-Z0-9_:-]+)(.*)?$/);
  if (!commandMatch) {
    return userInput;
  }

  const [, commandName, args] = commandMatch;
  const command = `/${commandName}`;

  // ✅ 插件命令：直接传递给 SDK（不转换）
  // 格式：/plugin-name:command-name 或 /plugin-name:command-name args
  // 例如：/pr-review-toolkit:review-pr, /pr-review-toolkit:review-pr tests errors
  if (commandName.includes(':')) {
    log.debug(`[slash-commands] Plugin command detected, passing through: ${command}`);
    return userInput;
  }

  // ✅ 检查是否是 MCP 服务器命令：直接传递
  // 注意：这里需要异步检查，但由于函数是同步的，
  // 我们假设如果命令名称匹配 MCP 服务器名称，就直接传递
  // MCP 服务器配置会在会话启动时由 SDK 自动读取
  // 这里我们通过命令后缀或其他方式判断是否是 MCP 命令
  // 实际上 SDK 会自动处理，所以我们也可以直接传递

  // 命令到自然语言的映射（仅用于 SDK 内置命令和技能）
  const argsText = args ? `。参数：${args.trim()}` : '';

  const commandPrompts: Record<string, string> = {
    // 会话管理
    "/plan": "请帮我制定一个实施计划",
    "/help": "请显示帮助信息，告诉我你可以做什么",
    "/bug": "我想报告一个 Bug",
    "/clear": "请清除屏幕内容",
    "/exit": "请结束当前会话",
    "/quit": "请退出会话",
    "/new": "请创建一个新会话",
    "/sessions": "请显示会话管理界面",
    "/resume": "请恢复之前的会话",

    // 代码操作
    "/commit": "请帮我创建一个 Git 提交",
    "/review": "请帮我进行代码审查",
    "/test": "请运行测试",
    "/build": "请构建项目",
    "/lint": "请进行代码检查",
    "/format": "请格式化代码",
    "/refactor": "请重构代码",

    // 系统功能
    "/plugins": "请显示插件管理界面",
    "/mcp": "请显示 MCP 服务器配置",
    "/memory": "请显示记忆管理",
    "/agents": "请显示代理管理",
    "/hooks": "请显示钩子配置",
    "/permissions": "请显示权限设置",
    "/output": "请设置输出样式",
    "/settings": "请打开设置",
    "/customize": "请打开自定义配置",
    "/config": "请显示配置管理",
    "/env": "请显示环境变量",
    "/context": "请显示上下文管理",
    "/provider": "请显示 API 提供商设置",
    "/model": "请显示模型设置",
    "/token": "请显示 Token 使用情况",
    "/cost": "请显示成本统计",
    "/doctor": "请运行系统健康检查",
    "/update": "请检查更新",
    "/install": "请安装组件",
    "/version": "请告诉我当前版本信息",
    "/debug": "请启用调试模式",
    "/verbose": "请启用详细输出",
  };

  // 如果有预定义的提示（SDK 内置命令），使用它
  const basePrompt = commandPrompts[command];
  if (basePrompt) {
    return basePrompt + argsText;
  }

  // ✅ MCP 服务器命令：直接传递给 SDK
  // SDK 会自动从 ~/.claude/settings.json 读取 MCP 配置
  // 并启动相应的服务器，使其工具可供 AI 调用
  // 注意：这里我们无法同步检查是否是 MCP 命令，
  // 但由于 SDK 会自动处理，我们可以直接传递
  log.debug(`[slash-commands] Assuming MCP server command or skill: ${command}`);
  return userInput;
}
