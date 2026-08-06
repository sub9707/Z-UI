import { useEffect, useRef, useState } from "react";
import { useZuiStore } from "../store/zuiStore";
import { getChangedKeys } from "../utils/diff";
import { consumeRestoring } from "../utils/restoreTracker";

type ConnectState = "connecting" | "connected" | "disconnected" | "error";

const useZuiSocket = () => {
  const [status, setStatus] = useState<ConnectState>("connecting");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const connect = () => {
      const wsPort =
        new URLSearchParams(window.location.search).get("wsPort") ?? "3274";
      const ws = new WebSocket(`ws://localhost:${wsPort}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        ws.send(JSON.stringify({ type: "REQUEST_STORE_LIST" }));
      };
      ws.onclose = () => {
        setStatus("disconnected");
        timeoutId = setTimeout(() => {
          connect();
        }, 3000);
      };
      ws.onerror = () => {
        setStatus("error");
      };
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);

        if (msg.type === "STORE_REGISTER") {
          useZuiStore
            .getState()
            .upsertStore(msg.name, msg.initialState, msg.actions);
        } else if (msg.type === "STORE_UPDATE") {
          const before = useZuiStore.getState().stores[msg.name]?.currentState;
          useZuiStore.getState().upsertStore(msg.name, msg.newState);
          const isRestore = consumeRestoring(msg.name);
          if (!isRestore && getChangedKeys(before, msg.newState).length > 0) {
            useZuiStore.getState().addActionLog({
              kind: "update",
              store: msg.name,
              action: msg.action,
              before,
              after: msg.newState,
            });
          }
        } else if (msg.type === "STORE_REMOVE") {
          useZuiStore.getState().removeStore(msg.name);
        } else if (msg.type === "STORE_ACTION_RESULT") {
          useZuiStore.getState().setActionResult({
            name: msg.name,
            success: msg.success,
            reason: msg.reason,
          });
        }
      };
    };

    connect();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      wsRef.current?.close();
    };
  }, []);

  const send = (message: unknown) => {
    wsRef.current?.send(JSON.stringify(message));
  };

  return { status, send };
};

export default useZuiSocket;
