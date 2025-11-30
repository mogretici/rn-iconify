/**
 * Offline Bundle Module
 * Provides functionality to load pre-bundled icons at runtime
 */

import { CacheManager } from '../cache/CacheManager';

/**
 * Icon bundle structure (matches CLI output)
 */
export interface IconBundle {
  /**
   * Bundle version
   */
  version: string;

  /**
   * Generation timestamp
   */
  generatedAt: string;

  /**
   * Icons in the bundle
   */
  icons: Record<
    string,
    {
      svg: string;
      width: number;
      height: number;
    }
  >;

  /**
   * Total icon count
   */
  count: number;
}

/**
 * Bundle loading result
 */
export interface BundleLoadResult {
  /**
   * Number of icons loaded
   */
  loaded: number;

  /**
   * Number of icons skipped (already cached)
   */
  skipped: number;

  /**
   * Total icons in bundle
   */
  total: number;

  /**
   * Bundle version
   */
  version: string;

  /**
   * Load time in milliseconds
   */
  loadTimeMs: number;
}

/**
 * Load an offline icon bundle into the cache
 *
 * This function should be called early in your app initialization
 * to pre-populate the icon cache with bundled icons.
 *
 * Icons loaded from the bundle are immediately available without
 * network requests, providing instant rendering.
 *
 * @param bundle - The icon bundle object (from JSON import)
 * @param options - Loading options
 * @returns Result with load statistics
 *
 * @example
 * ```tsx
 * // In your app entry point (App.tsx or index.js)
 * import { loadOfflineBundle } from 'rn-iconify';
 * import iconBundle from './assets/icons.bundle.json';
 *
 * // Load bundle on app start
 * const result = loadOfflineBundle(iconBundle);
 * console.log(`Loaded ${result.loaded} icons in ${result.loadTimeMs}ms`);
 *
 * // Or with options
 * loadOfflineBundle(iconBundle, {
 *   skipExisting: true,  // Don't overwrite existing cache entries
 *   verbose: true,       // Log loading progress
 * });
 * ```
 */
export function loadOfflineBundle(
  bundle: IconBundle,
  options: {
    /**
     * Skip icons that are already in cache
     * @default true
     */
    skipExisting?: boolean;

    /**
     * Log loading progress
     * @default false
     */
    verbose?: boolean;
  } = {}
): BundleLoadResult {
  const { skipExisting = true, verbose = false } = options;

  const startTime = Date.now();
  let loaded = 0;
  let skipped = 0;

  if (verbose) {
    console.log(`[rn-iconify] Loading bundle v${bundle.version} (${bundle.count} icons)`);
  }

  for (const [iconName, iconData] of Object.entries(bundle.icons)) {
    // Check if already cached
    if (skipExisting) {
      const existing = CacheManager.get(iconName);
      if (existing) {
        skipped++;
        continue;
      }
    }

    // Store in cache
    CacheManager.set(iconName, iconData.svg);
    loaded++;

    if (verbose && loaded % 50 === 0) {
      console.log(`[rn-iconify] Loaded ${loaded}/${bundle.count} icons...`);
    }
  }

  const loadTimeMs = Date.now() - startTime;

  if (verbose) {
    console.log(`[rn-iconify] Bundle loaded: ${loaded} new, ${skipped} skipped, ${loadTimeMs}ms`);
  }

  return {
    loaded,
    skipped,
    total: bundle.count,
    version: bundle.version,
    loadTimeMs,
  };
}

/**
 * Async version of loadOfflineBundle
 *
 * Useful for loading large bundles without blocking the main thread.
 * Uses setTimeout to yield to the event loop periodically.
 *
 * @param bundle - The icon bundle object
 * @param options - Loading options
 * @returns Promise resolving to load result
 *
 * @example
 * ```tsx
 * import { loadOfflineBundleAsync } from 'rn-iconify';
 * import iconBundle from './assets/icons.bundle.json';
 *
 * async function initApp() {
 *   const result = await loadOfflineBundleAsync(iconBundle, {
 *     batchSize: 100,  // Process 100 icons per batch
 *     verbose: true,
 *   });
 *   console.log(`Loaded ${result.loaded} icons`);
 * }
 * ```
 */
export async function loadOfflineBundleAsync(
  bundle: IconBundle,
  options: {
    /**
     * Skip icons that are already in cache
     * @default true
     */
    skipExisting?: boolean;

    /**
     * Log loading progress
     * @default false
     */
    verbose?: boolean;

    /**
     * Number of icons to process per batch
     * @default 50
     */
    batchSize?: number;

    /**
     * Progress callback
     */
    onProgress?: (loaded: number, total: number) => void;
  } = {}
): Promise<BundleLoadResult> {
  const { skipExisting = true, verbose = false, batchSize = 50, onProgress } = options;

  const startTime = Date.now();
  let loaded = 0;
  let skipped = 0;

  if (verbose) {
    console.log(`[rn-iconify] Loading bundle v${bundle.version} (${bundle.count} icons)`);
  }

  const entries = Object.entries(bundle.icons);

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);

    for (const [iconName, iconData] of batch) {
      // Check if already cached
      if (skipExisting) {
        const existing = CacheManager.get(iconName);
        if (existing) {
          skipped++;
          continue;
        }
      }

      // Store in cache
      CacheManager.set(iconName, iconData.svg);
      loaded++;
    }

    // Report progress
    onProgress?.(loaded + skipped, bundle.count);

    // Yield to event loop
    if (i + batchSize < entries.length) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  const loadTimeMs = Date.now() - startTime;

  if (verbose) {
    console.log(`[rn-iconify] Bundle loaded: ${loaded} new, ${skipped} skipped, ${loadTimeMs}ms`);
  }

  return {
    loaded,
    skipped,
    total: bundle.count,
    version: bundle.version,
    loadTimeMs,
  };
}

/**
 * Check if a bundle is compatible with this version of rn-iconify
 *
 * @param bundle - The icon bundle object
 * @returns true if compatible
 */
export function isBundleCompatible(bundle: IconBundle): boolean {
  if (!bundle || typeof bundle !== 'object') {
    return false;
  }

  // Check required fields
  if (!bundle.version || !bundle.icons || typeof bundle.count !== 'number') {
    return false;
  }

  // Check version compatibility (currently supports v1.x)
  const majorVersion = parseInt(bundle.version.split('.')[0], 10);
  return majorVersion === 1;
}

/**
 * Get bundle statistics
 *
 * @param bundle - The icon bundle object
 * @returns Statistics about the bundle
 */
export function getBundleStats(bundle: IconBundle): {
  iconCount: number;
  prefixes: string[];
  estimatedSizeBytes: number;
  generatedAt: Date;
} {
  const prefixes = new Set<string>();
  let totalSize = 0;

  for (const [iconName, iconData] of Object.entries(bundle.icons)) {
    const [prefix] = iconName.split(':');
    prefixes.add(prefix);
    totalSize += iconData.svg.length;
  }

  return {
    iconCount: bundle.count,
    prefixes: Array.from(prefixes).sort(),
    estimatedSizeBytes: totalSize,
    generatedAt: new Date(bundle.generatedAt),
  };
}
