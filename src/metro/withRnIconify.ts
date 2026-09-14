/**
 * Metro Config Wrapper
 * Points `rn-iconify/bundled-icons` at the application's icon bundle and adds
 * the dev server middleware that learns icons used at runtime
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

import * as fs from 'fs';
import * as path from 'path';
import type {
  MetroConfig,
  MetroMiddleware,
  MetroResolveRequest,
  RnIconifyMetroOptions,
} from './types';
import { createDevServerMiddleware } from './devServerMiddleware';
import { bundleModuleSource, createBundle, writeFileIfChanged } from '../babel/cache-writer';

/**
 * The module the library reads its bundled icons from (see CacheManager)
 */
export const BUNDLED_ICONS_MODULE = 'rn-iconify/bundled-icons';

/**
 * The application's bundle module, created empty when the Babel plugin has not
 * written one yet. The module then always resolves to the same file, and
 * Metro's watcher picks up the icons once the plugin adds them.
 */
function ensureBundleModule(projectRoot: string, outputDir: string): string {
  const filePath = path.join(path.resolve(projectRoot, outputDir), 'icons.js');
  if (!fs.existsSync(filePath)) {
    writeFileIfChanged(filePath, bundleModuleSource(createBundle({})));
  }
  return filePath;
}

/**
 * Wrap a Metro config for rn-iconify
 */
export function withRnIconify(config: MetroConfig, options?: RnIconifyMetroOptions): MetroConfig {
  const middleware = createDevServerMiddleware(options);
  const bundlePath = ensureBundleModule(
    config.projectRoot ?? process.cwd(),
    options?.outputDir ?? '.rn-iconify'
  );

  const existingResolve = config.resolver?.resolveRequest;
  const resolveRequest: MetroResolveRequest = (context, moduleName, platform) => {
    if (moduleName === BUNDLED_ICONS_MODULE) {
      return { type: 'sourceFile', filePath: bundlePath };
    }
    return existingResolve
      ? existingResolve(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);
  };

  const existingEnhance = config.server?.enhanceMiddleware;

  return {
    ...config,
    resolver: {
      ...config.resolver,
      resolveRequest,
    },
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
