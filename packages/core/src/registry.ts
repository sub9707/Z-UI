interface StoreEntry{
    name: string;
    getState: ()=> unknown;
    setState: (newState: unknown)=> void;
    actions: string[];
}

let registry: Map<string, StoreEntry> = new Map();

function registerStore(entry: StoreEntry): void {
  // registry에 추가
  registry.set(entry.name, entry);
}

function unregisterStore(name: string): void {
  // registry에서 제거
  registry.delete(name);
}

function getRegistry(): Map<string, StoreEntry> {
  // registry 자체 반환
  return registry;
}

function getStore(name: string): StoreEntry | undefined {
  // registry에서 이름으로 조회
  return registry.get(name);
}

export { registerStore, unregisterStore, getRegistry, getStore };