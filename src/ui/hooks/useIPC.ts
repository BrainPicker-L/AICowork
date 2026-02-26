import { useCallback, useEffect, useRef, useState } from "react";
import type { ServerEvent, ClientEvent } from "../types";

export function useIPC(onEvent: (event: ServerEvent) => void) {
  const [connected, setConnected] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  // 使用 ref 保持最新的回调引用，避免 IPC 监听器随 onEvent 重建而反复取消/订阅
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    // 安全检查：确保 window.electron 已加载
    if (!window.electron) {
      console.warn('[IPC] window.electron is not available yet, retrying...');
      const timer = setTimeout(() => {
        setConnected(false);
      }, 100);
      return () => clearTimeout(timer);
    }

    // 只订阅一次，通过 ref 间接调用始终拿到最新的 onEvent
    const unsubscribe = window.electron.onServerEvent((event: ServerEvent) => {
      onEventRef.current(event);
    });
    
    unsubscribeRef.current = unsubscribe;
    setConnected(true);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setConnected(false);
    };
  }, []); // 不再依赖 onEvent，只在挂载/卸载时订阅/取消

  const sendEvent = useCallback((event: ClientEvent) => {
    if (!window.electron) {
      console.error('[IPC] window.electron is not available');
      return;
    }
    window.electron.sendClientEvent(event);
  }, []);

  return { connected, sendEvent };
}
