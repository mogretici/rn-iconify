/**
 * ConfigManager - Global configuration manager for rn-iconify
 * Handles API settings, cache configuration, and performance options
 */

import type {
  IconifyConfig,
  IconifyAPIConfig,
  CacheConfig,
  PerformanceConfig,
  ResolvedConfig,
} from './types';
import { DEFAULT_CONFIG } from './types';

/**
 * Deep merge two objects
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue !== undefined &&
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        targetValue !== null &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        ) as T[Extract<keyof T, string>];
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}

/**
 * Global configuration state
 */
let currentConfig: ResolvedConfig = { ...DEFAULT_CONFIG };
let configChangeListeners: Array<(config: ResolvedConfig) => void> = [];

/**
 * ConfigManager class for managing rn-iconify configuration
 */
export const ConfigManager = {
  /**
   * Get the current configuration
   */
  getConfig(): ResolvedConfig {
    return currentConfig;
  },

  /**
   * Get API configuration
   */
  getAPIConfig(): Required<IconifyAPIConfig> {
    return currentConfig.api;
  },

  /**
   * Get cache configuration
   */
  getCacheConfig(): Required<CacheConfig> {
    return currentConfig.cache;
  },

  /**
   * Get performance configuration
   */
  getPerformanceConfig(): Required<PerformanceConfig> {
    return currentConfig.performance;
  },

  /**
   * Update configuration
   * Merges with existing configuration
   */
  setConfig(config: IconifyConfig): void {
    currentConfig = {
      api: deepMerge(currentConfig.api, config.api ?? {}),
      cache: deepMerge(currentConfig.cache, config.cache ?? {}),
      performance: deepMerge(currentConfig.performance, config.performance ?? {}),
    };

    // Notify listeners
    configChangeListeners.forEach((listener) => listener(currentConfig));
  },

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    currentConfig = { ...DEFAULT_CONFIG };
    configChangeListeners.forEach((listener) => listener(currentConfig));
  },

  /**
   * Subscribe to configuration changes
   * Returns unsubscribe function
   */
  onConfigChange(listener: (config: ResolvedConfig) => void): () => void {
    configChangeListeners.push(listener);
    return () => {
      configChangeListeners = configChangeListeners.filter((l) => l !== listener);
    };
  },

  /**
   * Check if using custom API server
   */
  isCustomServer(): boolean {
    return currentConfig.api.apiUrl !== DEFAULT_CONFIG.api.apiUrl;
  },

  /**
   * Get the API base URL
   */
  getAPIUrl(): string {
    return currentConfig.api.apiUrl;
  },
};

/**
 * Configure rn-iconify globally
 *
 * @example Basic usage
 * ```tsx
 * import { configure } from 'rn-iconify';
 *
 * configure({
 *   api: {
 *     apiUrl: 'https://icons.mycompany.com',
 *     timeout: 10000,
 *   },
 * });
 * ```
 *
 * @example With authentication
 * ```tsx
 * configure({
 *   api: {
 *     apiUrl: 'https://api.mycompany.com/icons',
 *     headers: {
 *       'Authorization': 'Bearer your-token',
 *       'X-API-Key': 'your-api-key',
 *     },
 *   },
 * });
 * ```
 *
 * @example Self-hosted Iconify server
 * ```tsx
 * configure({
 *   api: {
 *     // Self-hosted Iconify API
 *     apiUrl: 'https://iconify.mycompany.com',
 *     timeout: 5000,
 *     retries: 3,
 *   },
 *   performance: {
 *     enabled: true,
 *   },
 * });
 * ```
 */
export function configure(config: IconifyConfig): void {
  ConfigManager.setConfig(config);
}

/**
 * Reset configuration to defaults
 */
export function resetConfiguration(): void {
  ConfigManager.resetConfig();
}

/**
 * Get current configuration
 */
export function getConfiguration(): ResolvedConfig {
  return ConfigManager.getConfig();
}

export default ConfigManager;
