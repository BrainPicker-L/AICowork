/**
 * 语音状态悬浮窗：独立于主窗口，始终置顶，展示 录音中 → 转写中 → 任务运行中 → 完成/失败
 */

import { BrowserWindow, screen } from "electron";
import { getFloatingPreloadPath, getFloatingWindowUrl } from "../pathResolver.js";
import { isDev, DEV_PORT } from "../util.js";
import { log } from "../logger.js";

const FLOATING_BALL_SIZE = 56;
const FLOATING_WIDTH = 260;
const FLOATING_HEIGHT = 160;
const MARGIN = 24;

let floatingWindow: BrowserWindow | null = null;

export function getFloatingWindow(): BrowserWindow | null {
  return floatingWindow;
}

/**
 * 创建悬浮窗（隐藏），在应用就绪时调用一次；尺寸预留气泡区域
 */
export function createFloatingWindow(): void {
  if (floatingWindow && !floatingWindow.isDestroyed()) return;

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const x = screenWidth - FLOATING_WIDTH - MARGIN;
  const y = screenHeight - FLOATING_HEIGHT - MARGIN;

  floatingWindow = new BrowserWindow({
    width: FLOATING_WIDTH,
    height: FLOATING_HEIGHT,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    fullscreenable: false,
    show: false,
    webPreferences: {
      preload: getFloatingPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  floatingWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  floatingWindow.setAlwaysOnTop(true, "floating");

  const url = getFloatingWindowUrl(DEV_PORT);
  floatingWindow.loadURL(url).catch((err) => {
    log.warn("[floating-window] Load URL failed", err);
  });

  floatingWindow.on("closed", () => {
    floatingWindow = null;
  });

  if (isDev()) {
    log.info("[floating-window] Created (hidden)");
  }
}

/**
 * 显示悬浮窗（仅在语音配置完成且已开启语音输入时调用）
 */
export function showFloatingWindow(): void {
  if (!floatingWindow || floatingWindow.isDestroyed()) {
    createFloatingWindow();
  }
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    floatingWindow.show();
    if (isDev()) log.info("[floating-window] Shown");
  }
}

/**
 * 隐藏悬浮窗
 */
export function hideFloatingWindow(): void {
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    floatingWindow.hide();
    if (isDev()) log.info("[floating-window] Hidden");
  }
}

/**
 * 关闭并销毁悬浮窗（应用退出时）
 */
export function destroyFloatingWindow(): void {
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    floatingWindow.destroy();
    floatingWindow = null;
    log.info("[floating-window] Destroyed");
  }
}
