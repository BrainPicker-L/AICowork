/**
 *   перевод (Russian translations)
 */

export default {
	// Language names
	languageNames: {
		en: "English",
		"zh-TW": "Традиционный китайский",
		zh: "Упрощенный китайский",
		ja: "Японский",
		ko: "Корейский",
		es: "Испанский",
		fr: "Французский",
		de: "Немецкий",
		ru: "Русский",
		pt: "Португальский",
	},

	// Sidebar
	sidebar: {
		newTask: "+ Новая задача",
		settings: "Настройки",
		noSessions: "Сессий пока нет. Нажмите \"+ Новая задача\" для начала.",
		deleteSession: "Удалить эту сессию",
		resumeInClaudeCode: "Возобновить в Claude Code",
		resume: "Возобновить",
		close: "Закрыть",
		copyResumeCommand: "Копировать команду возобновления",
		workingDirUnavailable: "Рабочий каталог недоступен",
	},

	// Settings Page
	settingsPage: {
		title: "Настройки",
		back: "Назад",
		sections: {
			general: "Общие",
			api: "Конфигурация API",
			features: "Функции",
			system: "Система",
		},
		navigation: {
			feedback: "Обратная связь",
			about: "О программе",
			language: "Язык",
			api: "Настройки API",
			mcp: "Настройки MCP",
			permissions: "Разрешения",
			output: "Стили вывода",
			rules: "Правила",
			claudeMd: "Claude.md",
		},
		placeholder: {
			title: "Настройки",
			description: "Выберите пункт меню слева для настройки",
		},
	},

	// Settings Sections
	help: {
		title: "Справка",
		subtitle: "Получите помощь и документацию",
		quickStart: {
			title: "Быстрый старт",
			description: "Узнайте, как использовать AICowork для выполнения первой задачи",
		},
		faq: {
			title: "ЧЗВ",
			description: "Посмотрите часто задаваемые вопросы и решения",
		},
		docs: {
			title: "Документация",
			description: "Посетите официальную документацию для получения дополнительной информации",
		},
		tip: "Совет: Сначала проверьте ЧЗВ, если у вас возникли проблемы, или свяжитесь с нами через каналы обратной связи.",
		helpUrl: "https://ima.qq.com/note/share/_AwZPbuK9wucK5gWaVdjNQ?channel=4",
	},

	feedback: {
		title: "Обратная связь",
		subtitle: "Отправляйте проблемы и предложения, чтобы помочь нам улучшить",
		bugReport: {
			title: "Сообщить об ошибке",
			description: "Отправьте отчёты о проблемах на GitHub",
			link: "Перейти на GitHub",
			url: "https://github.com/BrainPicker-L/AICowork",
		},
		thankYou: "Спасибо за вашу обратную связь! Мы внимательно рассмотрим каждый отзыв.",
	},

	about: {
		title: "О программе AICowork",
		subtitle: "Рабочее место для сотрудничества с ИИ - AICowork!",
		version: {
			title: "Версия",
			description: "Версия 1.0.0",
		},
		techStack: {
			title: "Технологический стек",
			description: "Electron + React + TypeScript + AI Agent SDK",
			electron: "• Electron - Кроссплатформенная framework для десктопных приложений",
			react: "• React + TypeScript - Frontend framework",
			tailwind: "• Tailwind CSS - Framework для стилей",
			claude: "• AI Agent SDK - Интеграция ИИ",
		},
		license: {
			title: "Лицензия",
			description: "GNU Affero General Public License v3.0 (AGPL-3.0)",
		},
		tagline: "AICowork делает ИИ вашим партнером по совместной работе.",
	},

	language: {
		title: "Язык",
		description: "Выберите язык отображения интерфейса",
		current: "Текущий язык",
		switching: "Переключение...",
		hint: "Настройки языка сохраняются локально и будут применены автоматически при следующем запуске приложения.",
		tip: {
			label: "Совет",
			text: "Настройки языка сохраняются локально и будут применены автоматически при следующем запуске приложения.",
		},
	},

	api: {
		title: "Настройки API",
		description: "Настройте API-ключ Anthropic и модель",
		viewList: "Просмотреть список конфигураций",
		addConfig: "Добавить конфигурацию",
		configName: {
			label: "Имя конфигурации",
			placeholder: "Моя конфигурация",
			test: "Тестовая конфигурация",
		},
		baseUrl: {
			label: "Базовый URL",
			placeholder: "https://api.anthropic.com",
		},
		apiKey: {
			label: "API-ключ",
			placeholder: "sk-ant-...",
		},
		apiType: {
			label: "Тип API",
			anthropic: "Anthropic",
			openai: "Совместимый с OpenAI",
		},
		model: {
			label: "Имя модели",
			placeholder: "Введите имя модели",
			refresh: "Обновить список моделей",
		},
		advanced: {
			label: "Расширенные параметры (необязательно)",
			maxTokens: {
				label: "Макс. токенов",
				placeholder: "По умолчанию",
			},
			temperature: {
				label: "Температура",
				placeholder: "По умолчанию",
			},
			topP: {
				label: "Top P",
				placeholder: "По умолчанию",
			},
		},
		actions: {
			test: "Проверить соединение",
			testing: "Проверка...",
			save: "Сохранить конфигурацию",
			saving: "Сохранение...",
			setActive: "Установить активной",
			edit: "Редактировать конфигурацию",
			delete: "Удалить конфигурацию",
		},
		responseTime: "Время ответа: {{time}} мс",
		testFailed: "Тест не удался",
		noConfigs: "Нет сохранённых конфигураций",
		hint: "Настройте API-ключ для начала использования. Поддерживается несколько конфигураций для быстрого переключения.",
		hintLabel: "Совет: ",
		docsLink: "Документация",
		learnMore: "Узнать больше.",
		saveSuccess: "Успешно сохранено",
		current: "Текущий",
		confirmDelete: "Вы уверены, что хотите удалить эту конфигурацию?",
		modelLimits: "Ограничения модели: max_tokens ∈ [{{min}}, {{max}}]",
		azure: {
			resourceName: "Имя ресурса Azure",
			deploymentName: "Имя развертывания Azure",
			resourceNameRequired: "Имя ресурса Azure не может быть пустым",
			deploymentNameRequired: "Имя развертывания Azure не может быть пустым",
			bothRequired: "Azure требует как имя ресурса, так и имя развертывания",
		},
	},

	mcp: {
		title: "Настройки MCP",
		description: "Настройте серверы Model Context Protocol, SDK автоматически запустит и зарегистрирует инструменты",
		noServers: "Нет конфигураций MCP-серверов",
		addServer: "+ Добавить сервер",
		templates: {
			title: "Добавить из шаблона",
		},
		form: {
			name: {
				label: "Имя сервера",
				placeholder: "my-mcp-server",
			},
			displayName: {
				label: "Отображаемое имя (необязательно)",
				placeholder: "Мой MCP-сервер",
			},
			type: {
				label: "Тип сервера",
				stdio: "stdio (стандартный ввод/вывод)",
				sse: "SSE (события, отправленные сервером)",
				streamableHttp: "Streamable HTTP",
			},
			command: {
				label: "Команда",
				placeholder: "npx",
			},
			args: {
				label: "Аргументы (разделённые пробелами)",
				placeholder: "@modelcontextprotocol/server-github",
			},
			url: {
				label: "URL",
				placeholder: "https://example.com/mcp",
			},
			description: {
				label: "Описание (необязательно)",
				placeholder: "Описание функциональности сервера",
			},
			addTitle: "Добавить MCP-сервер",
			editTitle: "Редактировать MCP-сервер",
		},
		view: {
			type: "Тип",
			command: "Команда",
			args: "Аргументы",
			url: "URL",
			description: "Описание",
		},
		actions: {
			save: "Сохранить",
			saving: "Сохранение...",
			edit: "Редактировать",
			delete: "Удалить",
			cancel: "Отмена",
		},
		errors: {
			deleteFailed: "Удаление не удалось",
			nameRequired: "Имя сервера не может быть пустым",
			saveFailed: "Сохранение не удалось",
			invalidNameFormat: "Имя сервера может содержать только буквы, цифры, знаки подчёркивания и дефисы",
			commandRequired: "Для серверов типа stdio необходимо указать команду",
			urlRequired: "Для этого типа сервера необходимо указать URL",
			invalidUrl: "Неверный формат URL",
			saveSuccess: "Успешно сохранено",
		},
		confirmDelete: "Вы уверены, что хотите удалить MCP-сервер \"{{name}}\"?",
		hint: "Совет: Конфигурации MCP-серверов хранятся в ~/.claude/settings.json. SDK автоматически запустит настроенные MCP-серверы и зарегистрирует инструменты в сессии.",
		hintPath: "~/.claude/settings.json",
	},

	skills: {
		title: "Навыки",
		description: "Управляйте пользовательскими навыками, ИИ будет автоматически выполнять их на основе инструкций SKILL.md",
		loading: "Загрузка...",
		noSkills: "Нет установленных навыков",
		noSkillsHint: "Поместите навыки в каталог ~/.claude/skills/ для автоматического обнаружения",
		openDirectory: "Открыть каталог навыков",
		source: {
			skill: "Навык",
			plugin: "Плагин",
		},
		hint: "Навыки хранятся в каталоге ~/.claude/skills/. Каждая папка навыка содержит файл SKILL.md, ИИ будет автоматически выполнять на основе содержимого.",
	},

	plugins: {
		title: "Плагины",
		description: "Управление установленными плагинами",
		noPlugins: "Нет установленных плагинов",
		status: {
			installed: "Установлено",
		},
		hint: "Формат команды плагина: /plugin-name:command-name.",
	},	hooks: {
		title: "Хуки",
		description: "Настройте хуки событий для автоматического запуска действий в определённое время",
		postToolUse: {
			title: "PostToolUse",
			description: "Запускается после использования инструмента",
			noConfig: "Нет конфигурации",
		},
		preToolUse: {
			title: "PreToolUse",
			description: "Запускается перед использованием инструмента",
			noConfig: "Нет конфигурации",
		},
		addHook: "+ Добавить хук",
		hint: "Совет: Конфигурация хуков хранится в",
		hintPath: "~/.claude/settings.json",
		hintSuffix: ". SDK автоматически загрузит и выполнит настроенные хуки.",
	},

	permissions: {
		title: "Разрешения",
		allowedTools: {
			title: "Разрешённые инструменты",
			description: "Могут использоваться без подтверждения пользователя",
			noConfig: "Нет конфигурации",
		},
		customRules: {
			title: "Пользовательские правила",
			description: "Настройте специфические правила разрешений",
			noConfig: "Нет пользовательских правил",
		},
		securityHint: "Совет по безопасности: Тщательно предоставляйте разрешения на инструменты, особенно для Bash и файловых операций.",
	},

	output: {
		title: "Стили вывода",
		subtitle: "Настройте стили и форматы вывода ИИ",
		description: "Функция конфигурации стиля вывода находится в разработке...",
		comingSoon: "Скоро будет: настраиваемый формат вывода, тема подсветки кода, параметры рендеринга Markdown и т.д.",
	},

	recovery: {
		title: "Восстановление сессии",
		subtitle: "Просмотр и возобновление предыдущих сессий",
		description: "Возобновите предыдущие сессии для продолжения разговоров",
		loading: "Загрузка...",
		refresh: "Обновить список",
		example1: {
			title: "Создать новое веб-приложение",
			sessionId: "ID сессии: abc123def456",
			updated: "Обновлено: 2 часа назад",
		},
		example2: {
			title: "Исправить проблему интеграции API",
			sessionId: "ID сессии: ghi789jkl012",
			updated: "Обновлено: 1 день назад",
		},
		recover: "Возобновить",
		hint: "Данные сессии хранятся в локальной базе данных. Возобновление сессии загрузит полную историю разговора.",
		hintWithCommand: "Вы также можете использовать командную строку:",
	},

	rules: {
		title: "Правила",
		subtitle: "Управление файлами правил проекта (.claude/rules/)",
		description: "Создавайте и управляйте пользовательскими файлами правил в каталоге .claude/rules/ вашего проекта",
		noRules: "Пока нет файлов правил",
		createFromTemplate: "Создать из шаблона",
		createNew: "Создать новое правило",
		editor: {
			nameLabel: "Имя правила",
			namePlaceholder: "например: coding-style",
			contentLabel: "Содержимое правила (Markdown)",
			contentPlaceholder: "Введите содержимое правила...",
			save: "Сохранить правило",
			saving: "Сохранение...",
			cancel: "Отмена",
		},
		templates: {
			title: "Выберите шаблон",
			language: {
				name: "Правила языка",
				description: "Укажите язык программирования и стандарты кодирования",
			},
			codingStyle: {
				name: "Стиль кодирования",
				description: "Определите форматирование и стили кода",
			},
			gitCommit: {
				name: "Git Commit",
				description: "Настройте формат и стандарты сообщений Git-коммитов",
			},
		},
		confirmDelete: "Вы уверены, что хотите удалить правило \"{{name}}\"?",
		deleted: "Правило удалено",
		saved: "Правило сохранено",
		hint: "Файлы правил хранятся в каталоге .claude/rules/ проекта. Каждое правило - это файл в формате Markdown, ИИ будет выполнять задачи в соответствии с содержимым правила.",
	},

	claudeMd: {
		title: "Claude.md",
		subtitle: "Управление конфигурацией Claude проекта (CLAUDE.md)",
		description: "Настройте руководство ИИ на уровне проекта в CLAUDE.md в корне проекта",
		status: {
			exists: "Файл конфигурации существует",
			missing: "Файл конфигурации отсутствует",
			charCount: "{{count}} символов",
			lastModified: "Последнее изменение: {{date}}",
		},
		actions: {
			view: "Просмотреть текущую конфигурацию",
			edit: "Редактировать конфигурацию",
			save: "Сохранить конфигурацию",
			saving: "Сохранение...",
			delete: "Удалить конфигурацию",
			createFromTemplate: "Создать из шаблона",
			openDirectory: "Открыть каталог",
		},
		templates: {
			title: "Выберите шаблон",
			basic: {
				name: "Базовая конфигурация",
				description: "Простой шаблон с базовой информацией о проекте",
			},
			frontend: {
				name: "Frontend проект",
				description: "Для Frontend проектов React/Vue/Next.js",
			},
			backend: {
				name: "Backend проект",
				description: "Для Backend проектов Node.js/Python/FastAPI",
			},
		},
		editor: {
			label: "Содержимое Claude.md",
			placeholder: "Введите содержимое конфигурации проекта здесь...",
			save: "Сохранить конфигурацию",
			cancel: "Отмена",
		},
		confirmDelete: "Вы уверены, что хотите удалить файл конфигурации CLAUDE.md?",
		deleted: "Конфигурация удалена",
		saved: "Конфигурация сохранена",
		hint: "Файл CLAUDE.md находится в корне проекта и определяет руководящие принципы поведения ИИ на уровне проекта. Этот файл переопределяет глобальные настройки.",
	},

	// Settings Modal (legacy)
	settings: {
		title: "Конфигурация API",
		description: "Поддерживает официальный API Anthropic, а также сторонние API, совместимые с форматом Anthropic.",
		baseUrl: "Базовый URL",
		apiKey: "API-ключ",
		modelName: "Имя модели",
		cancel: "Отмена",
		save: "Сохранить",
		saving: "Сохранение...",
		saved: "Конфигурация успешно сохранена!",
	},

	// Validation errors
	errors: {
		apiKeyRequired: "API-ключ обязателен",
		baseUrlRequired: "Базовый URL обязателен",
		modelRequired: "Модель обязательна",
		invalidBaseUrl: "Неверный формат базового URL",
		failedToLoadConfig: "Не удалось загрузить конфигурацию",
		failedToSaveConfig: "Не удалось сохранить конфигурацию",
		sessionStillRunning: "Сессия всё ещё выполняется. Пожалуйста, подождите её завершения.",
		workingDirectoryRequired: "Рабочий каталог обязателен для запуска сессии.",
		failedToGetSessionTitle: "Не удалось получить заголовок сессии.",
	},

	// Start Session Modal
	startSession: {
		title: "Запустить сессию",
		description: "Создайте новую сессию для начала взаимодействия с агентом.",
		workingDirectory: "Рабочий каталог",
		browse: "Обзор...",
		recent: "Недавние",
		prompt: "Запрос",
		promptPlaceholder: "Опишите задачу, которую агент должен выполнить...",
		startButton: "Запустить сессию",
		starting: "Запуск...",
	},

	// Prompt Input
	promptInput: {
		placeholderDisabled: "Создайте/выберите задачу для начала...",
		placeholder: "Опишите, что агент должен выполнить...",
		stopSession: "Остановить сессию",
		sendPrompt: "Отправить запрос",
		selectWorkingDir: "Выбрать рабочий каталог",
	},

	// Common
	common: {
		close: "Закрыть",
		cancel: "Отмена",
		save: "Сохранить",
		delete: "Удалить",
		loading: "Загрузка...",
		edit: "Редактировать",
		add: "Добавить",
		refresh: "Обновить",
		back: "Назад",
	},

	// App
	app: {
		noMessagesYet: "Пока нет сообщений",
		startConversation: "Начните разговор с AICowork",
		beginningOfConversation: "Начало разговора",
		loadingMessages: "Загрузка...",
		newMessages: "Новые сообщения",
	},

	// Deletion Confirmation
	deletion: {
		title: "⚠️ Подтверждение удаления",
		subtitle: "ИИ собирается выполнить операцию удаления",
		description: "ИИ пытается выполнить операцию удаления. Эта операция может окончательно удалить файлы или каталоги. Пожалуйста, тщательно проверьте содержимое команды.",
		commandLabel: "Команда для выполнения:",
		unknownCommand: "Неизвестная команда",
		warning: "Предупреждение: Операции удаления нельзя отменить. Убедитесь, что вы понимаете последствия этой команды.",
		allow: "Разрешить выполнение",
		deny: "Отклонить операцию",
		deniedMessage: "Пользователь отклонил операцию удаления",
	},

	// Event Card
	events: {
		sessionResult: "Результат сессии",
		duration: "Продолжительность",
		usage: "Использование",
		cost: "Стоимость",
		input: "Ввод",
		output: "Вывод",
		collapse: "Свернуть",
		showMoreLines: "Показать ещё {{count}} строк",
		systemInit: "Инициализация системы",
		user: "Пользователь",
		assistant: "Ассистент",
		thinking: "Размышление",
		sessionId: "ID сессии",
		modelName: "Имя модели",
		permissionMode: "Режим разрешений",
		workingDirectory: "Рабочий каталог",
	},
};
