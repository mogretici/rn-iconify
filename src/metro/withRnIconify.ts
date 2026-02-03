/**
 * Metro Config Wrapper
 * Adds rn-iconify middleware to the Metro dev server
 *
 * @example
 * ```js
 * // metro.config.js
 * const { withRnIconify } = require('rn-iconify/metro');
 *
 * const config = getDefaultConfig(__dirname);
 * module.exports = withRnIconify(config);
 * ```
 */

import type { MetroConfig, MetroMiddleware, RnIconifyMetroOptions } from './types';
import { createDevServerMiddleware } from './devServerMiddleware';

/**
 * Wrap a Metro config to add rn-iconify dev server middleware
 * This enables runtime icon usage learning during development
 */
export function withRnIconify(config: MetroConfig, options?: RnIconifyMetroOptions): MetroConfig {
  const middleware = createDevServerMiddleware(options);

  const existingEnhance = config.server?.enhanceMiddleware;

  return {
    ...config,
    server: {
      ...config.server,
      enhanceMiddleware: (metroMiddleware: MetroMiddleware, server: unknown): MetroMiddleware => {
        // Apply existing enhanceMiddleware if present
        const enhanced = existingEnhance
          ? existingEnhance(metroMiddleware, server)
          : metroMiddleware;

        // Wrap with our middleware
        return (req, res, next) => {
          // Check if this is our endpoint
          const url = req.url;
          if (url === '/__rn_iconify_log' || url === '/__rn_iconify_status') {
            middleware(req, res, next);
            return;
          }

          // Otherwise pass through
          enhanced(req, res, next);
        };
      },
    },
  };
}
