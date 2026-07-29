interface StoreSnapShot {
    name: string;
    currentState: unknown;
    actions: string[];
}

interface SnapshotRecord {
    saveID: number;
    timeStamp: number;
    label: string;
    snapshot: Record<string, unknown>;
}

interface ZuiState {
    stores: Record<string, StoreSnapShot>;
    selectedStore: string | null;
    snapshots: SnapshotRecord[];
}

interface ZuiActions {
    upsertStore: (name: string, state: unknown, actions?: string[]) => void;
    removeStore: (name: string) => void;
    selectStore: (name: string) => void;
    saveSnapshot: (label: string) => void;
    deleteSnapshot: (saveID: number) => void;
}

import { create } from "zustand";

export const useZuiStore = create<ZuiState & ZuiActions>()((set) => ({
    stores: {},
    selectedStore: null,
    snapshots: [],

    upsertStore: (name, currentState, actions) => {
        set((state) => {
            const existing = state.stores[name];
            return {
                stores: {
                    ...state.stores,
                    [name]: {
                        name,
                        currentState,
                        actions: actions ?? existing?.actions ?? [],
                    }
                }
            };
        });
    },
    removeStore: (name) => {
        set((state) => {
            const { [name]: _removed, ...rest } = state.stores;
            return {
                stores: rest,
                selectedStore: state.selectedStore === name ? null : state.selectedStore,
            };
        });
    },
    selectStore: (name) => {
        set({ selectedStore: name });
    },
    saveSnapshot: (label) => {
        set((state) => {
            const snapshot = Object.fromEntries(
                Object.entries(state.stores).map(([name, entry]) => [name, entry.currentState])
            );
            const record: SnapshotRecord = {
                saveID: Date.now(),
                timeStamp: Date.now(),
                label,
                snapshot,
            };
            return { snapshots: [...state.snapshots, record] };
        });
    },
    deleteSnapshot: (saveID) => {
        set((state) => ({
            snapshots: state.snapshots.filter((record) => record.saveID !== saveID),
        }));
    },
}));