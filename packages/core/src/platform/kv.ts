// A synchronous key-value storage port. Web backs `persistent` with
// localStorage and `session` with sessionStorage; native backs `persistent`
// with react-native-mmkv (also synchronous, which matters — some call sites
// read during render/store-init) and `session` with an in-memory Map that's
// deliberately cleared on process restart.
export interface KVStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  /** Enumerate all keys — needed by call sites that GC their own stale keys. */
  keys(): string[];
}

function memoryKv(): KVStore {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => { store.set(key, value); },
    removeItem: (key) => { store.delete(key); },
    clear: () => { store.clear(); },
    keys: () => Array.from(store.keys()),
  };
}

let persistentStore: KVStore = memoryKv();
let sessionStore: KVStore = memoryKv();

export function setStores(persistent: KVStore, session: KVStore): void {
  persistentStore = persistent;
  sessionStore = session;
}

export const kv = {
  get persistent(): KVStore { return persistentStore; },
  get session(): KVStore { return sessionStore; },
};
