interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Get all keys
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

// Global cache instance
const globalCache = new SimpleCache();

// Clean up expired entries every minute
setInterval(() => {
  globalCache.cleanup();
}, 60 * 1000);

export class CacheService {
  // Cache keys for different data types
  static KEYS = {
    STAFF_LIST: (page: number, limit: number, search?: string, role?: string, status?: string) => 
      `staff:list:${page}:${limit}:${search || ''}:${role || ''}:${status || ''}`,
    STAFF_BY_ID: (id: string) => `staff:byId:${id}`,
    STAFF_STATS: () => 'staff:stats',
    MENU_LIST: (page: number, limit: number, category?: string, adminView?: boolean) => 
      `menu:list:${page}:${limit}:${category || 'all'}:${adminView ? 'admin' : 'user'}`,
    INVENTORY_LIST: (page: number, limit: number) => `inventory:list:${page}:${limit}`
  };

  // Cache staff list
  static cacheStaffList(data: unknown, page: number = 1, limit: number = 10, search?: string, role?: string, status?: string): void {
    const key = this.KEYS.STAFF_LIST(page, limit, search, role, status);
    globalCache.set(key, data, 2 * 60 * 1000); // 2 minutes for lists
  }

  // Get cached staff list
  static getCachedStaffList(page: number = 1, limit: number = 10, search?: string, role?: string, status?: string): unknown {
    const key = this.KEYS.STAFF_LIST(page, limit, search, role, status);
    return globalCache.get(key);
  }

  // Cache staff member by ID
  static cacheStaffById(data: unknown, id: string): void {
    const key = this.KEYS.STAFF_BY_ID(id);
    globalCache.set(key, data, 5 * 60 * 1000); // 5 minutes for individual records
  }

  // Get cached staff member by ID
  static getCachedStaffById(id: string): unknown {
    const key = this.KEYS.STAFF_BY_ID(id);
    return globalCache.get(key);
  }

  // Cache staff statistics
  static cacheStaffStats(data: unknown): void {
    const key = this.KEYS.STAFF_STATS();
    globalCache.set(key, data, 10 * 60 * 1000); // 10 minutes for stats
  }

  // Get cached staff statistics
  static getCachedStaffStats(): unknown {
    const key = this.KEYS.STAFF_STATS();
    return globalCache.get(key);
  }

  // Invalidate staff cache
  static invalidateStaffCache(id?: string): void {
    if (id) {
      // Invalidate specific staff member
      globalCache.delete(this.KEYS.STAFF_BY_ID(id));
    }
    
    // Invalidate all staff lists
    const keys = globalCache.keys().filter(key => key.startsWith('staff:list:'));
    keys.forEach(key => globalCache.delete(key));
    
    // Invalidate stats
    globalCache.delete(this.KEYS.STAFF_STATS());
  }

  // Invalidate menu cache
  static invalidateMenuCache(): void {
    const keys = globalCache.keys().filter(key => key.startsWith('menu:list:'));
    keys.forEach(key => globalCache.delete(key));
    console.log('♻️ Menu cache invalidated');
  }

  // Generic cache methods
  static set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    globalCache.set(key, data, ttl);
  }

  static get<T>(key: string): T | null {
    return globalCache.get<T>(key);
  }

  static delete(key: string): boolean {
    return globalCache.delete(key);
  }

  static clear(): void {
    globalCache.clear();
  }

  // Get cache statistics
  static getStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: globalCache.size(),
      keys: globalCache.keys()
    };
  }

  // Cache middleware for API responses
  static createCacheMiddleware(ttl: number = 5 * 60 * 1000) {
    return (key: string) => {
      return {
        get: () => this.get(key),
        set: (data: unknown) => this.set(key, data, ttl),
        invalidate: () => this.delete(key)
      };
    };
  }
}

export default CacheService;
