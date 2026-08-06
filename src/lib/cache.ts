/**
 * qwikBite Production-Grade Caching Utility
 * Senior Performance Engineer Implementation
 */

type CacheEntry<T> = {
  data: T;
  expiry: number;
};

class GlobalCache {
  private static instance: GlobalCache;
  private store: Map<string, CacheEntry<unknown>> = new Map();

  private constructor() {
    // Periodic cleanup of expired keys every 30 seconds
    if (typeof window === "undefined") {
      setInterval(() => this.cleanup(), 30 * 1000);
    }
  }

  public static getInstance(): GlobalCache {
    if (!GlobalCache.instance) {
      GlobalCache.instance = new GlobalCache();
    }
    return GlobalCache.instance;
  }

  /**
   * Set a value in the cache with a specific TTL (seconds)
   */
  public set<T>(key: string, data: T, ttlSeconds: number): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { data, expiry });
  }

  /**
   * Get a value from cache
   */
  public get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Delete a specific key
   */
  public del(key: string): void {
    if (this.store.has(key)) {
      this.store.delete(key);
    }
  }

  /**
   * Clear keys matching a pattern
   */
  public clearPattern(pattern: string): void {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(pattern)) {
        this.store.delete(key);
        count++;
      }
    }
    if (count > 0) {
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiry) {
        this.store.delete(key);
      }
    }
  }
}

export const cache = GlobalCache.getInstance();
