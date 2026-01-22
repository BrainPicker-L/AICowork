/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @updated     2026-01-21
 * @Email       None
 *
 * Русский перевод
 */

export default {
	// Language names
	languageNames: {
		en: "English",
		zh: "Упрощённый китайский",
		"zh-TW": "Традиционный китайский",
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
		resumeInClaudeCode: "Продолжить в Claude Code",
		resume: "Продолжить",
		close: "Закрыть",
		copyResumeCommand: "Копировать команду продолжения",
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
			help: "Справка",
			feedback: "Обратная связь",
			about: "О программе",
			language: "Язык",
			api: "Настройки API",
			mcp: "Настройки MCP",
			skills: "Навыки",
			plugins: "Плагины",
			memory: "Память",
			agents: "Агенты",
			hooks: "Хуки",
			permissions: "Разрешения",
			output: "Стили вывода",
			recovery: "Восстановление сессии",
		},
		placeholder: {
			title: "Настройки",
			description: "Выберите пункт меню слева для настройки",
		},
	},

	// Settings Sections
	help: {
		title: "Справка",
		quickStart: {
			title: "Быстрый старт",
			description: "Узнайте, как использовать AICowork для выполнения первой задачи",
		},
		faq: {
			title: "Часто задаваемые вопросы",
			description: "Просмотрите часто задаваемые вопросы и решения",
		},
		docs: {
			title: "Документация",
			description: "Посетите официальную документацию для получения дополнительной информации",
		},
	},

	feedback: {
		title: "Обратная связь",
		bugReport: {
			title: "Отчёт об ошибке",
			description: "Отправьте отчёт о проблеме на GitHub",
		},
		featureRequest: {
			title: "Предложение функции",
			description: "Предложите новые функции, которые вы хотели бы видеть",
		},
	},

	about: {
		title: "О AICowork",
		version: {
			title: "Версия",
			description: "Версия 1.0.0",
		},
		techStack: {
			title: "Технологический стек",
			description: "Electron + React + TypeScript + Claude Agent SDK",
		},
		license: {
			title: "Лицензия",
			description: "AGCPA v3.0",
		},
	},

	language: {
		title: "Язык",
		current: "Текущий язык",
		switching: "Переключение...",
		hint: "Настройки языка сохраняются локально и будут автоматически применены при следующем запуске приложения.",
	},

	api: {
		title: "Настройки API",
		description: "Настройте ключ API Anthropic и модель",
		viewList: "Просмотреть список конфигураций",
		addConfig: "Добавить конфигурацию",
		configName: {
			label: "Название конфигурации",
			placeholder: "Моя конфигурация",
			test: "Тестовая конфигурация",
		},
		baseUrl: {
			label: "Базовый URL",
			placeholder: "https://api.anthropic.com",
		},
		apiKey: {
			label: "Ключ API",
			placeholder: "sk-ant-...",
		},
		apiType: {
			label: "Тип API",
			anthropic: "Anthropic",
			openai: "Совместимый с OpenAI",
		},
		model: {
			label: "Название модели",
			placeholder: "Введите название модели",
			refresh: "Обновить список моделей",
		},
		advanced: {
			label: "Дополнительные параметры (необязательно)",
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
			edit: "Изменить конфигурацию",
			delete: "Удалить конфигурацию",
		},
		responseTime: "Время отклика: {{time}}мс",
		testFailed: "Проверка не удалась",
		noConfigs: "Нет сохранённых конфигураций",
		hint: "Настройте ключ API для начала работы. Поддерживается несколько конфигураций для быстрого переключения.",
		docsLink: "Документация",
	},

	mcp: {
		title: "Настройки MCP",
		description: "Настройте серверы Model Context Protocol",
		noServers: "Нет конфигураций серверов MCP",
		addServer: "Добавить сервер MCP",
		templates: {
			title: "Добавить из шаблона",
		},
		form: {
			name: {
				label: "Название сервера",
				placeholder: "github",
			},
			displayName: {
				label: "Отображаемое название (необязательно)",
				placeholder: "GitHub MCP",
			},
			type: {
				label: "Тип сервера",
				stdio: "STDIO",
				sse: "SSE",
			},
			command: {
				label: "Команда",
				placeholder: "npx",
			},
			args: {
				label: "Аргументы (разделённые пробелом)",
				placeholder: "@modelcontextprotocol/server-github",
			},
			description: {
				label: "Описание (необязательно)",
				placeholder: "Описание функциональности сервера",
			},
		},
		view: {
			type: "Тип",
			command: "Команда",
			args: "Аргументы",
			description: "Описание",
		},
		actions: {
			save: "Сохранить",
			saving: "Сохранение...",
			edit: "Изменить",
			delete: "Удалить",
		},
		errors: {
			deleteFailed: "Не удалось удалить",
			nameRequired: "Название сервера не может быть пустым",
			saveFailed: "Не удалось сохранить",
		},
		hint: "Конфигурации серверов MCP хранятся в ~/.claude/settings.json.",
	},

	skills: {
		title: "Навыки",
		description: "Управление пользовательскими навыками, ИИ будет автоматически выполнять их на основе инструкций в SKILL.md",
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
	},

	memory: {
		title: "Память",
		description: "Зарезервировано для функциональности проекта memvid",
		comingSoon: "Скоро: Память позволит ИИ делиться информацией между сессиями для более непрерывных разговоров.",
	},

	agents: {
		title: "Агенты",
		description: "Настройка параметров субагентов",
		subAgents: "Субагенты: Может запускать до 10 субагентов параллельно для повышения эффективности сложных задач.",
	},

	hooks: {
		title: "Хуки",
		postToolUse: {
			title: "Запускается после использования инструмента",
			noConfig: "Нет конфигурации",
		},
		preToolUse: {
			title: "Запускается перед использованием инструмента",
			noConfig: "Нет конфигурации",
		},
		hint: "Конфигурации хуков хранятся в ~/.claude/settings.json.",
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
			description: "Настройка конкретных правил разрешений",
			noConfig: "Нет пользовательских правил",
		},
		securityHint: "Совет по безопасности: Выдавайте разрешения на инструменты осторожно, особенно для Bash и файловых операций.",
	},

	output: {
		title: "Стили вывода",
		description: "Конфигурация стиля вывода находится в разработке...",
		comingSoon: "Скоро: Настраиваемый формат вывода, тема подсветки кода, параметры рендеринга Markdown и т.д.",
	},

	recovery: {
		title: "Восстановление сессии",
		description: "Возобновите предыдущие сессии для продолжения разговоров",
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
		hint: "Данные сессии хранятся в локальной базе данных. Возобновление сессии загрузит полную историю разговора.",
	},

	// Settings Modal (legacy)
	settings: {
		title: "Конфигурация API",
		description: "Поддерживает официальное API Anthropic, а также сторонние API, совместимые с форматом Anthropic.",
		baseUrl: "Базовый URL",
		apiKey: "Ключ API",
		modelName: "Название модели",
		cancel: "Отмена",
		save: "Сохранить",
		saving: "Сохранение...",
		saved: "Конфигурация успешно сохранена!",
	},

	// Validation errors
	errors: {
		apiKeyRequired: "Ключ API обязателен",
		baseUrlRequired: "Базовый URL обязателен",
		modelRequired: "Название модели обязательно",
		invalidBaseUrl: "Неверный формат базового URL",
		failedToLoadConfig: "Не удалось загрузить конфигурацию",
		failedToSaveConfig: "Не удалось сохранить конфигурацию",
		sessionStillRunning: "Сессия всё ещё выполняется. Пожалуйста, подождите её завершения.",
		workingDirectoryRequired: "Для запуска сессии требуется рабочий каталог.",
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
		promptPlaceholder: "Опишите задачу, которую должен выполнить агент...",
		startButton: "Запустить сессию",
		starting: "Запуск...",
	},

	// Prompt Input
	promptInput: {
		placeholderDisabled: "Создайте/выберите задачу для начала...",
		placeholder: "Опишите, что должен сделать агент...",
		stopSession: "Остановить сессию",
		sendPrompt: "Отправить запрос",
	},

	// Common
	common: {
		close: "Закрыть",
		cancel: "Отмена",
		save: "Сохранить",
		delete: "Удалить",
		loading: "Загрузка...",
		edit: "Изменить",
		add: "Добавить",
		refresh: "Обновить",
		back: "Назад",
	},

	// App
	app: {
		noMessagesYet: "Пока нет сообщений",
		startConversation: "Начать разговор с AICowork",
		beginningOfConversation: "Начало разговора",
		loadingMessages: "Загрузка...",
		newMessages: "Новые сообщения",
	},

	// Deletion Confirmation
	deletion: {
		title: "⚠️ Подтверждение удаления",
		subtitle: "ИИ собирается выполнить операцию удаления",
		description: "ИИ пытается выполнить операцию удаления. Эта операция может безвозвратно удалить файлы или каталоги. Пожалуйста, тщательно проверьте содержимое команды.",
		commandLabel: "Команда для выполнения:",
		unknownCommand: "Неизвестная команда",
		warning: "Предупреждение: Операции удаления невозможно отменить. Убедитесь, что вы понимаете последствия этой команды.",
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
		thinking: "Думает",
		sessionId: "ID сессии",
		modelName: "Название модели",
		permissionMode: "Режим разрешений",
		workingDirectory: "Рабочий каталог",
	},
};
