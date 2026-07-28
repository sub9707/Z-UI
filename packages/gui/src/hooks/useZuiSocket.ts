import { useEffect, useRef, useState } from "react";

type ConnectState = "connecting" | "connected" | "disconnected" | "error";

const useZuiSocket = () => {
    const [status, setStatus] = useState<ConnectState>("connecting");
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const wsPort = new URLSearchParams(window.location.search).get("wsPort") ?? "3274";
        const ws = new WebSocket(`ws://localhost:${wsPort}`);
        wsRef.current = ws;

        ws.onopen = () => {
            setStatus("connected");
            ws.send(JSON.stringify({ type: "REQUEST_STORE_LIST" }));
        };
        ws.onclose = () => {
            setStatus("disconnected");
        };
        ws.onerror = () => {
            setStatus("error");
        };
        ws.onmessage = (e) => {
            console.log("[Z-UI GUI] received:", JSON.parse(e.data));
        };

        return () => {
            ws.close();
        };
    }, []);

    const send = (message: unknown) => {
        wsRef.current?.send(JSON.stringify(message));
    };

    return { status, send };
};

export default useZuiSocket;
