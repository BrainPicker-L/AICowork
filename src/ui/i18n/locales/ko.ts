/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @updated     2026-01-21
 * @Email       None
 *
 * 한국어 번역
 */

export default {
	// Language names
	languageNames: {
		en: "English",
		zh: "간체 중국어",
		"zh-TW": "번체 중국어",
		ja: "일본어",
		ko: "한국어",
		es: "스페인어",
		fr: "프랑스어",
		de: "독일어",
		ru: "러시아어",
		pt: "포르투갈어",
	},

	// Sidebar
	sidebar: {
		newTask: "+ 새 작업",
		settings: "설정",
		noSessions: "아직 세션이 없습니다. \"+ 새 작업\"을(를) 클릭하여 시작하세요.",
		deleteSession: "이 세션 삭제",
		resumeInClaudeCode: "Claude Code에서 다시 시작",
		resume: "다시 시작",
		close: "닫기",
		copyResumeCommand: "다시 시작 명령 복사",
		workingDirUnavailable: "작업 디렉토리를 사용할 수 없습니다",
	},

	// Settings Page
	settingsPage: {
		title: "설정",
		back: "뒤로",
		sections: {
			general: "일반",
			api: "API 구성",
			features: "기능 확장",
			system: "시스템",
		},
		navigation: {
			help: "도움말",
			feedback: "피드백",
			about: "정보",
			language: "언어",
			api: "API 설정",
			mcp: "MCP 설정",
			skills: "Skills",
			plugins: "Plugins",
			memory: "Memory",
			agents: "Agents",
			hooks: "Hooks",
			permissions: "Permissions",
			output: "출력 스타일",
			recovery: "세션 복구",
		},
		placeholder: {
			title: "설정",
			description: "구성하려면 왼쪽 메뉴에서 항목을 선택하세요",
		},
	},

	// Settings Sections
	help: {
		title: "도움말",
		quickStart: {
			title: "빠른 시작",
			description: "AICowork를 사용하여 첫 번째 작업을 시작하는 방법을 알아보세요",
		},
		faq: {
			title: "자주 묻는 질문",
			description: "자주 묻는 질문과 해결 방법을 확인하세요",
		},
		docs: {
			title: "문서 링크",
			description: "자세한 내용은 공식 문서를 방문하세요",
		},
	},

	feedback: {
		title: "피드백",
		bugReport: {
			title: "버그 보고",
			description: "GitHub에서 문제 보고서 제출",
		},
		featureRequest: {
			title: "기능 요청",
			description: "보고 싶은 새로운 기능을 제안하세요",
		},
	},

	about: {
		title: "AICowork 정보",
		version: {
			title: "버전 정보",
			description: "버전 1.0.0",
		},
		techStack: {
			title: "기술 스택",
			description: "Electron + React + TypeScript + Claude Agent SDK",
		},
		license: {
			title: "라이선스",
			description: "AGCPA v3.0",
		},
	},

	language: {
		title: "언어",
		current: "현재 언어",
		switching: "전환 중...",
		hint: "언어 설정은 로컬에 저장되며 다음에 앱을 시작할 때 자동으로 적용됩니다.",
	},

	api: {
		title: "API 설정",
		description: "Anthropic API 키 및 모델 구성",
		viewList: "구성 목록 보기",
		addConfig: "구성 추가",
		configName: {
			label: "구성 이름",
			placeholder: "내 구성",
			test: "구성 테스트",
		},
		baseUrl: {
			label: "기본 URL",
			placeholder: "https://api.anthropic.com",
		},
		apiKey: {
			label: "API 키",
			placeholder: "sk-ant-...",
		},
		apiType: {
			label: "API 유형",
			anthropic: "Anthropic",
			openai: "OpenAI 호환",
		},
		model: {
			label: "모델 이름",
			placeholder: "모델 이름 입력",
			refresh: "모델 목록 새로고침",
		},
		advanced: {
			label: "고급 매개변수(선택 사항)",
			maxTokens: {
				label: "최대 토큰 수",
				placeholder: "기본값",
			},
			temperature: {
				label: "온도",
				placeholder: "기본값",
			},
			topP: {
				label: "Top P",
				placeholder: "기본값",
			},
		},
		actions: {
			test: "연결 테스트",
			testing: "테스트 중...",
			save: "구성 저장",
			saving: "저장 중...",
			setActive: "현재 구성으로 설정",
			edit: "구성 편집",
			delete: "구성 삭제",
		},
		responseTime: "응답 시간: {{time}}ms",
		testFailed: "테스트 실패",
		noConfigs: "저장된 구성이 없습니다",
		hint: "API 키를 구성하여 사용을 시작하세요. 빠른 전환을 위해 여러 구성을 지원합니다.",
		docsLink: "문서",
	},

	mcp: {
		title: "MCP 설정",
		description: "Model Context Protocol 서버 구성",
		noServers: "MCP 서버 구성이 없습니다",
		addServer: "MCP 서버 추가",
		templates: {
			title: "템플릿에서 추가",
		},
		form: {
			name: {
				label: "서버 이름",
				placeholder: "github",
			},
			displayName: {
				label: "표시 이름(선택 사항)",
				placeholder: "GitHub MCP",
			},
			type: {
				label: "서버 유형",
				stdio: "STDIO",
				sse: "SSE",
			},
			command: {
				label: "명령",
				placeholder: "npx",
			},
			args: {
				label: "인수(공백으로 구분)",
				placeholder: "@modelcontextprotocol/server-github",
			},
			description: {
				label: "설명(선택 사항)",
				placeholder: "서버 기능 설명",
			},
		},
		view: {
			type: "유형",
			command: "명령",
			args: "인수",
			description: "설명",
		},
		actions: {
			save: "저장",
			saving: "저장 중...",
			edit: "편집",
			delete: "삭제",
		},
		errors: {
			deleteFailed: "삭제 실패",
			nameRequired: "서버 이름은 비워둘 수 없습니다",
			saveFailed: "저장 실패",
		},
		hint: "MCP 서버 구성은 ~/.claude/settings.json에 저장됩니다.",
	},

	skills: {
		title: "Skills",
		description: "사용자 지정 스킬을 관리합니다. AI는 SKILL.md의 지침에 따라 자동으로 실행합니다",
		loading: "로드 중...",
		noSkills: "설치된 Skills가 없습니다",
		noSkillsHint: "~/.claude/skills/ 디렉토리에 Skills를 넣으면 자동으로 감지됩니다",
		openDirectory: "Skills 디렉토리 열기",
		source: {
			skill: "스킬",
			plugin: "플러그인",
		},
		hint: "Skills는 ~/.claude/skills/ 디렉토리에 저장됩니다. 각 스킬 폴더에는 SKILL.md 파일이 포함되어 있으며 AI는 내용을 기반으로 자동으로 실행합니다.",
	},

	plugins: {
		title: "Plugins",
		description: "설치된 플러그인 관리",
		noPlugins: "설치된 플러그인이 없습니다",
		status: {
			installed: "설치됨",
		},
		hint: "플러그인 명령 형식은 /plugin-name:command-name입니다.",
	},

	memory: {
		title: "Memory",
		description: "memvid 프로젝트 기능을 위해 예약됨",
		comingSoon: "곧 출시: Memory 기능을 사용하면 AI가 여러 세션 간에 정보를 공유하여 더 일관된 대화 환경을 제공할 수 있습니다.",
	},

	agents: {
		title: "Agents",
		description: "하위 에이전트 설정 구성",
		subAgents: "SubAgents: 최대 10개의 하위 에이전트를 병렬로 시작하여 복잡한 작업의 처리 효율성을 높일 수 있습니다.",
	},

	hooks: {
		title: "Hooks",
		postToolUse: {
			title: "도구 사용 후 트리거",
			noConfig: "구성 없음",
		},
		preToolUse: {
			title: "도구 사용 전 트리거",
			noConfig: "구성 없음",
		},
		hint: "Hooks 구성은 ~/.claude/settings.json에 저장됩니다.",
	},

	permissions: {
		title: "Permissions",
		allowedTools: {
			title: "허용된 도구",
			description: "사용자 확인 없이 사용 가능",
			noConfig: "구성 없음",
		},
		customRules: {
			title: "사용자 지정 규칙",
			description: "특정 권한 규칙 구성",
			noConfig: "사용자 지정 규칙 없음",
		},
		securityHint: "보안 힌트: Bash 및 파일 작업의 경우 도구 권한을 신중하게 부여하세요.",
	},

	output: {
		title: "출력 스타일",
		description: "출력 스타일 구성 기능이 개발 중입니다...",
		comingSoon: "곧 출시: 출력 형식, 코드 강조 표시 테마, Markdown 렌더링 옵션 등을 구성할 수 있습니다.",
	},

	recovery: {
		title: "세션 복구",
		description: "이전 세션을 다시 시작하여 대화를 계속하세요",
		example1: {
			title: "새 웹 앱 만들기",
			sessionId: "세션 ID: abc123def456",
			updated: "업데이트: 2시간 전",
		},
		example2: {
			title: "API 통합 문제 해결",
			sessionId: "세션 ID: ghi789jkl012",
			updated: "업데이트: 1일 전",
		},
		hint: "세션 데이터는 로컬 데이터베이스에 저장됩니다. 세션을 다시 시작하면 전체 대화 기록이 로드됩니다.",
	},

	// Settings Modal (legacy)
	settings: {
		title: "API 구성",
		description: "Anthropic의 공식 API와 Anthropic 형식과 호환되는 타사 API를 지원합니다.",
		baseUrl: "기본 URL",
		apiKey: "API 키",
		modelName: "모델 이름",
		cancel: "취소",
		save: "저장",
		saving: "저장 중...",
		saved: "구성을 저장했습니다!",
	},

	// Validation errors
	errors: {
		apiKeyRequired: "API 키가 필요합니다",
		baseUrlRequired: "기본 URL이 필요합니다",
		modelRequired: "모델이 필요합니다",
		invalidBaseUrl: "잘못된 기본 URL 형식입니다",
		failedToLoadConfig: "구성을 로드하지 못했습니다",
		failedToSaveConfig: "구성을 저장하지 못했습니다",
		sessionStillRunning: "세션이 여전히 실행 중입니다. 완료될 때까지 기다려 주세요.",
		workingDirectoryRequired: "세션을 시작하려면 작업 디렉토리가 필요합니다.",
		failedToGetSessionTitle: "세션 제목을 가져오지 못했습니다.",
	},

	// Start Session Modal
	startSession: {
		title: "세션 시작",
		description: "에이전트와 상호작용을 시작할 새 세션을 만듭니다.",
		workingDirectory: "작업 디렉토리",
		browse: "찾아보기...",
		recent: "최근 사용",
		prompt: "프롬프트",
		promptPlaceholder: "에이전트가 처리할 작업을 설명하세요...",
		startButton: "세션 시작",
		starting: "시작 중...",
	},

	// Prompt Input
	promptInput: {
		placeholderDisabled: "작업을 만들거나 선택하여 시작하세요...",
		placeholder: "에이전트가 처리할 내용을 설명하세요...",
		stopSession: "세션 중지",
		sendPrompt: "프롬프트 보내기",
	},

	// Common
	common: {
		close: "닫기",
		cancel: "취소",
		save: "저장",
		delete: "삭제",
		loading: "로드 중...",
		edit: "편집",
		add: "추가",
		refresh: "새로고침",
		back: "뒤로",
	},

	// App
	app: {
		noMessagesYet: "아직 메시지가 없습니다",
		startConversation: "AICowork와 대화를 시작하세요",
		beginningOfConversation: "대화의 시작",
		loadingMessages: "로드 중...",
		newMessages: "새 메시지",
	},

	// Deletion Confirmation
	deletion: {
		title: "⚠️ 삭제 작업 확인",
		subtitle: "AI가 삭제 작업을 수행하려고 합니다",
		description: "AI가 삭제 작업을 수행하려고 합니다. 이 작업은 파일 또는 디렉토리를 영구적으로 삭제할 수 있습니다. 명령 내용을 신중하게 확인하세요.",
		commandLabel: "실행할 명령:",
		unknownCommand: "알 수 없는 명령",
		warning: "경고: 삭제 작업은 실행 취소할 수 없습니다. 이 명령의 결과를 이해하고 있는지 확인하세요.",
		allow: "실행 허용",
		deny: "작업 거부",
		deniedMessage: "사용자가 삭제 작업을 거부했습니다",
	},

	// Event Card
	events: {
		sessionResult: "세션 결과",
		duration: "소요 시간",
		usage: "사용량",
		cost: "비용",
		input: "입력",
		output: "출력",
		collapse: "접기",
		showMoreLines: "{{count}}줄 더 표시",
		systemInit: "시스템 초기화",
		user: "사용자",
		assistant: "어시스턴트",
		thinking: "생각 중",
		sessionId: "세션 ID",
		modelName: "모델 이름",
		permissionMode: "권한 모드",
		workingDirectory: "작업 디렉토리",
	},
};
