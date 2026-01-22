/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @updated     2026-01-21
 * @Email       None
 *
 * Deutsche Übersetzung
 */

export default {
	// Language names
	languageNames: {
		en: "Englisch",
		zh: "Vereinfachtes Chinesisch",
		"zh-TW": "Traditionelles Chinesisch",
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
			help: "Hilfe",
			feedback: "Feedback",
			about: "Über",
			language: "Sprache",
			api: "API-Einstellungen",
			mcp: "MCP-Einstellungen",
			skills: "Skills",
			plugins: "Plugins",
			memory: "Memory",
			agents: "Agents",
			hooks: "Hooks",
			permissions: "Berechtigungen",
			output: "Ausgabeformate",
			recovery: "Sitzungswiederherstellung",
		},
		placeholder: {
			title: "Einstellungen",
			description: "Wählen Sie links einen Menüpunkt zur Konfiguration",
		},
	},

	// Settings Sections
	help: {
		title: "Hilfe",
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
	},

	feedback: {
		title: "Feedback",
		bugReport: {
			title: "Fehlerbericht",
			description: "Fehler auf GitHub melden",
		},
		featureRequest: {
			title: "Funktionswunsch",
			description: "Schlagen Sie neue Funktionen vor, die Sie sehen möchten",
		},
	},

	about: {
		title: "Über AICowork",
		version: {
			title: "Version",
			description: "Version 1.0.0",
		},
		techStack: {
			title: "Tech Stack",
			description: "Electron + React + TypeScript + Claude Agent SDK",
		},
		license: {
			title: "Lizenz",
			description: "AGCPA v3.0",
		},
	},

	language: {
		title: "Sprache",
		current: "Aktuelle Sprache",
		switching: "Wechseln...",
		hint: "Spracheinstellungen werden lokal gespeichert und beim nächsten Start automatisch angewendet.",
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
		docsLink: "Dokumentation",
	},

	mcp: {
		title: "MCP-Einstellungen",
		description: "Model Context Protocol Server konfigurieren",
		noServers: "Keine MCP-Serverkonfigurationen",
		addServer: "MCP-Server hinzufügen",
		templates: {
			title: "Aus Vorlage hinzufügen",
		},
		form: {
			name: {
				label: "Servername",
				placeholder: "github",
			},
			displayName: {
				label: "Anzeigename (optional)",
				placeholder: "GitHub MCP",
			},
			type: {
				label: "Servertyp",
				stdio: "STDIO",
				sse: "SSE",
			},
			command: {
				label: "Befehl",
				placeholder: "npx",
			},
			args: {
				label: "Argumente (leerzeichengetrennt)",
				placeholder: "@modelcontextprotocol/server-github",
			},
			description: {
				label: "Beschreibung (optional)",
				placeholder: "Beschreibung der Serverfunktionalität",
			},
		},
		view: {
			type: "Typ",
			command: "Befehl",
			args: "Argumente",
			description: "Beschreibung",
		},
		actions: {
			save: "Speichern",
			saving: "Speichern...",
			edit: "Bearbeiten",
			delete: "Löschen",
		},
		errors: {
			deleteFailed: "Löschen fehlgeschlagen",
			nameRequired: "Servername darf nicht leer sein",
			saveFailed: "Speichern fehlgeschlagen",
		},
		hint: "MCP-Serverkonfigurationen werden in ~/.claude/settings.json gespeichert.",
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
	},

	memory: {
		title: "Memory",
		description: "Reserviert für memvid-Projektfunktionalität",
		comingSoon: "Demnächst: Memory ermöglicht der KI, Informationen über Sitzungen hinweg zu teilen für kohärentere Gespräche.",
	},

	agents: {
		title: "Agents",
		description: "Sub-Agent-Einstellungen konfigurieren",
		subAgents: "SubAgents: Kann bis zu 10 Sub-Agenden parallel für verbesserte Effizienz bei komplexen Aufgaben starten.",
	},

	hooks: {
		title: "Hooks",
		postToolUse: {
			title: "Ausgelöst nach Tool-Nutzung",
			noConfig: "Keine Konfiguration",
		},
		preToolUse: {
			title: "Ausgelöst vor Tool-Nutzung",
			noConfig: "Keine Konfiguration",
		},
		hint: "Hooks-Konfigurationen werden in ~/.claude/settings.json gespeichert.",
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
		description: "Ausgabestil-Konfiguration ist in Entwicklung...",
		comingSoon: "Demnächst: Konfigurierbares Ausgabeformat, Code-Highlighting-Theme, Markdown-Rendering-Optionen, etc.",
	},

	recovery: {
		title: "Sitzungswiederherstellung",
		description: "Vorherige Sitzungen fortsetzen, um Gespräche fortzusetzen",
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
		hint: "Sitzungsdaten werden in der lokalen Datenbank gespeichert. Das Fortsetzen einer Sitzung lädt den vollständigen Gesprächsverlauf.",
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
		title: "⚠️ Löschbestätigung",
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
