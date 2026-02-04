/**
 * Project File Scanner
 * Synchronously scans project source files for icon usage using regex
 * Used by the Babel plugin to discover all icons before the build
 */

import * as fs from 'fs';
import * as path from 'path';
import { COMPONENT_PREFIX_MAP } from './types';
import { isValidIconName } from './ast-utils';

/**
 * Scanner options
 */
export interface ScannerOptions {
  /**
   * File extensions to scan
   * @default ['.tsx', '.jsx', '.ts', '.js']
   */
  extensions?: string[];

  /**
   * Directories to exclude from scanning
   * @default ['node_modules', 'lib', '.rn-iconify', '__tests__', '__mocks__', 'dist', '.expo', '.git']
   */
  excludeDirs?: string[];

  /**
   * Enable verbose logging
   * @default false
   */
  verbose?: boolean;
}

const DEFAULT_EXTENSIONS = ['.tsx', '.jsx', '.ts', '.js'];
const DEFAULT_EXCLUDE_DIRS = new Set([
  'node_modules',
  'lib',
  '.rn-iconify',
  '__tests__',
  '__mocks__',
  'dist',
  '.expo',
  '.git',
  'android',
  'ios',
  'coverage',
]);

/**
 * Usage.json file structure (from Metro dev server learning)
 */
interface UsageFile {
  version: string;
  icons: string[];
  updatedAt: string;
}

/**
 * Build regex patterns for icon component detection
 * Matches: <Ion name="home" /> or <Ion name={'home'} /> or <Ion name={`home`} />
 */
function buildComponentRegex(): RegExp {
  const componentNames = Object.keys(COMPONENT_PREFIX_MAP).join('|');
  return new RegExp(
    `<(?:${componentNames})\\s[^>]*?name=(?:"([^"]+)"|\\{'([^']+)'\\}|\\{"([^"]+)"\\}|\\\`([^\`]+)\\\`)`,
    'g'
  );
}

/**
 * Build regex to extract component name from JSX
 */
function buildComponentNameRegex(): RegExp {
  const componentNames = Object.keys(COMPONENT_PREFIX_MAP).join('|');
  return new RegExp(`<(${componentNames})\\s`, 'g');
}

/**
 * Regex to match prefetchIcons calls
 * Matches: prefetchIcons(['ion:home', 'mdi:settings'])
 */
const PREFETCH_REGEX = /prefetchIcons\(\s*\[([^\]]*)\]/g;

/**
 * Regex to extract string items from array
 */
const STRING_ITEM_REGEX = /['"]([^'"]+)['"]/g;

/**
 * Scan a single file for icon usage
 */
function scanFile(
  filePath: string,
  componentRegex: RegExp,
  componentNameRegex: RegExp,
  verbose: boolean
): string[] {
  const icons: string[] = [];

  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return icons;
  }

  // Skip files that don't import from rn-iconify
  if (!content.includes('rn-iconify') && !content.includes('prefetchIcons')) {
    return icons;
  }

  // Scan for JSX component usage: <Ion name="home" />
  componentRegex.lastIndex = 0;
  componentNameRegex.lastIndex = 0;

  // Find all component usages with name attribute
  const fullPattern = new RegExp(componentRegex.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = fullPattern.exec(content)) !== null) {
    const iconName = match[1] || match[2] || match[3] || match[4];
    if (!iconName) continue;

    // Find the component name for this match by searching backwards
    const beforeMatch = content.substring(0, match.index + 20);
    const namePattern = new RegExp(componentNameRegex.source, 'g');
    let nameMatch: RegExpExecArray | null;
    let lastNameMatch: RegExpExecArray | null = null;

    while ((nameMatch = namePattern.exec(beforeMatch)) !== null) {
      if (nameMatch.index <= match.index) {
        lastNameMatch = nameMatch;
      }
    }

    if (lastNameMatch) {
      const componentName = lastNameMatch[1];
      const prefix = COMPONENT_PREFIX_MAP[componentName];
      if (prefix) {
        const fullName = `${prefix}:${iconName}`;
        if (!isValidIconName(fullName)) continue;
        icons.push(fullName);
        if (verbose) {
          console.log(`[rn-iconify:scanner] Found ${fullName} in ${filePath}`);
        }
      }
    }
  }

  // Scan for prefetchIcons calls
  PREFETCH_REGEX.lastIndex = 0;
  while ((match = PREFETCH_REGEX.exec(content)) !== null) {
    const arrayContent = match[1];
    if (!arrayContent) continue;

    STRING_ITEM_REGEX.lastIndex = 0;
    let itemMatch: RegExpExecArray | null;
    while ((itemMatch = STRING_ITEM_REGEX.exec(arrayContent)) !== null) {
      const iconName = itemMatch[1];
      if (iconName && iconName.includes(':') && isValidIconName(iconName)) {
        icons.push(iconName);
        if (verbose) {
          console.log(`[rn-iconify:scanner] Found prefetch ${iconName} in ${filePath}`);
        }
      }
    }
  }

  return icons;
}

/**
 * Recursively walk a directory synchronously
 */
function walkDirSync(
  dir: string,
  extensions: string[],
  excludeDirs: Set<string>,
  files: string[]
): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (excludeDirs.has(entry.name)) continue;
      walkDirSync(path.join(dir, entry.name), extensions, excludeDirs, files);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.includes(ext)) {
        files.push(path.join(dir, entry.name));
      }
    }
  }
}

/**
 * Read usage.json from the .rn-iconify directory
 */
function readUsageFile(projectRoot: string, verbose: boolean): string[] {
  const usagePath = path.join(projectRoot, '.rn-iconify', 'usage.json');

  try {
    if (!fs.existsSync(usagePath)) return [];
    const content = fs.readFileSync(usagePath, 'utf-8');
    const usage: UsageFile = JSON.parse(content);

    if (usage.version === '1.0.0' && Array.isArray(usage.icons)) {
      if (verbose) {
        console.log(`[rn-iconify:scanner] Read ${usage.icons.length} icons from usage.json`);
      }
      return usage.icons;
    }
  } catch {
    if (verbose) {
      console.log('[rn-iconify:scanner] Could not read usage.json');
    }
  }

  return [];
}

/**
 * Scan the entire project for icon usage
 * Returns a deduplicated array of full icon names (e.g., ['ion:home', 'mdi:settings'])
 */
export function scanProjectForIcons(projectRoot: string, options: ScannerOptions = {}): string[] {
  const { extensions = DEFAULT_EXTENSIONS, excludeDirs, verbose = false } = options;

  const excludeSet = excludeDirs ? new Set(excludeDirs) : DEFAULT_EXCLUDE_DIRS;

  const startTime = Date.now();

  // 1. Walk the project directory
  const files: string[] = [];
  walkDirSync(projectRoot, extensions, excludeSet, files);

  if (verbose) {
    console.log(`[rn-iconify:scanner] Found ${files.length} source files to scan`);
  }

  // 2. Build regex patterns once
  const componentRegex = buildComponentRegex();
  const componentNameRegex = buildComponentNameRegex();

  // 3. Scan each file
  const allIcons: Set<string> = new Set();

  for (const file of files) {
    const icons = scanFile(file, componentRegex, componentNameRegex, verbose);
    for (const icon of icons) {
      allIcons.add(icon);
    }
  }

  // 4. Merge with usage.json (dev-learned icons)
  const usageIcons = readUsageFile(projectRoot, verbose);
  for (const icon of usageIcons) {
    allIcons.add(icon);
  }

  const result = Array.from(allIcons);
  const elapsed = Date.now() - startTime;

  if (verbose) {
    console.log(
      `[rn-iconify:scanner] Scan complete: ${result.length} unique icons from ${files.length} files in ${elapsed}ms`
    );
  }

  return result;
}
