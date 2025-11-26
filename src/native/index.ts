/**
 * Native Module Wrapper
 * Provides unified interface for both TurboModule (New Arch) and Bridge (Old Arch)
 */

import { Platform, NativeModules } from 'react-native';
import type { PrefetchResult, CacheStats, ModuleConstants } from './NativeIconifyModule';
import { getNativeIconifyModule } from './NativeIconifyModule';

/**
 * Native module interface that works across architectures
 */
export interface NativeIconifyInterface {
  prefetchIcons(icons: string[]): Promise<PrefetchResult>;
  getCacheStats(): Promise<CacheStats>;
  clearCache(): Promise<void>;
  isCached(iconName: string): boolean;
  getConstants(): ModuleConstants;
  isAvailable: boolean;
}

/**
 * Default fallback implementation when native module is not available
 */
const FallbackModule: NativeIconifyInterface = {
  async prefetchIcons(icons: string[]): Promise<PrefetchResult> {
    // Fallback: Return all as failed - JS layer will handle fetching
    return { success: [], failed: icons };
  },

  async getCacheStats(): Promise<CacheStats> {
    return {
      memoryCount: 0,
      diskCount: 0,
      diskSizeBytes: 0,
      hitRate: 0,
    };
  },

  async clearCache(): Promise<void> {
    // No-op in fallback
  },

  isCached(_iconName: string): boolean {
    return false;
  },

  getConstants(): ModuleConstants {
    return {
      cacheDirectory: '',
      maxCacheSize: 0,
      version: '1.0.0',
    };
  },

  isAvailable: false,
};

/**
 * Try to get the native module (TurboModule or Bridge)
 */
function getNativeModule(): NativeIconifyInterface {
  // Try TurboModule first (New Architecture)
  const turboModule = getNativeIconifyModule();
  if (turboModule) {
    return {
      prefetchIcons: turboModule.prefetchIcons.bind(turboModule),
      getCacheStats: turboModule.getCacheStats.bind(turboModule),
      clearCache: turboModule.clearCache.bind(turboModule),
      isCached: turboModule.isCached.bind(turboModule),
      getConstants: turboModule.getConstants.bind(turboModule),
      isAvailable: true,
    };
  }

  // Try Bridge module (Old Architecture)
  const bridgeModule = NativeModules.RNIconify;
  if (bridgeModule) {
    return {
      prefetchIcons: bridgeModule.prefetchIcons,
      getCacheStats: bridgeModule.getCacheStats,
      clearCache: bridgeModule.clearCache,
      isCached: bridgeModule.isCached || (() => false),
      getConstants: () =>
        bridgeModule.getConstants?.() || {
          cacheDirectory: '',
          maxCacheSize: 100 * 1024 * 1024,
          version: '1.0.0',
        },
      isAvailable: true,
    };
  }

  // No native module available
  if (__DEV__) {
    console.warn(
      '[rn-iconify] Native module not available. Using JS fallback.\n' +
        'For better performance, ensure the native module is properly linked.\n' +
        `Platform: ${Platform.OS}`
    );
  }

  return FallbackModule;
}

/**
 * Singleton instance of the native module
 */
let _nativeModule: NativeIconifyInterface | null = null;

/**
 * Get the native module instance
 * Returns TurboModule, Bridge module, or fallback
 */
export function getNativeIconify(): NativeIconifyInterface {
  if (!_nativeModule) {
    _nativeModule = getNativeModule();
  }
  return _nativeModule;
}

/**
 * Check if native module is available
 */
export function isNativeModuleAvailable(): boolean {
  return getNativeIconify().isAvailable;
}

// Re-export types
export type { PrefetchResult, CacheStats, ModuleConstants };
