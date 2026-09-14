/**
 * Babel Plugin Visitor
 * Main visitor logic for the rn-iconify Babel plugin
 *
 * 1. pre hook: scan the project for icons and read the existing bundle
 * 2. visitors: collect icon names from JSX and prefetchIcons() calls
 * 3. post hook: add newly found icons to the bundle on disk
 *
 * The plugin never changes the code it transforms. It used to inject a
 * loadOfflineBundle() call into whichever file importing rn-iconify it met
 * first, so the same file compiled one way or the other depending on worker
 * and build order — and Metro, which caches a transform by the file's
 * content, paired one compilation's code with the other's dependency map. The
 * injected require then reached an unrelated module. The library now loads the
 * bundle itself, from `rn-iconify/bundled-icons` (see rn-iconify/metro).
 */

import * as nodePath from 'path';
import * as fs from 'fs';
import type { PluginObj, types as BabelTypes } from '@babel/core';
import type { BabelPluginState, BabelPluginOptions } from './types';
import {
  COMPONENT_PREFIX_MAP,
  VALID_COMPONENTS,
  getFilenameFromState,
  getFilenameFromFile,
  getRootFromFile,
} from './types';
import {
  getComponentName,
  getNameAttribute,
  isCallTo,
  extractArrayStrings,
  getNodeLocation,
} from './ast-utils';
import { collector } from './collector';
import { generateBundle, readExistingBundle, resolveBundleDir } from './cache-writer';
import { scanProjectForIcons } from './scanner';
import type { IconBundle } from './types';

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
 * Timestamp when build started — used for stale build detection
 */
let buildStartTime = 0;

/**
 * Maximum build duration (ms) before auto-reset
 */
const BUILD_TIMEOUT = 60_000;

/**
 * Debounce timer for bundle generation
 */
let bundleTimer: NodeJS.Timeout | null = null;

/**
 * Project root directory
 */
let projectRoot = '';

/**
 * Path to the existing bundle directory
 */
let bundleDirPath = '';

/**
 * Scanned icon names from the pre hook
 */
let scannedIcons: string[] = [];

/**
 * Existing bundle loaded during pre hook
 */
let existingBundle: IconBundle | null = null;

/**
 * Reset all module-level build state
 * Called when build completes or when stale build is detected
 */
function resetBuildState(): void {
  buildInProgress = false;
  buildStartTime = 0;
  scannedIcons = [];
  existingBundle = null;
  processedFiles.clear();
  if (bundleTimer) {
    clearTimeout(bundleTimer);
    bundleTimer = null;
  }
}

const SCAN_LOCK_MAX_AGE = 30000; // 30 seconds

/**
 * Check if a scan lock file exists and is recent
 */
function isScanLockActive(lockPath: string, maxAge: number = SCAN_LOCK_MAX_AGE): boolean {
  try {
    const stat = fs.statSync(lockPath);
    return Date.now() - stat.mtimeMs < maxAge;
  } catch {
    return false;
  }
}

/**
 * Acquire the scan lock by writing a timestamp file
 * Returns true if lock was acquired, false if already held
 */
function acquireScanLock(lockPath: string): boolean {
  if (isScanLockActive(lockPath)) {
    return false;
  }
  try {
    const dir = nodePath.dirname(lockPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(lockPath, String(Date.now()), { flag: 'wx' });
    return true;
  } catch {
    // Another worker may have created it between our check and write
    return false;
  }
}

/**
 * Release the scan lock
 */
function releaseScanLock(lockPath: string): void {
  try {
    fs.unlinkSync(lockPath);
  } catch {
    // Already removed or never existed
  }
}

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
      const opts = getPluginOptions(this);

      if (opts.disabled) {
        return;
      }

      // Auto-reset stale builds (stuck for > 60s)
      if (buildInProgress && buildStartTime > 0 && Date.now() - buildStartTime > BUILD_TIMEOUT) {
        if (opts.verbose) {
          console.warn('[rn-iconify] Stale build detected (>60s), resetting state');
        }
        resetBuildState();
      }

      // Initialize collector on first file
      if (!buildInProgress) {
        buildInProgress = true;
        buildStartTime = Date.now();
        collector.initialize(opts);

        // Detect project root from Babel's root (set from babel.config.js location)
        const root = getRootFromFile(file);
        projectRoot = root || process.cwd();

        const outputPath = opts.outputPath || '.rn-iconify';
        bundleDirPath = resolveBundleDir(outputPath, projectRoot);
        const bundleJsonPath = nodePath.join(bundleDirPath, 'icons.json');

        existingBundle = readExistingBundle(bundleJsonPath);

        // Use file-based lock to prevent duplicate scans across Metro workers
        const lockPath = nodePath.join(bundleDirPath, '.scan-lock');
        const lockAcquired = acquireScanLock(lockPath);

        if (lockAcquired) {
          try {
            scannedIcons = scanProjectForIcons(projectRoot, {
              verbose: opts.verbose,
            });
          } catch (error) {
            if (opts.verbose) {
              console.warn('[rn-iconify] Scanner failed:', error);
            }
            scannedIcons = [];
          } finally {
            releaseScanLock(lockPath);
          }
        } else {
          if (opts.verbose) {
            console.log('[rn-iconify] Scanner skipped (another worker is scanning)');
          }
          scannedIcons = [];
        }

        if (opts.verbose) {
          console.log(`[rn-iconify] Build started. Project root: ${projectRoot}`);
          console.log(`[rn-iconify] Bundle exists: ${existingBundle !== null}`);
          console.log(`[rn-iconify] Scanner found ${scannedIcons.length} icons`);
        }
      }
    },

    visitor: {
      /**
       * Visit JSX opening elements to find icon usage
       */
      JSXOpeningElement(path, state) {
        const opts = state.opts || {};
        if (opts.disabled) return;

        const filename = getFilenameFromState(state) || 'unknown';

        const componentName = getComponentName(path.node, t);
        if (!componentName) return;

        if (!VALID_COMPONENTS.has(componentName)) return;

        const iconName = getNameAttribute(path.node, t);

        if (!iconName) {
          if (opts.verbose) {
            const loc = getNodeLocation(path.node);
            console.log(
              `[rn-iconify] Skipping dynamic icon name in ${filename}:${loc.line} (component: ${componentName})`
            );
          }
          return;
        }

        const prefix = COMPONENT_PREFIX_MAP[componentName];
        if (!prefix) return;

        const fullIconName = `${prefix}:${iconName}`;

        const loc = getNodeLocation(path.node);
        collector.add(fullIconName, filename, loc.line, loc.column);
      },

      /**
       * Visit call expressions to find prefetchIcons usage
       */
      CallExpression(path, state) {
        const opts = state.opts || {};
        if (opts.disabled) return;

        const filename = getFilenameFromState(state) || 'unknown';

        if (!isCallTo(path, 'prefetchIcons', t)) return;

        const firstArg = path.node.arguments[0];
        const iconNames = extractArrayStrings(firstArg, t);

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

      if (filename) {
        processedFiles.add(filename);
        collector.markFileProcessed(filename);
      }

      // Debounce bundle generation
      if (bundleTimer) {
        clearTimeout(bundleTimer);
      }

      bundleTimer = setTimeout(async () => {
        try {
          if (!collector.isBundleGenerated()) {
            collector.markBundleGenerated();

            // Merge AST-collected icons with scanner-collected icons
            const astIcons = collector.getIconNames();
            const allIcons = Array.from(new Set([...astIcons, ...scannedIcons]));

            if (allIcons.length > 0) {
              collector.printSummary();

              try {
                await generateBundle(allIcons, opts, projectRoot, existingBundle);
              } catch (error) {
                console.error('[rn-iconify] Bundle generation error:', error);
              }
            }
          }
        } finally {
          resetBuildState();
        }
      }, 500);
    },
  };
}

// Exported for testing
export { acquireScanLock, releaseScanLock, isScanLockActive, resetBuildState };

/**
 * Reset plugin state (for testing)
 */
export function resetPluginState(): void {
  processedFiles.clear();
  buildInProgress = false;
  projectRoot = '';
  bundleDirPath = '';
  scannedIcons = [];
  existingBundle = null;
  if (bundleTimer) {
    clearTimeout(bundleTimer);
    bundleTimer = null;
  }
  collector.reset();
}
