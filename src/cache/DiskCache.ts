/**
 * Disk cache using MMKV for persistent icon storage
 * Provides fast synchronous access via JSI
 *
 * Supports both react-native-mmkv v3.x and v4.x
 */

import * as MMKVModule from 'react-native-mmkv';
import { ConfigManager } from '../config/ConfigManager';

/**
 * MMKV storage interface (compatible with both v3 and v4)
 * v3.x uses `delete(key)`, v4.x uses `remove(key)`
 */
interface MMKVStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string | number | boolean): void;
  getNumber(key: string): number | undefined;
  contains(key: string): boolean;
  remove(key: string): boolean | void;
  clearAll(): void;
  getAllKeys(): string[];
}

interface MMKVConfig {
  id: string;
}

/** v3 exposes `delete`; `remove` is adapted onto it below. */
interface MMKVv3Storage extends Omit<MMKVStorage, 'remove'> {
  delete?: (key: string) => boolean | void;
  remove?: (key: string) => boolean | void;
}

/**
 * Create MMKV instance compatible with both v3.x and v4.x
 *
 * v3.x: import { MMKV } from 'react-native-mmkv' → new MMKV({ id: '...' })
 * v4.x: import { createMMKV } from 'react-native-mmkv' → createMMKV({ id: '...' })
 */
function createStorage(id: string): MMKVStorage {
  const config = { id };

  // v4.x: createMMKV function exists (uses `remove`)
  if ('createMMKV' in MMKVModule && typeof MMKVModule.createMMKV === 'function') {
    return MMKVModule.createMMKV(config) as MMKVStorage;
  }

  // v3.x: MMKV is a constructor (uses `delete`, needs `remove` adapter)
  if ('MMKV' in MMKVModule && typeof MMKVModule.MMKV === 'function') {
    // The two majors export incompatible shapes, so the constructor is
    // described here rather than taken from whichever version is installed.
    const MMKVConstructor = MMKVModule.MMKV as unknown as new (
      options: MMKVConfig
    ) => MMKVv3Storage;

    const instance = new MMKVConstructor(config);

    if (typeof instance.remove !== 'function' && typeof instance.delete === 'function') {
      instance.remove = instance.delete.bind(instance);
    }

    return instance as MMKVStorage;
  }

  throw new Error(
    '[rn-iconify] Could not initialize MMKV storage. ' +
      'Please ensure react-native-mmkv (v3.x or v4.x) is properly installed.'
  );
}

// MMKV instance for icon cache
const storage = createStorage('rn-iconify-cache');

// Cache metadata storage
const META_KEY_PREFIX = '__meta:';

/** Writes between size checks. See `writesSinceEvictionCheck`. */
const EVICTION_CHECK_INTERVAL = 25;
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
   * Writes since the cache was last measured.
   *
   * Measuring means walking every key and adding up the values, which is far
   * too much to do on each write. Checking every so often keeps the cache
   * within a few dozen icons of its ceiling while leaving writes cheap.
   */
  private writesSinceEvictionCheck = 0;

  /**
   * Store icon SVG in disk cache
   */
  set(iconName: string, svg: string): void {
    storage.set(iconName, svg);
    storage.set(`${META_KEY_PREFIX}${iconName}`, Date.now());

    // This is MMKV: ordinary persistent storage, not the directory the
    // operating system empties under pressure. Without this, every icon an
    // app ever rendered stays on the device for as long as the app is
    // installed.
    this.writesSinceEvictionCheck++;
    if (this.writesSinceEvictionCheck >= EVICTION_CHECK_INTERVAL) {
      this.writesSinceEvictionCheck = 0;
      this.enforceSizeLimit();
    }
  }

  /**
   * Drop the oldest icons if the cache has outgrown its configured ceiling.
   */
  private enforceSizeLimit(): void {
    try {
      const limit = ConfigManager.getCacheConfig().maxDiskCacheBytes;
      if (!limit || limit <= 0) return;
      this.evictToSize(limit);
    } catch {
      // A cache that cannot be measured is left alone rather than cleared.
    }
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
    storage.remove(iconName);
    storage.remove(`${META_KEY_PREFIX}${iconName}`);
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
