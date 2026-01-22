/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-21
 * @updated     2026-01-21
 * @Email       None
 *
 * 繁體中文翻譯
 */

export default {
	// Language names
	languageNames: {
		en: "English",
		zh: "簡體中文",
		"zh-TW": "繁體中文 (台灣)",
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
		newTask: "+ 新建任務",
		settings: "設定",
		noSessions: "暫無會話。點擊 \"+ 新建任務\" 開始。",
		deleteSession: "刪除此會話",
		resumeInClaudeCode: "在 Claude Code 中恢復",
		resume: "恢復",
		close: "關閉",
		copyResumeCommand: "複製恢復命令",
		workingDirUnavailable: "工作目錄不可用",
	},

	// Settings Page
	settingsPage: {
		title: "設定",
		back: "返回",
		sections: {
			general: "常規",
			api: "API 配置",
			features: "功能擴展",
			system: "系統",
		},
		navigation: {
			help: "幫助",
			feedback: "反饋",
			about: "關於",
			language: "語言",
			api: "API 設定",
			mcp: "MCP 設定",
			skills: "技能",
			plugins: "插件",
			memory: "記憶",
			agents: "代理",
			hooks: "鉤子",
			permissions: "權限",
			output: "輸出樣式",
			recovery: "會話恢復",
		},
		placeholder: {
			title: "設定",
			description: "選擇左側菜單進行配置",
		},
	},

	help: {
		title: "幫助",
		quickStart: { title: "快速開始", description: "了解如何使用 AICowork 開始第一個任務" },
		faq: { title: "常見問題", description: "查看常見問題和解決方案" },
		docs: { title: "文檔鏈接", description: "訪問官方文檔獲取更多信息" },
		tip: "提示：遇到問題可以先查看常見問題，或者通過反饋渠道聯繫我們。",
		helpUrl: "https://ima.qq.com/note/share/_AwZPbuK9wucK5gWaVdjNQ?channel=4",
	},

	feedback: {
		title: "反饋",
		bugReport: { title: "Bug 報告", description: "在 GitHub 上提交問題報告", url: "https://github.com/Pan519/AICowork" },
		featureRequest: { title: "功能建議", description: "提出您希望看到的新功能", url: "https://docs.qq.com/form/page/DRm5uV1pSZFB3VHNv" },
		thankYou: "感謝您的反饋！我們會認真閱讀每一條反饋意見。",
	},

	about: {
		title: "關於 AICowork",
		version: { title: "版本信息", description: "版本 1.0.0" },
		techStack: { title: "技術棧", description: "Electron + React + TypeScript + Claude Agent SDK" },
		license: { title: "許可證", description: "MIT" },
		subtitle: "AI 協作工作台——AICowork！",
		tagline: "AICowork 讓 AI 成為你的工作協作夥伴。",
	},

	language: {
		title: "語言",
		current: "當前語言",
		switching: "切換中...",
		hint: "語言設定會保存在本地，下次啟動應用時自動應用。",
		tip: {
			label: "提示",
			text: "語言設定會保存在本地，下次啟動應用時自動應用。",
		},
	},

	api: {
		title: "API 設定",
		description: "配置 Anthropic API 金鑰和模型",
		viewList: "查看配置列表",
		addConfig: "添加配置",
		configName: { label: "配置名稱", placeholder: "我的配置", test: "測試配置" },
		baseUrl: { label: "基礎 URL", placeholder: "https://api.anthropic.com" },
		apiKey: { label: "API 金鑰", placeholder: "sk-ant-..." },
		apiType: { label: "API 類型", anthropic: "Anthropic", openai: "OpenAI 相容" },
		model: { label: "模型名稱", placeholder: "輸入模型名稱", refresh: "刷新模型列表" },
		advanced: {
			label: "高級參數（可選）",
			maxTokens: { label: "最大 Token 數", placeholder: "默認值" },
			temperature: { label: "溫度", placeholder: "默認值" },
			topP: { label: "Top P", placeholder: "默認值" },
		},
		actions: {
			test: "測試連接",
			testing: "測試中...",
			save: "保存配置",
			saving: "保存中...",
			setActive: "設為當前配置",
			edit: "編輯配置",
			delete: "刪除配置",
		},
		responseTime: "響應時間: {{time}}ms",
		testFailed: "測試失敗",
		noConfigs: "暫無保存的配置",
		hint: "配置 API 金鑰後即可開始使用。支援多個配置快速切換。",
		docsLink: "幫助文檔",
	},

	mcp: {
		title: "MCP 設定",
		description: "配置 Model Context Protocol 伺服器",
		noServers: "暫無 MCP 伺服器配置",
		addServer: "添加 MCP 伺服器",
		templates: { title: "從模板添加" },
		form: {
			name: { label: "伺服器名稱", placeholder: "github" },
			displayName: { label: "顯示名稱（可選）", placeholder: "GitHub MCP" },
			type: { label: "伺服器類型", stdio: "STDIO", sse: "SSE" },
			command: { label: "命令", placeholder: "npx" },
			args: { label: "參數（空格分隔）", placeholder: "@modelcontextprotocol/server-github" },
			description: { label: "描述（可選）", placeholder: "伺服器功能描述" },
		},
		view: { type: "類型", command: "命令", args: "參數", description: "描述" },
		actions: { save: "保存", saving: "保存中...", edit: "編輯", delete: "刪除" },
		errors: {
			deleteFailed: "刪除失敗",
			nameRequired: "伺服器名稱不能為空",
			saveFailed: "保存失敗",
		},
		hint: "MCP 伺服器配置存儲在 ~/.claude/settings.json 中。",
	},

	skills: {
		title: "技能",
		description: "管理自定義技能，AI 會根據 SKILL.md 中的指導自動執行",
		loading: "載入中...",
		noSkills: "暫無已安裝的技能",
		noSkillsHint: "將 Skills 放入 ~/.claude/skills/ 目錄後即可自動識別",
		openDirectory: "打開 Skills 目錄",
		source: { skill: "技能", plugin: "插件" },
		hint: "Skills 存儲在 ~/.claude/skills/ 目錄中。每個技能文件夾包含一個 SKILL.md 文件，AI 會根據內容自動執行。",
	},

	plugins: {
		title: "插件",
		description: "管理已安裝的插件",
		noPlugins: "暫無已安裝的插件",
		status: { installed: "已安裝" },
		hint: "插件命令格式為 /plugin-name:command-name。",
	},

	memory: {
		title: "記憶",
		description: "此區域預留給 memvid 項目功能",
		comingSoon: "即將推出：Memory 功能將允許 AI 在多個會話之間共享信息，提供更連貫的對話體驗。",
	},

	agents: {
		title: "代理",
		description: "配置子代理設定",
		subAgents: "SubAgents：最多可以同時啟動 10 個子代理並行處理任務，提高複雜任務的處理效率。",
	},

	hooks: {
		title: "鉤子",
		postToolUse: { title: "工具使用後觸發", noConfig: "暫無配置" },
		preToolUse: { title: "工具使用前觸發", noConfig: "暫無配置" },
		hint: "Hooks 配置存儲在 ~/.claude/settings.json 中。",
	},

	permissions: {
		title: "權限",
		allowedTools: { title: "允許的工具", description: "無需用戶確認即可使用", noConfig: "暫無配置" },
		customRules: { title: "自定義規則", description: "配置特定的權限規則", noConfig: "暫無自定義規則" },
		securityHint: "安全提示：謹慎授予工具權限，特別是 Bash 和文件操作。",
	},

	output: {
		title: "輸出樣式",
		description: "輸出樣式配置功能正在開發中...",
		comingSoon: "即將推出：可配置輸出格式、代碼高亮主題、Markdown 渲染選項等。",
	},

	recovery: {
		title: "會話恢復",
		description: "恢復之前的會話繼續對話",
		example1: { title: "創建新的 Web 應用", sessionId: "會話 ID: abc123def456", updated: "更新於: 2 小時前" },
		example2: { title: "修復 API 集成問題", sessionId: "會話 ID: ghi789jkl012", updated: "更新於: 1 天前" },
		hint: "會話數據存儲在本地數據庫中。恢復會話將加載完整的對話歷史。",
	},

	// Legacy
	settings: {
		title: "API 配置",
		description: "支援 Anthropic 官方 API 以及相容 Anthropic 格式的第三方 API。",
		baseUrl: "基礎 URL",
		apiKey: "API 金鑰",
		modelName: "模型名稱",
		cancel: "取消",
		save: "儲存",
		saving: "儲存中...",
		saved: "配置儲存成功！",
	},

	errors: {
		apiKeyRequired: "API 金鑰為必填項",
		baseUrlRequired: "基礎 URL 為必填項",
		modelRequired: "模型名稱為必填項",
		invalidBaseUrl: "無效的基礎 URL 格式",
		failedToLoadConfig: "載入配置失敗",
		failedToSaveConfig: "儲存配置失敗",
		sessionStillRunning: "會話仍在運行中。請等待其完成。",
		workingDirectoryRequired: "啟動會話需要工作目錄。",
		failedToGetSessionTitle: "取得會話標題失敗。",
	},

	startSession: {
		title: "啟動會話",
		description: "建立新會話以開始與代理互動。",
		workingDirectory: "工作目錄",
		browse: "瀏覽...",
		recent: "最近使用",
		prompt: "提示詞",
		promptPlaceholder: "描述您希望代理處理的任務...",
		startButton: "啟動會話",
		starting: "啟動中...",
	},

	promptInput: {
		placeholderDisabled: "建立/選擇任務以開始...",
		placeholder: "描述您希望代理處理的內容...",
		stopSession: "停止會話",
		sendPrompt: "傳送提示詞",
	},

	common: {
		close: "關閉",
		cancel: "取消",
		save: "儲存",
		delete: "刪除",
		loading: "載入中...",
		edit: "編輯",
		add: "添加",
		refresh: "刷新",
		back: "返回",
	},

	app: {
		noMessagesYet: "暫無訊息",
		startConversation: "開始與 AICowork 對話",
		beginningOfConversation: "對話開始",
		loadingMessages: "載入中...",
		newMessages: "新訊息",
	},

	deletion: {
		title: "⚠️ 刪除操作確認",
		subtitle: "AI 即將執行刪除操作",
		description: "AI 正在嘗試執行刪除操作。此操作可能會永久刪除檔案或目錄，請仔細確認命令內容。",
		commandLabel: "將要執行的命令：",
		unknownCommand: "未知命令",
		warning: "警告：刪除操作無法撤銷，請確保您了解此命令的後果。",
		allow: "允許執行",
		deny: "拒絕操作",
		deniedMessage: "使用者拒絕了刪除操作",
	},

	events: {
		sessionResult: "會話結果",
		duration: "耗時",
		usage: "使用量",
		cost: "成本",
		input: "輸入",
		output: "輸出",
		collapse: "收起",
		showMoreLines: "顯示更多 {{count}} 行",
		systemInit: "系統初始化",
		user: "使用者",
		assistant: "助手",
		thinking: "思考中",
		sessionId: "會話 ID",
		modelName: "模型名稱",
		permissionMode: "權限模式",
		workingDirectory: "工作目錄",
	},
};
