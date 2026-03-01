/**
 * 全局 Fn 键监听（主进程）：窗口最小化/失焦时仍可触发录音。
 * 使用 node-global-key-listener 监听 Fn 的 keydown/keyup，通过独立 IPC 下发到主窗口渲染进程。
 * 打包后 Mac 上二进制在 asar 内无法执行，需解包并显式传入 serverPath。
 */

import type { BrowserWindow } from "electron";
import { createRequire } from "module";
import path from "path";
import { app } from "electron";
import { canStartVoiceTask } from "../storage/voice-store.js";
import { log } from "../logger.js";

const require = createRequire(import.meta.url);

type GlobalKeyboardListenerInstance = {
  addListener: (cb: (e: { name: string; state: string }, down: Record<string, boolean>) => void) => void | Promise<void>;
  removeListener: (cb: (e: { name: string; state: string }, down: Record<string, boolean>) => void) => void;
  kill: () => void;
};

let listenerInstance: GlobalKeyboardListenerInstance | null = null;
let boundHandler: ((e: { name: string; state: string }, down: Record<string, boolean>) => void) | null = null;
let mainWindowRef: BrowserWindow | null = null;

/** Fn 键在 node-global-key-listener 中可能的名字（不同系统/键盘不一） */
const FN_KEY_NAMES = new Set(["FN", "Fn", "fn", "FUNCTION", "Function"]);

function isFnKey(e: { name: string }): boolean {
  return FN_KEY_NAMES.has(e.name);
}

/** 打包后 asar 内无法执行子进程二进制，返回解包后的 MacKeyServer 路径 */
function getMacKeyServerPath(): string | undefined {
  const appPath = app.getAppPath();
  if (!appPath.includes(".asar")) return undefined;
  const unpackedRoot = path.join(path.dirname(appPath), "app.asar.unpacked");
  return path.join(unpackedRoot, "node_modules", "node-global-key-listener", "bin", "MacKeyServer");
}

function sendToRenderer(win: BrowserWindow | null, type: "voice-task.fn-key-down" | "voice-task.fn-key-up"): void {
  if (!win || win.isDestroyed()) return;
  try {
    win.webContents.send("voice-fn-key", type === "voice-task.fn-key-down" ? "down" : "up");
  } catch (err) {
    log.warn("[voice-fn-global] Send to renderer failed", err);
  }
}

/**
 * 更新全局 Fn 监听：根据当前语音设置启用或关闭监听。
 * 在 setFnVoiceEnabled 变更或窗口就绪后调用。
 */
export function updateVoiceFnGlobalListener(win: BrowserWindow | null): void {
  mainWindowRef = win;
  const shouldListen = Boolean(win && !win.isDestroyed() && canStartVoiceTask());

  if (listenerInstance && boundHandler) {
    try {
      listenerInstance.removeListener(boundHandler);
      listenerInstance.kill();
    } catch (_) {}
    listenerInstance = null;
    boundHandler = null;
  }

  if (!shouldListen) return;

  let GlobalKeyboardListener: new (config?: { mac?: { serverPath?: string } }) => GlobalKeyboardListenerInstance;
  try {
    GlobalKeyboardListener = require("node-global-key-listener").GlobalKeyboardListener;
  } catch (err) {
    log.warn("[voice-fn-global] node-global-key-listener not available, global Fn disabled", err);
    return;
  }

  const serverPath = getMacKeyServerPath();
  const config = serverPath ? { mac: { serverPath } } : undefined;

  try {
    const listener = new GlobalKeyboardListener(config);
    const handler = (e: { name: string; state: string }) => {
      if (!isFnKey(e)) return;
      if (e.state === "DOWN") {
        sendToRenderer(mainWindowRef, "voice-task.fn-key-down");
      } else if (e.state === "UP") {
        sendToRenderer(mainWindowRef, "voice-task.fn-key-up");
      }
    };
    const addResult = listener.addListener(handler);
    listenerInstance = listener;
    boundHandler = handler;
    if (typeof (addResult as Promise<unknown>)?.then === "function") {
      (addResult as Promise<void>).then(
        () => log.info("[voice-fn-global] Global Fn listener registered (works when window minimized)"),
        (err: unknown) => log.warn("[voice-fn-global] Failed to start global Fn listener", err)
      );
    } else {
      log.info("[voice-fn-global] Global Fn listener registered (works when window minimized)");
    }
  } catch (err) {
    log.warn("[voice-fn-global] Failed to start global Fn listener", err);
  }
}

/**
 * 停止全局 Fn 监听（应用退出或不再需要时调用）
 */
export function stopVoiceFnGlobalListener(): void {
  if (listenerInstance && boundHandler) {
    try {
      listenerInstance.removeListener(boundHandler);
      listenerInstance.kill();
    } catch (_) {}
    listenerInstance = null;
    boundHandler = null;
    mainWindowRef = null;
    log.info("[voice-fn-global] Global Fn listener stopped");
  }
}
