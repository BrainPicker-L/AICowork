/**
 * 悬浮窗专用 preload：仅暴露接收 server-event 与唤起主窗口
 */
import electron from "electron";

electron.contextBridge.exposeInMainWorld("electron", {
  onServerEvent: (callback: (event: unknown) => void) => {
    const cb = (_: Electron.IpcRendererEvent, payload: string) => {
      try {
        callback(JSON.parse(payload));
      } catch (_) {}
    };
    electron.ipcRenderer.on("server-event", cb);
    return () => electron.ipcRenderer.off("server-event", cb);
  },
  focusMain: () => electron.ipcRenderer.invoke("floating-focus-main"),
  focusMainAndShowSession: (sessionId: string) =>
    electron.ipcRenderer.invoke("floating-focus-main-and-session", sessionId),
});
