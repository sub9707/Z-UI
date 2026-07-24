interface StoreEntry {
  name: string;
  getState: () => unknown;
  setState: (newState: unknown, replace?: boolean) => void;
  actions: string[];
  unsubscribe: () => void;
}

const registry = new Map<string, StoreEntry>();

function registerStore(entry: StoreEntry): void {
  const existing = registry.get(entry.name);
  if (existing) existing.unsubscribe();
  registry.set(entry.name, entry);
}

function unregisterStore(name: string): void {
  const entry = registry.get(name);
  if (!entry) return;

  entry.unsubscribe();
  registry.delete(name);
}

function getRegistry(): Map<string, StoreEntry> {
  return registry;
}

function getStore(name: string): StoreEntry | undefined {
  return registry.get(name);
}

export { registerStore, unregisterStore, getRegistry, getStore };
