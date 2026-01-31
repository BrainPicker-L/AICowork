/**
 * Traduo portuguesa
 */

export default {
	// Language names
	languageNames: {
		en: "English",
		"zh-TW": "Chins Tradicional",
		zh: "Chins Simplificado",
		ja: "Japons",
		ko: "Coreano",
		es: "Espanhol",
		fr: "Francs",
		de: "Alemo",
		ru: "Russo",
		pt: "Portugus",
	},

	// Sidebar
	sidebar: {
		newTask: "+ Nova Tarefa",
		settings: "Configuraes",
		noSessions: "Ainda no h sesses. Clique em \"+ Nova Tarefa\" para comear.",
		deleteSession: "Excluir esta sesso",
		resumeInClaudeCode: "Continuar no Claude Code",
		resume: "Continuar",
		close: "Fechar",
		copyResumeCommand: "Copiar comando de continuao",
		workingDirUnavailable: "Diretrio de trabalho indisponvel",
	},

	// Settings Page
	settingsPage: {
		title: "Configuraes",
		back: "Voltar",
		sections: {
			general: "Geral",
			api: "Configurao de API",
			features: "Recursos",
			system: "Sistema",
		},
		navigation: {
			feedback: "Feedback",
			about: "Sobre",
			language: "Idioma",
			api: "Configuraes de API",
			mcp: "Configuraes MCP",
			permissions: "Permisses",
			output: "Estilos de Sada",
			rules: "Regras",
			claudeMd: "Claude.md",
		},
		placeholder: {
			title: "Configuraes",
			description: "Selecione um item do menu  esquerda para configurar",
		},
	},

	// Settings Sections
	help: {
		title: "Ajuda",
		subtitle: "Obter ajuda e documentao",
		quickStart: {
			title: "Incio Rpido",
			description: "Aprenda a usar o AICowork para iniciar sua primeira tarefa",
		},
		faq: {
			title: "Perguntas Frequentes",
			description: "Veja perguntas frequentes e solues",
		},
		docs: {
			title: "Documentao",
			description: "Visite a documentao oficial para mais informaes",
		},
		tip: "Dica: Consulte o FAQ primeiro se encontrar problemas, ou contate-nos pelos canais de feedback.",
		helpUrl: "https://ima.qq.com/note/share/_AwZPbuK9wucK5gWaVdjNQ?channel=4",
	},

	feedback: {
		title: "Feedback",
		subtitle: "Enviar problemas e sugestes para nos ajudar a melhorar",
		bugReport: {
			title: "Relatrio de Bug",
			description: "Envie relatrios de problemas no GitHub",
			link: "Ir para GitHub",
			url: "https://github.com/BrainPicker-L/AICowork",
		},
		thankYou: "Obrigado pelo seu feedback! Revisaremos cuidadosamente cada feedback.",
	},

	about: {
		title: "Sobre o AICowork",
		subtitle: "Espao de Trabalho Colaborativo IA - AICowork!",
		version: {
			title: "Verso",
			description: "Verso 1.0.0",
		},
		techStack: {
			title: "Stack Tecnolgico",
			description: "Electron + React + TypeScript + AI Agent SDK",
			electron: "• Electron - Framework de aplicativo desktop multiplataforma",
			react: "• React + TypeScript - Framework frontend",
			tailwind: "• Tailwind CSS - Framework de estilo",
			claude: "• AI Agent SDK - Integrao IA",
		},
		license: {
			title: "Licena",
			description: "GNU Affero General Public License v3.0 (AGPL-3.0)",
		},
		tagline: "AICowork torna a IA seu parceiro de trabalho colaborativo.",
	},

	language: {
		title: "Idioma",
		description: "Selecionar idioma de exibio da interface",
		current: "Idioma Atual",
		switching: "Alterando...",
		hint: "As configuraes de idioma so salvas localmente e sero aplicadas automaticamente na prxima vez que voc iniciar o aplicativo.",
		tip: {
			label: "Dica",
			text: "As configuraes de idioma so salvas localmente e sero aplicadas automaticamente na prxima vez que voc iniciar o aplicativo.",
		},
	},

	api: {
		title: "Configuraes de API",
		description: "Configure a chave API e modelo da Anthropic",
		viewList: "Ver Lista de Configuraes",
		addConfig: "Adicionar Configurao",
		configName: {
			label: "Nome da Configurao",
			placeholder: "Minha Configurao",
			test: "Testar Configurao",
		},
		baseUrl: {
			label: "URL Base",
			placeholder: "https://api.anthropic.com",
		},
		apiKey: {
			label: "Chave API",
			placeholder: "sk-ant-...",
		},
		apiType: {
			label: "Tipo de API",
			anthropic: "Anthropic",
			openai: "Compatvel com OpenAI",
		},
		model: {
			label: "Nome do Modelo",
			placeholder: "Digite o nome do modelo",
			refresh: "Atualizar Lista de Modelos",
		},
		advanced: {
			label: "Parmetros Avanados (Opcional)",
			maxTokens: {
				label: "Tokens Mximos",
				placeholder: "Padro",
			},
			temperature: {
				label: "Temperatura",
				placeholder: "Padro",
			},
			topP: {
				label: "Top P",
				placeholder: "Padro",
			},
		},
		actions: {
			test: "Testar Conexo",
			testing: "Testando...",
			save: "Salvar Configurao",
			saving: "Salvando...",
			setActive: "Definir como Ativa",
			edit: "Editar Configurao",
			delete: "Excluir Configurao",
		},
		responseTime: "Tempo de resposta: {{time}}ms",
		testFailed: "Teste Falhou",
		noConfigs: "Nenhuma configurao salva",
		hint: "Configure a chave API para comear a usar. Suporta mltiplas configuraes para troca rpida.",
		hintLabel: "Dica: ",
		docsLink: "Documentao",
		learnMore: "Saiba mais.",
		saveSuccess: "Salvo com sucesso",
		current: "Atual",
		confirmDelete: "Tem certeza de que deseja excluir esta configurao?",
		modelLimits: "Limites do modelo: max_tokens  [{{min}}, {{max}}]",
		azure: {
			resourceName: "Nome do Recurso Azure",
			deploymentName: "Nome do Deploy Azure",
			resourceNameRequired: "O nome do recurso Azure no pode estar vazio",
			deploymentNameRequired: "O nome do deploy Azure no pode estar vazio",
			bothRequired: "Azure requer tanto o nome do recurso quanto o nome do deploy",
		},
	},

	mcp: {
		title: "Configuraes MCP",
		description: "Configure servidores Model Context Protocol, o SDK iniciar automaticamente e registrar ferramentas",
		noServers: "Nenhuma configurao de servidor MCP",
		addServer: "+ Adicionar Servidor",
		templates: {
			title: "Adicionar do Modelo",
		},
		form: {
			name: {
				label: "Nome do Servidor",
				placeholder: "my-mcp-server",
			},
			displayName: {
				label: "Nome de Exibio (Opcional)",
				placeholder: "Meu Servidor MCP",
			},
			type: {
				label: "Tipo de Servidor",
				stdio: "stdio (Entrada/Sada Padro)",
				sse: "SSE (Eventos Enviados pelo Servidor)",
				streamableHttp: "HTTP Transmissvel",
			},
			command: {
				label: "Comando",
				placeholder: "npx",
			},
			args: {
				label: "Argumentos (separados por espao)",
				placeholder: "@modelcontextprotocol/server-github",
			},
			url: {
				label: "URL",
				placeholder: "https://example.com/mcp",
			},
			description: {
				label: "Descrio (Opcional)",
				placeholder: "Descrio da funcionalidade do servidor",
			},
			addTitle: "Adicionar Servidor MCP",
			editTitle: "Editar Servidor MCP",
		},
		view: {
			type: "Tipo",
			command: "Comando",
			args: "Argumentos",
			url: "URL",
			description: "Descrio",
		},
		actions: {
			save: "Salvar",
			saving: "Salvando...",
			edit: "Editar",
			delete: "Excluir",
			cancel: "Cancelar",
		},
		errors: {
			deleteFailed: "Falha ao excluir",
			nameRequired: "O nome do servidor não pode estar vazio",
			saveFailed: "Falha ao salvar",
			toggleFailed: "Falha ao alternar status",
			invalidNameFormat: "O nome do servidor só pode conter letras, números, sublinhados e hífens",
			commandRequired: "O servidor tipo stdio deve especificar comando",
			urlRequired: "Este tipo de servidor deve especificar URL",
			invalidUrl: "Formato de URL inválido",
			saveSuccess: "Salvo com sucesso",
		},
		confirmDelete: "Tem certeza de que deseja excluir o servidor MCP \"{{name}}\"?",
		hint: "Dica: As configuraes do servidor MCP so armazenadas em ~/.claude/settings.json. O SDK iniciar automaticamente os servidores MCP configurados e registrar ferramentas na sesso.",
		hintPath: "~/.claude/settings.json",
	},

	skills: {
		title: "Skills",
		description: "Gerencie skills personalizados, a IA executar automaticamente com base nas instrues do SKILL.md",
		loading: "Carregando...",
		noSkills: "Nenhum Skill instalado",
		noSkillsHint: "Coloque Skills no diretrio ~/.claude/skills/ para deteco automtica",
		openDirectory: "Abrir Diretrio de Skills",
		source: {
			skill: "Skill",
			plugin: "Plugin",
		},
		hint: "Os Skills so armazenados no diretrio ~/.claude/skills/. Cada pasta de skill contm um arquivo SKILL.md, a IA executar automaticamente com base no contedo.",
	},

	plugins: {
		title: "Plugins",
		description: "Gerenciar plugins instalados",
		noPlugins: "Nenhum plugin instalado",
		status: {
			installed: "Instalado",
		},
		hint: "O formato do comando de plugin  /plugin-name:command-name.",
	},	hooks: {
		title: "Ganchos",
		description: "Configure ganchos de eventos para acionar automaticamente aes em momentos especficos",
		postToolUse: {
			title: "PostToolUse",
			description: "Acionado aps o uso da ferramenta",
			noConfig: "Nenhuma configurao",
		},
		preToolUse: {
			title: "PreToolUse",
			description: "Acionado antes do uso da ferramenta",
			noConfig: "Nenhuma configurao",
		},
		addHook: "+ Adicionar Gancho",
		hint: "Dica: As configuraes de Hooks so armazenadas em",
		hintPath: "~/.claude/settings.json",
		hintSuffix: ". O SDK carregar e executar automaticamente os ganchos configurados.",
	},

	permissions: {
		title: "Permisses",
		allowedTools: {
			title: "Ferramentas Permitidas",
			description: "Podem ser usadas sem confirmao do usurio",
			noConfig: "Nenhuma configurao",
		},
		customRules: {
			title: "Regras Personalizadas",
			description: "Configure regras de permisso especficas",
			noConfig: "Nenhuma regra personalizada",
		},
		securityHint: "Dica de Segurana: Conceda permisses de ferramenta com cuidado, especialmente para Bash e operaes de arquivo.",
	},

	output: {
		title: "Estilos de Sada",
		subtitle: "Configure estilos e formatos de sada da IA",
		description: "A configurao de estilo de sada est em desenvolvimento...",
		comingSoon: "Em breve: Formato de sada configurvel, tema de destaque de cdigo, opes de renderizao Markdown, etc.",
	},

	recovery: {
		title: "Recuperao de Sesso",
		subtitle: "Ver e retomar sesses anteriores",
		description: "Retome sesses anteriores para continuar conversas",
		loading: "Carregando...",
		refresh: "Atualizar Lista",
		example1: {
			title: "Criar Novo Aplicativo Web",
			sessionId: "ID da Sesso: abc123def456",
			updated: "Atualizado: 2 horas atrs",
		},
		example2: {
			title: "Corrigir Problema de Integrao de API",
			sessionId: "ID da Sesso: ghi789jkl012",
			updated: "Atualizado: 1 dia atrs",
		},
		recover: "Retomar",
		hint: "Os dados da sesso so armazenados no banco de dados local. Retomar uma sesso carregar o histrico completo da conversa.",
		hintWithCommand: "Voc tambm pode usar a linha de comando:",
	},

	rules: {
		title: "Regras",
		subtitle: "Gerenciar arquivos de regras do projeto (.claude/rules/)",
		description: "Crie e gerencie arquivos de regras personalizados no diretrio .claude/rules/ do seu projeto",
		noRules: "Nenhum arquivo de regras ainda",
		createFromTemplate: "Criar do Modelo",
		createNew: "Criar Nova Regra",
		editor: {
			nameLabel: "Nome da Regra",
			namePlaceholder: "ex: coding-style",
			contentLabel: "Contedo da Regra (Markdown)",
			contentPlaceholder: "Digite o contedo da regra...",
			save: "Salvar Regra",
			saving: "Salvando...",
			cancel: "Cancelar",
		},
		templates: {
			title: "Selecionar Modelo",
			language: {
				name: "Regras de Linguagem",
				description: "Especifique a linguagem de programao e padres de codificao",
			},
			codingStyle: {
				name: "Estilo de Codificao",
				description: "Defina guias de formatao e estilo de cdigo",
			},
			gitCommit: {
				name: "Git Commit",
				description: "Configure o formato e padres de mensagens de commit Git",
			},
		},
		confirmDelete: "Tem certeza de que deseja excluir a regra \"{{name}}\"?",
		deleted: "Regra excluda",
		saved: "Regra salva",
		hint: "Os arquivos de regras so armazenados no diretrio .claude/rules/ do projeto. Cada regra  um arquivo no formato Markdown, a IA executar tarefas de acordo com o contedo da regra.",
	},

	claudeMd: {
		title: "Claude.md",
		subtitle: "Gerenciar configurao Claude do projeto (CLAUDE.md)",
		description: "Configure guias IA em nvel de projeto no CLAUDE.md na raiz do projeto",
		status: {
			exists: "O arquivo de configurao existe",
			missing: "O arquivo de configurao no existe",
			charCount: "{{count}} caracteres",
			lastModified: "ltima modificao: {{date}}",
		},
		actions: {
			view: "Ver Configurao Atual",
			edit: "Editar Configurao",
			save: "Salvar Configurao",
			saving: "Salvando...",
			delete: "Excluir Configurao",
			createFromTemplate: "Criar do Modelo",
			openDirectory: "Abrir Diretrio",
		},
		templates: {
			title: "Selecionar Modelo",
			basic: {
				name: "Configurao Bsica",
				description: "Modelo simples com informaes bsicas do projeto",
			},
			frontend: {
				name: "Projeto Frontend",
				description: "Para projetos frontend como React/Vue/Next.js",
			},
			backend: {
				name: "Projeto Backend",
				description: "Para projetos backend como Node.js/Python/FastAPI",
			},
		},
		editor: {
			label: "Contedo Claude.md",
			placeholder: "Digite o contedo da configurao do projeto aqui...",
			save: "Salvar Configurao",
			cancel: "Cancelar",
		},
		confirmDelete: "Tem certeza de que deseja excluir o arquivo de configurao CLAUDE.md?",
		deleted: "Configurao excluda",
		saved: "Configurao salva",
		hint: "O arquivo CLAUDE.md est localizado na raiz do projeto e define guias de comportamento IA em nvel de projeto. Este arquivo substitui configuraes globais.",
	},

	// Settings Modal (legacy)
	settings: {
		title: "Configurao de API",
		description: "Suporta a API oficial da Anthropic bem como APIs de terceiros compatveis com o formato Anthropic.",
		baseUrl: "URL Base",
		apiKey: "Chave API",
		modelName: "Nome do Modelo",
		cancel: "Cancelar",
		save: "Salvar",
		saving: "Salvando...",
		saved: "Configurao salva com sucesso!",
	},

	// Validation errors
	errors: {
		apiKeyRequired: "A chave API  obrigatria",
		baseUrlRequired: "A URL Base  obrigatria",
		modelRequired: "O modelo  obrigatrio",
		invalidBaseUrl: "Formato de URL Base invlido",
		failedToLoadConfig: "Falha ao carregar configurao",
		failedToSaveConfig: "Falha ao salvar configurao",
		sessionStillRunning: "A sesso ainda est em execuo. Por favor, aguarde a concluso.",
		workingDirectoryRequired: "Um diretrio de trabalho  necessrio para iniciar uma sesso.",
		failedToGetSessionTitle: "Falha ao obter ttulo da sesso.",
	},

	// Start Session Modal
	startSession: {
		title: "Iniciar Sesso",
		description: "Crie uma nova sesso para comear a interagir com o agente.",
		workingDirectory: "Diretrio de Trabalho",
		browse: "Procurar...",
		recent: "Recente",
		prompt: "Prompt",
		promptPlaceholder: "Descreva a tarefa que deseja que o agente processe...",
		startButton: "Iniciar Sesso",
		starting: "Iniciando...",
	},

	// Prompt Input
	promptInput: {
		placeholderDisabled: "Crie/selecione uma tarefa para comear...",
		placeholder: "Descreva o que deseja que o agente processe...",
		stopSession: "Parar sesso",
		sendPrompt: "Enviar prompt",
		selectWorkingDir: "Selecionar diretório de trabalho",
	},

	// Common
	common: {
		close: "Fechar",
		cancel: "Cancelar",
		save: "Salvar",
		delete: "Excluir",
		loading: "Carregando...",
		edit: "Editar",
		add: "Adicionar",
		refresh: "Atualizar",
		back: "Voltar",
	},

	// App
	app: {
		noMessagesYet: "Nenhuma mensagem ainda",
		startConversation: "Iniciar uma conversa com o AICowork",
		beginningOfConversation: "Incio da conversa",
		loadingMessages: "Carregando...",
		newMessages: "Novas mensagens",
	},

	// Deletion Confirmation
	deletion: {
		title: " Confirmao de Excluso",
		subtitle: "A IA est prestes a realizar uma operao de excluso",
		description: "A IA est tentando executar uma operao de excluso. Esta operao pode excluir permanentemente arquivos ou diretrios. Por favor, verifique cuidadosamente o contedo do comando.",
		commandLabel: "Comando a ser executado:",
		unknownCommand: "Comando desconhecido",
		warning: "Aviso: Operaes de excluso no podem ser desfeitas. Certifique-se de que entende as consequncias deste comando.",
		allow: "Permitir Execuo",
		deny: "Negar Operao",
		deniedMessage: "O usurio negou a operao de excluso",
	},

	// Event Card
	events: {
		sessionResult: "Resultado da Sesso",
		duration: "Durao",
		usage: "Uso",
		cost: "Custo",
		input: "Entrada",
		output: "Sada",
		collapse: "Recolher",
		showMoreLines: "Mostrar mais {{count}} linhas",
		systemInit: "Inicializao do Sistema",
		user: "Usurio",
		assistant: "Assistente",
		thinking: "Pensando",
		sessionId: "ID da Sesso",
		modelName: "Nome do Modelo",
		permissionMode: "Modo de Permisso",
		workingDirectory: "Diretrio de Trabalho",
	},
};
