/**
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
			feedback: "Commentaires",
			about: "À propos",
			language: "Langue",
			api: "Paramètres API",
			mcp: "Paramètres MCP",
			permissions: "Permissions",
			output: "Styles de Sortie",
			rules: "Règles",
			claudeMd: "Claude.md",
		},
		placeholder: {
			title: "Paramètres",
			description: "Sélectionnez un élément du menu de gauche pour configurer",
		},
	},

	// Settings Sections
	help: {
		title: "Aide",
		subtitle: "Obtenir de l'aide et de la documentation",
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
		tip: "Conseil : Consultez d'abord la FAQ si vous rencontrez des problmes, ou contactez-nous via les canaux de commentaires.",
		helpUrl: "https://ima.qq.com/note/share/_AwZPbuK9wucK5gWaVdjNQ?channel=4",
	},

	feedback: {
		title: "Commentaires",
		subtitle: "Soumettre des problmes et suggestions pour nous aider amliorer",
		bugReport: {
			title: "Rapport de Bug",
			description: "Soumettre des rapports de problmes sur GitHub",
			link: "Aller sur GitHub",
			url: "https://github.com/BrainPicker-L/AICowork",
		},
		thankYou: "Merci pour vos commentaires! Nous examinerons attentivement chaque commentaire.",
	},

	about: {
		title: "À propos d'AICowork",
		subtitle: "Espace de Travail Collaboratif IA - AICowork!",
		version: {
			title: "Version",
			description: "Version 1.0.0",
		},
		techStack: {
			title: "Stack Technique",
			description: "Electron + React + TypeScript + AI Agent SDK",
			electron: "• Electron - Framework d'applications de bureau multiplateforme",
			react: "• React + TypeScript - Framework frontend",
			tailwind: "• Tailwind CSS - Framework de style",
			claude: "• AI Agent SDK - Intgration IA",
		},
		license: {
			title: "Licence",
			description: "GNU Affero General Public License v3.0 (AGPL-3.0)",
		},
		tagline: "AICowork fait de l'IA votre partenaire de travail collaboratif.",
	},

	language: {
		title: "Langue",
		description: "Slectionner la langue d'affichage de l'interface",
		current: "Langue Actuelle",
		switching: "Changement en cours...",
		hint: "Les paramtres de langue sont enregistrs localement et seront appliqus automatiquement au prochain dmarrage de l'application.",
		tip: {
			label: "Conseil",
			text: "Les paramtres de langue sont enregistrs localement et seront appliqus automatiquement au prochain dmarrage de l'application.",
		},
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
		hintLabel: "Conseil : ",
		docsLink: "Documentation",
		learnMore: "En savoir plus.",
		saveSuccess: "Enregistr avec succs",
		current: "Actuelle",
		confirmDelete: "tes-vous sr de vouloir supprimer cette configuration?",
		modelLimits: "Limites du modle : max_tokens  [{{min}}, {{max}}]",
		azure: {
			resourceName: "Nom de la Ressource Azure",
			deploymentName: "Nom du Dploiement Azure",
			resourceNameRequired: "Le nom de la ressource Azure ne peut pas tre vide",
			deploymentNameRequired: "Le nom du dploiement Azure ne peut pas tre vide",
			bothRequired: "Azure ncessite  la fois le nom de la ressource et le nom du dploiement",
		},
	},

	mcp: {
		title: "Paramètres MCP",
		description: "Configurer les serveurs Model Context Protocol, le SDK dmarrera automatiquement et enregistrera les outils",
		noServers: "Aucune configuration de serveur MCP",
		addServer: "+ Ajouter un Serveur",
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
				stdio: "stdio (Entre/Sortie Standard)",
				sse: "SSE (Server-Sent Events)",
				streamableHttp: "HTTP Diffusable",
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
				placeholder: "Description des fonctionnalits du serveur",
			},
			addTitle: "Ajouter un Serveur MCP",
			editTitle: "Modifier le Serveur MCP",
		},
		view: {
			type: "Type",
			command: "Commande",
			args: "Arguments",
			url: "URL",
			description: "Description",
		},
		actions: {
			save: "Enregistrer",
			saving: "Enregistrement...",
			edit: "Modifier",
			delete: "Supprimer",
			cancel: "Annuler",
		},
		errors: {
			deleteFailed: "chec de la Suppression",
			nameRequired: "Le nom du serveur ne peut pas tre vide",
			saveFailed: "chec de l'Enregistrement",
			invalidNameFormat: "Le nom du serveur ne peut contenir que des lettres, des chiffres, des traits de soulignement et des tirets",
			commandRequired: "Les serveurs de type stdio doivent spcifier une commande",
			urlRequired: "Ce type de serveur doit spcifier une URL",
			invalidUrl: "Format d'URL invalide",
			saveSuccess: "Enregistr avec succs",
		},
		confirmDelete: "tes-vous sr de vouloir supprimer le serveur MCP \"{{name}}\"?",
		hint: "Conseil : Les configurations de serveur MCP sont stockes dans ~/.claude/settings.json. Le SDK dmarrera automatiquement les serveurs MCP configurs et enregistrera les outils dans la session.",
		hintPath: "~/.claude/settings.json",
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
	},	hooks: {
		title: "Hooks",
		description: "Configurer les hooks d'vnements pour dclencher automatiquement des actions  des moments spcifiques",
		postToolUse: {
			title: "PostToolUse",
			description: "Dclench aprs l'utilisation de l'outil",
			noConfig: "Aucune configuration",
		},
		preToolUse: {
			title: "PreToolUse",
			description: "Dclench avant l'utilisation de l'outil",
			noConfig: "Aucune configuration",
		},
		addHook: "+ Ajouter un Hook",
		hint: "Conseil : La configuration des Hooks est stocke dans",
		hintPath: "~/.claude/settings.json",
		hintSuffix: ". Le SDK chargera et excutera automatiquement les hooks configurs.",
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
		subtitle: "Configurer les styles et formats de sortie de l'IA",
		description: "La fonctionnalit de configuration des styles de sortie est en dveloppement...",
		comingSoon: "Bientt disponible : Format de sortie configurable, thme de coloration syntaxique, options de rendu Markdown, etc.",
	},

	recovery: {
		title: "Rcupration de Session",
		subtitle: "Voir et reprendre les sessions prcdentes",
		description: "Reprendre les sessions prcdentes pour continuer les conversations",
		loading: "Chargement...",
		refresh: "Actualiser la Liste",
		example1: {
			title: "Créer une Nouvelle Application Web",
			sessionId: "ID de Session : abc123def456",
			updated: "Mis à jour : il y a 2 heures",
		},
		example2: {
			title: "Corriger le Problme d'Intgration API",
			sessionId: "ID de Session : ghi789jkl012",
			updated: "Mis  jour : il y a 1 jour",
		},
		recover: "Reprendre",
		hint: "Les donnes de session sont stockes dans la base de donnes locale. La reprise d'une session chargera l'historique complet de la conversation.",
		hintWithCommand: "Vous pouvez aussi utiliser la ligne de commande :",
	},

	rules: {
		title: "Rgles",
		subtitle: "Grer les fichiers de rgles du projet (.claude/rules/)",
		description: "Crer et grer des fichiers de rgles personnalises dans le rpertoire .claude/rules/ de votre projet",
		noRules: "Aucun fichier de rgles pour le moment",
		createFromTemplate: "Crer depuis un Modle",
		createNew: "Crer une Nouvelle Rgle",
		editor: {
			nameLabel: "Nom de la Rgle",
			namePlaceholder: "ex : coding-style",
			contentLabel: "Contenu de la Rgle (Markdown)",
			contentPlaceholder: "Entrez le contenu de la rgle...",
			save: "Enregistrer la Rgle",
			saving: "Enregistrement...",
			cancel: "Annuler",
		},
		templates: {
			title: "Slectionner un Modle",
			language: {
				name: "Rgles de Langage",
				description: "Spcifier le langage de programmation et les normes de codage",
			},
			codingStyle: {
				name: "Style de Codage",
				description: "Dfinir les guides de formatage et de style de code",
			},
			gitCommit: {
				name: "Git Commit",
				description: "Configurer le format et les normes des messages de commit Git",
			},
		},
		confirmDelete: "tes-vous sr de vouloir supprimer la rgle \"{{name}}\"?",
		deleted: "Rgle supprime",
		saved: "Rgle enregistre",
		hint: "Les fichiers de rgles sont stocks dans le rpertoire .claude/rules/ du projet. Chaque rgle est un fichier au format Markdown, l'IA excutera les tches conformment au contenu de la rgle.",
	},

	claudeMd: {
		title: "Claude.md",
		subtitle: "Grer la configuration Claude du projet (CLAUDE.md)",
		description: "Configurer les guides IA au niveau du projet dans CLAUDE.md  la racine du projet",
		status: {
			exists: "Le fichier de configuration existe",
			missing: "Le fichier de configuration n'existe pas",
			charCount: "{{count}} caractres",
			lastModified: "Dernire modification : {{date}}",
		},
		actions: {
			view: "Voir la Configuration Actuelle",
			edit: "Modifier la Configuration",
			save: "Enregistrer la Configuration",
			saving: "Enregistrement...",
			delete: "Supprimer la Configuration",
			createFromTemplate: "Crer depuis un Modle",
			openDirectory: "Ouvrir le Rpertoire",
		},
		templates: {
			title: "Slectionner un Modle",
			basic: {
				name: "Configuration de Base",
				description: "Modle simple avec des informations de base sur le projet",
			},
			frontend: {
				name: "Projet Frontend",
				description: "Pour les projets frontend comme React/Vue/Next.js",
			},
			backend: {
				name: "Projet Backend",
				description: "Pour les projets backend comme Node.js/Python/FastAPI",
			},
		},
		editor: {
			label: "Contenu Claude.md",
			placeholder: "Entrez le contenu de la configuration du projet ici...",
			save: "Enregistrer la Configuration",
			cancel: "Annuler",
		},
		confirmDelete: "tes-vous sr de vouloir supprimer le fichier de configuration CLAUDE.md?",
		deleted: "Configuration supprime",
		saved: "Configuration enregistre",
		hint: "Le fichier CLAUDE.md est situ  la racine du projet et dfinit les guides de comportement IA au niveau du projet. Ce fichier remplace la configuration globale.",
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
		selectWorkingDir: "Sélectionner le répertoire de travail",
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
