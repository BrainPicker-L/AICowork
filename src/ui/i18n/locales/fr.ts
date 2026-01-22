/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-21
 * @updated     2026-01-21
 * @Email       None
 *
 * Traduction française
 */

export default {
	// Language names
	languageNames: {
		en: "English",
		zh: "Chinois Simplifié",
		"zh-TW": "Chinois Traditionnel",
		ja: "Japonais",
		ko: "Coréen",
		es: "Espagnol",
		fr: "Français",
		de: "Allemand",
		ru: "Russe",
		pt: "Portugais",
	},

	// Sidebar
	sidebar: {
		newTask: "+ Nouvelle Tâche",
		settings: "Paramètres",
		noSessions: "Aucune session pour le moment. Cliquez sur \"+ Nouvelle Tâche\" pour commencer.",
		deleteSession: "Supprimer cette session",
		resumeInClaudeCode: "Reprendre dans Claude Code",
		resume: "Reprendre",
		close: "Fermer",
		copyResumeCommand: "Copier la commande de reprise",
		workingDirUnavailable: "Répertoire de travail non disponible",
	},

	// Settings Page
	settingsPage: {
		title: "Paramètres",
		back: "Retour",
		sections: {
			general: "Général",
			api: "Configuration API",
			features: "Fonctionnalités",
			system: "Système",
		},
		navigation: {
			help: "Aide",
			feedback: "Commentaires",
			about: "À propos",
			language: "Langue",
			api: "Paramètres API",
			mcp: "Paramètres MCP",
			skills: "Compétences",
			plugins: "Plugins",
			memory: "Mémoire",
			agents: "Agents",
			hooks: "Hooks",
			permissions: "Permissions",
			output: "Styles de Sortie",
			recovery: "Récupération de Session",
		},
		placeholder: {
			title: "Paramètres",
			description: "Sélectionnez un élément du menu de gauche pour configurer",
		},
	},

	// Settings Sections
	help: {
		title: "Aide",
		quickStart: {
			title: "Démarrage Rapide",
			description: "Apprenez à utiliser AICowork pour démarrer votre première tâche",
		},
		faq: {
			title: "FAQ",
			description: "Voir les questions fréquentes et leurs solutions",
		},
		docs: {
			title: "Documentation",
			description: "Visitez la documentation officielle pour plus d'informations",
		},
	},

	feedback: {
		title: "Commentaires",
		bugReport: {
			title: "Rapport de Bug",
			description: "Soumettre des rapports de problèmes sur GitHub",
		},
		featureRequest: {
			title: "Demande de Fonctionnalité",
			description: "Suggérer de nouvelles fonctionnalités que vous souhaitez voir",
		},
	},

	about: {
		title: "À propos d'AICowork",
		version: {
			title: "Version",
			description: "Version 1.0.0",
		},
		techStack: {
			title: "Stack Technique",
			description: "Electron + React + TypeScript + Claude Agent SDK",
		},
		license: {
			title: "Licence",
			description: "AGCPA v3.0",
		},
	},

	language: {
		title: "Langue",
		current: "Langue Actuelle",
		switching: "Changement en cours...",
		hint: "Les paramètres de langue sont enregistrés localement et seront appliqués automatiquement au prochain démarrage de l'application.",
	},

	api: {
		title: "Paramètres API",
		description: "Configurer la clé API Anthropic et le modèle",
		viewList: "Voir la Liste des Configurations",
		addConfig: "Ajouter une Configuration",
		configName: {
			label: "Nom de la Configuration",
			placeholder: "Ma Configuration",
			test: "Tester la Configuration",
		},
		baseUrl: {
			label: "URL de Base",
			placeholder: "https://api.anthropic.com",
		},
		apiKey: {
			label: "Clé API",
			placeholder: "sk-ant-...",
		},
		apiType: {
			label: "Type d'API",
			anthropic: "Anthropic",
			openai: "Compatible OpenAI",
		},
		model: {
			label: "Nom du Modèle",
			placeholder: "Entrez le nom du modèle",
			refresh: "Actualiser la Liste des Modèles",
		},
		advanced: {
			label: "Paramètres Avancés (Facultatif)",
			maxTokens: {
				label: "Tokens Max",
				placeholder: "Par défaut",
			},
			temperature: {
				label: "Température",
				placeholder: "Par défaut",
			},
			topP: {
				label: "Top P",
				placeholder: "Par défaut",
			},
		},
		actions: {
			test: "Tester la Connexion",
			testing: "Test en cours...",
			save: "Enregistrer la Configuration",
			saving: "Enregistrement...",
			setActive: "Définir comme Active",
			edit: "Modifier la Configuration",
			delete: "Supprimer la Configuration",
		},
		responseTime: "Temps de réponse : {{time}}ms",
		testFailed: "Échec du Test",
		noConfigs: "Aucune configuration enregistrée",
		hint: "Configurez la clé API pour commencer à utiliser. Plusieurs configurations prises en charge pour un changement rapide.",
		docsLink: "Documentation",
	},

	mcp: {
		title: "Paramètres MCP",
		description: "Configurer les serveurs Model Context Protocol",
		noServers: "Aucune configuration de serveur MCP",
		addServer: "Ajouter un Serveur MCP",
		templates: {
			title: "Ajouter depuis un Modèle",
		},
		form: {
			name: {
				label: "Nom du Serveur",
				placeholder: "github",
			},
			displayName: {
				label: "Nom d'Affichage (Facultatif)",
				placeholder: "GitHub MCP",
			},
			type: {
				label: "Type de Serveur",
				stdio: "STDIO",
				sse: "SSE",
			},
			command: {
				label: "Commande",
				placeholder: "npx",
			},
			args: {
				label: "Arguments (séparés par des espaces)",
				placeholder: "@modelcontextprotocol/server-github",
			},
			description: {
				label: "Description (Facultatif)",
				placeholder: "Description des fonctionnalités du serveur",
			},
		},
		view: {
			type: "Type",
			command: "Commande",
			args: "Arguments",
			description: "Description",
		},
		actions: {
			save: "Enregistrer",
			saving: "Enregistrement...",
			edit: "Modifier",
			delete: "Supprimer",
		},
		errors: {
			deleteFailed: "Échec de la Suppression",
			nameRequired: "Le nom du serveur ne peut pas être vide",
			saveFailed: "Échec de l'Enregistrement",
		},
		hint: "Les configurations de serveur MCP sont stockées dans ~/.claude/settings.json.",
	},

	skills: {
		title: "Compétences",
		description: "Gérer les compétences personnalisées, l'IA exécutera automatiquement selon les instructions de SKILL.md",
		loading: "Chargement...",
		noSkills: "Aucune Compétence installée",
		noSkillsHint: "Placez les Compétences dans le répertoire ~/.claude/skills/ pour une détection automatique",
		openDirectory: "Ouvrir le Répertoire des Compétences",
		source: {
			skill: "Compétence",
			plugin: "Plugin",
		},
		hint: "Les Compétences sont stockées dans le répertoire ~/.claude/skills/. Chaque dossier de compétence contient un fichier SKILL.md, l'IA exécutera automatiquement selon le contenu.",
	},

	plugins: {
		title: "Plugins",
		description: "Gérer les plugins installés",
		noPlugins: "Aucun plugin installé",
		status: {
			installed: "Installé",
		},
		hint: "Le format de commande de plugin est /plugin-name:command-name.",
	},

	memory: {
		title: "Mémoire",
		description: "Réservé pour les fonctionnalités du projet memvid",
		comingSoon: "Bientôt disponible : La Mémoire permettra à l'IA de partager des informations entre les sessions pour des conversations plus cohérentes.",
	},

	agents: {
		title: "Agents",
		description: "Configurer les paramètres des sous-agents",
		subAgents: "Sous-Agents : Peut lancer jusqu'à 10 sous-agents en parallèle pour améliorer l'efficacité sur les tâches complexes.",
	},

	hooks: {
		title: "Hooks",
		postToolUse: {
			title: "Déclenché Après l'Utilisation d'Outil",
			noConfig: "Aucune configuration",
		},
		preToolUse: {
			title: "Déclenché Avant l'Utilisation d'Outil",
			noConfig: "Aucune configuration",
		},
		hint: "Les configurations de Hooks sont stockées dans ~/.claude/settings.json.",
	},

	permissions: {
		title: "Permissions",
		allowedTools: {
			title: "Outils Autorisés",
			description: "Peuvent être utilisés sans confirmation de l'utilisateur",
			noConfig: "Aucune configuration",
		},
		customRules: {
			title: "Règles Personnalisées",
			description: "Configurer des règles d'autorisation spécifiques",
			noConfig: "Aucune règle personnalisée",
		},
		securityHint: "Conseil de Sécurité : Accordez les permissions d'outils avec prudence, surtout pour Bash et les opérations de fichiers.",
	},

	output: {
		title: "Styles de Sortie",
		description: "La configuration des styles de sortie est en développement...",
		comingSoon: "Bientôt disponible : Format de sortie configurable, thème de coloration syntaxique, options de rendu Markdown, etc.",
	},

	recovery: {
		title: "Récupération de Session",
		description: "Reprendre les sessions précédentes pour continuer les conversations",
		example1: {
			title: "Créer une Nouvelle Application Web",
			sessionId: "ID de Session : abc123def456",
			updated: "Mis à jour : il y a 2 heures",
		},
		example2: {
			title: "Corriger le Problème d'Intégration API",
			sessionId: "ID de Session : ghi789jkl012",
			updated: "Mis à jour : il y a 1 jour",
		},
		hint: "Les données de session sont stockées dans la base de données locale. La reprise d'une session chargera l'historique complet de la conversation.",
	},

	// Settings Modal (legacy)
	settings: {
		title: "Configuration API",
		description: "Prend en charge l'API officielle Anthropic ainsi que les API tiers compatibles avec le format Anthropic.",
		baseUrl: "URL de Base",
		apiKey: "Clé API",
		modelName: "Nom du Modèle",
		cancel: "Annuler",
		save: "Enregistrer",
		saving: "Enregistrement...",
		saved: "Configuration enregistrée avec succès !",
	},

	// Validation errors
	errors: {
		apiKeyRequired: "La clé API est requise",
		baseUrlRequired: "L'URL de Base est requise",
		modelRequired: "Le modèle est requis",
		invalidBaseUrl: "Format d'URL de Base invalide",
		failedToLoadConfig: "Échec du chargement de la configuration",
		failedToSaveConfig: "Échec de l'enregistrement de la configuration",
		sessionStillRunning: "La session est toujours en cours. Veuillez attendre qu'elle se termine.",
		workingDirectoryRequired: "Un répertoire de travail est requis pour démarrer une session.",
		failedToGetSessionTitle: "Échec de l'obtention du titre de la session.",
	},

	// Start Session Modal
	startSession: {
		title: "Démarrer une Session",
		description: "Créez une nouvelle session pour commencer à interagir avec l'agent.",
		workingDirectory: "Répertoire de Travail",
		browse: "Parcourir...",
		recent: "Récent",
		prompt: "Invite",
		promptPlaceholder: "Décrivez la tâche que vous souhaitez que l'agent traite...",
		startButton: "Démarrer la Session",
		starting: "Démarrage...",
	},

	// Prompt Input
	promptInput: {
		placeholderDisabled: "Créez/sélectionnez une tâche pour commencer...",
		placeholder: "Décrivez ce que vous souhaitez que l'agent traite...",
		stopSession: "Arrêter la session",
		sendPrompt: "Envoyer l'invite",
	},

	// Common
	common: {
		close: "Fermer",
		cancel: "Annuler",
		save: "Enregistrer",
		delete: "Supprimer",
		loading: "Chargement...",
		edit: "Modifier",
		add: "Ajouter",
		refresh: "Actualiser",
		back: "Retour",
	},

	// App
	app: {
		noMessagesYet: "Aucun message pour le moment",
		startConversation: "Commencer une conversation avec AICowork",
		beginningOfConversation: "Début de la conversation",
		loadingMessages: "Chargement...",
		newMessages: "Nouveaux messages",
	},

	// Deletion Confirmation
	deletion: {
		title: "⚠️ Confirmation de Suppression",
		subtitle: "L'IA est sur le point d'effectuer une opération de suppression",
		description: "L'IA tente d'exécuter une opération de suppression. Cette opération peut supprimer définitivement des fichiers ou des répertoires. Veuillez vérifier attentivement le contenu de la commande.",
		commandLabel: "Commande à exécuter :",
		unknownCommand: "Commande inconnue",
		warning: "Attention : Les opérations de suppression ne peuvent pas être annulées. Assurez-vous de comprendre les conséquences de cette commande.",
		allow: "Autoriser l'Exécution",
		deny: "Refuser l'Opération",
		deniedMessage: "L'utilisateur a refusé l'opération de suppression",
	},

	// Event Card
	events: {
		sessionResult: "Résultat de la Session",
		duration: "Durée",
		usage: "Utilisation",
		cost: "Coût",
		input: "Entrée",
		output: "Sortie",
		collapse: "Réduire",
		showMoreLines: "Afficher {{count}} lignes supplémentaires",
		systemInit: "Initialisation du Système",
		user: "Utilisateur",
		assistant: "Assistant",
		thinking: "Réflexion",
		sessionId: "ID de Session",
		modelName: "Nom du Modèle",
		permissionMode: "Mode de Permission",
		workingDirectory: "Répertoire de Travail",
	},
};
