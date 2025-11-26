/**
 * Simple in-memory cache for icon SVG data
 * Provides instant synchronous access to recently used icons
 */

interface CacheEntry {
  svg: string;
  timestamp: number;
}

class MemoryCacheImpl {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;

  constructor(maxSize = 500) {
    this.maxSize = maxSize;
  }

  /**
   * Get icon SVG from memory cache
   * @returns SVG string or null if not cached
   */
  get(iconName: string): string | null {
    const entry = this.cache.get(iconName);
    if (entry) {
      // Update timestamp for LRU
      entry.timestamp = Date.now();
      return entry.svg;
    }
    return null;
  }

  /**
   * Store icon SVG in memory cache
   */
  set(iconName: string, svg: string): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(iconName, {
      svg,
      timestamp: Date.now(),
    });
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
   * Evict the oldest entries to make room for new ones
   */
  private evictOldest(): void {
    // Remove 20% of oldest entries
    const entriesToRemove = Math.ceil(this.maxSize * 0.2);
    const entries = Array.from(this.cache.entries());

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove oldest entries
    for (let i = 0; i < entriesToRemove && i < entries.length; i++) {
      const entry = entries[i];
      if (entry) {
        this.cache.delete(entry[0]);
      }
    }
  }
}

// Singleton instance
export const MemoryCache = new MemoryCacheImpl();
