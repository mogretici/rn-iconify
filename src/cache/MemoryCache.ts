/**
 * LRU in-memory cache for icon SVG data
 * Uses Map insertion-order trick for O(1) eviction:
 * - get() deletes and re-inserts to move entry to tail
 * - eviction removes from head (oldest) in O(1)
 */

class MemoryCacheImpl {
  private cache = new Map<string, string>();
  private maxSize: number;

  constructor(maxSize = 500) {
    this.maxSize = maxSize;
  }

  /**
   * Get icon SVG from memory cache
   * Moves the entry to the tail (most recently used)
   * @returns SVG string or null if not cached
   */
  get(iconName: string): string | null {
    const svg = this.cache.get(iconName);
    if (svg !== undefined) {
      // Move to tail by delete + re-insert (Map preserves insertion order)
      this.cache.delete(iconName);
      this.cache.set(iconName, svg);
      return svg;
    }
    return null;
  }

  /**
   * Store icon SVG in memory cache
   * Evicts oldest entries if cache is at capacity
   */
  set(iconName: string, svg: string): void {
    // If key already exists, delete first to refresh position
    if (this.cache.has(iconName)) {
      this.cache.delete(iconName);
    }

    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(iconName, svg);
  }

  /**
   * Check if icon exists in memory cache
   */
  has(iconName: string): boolean {
    return this.cache.has(iconName);
  }

  /**
   * Remove icon from memory cache
   */
  delete(iconName: string): boolean {
    return this.cache.delete(iconName);
  }

  /**
   * Clear all entries from memory cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get all cached icon names
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Evict the oldest 20% of entries
   * O(1) per removal using Map's insertion order (head = oldest)
   */
  private evictOldest(): void {
    const entriesToRemove = Math.ceil(this.maxSize * 0.2);
    let removed = 0;

    for (const key of this.cache.keys()) {
      if (removed >= entriesToRemove) break;
      this.cache.delete(key);
      removed++;
    }
  }
}

// Singleton instance
export const MemoryCache = new MemoryCacheImpl();
