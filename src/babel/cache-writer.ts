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
 * Write bundle to file
 */
export function writeBundleToFile(bundle: IconBundle, outputPath: string, verbose: boolean): void {
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write bundle
  const content = JSON.stringify(bundle);
  fs.writeFileSync(outputPath, content, 'utf-8');

  if (verbose) {
    const sizeKB = (content.length / 1024).toFixed(2);
    console.log(`[rn-iconify] Bundle written to ${outputPath} (${sizeKB} KB)`);
  }
}

/**
 * Generate icon bundle from collected icons
 */
export async function generateBundle(
  iconNames: string[],
  options: BabelPluginOptions,
  projectRoot: string
): Promise<void> {
  const { outputPath = 'node_modules/.cache/rn-iconify', verbose = false } = options;

  if (iconNames.length === 0) {
    if (verbose) {
      console.log('[rn-iconify] No icons to bundle');
    }
    return;
  }

  try {
    // Fetch all icons
    const bundle = await fetchAndCreateBundle(iconNames, options);

    // Determine output file path
    const bundleFile = path.isAbsolute(outputPath)
      ? path.join(outputPath, 'icons.json')
      : path.join(projectRoot, outputPath, 'icons.json');

    // Write bundle to file
    writeBundleToFile(bundle, bundleFile, verbose);

    // Also write a JS module for easy importing
    const jsContent = `// Auto-generated by rn-iconify babel plugin
// Do not edit manually
module.exports = ${JSON.stringify(bundle)};
`;
    const jsFile = bundleFile.replace('.json', '.js');
    fs.writeFileSync(jsFile, jsContent, 'utf-8');

    if (verbose) {
      console.log(`[rn-iconify] Bundle generation complete!`);
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
  const bundleFile = path.isAbsolute(outputPath)
    ? path.join(outputPath, 'icons.json')
    : path.join(projectRoot, outputPath, 'icons.json');

  if (!fs.existsSync(bundleFile)) {
    return false;
  }

  try {
    const content = fs.readFileSync(bundleFile, 'utf-8');
    const bundle = JSON.parse(content) as IconBundle;
    return bundle.version === '1.0.0' && typeof bundle.count === 'number';
  } catch {
    return false;
  }
}
