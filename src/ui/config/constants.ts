/**
 * @author      Alan
 * @copyright   AGCPA v3.0
 * @created     2026-01-20
 * @Email       None
 *
 * 前端常量配置
 * 统一管理 UI 尺寸、默认值、动画时间等常量
 */

// ==================== API 配置 ====================

export const APP_CONFIG = {
  /** API 配置帮助文档 URL */
  helpUrl: 'https://ima.qq.com/note/share/_AwZPbuK9wucK5gWaVdjNQ?channel=4',
} as const;

// ==================== 滚动相关 ====================

/** 滚动触发阈值（像素） */
export const SCROLL_THRESHOLD = 50;

/** 最大显示行数 */
export const MAX_ROWS = 12;

/** 每行高度（像素） */
export const LINE_HEIGHT = 21;

/** 最大高度 = 行数 × 行高 */
export const MAX_HEIGHT = MAX_ROWS * LINE_HEIGHT;

// ==================== 默认值 ====================

/** 默认允许的工具列表 */
export const DEFAULT_ALLOWED_TOOLS = "Read,Edit,Bash";

/** 默认工作目录限制 */
export const DEFAULT_CWD_LIMIT = 8;

// ==================== 动画时间 ====================

/** 消息显示延迟（毫秒） */
export const MESSAGE_DISPLAY_DELAY = 500;

/** 滚动检查间隔（毫秒） */
export const SCROLL_CHECK_INTERVAL = 100;

/** 部分消息清除延迟（毫秒） */
export const PARTIAL_MESSAGE_CLEAR_DELAY = 500;

/** 滚动恢复延迟（毫秒） */
export const SCROLL_RESTORE_DELAY = 100;

// ==================== UI 尺寸 ====================

/** 侧边栏宽度（像素） */
export const SIDEBAR_WIDTH = 280;

/** 新消息按钮底部偏移（像素） */
export const NEW_MESSAGE_BUTTON_BOTTOM_OFFSET = 112;

/** 全局错误弹窗底部偏移（像素） */
export const GLOBAL_ERROR_BOTTOM_OFFSET = 96;

// ==================== Z-Index 层级 ====================

/** 新消息按钮层级 */
export const Z_INDEX_NEW_MESSAGE_BUTTON = 40;

/** 全局错误弹窗层级 */
export const Z_INDEX_GLOBAL_ERROR = 50;

// ==================== 会话状态 ====================

/** 会话状态枚举 */
export const SESSION_STATUS = {
  IDLE: "idle",
  RUNNING: "running",
  COMPLETED: "completed",
  ERROR: "error",
} as const;

/** 会话状态类型 */
export type SessionStatus = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];
