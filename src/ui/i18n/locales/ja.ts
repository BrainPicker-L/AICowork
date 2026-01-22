/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-21
 * @updated     2026-01-21
 * @Email       None
 *
 * 日本語翻訳
 */

export default {
	// Language names
	languageNames: {
		en: "English",
		zh: "简体中文",
		"zh-TW": "繁體中文",
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
		newTask: "+ 新規タスク",
		settings: "設定",
		noSessions: "まだセッションがありません。「+ 新規タスク」をクリックして開始してください。",
		deleteSession: "このセッションを削除",
		resumeInClaudeCode: "Claude Code で再開",
		resume: "再開",
		close: "閉じる",
		copyResumeCommand: "再開コマンドをコピー",
		workingDirUnavailable: "作業ディレクトリが利用できません",
	},

	// Settings Page
	settingsPage: {
		title: "設定",
		back: "戻る",
		sections: {
			general: "一般",
			api: "API 設定",
			features: "機能拡張",
			system: "システム",
		},
		navigation: {
			help: "ヘルプ",
			feedback: "フィードバック",
			about: "について",
			language: "言語",
			api: "API 設定",
			mcp: "MCP 設定",
			skills: "Skills",
			plugins: "Plugins",
			memory: "Memory",
			agents: "Agents",
			hooks: "Hooks",
			permissions: "Permissions",
			output: "出力スタイル",
			recovery: "セッション復元",
		},
		placeholder: {
			title: "設定",
			description: "左側のメニューから設定項目を選択してください",
		},
	},

	// Settings Sections
	help: {
		title: "ヘルプ",
		quickStart: {
			title: "クイックスタート",
			description: "AICowork を使用して最初のタスクを開始する方法を学ぶ",
		},
		faq: {
			title: "よくある質問",
			description: "よくある質問と解決策を確認する",
		},
		docs: {
			title: "ドキュメント",
			description: "詳細については公式ドキュメントをご覧ください",
		},
	},

	feedback: {
		title: "フィードバック",
		bugReport: {
			title: "バグ報告",
			description: "GitHub で問題を報告する",
		},
		featureRequest: {
			title: "機能リクエスト",
			description: "ご希望の新機能を提案する",
		},
	},

	about: {
		title: "AICowork について",
		version: {
			title: "バージョン情報",
			description: "バージョン 1.0.0",
		},
		techStack: {
			title: "技術スタック",
			description: "Electron + React + TypeScript + Claude Agent SDK",
		},
		license: {
			title: "ライセンス",
			description: "AGCPA v3.0",
		},
	},

	language: {
		title: "言語",
		current: "現在の言語",
		switching: "切り替え中...",
		hint: "言語設定はローカルに保存され、次回起動時に自動的に適用されます。",
	},

	api: {
		title: "API 設定",
		description: "Anthropic API キーとモデルを設定",
		viewList: "設定リストを表示",
		addConfig: "設定を追加",
		configName: {
			label: "設定名",
			placeholder: "マイ設定",
			test: "設定をテスト",
		},
		baseUrl: {
			label: "ベース URL",
			placeholder: "https://api.anthropic.com",
		},
		apiKey: {
			label: "API キー",
			placeholder: "sk-ant-...",
		},
		apiType: {
			label: "API タイプ",
			anthropic: "Anthropic",
			openai: "OpenAI 互換",
		},
		model: {
			label: "モデル名",
			placeholder: "モデル名を入力",
			refresh: "モデルリストを更新",
		},
		advanced: {
			label: "詳細パラメータ（オプション）",
			maxTokens: {
				label: "最大トークン数",
				placeholder: "デフォルト値",
			},
			temperature: {
				label: "温度",
				placeholder: "デフォルト値",
			},
			topP: {
				label: "Top P",
				placeholder: "デフォルト値",
			},
		},
		actions: {
			test: "接続テスト",
			testing: "テスト中...",
			save: "設定を保存",
			saving: "保存中...",
			setActive: "有効な設定にする",
			edit: "設定を編集",
			delete: "設定を削除",
		},
		responseTime: "応答時間: {{time}}ms",
		testFailed: "テスト失敗",
		noConfigs: "保存された設定がありません",
		hint: "API キーを設定して使用を開始してください。複数の設定を保存して素早く切り替えることができます。",
		docsLink: "ヘルプドキュメント",
	},

	mcp: {
		title: "MCP 設定",
		description: "Model Context Protocol サーバーを設定",
		noServers: "MCP サーバー設定がありません",
		addServer: "MCP サーバーを追加",
		templates: {
			title: "テンプレートから追加",
		},
		form: {
			name: {
				label: "サーバー名",
				placeholder: "github",
			},
			displayName: {
				label: "表示名（オプション）",
				placeholder: "GitHub MCP",
			},
			type: {
				label: "サーバータイプ",
				stdio: "STDIO",
				sse: "SSE",
			},
			command: {
				label: "コマンド",
				placeholder: "npx",
			},
			args: {
				label: "引数（スペース区切り）",
				placeholder: "@modelcontextprotocol/server-github",
			},
			description: {
				label: "説明（オプション）",
				placeholder: "サーバー機能の説明",
			},
		},
		view: {
			type: "タイプ",
			command: "コマンド",
			args: "引数",
			description: "説明",
		},
		actions: {
			save: "保存",
			saving: "保存中...",
			edit: "編集",
			delete: "削除",
		},
		errors: {
			deleteFailed: "削除失敗",
			nameRequired: "サーバー名は必須です",
			saveFailed: "保存失敗",
		},
		hint: "MCP サーバー設定は ~/.claude/settings.json に保存されています。",
	},

	skills: {
		title: "Skills",
		description: "カスタムスキルを管理します。AI は SKILL.md の指示に基づいて自動的に実行します",
		loading: "読み込み中...",
		noSkills: "インストールされた Skills がありません",
		noSkillsHint: "Skills を ~/.claude/skills/ ディレクトリに配置すると自動的に検出されます",
		openDirectory: "Skills ディレクトリを開く",
		source: {
			skill: "スキル",
			plugin: "プラグイン",
		},
		hint: "Skills は ~/.claude/skills/ ディレクトリに保存されています。各スキルフォルダーには SKILL.md ファイルが含まれており、AI は内容に基づいて自動的に実行します。",
	},

	plugins: {
		title: "Plugins",
		description: "インストール済みのプラグインを管理",
		noPlugins: "インストール済みのプラグインがありません",
		status: {
			installed: "インストール済み",
		},
		hint: "プラグインコマンドの形式は /plugin-name:command-name です。",
	},

	memory: {
		title: "Memory",
		description: "この領域は memvid プロジェクト機能用に予約されています",
		comingSoon: "近日公開：Memory 機能により、AI は複数のセッション間で情報を共有し、より一貫性のある会話エクスペリエンスを提供できます。",
	},

	agents: {
		title: "Agents",
		description: "サブエージェント設定を構成",
		subAgents: "SubAgents：複雑なタスクの処理効率を向上させるため、最大 10 個のサブエージェントを並行して起動できます。",
	},

	hooks: {
		title: "Hooks",
		postToolUse: {
			title: "ツール使用後にトリガー",
			noConfig: "設定がありません",
		},
		preToolUse: {
			title: "ツール使用前にトリガー",
			noConfig: "設定がありません",
		},
		hint: "Hooks 設定は ~/.claude/settings.json に保存されています。",
	},

	permissions: {
		title: "Permissions",
		allowedTools: {
			title: "許可されたツール",
			description: "ユーザー確認なしで使用可能",
			noConfig: "設定がありません",
		},
		customRules: {
			title: "カスタムルール",
			description: "特定の権限ルールを設定",
			noConfig: "カスタムルールがありません",
		},
		securityHint: "セキュリティヒント：特に Bash やファイル操作などのツール権限は慎重に付与してください。",
	},

	output: {
		title: "出力スタイル",
		description: "出力スタイル設定機能は開発中です...",
		comingSoon: "近日公開：出力フォーマット、コードハイライトテーマ、Markdown レンダリングオプションなどを設定できます。",
	},

	recovery: {
		title: "セッション復元",
		description: "以前のセッションを復元して会話を続行",
		example1: {
			title: "新しい Web アプリを作成",
			sessionId: "セッション ID: abc123def456",
			updated: "更新: 2 時間前",
		},
		example2: {
			title: "API 統合の問題を修正",
			sessionId: "セッション ID: ghi789jkl012",
			updated: "更新: 1 日前",
		},
		hint: "セッションデータはローカルデータベースに保存されています。セッションを復元すると、完全な会話履歴が読み込まれます。",
	},

	// Settings Modal (legacy)
	settings: {
		title: "API 設定",
		description: "Anthropic 公式 API および Anthropic 形式互換のサードパーティ API をサポートしています。",
		baseUrl: "ベース URL",
		apiKey: "API キー",
		modelName: "モデル名",
		cancel: "キャンセル",
		save: "保存",
		saving: "保存中...",
		saved: "設定を保存しました！",
	},

	// Validation errors
	errors: {
		apiKeyRequired: "API キーは必須です",
		baseUrlRequired: "ベース URL は必須です",
		modelRequired: "モデル名は必須です",
		invalidBaseUrl: "無効なベース URL 形式です",
		failedToLoadConfig: "設定の読み込みに失敗しました",
		failedToSaveConfig: "設定の保存に失敗しました",
		sessionStillRunning: "セッションがまだ実行中です。完了までお待ちください。",
		workingDirectoryRequired: "セッションを開始するには作業ディレクトリが必要です。",
		failedToGetSessionTitle: "セッションタイトルの取得に失敗しました。",
	},

	// Start Session Modal
	startSession: {
		title: "セッション開始",
		description: "新しいセッションを作成してエージェントとの対話を開始します。",
		workingDirectory: "作業ディレクトリ",
		browse: "参照...",
		recent: "最近使用",
		prompt: "プロンプト",
		promptPlaceholder: "エージェントに処理してほしいタスクを説明してください...",
		startButton: "セッション開始",
		starting: "開始中...",
	},

	// Prompt Input
	promptInput: {
		placeholderDisabled: "タスクを作成/選択して開始...",
		placeholder: "エージェントに処理してほしい内容を説明してください...",
		stopSession: "セッション停止",
		sendPrompt: "プロンプトを送信",
	},

	// Common
	common: {
		close: "閉じる",
		cancel: "キャンセル",
		save: "保存",
		delete: "削除",
		loading: "読み込み中...",
		edit: "編集",
		add: "追加",
		refresh: "更新",
		back: "戻る",
	},

	// App
	app: {
		noMessagesYet: "まだメッセージがありません",
		startConversation: "AICowork との会話を開始",
		beginningOfConversation: "会話の始まり",
		loadingMessages: "読み込み中...",
		newMessages: "新しいメッセージ",
	},

	// Deletion Confirmation
	deletion: {
		title: "⚠️ 削除操作の確認",
		subtitle: "AI が削除操作を実行しようとしています",
		description: "AI が削除操作を実行しようとしています。この操作はファイルやディレクトリを永久に削除する可能性があります。コマンドの内容を慎重に確認してください。",
		commandLabel: "実行されるコマンド：",
		unknownCommand: "不明なコマンド",
		warning: "警告：削除操作は元に戻すことができません。このコマンドの結果を理解していることを確認してください。",
		allow: "実行を許可",
		deny: "操作を拒否",
		deniedMessage: "ユーザーが削除操作を拒否しました",
	},

	// Event Card
	events: {
		sessionResult: "セッション結果",
		duration: "所要時間",
		usage: "使用量",
		cost: "コスト",
		input: "入力",
		output: "出力",
		collapse: "折りたたむ",
		showMoreLines: "さらに {{count}} 行表示",
		systemInit: "システム初期化",
		user: "ユーザー",
		assistant: "アシスタント",
		thinking: "思考中",
		sessionId: "セッション ID",
		modelName: "モデル名",
		permissionMode: "権限モード",
		workingDirectory: "作業ディレクトリ",
	},
};
