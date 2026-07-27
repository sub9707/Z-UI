import { ClientMessage, ServerMessage } from "./protocol";
import { WebSocketServer } from "ws";

export interface ZuiServer {
    broadcast(message: ServerMessage): void;
    onMessage(handler: (message: ClientMessage) => void): void;
    closeServer(): void;
}

let zuiServerInstance: ZuiServer | null = null;

export const createZuiServer = (options?: { port?: number }): ZuiServer => {
    if (zuiServerInstance) {
        console.warn("[Z-UI] Server is already running. Returning existing instance.");
        return zuiServerInstance;
    }

    const wss = new WebSocketServer({ port: options?.port ?? 3274 });

    let messageHandler: (message: ClientMessage) => void = () => { };

    wss.on("listening", () => {
        console.log(`[Z-UI] Server running on ws://localhost:${wss.options.port}`);
    });
    wss.on("connection", (ws) => {
        console.log("[Z-UI] Client connected");

        ws.on("message", (message) => {
            try {
                messageHandler(JSON.parse(message.toString()));
            } catch (e) {
                console.error("[Z-UI] Error parsing client message:", e);
            }
        });

        ws.on("close", () => {
            console.log("[Z-UI] Client disconnected");
        });
    });

    const serverInstance: ZuiServer = {
        broadcast(message: ServerMessage) {
            const messageString = JSON.stringify(message);
            wss.clients.forEach((client) => {
                if (client.readyState === client.OPEN) {
                    client.send(messageString);
                }
            });
        },
        onMessage(handler: (message: ClientMessage) => void) {
            messageHandler = handler;
        },
        closeServer() {
            wss.close();
        }
    }

    messageHandler = (message)=>{
        serverInstance.broadcast(message as unknown as ServerMessage);
    }

    zuiServerInstance = serverInstance;


    return serverInstance
}