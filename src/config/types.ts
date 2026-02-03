/**
 * Configuration types for rn-iconify
 */

/**
 * API configuration options
 */
export interface IconifyAPIConfig {
  /**
   * Base URL for the Iconify API
   * @default 'https://api.iconify.design'
   */
  apiUrl?: string;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Number of retry attempts on failure
   * @default 2
   */
  retries?: number;

  /**
   * Delay between retries in milliseconds
   * @default 1000
   */
  retryDelay?: number;

  /**
   * Custom headers to include in API requests
   */
  headers?: Record<string, string>;

  /**
   * Enable/disable request logging
   * @default false
   */
  logging?: boolean;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /**
   * Maximum number of icons in memory cache
   * @default 500
   */
  maxMemoryItems?: number;

  /**
   * Enable/disable disk cache (MMKV)
   * @default true
   */
  enableDiskCache?: boolean;

  /**
   * Disk cache key prefix
   * @default 'rn-iconify:'
   */
  diskCachePrefix?: string;
}

/**
 * Default icon rendering configuration
 */
export interface DefaultsConfig {
  /**
   * Default placeholder to show while loading icons
   * Set to false to explicitly disable
   * @default undefined (no placeholder - non-breaking)
   */
  placeholder?: 'skeleton' | 'pulse' | 'shimmer' | false;

  /**
   * Enable fade-in transition for non-cached icons
   * @default true
   */
  fadeIn?: boolean;

  /**
   * Fade-in animation duration in milliseconds
   * @default 150
   */
  fadeInDuration?: number;
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
  /**
   * Enable performance monitoring
   * @default false
   */
  enabled?: boolean;

  /**
   * Track individual icon load times
   * @default true
   */
  trackLoadTimes?: boolean;

  /**
   * Track cache hit/miss rates
   * @default true
   */
  trackCacheStats?: boolean;

  /**
   * Maximum number of entries to keep in history
   * @default 1000
   */
  maxHistorySize?: number;
}

/**
 * Complete configuration object
 */
export interface IconifyConfig {
  /**
   * API configuration
   */
  api?: IconifyAPIConfig;

  /**
   * Cache configuration
   */
  cache?: CacheConfig;

  /**
   * Performance monitoring configuration
   */
  performance?: PerformanceConfig;

  /**
   * Default icon rendering configuration
   */
  defaults?: DefaultsConfig;
}

/**
 * Resolved configuration with all defaults applied
 */
export interface ResolvedConfig {
  api: Required<IconifyAPIConfig>;
  cache: Required<CacheConfig>;
  performance: Required<PerformanceConfig>;
  defaults: Required<DefaultsConfig>;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: ResolvedConfig = {
  api: {
    apiUrl: 'https://api.iconify.design',
    timeout: 30000,
    retries: 2,
    retryDelay: 1000,
    headers: {},
    logging: false,
  },
  cache: {
    maxMemoryItems: 500,
    enableDiskCache: true,
    diskCachePrefix: 'rn-iconify:',
  },
  performance: {
    enabled: false,
    trackLoadTimes: true,
    trackCacheStats: true,
    maxHistorySize: 1000,
  },
  defaults: {
    placeholder: false,
    fadeIn: true,
    fadeInDuration: 150,
  },
};
