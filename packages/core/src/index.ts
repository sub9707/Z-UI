import type { StoreApi } from "zustand";
import { registerStore, getStore } from "./registry";
import { ClientMessage, ServerMessage } from "./protocol";

export type InitZuiOptions = {
    port?: number;
};

let ws: WebSocket | null = null;
const pendingStoreNames: string[] = [];
let isApplyingRemoteUpdate = false;

const send = (message: ServerMessage): void => {
    if (ws && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(message));
    }
};

const sendStoreInit = (name: string): void => {
    const storeEntry = getStore(name);
    if (!storeEntry) return;

    if (ws && ws.readyState === ws.OPEN) {
        send({
            type: "STORE_REGISTER",
            name,
            initialState: storeEntry.getState(),
            actions: storeEntry.actions
        });
    } else {
        pendingStoreNames.push(name);
    }
};

const zuiImpl = <T>(name: string, store: StoreApi<T>): void => {
    registerStore({
        name,
        getState: store.getState,
        setState: (patch) => store.setState(patch as Partial<T>, false),
        actions: Object.keys(store.getState() as object).filter(
            (key) => typeof (store.getState() as Record<string, unknown>)[key] === "function"
        )
    });

    sendStoreInit(name);

    store.subscribe((state) => {
        if (!isApplyingRemoteUpdate) {
            send({
                type: "STORE_UPDATE",
                name,
                newState: state,
                action: "",
                timestamp: Date.now()
            });
        }
        console.log("[Z-UI]", name, "->", state);
    });
};

const noop = <T>(name: string, store: StoreApi<T>): void => {};

export const zui = process.env.NODE_ENV !== "production" ? zuiImpl : noop;

const initZuiImpl = (options: InitZuiOptions = {}): void => {
    if (ws) return;

    const port = options.port ?? 3274;
    ws = new WebSocket(`ws://localhost:${port}`);

    ws.onopen = () => {
        while (pendingStoreNames.length > 0) sendStoreInit(pendingStoreNames.shift()!);
    };

    ws.onmessage = (e) => {
        const msg = JSON.parse(e.data) as ClientMessage;

        if (msg.type === "SET_STATE") {
            const storeEntry = getStore(msg.name);
            if (!storeEntry) return;

            isApplyingRemoteUpdate = true;
            storeEntry.setState(msg.newState);
            isApplyingRemoteUpdate = false;
        }
    };
};

export const initZui = process.env.NODE_ENV !== "production" ? initZuiImpl : () => {};
