/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @updated     2026-01-21
 * @Email       None
 *
 * Traducción al español
 */

export default {
	// Language names
	languageNames: {
		en: "English",
		zh: "Chino Simplificado",
		"zh-TW": "Chino Tradicional",
		ja: "Japonés",
		ko: "Coreano",
		es: "Español",
		fr: "Francés",
		de: "Alemán",
		ru: "Ruso",
		pt: "Portugués",
	},

	// Sidebar
	sidebar: {
		newTask: "+ Nueva Tarea",
		settings: "Configuración",
		noSessions: "Aún no hay sesiones. Haga clic en \"+ Nueva Tarea\" para comenzar.",
		deleteSession: "Eliminar esta sesión",
		resumeInClaudeCode: "Continuar en Claude Code",
		resume: "Continuar",
		close: "Cerrar",
		copyResumeCommand: "Copiar comando de continuación",
		workingDirUnavailable: "Directorio de trabajo no disponible",
	},

	// Settings Page
	settingsPage: {
		title: "Configuración",
		back: "Atrás",
		sections: {
			general: "General",
			api: "Configuración API",
			features: "Características",
			system: "Sistema",
		},
		navigation: {
			help: "Ayuda",
			feedback: "Comentarios",
			about: "Acerca de",
			language: "Idioma",
			api: "Configuración API",
			mcp: "Configuración MCP",
			skills: "Habilidades",
			plugins: "Plugins",
			memory: "Memoria",
			agents: "Agentes",
			hooks: "Ganchos",
			permissions: "Permisos",
			output: "Estilos de Salida",
			recovery: "Recuperación de Sesión",
		},
		placeholder: {
			title: "Configuración",
			description: "Seleccione un elemento del menú a la izquierda para configurar",
		},
	},

	// Settings Sections
	help: {
		title: "Ayuda",
		quickStart: {
			title: "Inicio Rápido",
			description: "Aprenda a usar AICowork para comenzar su primera tarea",
		},
		faq: {
			title: "Preguntas Frecuentes",
			description: "Vea preguntas frecuentes y soluciones",
		},
		docs: {
			title: "Documentación",
			description: "Visite la documentación oficial para más información",
		},
	},

	feedback: {
		title: "Comentarios",
		bugReport: {
			title: "Reporte de Error",
			description: "Envíe reportes de problemas en GitHub",
		},
		featureRequest: {
			title: "Solicitud de Característica",
			description: "Sugiera nuevas características que le gustaría ver",
		},
	},

	about: {
		title: "Acerca de AICowork",
		version: {
			title: "Versión",
			description: "Versión 1.0.0",
		},
		techStack: {
			title: "Stack Tecnológico",
			description: "Electron + React + TypeScript + Claude Agent SDK",
		},
		license: {
			title: "Licencia",
			description: "AGCPA v3.0",
		},
	},

	language: {
		title: "Idioma",
		current: "Idioma Actual",
		switching: "Cambiando...",
		hint: "La configuración de idioma se guarda localmente y se aplicará automáticamente la próxima vez que inicie la aplicación.",
	},

	api: {
		title: "Configuración API",
		description: "Configure la clave API de Anthropic y el modelo",
		viewList: "Ver Lista de Configuraciones",
		addConfig: "Agregar Configuración",
		configName: {
			label: "Nombre de Configuración",
			placeholder: "Mi Configuración",
			test: "Probar Configuración",
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
			label: "Parámetros Avanzados (Opcional)",
			maxTokens: {
				label: "Tokens Máximos",
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
			test: "Probar Conexión",
			testing: "Probando...",
			save: "Guardar Configuración",
			saving: "Guardando...",
			setActive: "Establecer como Activa",
			edit: "Editar Configuración",
			delete: "Eliminar Configuración",
		},
		responseTime: "Tiempo de respuesta: {{time}}ms",
		testFailed: "Prueba Fallida",
		noConfigs: "No hay configuraciones guardadas",
		hint: "Configure la clave API para comenzar. Se admiten múltiples configuraciones para cambiar rápidamente.",
		docsLink: "Documentación",
	},

	mcp: {
		title: "Configuración MCP",
		description: "Configure servidores Model Context Protocol",
		noServers: "No hay configuraciones de servidor MCP",
		addServer: "Agregar Servidor MCP",
		templates: {
			title: "Agregar desde Plantilla",
		},
		form: {
			name: {
				label: "Nombre del Servidor",
				placeholder: "github",
			},
			displayName: {
				label: "Nombre para Mostrar (Opcional)",
				placeholder: "GitHub MCP",
			},
			type: {
				label: "Tipo de Servidor",
				stdio: "STDIO",
				sse: "SSE",
			},
			command: {
				label: "Comando",
				placeholder: "npx",
			},
			args: {
				label: "Argumentos (separados por espacios)",
				placeholder: "@modelcontextprotocol/server-github",
			},
			description: {
				label: "Descripción (Opcional)",
				placeholder: "Descripción de funcionalidad del servidor",
			},
		},
		view: {
			type: "Tipo",
			command: "Comando",
			args: "Argumentos",
			description: "Descripción",
		},
		actions: {
			save: "Guardar",
			saving: "Guardando...",
			edit: "Editar",
			delete: "Eliminar",
		},
		errors: {
			deleteFailed: "Eliminación Fallida",
			nameRequired: "El nombre del servidor no puede estar vacío",
			saveFailed: "Guardado Fallido",
		},
		hint: "Las configuraciones del servidor MCP se almacenan en ~/.claude/settings.json.",
	},

	skills: {
		title: "Habilidades",
		description: "Administre habilidades personalizadas, la IA ejecutará automáticamente basándose en las instrucciones de SKILL.md",
		loading: "Cargando...",
		noSkills: "No hay Habilidades instaladas",
		noSkillsHint: "Coloque Habilidades en el directorio ~/.claude/skills/ para detección automática",
		openDirectory: "Abrir Directorio de Habilidades",
		source: {
			skill: "Habilidad",
			plugin: "Plugin",
		},
		hint: "Las Habilidades se almacenan en el directorio ~/.claude/skills/. Cada carpeta de habilidad contiene un archivo SKILL.md, la IA ejecutará automáticamente basándose en el contenido.",
	},

	plugins: {
		title: "Plugins",
		description: "Administre plugins instalados",
		noPlugins: "No hay plugins instalados",
		status: {
			installed: "Instalado",
		},
		hint: "El formato del comando de plugin es /nombre-plugin:nombre-comando.",
	},

	memory: {
		title: "Memoria",
		description: "Reservado para la funcionalidad del proyecto memvid",
		comingSoon: "Próximamente: Memoria permitirá a la IA compartir información entre sesiones para conversaciones más coherentes.",
	},

	agents: {
		title: "Agentes",
		description: "Configure la configuración de sub-agentes",
		subAgents: "SubAgentes: Puede iniciar hasta 10 sub-agentes en paralelo para mejorar la eficiencia en tareas complejas.",
	},

	hooks: {
		title: "Ganchos",
		postToolUse: {
			title: "Activado Después del Uso de Herramienta",
			noConfig: "Sin configuración",
		},
		preToolUse: {
			title: "Activado Antes del Uso de Herramienta",
			noConfig: "Sin configuración",
		},
		hint: "Las configuraciones de Hooks se almacenan en ~/.claude/settings.json.",
	},

	permissions: {
		title: "Permisos",
		allowedTools: {
			title: "Herramientas Permitidas",
			description: "Se pueden usar sin confirmación del usuario",
			noConfig: "Sin configuración",
		},
		customRules: {
			title: "Reglas Personalizadas",
			description: "Configure reglas de permiso específicas",
			noConfig: "Sin reglas personalizadas",
		},
		securityHint: "Consejo de Seguridad: Conceda permisos de herramientas cuidadosamente, especialmente para Bash y operaciones de archivos.",
	},

	output: {
		title: "Estilos de Salida",
		description: "La configuración de estilo de salida está en desarrollo...",
		comingSoon: "Próximamente: Formato de salida configurable, tema de resaltado de código, opciones de renderizado Markdown, etc.",
	},

	recovery: {
		title: "Recuperación de Sesión",
		description: "Reanude sesiones anteriores para continuar conversaciones",
		example1: {
			title: "Crear Nueva Aplicación Web",
			sessionId: "ID de Sesión: abc123def456",
			updated: "Actualizado: hace 2 horas",
		},
		example2: {
			title: "Solucionar Problema de Integración API",
			sessionId: "ID de Sesión: ghi789jkl012",
			updated: "Actualizado: hace 1 día",
		},
		hint: "Los datos de sesión se almacenan en la base de datos local. Reanudar una sesión cargará el historial completo de conversaciones.",
	},

	// Settings Modal (legacy)
	settings: {
		title: "Configuración de API",
		description: "Compatible con la API oficial de Anthropic y con APIs de terceros compatibles con el formato Anthropic.",
		baseUrl: "URL Base",
		apiKey: "Clave API",
		modelName: "Nombre del Modelo",
		cancel: "Cancelar",
		save: "Guardar",
		saving: "Guardando...",
		saved: "¡Configuración guardada exitosamente!",
	},

	// Validation errors
	errors: {
		apiKeyRequired: "La clave API es obligatoria",
		baseUrlRequired: "La URL Base es obligatoria",
		modelRequired: "El modelo es obligatorio",
		invalidBaseUrl: "Formato de URL Base inválido",
		failedToLoadConfig: "Error al cargar la configuración",
		failedToSaveConfig: "Error al guardar la configuración",
		sessionStillRunning: "La sesión aún se está ejecutando. Por favor espere a que termine.",
		workingDirectoryRequired: "Se requiere un Directorio de Trabajo para iniciar una sesión.",
		failedToGetSessionTitle: "Error al obtener el título de la sesión.",
	},

	// Start Session Modal
	startSession: {
		title: "Iniciar Sesión",
		description: "Cree una nueva sesión para comenzar a interactuar con el agente.",
		workingDirectory: "Directorio de Trabajo",
		browse: "Explorar...",
		recent: "Reciente",
		prompt: "Prompt",
		promptPlaceholder: "Describa la tarea que desea que el agente maneje...",
		startButton: "Iniciar Sesión",
		starting: "Iniciando...",
	},

	// Prompt Input
	promptInput: {
		placeholderDisabled: "Cree/seleccione una tarea para comenzar...",
		placeholder: "Describa lo que desea que el agente maneje...",
		stopSession: "Detener sesión",
		sendPrompt: "Enviar prompt",
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
		back: "Atrás",
	},

	// App
	app: {
		noMessagesYet: "Aún no hay mensajes",
		startConversation: "Iniciar una conversación con AICowork",
		beginningOfConversation: "Inicio de la conversación",
		loadingMessages: "Cargando...",
		newMessages: "Nuevos mensajes",
	},

	// Deletion Confirmation
	deletion: {
		title: "⚠️ Confirmación de Eliminación",
		subtitle: "La IA está a punto de realizar una operación de eliminación",
		description: "La IA está intentando ejecutar una operación de eliminación. Esta operación puede eliminar archivos o directorios permanentemente. Por favor verifique cuidadosamente el contenido del comando.",
		commandLabel: "Comando a ejecutar:",
		unknownCommand: "Comando desconocido",
		warning: "Advertencia: Las operaciones de eliminación no se pueden deshacer. Asegúrese de entender las consecuencias de este comando.",
		allow: "Permitir Ejecución",
		deny: "Denegar Operación",
		deniedMessage: "El usuario denegó la operación de eliminación",
	},

	// Event Card
	events: {
		sessionResult: "Resultado de la Sesión",
		duration: "Duración",
		usage: "Uso",
		cost: "Costo",
		input: "Entrada",
		output: "Salida",
		collapse: "Contraer",
		showMoreLines: "Mostrar {{count}} líneas más",
		systemInit: "Inicialización del Sistema",
		user: "Usuario",
		assistant: "Asistente",
		thinking: "Pensando",
		sessionId: "ID de Sesión",
		modelName: "Nombre del Modelo",
		permissionMode: "Modo de Permiso",
		workingDirectory: "Directorio de Trabajo",
	},
};
