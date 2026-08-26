// ═══════════════════════════════════════════════════════════════════════
// REQUEST CACHING & DEDUPLICATION
// ═══════════════════════════════════════════════════════════════════════

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
};

type PendingPromise<T> = {
  promise: Promise<T>;
  timestamp: number;
};

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pending = new Map<string, PendingPromise<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get a cached value. Returns undefined if not found or expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.data as T;
  }

  /**
   * Set a cached value with optional TTL in milliseconds.
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Invalidate a specific cache key.
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a prefix.
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cached data.
   */
  clear(): void {
    this.cache.clear();
    this.pending.clear();
  }

  /**
   * Execute a request with deduplication.
   * If the same request is already in-flight, it will reuse the existing promise.
   * If the result is cached and not expired, it returns the cached value.
   */
  async dedup<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    // Check if there's already a pending request
    const pending = this.pending.get(key);
    if (pending) {
      return pending.promise;
    }

    // Create new request
    const promise = fetcher().then(data => {
      // Cache the result
      this.set(key, data, ttl);
      // Remove from pending
      this.pending.delete(key);
      return data;
    }).catch(error => {
      // Remove from pending on error too
      this.pending.delete(key);
      throw error;
    });

    this.pending.set(key, { promise, timestamp: Date.now() });
    return promise;
  }

  /**
   * Prefetch data into cache without awaiting.
   */
  prefetch<T>(key: string, fetcher: () => Promise<T>, ttl?: number): void {
    this.dedup(key, fetcher, ttl).catch(() => {
      // Silently ignore prefetch errors
    });
  }
}

// Singleton instance
export const requestCache = new RequestCache();

// Cache key generators
export const cacheKeys = {
  files: (userId: string, folderId: string | null, categoryFilter = "") => `files:${userId}:${folderId}:${categoryFilter}`,
  folders: (userId: string, parentId: string | null) => `folders:${userId}:${parentId}`,
  starred: (userId: string) => `starred:${userId}`,
  trashed: (userId: string) => `trashed:${userId}`,
  storage: (userId: string) => `storage:${userId}`,
  activity: (userId: string) => `activity:${userId}`,
  photos: (userId: string) => `photos:${userId}`,
};