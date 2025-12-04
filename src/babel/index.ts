/**
 * rn-iconify Babel Plugin
 *
 * Build-time icon bundling for 0ms first render.
 *
 * @example
 * ```js
 * // babel.config.js
 * module.exports = {
 *   presets: ['module:@react-native/babel-preset'],
 *   plugins: ['rn-iconify/babel'],
 * };
 * ```
 *
 * @example With options
 * ```js
 * // babel.config.js
 * module.exports = {
 *   presets: ['module:@react-native/babel-preset'],
 *   plugins: [
 *     ['rn-iconify/babel', {
 *       include: ['mdi:*', 'heroicons:*'],
 *       exclude: ['mdi:test-*'],
 *       verbose: true,
 *     }]
 *   ],
 * };
 * ```
 */

import { createRnIconifyPlugin, resetPluginState } from './plugin';
import type { BabelPluginOptions } from './types';

// Export types
export type { BabelPluginOptions };
export type { CollectedIcon, IconBundle, BabelPluginState } from './types';

// Export utilities for testing
export { collector } from './collector';
export { resetPluginState };
export {
  COMPONENT_PREFIX_MAP,
  PREFIX_COMPONENT_MAP,
  VALID_COMPONENTS,
  VALID_PREFIXES,
  getFilenameFromState,
  getFilenameFromFile,
} from './types';

/**
 * Default export for Babel plugin
 * This is what Babel will import when you add 'rn-iconify/babel' to your config
 */
export default createRnIconifyPlugin;

/**
 * Named export for explicit importing
 */
export { createRnIconifyPlugin };
