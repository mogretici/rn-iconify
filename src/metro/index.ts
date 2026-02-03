/**
 * rn-iconify Metro Plugin
 *
 * Adds dev server middleware for runtime icon usage learning.
 * When used with the Babel plugin, enables zero-config 0ms rendering.
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

export { withRnIconify } from './withRnIconify';
export { createDevServerMiddleware } from './devServerMiddleware';
export type { MetroConfig, RnIconifyMetroOptions, UsageFile } from './types';
