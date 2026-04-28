/**
 * Vitest setup — environnement node + minimal browser globals utiles pour nos tests.
 * On reste en `environment: "node"` (cf. vitest.config.ts) car nos tests sont logiques :
 * pas de DOM réel requis.
 */

// Stub léger de localStorage (compat node)
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(k: string) {
    return this.store.has(k) ? this.store.get(k)! : null;
  }
  key(i: number) {
    return Array.from(this.store.keys())[i] ?? null;
  }
  removeItem(k: string) {
    this.store.delete(k);
  }
  setItem(k: string, v: string) {
    this.store.set(k, String(v));
  }
}

const g = globalThis as any;
if (typeof g.window === "undefined") {
  g.window = g;
}
if (typeof g.localStorage === "undefined") {
  g.localStorage = new MemoryStorage();
  g.window.localStorage = g.localStorage;
}
if (typeof g.sessionStorage === "undefined") {
  g.sessionStorage = new MemoryStorage();
  g.window.sessionStorage = g.sessionStorage;
}
if (typeof g.CustomEvent === "undefined") {
  g.CustomEvent = class<T> {
    type: string;
    detail: T;
    constructor(type: string, init?: { detail?: T }) {
      this.type = type;
      this.detail = (init?.detail as T) ?? (undefined as unknown as T);
    }
  };
}
if (typeof g.window.dispatchEvent === "undefined") {
  const listeners = new Map<string, Set<(e: any) => void>>();
  g.window.addEventListener = (type: string, cb: (e: any) => void) => {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type)!.add(cb);
  };
  g.window.removeEventListener = (type: string, cb: (e: any) => void) => {
    listeners.get(type)?.delete(cb);
  };
  g.window.dispatchEvent = (event: any) => {
    listeners.get(event.type)?.forEach((cb) => cb(event));
    return true;
  };
}

// Stub __APP_VERSION__ injecté normalement par Vite
if (typeof (globalThis as any).__APP_VERSION__ === "undefined") {
  (globalThis as any).__APP_VERSION__ = "test-v1";
}
