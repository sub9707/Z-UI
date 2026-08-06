import { create } from "zustand";

interface StoreSnapshot {
  name: string;
  currentState: unknown;
  initialState: unknown;
  actions: string[];
  color?: string | undefined;
}

interface SnapshotRecord {
  saveID: number;
  timeStamp: number;
  label: string;
  snapshot: Record<string, unknown>;
}

interface ActionResult {
  name?: string;
  success: boolean;
  reason?: string;
}

interface UpdateLogEntry {
  id: string;
  kind: "update";
  store: string;
  action: string;
  before: unknown;
  after: unknown;
  timestamp: number;
}

interface RestoreLogEntry {
  id: string;
  kind: "restore";
  label: string;
  stores: string[];
  timestamp: number;
}

type ActionLogEntry = UpdateLogEntry | RestoreLogEntry;

const ACTION_LOG_LIMIT = 50;

interface DependencyEdge {
  id: string;
  source: string;
  target: string;
}

interface ZuiState {
  stores: Record<string, StoreSnapshot>;
  selectedStore: string | null;
  snapshots: SnapshotRecord[];
  actionResult: ActionResult | null;
  actionLog: ActionLogEntry[];
  dependencyEdges: DependencyEdge[];
}

interface ZuiActions {
  upsertStore: (
    name: string,
    state: unknown,
    actions?: string[],
    color?: string,
  ) => void;
  removeStore: (name: string) => void;
  selectStore: (name: string) => void;
  saveSnapshot: (label: string) => void;
  deleteSnapshot: (saveID: number) => void;
  setActionResult: (result: ActionResult | null) => void;
  addActionLog: (
    entry:
      | Omit<UpdateLogEntry, "id" | "timestamp">
      | Omit<RestoreLogEntry, "id" | "timestamp">,
  ) => void;
  addDependencyEdge: (source: string, target: string) => void;
  removeDependencyEdge: (id: string) => void;
}

export const useZuiStore = create<ZuiState & ZuiActions>()((set) => ({
  stores: {},
  selectedStore: null,
  snapshots: [],
  actionResult: null,
  actionLog: [],
  dependencyEdges: [],

  upsertStore: (name, currentState, actions, color) => {
    set((state) => {
      const existing = state.stores[name];
      return {
        stores: {
          ...state.stores,
          [name]: {
            name,
            currentState,
            initialState: existing?.initialState ?? currentState,
            actions: actions ?? existing?.actions ?? [],
            color: color ?? existing?.color,
          },
        },
      };
    });
  },
  removeStore: (name) => {
    set((state) => {
      const { [name]: _removed, ...rest } = state.stores;
      return {
        stores: rest,
        selectedStore:
          state.selectedStore === name ? null : state.selectedStore,
        dependencyEdges: state.dependencyEdges.filter(
          (edge) => edge.source !== name && edge.target !== name,
        ),
      };
    });
  },
  selectStore: (name) => {
    set({ selectedStore: name });
  },
  saveSnapshot: (label) => {
    set((state) => {
      const snapshot = Object.fromEntries(
        Object.entries(state.stores).map(([name, entry]) => [
          name,
          entry.currentState,
        ]),
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
  setActionResult: (result) => {
    set({ actionResult: result });
  },
  addActionLog: (entry) => {
    set((state) => {
      const record: ActionLogEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        ...entry,
      };
      return { actionLog: [record, ...state.actionLog].slice(0, ACTION_LOG_LIMIT) };
    });
  },
  addDependencyEdge: (source, target) => {
    if (source === target) return;
    set((state) => {
      const alreadyExists = state.dependencyEdges.some(
        (edge) => edge.source === source && edge.target === target,
      );
      if (alreadyExists) return state;
      return {
        dependencyEdges: [
          ...state.dependencyEdges,
          { id: crypto.randomUUID(), source, target },
        ],
      };
    });
  },
  removeDependencyEdge: (id) => {
    set((state) => ({
      dependencyEdges: state.dependencyEdges.filter((edge) => edge.id !== id),
    }));
  },
}));
