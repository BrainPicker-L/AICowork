/**
 * i18n 国际化配置
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// 导入语言资源
import en from "./locales/en";
import zh from "./locales/zh";
import zhTW from "./locales/zh-TW";
import ja from "./locales/ja";
import ko from "./locales/ko";
import es from "./locales/es";
import fr from "./locales/fr";
import de from "./locales/de";
import ru from "./locales/ru";
import pt from "./locales/pt";

const resources = {
	en: { translation: en },
	zh: { translation: zh },
	'zh-TW': { translation: zhTW },
	ja: { translation: ja },
	ko: { translation: ko },
	es: { translation: es },
	fr: { translation: fr },
	de: { translation: de },
	ru: { translation: ru },
	pt: { translation: pt },
};

/**
 * 获取保存的语言设置或使用系统默认语言
 */
function getInitialLanguage(): string {
	// 支持的语言代码
	const supportedLangs = ['en', 'zh', 'zh-TW', 'ja', 'ko', 'es', 'fr', 'de', 'ru', 'pt'];

	// 尝试从 localStorage 获取
	try {
		const saved = localStorage.getItem('i18nextLng');
		if (saved && supportedLangs.includes(saved)) {
			return saved;
		}
	} catch {
		// localStorage 可能不可用
	}

	// 使用系统语言
	const systemLang = navigator.language || 'en';

	// 检查完全匹配
	if (supportedLangs.includes(systemLang)) {
		return systemLang;
	}

	// 检查语言前缀匹配（如 zh-CN -> zh, zh-TW -> zh-TW）
	if (systemLang.startsWith('zh')) {
		return systemLang.includes('TW') || systemLang.includes('HK') ? 'zh-TW' : 'zh';
	}
	if (systemLang.startsWith('ja')) return 'ja';
	if (systemLang.startsWith('ko')) return 'ko';
	if (systemLang.startsWith('es')) return 'es';
	if (systemLang.startsWith('fr')) return 'fr';
	if (systemLang.startsWith('de')) return 'de';
	if (systemLang.startsWith('ru')) return 'ru';
	if (systemLang.startsWith('pt')) return 'pt';

	// 默认英语
	return 'en';
}

i18n
	// 将 i18next 传递给 react-i18next
	.use(initReactI18next)
	// 初始化 i18next
	.init({
		resources,
		lng: getInitialLanguage(),
		fallbackLng: "en",
		debug: false,

		interpolation: {
			escapeValue: false, // React 已经做了 XSS 防护
		},
	});

export default i18n;
