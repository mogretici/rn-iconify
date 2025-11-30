/**
 * Configuration Module
 * Provides global configuration for rn-iconify
 *
 * @example
 * ```tsx
 * import { configure } from 'rn-iconify';
 *
 * // Configure custom API server
 * configure({
 *   api: {
 *     apiUrl: 'https://icons.mycompany.com',
 *     headers: { 'Authorization': 'Bearer token' },
 *   },
 * });
 * ```
 */

// Types
export type {
  IconifyConfig,
  IconifyAPIConfig,
  CacheConfig,
  PerformanceConfig,
  ResolvedConfig,
} from './types';

export { DEFAULT_CONFIG } from './types';

// ConfigManager
export { ConfigManager, configure, resetConfiguration, getConfiguration } from './ConfigManager';

// Default export
export { configure as default } from './ConfigManager';
