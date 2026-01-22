/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @updated     2026-01-21
 * @Email       None
 *
 * 简体中文翻译
 */

export default {
	// Language names
	languageNames: {
		en: "English",
		"zh-TW": "繁體中文",
		zh: "简体中文",
		ja: "日本語",
		ko: "한국어",
		es: "Español",
		fr: "Français",
		de: "Deutsch",
		ru: "Русский",
		pt: "Português",
	},

	// Sidebar
	sidebar: {
		newTask: "+ 新建任务",
		settings: "设置",
		noSessions: "暂无会话。点击 \"+ 新建任务\" 开始。",
		deleteSession: "删除此会话",
		resumeInClaudeCode: "在 Claude Code 中恢复",
		resume: "恢复",
		close: "关闭",
		copyResumeCommand: "复制恢复命令",
		workingDirUnavailable: "工作目录不可用",
	},

	// Settings Page
	settingsPage: {
		title: "设置",
		back: "返回",
		sections: {
			general: "常规",
			api: "API 配置",
			features: "功能扩展",
			system: "系统",
		},
		navigation: {
			help: "帮助",
			feedback: "反馈",
			about: "关于",
			language: "语言",
			api: "API 设置",
			mcp: "MCP 设置",
			skills: "技能",
			plugins: "插件",
			memory: "记忆",
			agents: "代理",
			hooks: "钩子",
			permissions: "权限",
			output: "输出样式",
			recovery: "会话恢复",
			rules: "规则",
			claudeMd: "Claude.md",
		},
		placeholder: {
			title: "设置",
			description: "选择左侧菜单进行配置",
		},
	},

	// Settings Sections
	help: {
		title: "帮助",
		subtitle: "获取使用帮助和文档",
		quickStart: {
			title: "快速开始",
			description: "了解如何使用 AICowork 开始第一个任务",
		},
		faq: {
			title: "常见问题",
			description: "查看常见问题和解决方案",
		},
		docs: {
			title: "文档链接",
			description: "访问官方文档获取更多信息",
		},
		tip: "提示：遇到问题可以先查看常见问题，或者通过反馈渠道联系我们。",
		helpUrl: "https://ima.qq.com/note/share/_AwZPbuK9wucK5gWaVdjNQ?channel=4",
	},

	feedback: {
		title: "反馈",
		subtitle: "提交问题和建议，帮助我们改进",
		bugReport: {
			title: "Bug 报告",
			description: "在 GitHub 上提交问题报告",
			link: "前往 GitHub",
			url: "https://github.com/Pan519/AICowork",
		},
		featureRequest: {
			title: "功能建议",
			description: "提出您希望看到的新功能",
			url: "https://docs.qq.com/form/page/DRm5uV1pSZFB3VHNv",
		},
		thankYou: "感谢您的反馈！我们会认真阅读每一条反馈意见。",
	},

	about: {
		title: "关于 AICowork",
		subtitle: "AI 协作工作台——AICowork！",
		version: {
			title: "版本信息",
			description: "版本 1.0.0",
		},
		techStack: {
			title: "技术栈",
			description: "Electron + React + TypeScript + Claude Agent SDK",
			electron: "• Electron - 跨平台桌面应用框架",
			react: "• React + TypeScript - 前端框架",
			tailwind: "• Tailwind CSS - 样式框架",
			claude: "• Claude Agent SDK - AI 集成",
		},
		license: {
			title: "许可证",
			description: "MIT",
		},
		tagline: "AICowork 让 AI 成为你的工作协作伙伴。",
	},

	language: {
		title: "语言",
		description: "选择界面显示语言",
		current: "当前语言",
		switching: "切换中...",
		hint: "语言设置会保存在本地，下次启动应用时自动应用。",
		tip: {
			label: "提示",
			text: "语言设置会保存在本地，下次启动应用时自动应用。",
		},
	},

	api: {
		title: "API 设置",
		description: "配置 Anthropic API 密钥和模型",
		viewList: "查看配置列表",
		addConfig: "添加配置",
		configName: {
			label: "配置名称",
			placeholder: "我的配置",
			test: "测试配置",
		},
		baseUrl: {
			label: "基础 URL",
			placeholder: "https://api.anthropic.com",
		},
		apiKey: {
			label: "API 密钥",
			placeholder: "sk-ant-...",
		},
		apiType: {
			label: "API 类型",
			anthropic: "Anthropic",
			openai: "OpenAI 兼容",
		},
		model: {
			label: "模型名称",
			placeholder: "输入模型名称",
			refresh: "刷新模型列表",
		},
		advanced: {
			label: "高级参数（可选）",
			maxTokens: {
				label: "最大 Token 数",
				placeholder: "默认值",
			},
			temperature: {
				label: "温度",
				placeholder: "默认值",
			},
			topP: {
				label: "Top P",
				placeholder: "默认值",
			},
		},
		actions: {
			test: "测试连接",
			testing: "测试中...",
			save: "保存配置",
			saving: "保存中...",
			setActive: "设为当前配置",
			edit: "编辑配置",
			delete: "删除配置",
		},
		responseTime: "响应时间: {{time}}ms",
		testFailed: "测试失败",
		noConfigs: "暂无保存的配置",
		hint: "配置 API 密钥后即可开始使用。支持多个配置快速切换。",
		hintLabel: "提示：",
		docsLink: "帮助文档",
		learnMore: "了解更多。",
		saveSuccess: "保存成功",
		current: "当前",
		confirmDelete: "确定要删除此配置吗？",
		modelLimits: "模型限制: max_tokens ∈ [{{min}}, {{max}}]",
		azure: {
			resourceName: "Azure 资源名称",
			deploymentName: "Azure 部署名称",
			resourceNameRequired: "Azure 资源名称不能为空",
			deploymentNameRequired: "Azure 部署名称不能为空",
			bothRequired: "Azure 需要填写资源名称和部署名称",
		},
	},

	mcp: {
		title: "MCP 设置",
		description: "配置 Model Context Protocol 服务器，SDK 会自动启动并注册工具",
		noServers: "暂无 MCP 服务器配置",
		addServer: "+ 添加服务器",
		templates: {
			title: "从模板添加",
		},
		form: {
			name: {
				label: "服务器名称",
				placeholder: "my-mcp-server",
			},
			displayName: {
				label: "显示名称（可选）",
				placeholder: "我的 MCP 服务器",
			},
			type: {
				label: "服务器类型",
				stdio: "stdio (标准输入输出)",
				sse: "SSE (服务器发送事件)",
				streamableHttp: "Streamable HTTP",
			},
			command: {
				label: "命令",
				placeholder: "npx",
			},
			args: {
				label: "参数（空格分隔）",
				placeholder: "@modelcontextprotocol/server-github",
			},
			url: {
				label: "URL",
				placeholder: "https://example.com/mcp",
			},
			description: {
				label: "描述（可选）",
				placeholder: "服务器功能描述",
			},
			addTitle: "添加 MCP 服务器",
			editTitle: "编辑 MCP 服务器",
		},
		view: {
			type: "类型",
			command: "命令",
			args: "参数",
			url: "URL",
			description: "描述",
		},
		actions: {
			save: "保存",
			saving: "保存中...",
			edit: "编辑",
			delete: "删除",
			cancel: "取消",
		},
		errors: {
			deleteFailed: "删除失败",
			nameRequired: "服务器名称不能为空",
			saveFailed: "保存失败",
			invalidNameFormat: "服务器名称只能包含字母、数字、下划线和连字符",
			commandRequired: "stdio 类型服务器必须指定命令",
			urlRequired: "该类型服务器必须指定 URL",
			invalidUrl: "URL 格式无效",
			saveSuccess: "保存成功",
		},
		confirmDelete: "确定要删除 MCP 服务器 \"{{name}}\" 吗？",
		hint: "提示：MCP 服务器配置存储在 ~/.claude/settings.json 中。SDK 会自动启动配置的 MCP 服务器并将工具注册到会话中。",
		hintPath: "~/.claude/settings.json",
	},

	skills: {
		title: "技能",
		description: "管理自定义技能，AI 会根据 SKILL.md 中的指导自动执行",
		loading: "加载中...",
		noSkills: "暂无已安装的技能",
		noSkillsHint: "将 Skills 放入 ~/.claude/skills/ 目录后即可自动识别",
		openDirectory: "打开 Skills 目录",
		source: {
			skill: "技能",
			plugin: "插件",
		},
		hint: "Skills 存储在 ~/.claude/skills/ 目录中。每个技能文件夹包含一个 SKILL.md 文件，AI 会根据内容自动执行。",
	},

	plugins: {
		title: "插件",
		description: "管理已安装的插件",
		noPlugins: "暂无已安装的插件",
		status: {
			installed: "已安装",
		},
		hint: "插件命令格式为 /plugin-name:command-name。",
	},

	memory: {
		title: "记忆",
		description: "配置记忆功能，让 AI 记住重要信息",
		underDevelopment: "Memory 功能正在开发中...",
		reservedArea: "此区域预留给 memvid 项目功能",
		comingSoon: "即将推出",
		comingSoonDescription: "Memory 功能将允许 AI 在多个会话之间共享信息，实现持久化的上下文记忆。",
	},

	agents: {
		title: "代理",
		description: "配置 AI 代理，实现并行任务处理",
		underDevelopment: "Agents 配置功能正在开发中...",
		subAgents: "SubAgents",
		subAgentsDescription: "最多可以同时启动 10 个子代理并行处理任务，但请注意成本会相应增加（N×）。",
	},

	hooks: {
		title: "钩子",
		description: "配置事件钩子，在特定时机自动触发操作",
		postToolUse: {
			title: "PostToolUse",
			description: "工具使用后触发",
			noConfig: "暂无配置",
		},
		preToolUse: {
			title: "PreToolUse",
			description: "工具使用前触发",
			noConfig: "暂无配置",
		},
		addHook: "+ 添加钩子",
		hint: "提示：Hooks 配置存储在",
		hintPath: "~/.claude/settings.json",
		hintSuffix: "中。SDK 会自动加载并执行配置的钩子。",
	},

	permissions: {
		title: "权限",
		description: "配置工具权限规则，控制 AI 可以执行的操作",
		allowedTools: {
			title: "允许的工具",
			description: "无需用户确认即可使用",
			noConfig: "暂无配置",
		},
		customRules: {
			title: "自定义规则",
			description: "配置特定的权限规则",
			noConfig: "暂无自定义规则",
		},
		securityHint: "安全提示：谨慎授予工具权限，特别是 Bash 和文件操作。建议使用通配符规则而非完全开放。",
	},

	output: {
		title: "输出样式",
		subtitle: "配置 AI 输出样式和格式",
		description: "输出样式配置功能正在开发中...",
		comingSoon: "即将推出：可配置输出格式、代码高亮主题、Markdown 渲染选项等。",
	},

	recovery: {
		title: "会话恢复",
		subtitle: "查看历史会话并恢复",
		description: "恢复之前的会话继续对话",
		loading: "加载中...",
		refresh: "刷新列表",
		example1: {
			title: "创建新的 Web 应用",
			sessionId: "会话 ID: abc123def456",
			updated: "更新于: 2 小时前",
		},
		example2: {
			title: "修复 API 集成问题",
			sessionId: "会话 ID: ghi789jkl012",
			updated: "更新于: 1 天前",
		},
		recover: "恢复",
		hint: "会话数据存储在本地数据库中。恢复会话将加载完整的对话历史。",
		hintWithCommand: "也可以使用命令行：",
	},

	rules: {
		title: "规则",
		subtitle: "管理项目规则文件 (.claude/rules/)",
		description: "在项目的 .claude/rules/ 目录中创建和管理自定义规则文件",
		noRules: "暂无规则文件",
		createFromTemplate: "从模板创建",
		createNew: "创建新规则",
		editor: {
			nameLabel: "规则名称",
			namePlaceholder: "例如：coding-style",
			contentLabel: "规则内容 (Markdown)",
			contentPlaceholder: "输入规则内容...",
			save: "保存规则",
			saving: "保存中...",
			cancel: "取消",
		},
		templates: {
			title: "选择模板",
			language: {
				name: "语言规则",
				description: "指定项目使用的编程语言和编码规范",
			},
			codingStyle: {
				name: "代码风格",
				description: "定义代码格式化和风格指南",
			},
			gitCommit: {
				name: "Git 提交",
				description: "配置 Git 提交消息格式和规范",
			},
		},
		confirmDelete: "确定要删除规则 \"{{name}}\" 吗？",
		deleted: "规则已删除",
		saved: "规则已保存",
		hint: "规则文件存储在项目的 .claude/rules/ 目录中。每个规则都是 Markdown 格式的文件，AI 会根据规则内容执行任务。",
	},

	claudeMd: {
		title: "Claude.md",
		subtitle: "管理项目 Claude 配置 (CLAUDE.md)",
		description: "在项目根目录的 CLAUDE.md 文件中配置项目级别的 AI 指导",
		status: {
			exists: "配置文件存在",
			missing: "配置文件不存在",
			charCount: "{{count}} 个字符",
			lastModified: "最后修改: {{date}}",
		},
		actions: {
			view: "查看当前配置",
			edit: "编辑配置",
			save: "保存配置",
			saving: "保存中...",
			delete: "删除配置",
			createFromTemplate: "从模板创建",
			openDirectory: "打开目录",
		},
		templates: {
			title: "选择模板",
			basic: {
				name: "基础配置",
				description: "包含基本项目信息的简单模板",
			},
			frontend: {
				name: "前端项目",
				description: "针对 React/Vue/Next.js 等前端项目",
			},
			backend: {
				name: "后端项目",
				description: "针对 Node.js/Python/FastAPI 等后端项目",
			},
		},
		editor: {
			label: "Claude.md 内容",
			placeholder: "在此输入项目配置内容...",
			save: "保存配置",
			cancel: "取消",
		},
		confirmDelete: "确定要删除 CLAUDE.md 配置文件吗？",
		deleted: "配置文件已删除",
		saved: "配置已保存",
		hint: "CLAUDE.md 文件位于项目根目录，用于定义项目级别的 AI 行为指导。此文件会覆盖全局配置。",
	},

	// Settings Modal (legacy)
	settings: {
		title: "API 配置",
		description: "支持 Anthropic 官方 API 以及兼容 Anthropic 格式的第三方 API。",
		baseUrl: "基础 URL",
		apiKey: "API 密钥",
		modelName: "模型名称",
		cancel: "取消",
		save: "保存",
		saving: "保存中...",
		saved: "配置保存成功！",
	},

	// Validation errors
	errors: {
		apiKeyRequired: "API 密钥是必填项",
		baseUrlRequired: "基础 URL 是必填项",
		modelRequired: "模型名称是必填项",
		invalidBaseUrl: "无效的基础 URL 格式",
		failedToLoadConfig: "加载配置失败",
		failedToSaveConfig: "保存配置失败",
		sessionStillRunning: "会话仍在运行中。请等待其完成。",
		workingDirectoryRequired: "启动会话需要工作目录。",
		failedToGetSessionTitle: "获取会话标题失败。",
	},

	// Start Session Modal
	startSession: {
		title: "启动会话",
		description: "创建新会话以开始与代理交互。",
		workingDirectory: "工作目录",
		browse: "浏览...",
		recent: "最近使用",
		prompt: "提示词",
		promptPlaceholder: "描述您希望代理处理的任务...",
		startButton: "启动会话",
		starting: "启动中...",
	},

	// Prompt Input
	promptInput: {
		placeholderDisabled: "创建/选择任务以开始...",
		placeholder: "描述您希望代理处理的内容...",
		stopSession: "停止会话",
		sendPrompt: "发送提示词",
	},

	// Common
	common: {
		close: "关闭",
		cancel: "取消",
		save: "保存",
		delete: "删除",
		loading: "加载中...",
		edit: "编辑",
		add: "添加",
		refresh: "刷新",
		back: "返回",
	},

	// App
	app: {
		noMessagesYet: "暂无消息",
		startConversation: "开始与 AICowork 对话",
		beginningOfConversation: "对话开始",
		loadingMessages: "加载中...",
		newMessages: "新消息",
	},

	// Deletion Confirmation
	deletion: {
		title: "⚠️ 删除操作确认",
		subtitle: "AI 即将执行删除操作",
		description: "AI 正在尝试执行删除操作。此操作可能会永久删除文件或目录，请仔细确认命令内容。",
		commandLabel: "将要执行的命令：",
		unknownCommand: "未知命令",
		warning: "警告：删除操作无法撤销，请确保您了解此命令的后果。",
		allow: "允许执行",
		deny: "拒绝操作",
		deniedMessage: "用户拒绝了删除操作",
	},

	// Event Card
	events: {
		sessionResult: "会话结果",
		duration: "耗时",
		usage: "使用量",
		cost: "成本",
		input: "输入",
		output: "输出",
		collapse: "收起",
		showMoreLines: "显示更多 {{count}} 行",
		systemInit: "系统初始化",
		user: "用户",
		assistant: "助手",
		thinking: "思考中",
		sessionId: "会话 ID",
		modelName: "模型名称",
		permissionMode: "权限模式",
		workingDirectory: "工作目录",
	},
};
