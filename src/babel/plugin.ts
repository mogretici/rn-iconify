/**
 * Babel Plugin Visitor
 * Main visitor logic for the rn-iconify Babel plugin
 */

import type { PluginObj, types as BabelTypes } from '@babel/core';
import type { BabelPluginState, BabelPluginOptions } from './types';
import {
  COMPONENT_PREFIX_MAP,
  VALID_COMPONENTS,
  getFilenameFromState,
  getFilenameFromFile,
} from './types';
import {
  getComponentName,
  getNameAttribute,
  isCallTo,
  extractArrayStrings,
  getNodeLocation,
} from './ast-utils';
import { collector } from './collector';
import { generateBundle } from './cache-writer';

/**
 * Type guard to safely extract plugin options from 'this' context
 */
function hasPluginOpts(obj: unknown): obj is { opts: BabelPluginOptions } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'opts' in obj &&
    typeof (obj as Record<string, unknown>).opts === 'object'
  );
}

/**
 * Safely get plugin options from 'this' context
 */
function getPluginOptions(context: unknown): BabelPluginOptions {
  if (hasPluginOpts(context)) {
    return context.opts || {};
  }
  return {};
}

/**
 * Track which files have been fully processed
 */
const processedFiles = new Set<string>();

/**
 * Track if build is in progress
 */
let buildInProgress = false;

/**
 * Debounce timer for bundle generation
 */
let bundleTimer: NodeJS.Timeout | null = null;

/**
 * Project root directory
 */
let projectRoot = '';

/**
 * Create the rn-iconify Babel plugin
 */
export function createRnIconifyPlugin(babel: {
  types: typeof BabelTypes;
}): PluginObj<BabelPluginState> {
  const t = babel.types;

  return {
    name: 'rn-iconify',

    pre(file) {
      // Access plugin options through 'this' using type guard approach
      const opts = getPluginOptions(this);

      // Skip if disabled
      if (opts.disabled) {
        return;
      }

      // Initialize collector on first file
      if (!buildInProgress) {
        buildInProgress = true;
        collector.initialize(opts);

        // Detect project root from file - uses type guards for safe access
        const filename = getFilenameFromFile(file);
        if (filename) {
          // Try to find project root by looking for package.json
          let dir = filename;
          while (dir !== '/') {
            dir = dir.substring(0, dir.lastIndexOf('/'));
            try {
              require.resolve(`${dir}/package.json`);
              projectRoot = dir;
              break;
            } catch {
              continue;
            }
          }
          if (!projectRoot) {
            projectRoot = process.cwd();
          }
        }

        if (opts.verbose) {
          console.log(`[rn-iconify] Build started. Project root: ${projectRoot}`);
        }
      }
    },

    visitor: {
      /**
       * Visit import declarations to track which icon components are imported
       * This helps us know which JSX elements to look for
       */
      ImportDeclaration(path, state) {
        const opts = state.opts || {};
        if (opts.disabled) return;

        const source = path.node.source.value;

        // Only care about imports from rn-iconify
        if (source !== 'rn-iconify' && !source.startsWith('rn-iconify/')) {
          return;
        }

        // Track imported icon components for this file
        // (Not strictly necessary since we check COMPONENT_PREFIX_MAP, but could be optimized)
      },

      /**
       * Visit JSX opening elements to find icon usage
       * Handles: <Mdi name="home" />, <Heroicons name="user" />, etc.
       */
      JSXOpeningElement(path, state) {
        const opts = state.opts || {};
        if (opts.disabled) return;

        const filename = getFilenameFromState(state) || 'unknown';

        // Get component name
        const componentName = getComponentName(path.node, t);
        if (!componentName) return;

        // Check if it's a valid icon component
        if (!VALID_COMPONENTS.has(componentName)) return;

        // Get the icon name from the 'name' attribute
        const iconName = getNameAttribute(path.node, t);

        // Skip dynamic names
        if (!iconName) {
          if (opts.verbose) {
            const loc = getNodeLocation(path.node);
            console.log(
              `[rn-iconify] Skipping dynamic icon name in ${filename}:${loc.line} (component: ${componentName})`
            );
          }
          return;
        }

        // Get prefix from component name
        const prefix = COMPONENT_PREFIX_MAP[componentName];
        if (!prefix) return;

        // Build full icon name
        const fullIconName = `${prefix}:${iconName}`;

        // Add to collector
        const loc = getNodeLocation(path.node);
        collector.add(fullIconName, filename, loc.line, loc.column);
      },

      /**
       * Visit call expressions to find prefetchIcons usage
       * Handles: prefetchIcons(['mdi:home', 'mdi:settings'])
       */
      CallExpression(path, state) {
        const opts = state.opts || {};
        if (opts.disabled) return;

        const filename = getFilenameFromState(state) || 'unknown';

        // Check if this is a call to prefetchIcons
        if (!isCallTo(path, 'prefetchIcons', t)) return;

        // Get the first argument (should be an array of icon names)
        const firstArg = path.node.arguments[0];
        const iconNames = extractArrayStrings(firstArg, t);

        // Add each icon to collector
        const loc = getNodeLocation(path.node);
        for (const iconName of iconNames) {
          collector.add(iconName, filename, loc.line, loc.column);
        }
      },
    },

    post(file) {
      const opts = getPluginOptions(this);
      if (opts.disabled) return;

      const filename = getFilenameFromFile(file);

      // Mark file as processed
      if (filename) {
        processedFiles.add(filename);
        collector.markFileProcessed(filename);
      }

      // Debounce bundle generation
      // Metro processes files in parallel, so we wait for a quiet period
      if (bundleTimer) {
        clearTimeout(bundleTimer);
      }

      bundleTimer = setTimeout(async () => {
        // Only generate if we have icons and haven't already generated
        if (collector.hasIcons() && !collector.isBundleGenerated()) {
          collector.markBundleGenerated();
          collector.printSummary();

          try {
            await generateBundle(collector.getIconNames(), opts, projectRoot);
          } catch (error) {
            console.error('[rn-iconify] Bundle generation error:', error);
          }

          // Reset for next build
          buildInProgress = false;
        }
      }, 500); // Wait 500ms after last file to ensure all files are processed
    },
  };
}

/**
 * Reset plugin state (for testing)
 */
export function resetPluginState(): void {
  processedFiles.clear();
  buildInProgress = false;
  if (bundleTimer) {
    clearTimeout(bundleTimer);
    bundleTimer = null;
  }
  collector.reset();
}
