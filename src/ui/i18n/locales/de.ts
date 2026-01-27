/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @updated     2026-01-21
 * @Email       None
 *
 * Deutsche bersetzung
 */

export default {
	// Language names
	languageNames: {
		en: "English",
		"zh-TW": "Traditionelles Chinesisch",
		zh: "Vereinfachtes Chinesisch",
		ja: "Japanisch",
		ko: "Koreanisch",
		es: "Spanisch",
		fr: "Französisch",
		de: "Deutsch",
		ru: "Russisch",
		pt: "Portugiesisch",
	},

	// Sidebar
	sidebar: {
		newTask: "+ Neue Aufgabe",
		settings: "Einstellungen",
		noSessions: "Noch keine Sitzungen. Klicken Sie auf \"+ Neue Aufgabe\", um zu beginnen.",
		deleteSession: "Diese Sitzung löschen",
		resumeInClaudeCode: "In Claude Code fortsetzen",
		resume: "Fortsetzen",
		close: "Schließen",
		copyResumeCommand: "Fortsetzungsbefehl kopieren",
		workingDirUnavailable: "Arbeitsverzeichnis nicht verfügbar",
	},

	// Settings Page
	settingsPage: {
		title: "Einstellungen",
		back: "Zurück",
		sections: {
			general: "Allgemein",
			api: "API-Konfiguration",
			features: "Funktionen",
			system: "System",
		},
		navigation: {
			feedback: "Feedback",
			about: "Über",
			language: "Sprache",
			api: "API-Einstellungen",
			mcp: "MCP-Einstellungen",
			permissions: "Berechtigungen",
			output: "Ausgabeformate",
			rules: "Regeln",
			claudeMd: "Claude.md",
		},
		placeholder: {
			title: "Einstellungen",
			description: "Wählen Sie links einen Menüpunkt zur Konfiguration",
		},
	},

	// Settings Sections
	help: {
		title: "Hilfe",
		subtitle: "Hilfe und Dokumentation erhalten",
		quickStart: {
			title: "Schnellstart",
			description: "Erfahren Sie, wie Sie AICowork für Ihre erste Aufgabe verwenden",
		},
		faq: {
			title: "Häufig gestellte Fragen",
			description: "Häufige Fragen und Lösungen anzeigen",
		},
		docs: {
			title: "Dokumentation",
			description: "Besuchen Sie die offizielle Dokumentation für weitere Informationen",
		},
		tip: "Tipp: Konsultieren Sie zuerst die FAQ, wenn Sie Probleme haben, oder kontaktieren Sie uns über die Feedback-Kanäle.",
		helpUrl: "https://ima.qq.com/note/share/_AwZPbuK9wucK5gWaVdjNQ?channel=4",
	},

	feedback: {
		title: "Feedback",
		subtitle: "Probleme und Vorschläge einreichen, um uns zu helfen, uns zu verbessern",
		bugReport: {
			title: "Fehlerbericht",
			description: "Fehler auf GitHub melden",
			link: "Zu GitHub gehen",
			url: "https://github.com/BrainPicker-L/AICowork",
		},
		thankYou: "Vielen Dank für Ihr Feedback! Wir werden jedes Feedback sorgfältig prüfen.",
	},

	about: {
		title: "Über AICowork",
		subtitle: "KI-Kollaborations-Arbeitsplatz - AICowork!",
		version: {
			title: "Version",
			description: "Version 1.0.0",
		},
		techStack: {
			title: "Tech Stack",
			description: "Electron + React + TypeScript + AI Agent SDK",
			electron: "• Electron - Framework für plattformübergreifende Desktop-Anwendungen",
			react: "• React + TypeScript - Frontend-Framework",
			tailwind: "• Tailwind CSS - Styling-Framework",
			claude: "• AI Agent SDK - KI-Integration",
		},
		license: {
			title: "Lizenz",
			description: "GNU Affero General Public License v3.0 (AGPL-3.0)",
		},
		tagline: "AICowork macht KI zu Ihrem collaborativen Arbeitspartner.",
	},

	language: {
		title: "Sprache",
		description: "Anzeigesprache der Schnittstelle auswählen",
		current: "Aktuelle Sprache",
		switching: "Wechseln...",
		hint: "Spracheinstellungen werden lokal gespeichert und beim nächsten Start automatisch angewendet.",
		tip: {
			label: "Tipp",
			text: "Spracheinstellungen werden lokal gespeichert und beim nächsten Start automatisch angewendet.",
		},
	},

	api: {
		title: "API-Einstellungen",
		description: "Anthropic API-Schlüssel und Modell konfigurieren",
		viewList: "Konfigurationsliste anzeigen",
		addConfig: "Konfiguration hinzufügen",
		configName: {
			label: "Konfigurationsname",
			placeholder: "Meine Konfiguration",
			test: "Konfiguration testen",
		},
		baseUrl: {
			label: "Basis-URL",
			placeholder: "https://api.anthropic.com",
		},
		apiKey: {
			label: "API-Schlüssel",
			placeholder: "sk-ant-...",
		},
		apiType: {
			label: "API-Typ",
			anthropic: "Anthropic",
			openai: "OpenAI-kompatibel",
		},
		model: {
			label: "Modellname",
			placeholder: "Modellname eingeben",
			refresh: "Modellliste aktualisieren",
		},
		advanced: {
			label: "Erweiterte Parameter (optional)",
			maxTokens: {
				label: "Maximale Tokens",
				placeholder: "Standard",
			},
			temperature: {
				label: "Temperatur",
				placeholder: "Standard",
			},
			topP: {
				label: "Top P",
				placeholder: "Standard",
			},
		},
		actions: {
			test: "Verbindung testen",
			testing: "Testen...",
			save: "Konfiguration speichern",
			saving: "Speichern...",
			setActive: "Als aktiv festlegen",
			edit: "Konfiguration bearbeiten",
			delete: "Konfiguration löschen",
		},
		responseTime: "Antwortzeit: {{time}}ms",
		testFailed: "Test fehlgeschlagen",
		noConfigs: "Keine gespeicherten Konfigurationen",
		hint: "Konfigurieren Sie den API-Schlüssel, um zu beginnen. Mehrere Konfigurationen werden für schnelles Wechseln unterstützt.",
		hintLabel: "Tipp: ",
		docsLink: "Dokumentation",
		learnMore: "Mehr erfahren.",
		saveSuccess: "Erfolgreich gespeichert",
		current: "Aktuell",
		confirmDelete: "Möchten Sie diese Konfiguration wirklich löschen?",
		modelLimits: "Modell-Limits: max_tokens  [{{min}}, {{max}}]",
		azure: {
			resourceName: "Azure-Ressourcenname",
			deploymentName: "Azure-Bereitstellungsname",
			resourceNameRequired: "Azure-Ressourcenname darf nicht leer sein",
			deploymentNameRequired: "Azure-Bereitstellungsname darf nicht leer sein",
			bothRequired: "Azure erfordert sowohl Ressourcenname als auch Bereitstellungsname",
		},
	},

	mcp: {
		title: "MCP-Einstellungen",
		description: "Model Context Protocol Server konfigurieren, SDK wird automatisch starten und Tools registrieren",
		noServers: "Keine MCP-Serverkonfigurationen",
		addServer: "+ Server hinzufügen",
		templates: {
			title: "Aus Vorlage hinzufügen",
		},
		form: {
			name: {
				label: "Servername",
				placeholder: "my-mcp-server",
			},
			displayName: {
				label: "Anzeigename (optional)",
				placeholder: "Mein MCP-Server",
			},
			type: {
				label: "Servertyp",
				stdio: "stdio (Standardeingabe/-ausgabe)",
				sse: "SSE (Server-Sent Events)",
				streamableHttp: "Streamable HTTP",
			},
			command: {
				label: "Befehl",
				placeholder: "npx",
			},
			args: {
				label: "Argumente (leerzeichengetrennt)",
				placeholder: "@modelcontextprotocol/server-github",
			},
			url: {
				label: "URL",
				placeholder: "https://example.com/mcp",
			},
			description: {
				label: "Beschreibung (optional)",
				placeholder: "Beschreibung der Serverfunktionalität",
			},
			addTitle: "MCP-Server hinzufügen",
			editTitle: "MCP-Server bearbeiten",
		},
		view: {
			type: "Typ",
			command: "Befehl",
			args: "Argumente",
			url: "URL",
			description: "Beschreibung",
		},
		actions: {
			save: "Speichern",
			saving: "Speichern...",
			edit: "Bearbeiten",
			delete: "Löschen",
			cancel: "Abbrechen",
		},
		errors: {
			deleteFailed: "Löschen fehlgeschlagen",
			nameRequired: "Servername darf nicht leer sein",
			saveFailed: "Speichern fehlgeschlagen",
			invalidNameFormat: "Servername darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten",
			commandRequired: "stdio-Typ-Server müssen einen Befehl angeben",
			urlRequired: "Dieser Servertyp muss eine URL angeben",
			invalidUrl: "Ungültiges URL-Format",
			saveSuccess: "Erfolgreich gespeichert",
		},
		confirmDelete: "Möchten Sie den MCP-Server \"{{name}}\" wirklich löschen?",
		hint: "Tipp: MCP-Serverkonfigurationen werden in ~/.claude/settings.json gespeichert. Das SDK startet automatisch die konfigurierten MCP-Server und registriert Tools in der Sitzung.",
		hintPath: "~/.claude/settings.json",
	},

	skills: {
		title: "Skills",
		description: "Benutzerdefinierte Skills verwalten, KI führt automatisch basierend auf SKILL.md Anweisungen aus",
		loading: "Laden...",
		noSkills: "Keine installierten Skills",
		noSkillsHint: "Platzieren Sie Skills im ~/.claude/skills/ Verzeichnis zur automatischen Erkennung",
		openDirectory: "Skills Verzeichnis öffnen",
		source: {
			skill: "Skill",
			plugin: "Plugin",
		},
		hint: "Skills werden im ~/.claude/skills/ Verzeichnis gespeichert. Jeder Skill-Ordner enthält eine SKILL.md Datei, die KI führt automatisch basierend auf dem Inhalt aus.",
	},

	plugins: {
		title: "Plugins",
		description: "Installierte Plugins verwalten",
		noPlugins: "Keine installierten Plugins",
		status: {
			installed: "Installiert",
		},
		hint: "Plugin-Befehlsformat ist /plugin-name:befehls-name.",
	},	hooks: {
		title: "Hooks",
		description: "Event-Hooks konfigurieren, um automatisch Aktionen zu bestimmten Zeitpunkten auszulösen",
		postToolUse: {
			title: "PostToolUse",
			description: "Nach Tool-Nutzung ausgelöst",
			noConfig: "Keine Konfiguration",
		},
		preToolUse: {
			title: "PreToolUse",
			description: "Vor Tool-Nutzung ausgelöst",
			noConfig: "Keine Konfiguration",
		},
		addHook: "+ Hook hinzufügen",
		hint: "Tipp: Hooks-Konfigurationen werden gespeichert in",
		hintPath: "~/.claude/settings.json",
		hintSuffix: ". Das SDK lädt und führt automatisch konfigurierte Hooks aus.",
	},

	permissions: {
		title: "Berechtigungen",
		allowedTools: {
			title: "Erlaubte Tools",
			description: "Können ohne Benutzerbestätigung verwendet werden",
			noConfig: "Keine Konfiguration",
		},
		customRules: {
			title: "Benutzerdefinierte Regeln",
			description: "Spezifische Berechtigungsregeln konfigurieren",
			noConfig: "Keine benutzerdefinierten Regeln",
		},
		securityHint: "Sicherheitshinweis: Gewähren Sie Tool-Berechtigungen vorsichtig, insbesondere für Bash und Dateioperationen.",
	},

	output: {
		title: "Ausgabeformate",
		subtitle: "KI-Ausgabestile und -formate konfigurieren",
		description: "Ausgabestil-Konfigurationsfunktion ist in Entwicklung...",
		comingSoon: "Demnächst verfügbar: Konfigurierbares Ausgabeformat, Code-Highlighting-Theme, Markdown-Rendering-Optionen, etc.",
	},

	recovery: {
		title: "Sitzungswiederherstellung",
		subtitle: "Vorherige Sitzungen anzeigen und fortsetzen",
		description: "Vorherige Sitzungen fortsetzen, um Gespräche fortzusetzen",
		loading: "Laden...",
		refresh: "Liste aktualisieren",
		example1: {
			title: "Neue Web-App erstellen",
			sessionId: "Sitzungs-ID: abc123def456",
			updated: "Aktualisiert: vor 2 Stunden",
		},
		example2: {
			title: "API-Integrationsproblem beheben",
			sessionId: "Sitzungs-ID: ghi789jkl012",
			updated: "Aktualisiert: vor 1 Tag",
		},
		recover: "Fortsetzen",
		hint: "Sitzungsdaten werden in der lokalen Datenbank gespeichert. Das Fortsetzen einer Sitzung lädt den vollständigen Gesprächsverlauf.",
		hintWithCommand: "Sie können auch die Befehlszeile verwenden:",
	},

	rules: {
		title: "Regeln",
		subtitle: "Projektregeldateien verwalten (.claude/rules/)",
		description: "Benutzerdefinierte Regeldateien im .claude/rules/ Verzeichnis Ihres Projekts erstellen und verwalten",
		noRules: "Noch keine Regeldateien",
		createFromTemplate: "Aus Vorlage erstellen",
		createNew: "Neue Regel erstellen",
		editor: {
			nameLabel: "Regelname",
			namePlaceholder: "z.B.: coding-style",
			contentLabel: "Regelinhalt (Markdown)",
			contentPlaceholder: "Regelinhalt eingeben...",
			save: "Regel speichern",
			saving: "Speichern...",
			cancel: "Abbrechen",
		},
		templates: {
			title: "Vorlage auswählen",
			language: {
				name: "Sprachregeln",
				description: "Programmiersprache und Kodierungsstandards angeben",
			},
			codingStyle: {
				name: "Kodierungsstil",
				description: "Code-Formatierung und Stilrichtlinien definieren",
			},
			gitCommit: {
				name: "Git Commit",
				description: "Git-Commit-Nachrichtenformat und -standards konfigurieren",
			},
		},
		confirmDelete: "Möchten Sie die Regel \"{{name}}\" wirklich löschen?",
		deleted: "Regel gelöscht",
		saved: "Regel gespeichert",
		hint: "Regeldateien werden im .claude/rules/ Verzeichnis des Projekts gespeichert. Jede Regel ist eine Datei im Markdown-Format, die KI führt Aufgaben gemäß dem Regelinhalt aus.",
	},

	claudeMd: {
		title: "Claude.md",
		subtitle: "Projekt-Claude-Konfiguration verwalten (CLAUDE.md)",
		description: "Projektweite KI-Anleitungen in CLAUDE.md im Projektstammverzeichnis konfigurieren",
		status: {
			exists: "Konfigurationsdatei vorhanden",
			missing: "Konfigurationsdatei fehlt",
			charCount: "{{count}} Zeichen",
			lastModified: "Zuletzt geändert: {{date}}",
		},
		actions: {
			view: "Aktuelle Konfiguration anzeigen",
			edit: "Konfiguration bearbeiten",
			save: "Konfiguration speichern",
			saving: "Speichern...",
			delete: "Konfiguration löschen",
			createFromTemplate: "Aus Vorlage erstellen",
			openDirectory: "Verzeichnis öffnen",
		},
		templates: {
			title: "Vorlage auswählen",
			basic: {
				name: "Grundkonfiguration",
				description: "Einfache Vorlage mit grundlegenden Projektinformationen",
			},
			frontend: {
				name: "Frontend-Projekt",
				description: "Für Frontend-Projekte wie React/Vue/Next.js",
			},
			backend: {
				name: "Backend-Projekt",
				description: "Für Backend-Projekte wie Node.js/Python/FastAPI",
			},
		},
		editor: {
			label: "Claude.md Inhalt",
			placeholder: "Projektkonfigurationsinhalt hier eingeben...",
			save: "Konfiguration speichern",
			cancel: "Abbrechen",
		},
		confirmDelete: "Möchten Sie die CLAUDE.md-Konfigurationsdatei wirklich löschen?",
		deleted: "Konfiguration gelöscht",
		saved: "Konfiguration gespeichert",
		hint: "Die CLAUDE.md-Datei befindet sich im Projektstammverzeichnis und definiert projektweite KI-Verhaltensrichtlinien. Diese Datei überschreibt globale Einstellungen.",
	},

	// Settings Modal (legacy)
	settings: {
		title: "API-Konfiguration",
		description: "Unterstützt die offizielle Anthropic-API sowie Drittanbieter-APIs, die mit dem Anthropic-Format kompatibel sind.",
		baseUrl: "Basis-URL",
		apiKey: "API-Schlüssel",
		modelName: "Modellname",
		cancel: "Abbrechen",
		save: "Speichern",
		saving: "Speichern...",
		saved: "Konfiguration erfolgreich gespeichert!",
	},

	// Validation errors
	errors: {
		apiKeyRequired: "API-Schlüssel ist erforderlich",
		baseUrlRequired: "Basis-URL ist erforderlich",
		modelRequired: "Modell ist erforderlich",
		invalidBaseUrl: "Ungültiges Basis-URL-Format",
		failedToLoadConfig: "Fehler beim Laden der Konfiguration",
		failedToSaveConfig: "Fehler beim Speichern der Konfiguration",
		sessionStillRunning: "Die Sitzung läuft noch. Bitte warten Sie, bis sie beendet ist.",
		workingDirectoryRequired: "Zum Starten einer Sitzung ist ein Arbeitsverzeichnis erforderlich.",
		failedToGetSessionTitle: "Fehler beim Abrufen des Sitzungstitels.",
	},

	// Start Session Modal
	startSession: {
		title: "Sitzung starten",
		description: "Erstellen Sie eine neue Sitzung, um mit dem Agenten zu interagieren.",
		workingDirectory: "Arbeitsverzeichnis",
		browse: "Durchsuchen...",
		recent: "Kürzlich verwendet",
		prompt: "Eingabeaufforderung",
		promptPlaceholder: "Beschreiben Sie die Aufgabe, die der Agent ausführen soll...",
		startButton: "Sitzung starten",
		starting: "Starten...",
	},

	// Prompt Input
	promptInput: {
		placeholderDisabled: "Erstellen/wählen Sie eine Aufgabe, um zu beginnen...",
		placeholder: "Beschreiben Sie, was der Agent tun soll...",
		stopSession: "Sitzung stoppen",
		sendPrompt: "Eingabe senden",
		selectWorkingDir: "Arbeitsverzeichnis auswählen",
	},

	// Common
	common: {
		close: "Schließen",
		cancel: "Abbrechen",
		save: "Speichern",
		delete: "Löschen",
		loading: "Laden...",
		edit: "Bearbeiten",
		add: "Hinzufügen",
		refresh: "Aktualisieren",
		back: "Zurück",
	},

	// App
	app: {
		noMessagesYet: "Noch keine Nachrichten",
		startConversation: "Gespräch mit AICowork starten",
		beginningOfConversation: "Beginn der Unterhaltung",
		loadingMessages: "Laden...",
		newMessages: "Neue Nachrichten",
	},

	// Deletion Confirmation
	deletion: {
		title: " Löschbestätigung",
		subtitle: "KI führt eine Löschoperation aus",
		description: "Die KI versucht, eine Löschoperation auszuführen. Dieser Vorgang kann Dateien oder Verzeichnisse dauerhaft löschen. Bitte überprüfen Sie den Inhalt des Befehls sorgfältig.",
		commandLabel: "Auszuführender Befehl:",
		unknownCommand: "Unbekannter Befehl",
		warning: "Warnung: Löschoperationen können nicht rückgängig gemacht werden. Stellen Sie sicher, dass Sie die Konsequenzen dieses Befehls verstehen.",
		allow: "Ausführung zulassen",
		deny: "Operation verweigern",
		deniedMessage: "Benutzer hat die Löschoperation verweigert",
	},

	// Event Card
	events: {
		sessionResult: "Sitzungsergebnis",
		duration: "Dauer",
		usage: "Verbrauch",
		cost: "Kosten",
		input: "Eingabe",
		output: "Ausgabe",
		collapse: "Einklappen",
		showMoreLines: "{{count}} weitere Zeilen anzeigen",
		systemInit: "Systeminitialisierung",
		user: "Benutzer",
		assistant: "Assistent",
		thinking: "Denken",
		sessionId: "Sitzungs-ID",
		modelName: "Modellname",
		permissionMode: "Berechtigungsmodus",
		workingDirectory: "Arbeitsverzeichnis",
	},
};
