/**
 * 语言检测工具
 * 检测用户输入的语言并返回语言首选项提示
 */

/**
 * 支持的语言类型
 */
export type Language = 'zh' | 'en' | 'ja' | 'ko' | 'unknown';

/**
 * 语言检测结果
 */
export interface LanguageDetectionResult {
  /** 检测到的语言 */
  language: Language;
  /** 语言名称 */
  languageName: string;
  /** 语言偏好提示（用于添加到 prompt） */
  preferenceHint: string;
}

/**
 * 语言特征模式
 * 基于字符范围和常见词汇模式进行简单检测
 */
const LANGUAGE_PATTERNS: Record<Language, RegExp[]> = {
  // 中文：CJK 统一汉字范围
  zh: [
    /[\u4e00-\u9fff]/,  // 基本汉字
    /[\u3400-\u4dbf]/,  // 扩展A
  ],
  // 英文：基本拉丁字母
  en: [
    /^[a-zA-Z\s.,!?'"()-]+$/,
  ],
  // 日文：平假名、片假名、汉字
  ja: [
    /[\u3040-\u309f]/,  // 平假名
    /[\u30a0-\u30ff]/,  // 片假名
  ],
  // 韩文：韩文字母
  ko: [
    /[\uac00-\ud7af]/,  // 韩文音节
    /[\u1100-\u11ff]/,  // 韩文字母
  ],
  // 未知
  unknown: [],
};

/**
 * 语言偏好提示模板
 */
const LANGUAGE_HINTS: Record<Language, string> = {
  zh: '请使用简体中文回复。',
  en: 'Please respond in English.',
  ja: '日本語で回答してください。',
  ko: '한국어로 답변해 주세요.',
  unknown: '',
};

/**
 * 检测文本语言
 */
export function detectLanguage(text: string): LanguageDetectionResult {
  // 去除首尾空白
  const trimmedText = text.trim();

  if (!trimmedText) {
    return createResult('unknown');
  }

  // 统计各语言特征出现次数
  const scores: Record<Language, number> = {
    zh: 0,
    en: 0,
    ja: 0,
    ko: 0,
    unknown: 0,
  };

  // 检测中文
  const zhMatches = trimmedText.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g);
  if (zhMatches) {
    scores.zh = zhMatches.length;
  }

  // 检测日文（平假名/片假名，排除汉字）
  const jaMatches = trimmedText.match(/[\u3040-\u309f\u30a0-\u30ff]/g);
  if (jaMatches) {
    scores.ja = jaMatches.length;
  }

  // 检测韩文
  const koMatches = trimmedText.match(/[\uac00-\ud7af\u1100-\u11ff]/g);
  if (koMatches) {
    scores.ko = koMatches.length;
  }

  // 检测英文（拉丁字母）
  const enMatches = trimmedText.match(/[a-zA-Z]/g);
  if (enMatches) {
    scores.en = enMatches.length;
  }

  // 找出得分最高的语言
  let detectedLanguage: Language = 'unknown';
  let maxScore = 0;

  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLanguage = lang as Language;
    }
  }

  // 如果最高分低于阈值，视为未知语言
  if (maxScore < trimmedText.length * 0.2) {
    detectedLanguage = 'unknown';
  }

  return createResult(detectedLanguage);
}

/**
 * 创建语言检测结果
 */
function createResult(language: Language): LanguageDetectionResult {
  const languageNames: Record<Language, string> = {
    zh: '简体中文',
    en: 'English',
    ja: '日本語',
    ko: '한국어',
    unknown: '未知',
  };

  return {
    language,
    languageName: languageNames[language],
    preferenceHint: LANGUAGE_HINTS[language],
  };
}

/**
 * 为 prompt 添加语言偏好提示
 * @param prompt 原始 prompt
 * @param detectedLanguage 检测到的语言（可选，如果不提供则自动检测）
 * @returns 添加了语言提示的 prompt
 */
export function addLanguagePreference(
  prompt: string,
  detectedLanguage?: Language
): string {
  const detection = detectedLanguage
    ? createResult(detectedLanguage)
    : detectLanguage(prompt);

  // 如果检测到明确语言且不是未知，添加语言偏好提示
  if (detection.language !== 'unknown' && detection.preferenceHint) {
    return `${detection.preferenceHint}\n\n${prompt}`;
  }

  return prompt;
}
