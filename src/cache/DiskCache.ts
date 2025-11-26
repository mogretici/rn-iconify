/**
 * Disk cache using MMKV for persistent icon storage
 * Provides fast synchronous access via JSI
 */

import { MMKV } from 'react-native-mmkv';

// MMKV instance for icon cache
const storage = new MMKV({
  id: 'rn-iconify-cache',
});

// Cache metadata storage
const META_KEY_PREFIX = '__meta:';
const CACHE_VERSION = 1;
const CACHE_VERSION_KEY = '__cache_version';

class DiskCacheImpl {
  private initialized = false;
  // In-memory LRU tracking to avoid disk writes on every get()
  private accessTimes = new Map<string, number>();
  private pendingMetadataSync = false;
  private metadataSyncTimerId: ReturnType<typeof setTimeout> | null = null;
  private readonly METADATA_SYNC_INTERVAL = 30000; // 30 seconds

  constructor() {
    this.initialize();
  }

  /**
   * Initialize cache and handle version migrations
   */
  private initialize(): void {
    if (this.initialized) return;

    const version = storage.getNumber(CACHE_VERSION_KEY);
    if (version !== CACHE_VERSION) {
      // Clear cache on version change
      this.clear();
      storage.set(CACHE_VERSION_KEY, CACHE_VERSION);
    }

    this.initialized = true;
  }

  /**
   * Get icon SVG from disk cache
   * @returns SVG string or null if not cached
   */
  get(iconName: string): string | null {
    const svg = storage.getString(iconName);
    if (svg) {
      // Update access time in memory only (avoid disk write on every get)
      this.accessTimes.set(iconName, Date.now());
      this.scheduleMetadataSync();
      return svg;
    }
    return null;
  }

  /**
   * Schedule metadata sync to disk (batched to avoid frequent writes)
   */
  private scheduleMetadataSync(): void {
    if (this.pendingMetadataSync) return;
    this.pendingMetadataSync = true;

    this.metadataSyncTimerId = setTimeout(() => {
      this.syncMetadataToDisk();
      this.pendingMetadataSync = false;
      this.metadataSyncTimerId = null;
    }, this.METADATA_SYNC_INTERVAL);
  }

  /**
   * Cancel any pending metadata sync
   */
  private cancelPendingMetadataSync(): void {
    if (this.metadataSyncTimerId !== null) {
      clearTimeout(this.metadataSyncTimerId);
      this.metadataSyncTimerId = null;
      this.pendingMetadataSync = false;
    }
  }

  /**
   * Sync in-memory access times to disk
   */
  private syncMetadataToDisk(): void {
    for (const [iconName, timestamp] of this.accessTimes) {
      storage.set(`${META_KEY_PREFIX}${iconName}`, timestamp);
    }
    this.accessTimes.clear();
  }

  /**
   * Store icon SVG in disk cache
   */
  set(iconName: string, svg: string): void {
    storage.set(iconName, svg);
    storage.set(`${META_KEY_PREFIX}${iconName}`, Date.now());
  }

  /**
   * Check if icon exists in disk cache
   */
  has(iconName: string): boolean {
    return storage.contains(iconName);
  }

  /**
   * Remove icon from disk cache
   */
  delete(iconName: string): void {
    storage.delete(iconName);
    storage.delete(`${META_KEY_PREFIX}${iconName}`);
  }

  /**
   * Clear all entries from disk cache
   */
  clear(): void {
    // Cancel any pending metadata sync before clearing
    this.cancelPendingMetadataSync();
    this.accessTimes.clear();
    storage.clearAll();
    storage.set(CACHE_VERSION_KEY, CACHE_VERSION);
  }

  /**
   * Get all cached icon names (excluding metadata keys)
   */
  keys(): string[] {
    return storage
      .getAllKeys()
      .filter((key) => !key.startsWith(META_KEY_PREFIX) && key !== CACHE_VERSION_KEY);
  }

  /**
   * Get cache statistics
   */
  getStats(): { iconCount: number; sizeBytes: number } {
    const keys = this.keys();
    let totalSize = 0;

    for (const key of keys) {
      const value = storage.getString(key);
      if (value) {
        totalSize += value.length * 2; // Approximate UTF-16 size
      }
    }

    return {
      iconCount: keys.length,
      sizeBytes: totalSize,
    };
  }

  /**
   * Evict oldest entries to stay under size limit
   * @param maxSizeBytes Maximum cache size in bytes
   */
  evictToSize(maxSizeBytes: number): void {
    // Sync pending access times before eviction
    this.syncMetadataToDisk();

    const stats = this.getStats();
    if (stats.sizeBytes <= maxSizeBytes) return;

    const keys = this.keys();
    const entries: Array<{ key: string; timestamp: number; size: number }> = [];

    // Collect all entries with metadata
    for (const key of keys) {
      // Check in-memory access times first, fallback to disk
      const timestamp =
        this.accessTimes.get(key) ?? storage.getNumber(`${META_KEY_PREFIX}${key}`) ?? 0;
      const value = storage.getString(key);
      const size = value ? value.length * 2 : 0;
      entries.push({ key, timestamp, size });
    }

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Remove entries until under limit
    let currentSize = stats.sizeBytes;
    for (const entry of entries) {
      if (currentSize <= maxSizeBytes) break;
      this.delete(entry.key);
      currentSize -= entry.size;
    }
  }
}

// Singleton instance
export const DiskCache = new DiskCacheImpl();
