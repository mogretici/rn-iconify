/**
 * Cache Writer
 * Fetches collected icons from Iconify API and writes them to a cache file
 * Runs in Node.js environment during build time
 */

import * as fs from 'fs';
import * as path from 'path';
import type { IconBundle, BabelPluginOptions } from './types';

/**
 * Iconify API configuration
 */
const ICONIFY_API_BASE = 'https://api.iconify.design';
const DEFAULT_TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const BATCH_SIZE = 50;

/**
 * Iconify API response structure
 */
interface IconifyAPIResponse {
  prefix: string;
  icons: Record<
    string,
    {
      body: string;
      width?: number;
      height?: number;
      left?: number;
      top?: number;
      hFlip?: boolean;
      vFlip?: boolean;
      rotate?: number;
    }
  >;
  width?: number;
  height?: number;
}

/**
 * Fetch with timeout (Node.js compatible)
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Build SVG string from Iconify icon data
 * @internal Exported for testing
 */
export function buildSvg(
  data: IconifyAPIResponse['icons'][string],
  defaultWidth = 24,
  defaultHeight = 24
): { svg: string; width: number; height: number } {
  const width = data.width ?? defaultWidth;
  const height = data.height ?? defaultHeight;
  const left = data.left ?? 0;
  const top = data.top ?? 0;
  const viewBox = `${left} ${top} ${width} ${height}`;

  // Apply transformations
  let transform = '';
  const transforms: string[] = [];

  if (data.rotate) {
    const rotation = data.rotate * 90;
    transforms.push(`rotate(${rotation} ${width / 2} ${height / 2})`);
  }

  if (data.hFlip || data.vFlip) {
    const scaleX = data.hFlip ? -1 : 1;
    const scaleY = data.vFlip ? -1 : 1;
    const translateX = data.hFlip ? width : 0;
    const translateY = data.vFlip ? height : 0;
    transforms.push(`translate(${translateX} ${translateY}) scale(${scaleX} ${scaleY})`);
  }

  if (transforms.length > 0) {
    transform = ` transform="${transforms.join(' ')}"`;
  }

  const body = transform ? `<g${transform}>${data.body}</g>` : data.body;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">${body}</svg>`;

  return { svg, width, height };
}

/**
 * Fetch a batch of icons with the same prefix
 */
async function fetchIconBatch(
  prefix: string,
  iconNames: string[],
  verbose: boolean
): Promise<Map<string, { svg: string; width: number; height: number }>> {
  const results = new Map<string, { svg: string; width: number; height: number }>();

  // Sort icon names alphabetically (Iconify best practice)
  const sortedNames = [...iconNames].sort();
  const namesString = sortedNames.join(',');

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const url = `${ICONIFY_API_BASE}/${prefix}.json?icons=${namesString}`;

      if (verbose) {
        console.log(`[rn-iconify] Fetching ${prefix} icons (attempt ${attempt + 1})...`);
      }

      const response = await fetchWithTimeout(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch ${prefix} icons`);
      }

      const data: IconifyAPIResponse = await response.json();

      if (!data || typeof data !== 'object' || !data.icons) {
        throw new Error(`Invalid API response for ${prefix} icons`);
      }

      // Process each icon
      for (const name of sortedNames) {
        const iconData = data.icons[name];
        if (iconData) {
          const { svg, width, height } = buildSvg(iconData, data.width, data.height);
          results.set(`${prefix}:${name}`, { svg, width, height });
        } else if (verbose) {
          console.warn(`[rn-iconify] Icon not found: ${prefix}:${name}`);
        }
      }

      return results;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }

  // Log error but don't fail the build
  console.error(
    `[rn-iconify] Failed to fetch ${prefix} icons after ${MAX_RETRIES + 1} attempts:`,
    lastError?.message
  );
  return results;
}

/**
 * Group icons by prefix
 * @internal Exported for testing
 */
export function groupIconsByPrefix(iconNames: string[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  for (const iconName of iconNames) {
    const [prefix, name] = iconName.split(':');
    if (prefix && name) {
      if (!grouped.has(prefix)) {
        grouped.set(prefix, []);
      }
      grouped.get(prefix)!.push(name);
    }
  }

  return grouped;
}

/**
 * Fetch all icons and create bundle
 */
export async function fetchAndCreateBundle(
  iconNames: string[],
  options: BabelPluginOptions
): Promise<IconBundle> {
  const { verbose = false } = options;
  const startTime = Date.now();

  if (verbose) {
    console.log(`[rn-iconify] Fetching ${iconNames.length} icons...`);
  }

  // Group icons by prefix
  const grouped = groupIconsByPrefix(iconNames);
  const allIcons: IconBundle['icons'] = {};
  let fetchedCount = 0;

  // Fetch each prefix group
  for (const [prefix, names] of grouped) {
    // Split into batches if too many icons
    for (let i = 0; i < names.length; i += BATCH_SIZE) {
      const batch = names.slice(i, i + BATCH_SIZE);
      const results = await fetchIconBatch(prefix, batch, verbose);

      for (const [iconName, data] of results) {
        allIcons[iconName] = data;
        fetchedCount++;
      }
    }
  }

  const bundle: IconBundle = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    icons: allIcons,
    count: fetchedCount,
  };

  if (verbose) {
    const elapsed = Date.now() - startTime;
    console.log(`[rn-iconify] Fetched ${fetchedCount}/${iconNames.length} icons in ${elapsed}ms`);
  }

  return bundle;
}

/**
 * Read existing bundle from disk
 * Returns null if file doesn't exist or is invalid
 */
export function readExistingBundle(bundlePath: string): IconBundle | null {
  try {
    if (!fs.existsSync(bundlePath)) return null;
    const content = fs.readFileSync(bundlePath, 'utf-8');
    const bundle = JSON.parse(content) as IconBundle;
    if (bundle.version === '1.0.0' && typeof bundle.count === 'number' && bundle.icons) {
      return bundle;
    }
  } catch {
    // Invalid bundle file
  }
  return null;
}

/**
 * Determine which icons are new and need to be fetched
 */
export function getNewIconNames(allIcons: string[], existingBundle: IconBundle | null): string[] {
  if (!existingBundle) return allIcons;
  return allIcons.filter((name) => !existingBundle.icons[name]);
}

/**
 * Write bundle to file (only if content changed)
 */
export function writeBundleToFile(bundle: IconBundle, outputPath: string, verbose: boolean): void {
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write bundle JSON
  const content = JSON.stringify(bundle);

  // Check if content actually changed
  if (fs.existsSync(outputPath)) {
    try {
      const existing = fs.readFileSync(outputPath, 'utf-8');
      const existingBundle = JSON.parse(existing) as IconBundle;
      if (existingBundle.count === bundle.count && existingBundle.version === bundle.version) {
        const existingKeys = Object.keys(existingBundle.icons).sort().join(',');
        const newKeys = Object.keys(bundle.icons).sort().join(',');
        if (existingKeys === newKeys) {
          if (verbose) {
            console.log('[rn-iconify] Bundle unchanged, skipping write');
          }
          return;
        }
      }
    } catch {
      // Existing file is corrupted, proceed with write
    }
  }

  fs.writeFileSync(outputPath, content, 'utf-8');

  if (verbose) {
    const sizeKB = (content.length / 1024).toFixed(2);
    console.log(`[rn-iconify] Bundle written to ${outputPath} (${sizeKB} KB)`);
  }
}

/**
 * Resolve the bundle directory path
 */
export function resolveBundleDir(outputPath: string, projectRoot: string): string {
  return path.isAbsolute(outputPath) ? outputPath : path.join(projectRoot, outputPath);
}

/**
 * Generate icon bundle from collected icons
 * Supports incremental fetching: only fetches icons not already in the existing bundle
 */
export async function generateBundle(
  iconNames: string[],
  options: BabelPluginOptions,
  projectRoot: string,
  existingBundle?: IconBundle | null
): Promise<void> {
  const { outputPath = '.rn-iconify', verbose = false } = options;

  if (iconNames.length === 0) {
    if (verbose) {
      console.log('[rn-iconify] No icons to bundle');
    }
    return;
  }

  const bundleDir = resolveBundleDir(outputPath, projectRoot);
  const bundleFile = path.join(bundleDir, 'icons.json');

  try {
    // Read existing bundle if not provided
    const existing = existingBundle !== undefined ? existingBundle : readExistingBundle(bundleFile);

    // Determine which icons need fetching
    const newIconNames = getNewIconNames(iconNames, existing);

    if (newIconNames.length === 0 && existing) {
      if (verbose) {
        console.log('[rn-iconify] All icons already bundled, skipping fetch');
      }
      return;
    }

    // Fetch only new icons
    const newBundle =
      newIconNames.length > 0
        ? await fetchAndCreateBundle(newIconNames, options)
        : ({
            version: '1.0.0',
            generatedAt: new Date().toISOString(),
            icons: {},
            count: 0,
          } as IconBundle);

    // Merge with existing bundle
    const mergedIcons = {
      ...(existing?.icons || {}),
      ...newBundle.icons,
    };

    const bundle: IconBundle = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      icons: mergedIcons,
      count: Object.keys(mergedIcons).length,
    };

    // Write bundle to file
    writeBundleToFile(bundle, bundleFile, verbose);

    // Also write a JS module for direct require() by Metro
    const jsContent = `// Auto-generated by rn-iconify babel plugin\n// Do not edit manually\nmodule.exports = ${JSON.stringify(bundle)};\n`;
    const jsFile = path.join(bundleDir, 'icons.js');
    fs.writeFileSync(jsFile, jsContent, 'utf-8');

    if (verbose) {
      const newCount = newIconNames.length;
      const existingCount = existing ? Object.keys(existing.icons).length : 0;
      console.log(
        `[rn-iconify] Bundle generation complete! ${newCount} new + ${existingCount} existing = ${bundle.count} total icons`
      );
    }
  } catch (error) {
    // Don't fail the build on bundle generation error
    console.error(
      '[rn-iconify] Bundle generation failed:',
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Check if bundle file exists and is valid
 */
export function isBundleValid(outputPath: string, projectRoot: string): boolean {
  const bundleDir = resolveBundleDir(outputPath, projectRoot);
  const bundleFile = path.join(bundleDir, 'icons.json');

  return readExistingBundle(bundleFile) !== null;
}
