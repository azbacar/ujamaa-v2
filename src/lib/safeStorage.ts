/**
 * Wrapper localStorage tolérant aux erreurs (Safari iOS privé, quota dépassé, etc.)
 * Ne throw jamais — retourne null/false en cas d'échec.
 */
export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): boolean {
    try {
      if (typeof window === 'undefined') return false;
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  removeItem(key: string): boolean {
    try {
      if (typeof window === 'undefined') return false;
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  clear(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      window.localStorage.clear();
      return true;
    } catch {
      return false;
    }
  },
};
