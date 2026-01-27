/**
 * Traduccin al español
 */

export default {
	// Language names
	languageNames: {
		en: "English",
		"zh-TW": "Chino Tradicional",
		zh: "Chino Simplificado",
		ja: "Japons",
		ko: "Coreano",
		es: "Espaol",
		fr: "Francs",
		de: "Alemn",
		ru: "Ruso",
		pt: "Portugus",
	},

	// Sidebar
	sidebar: {
		newTask: "+ Nueva Tarea",
		settings: "Configuracin",
		noSessions: "An no hay sesiones. Haga clic en \"+ Nueva Tarea\" para comenzar.",
		deleteSession: "Eliminar esta sesin",
		resumeInClaudeCode: "Continuar en Claude Code",
		resume: "Continuar",
		close: "Cerrar",
		copyResumeCommand: "Copiar comando de continuacin",
		workingDirUnavailable: "Directorio de trabajo no disponible",
	},

	// Settings Page
	settingsPage: {
		title: "Configuracin",
		back: "Atrs",
		sections: {
			general: "General",
			api: "Configuracin API",
			features: "Caractersticas",
			system: "Sistema",
		},
		navigation: {
			feedback: "Comentarios",
			about: "Acerca de",
			language: "Idioma",
			api: "Configuracin API",
			mcp: "Configuracin MCP",
			permissions: "Permisos",
			output: "Estilos de Salida",
			rules: "Reglas",
			claudeMd: "Claude.md",
		},
		placeholder: {
			title: "Configuracin",
			description: "Seleccione un elemento del men a la izquierda para configurar",
		},
	},

	// Settings Sections
	help: {
		title: "Ayuda",
		subtitle: "Obtenga ayuda y documentacin",
		quickStart: {
			title: "Inicio Rpido",
			description: "Aprenda a usar AICowork para comenzar su primera tarea",
		},
		faq: {
			title: "Preguntas Frecuentes",
			description: "Vea preguntas frecuentes y soluciones",
		},
		docs: {
			title: "Documentacin",
			description: "Visite la documentacin oficial para ms informacin",
		},
		tip: "Sugerencia: Revise las preguntas frecuentes primero si encuentra problemas, o contctenos a travs de los canales de comentarios.",
		helpUrl: "https://ima.qq.com/note/share/_AwZPbuK9wucK5gWaVdjNQ?channel=4",
	},

	feedback: {
		title: "Comentarios",
		subtitle: "Enve problemas y sugerencias para ayudarnos a mejorar",
		bugReport: {
			title: "Reporte de Error",
			description: "Enve reportes de problemas en GitHub",
			link: "Ir a GitHub",
			url: "https://github.com/BrainPicker-L/AICowork",
		},
		thankYou: "Gracias por sus comentarios! Revisaremos cuidadosamente cada comentario.",
	},

	about: {
		title: "Acerca de AICowork",
		subtitle: "Mesa de Trabajo de Colaboracin AI - AICowork!",
		version: {
			title: "Versin",
			description: "Versin 1.0.0",
		},
		techStack: {
			title: "Stack Tecnolgico",
			description: "Electron + React + TypeScript + AI Agent SDK",
			electron: "• Electron - Framework de aplicaciones de escritorio multiplataforma",
			react: "• React + TypeScript - Framework frontend",
			tailwind: "• Tailwind CSS - Framework de estilos",
			claude: "• AI Agent SDK - Integracin AI",
		},
		license: {
			title: "Licencia",
			description: "GNU Affero General Public License v3.0 (AGPL-3.0)",
		},
		tagline: "AICowork hace que la AI sea su socio de trabajo colaborativo.",
	},

	language: {
		title: "Idioma",
		description: "Seleccione el idioma de visualizacin de la interfaz",
		current: "Idioma Actual",
		switching: "Cambiando...",
		hint: "La configuracin de idioma se guarda localmente y se aplicar automticamente la prxima vez que inicie la aplicacin.",
		tip: {
			label: "Sugerencia",
			text: "La configuracin de idioma se guarda localmente y se aplicar automticamente la prxima vez que inicie la aplicacin.",
		},
	},

	api: {
		title: "Configuracin API",
		description: "Configure la clave API de Anthropic y el modelo",
		viewList: "Ver Lista de Configuraciones",
		addConfig: "Agregar Configuracin",
		configName: {
			label: "Nombre de Configuracin",
			placeholder: "Mi Configuracin",
			test: "Probar Configuracin",
		},
		baseUrl: {
			label: "URL Base",
			placeholder: "https://api.anthropic.com",
		},
		apiKey: {
			label: "Clave API",
			placeholder: "sk-ant-...",
		},
		apiType: {
			label: "Tipo de API",
			anthropic: "Anthropic",
			openai: "Compatible con OpenAI",
		},
		model: {
			label: "Nombre del Modelo",
			placeholder: "Ingrese el nombre del modelo",
			refresh: "Actualizar Lista de Modelos",
		},
		advanced: {
			label: "Parmetros Avanzados (Opcional)",
			maxTokens: {
				label: "Tokens Mximos",
				placeholder: "Predeterminado",
			},
			temperature: {
				label: "Temperatura",
				placeholder: "Predeterminado",
			},
			topP: {
				label: "Top P",
				placeholder: "Predeterminado",
			},
		},
		actions: {
			test: "Probar Conexin",
			testing: "Probando...",
			save: "Guardar Configuracin",
			saving: "Guardando...",
			setActive: "Establecer como Activa",
			edit: "Editar Configuracin",
			delete: "Eliminar Configuracin",
		},
		responseTime: "Tiempo de respuesta: {{time}}ms",
		testFailed: "Prueba Fallida",
		noConfigs: "No hay configuraciones guardadas",
		hint: "Configure la clave API para comenzar. Se admiten mltiples configuraciones para cambiar rpidamente.",
		hintLabel: "Sugerencia: ",
		docsLink: "Documentacin",
		learnMore: "Ms informacin.",
		saveSuccess: "Guardado exitosamente",
		current: "Actual",
		confirmDelete: "Est seguro de que desea eliminar esta configuracin?",
		modelLimits: "Lmites del modelo: max_tokens  [{{min}}, {{max}}]",
		azure: {
			resourceName: "Nombre del Recurso Azure",
			deploymentName: "Nombre del Despliegue Azure",
			resourceNameRequired: "El nombre del recurso Azure no puede estar vaco",
			deploymentNameRequired: "El nombre del despliegue Azure no puede estar vaco",
			bothRequired: "Azure requiere tanto el nombre del recurso como el nombre del despliegue",
		},
	},

	mcp: {
		title: "Configuracin MCP",
		description: "Configure servidores Model Context Protocol, el SDK se iniciar automticamente y registrar herramientas",
		noServers: "No hay configuraciones de servidor MCP",
		addServer: "+ Agregar Servidor",
		templates: {
			title: "Agregar desde Plantilla",
		},
		form: {
			name: {
				label: "Nombre del Servidor",
				placeholder: "my-mcp-server",
			},
			displayName: {
				label: "Nombre para Mostrar (Opcional)",
				placeholder: "Mi Servidor MCP",
			},
			type: {
				label: "Tipo de Servidor",
				stdio: "stdio (Entrada/Salida Estndar)",
				sse: "SSE (Eventos Enviados por el Servidor)",
				streamableHttp: "HTTP Transmitible",
			},
			command: {
				label: "Comando",
				placeholder: "npx",
			},
			args: {
				label: "Argumentos (separados por espacios)",
				placeholder: "@modelcontextprotocol/server-github",
			},
			url: {
				label: "URL",
				placeholder: "https://example.com/mcp",
			},
			description: {
				label: "Descripcin (Opcional)",
				placeholder: "Descripcin de funcionalidad del servidor",
			},
			addTitle: "Agregar Servidor MCP",
			editTitle: "Editar Servidor MCP",
		},
		view: {
			type: "Tipo",
			command: "Comando",
			args: "Argumentos",
			url: "URL",
			description: "Descripcin",
		},
		actions: {
			save: "Guardar",
			saving: "Guardando...",
			edit: "Editar",
			delete: "Eliminar",
			cancel: "Cancelar",
		},
		errors: {
			deleteFailed: "Eliminacin Fallida",
			nameRequired: "El nombre del servidor no puede estar vaco",
			saveFailed: "Guardado Fallido",
			invalidNameFormat: "El nombre del servidor solo puede contener letras, nmeros, guiones bajos y guiones",
			commandRequired: "Los servidores de tipo stdio deben especificar un comando",
			urlRequired: "Este tipo de servidor debe especificar una URL",
			invalidUrl: "Formato de URL invlido",
			saveSuccess: "Guardado exitosamente",
		},
		confirmDelete: "Est seguro de que desea eliminar el servidor MCP \"{{name}}\"?",
		hint: "Sugerencia: Las configuraciones del servidor MCP se almacenan en ~/.claude/settings.json. El SDK iniciar automticamente los servidores MCP configurados y registrar herramientas en la sesin.",
		hintPath: "~/.claude/settings.json",
	},

	skills: {
		title: "Habilidades",
		description: "Administre habilidades personalizadas, la IA ejecutar automticamente basndose en las instrucciones de SKILL.md",
		loading: "Cargando...",
		noSkills: "No hay Habilidades instaladas",
		noSkillsHint: "Coloque Habilidades en el directorio ~/.claude/skills/ para deteccin automtica",
		openDirectory: "Abrir Directorio de Habilidades",
		source: {
			skill: "Habilidad",
			plugin: "Plugin",
		},
		hint: "Las Habilidades se almacenan en el directorio ~/.claude/skills/. Cada carpeta de habilidad contiene un archivo SKILL.md, la IA ejecutar automticamente basndose en el contenido.",
	},

	plugins: {
		title: "Plugins",
		description: "Administre plugins instalados",
		noPlugins: "No hay plugins instalados",
		status: {
			installed: "Instalado",
		},
		hint: "El formato del comando de plugin es /nombre-plugin:nombre-comando.",
	},	hooks: {
		title: "Ganchos",
		description: "Configure ganchos de eventos para activar automticamente acciones en momentos especficos",
		postToolUse: {
			title: "PostToolUse",
			description: "Activado despus del uso de herramienta",
			noConfig: "Sin configuracin",
		},
		preToolUse: {
			title: "PreToolUse",
			description: "Activado antes del uso de herramienta",
			noConfig: "Sin configuracin",
		},
		addHook: "+ Agregar Gancho",
		hint: "Sugerencia: La configuracin de Hooks se almacena en",
		hintPath: "~/.claude/settings.json",
		hintSuffix: ". El SDK cargar y ejecutar automticamente los ganchos configurados.",
	},

	permissions: {
		title: "Permisos",
		allowedTools: {
			title: "Herramientas Permitidas",
			description: "Se pueden usar sin confirmacin del usuario",
			noConfig: "Sin configuracin",
		},
		customRules: {
			title: "Reglas Personalizadas",
			description: "Configure reglas de permiso especficas",
			noConfig: "Sin reglas personalizadas",
		},
		securityHint: "Sugerencia de Seguridad: Conceda permisos de herramientas cuidadosamente, especialmente para Bash y operaciones de archivos.",
	},

	output: {
		title: "Estilos de Salida",
		subtitle: "Configure estilos y formatos de salida de la IA",
		description: "La funcin de configuracin de estilo de salida est en desarrollo...",
		comingSoon: "Prximamente: Formato de salida configurable, tema de resaltado de cdigo, opciones de renderizado Markdown, etc.",
	},

	recovery: {
		title: "Recuperacin de Sesin",
		subtitle: "Vea y reanude sesiones anteriores",
		description: "Reanude sesiones anteriores para continuar conversaciones",
		loading: "Cargando...",
		refresh: "Actualizar Lista",
		example1: {
			title: "Crear Nueva Aplicacin Web",
			sessionId: "ID de Sesin: abc123def456",
			updated: "Actualizado: hace 2 horas",
		},
		example2: {
			title: "Solucionar Problema de Integracin API",
			sessionId: "ID de Sesin: ghi789jkl012",
			updated: "Actualizado: hace 1 da",
		},
		recover: "Reanudar",
		hint: "Los datos de sesin se almacenan en la base de datos local. Reanudar una sesin cargar el historial completo de conversaciones.",
		hintWithCommand: "Tambin puede usar la lnea de comandos:",
	},

	rules: {
		title: "Reglas",
		subtitle: "Administre archivos de reglas del proyecto (.claude/rules/)",
		description: "Cree y administre archivos de reglas personalizadas en el directorio .claude/rules/ de su proyecto",
		noRules: "An no hay archivos de reglas",
		createFromTemplate: "Crear desde Plantilla",
		createNew: "Crear Nueva Regla",
		editor: {
			nameLabel: "Nombre de Regla",
			namePlaceholder: "ej: coding-style",
			contentLabel: "Contenido de Regla (Markdown)",
			contentPlaceholder: "Ingrese el contenido de la regla...",
			save: "Guardar Regla",
			saving: "Guardando...",
			cancel: "Cancelar",
		},
		templates: {
			title: "Seleccionar Plantilla",
			language: {
				name: "Reglas de Lenguaje",
				description: "Especifique el lenguaje de programacin y estndares de codificacin",
			},
			codingStyle: {
				name: "Estilo de Codificacin",
				description: "Defina guas de formato y estilo de cdigo",
			},
			gitCommit: {
				name: "Git Commit",
				description: "Configure el formato y estndares de mensajes de commit de Git",
			},
		},
		confirmDelete: "Est seguro de que desea eliminar la regla \"{{name}}\"?",
		deleted: "Regla eliminada",
		saved: "Regla guardada",
		hint: "Los archivos de reglas se almacenan en el directorio .claude/rules/ del proyecto. Cada regla es un archivo con formato Markdown, la IA ejecutar tareas de acuerdo con el contenido de la regla.",
	},

	claudeMd: {
		title: "Claude.md",
		subtitle: "Administre configuracin Claude del proyecto (CLAUDE.md)",
		description: "Configure guas AI a nivel de proyecto en CLAUDE.md en la raz del proyecto",
		status: {
			exists: "El archivo de configuracin existe",
			missing: "El archivo de configuracin no existe",
			charCount: "{{count}} caracteres",
			lastModified: "ltima modificacin: {{date}}",
		},
		actions: {
			view: "Ver Configuracin Actual",
			edit: "Editar Configuracin",
			save: "Guardar Configuracin",
			saving: "Guardando...",
			delete: "Eliminar Configuracin",
			createFromTemplate: "Crear desde Plantilla",
			openDirectory: "Abrir Directorio",
		},
		templates: {
			title: "Seleccionar Plantilla",
			basic: {
				name: "Configuracin Bsica",
				description: "Plantilla simple con informacin bsica del proyecto",
			},
			frontend: {
				name: "Proyecto Frontend",
				description: "Para proyectos frontend como React/Vue/Next.js",
			},
			backend: {
				name: "Proyecto Backend",
				description: "Para proyectos backend como Node.js/Python/FastAPI",
			},
		},
		editor: {
			label: "Contenido de Claude.md",
			placeholder: "Ingrese el contenido de configuracin del proyecto aqu...",
			save: "Guardar Configuracin",
			cancel: "Cancelar",
		},
		confirmDelete: "Est seguro de que desea eliminar el archivo de configuracin CLAUDE.md?",
		deleted: "Configuracin eliminada",
		saved: "Configuracin guardada",
		hint: "El archivo CLAUDE.md se encuentra en la raz del proyecto y define guas de comportamiento AI a nivel de proyecto. Este archivo anula la configuracin global.",
	},

	// Settings Modal (legacy)
	settings: {
		title: "Configuracin de API",
		description: "Compatible con la API oficial de Anthropic y con APIs de terceros compatibles con el formato Anthropic.",
		baseUrl: "URL Base",
		apiKey: "Clave API",
		modelName: "Nombre del Modelo",
		cancel: "Cancelar",
		save: "Guardar",
		saving: "Guardando...",
		saved: "Configuracin guardada exitosamente!",
	},

	// Validation errors
	errors: {
		apiKeyRequired: "La clave API es obligatoria",
		baseUrlRequired: "La URL Base es obligatoria",
		modelRequired: "El modelo es obligatorio",
		invalidBaseUrl: "Formato de URL Base invlido",
		failedToLoadConfig: "Error al cargar la configuracin",
		failedToSaveConfig: "Error al guardar la configuracin",
		sessionStillRunning: "La sesin an se est ejecutando. Por favor espere a que termine.",
		workingDirectoryRequired: "Se requiere un Directorio de Trabajo para iniciar una sesin.",
		failedToGetSessionTitle: "Error al obtener el ttulo de la sesin.",
	},

	// Start Session Modal
	startSession: {
		title: "Iniciar Sesin",
		description: "Cree una nueva sesin para comenzar a interactuar con el agente.",
		workingDirectory: "Directorio de Trabajo",
		browse: "Explorar...",
		recent: "Reciente",
		prompt: "Prompt",
		promptPlaceholder: "Describa la tarea que desea que el agente maneje...",
		startButton: "Iniciar Sesin",
		starting: "Iniciando...",
	},

	// Prompt Input
	promptInput: {
		placeholderDisabled: "Cree/seleccione una tarea para comenzar...",
		placeholder: "Describa lo que desea que el agente maneje...",
		stopSession: "Detener sesin",
		sendPrompt: "Enviar prompt",
		selectWorkingDir: "Seleccionar directorio de trabajo",
	},

	// Common
	common: {
		close: "Cerrar",
		cancel: "Cancelar",
		save: "Guardar",
		delete: "Eliminar",
		loading: "Cargando...",
		edit: "Editar",
		add: "Agregar",
		refresh: "Actualizar",
		back: "Atrs",
	},

	// App
	app: {
		noMessagesYet: "An no hay mensajes",
		startConversation: "Iniciar una conversacin con AICowork",
		beginningOfConversation: "Inicio de la conversacin",
		loadingMessages: "Cargando...",
		newMessages: "Nuevos mensajes",
	},

	// Deletion Confirmation
	deletion: {
		title: " Confirmacin de Eliminacin",
		subtitle: "La IA est a punto de realizar una operacin de eliminacin",
		description: "La IA est intentando ejecutar una operacin de eliminacin. Esta operacin puede eliminar archivos o directorios permanentemente. Por favor verifique cuidadosamente el contenido del comando.",
		commandLabel: "Comando a ejecutar:",
		unknownCommand: "Comando desconocido",
		warning: "Advertencia: Las operaciones de eliminacin no se pueden deshacer. Asegrese de entender las consecuencias de este comando.",
		allow: "Permitir Ejecucin",
		deny: "Denegar Operacin",
		deniedMessage: "El usuario deneg la operacin de eliminacin",
	},

	// Event Card
	events: {
		sessionResult: "Resultado de la Sesin",
		duration: "Duracin",
		usage: "Uso",
		cost: "Costo",
		input: "Entrada",
		output: "Salida",
		collapse: "Contraer",
		showMoreLines: "Mostrar {{count}} lneas ms",
		systemInit: "Inicializacin del Sistema",
		user: "Usuario",
		assistant: "Asistente",
		thinking: "Pensando",
		sessionId: "ID de Sesin",
		modelName: "Nombre del Modelo",
		permissionMode: "Modo de Permiso",
		workingDirectory: "Directorio de Trabajo",
	},
};
