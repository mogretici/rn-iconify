/**
 * TurboModule Specification for RNIconify
 * Provides native background prefetching and cache management
 *
 * @see https://reactnative.dev/docs/the-new-architecture/pillars-turbomodules
 */

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Prefetch result containing successful and failed icon names
 */
export interface PrefetchResult {
  success: string[];
  failed: string[];
}

/**
 * Cache statistics from native layer
 */
export interface CacheStats {
  memoryCount: number;
  diskCount: number;
  diskSizeBytes: number;
  hitRate: number;
}

/**
 * Module constants
 */
export interface ModuleConstants {
  cacheDirectory: string;
  maxCacheSize: number;
  version: string;
}

/**
 * TurboModule interface for RNIconify
 * Provides native implementations for performance-critical operations
 */
export interface Spec extends TurboModule {
  /**
   * Prefetch multiple icons in background threads
   * Icons are fetched in parallel using native networking (URLSession/OkHttp)
   *
   * @param icons - Array of icon names in "prefix:name" format
   * @returns Promise with success/failed arrays
   *
   * @example
   * const result = await NativeIconify.prefetchIcons(['mdi:home', 'mdi:settings']);
   * console.log(`Prefetched: ${result.success.length}, Failed: ${result.failed.length}`);
   */
  prefetchIcons(icons: string[]): Promise<PrefetchResult>;

  /**
   * Get detailed cache statistics
   * Returns counts and sizes from both memory and disk caches
   *
   * @returns Promise with cache statistics
   */
  getCacheStats(): Promise<CacheStats>;

  /**
   * Clear all caches (memory and disk)
   * Use with caution - will require re-fetching all icons
   *
   * @returns Promise that resolves when cache is cleared
   */
  clearCache(): Promise<void>;

  /**
   * Check if an icon is cached (synchronous via JSI)
   * Fast check without async overhead
   *
   * @param iconName - Icon name in "prefix:name" format
   * @returns true if icon is in cache
   */
  isCached(iconName: string): boolean;

  /**
   * Get module constants
   * Called once during module initialization
   *
   * @returns Object with cache directory, max size, and version
   */
  getConstants(): ModuleConstants;
}

/**
 * Get the native module instance
 * Returns null if TurboModules are not available (Old Architecture)
 */
export function getNativeIconifyModule(): Spec | null {
  try {
    return TurboModuleRegistry.get<Spec>('RNIconify');
  } catch {
    return null;
  }
}

/**
 * Get the native module, throwing if not available
 * Use when native module is required
 */
export function getEnforcingNativeIconifyModule(): Spec {
  return TurboModuleRegistry.getEnforcing<Spec>('RNIconify');
}

// Default export is lazy to avoid throwing at import time in test environments
export default {
  get module(): Spec {
    return getEnforcingNativeIconifyModule();
  },
};
