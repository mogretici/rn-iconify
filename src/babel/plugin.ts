/**
 * Babel Plugin Visitor
 * Main visitor logic for the rn-iconify Babel plugin
 *
 * Auto-inject flow:
 * 1. pre hook: scan project → detect icons → check if bundle exists
 * 2. ImportDeclaration visitor: inject loadOfflineBundle + bundle import when bundle exists
 * 3. post hook: generate/update bundle incrementally
 */

import * as nodePath from 'path';
import type { PluginObj, types as BabelTypes, NodePath } from '@babel/core';
import type { ImportDeclaration } from '@babel/types';
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
 * Debounce timer for bundle generation
 */
let bundleTimer: NodeJS.Timeout | null = null;

/**
 * Project root directory
 */
let projectRoot = '';

/**
 * Whether bundle exists at build start (set in pre hook)
 */
let bundleExists = false;

/**
 * Path to the existing bundle directory
 */
let bundleDirPath = '';

/**
 * Whether auto-inject has already been done for this build
 */
let hasInjected = false;

/**
 * Scanned icon names from the pre hook
 */
let scannedIcons: string[] = [];

/**
 * Existing bundle loaded during pre hook
 */
let existingBundle: IconBundle | null = null;

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

      // Initialize collector on first file
      if (!buildInProgress) {
        buildInProgress = true;
        hasInjected = false;
        collector.initialize(opts);

        // Detect project root from file
        const filename = getFilenameFromFile(file);
        if (filename) {
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

        const outputPath = opts.outputPath || '.rn-iconify';
        bundleDirPath = resolveBundleDir(outputPath, projectRoot);
        const bundleJsonPath = nodePath.join(bundleDirPath, 'icons.json');

        // Check if bundle exists
        existingBundle = readExistingBundle(bundleJsonPath);
        bundleExists = existingBundle !== null;

        // Run sync scanner to discover all icons in the project
        try {
          scannedIcons = scanProjectForIcons(projectRoot, {
            verbose: opts.verbose,
          });
        } catch (error) {
          if (opts.verbose) {
            console.warn('[rn-iconify] Scanner failed:', error);
          }
          scannedIcons = [];
        }

        if (opts.verbose) {
          console.log(`[rn-iconify] Build started. Project root: ${projectRoot}`);
          console.log(`[rn-iconify] Bundle exists: ${bundleExists}`);
          console.log(`[rn-iconify] Scanner found ${scannedIcons.length} icons`);
        }
      }
    },

    visitor: {
      /**
       * Visit import declarations to:
       * 1. Track which icon components are imported
       * 2. Auto-inject loadOfflineBundle when bundle exists
       */
      ImportDeclaration(path: NodePath<ImportDeclaration>, state: BabelPluginState) {
        const opts = state.opts || {};
        if (opts.disabled) return;

        const source = path.node.source.value;

        // Only care about imports from rn-iconify
        if (source !== 'rn-iconify' && !source.startsWith('rn-iconify/')) {
          return;
        }

        // Auto-inject: when bundle exists and we haven't injected yet
        const autoInject = opts.autoInject !== false;
        if (autoInject && bundleExists && !hasInjected && source === 'rn-iconify') {
          // Check if this file already has a manual loadOfflineBundle import
          const program = path.findParent((p) => p.isProgram());
          if (program && program.isProgram()) {
            let hasManualLoad = false;
            for (const stmt of program.node.body) {
              if (t.isImportDeclaration(stmt)) {
                for (const spec of stmt.specifiers) {
                  if (
                    t.isImportSpecifier(spec) &&
                    t.isIdentifier(spec.imported) &&
                    spec.imported.name === 'loadOfflineBundle'
                  ) {
                    hasManualLoad = true;
                    break;
                  }
                }
              }
              if (hasManualLoad) break;
            }

            if (!hasManualLoad) {
              hasInjected = true;

              // Compute relative path from this file to the bundle
              const filename = getFilenameFromState(state) || '';
              const bundleJsPath = nodePath.join(bundleDirPath, 'icons.js');
              let relativeBundlePath: string;

              if (filename) {
                const fileDir = nodePath.dirname(filename);
                relativeBundlePath = nodePath.relative(fileDir, bundleJsPath);
                if (!relativeBundlePath.startsWith('.')) {
                  relativeBundlePath = './' + relativeBundlePath;
                }
              } else {
                relativeBundlePath = bundleJsPath;
              }

              // Import loadOfflineBundle from 'rn-iconify'
              const loadBundleImport = t.importDeclaration(
                [
                  t.importSpecifier(
                    t.identifier('_rnIconifyLoadBundle'),
                    t.identifier('loadOfflineBundle')
                  ),
                ],
                t.stringLiteral('rn-iconify')
              );

              // Import bundle data
              const bundleDataImport = t.importDeclaration(
                [t.importDefaultSpecifier(t.identifier('_rnIconifyBundle'))],
                t.stringLiteral(relativeBundlePath)
              );

              // Call: _rnIconifyLoadBundle(_rnIconifyBundle)
              const loadCall = t.expressionStatement(
                t.callExpression(t.identifier('_rnIconifyLoadBundle'), [
                  t.identifier('_rnIconifyBundle'),
                ])
              );

              // Insert after the current import
              path.insertAfter([loadBundleImport, bundleDataImport, loadCall]);

              if (opts.verbose) {
                console.log(`[rn-iconify] Auto-injected bundle loading in ${filename}`);
              }
            }
          }
        }
      },

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

          buildInProgress = false;
        }
      }, 500);
    },
  };
}

/**
 * Reset plugin state (for testing)
 */
export function resetPluginState(): void {
  processedFiles.clear();
  buildInProgress = false;
  hasInjected = false;
  bundleExists = false;
  bundleDirPath = '';
  scannedIcons = [];
  existingBundle = null;
  if (bundleTimer) {
    clearTimeout(bundleTimer);
    bundleTimer = null;
  }
  collector.reset();
}
