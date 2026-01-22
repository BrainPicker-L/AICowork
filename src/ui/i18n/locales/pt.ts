/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @updated     2026-01-21
 * @Email       None
 *
 * Tradução portuguesa
 */

export default {
	// Language names
	languageNames: {
		en: "English",
		zh: "Chinês Simplificado",
		"zh-TW": "Chinês Tradicional",
		ja: "Japonês",
		ko: "Coreano",
		es: "Espanhol",
		fr: "Francês",
		de: "Alemão",
		ru: "Russo",
		pt: "Português",
	},

	// Sidebar
	sidebar: {
		newTask: "+ Nova Tarefa",
		settings: "Configurações",
		noSessions: "Ainda não há sessões. Clique em \"+ Nova Tarefa\" para começar.",
		deleteSession: "Excluir esta sessão",
		resumeInClaudeCode: "Continuar no Claude Code",
		resume: "Continuar",
		close: "Fechar",
		copyResumeCommand: "Copiar comando de continuação",
		workingDirUnavailable: "Diretório de trabalho indisponível",
	},

	// Settings Page
	settingsPage: {
		title: "Configurações",
		back: "Voltar",
		sections: {
			general: "Geral",
			api: "Configuração de API",
			features: "Recursos",
			system: "Sistema",
		},
		navigation: {
			help: "Ajuda",
			feedback: "Feedback",
			about: "Sobre",
			language: "Idioma",
			api: "Configurações de API",
			mcp: "Configurações MCP",
			skills: "Skills",
			plugins: "Plugins",
			memory: "Memória",
			agents: "Agents",
			hooks: "Ganchos",
			permissions: "Permissões",
			output: "Estilos de Saída",
			recovery: "Recuperação de Sessão",
		},
		placeholder: {
			title: "Configurações",
			description: "Selecione um item do menu à esquerda para configurar",
		},
	},

	// Settings Sections
	help: {
		title: "Ajuda",
		quickStart: {
			title: "Início Rápido",
			description: "Aprenda a usar o AICowork para iniciar sua primeira tarefa",
		},
		faq: {
			title: "Perguntas Frequentes",
			description: "Veja perguntas frequentes e soluções",
		},
		docs: {
			title: "Documentação",
			description: "Visite a documentação oficial para mais informações",
		},
	},

	feedback: {
		title: "Feedback",
		bugReport: {
			title: "Relatório de Bug",
			description: "Envie relatórios de problemas no GitHub",
		},
		featureRequest: {
			title: "Solicitação de Recurso",
			description: "Sugira novos recursos que gostaria de ver",
		},
	},

	about: {
		title: "Sobre o AICowork",
		version: {
			title: "Versão",
			description: "Versão 1.0.0",
		},
		techStack: {
			title: "Stack Tecnológico",
			description: "Electron + React + TypeScript + Claude Agent SDK",
		},
		license: {
			title: "Licença",
			description: "AGCPA v3.0",
		},
	},

	language: {
		title: "Idioma",
		current: "Idioma Atual",
		switching: "Alterando...",
		hint: "As configurações de idioma são salvas localmente e serão aplicadas automaticamente na próxima vez que você iniciar o aplicativo.",
	},

	api: {
		title: "Configurações de API",
		description: "Configure a chave de API e modelo da Anthropic",
		viewList: "Ver Lista de Configurações",
		addConfig: "Adicionar Configuração",
		configName: {
			label: "Nome da Configuração",
			placeholder: "Minha Configuração",
			test: "Testar Configuração",
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
			openai: "Compatível com OpenAI",
		},
		model: {
			label: "Nome do Modelo",
			placeholder: "Digite o nome do modelo",
			refresh: "Atualizar Lista de Modelos",
		},
		advanced: {
			label: "Parâmetros Avançados (Opcional)",
			maxTokens: {
				label: "Tokens Máximos",
				placeholder: "Padrão",
			},
			temperature: {
				label: "Temperatura",
				placeholder: "Padrão",
			},
			topP: {
				label: "Top P",
				placeholder: "Padrão",
			},
		},
		actions: {
			test: "Testar Conexão",
			testing: "Testando...",
			save: "Salvar Configuração",
			saving: "Salvando...",
			setActive: "Definir como Ativa",
			edit: "Editar Configuração",
			delete: "Excluir Configuração",
		},
		responseTime: "Tempo de resposta: {{time}}ms",
		testFailed: "Teste Falhou",
		noConfigs: "Nenhuma configuração salva",
		hint: "Configure a chave API para começar a usar. Suporta múltiplas configurações para troca rápida.",
		docsLink: "Documentação",
	},

	mcp: {
		title: "Configurações MCP",
		description: "Configure servidores do Model Context Protocol",
		noServers: "Nenhuma configuração de servidor MCP",
		addServer: "Adicionar Servidor MCP",
		templates: {
			title: "Adicionar do Modelo",
		},
		form: {
			name: {
				label: "Nome do Servidor",
				placeholder: "github",
			},
			displayName: {
				label: "Nome de Exibição (Opcional)",
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
				label: "Argumentos (separados por espaço)",
				placeholder: "@modelcontextprotocol/server-github",
			},
			description: {
				label: "Descrição (Opcional)",
				placeholder: "Descrição da funcionalidade do servidor",
			},
		},
		view: {
			type: "Tipo",
			command: "Comando",
			args: "Args",
			description: "Descrição",
		},
		actions: {
			save: "Salvar",
			saving: "Salvando...",
			edit: "Editar",
			delete: "Excluir",
		},
		errors: {
			deleteFailed: "Falha ao Excluir",
			nameRequired: "O nome do servidor não pode estar vazio",
			saveFailed: "Falha ao Salvar",
		},
		hint: "As configurações do servidor MCP são armazenadas em ~/.claude/settings.json.",
	},

	skills: {
		title: "Skills",
		description: "Gerencie skills personalizados, a IA executará automaticamente com base nas instruções do SKILL.md",
		loading: "Carregando...",
		noSkills: "Nenhum Skill instalado",
		noSkillsHint: "Coloque Skills no diretório ~/.claude/skills/ para detecção automática",
		openDirectory: "Abrir Diretório de Skills",
		source: {
			skill: "Skill",
			plugin: "Plugin",
		},
		hint: "Os Skills são armazenados no diretório ~/.claude/skills/. Cada pasta de skill contém um arquivo SKILL.md, a IA executará automaticamente com base no conteúdo.",
	},

	plugins: {
		title: "Plugins",
		description: "Gerenciar plugins instalados",
		noPlugins: "Nenhum plugin instalado",
		status: {
			installed: "Instalado",
		},
		hint: "O formato do comando de plugin é /plugin-name:command-name.",
	},

	memory: {
		title: "Memória",
		description: "Reservado para funcionalidade do projeto memvid",
		comingSoon: "Em breve: Memória permitirá que a IA compartilhe informações entre sessões para conversas mais coerentes.",
	},

	agents: {
		title: "Agents",
		description: "Configure as configurações de sub-agentes",
		subAgents: "SubAgents: Pode iniciar até 10 sub-agentes em paralelo para maior eficiência em tarefas complexas.",
	},

	hooks: {
		title: "Ganchos",
		postToolUse: {
			title: "Acionado Após Uso de Ferramenta",
			noConfig: "Nenhuma configuração",
		},
		preToolUse: {
			title: "Acionado Antes do Uso de Ferramenta",
			noConfig: "Nenhuma configuração",
		},
		hint: "As configurações de Hooks são armazenadas em ~/.claude/settings.json.",
	},

	permissions: {
		title: "Permissões",
		allowedTools: {
			title: "Ferramentas Permitidas",
			description: "Podem ser usadas sem confirmação do usuário",
			noConfig: "Nenhuma configuração",
		},
		customRules: {
			title: "Regras Personalizadas",
			description: "Configure regras de permissão específicas",
			noConfig: "Nenhuma regra personalizada",
		},
		securityHint: "Dica de Segurança: Conceda permissões de ferramenta com cuidado, especialmente para Bash e operações de arquivo.",
	},

	output: {
		title: "Estilos de Saída",
		description: "A configuração de estilo de saída está em desenvolvimento...",
		comingSoon: "Em breve: Formato de saída configurável, tema de destaque de código, opções de renderização Markdown, etc.",
	},

	recovery: {
		title: "Recuperação de Sessão",
		description: "Retome sessões anteriores para continuar conversas",
		example1: {
			title: "Criar Novo Aplicativo Web",
			sessionId: "ID da Sessão: abc123def456",
			updated: "Atualizado: 2 horas atrás",
		},
		example2: {
			title: "Corrigir Problema de Integração de API",
			sessionId: "ID da Sessão: ghi789jkl012",
			updated: "Atualizado: 1 dia atrás",
		},
		hint: "Os dados da sessão são armazenados no banco de dados local. Retomar uma sessão carregará o histórico completo da conversa.",
	},

	// Settings Modal (legacy)
	settings: {
		title: "Configuração de API",
		description: "Suporta a API oficial da Anthropic bem como APIs de terceiros compatíveis com o formato Anthropic.",
		baseUrl: "URL Base",
		apiKey: "Chave API",
		modelName: "Nome do Modelo",
		cancel: "Cancelar",
		save: "Salvar",
		saving: "Salvando...",
		saved: "Configuração salva com sucesso!",
	},

	// Validation errors
	errors: {
		apiKeyRequired: "A chave API é obrigatória",
		baseUrlRequired: "A URL Base é obrigatória",
		modelRequired: "O nome do modelo é obrigatório",
		invalidBaseUrl: "Formato de URL Base inválido",
		failedToLoadConfig: "Falha ao carregar configuração",
		failedToSaveConfig: "Falha ao salvar configuração",
		sessionStillRunning: "A sessão ainda está em execução. Por favor, aguarde a conclusão.",
		workingDirectoryRequired: "Um diretório de trabalho é necessário para iniciar uma sessão.",
		failedToGetSessionTitle: "Falha ao obter título da sessão.",
	},

	// Start Session Modal
	startSession: {
		title: "Iniciar Sessão",
		description: "Crie uma nova sessão para começar a interagir com o agente.",
		workingDirectory: "Diretório de Trabalho",
		browse: "Procurar...",
		recent: "Recente",
		prompt: "Prompt",
		promptPlaceholder: "Descreva a tarefa que deseja que o agente processe...",
		startButton: "Iniciar Sessão",
		starting: "Iniciando...",
	},

	// Prompt Input
	promptInput: {
		placeholderDisabled: "Crie/selecione uma tarefa para começar...",
		placeholder: "Descreva o que deseja que o agente processe...",
		stopSession: "Parar sessão",
		sendPrompt: "Enviar prompt",
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
		beginningOfConversation: "Início da conversa",
		loadingMessages: "Carregando...",
		newMessages: "Novas mensagens",
	},

	// Deletion Confirmation
	deletion: {
		title: "⚠️ Confirmação de Exclusão",
		subtitle: "A IA está prestes a realizar uma operação de exclusão",
		description: "A IA está tentando executar uma operação de exclusão. Esta operação pode excluir permanentemente arquivos ou diretórios. Por favor, verifique cuidadosamente o conteúdo do comando.",
		commandLabel: "Comando a ser executado:",
		unknownCommand: "Comando desconhecido",
		warning: "Aviso: Operações de exclusão não podem ser desfeitas. Certifique-se de que entende as consequências deste comando.",
		allow: "Permitir Execução",
		deny: "Negar Operação",
		deniedMessage: "O usuário negou a operação de exclusão",
	},

	// Event Card
	events: {
		sessionResult: "Resultado da Sessão",
		duration: "Duração",
		usage: "Uso",
		cost: "Custo",
		input: "Entrada",
		output: "Saída",
		collapse: "Recolher",
		showMoreLines: "Mostrar mais {{count}} linhas",
		systemInit: "Inicialização do Sistema",
		user: "Usuário",
		assistant: "Assistente",
		thinking: "Pensando",
		sessionId: "ID da Sessão",
		modelName: "Nome do Modelo",
		permissionMode: "Modo de Permissão",
		workingDirectory: "Diretório de Trabalho",
	},
};
