/**
 * Bundle Command
 * Fetches icons and creates an offline bundle file
 */

import * as fs from 'fs';
import * as path from 'path';
import type { BundleOptions, IconBundle } from '../types';
import { EXIT_CODES } from '../types';
import { analyzeDirectory, getUniqueIcons, parseIconList } from '../parser';

/**
 * Iconify API base URL
 */
const ICONIFY_API = 'https://api.iconify.design';

/**
 * Fetch timeout in milliseconds
 */
const FETCH_TIMEOUT = 30000;

/**
 * Fetch multiple icons with batching
 */
async function fetchIcons(
  icons: string[],
  verbose: boolean,
  onProgress?: (current: number, total: number) => void
): Promise<Record<string, { svg: string; width: number; height: number }>> {
  const results: Record<string, { svg: string; width: number; height: number }> = {};

  // Group by prefix for batch fetching
  const byPrefix = new Map<string, string[]>();

  for (const icon of icons) {
    const [prefix, name] = icon.split(':');
    if (!byPrefix.has(prefix)) {
      byPrefix.set(prefix, []);
    }
    byPrefix.get(prefix)!.push(name);
  }

  let processed = 0;
  const total = icons.length;

  // Fetch each prefix batch
  for (const [prefix, names] of byPrefix) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      // Sort names alphabetically (Iconify best practice)
      const sortedNames = [...names].sort();
      const url = `${ICONIFY_API}/${prefix}.json?icons=${sortedNames.join(',')}`;

      if (verbose) {
        console.log(`  Fetching ${sortedNames.length} icons from ${prefix}...`);
      }

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        console.error(`  Failed to fetch ${prefix}: ${response.status}`);
        processed += names.length;
        continue;
      }

      const data = await response.json();
      const defaultWidth = data.width ?? 24;
      const defaultHeight = data.height ?? 24;

      for (const name of names) {
        const iconData = data.icons?.[name];

        if (iconData) {
          const width = iconData.width ?? defaultWidth;
          const height = iconData.height ?? defaultHeight;
          const body = iconData.body;
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${body}</svg>`;

          results[`${prefix}:${name}`] = { svg, width, height };
        } else if (verbose) {
          console.error(`  Icon not found: ${prefix}:${name}`);
        }

        processed++;
        onProgress?.(processed, total);
      }
    } catch (error) {
      if (verbose) {
        console.error(`  Error fetching ${prefix}:`, error);
      }
      processed += names.length;
    }
  }

  return results;
}

/**
 * Bundle command implementation
 */
export async function bundleCommand(options: BundleOptions): Promise<number> {
  const {
    src = './src',
    output = './assets/icons.bundle.json',
    auto = true,
    icons: manualIcons,
    exclude = [],
    verbose = false,
    pretty = false,
  } = options;

  console.log('\n📦 rn-iconify Bundle Generator\n');

  let iconsToBundle: string[] = [];

  // Auto-detect icons from source
  if (auto) {
    console.log(`🔍 Analyzing source code in ${src}...`);

    const analysis = analyzeDirectory(src, verbose);

    if (analysis.totalIcons === 0) {
      console.log('⚠️  No icons found in source code.');
    } else {
      console.log(`   Found ${analysis.totalIcons} unique icons\n`);
      iconsToBundle = getUniqueIcons(analysis);
    }
  }

  // Add manual icons
  if (manualIcons) {
    const parsed = parseIconList(manualIcons);
    console.log(`📋 Adding ${parsed.length} manual icons...`);

    for (const icon of parsed) {
      if (!iconsToBundle.includes(icon)) {
        iconsToBundle.push(icon);
      }
    }
  }

  // Apply exclusions
  if (exclude.length > 0) {
    const beforeCount = iconsToBundle.length;
    iconsToBundle = iconsToBundle.filter((icon) => {
      return !exclude.some((pattern) => {
        if (pattern.includes('*')) {
          const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
          return regex.test(icon);
        }
        return icon === pattern;
      });
    });

    if (verbose) {
      console.log(`   Excluded ${beforeCount - iconsToBundle.length} icons`);
    }
  }

  if (iconsToBundle.length === 0) {
    console.error('\n❌ No icons to bundle.');
    console.log('   Use --icons to specify icons manually or check your source code.\n');
    return EXIT_CODES.ERROR;
  }

  console.log(`\n📥 Fetching ${iconsToBundle.length} icons from Iconify API...`);

  // Progress indicator
  let lastPercent = 0;
  const onProgress = (current: number, total: number) => {
    const percent = Math.floor((current / total) * 100);
    if (percent >= lastPercent + 10) {
      lastPercent = percent;
      process.stdout.write(`   ${percent}%`);
      if (percent < 100) process.stdout.write(' ');
    }
  };

  const fetchedIcons = await fetchIcons(iconsToBundle, verbose, onProgress);
  console.log('\n');

  const fetchedCount = Object.keys(fetchedIcons).length;
  const failedCount = iconsToBundle.length - fetchedCount;

  if (failedCount > 0) {
    console.log(`⚠️  Failed to fetch ${failedCount} icons`);
  }

  if (fetchedCount === 0) {
    console.error('❌ No icons were fetched. Check your network connection.\n');
    return EXIT_CODES.NETWORK_ERROR;
  }

  // Create bundle
  const bundle: IconBundle = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    icons: fetchedIcons,
    count: fetchedCount,
  };

  // Ensure output directory exists
  const outputDir = path.dirname(output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write bundle file
  const jsonContent = pretty ? JSON.stringify(bundle, null, 2) : JSON.stringify(bundle);

  fs.writeFileSync(output, jsonContent, 'utf-8');

  // Calculate file size
  const stats = fs.statSync(output);
  const sizeKB = (stats.size / 1024).toFixed(2);

  console.log(`✅ Bundle created successfully!`);
  console.log(`   Output: ${output}`);
  console.log(`   Icons: ${fetchedCount}`);
  console.log(`   Size: ${sizeKB} KB\n`);

  console.log('💡 Usage:');
  console.log("   import { loadOfflineBundle } from 'rn-iconify';");
  console.log(`   import bundle from '${output.replace(/^\.\//, './')}';`);
  console.log('   loadOfflineBundle(bundle);\n');

  return EXIT_CODES.SUCCESS;
}
