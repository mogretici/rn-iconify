/**
 * rn-iconify
 * 268,000+ Iconify icons for React Native with Expo Vector Icons-style API
 *
 * @example
 * ```tsx
 * import { Mdi, Heroicons, Lucide, Ph, Feather } from 'rn-iconify';
 *
 * <Mdi name="home" size={24} color="blue" />
 * <Heroicons name="user" size={24} color="red" />
 * <Lucide name="camera" size={24} />
 * <Ph name="house" size={24} />
 * ```
 */

// Icon Set Components (212 sets, 268,000+ icons)
export * from './components';

// Core Types
export type {
  IconProps,
  IconRotation,
  IconFlip,
  IconLoadingState,
  IconifyIconData,
  IconifyAPIResponse,
} from './types';

// Factory Function (for creating custom icon sets)
export { createIconSet } from './createIconSet';
export type { IconNameType } from './createIconSet';

// Cache Management - import for internal use and re-export
import { CacheManager } from './cache/CacheManager';
export { CacheManager };

// Network Utilities
export { fetchIcon, fetchIconsBatch, parseIconName, checkAPIHealth } from './network/IconifyAPI';
export type { BatchFetchResult } from './network/IconifyAPI';

// Native Module Utilities
export { getNativeIconify, isNativeModuleAvailable } from './native';
export type { PrefetchResult, CacheStats, ModuleConstants, NativeIconifyInterface } from './native';

/**
 * Prefetch multiple icons into cache
 * Useful for preloading icons before they're needed
 *
 * @example
 * ```tsx
 * import { prefetchIcons } from 'rn-iconify';
 *
 * // Prefetch during app startup
 * await prefetchIcons(['mdi:home', 'mdi:settings', 'heroicons:user']);
 * ```
 */
export async function prefetchIcons(
  iconNames: string[]
): Promise<{ success: string[]; failed: string[] }> {
  const { CacheManager: cache } = await import('./cache/CacheManager');
  const { fetchIcon: fetch } = await import('./network/IconifyAPI');

  return cache.prefetch(iconNames, fetch);
}

/**
 * Clear all cached icons (memory, disk, and native)
 *
 * @example
 * ```tsx
 * import { clearCache } from 'rn-iconify';
 *
 * await clearCache();
 * ```
 */
export async function clearCache(): Promise<void> {
  CacheManager.clear();
  await CacheManager.clearNative();
}

/**
 * Get cache statistics
 *
 * @example
 * ```tsx
 * import { getCacheStats } from 'rn-iconify';
 *
 * const stats = getCacheStats();
 * console.log(`Cached: ${stats.memoryCount} in memory, ${stats.diskCount} on disk`);
 * ```
 */
export function getCacheStats(): {
  memoryCount: number;
  diskCount: number;
  diskSizeBytes: number;
} {
  return CacheManager.getStats();
}
