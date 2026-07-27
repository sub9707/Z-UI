import { ClientMessage, ServerMessage } from "./protocol";
import { WebSocketServer } from "ws";
import pc from "picocolors";

const brand = (text: string): string =>
    pc.isColorSupported ? `\x1b[1m\x1b[38;2;245;158;11m${text}\x1b[0m` : text;

const prefix = brand("[Z-UI]");

export type LogLevel = "silent" | "info" | "verbose";

const createLogger = (level: LogLevel) => ({
    info: (...args: unknown[]) => {
        if (level !== "silent") console.log(...args);
    },
    event: (...args: unknown[]) => {
        if (level === "verbose") console.log(...args);
    },
    warn: (...args: unknown[]) => {
        if (level !== "silent") console.warn(...args);
    },
    error: (...args: unknown[]) => {
        if (level !== "silent") console.error(...args);
    },
});

export interface ZuiServer {
    broadcast(message: ServerMessage): void;
    onMessage(handler: (message: ClientMessage) => void): void;
    closeServer(): void;
}

let zuiServerInstance: ZuiServer | null = null;

export const createZuiServer = (options?: { port?: number; logLevel?: LogLevel }): ZuiServer => {
    const level = options?.logLevel ?? "info";
    const log = createLogger(level);

    if (zuiServerInstance) {
        log.warn(prefix, pc.yellow("Server is already running. Returning existing instance."));
        return zuiServerInstance;
    }

    const wss = new WebSocketServer({ port: options?.port ?? 3274 });

    let messageHandler: (message: ClientMessage) => void = () => { };

    wss.on("listening", () => {
        log.info(prefix, pc.gray("Server running on"), pc.bold(`ws://localhost:${wss.options.port}`));
        if (level === "info") {
            log.info(prefix, pc.gray("Tip: pass { logLevel: 'verbose' } to zuiPlugin() to see connection/event logs"));
        }
    });
    wss.on("connection", (ws) => {
        log.event(prefix, pc.gray("Client connected"));

        ws.on("message", (message) => {
            try {
                messageHandler(JSON.parse(message.toString()));
            } catch (e) {
                log.error(prefix, pc.red("Error parsing client message:"), e);
            }
        });

        ws.on("close", () => {
            log.event(prefix, pc.gray("Client disconnected"));
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