/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @updated     2026-01-21
 * @Email       None
 *
 * English translations
 */

export default {
	// Language names
	languageNames: {
		en: "English",
		"zh-TW": "Traditional Chinese",
		zh: "Simplified Chinese",
		ja: "Japanese",
		ko: "Korean",
		es: "Spanish",
		fr: "French",
		de: "German",
		ru: "Russian",
		pt: "Portuguese",
	},

	// Sidebar
	sidebar: {
		newTask: "+ New Task",
		settings: "Settings",
		noSessions: "No sessions yet. Click \"+ New Task\" to start.",
		deleteSession: "Delete this session",
		resumeInClaudeCode: "Resume in Claude Code",
		resume: "Resume",
		close: "Close",
		copyResumeCommand: "Copy resume command",
		workingDirUnavailable: "Working dir unavailable",
	},

	// Settings Page
	settingsPage: {
		title: "Settings",
		back: "Back",
		sections: {
			general: "General",
			api: "API Config",
			features: "Features",
			system: "System",
		},
		navigation: {
			help: "Help",
			feedback: "Feedback",
			about: "About",
			language: "Language",
			api: "API Settings",
			mcp: "MCP Settings",
			skills: "Skills",
			plugins: "Plugins",
			memory: "Memory",
			agents: "Agents",
			hooks: "Hooks",
			permissions: "Permissions",
			output: "Output Styles",
			recovery: "Session Recovery",
			rules: "Rules",
			claudeMd: "Claude.md",
		},
		placeholder: {
			title: "Settings",
			description: "Select a menu item from the left to configure",
		},
	},

	// Settings Sections
	help: {
		title: "Help",
		quickStart: {
			title: "Quick Start",
			description: "Learn how to use AICowork to start your first task",
		},
		faq: {
			title: "FAQ",
			description: "View frequently asked questions and solutions",
		},
		docs: {
			title: "Documentation",
			description: "Visit official documentation for more information",
		},
	},

	feedback: {
		title: "Feedback",
		bugReport: {
			title: "Bug Report",
			description: "Submit issue reports on GitHub",
		},
		featureRequest: {
			title: "Feature Request",
			description: "Suggest new features you'd like to see",
		},
	},

	about: {
		title: "About AICowork",
		version: {
			title: "Version",
			description: "Version 1.0.0",
		},
		techStack: {
			title: "Tech Stack",
			description: "Electron + React + TypeScript + Claude Agent SDK",
		},
		license: {
			title: "License",
			description: "AGCPA v3.0",
		},
	},

	language: {
		title: "Language",
		current: "Current Language",
		switching: "Switching...",
		hint: "Language settings are saved locally and will be applied automatically when you start the app next time.",
	},

	api: {
		title: "API Settings",
		description: "Configure Anthropic API key and model",
		viewList: "View Configuration List",
		addConfig: "Add Configuration",
		configName: {
			label: "Configuration Name",
			placeholder: "My Config",
			test: "Test Config",
		},
		baseUrl: {
			label: "Base URL",
			placeholder: "https://api.anthropic.com",
		},
		apiKey: {
			label: "API Key",
			placeholder: "sk-ant-...",
		},
		apiType: {
			label: "API Type",
			anthropic: "Anthropic",
			openai: "OpenAI Compatible",
		},
		model: {
			label: "Model Name",
			placeholder: "Enter model name",
			refresh: "Refresh Model List",
		},
		advanced: {
			label: "Advanced Parameters (Optional)",
			maxTokens: {
				label: "Max Tokens",
				placeholder: "Default",
			},
			temperature: {
				label: "Temperature",
				placeholder: "Default",
			},
			topP: {
				label: "Top P",
				placeholder: "Default",
			},
		},
		actions: {
			test: "Test Connection",
			testing: "Testing...",
			save: "Save Configuration",
			saving: "Saving...",
			setActive: "Set as Active",
			edit: "Edit Configuration",
			delete: "Delete Configuration",
		},
		responseTime: "Response time: {{time}}ms",
		testFailed: "Test Failed",
		noConfigs: "No saved configurations",
		hint: "Configure API key to start using. Multiple configurations supported for quick switching.",
		docsLink: "Documentation",
	},

	mcp: {
		title: "MCP Settings",
		description: "Configure Model Context Protocol servers, SDK will auto-start and register tools",
		noServers: "No MCP server configurations",
		addServer: "+ Add Server",
		templates: {
			title: "Add from Template",
		},
		form: {
			name: {
				label: "Server Name",
				placeholder: "my-mcp-server",
			},
			displayName: {
				label: "Display Name (Optional)",
				placeholder: "My MCP Server",
			},
			type: {
				label: "Server Type",
				stdio: "stdio (Standard Input/Output)",
				sse: "SSE (Server-Sent Events)",
				streamableHttp: "Streamable HTTP",
			},
			command: {
				label: "Command",
				placeholder: "npx",
			},
			args: {
				label: "Arguments (space-separated)",
				placeholder: "@modelcontextprotocol/server-github",
			},
			url: {
				label: "URL",
				placeholder: "https://example.com/mcp",
			},
			description: {
				label: "Description (Optional)",
				placeholder: "Server functionality description",
			},
			addTitle: "Add MCP Server",
			editTitle: "Edit MCP Server",
		},
		view: {
			type: "Type",
			command: "Command",
			args: "Args",
			url: "URL",
			description: "Description",
		},
		actions: {
			save: "Save",
			saving: "Saving...",
			edit: "Edit",
			delete: "Delete",
			cancel: "Cancel",
		},
		errors: {
			deleteFailed: "Delete Failed",
			nameRequired: "Server name cannot be empty",
			saveFailed: "Save Failed",
			invalidNameFormat: "Server name can only contain letters, numbers, underscores, and hyphens",
			commandRequired: "stdio type servers must specify a command",
			urlRequired: "This server type must specify a URL",
			invalidUrl: "Invalid URL format",
			saveSuccess: "Saved successfully",
		},
		confirmDelete: "Are you sure you want to delete MCP server \"{{name}}\"?",
		hint: "Hint: MCP server configurations are stored in ~/.claude/settings.json. SDK will automatically start configured MCP servers and register tools to the session.",
		hintPath: "~/.claude/settings.json",
	},

	skills: {
		title: "Skills",
		description: "Manage custom skills, AI will automatically execute based on SKILL.md instructions",
		loading: "Loading...",
		noSkills: "No installed Skills",
		noSkillsHint: "Place Skills in ~/.claude/skills/ directory for auto-detection",
		openDirectory: "Open Skills Directory",
		source: {
			skill: "Skill",
			plugin: "Plugin",
		},
		hint: "Skills are stored in ~/.claude/skills/ directory. Each skill folder contains a SKILL.md file, AI will execute automatically based on content.",
	},

	plugins: {
		title: "Plugins",
		description: "Manage installed plugins",
		noPlugins: "No installed plugins",
		status: {
			installed: "Installed",
		},
		hint: "Plugin command format is /plugin-name:command-name.",
	},

	memory: {
		title: "Memory",
		description: "Reserved for memvid project functionality",
		comingSoon: "Coming Soon: Memory will allow AI to share information across sessions for more coherent conversations.",
	},

	agents: {
		title: "Agents",
		description: "Configure sub-agent settings",
		subAgents: "SubAgents: Can launch up to 10 sub-agents in parallel for improved efficiency on complex tasks.",
	},

	hooks: {
		title: "Hooks",
		postToolUse: {
			title: "Triggered After Tool Use",
			noConfig: "No configuration",
		},
		preToolUse: {
			title: "Triggered Before Tool Use",
			noConfig: "No configuration",
		},
		hint: "Hooks configurations are stored in ~/.claude/settings.json.",
	},

	permissions: {
		title: "Permissions",
		allowedTools: {
			title: "Allowed Tools",
			description: "Can be used without user confirmation",
			noConfig: "No configuration",
		},
		customRules: {
			title: "Custom Rules",
			description: "Configure specific permission rules",
			noConfig: "No custom rules",
		},
		securityHint: "Security Hint: Grant tool permissions carefully, especially for Bash and file operations.",
	},

	output: {
		title: "Output Styles",
		description: "Output style configuration is under development...",
		comingSoon: "Coming Soon: Configurable output format, code highlighting theme, Markdown rendering options, etc.",
	},

	recovery: {
		title: "Session Recovery",
		subtitle: "View and resume previous sessions",
		description: "Resume previous sessions to continue conversations",
		loading: "Loading...",
		refresh: "Refresh List",
		example1: {
			title: "Create New Web App",
			sessionId: "Session ID: abc123def456",
			updated: "Updated: 2 hours ago",
		},
		example2: {
			title: "Fix API Integration Issue",
			sessionId: "Session ID: ghi789jkl012",
			updated: "Updated: 1 day ago",
		},
		hint: "Session data is stored in local database. Resuming a session will load the complete conversation history.",
	},

	rules: {
		title: "Rules",
		subtitle: "Manage project rules (.claude/rules/)",
		description: "Create and manage custom rule files in your project's .claude/rules/ directory",
		noRules: "No rule files yet",
		createFromTemplate: "Create from Template",
		createNew: "Create New Rule",
		editor: {
			nameLabel: "Rule Name",
			namePlaceholder: "e.g., coding-style",
			contentLabel: "Rule Content (Markdown)",
			contentPlaceholder: "Enter rule content...",
			save: "Save Rule",
			saving: "Saving...",
			cancel: "Cancel",
		},
		templates: {
			title: "Select Template",
			language: {
				name: "Language Rules",
				description: "Specify programming language and coding standards",
			},
			codingStyle: {
				name: "Coding Style",
				description: "Define code formatting and style guidelines",
			},
			gitCommit: {
				name: "Git Commit",
				description: "Configure Git commit message format and standards",
			},
		},
		confirmDelete: "Are you sure you want to delete rule \"{{name}}\"?",
		deleted: "Rule deleted",
		saved: "Rule saved",
		hint: "Rule files are stored in the project's .claude/rules/ directory. Each rule is a Markdown file that AI will follow when executing tasks.",
	},

	claudeMd: {
		title: "Claude.md",
		subtitle: "Manage project Claude configuration (CLAUDE.md)",
		description: "Configure project-level AI guidance in CLAUDE.md at project root",
		status: {
			exists: "Configuration file exists",
			missing: "Configuration file missing",
			charCount: "{{count}} characters",
			lastModified: "Last modified: {{date}}",
		},
		actions: {
			view: "View Current Config",
			edit: "Edit Config",
			save: "Save Config",
			saving: "Saving...",
			delete: "Delete Config",
			createFromTemplate: "Create from Template",
			openDirectory: "Open Directory",
		},
		templates: {
			title: "Select Template",
			basic: {
				name: "Basic Config",
				description: "Simple template with basic project information",
			},
			frontend: {
				name: "Frontend Project",
				description: "For React/Vue/Next.js frontend projects",
			},
			backend: {
				name: "Backend Project",
				description: "For Node.js/Python/FastAPI backend projects",
			},
		},
		editor: {
			label: "Claude.md Content",
			placeholder: "Enter project configuration content here...",
			save: "Save Config",
			cancel: "Cancel",
		},
		confirmDelete: "Are you sure you want to delete the CLAUDE.md configuration file?",
		deleted: "Configuration deleted",
		saved: "Configuration saved",
		hint: "CLAUDE.md file is located at project root and defines project-level AI behavior guidelines. This file overrides global settings.",
	},

	// Settings Modal (legacy)
	settings: {
		title: "API Configuration",
		description: "Supports Anthropic's official API as well as third-party APIs compatible with the Anthropic format.",
		baseUrl: "Base URL",
		apiKey: "API Key",
		modelName: "Model Name",
		cancel: "Cancel",
		save: "Save",
		saving: "Saving...",
		saved: "Configuration saved successfully!",
	},

	// Validation errors
	errors: {
		apiKeyRequired: "API Key is required",
		baseUrlRequired: "Base URL is required",
		modelRequired: "Model is required",
		invalidBaseUrl: "Invalid Base URL format",
		failedToLoadConfig: "Failed to load configuration",
		failedToSaveConfig: "Failed to save configuration",
		sessionStillRunning: "Session is still running. Please wait for it to finish.",
		workingDirectoryRequired: "Working Directory is required to start a session.",
		failedToGetSessionTitle: "Failed to get session title.",
	},

	// Start Session Modal
	startSession: {
		title: "Start Session",
		description: "Create a new session to start interacting with agent.",
		workingDirectory: "Working Directory",
		browse: "Browse...",
		recent: "Recent",
		prompt: "Prompt",
		promptPlaceholder: "Describe the task you want agent to handle...",
		startButton: "Start Session",
		starting: "Starting...",
	},

	// Prompt Input
	promptInput: {
		placeholderDisabled: "Create/select a task to start...",
		placeholder: "Describe what you want agent to handle...",
		stopSession: "Stop session",
		sendPrompt: "Send prompt",
	},

	// Common
	common: {
		close: "Close",
		cancel: "Cancel",
		save: "Save",
		delete: "Delete",
		loading: "Loading...",
		edit: "Edit",
		add: "Add",
		refresh: "Refresh",
		back: "Back",
	},

	// App
	app: {
		noMessagesYet: "No messages yet",
		startConversation: "Start a conversation with AICowork",
		beginningOfConversation: "Beginning of conversation",
		loadingMessages: "Loading...",
		newMessages: "New messages",
	},

	// Deletion Confirmation
	deletion: {
		title: "⚠️ Deletion Confirmation",
		subtitle: "AI is about to perform a deletion operation",
		description: "AI is attempting to execute a deletion operation. This operation may permanently delete files or directories. Please carefully verify the command content.",
		commandLabel: "Command to be executed:",
		unknownCommand: "Unknown command",
		warning: "Warning: Deletion operations cannot be undone. Make sure you understand the consequences of this command.",
		allow: "Allow Execution",
		deny: "Deny Operation",
		deniedMessage: "User denied the deletion operation",
	},

	// Event Card
	events: {
		sessionResult: "Session Result",
		duration: "Duration",
		usage: "Usage",
		cost: "Cost",
		input: "Input",
		output: "Output",
		collapse: "Collapse",
		showMoreLines: "Show {{count}} more lines",
		systemInit: "System Init",
		user: "User",
		assistant: "Assistant",
		thinking: "Thinking",
		sessionId: "Session ID",
		modelName: "Model Name",
		permissionMode: "Permission Mode",
		workingDirectory: "Working Directory",
	},
};
