/**
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
			feedback: "フィードバック",
			about: "について",
			language: "言語",
			api: "API 設定",
			mcp: "MCP 設定",
			permissions: "権限",
			output: "出力スタイル",
			rules: "ルール",
			claudeMd: "Claude.md",
		},
		placeholder: {
			title: "設定",
			description: "左側のメニューから設定項目を選択してください",
		},
	},

	// Settings Sections
	help: {
		title: "ヘルプ",
		subtitle: "ヘルプとドキュメントを取得",
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
		tip: "ヒント：問題が発生した場合は、まずFAQを確認するか、フィードバックチャネルからお問い合わせください。",
		helpUrl: "https://ima.qq.com/note/share/_AwZPbuK9wucK5gWaVdjNQ?channel=4",
	},

	feedback: {
		title: "フィードバック",
		subtitle: "問題と提案を送信して改善にご協力ください",
		bugReport: {
			title: "バグ報告",
			description: "GitHub で問題を報告する",
			link: "GitHub へ移動",
			url: "https://github.com/BrainPicker-L/AICowork",
		},
		thankYou: "フィードバックありがとうございます！すべてのフィードバックを真摯に確認いたします。",
	},

	about: {
		title: "AICowork について",
		subtitle: "AI 協業ワークベンチ——AICowork！",
		version: {
			title: "バージョン情報",
			description: "バージョン 1.0.0",
		},
		techStack: {
			title: "技術スタック",
			description: "Electron + React + TypeScript + AI Agent SDK",
			electron: "• Electron - クロスプラットフォームデスクトップアプリフレームワーク",
			react: "• React + TypeScript - フロントエンドフレームワーク",
			tailwind: "• Tailwind CSS - スタイリングフレームワーク",
			claude: "• AI Agent SDK - AI 統合",
		},
		license: {
			title: "ライセンス",
			description: "GNU Affero General Public License v3.0 (AGPL-3.0)",
		},
		tagline: "AICowork は AI をあなたの作業パートナーにします。",
	},

	language: {
		title: "言語",
		description: "インターフェースの表示言語を選択",
		current: "現在の言語",
		switching: "切り替え中...",
		hint: "言語設定はローカルに保存され、次回起動時に自動的に適用されます。",
		tip: {
			label: "ヒント",
			text: "言語設定はローカルに保存され、次回起動時に自動的に適用されます。",
		},
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
		hintLabel: "ヒント：",
		docsLink: "ヘルプドキュメント",
		learnMore: "詳細を見る。",
		saveSuccess: "保存成功",
		current: "現在",
		confirmDelete: "この設定を削除してもよろしいですか？",
		modelLimits: "モデル制限: max_tokens ∈ [{{min}}, {{max}}]",
		azure: {
			resourceName: "Azure リソース名",
			deploymentName: "Azure デプロイ名",
			resourceNameRequired: "Azure リソース名は空にできません",
			deploymentNameRequired: "Azure デプロイ名は空にできません",
			bothRequired: "Azure にはリソース名とデプロイ名の両方が必要です",
		},
	},

	mcp: {
		title: "MCP 設定",
		description: "Model Context Protocol サーバーを設定します。SDK は自動的に起動してツールを登録します",
		noServers: "MCP サーバー設定がありません",
		addServer: "+ サーバーを追加",
		status: {
			enabled: "有効",
			disabled: "無効",
		},
		templates: {
			title: "テンプレートから追加",
		},
		form: {
			name: {
				label: "サーバー名",
				placeholder: "my-mcp-server",
			},
			displayName: {
				label: "表示名（オプション）",
				placeholder: "マイ MCP サーバー",
			},
			type: {
				label: "サーバータイプ",
				stdio: "stdio (標準入出力)",
				sse: "SSE (サーバー送信イベント)",
				streamableHttp: "Streamable HTTP",
			},
			command: {
				label: "コマンド",
				placeholder: "npx",
			},
			args: {
				label: "引数（スペース区切り）",
				placeholder: "@modelcontextprotocol/server-github",
			},
			url: {
				label: "URL",
				placeholder: "https://example.com/mcp",
			},
			description: {
				label: "説明（オプション）",
				placeholder: "サーバー機能の説明",
			},
			addTitle: "MCP サーバーを追加",
			editTitle: "MCP サーバーを編集",
		},
		view: {
			type: "タイプ",
			command: "コマンド",
			args: "引数",
			url: "URL",
			description: "説明",
		},
		actions: {
			save: "保存",
			saving: "保存中...",
			edit: "編集",
			delete: "削除",
			cancel: "キャンセル",
		},
		errors: {
			deleteFailed: "削除失敗",
			nameRequired: "サーバー名は必須です",
			saveFailed: "保存失敗",
			toggleFailed: "状態切り替え失敗",
			invalidNameFormat: "サーバー名には英字、数字、アンダースコア、ハイフンのみ使用できます",
			commandRequired: "stdio タイプのサーバーにはコマンドを指定する必要があります",
			urlRequired: "このタイプのサーバーには URL を指定する必要があります",
			invalidUrl: "無効な URL 形式です",
			saveSuccess: "保存成功",
		},
		confirmDelete: "MCP サーバー \"{{name}}\" を削除してもよろしいですか？",
		hint: "ヒント：MCP サーバー設定は ~/.claude/settings.json に保存されています。SDK は設定された MCP サーバーを自動的に起動し、ツールをセッションに登録します。",
		hintPath: "~/.claude/settings.json",
	},

	skills: {
		title: "スキル",
		description: "カスタムスキルを管理します。AI は SKILL.md の指示に基づいて自動的に実行します",
		loading: "読み込み中...",
		noSkills: "インストールされたスキルがありません",
		noSkillsHint: "スキルを ~/.claude/skills/ ディレクトリに配置すると自動的に検出されます",
		openDirectory: "スキルディレクトリを開く",
		source: {
			skill: "スキル",
			plugin: "プラグイン",
		},
		hint: "スキルは ~/.claude/skills/ ディレクトリに保存されています。各スキルフォルダーには SKILL.md ファイルが含まれており、AI は内容に基づいて自動的に実行します。",
	},

	plugins: {
		title: "プラグイン",
		description: "インストール済みのプラグインを管理",
		noPlugins: "インストール済みのプラグインがありません",
		status: {
			installed: "インストール済み",
		},
		hint: "プラグインコマンドの形式は /plugin-name:command-name です。",
	},	hooks: {
		title: "フック",
		description: "イベントフックを設定して、特定のタイミングでアクションを自動的にトリガー",
		postToolUse: {
			title: "PostToolUse",
			description: "ツール使用後にトリガー",
			noConfig: "設定がありません",
		},
		preToolUse: {
			title: "PreToolUse",
			description: "ツール使用前にトリガー",
			noConfig: "設定がありません",
		},
		addHook: "+ フックを追加",
		hint: "ヒント：フック設定は保存されています",
		hintPath: "~/.claude/settings.json",
		hintSuffix: "。SDK は自動的に設定されたフックをロードして実行します。",
	},

	permissions: {
		title: "権限",
		description: "ツール権限ルールを設定して、AI が実行できる操作を制御",
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
		securityHint: "セキュリティヒント：特に Bash やファイル操作などのツール権限は慎重に付与してください。ワイルドカードルールを使用し、完全に開放しないことをお勧めします。",
	},

	output: {
		title: "出力スタイル",
		subtitle: "AI 出力スタイルと形式を設定",
		description: "出力スタイル設定機能は開発中です...",
		comingSoon: "近日公開：出力フォーマット、コードハイライトテーマ、Markdown レンダリングオプションなどを設定できます。",
	},

	recovery: {
		title: "セッション復元",
		subtitle: "過去のセッションを表示して復元",
		description: "過去のセッションを復元して会話を続行",
		loading: "読み込み中...",
		refresh: "リストを更新",
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
		recover: "復元",
		hint: "セッションデータはローカルデータベースに保存されています。セッションを復元すると、完全な会話履歴が読み込まれます。",
		hintWithCommand: "コマンドラインも使用できます：",
	},

	rules: {
		title: "ルール",
		subtitle: "プロジェクトルールファイルを管理 (.claude/rules/)",
		description: "プロジェクトの .claude/rules/ ディレクトリでカスタムルールファイルを作成・管理",
		noRules: "ルールファイルがありません",
		createFromTemplate: "テンプレートから作成",
		createNew: "新しいルールを作成",
		editor: {
			nameLabel: "ルール名",
			namePlaceholder: "例：coding-style",
			contentLabel: "ルール内容 (Markdown)",
			contentPlaceholder: "ルール内容を入力...",
			save: "ルールを保存",
			saving: "保存中...",
			cancel: "キャンセル",
		},
		templates: {
			title: "テンプレートを選択",
			language: {
				name: "言語ルール",
				description: "プロジェクトで使用するプログラミング言語とコーディング規約を指定",
			},
			codingStyle: {
				name: "コーディングスタイル",
				description: "コードフォーマットとスタイルガイドラインを定義",
			},
			gitCommit: {
				name: "Git コミット",
				description: "Git コミットメッセージの形式と規約を設定",
			},
		},
		confirmDelete: "ルール \"{{name}}\" を削除してもよろしいですか？",
		deleted: "ルールを削除しました",
		saved: "ルールを保存しました",
		hint: "ルールファイルはプロジェクトの .claude/rules/ ディレクトリに保存されています。各ルールは Markdown 形式のファイルで、AI はルール内容に従ってタスクを実行します。",
	},

	claudeMd: {
		title: "Claude.md",
		subtitle: "プロジェクト Claude 設定を管理 (CLAUDE.md)",
		description: "プロジェクトルートの CLAUDE.md ファイルでプロジェクトレベルの AI 指導を設定",
		status: {
			exists: "設定ファイルが存在します",
			missing: "設定ファイルが存在しません",
			charCount: "{{count}} 文字",
			lastModified: "最終更新: {{date}}",
		},
		actions: {
			view: "現在の設定を表示",
			edit: "設定を編集",
			save: "設定を保存",
			saving: "保存中...",
			delete: "設定を削除",
			createFromTemplate: "テンプレートから作成",
			openDirectory: "ディレクトリを開く",
		},
		templates: {
			title: "テンプレートを選択",
			basic: {
				name: "基本設定",
				description: "基本プロジェクト情報を含むシンプルなテンプレート",
			},
			frontend: {
				name: "フロントエンドプロジェクト",
				description: "React/Vue/Next.js などのフロントエンドプロジェクト向け",
			},
			backend: {
				name: "バックエンドプロジェクト",
				description: "Node.js/Python/FastAPI などのバックエンドプロジェクト向け",
			},
		},
		editor: {
			label: "Claude.md 内容",
			placeholder: "ここにプロジェクト設定内容を入力...",
			save: "設定を保存",
			cancel: "キャンセル",
		},
		confirmDelete: "CLAUDE.md 設定ファイルを削除してもよろしいですか？",
		deleted: "設定ファイルを削除しました",
		saved: "設定を保存しました",
		hint: "CLAUDE.md ファイルはプロジェクトルートにあり、プロジェクトレベルの AI 行動指導を定義します。このファイルはグローバル設定を上書きします。",
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
		selectWorkingDir: "作業ディレクトリを選択",
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
