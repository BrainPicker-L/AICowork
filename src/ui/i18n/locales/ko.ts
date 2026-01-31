/**
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
			feedback: "피드백",
			about: "정보",
			language: "언어",
			api: "API 설정",
			mcp: "MCP 설정",
			permissions: "권한",
			output: "출력 스타일",
			rules: "규칙",
			claudeMd: "Claude.md",
		},
		placeholder: {
			title: "설정",
			description: "구성하려면 왼쪽 메뉴에서 항목을 선택하세요",
		},
	},

	// Settings Sections
	help: {
		title: "도움말",
		subtitle: "도움말 및 문서 가져오기",
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
		tip: "힌트: 문제가 발생하면 먼저 자주 묻는 질문을 확인하거나 피드백 채널을 통해 문의해 주세요.",
		helpUrl: "https://ima.qq.com/note/share/_AwZPbuK9wucK5gWaVdjNQ?channel=4",
	},

	feedback: {
		title: "피드백",
		subtitle: "문제와 제안을 제출하여 개선에 도움을 주세요",
		bugReport: {
			title: "버그 보고",
			description: "GitHub에서 문제 보고서 제출",
			link: "GitHub로 이동",
			url: "https://github.com/BrainPicker-L/AICowork",
		},
		thankYou: "피드백 주셔서 감사합니다! 모든 피드백을 신중하게 검토하겠습니다.",
	},

	about: {
		title: "AICowork 정보",
		subtitle: "AI 협업 워크벤치——AICowork!",
		version: {
			title: "버전 정보",
			description: "버전 1.0.0",
		},
		techStack: {
			title: "기술 스택",
			description: "Electron + React + TypeScript + AI Agent SDK",
			electron: "• Electron - 크로스플랫폼 데스크톱 앱 프레임워크",
			react: "• React + TypeScript - 프론트엔드 프레임워크",
			tailwind: "• Tailwind CSS - 스타일링 프레임워크",
			claude: "• AI Agent SDK - AI 통합",
		},
		license: {
			title: "라이선스",
			description: "GNU Affero General Public License v3.0 (AGPL-3.0)",
		},
		tagline: "AICowork는 AI를 귀하의 작업 파트너로 만들어줍니다.",
	},

	language: {
		title: "언어",
		description: "인터페이스 표시 언어 선택",
		current: "현재 언어",
		switching: "전환 중...",
		hint: "언어 설정은 로컬에 저장되며 다음에 앱을 시작할 때 자동으로 적용됩니다.",
		tip: {
			label: "힌트",
			text: "언어 설정은 로컬에 저장되며 다음에 앱을 시작할 때 자동으로 적용됩니다.",
		},
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
		hintLabel: "힌트: ",
		docsLink: "문서",
		learnMore: "자세히 보기.",
		saveSuccess: "저장 성공",
		current: "현재",
		confirmDelete: "이 구성을 삭제하시겠습니까?",
		modelLimits: "모델 제한: max_tokens ∈ [{{min}}, {{max}}]",
		azure: {
			resourceName: "Azure 리소스 이름",
			deploymentName: "Azure 배포 이름",
			resourceNameRequired: "Azure 리소스 이름은 비워둘 수 없습니다",
			deploymentNameRequired: "Azure 배포 이름은 비워둘 수 없습니다",
			bothRequired: "Azure에는 리소스 이름과 배포 이름이 모두 필요합니다",
		},
	},

	mcp: {
		title: "MCP 설정",
		description: "Model Context Protocol 서버를 구성합니다. SDK는 자동으로 시작되어 도구를 등록합니다",
		noServers: "MCP 서버 구성이 없습니다",
		addServer: "+ 서버 추가",
		status: {
			enabled: "활성화됨",
			disabled: "비활성화됨",
		},
		templates: {
			title: "템플릿에서 추가",
		},
		form: {
			name: {
				label: "서버 이름",
				placeholder: "my-mcp-server",
			},
			displayName: {
				label: "표시 이름(선택 사항)",
				placeholder: "내 MCP 서버",
			},
			type: {
				label: "서버 유형",
				stdio: "stdio (표준 입출력)",
				sse: "SSE (서버 전송 이벤트)",
				streamableHttp: "Streamable HTTP",
			},
			command: {
				label: "명령",
				placeholder: "npx",
			},
			args: {
				label: "인수(공백으로 구분)",
				placeholder: "@modelcontextprotocol/server-github",
			},
			url: {
				label: "URL",
				placeholder: "https://example.com/mcp",
			},
			description: {
				label: "설명(선택 사항)",
				placeholder: "서버 기능 설명",
			},
			addTitle: "MCP 서버 추가",
			editTitle: "MCP 서버 편집",
		},
		view: {
			type: "유형",
			command: "명령",
			args: "인수",
			url: "URL",
			description: "설명",
		},
		actions: {
			save: "저장",
			saving: "저장 중...",
			edit: "편집",
			delete: "삭제",
			cancel: "취소",
		},
		errors: {
			deleteFailed: "삭제 실패",
			nameRequired: "서버 이름은 비워둘 수 없습니다",
			saveFailed: "저장 실패",
			toggleFailed: "상태 전환 실패",
			invalidNameFormat: "서버 이름에는 영문, 숫자, 밑줄, 하이픈만 사용할 수 있습니다",
			commandRequired: "stdio 유형 서버는 명령을 지정해야 합니다",
			urlRequired: "이 유형의 서버는 URL을 지정해야 합니다",
			invalidUrl: "잘못된 URL 형식입니다",
			saveSuccess: "저장 성공",
		},
		confirmDelete: "MCP 서버 \"{{name}}\"을(를) 삭제하시겠습니까?",
		hint: "힌트: MCP 서버 구성은 ~/.claude/settings.json에 저장됩니다. SDK는 구성된 MCP 서버를 자동으로 시작하고 도구를 세션에 등록합니다.",
		hintPath: "~/.claude/settings.json",
	},

	skills: {
		title: "스킬",
		description: "사용자 지정 스킬을 관리합니다. AI는 SKILL.md의 지침에 따라 자동으로 실행합니다",
		loading: "로드 중...",
		noSkills: "설치된 스킬이 없습니다",
		noSkillsHint: "~/.claude/skills/ 디렉토리에 스킬을 넣으면 자동으로 감지됩니다",
		openDirectory: "스킬 디렉토리 열기",
		source: {
			skill: "스킬",
			plugin: "플러그인",
		},
		hint: "스킬은 ~/.claude/skills/ 디렉토리에 저장됩니다. 각 스킬 폴더에는 SKILL.md 파일이 포함되어 있으며 AI는 내용을 기반으로 자동으로 실행합니다.",
	},

	plugins: {
		title: "플러그인",
		description: "설치된 플러그인 관리",
		noPlugins: "설치된 플러그인이 없습니다",
		status: {
			installed: "설치됨",
		},
		hint: "플러그인 명령 형식은 /plugin-name:command-name입니다.",
	},	hooks: {
		title: "후크",
		description: "이벤트 후크를 구성하여 특정 타이밍에 작업을 자동으로 트리거",
		postToolUse: {
			title: "PostToolUse",
			description: "도구 사용 후 트리거",
			noConfig: "구성 없음",
		},
		preToolUse: {
			title: "PreToolUse",
			description: "도구 사용 전 트리거",
			noConfig: "구성 없음",
		},
		addHook: "+ 후크 추가",
		hint: "힌트: 후크 구성은 저장되어 있습니다",
		hintPath: "~/.claude/settings.json",
		hintSuffix: ". SDK는 자동으로 구성된 후크를 로드하고 실행합니다.",
	},

	permissions: {
		title: "권한",
		description: "도구 권한 규칙을 구성하여 AI가 수행할 수 있는 작업을 제어",
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
		securityHint: "보안 힌트: Bash 및 파일 작업의 경우 도구 권한을 신중하게 부여하세요. 와일드카드 규칙을 사용하고 완전히 개방하지 않는 것이 좋습니다.",
	},

	output: {
		title: "출력 스타일",
		subtitle: "AI 출력 스타일 및 형식 구성",
		description: "출력 스타일 구성 기능은 개발 중입니다...",
		comingSoon: "곧 출시: 출력 형식, 코드 강조 표시 테마, Markdown 렌더링 옵션 등을 구성할 수 있습니다.",
	},

	recovery: {
		title: "세션 복구",
		subtitle: "이전 세션을 보고 다시 시작",
		description: "이전 세션을 다시 시작하여 대화를 계속하세요",
		loading: "로드 중...",
		refresh: "목록 새로고침",
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
		recover: "복구",
		hint: "세션 데이터는 로컬 데이터베이스에 저장됩니다. 세션을 다시 시작하면 전체 대화 기록이 로드됩니다.",
		hintWithCommand: "명령줄도 사용할 수 있습니다:",
	},

	rules: {
		title: "규칙",
		subtitle: "프로젝트 규칙 파일 관리 (.claude/rules/)",
		description: "프로젝트의 .claude/rules/ 디렉토리에서 사용자 지정 규칙 파일을 만들고 관리",
		noRules: "규칙 파일이 없습니다",
		createFromTemplate: "템플릿에서 만들기",
		createNew: "새 규칙 만들기",
		editor: {
			nameLabel: "규칙 이름",
			namePlaceholder: "예: coding-style",
			contentLabel: "규칙 내용 (Markdown)",
			contentPlaceholder: "규칙 내용을 입력하세요...",
			save: "규칙 저장",
			saving: "저장 중...",
			cancel: "취소",
		},
		templates: {
			title: "템플릿 선택",
			language: {
				name: "언어 규칙",
				description: "프로젝트에서 사용하는 프로그래밍 언어와 코딩 표준 지정",
			},
			codingStyle: {
				name: "코딩 스타일",
				description: "코드 포맷팅과 스타일 가이드라인 정의",
			},
			gitCommit: {
				name: "Git 커밋",
				description: "Git 커밋 메시지 형식과 표준 구성",
			},
		},
		confirmDelete: "규칙 \"{{name}}\"을(를) 삭제하시겠습니까?",
		deleted: "규칙을 삭제했습니다",
		saved: "규칙을 저장했습니다",
		hint: "규칙 파일은 프로젝트의 .claude/rules/ 디렉토리에 저장됩니다. 각 규칙은 Markdown 형식의 파일이며 AI는 규칙 내용에 따라 작업을 수행합니다.",
	},

	claudeMd: {
		title: "Claude.md",
		subtitle: "프로젝트 Claude 구성 관리 (CLAUDE.md)",
		description: "프로젝트 루트의 CLAUDE.md 파일에서 프로젝트 수준 AI 지침을 구성",
		status: {
			exists: "구성 파일이 존재합니다",
			missing: "구성 파일이 존재하지 않습니다",
			charCount: "{{count}}자",
			lastModified: "마지막 수정: {{date}}",
		},
		actions: {
			view: "현재 구성 보기",
			edit: "구성 편집",
			save: "구성 저장",
			saving: "저장 중...",
			delete: "구성 삭제",
			createFromTemplate: "템플릿에서 만들기",
			openDirectory: "디렉토리 열기",
		},
		templates: {
			title: "템플릿 선택",
			basic: {
				name: "기본 구성",
				description: "기본 프로젝트 정보를 포함하는 간단한 템플릿",
			},
			frontend: {
				name: "프론트엔드 프로젝트",
				description: "React/Vue/Next.js 등 프론트엔드 프로젝트용",
			},
			backend: {
				name: "백엔드 프로젝트",
				description: "Node.js/Python/FastAPI 등 백엔드 프로젝트용",
			},
		},
		editor: {
			label: "Claude.md 내용",
			placeholder: "여기에 프로젝트 구성 내용을 입력...",
			save: "구성 저장",
			cancel: "취소",
		},
		confirmDelete: "CLAUDE.md 구성 파일을 삭제하시겠습니까?",
		deleted: "구성 파일을 삭제했습니다",
		saved: "구성을 저장했습니다",
		hint: "CLAUDE.md 파일은 프로젝트 루트에 있으며 프로젝트 수준의 AI 동작 지침을 정의합니다. 이 파일은 전역 설정을 재정의합니다.",
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
		selectWorkingDir: "작업 디렉토리 선택",
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
