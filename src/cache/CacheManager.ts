/**
 * Cache Manager - Orchestrates memory, bundled, and disk cache
 * Priority: Memory Cache → Bundled Icons → Disk Cache → Native Cache → Network
 *
 * Integrates with native module for background prefetching when available
 */

import { MemoryCache } from './MemoryCache';
import { DiskCache } from './DiskCache';
import { getNativeIconify, isNativeModuleAvailable } from '../native';

/**
 * Bundled icon data structure
 */
interface BundledIconData {
  svg: string;
  width: number;
  height: number;
}

/**
 * Bundle structure from Babel plugin
 */
interface IconBundle {
  version: string;
  generatedAt: string;
  icons: Record<string, BundledIconData>;
  count: number;
}

class CacheManagerImpl {
  /**
   * Track in-flight prefetch operations to prevent race conditions
   */
  private prefetchingIcons = new Set<string>();

  /**
   * Bundled icons from Babel plugin (loaded at app start)
   * These are icons that were detected during build time
   */
  private bundledIcons: Map<string, string> | null = null;

  /**
   * Whether bundled icons have been initialized
   */
  private bundledIconsInitialized = false;

  /**
   * Initialize bundled icons from the Babel plugin cache
   * This should be called automatically on first access
   */
  initBundledIcons(): void {
    if (this.bundledIconsInitialized) {
      return;
    }

    this.bundledIconsInitialized = true;

    // Bundled icons loading is disabled by default to prevent Metro bundling errors
    // Use loadBundle() explicitly to load icons from a generated bundle file
    // This is called by the app after importing the bundle from the Babel plugin output
  }

  /**
   * Load bundled icons from a custom bundle object
   * Useful for manual bundle loading or testing
   *
   * @param bundle The icon bundle to load
   * @returns Number of icons loaded
   */
  loadBundle(bundle: IconBundle): number {
    if (!bundle || !bundle.icons || bundle.version !== '1.0.0') {
      return 0;
    }

    this.bundledIcons = new Map();

    for (const [iconName, data] of Object.entries(bundle.icons)) {
      this.bundledIcons.set(iconName, data.svg);
    }

    this.bundledIconsInitialized = true;
    return this.bundledIcons.size;
  }

  /**
   * Check if an icon is in the bundled cache
   */
  hasBundled(iconName: string): boolean {
    if (!this.bundledIconsInitialized) {
      this.initBundledIcons();
    }
    return this.bundledIcons?.has(iconName) ?? false;
  }

  /**
   * Get bundled icons count
   */
  getBundledCount(): number {
    if (!this.bundledIconsInitialized) {
      this.initBundledIcons();
    }
    return this.bundledIcons?.size ?? 0;
  }

  /**
   * Get icon SVG from cache (memory first, then bundled, then disk)
   * @returns SVG string or null if not cached
   */
  get(iconName: string): string | null {
    // 1. Try memory cache (instant, ~0ms)
    const memoryCached = MemoryCache.get(iconName);
    if (memoryCached) {
      return memoryCached;
    }

    // 2. Try bundled icons (instant, ~0ms)
    if (!this.bundledIconsInitialized) {
      this.initBundledIcons();
    }
    const bundledSvg = this.bundledIcons?.get(iconName);
    if (bundledSvg) {
      // Promote to memory cache for faster subsequent access
      MemoryCache.set(iconName, bundledSvg);
      return bundledSvg;
    }

    // 3. Try disk cache (~1-5ms via JSI)
    const diskCached = DiskCache.get(iconName);
    if (diskCached) {
      // Promote to memory cache for faster subsequent access
      MemoryCache.set(iconName, diskCached);
      return diskCached;
    }

    return null;
  }

  /**
   * Store icon SVG in both memory and disk cache
   */
  set(iconName: string, svg: string): void {
    MemoryCache.set(iconName, svg);
    DiskCache.set(iconName, svg);
  }

  /**
   * Check if icon exists in any cache (memory, bundled, or disk)
   */
  has(iconName: string): boolean {
    if (MemoryCache.has(iconName)) {
      return true;
    }

    // Check bundled icons
    if (!this.bundledIconsInitialized) {
      this.initBundledIcons();
    }
    if (this.bundledIcons?.has(iconName)) {
      return true;
    }

    return DiskCache.has(iconName);
  }

  /**
   * Remove icon from all caches
   */
  delete(iconName: string): void {
    MemoryCache.delete(iconName);
    DiskCache.delete(iconName);
  }

  /**
   * Clear all caches
   */
  clear(): void {
    MemoryCache.clear();
    DiskCache.clear();
  }

  /**
   * Clear only memory cache (disk cache persists)
   */
  clearMemory(): void {
    MemoryCache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memoryCount: number;
    bundledCount: number;
    diskCount: number;
    diskSizeBytes: number;
  } {
    if (!this.bundledIconsInitialized) {
      this.initBundledIcons();
    }

    const diskStats = DiskCache.getStats();
    return {
      memoryCount: MemoryCache.size,
      bundledCount: this.bundledIcons?.size ?? 0,
      diskCount: diskStats.iconCount,
      diskSizeBytes: diskStats.sizeBytes,
    };
  }

  /**
   * Prefetch multiple icons into cache
   * Uses native module for background fetching when available
   *
   * @param iconNames Array of full icon names (e.g., "mdi:home")
   * @param fetchFn Function to fetch icon SVG from network (fallback)
   */
  async prefetch(
    iconNames: string[],
    fetchFn: (iconName: string) => Promise<string>
  ): Promise<{ success: string[]; failed: string[] }> {
    // Filter out already cached icons AND icons currently being prefetched
    const toFetch = iconNames.filter((name) => !this.has(name) && !this.prefetchingIcons.has(name));

    if (toFetch.length === 0) {
      return { success: [], failed: [] };
    }

    // Mark icons as being prefetched to prevent race conditions
    toFetch.forEach((name) => this.prefetchingIcons.add(name));

    try {
      // Try native module first for better performance
      if (isNativeModuleAvailable()) {
        try {
          const nativeModule = getNativeIconify();
          const result = await nativeModule.prefetchIcons(toFetch);

          // Note: Native module caches to its own disk location
          // Icons will be available on next app launch via native cache
          return result;
        } catch (error) {
          // Fall through to JS implementation
          if (__DEV__) {
            console.warn('[rn-iconify] Native prefetch failed, using JS fallback:', error);
          }
        }
      }

      // JS fallback implementation
      return await this.prefetchWithJS(toFetch, fetchFn);
    } finally {
      // Clean up prefetching set
      toFetch.forEach((name) => this.prefetchingIcons.delete(name));
    }
  }

  /**
   * JS-based prefetch implementation
   * Used when native module is not available
   */
  private async prefetchWithJS(
    iconNames: string[],
    fetchFn: (iconName: string) => Promise<string>
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    // Fetch in parallel with concurrency limit
    const CONCURRENCY = 5;
    for (let i = 0; i < iconNames.length; i += CONCURRENCY) {
      const batch = iconNames.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map(async (name) => {
          const svg = await fetchFn(name);
          this.set(name, svg);
          return name;
        })
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.status === 'fulfilled') {
          success.push(result.value);
        } else {
          const name = batch[j];
          if (name) {
            failed.push(name);
          }
        }
      }
    }

    return { success, failed };
  }

  /**
   * Check if native module is available for prefetching
   */
  isNativeAvailable(): boolean {
    return isNativeModuleAvailable();
  }

  /**
   * Get native module cache stats (if available)
   */
  async getNativeStats(): Promise<{
    diskCount: number;
    diskSizeBytes: number;
    hitRate: number;
  } | null> {
    if (!isNativeModuleAvailable()) {
      return null;
    }

    try {
      const nativeModule = getNativeIconify();
      return await nativeModule.getCacheStats();
    } catch {
      return null;
    }
  }

  /**
   * Clear native module cache (if available)
   */
  async clearNative(): Promise<void> {
    if (isNativeModuleAvailable()) {
      try {
        const nativeModule = getNativeIconify();
        await nativeModule.clearCache();
      } catch {
        // Ignore errors
      }
    }
  }
}

// Singleton instance
export const CacheManager = new CacheManagerImpl();
