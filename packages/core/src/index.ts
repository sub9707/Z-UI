import type { StoreApi } from "zustand";
import {
  registerStore,
  unregisterStore,
  getStore,
  getRegistry,
} from "./registry";
import { ClientMessage, ServerMessage } from "./protocol";
export type { ClientMessage, ServerMessage } from "./protocol";

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
      actions: storeEntry.actions,
    });
  } else {
    pendingStoreNames.push(name);
  }
};

const applyRemoteUpdate = (
  name: string,
  newState: unknown,
  replace?: boolean,
): void => {
  const storeEntry = getStore(name);
  if (!storeEntry) {
    send({
      type: "STORE_ACTION_RESULT",
      name,
      success: false,
      reason: "store not found",
    });
    return;
  }

  // replace 시 zustand state에 같이 있던 액션 함수 보존
  const patch = replace
    ? {
        ...Object.fromEntries(
          Object.entries(storeEntry.getState() as object).filter(
            ([, value]) => typeof value === "function",
          ),
        ),
        ...(newState as object),
      }
    : newState;

  isApplyingRemoteUpdate = true;
  storeEntry.setState(patch, replace);
  isApplyingRemoteUpdate = false;
};

const zuiImpl = <T>(name: string, store: StoreApi<T>): void => {
  const unsubscribe = store.subscribe((state) => {
    if (!isApplyingRemoteUpdate) {
      send({
        type: "STORE_UPDATE",
        name,
        newState: state,
        action: "",
        timestamp: Date.now(),
      });
    }
    console.log("[Z-UI]", name, "->", state);
  });

  registerStore({
    name,
    getState: store.getState,
    setState: (patch, replace) => store.setState(patch as Partial<T>, replace),
    actions: Object.keys(store.getState() as object).filter(
      (key) =>
        typeof (store.getState() as Record<string, unknown>)[key] ===
        "function",
    ),
    unsubscribe,
  });

  sendStoreInit(name);
};

const noop = <T>(_name: string, _store: StoreApi<T>): void => {};

export const zui = process.env.NODE_ENV !== "production" ? zuiImpl : noop;

const initZuiImpl = (options: InitZuiOptions = {}): void => {
  if (ws) return;

  const port = options.port ?? 3274;
  ws = new WebSocket(`ws://localhost:${port}`);

  ws.onopen = () => {
    while (pendingStoreNames.length > 0)
      sendStoreInit(pendingStoreNames.shift()!);
  };

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data) as ClientMessage | ServerMessage;

    if (msg.type === "SET_STATE") {
      applyRemoteUpdate(msg.name, msg.newState);
    } else if (msg.type === "RESTORE_SNAPSHOT") {
      applyRemoteUpdate(msg.name, msg.snapshot, true);
    } else if (msg.type === "REQUEST_STORE_LIST") {
      getRegistry().forEach((_storeEntry, name) => sendStoreInit(name));
    } else if (msg.type === "STORE_REMOVE") {
      unregisterStore(msg.name);
    }
  };
};

export const initZui =
  process.env.NODE_ENV !== "production" ? initZuiImpl : () => {};
