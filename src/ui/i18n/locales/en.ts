/**

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
		noSessions: 'No sessions yet. Click "+ New Task" to start.',
		deleteSession: "Delete this session",
		resumeInClaudeCode: "Resume in Claude Code",
		resume: "Resume",
		close: "Close",
		copyResumeCommand: "Copy resume command",
		workingDirUnavailable: "Working dir unavailable",
		tooltips: {
			newTask: "Create a new task",
			settings: "Open settings",
		},
	},

	// Settings Page
	settingsPage: {
		title: "Settings",
		back: "Back",
		sections: {
			general: "General",
			api: "API Config",
			connection: "Connection & Model",
			tools: "Tools & Extensions",
			capabilities: "Capabilities",
			features: "Features",
			system: "System",
		},
		navigation: {
			feedback: "Feedback",
			about: "About",
			language: "Language",
			display: "Display",
			api: "API Settings",
			mcp: "MCP Settings",
			memory: "Memory",
			skills: "Skills",
			jarvis: "Jarvis",
			permissions: "Permissions",
			output: "Output Styles",
			rules: "Rules",
			claudeMd: "Claude.md",
			dingtalk: "DingTalk Bot",
		},
		placeholder: {
			title: "Settings",
			description: "Select a menu item from the left to configure",
		},
	},

	// Settings Sections
	feedback: {
		title: "Feedback",
		subtitle: "Submit issues and suggestions to help us improve",
		bugReport: {
			title: "Bug Report",
			description: "Submit issue reports on GitHub",
			link: "Go to GitHub",
			url: "https://github.com/BrainPicker-L/AICowork",
		},
		thankYou: "Thank you for your feedback! We will carefully review every feedback.",
	},

	about: {
		title: "About AICowork",
		subtitle: "AI Collaboration Workbench - AICowork!",
		version: {
			title: "Version",
			description: "Version 1.0.0",
		},
		techStack: {
			title: "Tech Stack",
			description: "Electron + React + TypeScript + AI Agent SDK",
			electron: "• Electron - Cross-platform desktop app framework",
			react: "• React + TypeScript - Frontend framework",
			tailwind: "• Tailwind CSS - Styling framework",
			claude: "• AI Agent SDK - AI Integration",
		},
		license: {
			title: "License",
			description: "GNU Affero General Public License v3.0 (AGPL-3.0)",
		},
		tagline: "AICowork makes AI your collaborative work partner.",
	},

	display: {
		title: "Display Settings",
		description: "Configure session message display options",
		theme: {
			title: "Appearance",
			light: "Light",
			dark: "Dark",
			system: "System",
		},
		tokenUsage: {
			title: "Show Token Usage Info",
			description: "Display token usage, duration and cost information at the end of session",
		},
		systemMessage: {
			title: "Show System Message",
			description: "Display system initialization info at the start of session (session ID, model, working directory, etc.)",
		},
		hint: {
			label: "Tip",
			text: "These settings are saved locally and will be applied automatically when you start the app next time.",
		},
	},

	language: {
		title: "Language",
		description: "Select interface display language",
		current: "Current Language",
		switching: "Switching...",
		hint: "Language settings are saved locally and will be applied automatically when you start the app next time.",
		tip: {
			label: "Tip",
			text: "Language settings are saved locally and will be applied automatically when you start the app next time.",
		},
	},

	api: {
		title: "API Settings",
		description: "Configure Anthropic API key and model",
		viewList: "View Configuration List",
		addConfig: "Add Configuration",
		configName: {
			label: "Configuration Alias",
			placeholder: "e.g., Xita-DeepSeek-R1, Company Account, Personal Account, etc.",
			test: "Test Config",
			hint: "Set an easy-to-identify alias for this configuration to manage multiple configs",
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
			xita: "Xita (AntChat)",
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
		hintLabel: "Tip: ",
		docsLink: "Documentation",
		learnMore: "Learn more.",
		saveSuccess: "Saved successfully",
		current: "Current",
		confirmDelete: "Are you sure you want to delete this configuration?",
		modelLimits: "Model limits: max_tokens ∈ [{{min}}, {{max}}]",
		azure: {
			resourceName: "Azure Resource Name",
			deploymentName: "Azure Deployment Name",
			resourceNameRequired: "Azure resource name cannot be empty",
			deploymentNameRequired: "Azure deployment name cannot be empty",
			bothRequired: "Azure requires both resource name and deployment name",
		},
	},

	mcp: {
		title: "MCP Settings",
		description: "Configure Model Context Protocol servers, SDK will automatically start and register tools",
		noServers: "No MCP server configurations",
		addServer: "+ Add Server",
		status: {
			enabled: "Enabled",
			disabled: "Disabled",
		},
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
			deleteFailed: "Delete failed",
			nameRequired: "Server name cannot be empty",
			saveFailed: "Save failed",
			toggleFailed: "Toggle status failed",
			invalidNameFormat: "Server name can only contain letters, numbers, underscores and hyphens",
			commandRequired: "stdio type server must specify command",
			urlRequired: "SSE type server must specify url",
			httpUrlRequired: "HTTP type server must specify httpUrl",
			urlAndHttpUrlConflict: "url and httpUrl cannot be specified at the same time",
			invalidUrl: "Invalid URL format",
			invalidHttpUrl: "Invalid httpUrl format",
			saveSuccess: "Save successful",
		},
		confirmDelete: "Are you sure you want to delete MCP server \"{{name}}\"?",
		hint: "Hint: MCP server configurations are stored in ~/.qwen/settings.json. SDK will automatically start configured MCP servers and register tools to the session.",
		hintPath: "~/.qwen/settings.json",
	},

	memory: {
		title: "Memory",
		description: "Data is stored locally only. You can define memory kinds. In chat, AI will store and recall via Memory MCP.",
		kinds: {
			title: "Memory Kinds",
			addKind: "Add Kind",
			noKinds: "No kinds yet. Click above to add",
			entriesCount: "{{count}} entries",
			name: "Name",
			description: "Description",
			edit: "Edit",
			delete: "Delete",
		},
		entries: {
			title: "Memory Entries",
			searchPlaceholder: "Search memories...",
			allKinds: "All kinds",
			noEntries: "No entries yet",
			addEntry: "Add Entry",
			content: "Content",
			summary: "Summary",
			summaryLabel: "Title (search index)",
			summaryPlaceholder: "e.g. John's employee ID, API design decision",
			summaryHint: "Title is used for search; in chat, keywords (e.g. \"employee ID\") match title first",
			importance: "Importance",
			importanceLow: "Low",
			importanceMedium: "Medium",
			importanceHigh: "High",
			kind: "Kind",
		},
		actions: {
			save: "Save",
			saving: "Saving...",
			cancel: "Cancel",
			delete: "Delete",
		},
		hint: "In chat, AI will store and recall via Memory MCP; here you can manage kinds and pre-fill content.",
		confirmDeleteKind: "Delete kind \"{{name}}\"?",
		confirmDeleteEntry: "Delete this memory?",
		errors: {
			saveFailed: "Save failed",
			deleteFailed: "Delete failed",
			nameRequired: "Name is required",
			contentRequired: "Content is required",
			summaryRequired: "Title (search index) is required",
			kindRequired: "Please select a kind",
		},
		success: "Saved",
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
		subtitle: "Configure AI output styles and formats",
		description: "Output style configuration feature is under development...",
		comingSoon: "Coming Soon: Configurable output format, code highlighting theme, Markdown rendering options, etc.",
	},

	rules: {
		title: "Rules",
		subtitle: "Manage project rule files (.claude/rules/)",
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
		hint: "Rule files are stored in the project's .claude/rules/ directory. Each rule is a Markdown formatted file, AI will execute tasks according to rule content.",
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
		promptRequired: "Prompt is required to start a session.",
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
		selectWorkingDir: "Select working directory",
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

	// DingTalk
	dingtalk: {
		title: "DingTalk Bots",
		description: "Configure and manage multiple DingTalk enterprise bots to receive and reply to messages",
		enabled: "Enable Bot",
		enabledDesc: "When enabled, connects to DingTalk via Stream mode to receive and reply to messages",
		credentials: "App Credentials",
		clientId: "Client ID (AppKey)",
		clientSecret: "Client Secret (AppSecret)",
		robotCode: "Robot Code",
		robotCodePlaceholder: "Defaults to Client ID",
		optional: "Optional",
		testConnection: "Test Connection",
		testing: "Testing...",
		securityPolicy: "Security Policy",
		dmPolicy: {
			label: "DM Policy",
			open: "Open - anyone can message the bot",
			allowlist: "Allowlist - only specified users",
		},
		groupPolicy: {
			label: "Group Policy",
			open: "Open - any group can @mention the bot",
			allowlist: "Allowlist - only specified groups",
		},
		allowFrom: "Allowed User IDs",
		allowFromPlaceholder: "Comma-separated user IDs",
		allowFromHint: "Enter DingTalk user IDs, separated by commas",
		allowGroups: "Allowed Group IDs",
		allowGroupsPlaceholder: "Comma-separated group IDs",
		allowGroupsHint: "Enter DingTalk group conversation IDs, separated by commas",
		messageTypeLabel: "Message Settings",
		messageType: {
			label: "Reply Message Type",
			markdown: "Markdown - Rich text format",
			card: "AI Interactive Card - Supports streaming output",
		},
		cardTemplateId: "Card Template ID",
		cardTemplateKey: "Card Content Field Key",
		save: "Save Configuration",
		saving: "Saving...",
		saveSuccess: "Configuration saved",
		connect: "Connect",
		disconnect: "Disconnect",
		cancel: "Cancel",
		status: {
			disconnected: "Disconnected",
			connecting: "Connecting",
			connected: "Connected",
			failed: "Connection Failed",
		},
		// Multi-bot
		addBot: "Add Bot",
		editBot: "Edit Bot",
		deleteBot: "Delete Bot",
		botName: "Bot Name",
		botNamePlaceholder: "Enter a recognizable name",
		botNameRequired: "Bot name is required",
		botNameDuplicate: "This name is already in use",
		confirmDelete: "Are you sure you want to delete bot \"{{name}}\"? This action cannot be undone.",
		noBots: "No DingTalk bots configured yet",
		addFirstBot: "Add your first bot",
		notConfigured: "Not configured",
		helpText: "You need to create an enterprise internal app in DingTalk Developer Console and add robot capability with Stream mode.",
		helpLink: "Go to DingTalk Developer Console",
	},
};
