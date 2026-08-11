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
 * Build a single combined regex that captures both the component name
 * and the icon name in one match — O(n) single pass instead of O(n²)
 *
 * Captures:
 *   group 1 = component name (e.g., "Ion")
 *   group 2 = icon name from name="..."
 *   group 3 = icon name from name={'...'}
 *   group 4 = icon name from name={"..."}
 *   group 5 = icon name from name={`...`}
 */
function buildCombinedRegex(): RegExp {
  const componentNames = Object.keys(COMPONENT_PREFIX_MAP).join('|');
  return new RegExp(
    `<(${componentNames})\\s[^>]*?name=(?:"([^"]+)"|\\{'([^']+)'\\}|\\{"([^"]+)"\\}|\\\`([^\`]+)\\\`)`,
    'g'
  );
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
  content: string,
  combinedRegex: RegExp,
  verbose: boolean
): string[] {
  const icons: string[] = [];

  // Skip files that don't import from rn-iconify
  if (!content.includes('rn-iconify') && !content.includes('prefetchIcons')) {
    return icons;
  }

  // Single-pass scan: combined regex captures component name + icon name in one match
  combinedRegex.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combinedRegex.exec(content)) !== null) {
    const componentName = match[1];
    const iconName = match[2] || match[3] || match[4] || match[5];
    if (!componentName || !iconName) continue;

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
 * A component that takes an icon name as a prop, and which icon set that
 * prop belongs to.
 *
 * Applications almost never call the icon components directly everywhere;
 * they build a row, a button or an empty state that takes `icon` and renders
 * the icon component inside. The name is still a literal in the source — it
 * just sits on the wrapper rather than on `<Ion>`, which the direct scan
 * cannot see. Those icons then fall through to a network fetch at runtime.
 *
 * The prop's declared type is what makes this exact rather than a guess:
 * `icon?: IonIconName` names the set, so no prefix has to be inferred.
 */
type WrapperProps = Map<string, string>;
type WrapperMap = Map<string, WrapperProps>;

/** `IonIconName` -> `ion`, via the component name the type is built from. */
const ICON_NAME_TYPE_REGEX = /(\w+)\s*\??\s*:\s*(\w+)IconName\b/g;

/**
 * Component-shaped declarations in a file, exported or not.
 *
 * Not only the exported ones: a file often declares a small local component —
 * the row inside a list, the button inside a bar — that takes the icon prop
 * and is used a few lines further down. Those are as real a call site as any.
 */
const COMPONENT_DECLARATION_REGEX =
  /(?:^|\n)\s*(?:export\s+(?:default\s+)?)?(?:function|const|class)\s+([A-Z]\w*)/g;

/**
 * Find components that accept an icon name as a prop.
 *
 * Scoped to the file that declares the prop: the type annotation and the
 * component live together, so nothing has to be resolved across files.
 */
function collectWrappers(sources: Map<string, string>, verbose: boolean): WrapperMap {
  const wrappers: WrapperMap = new Map();

  for (const [filePath, content] of sources) {
    if (!content.includes('IconName')) continue;

    const props: WrapperProps = new Map();
    ICON_NAME_TYPE_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = ICON_NAME_TYPE_REGEX.exec(content)) !== null) {
      const propName = match[1];
      const componentName = match[2];
      if (!propName || !componentName) continue;
      const prefix = COMPONENT_PREFIX_MAP[componentName];
      if (prefix) props.set(propName, prefix);
    }

    if (props.size === 0) continue;

    const names = new Set<string>();
    COMPONENT_DECLARATION_REGEX.lastIndex = 0;
    while ((match = COMPONENT_DECLARATION_REGEX.exec(content)) !== null) {
      if (match[1]) names.add(match[1]);
    }
    // A component exported via `export default X` at the end of the file, or
    // wrapped in memo(), is still reachable by the file's own name.
    const stem = path.basename(filePath, path.extname(filePath));
    if (/^[A-Z]/.test(stem)) names.add(stem);

    for (const name of names) {
      const existing = wrappers.get(name);
      if (existing) {
        for (const [prop, prefix] of props) existing.set(prop, prefix);
      } else {
        wrappers.set(name, new Map(props));
      }
    }

    if (verbose && names.size > 0) {
      console.log(
        `[rn-iconify:scanner] Wrapper ${Array.from(names).join('/')} takes ${Array.from(
          props.keys()
        ).join(', ')} in ${filePath}`
      );
    }
  }

  return wrappers;
}

/**
 * Scan one file for icon names handed to wrapper components.
 */
function scanFileForWrappers(
  filePath: string,
  content: string,
  wrappers: WrapperMap,
  verbose: boolean
): string[] {
  const icons: string[] = [];

  for (const [componentName, props] of wrappers) {
    if (!content.includes(`<${componentName}`)) continue;

    for (const [propName, prefix] of props) {
      const regex = new RegExp(
        `<${componentName}\\s(?:[^>]|\\n)*?\\b${propName}=(?:"([^"]+)"|\\{'([^']+)'\\}|\\{"([^"]+)"\\})`,
        'g'
      );

      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        const iconName = match[1] || match[2] || match[3];
        if (!iconName) continue;

        const fullName = `${prefix}:${iconName}`;
        if (!isValidIconName(fullName)) continue;

        icons.push(fullName);
        if (verbose) {
          console.log(
            `[rn-iconify:scanner] Found ${fullName} via <${componentName} ${propName}> in ${filePath}`
          );
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

  // 2. Build combined regex once (single-pass O(n) per file)
  const combinedRegex = buildCombinedRegex();

  // 3. Read every file once. Finding icons handed to wrapper components needs
  //    two passes — a wrapper is declared in one file and used in another —
  //    and reading twice would double the I/O of every build. Project sources
  //    are text measured in single-digit megabytes; holding them for the
  //    length of a scan costs nothing next to that.
  const sources = new Map<string, string>();
  for (const file of files) {
    try {
      sources.set(file, fs.readFileSync(file, 'utf-8'));
    } catch {
      // A file that cannot be read contributes no icons.
    }
  }

  // 4. Learn which components take an icon name as a prop, so a name handed
  //    to one of those is found as surely as one written on <Ion> directly.
  const wrappers = collectWrappers(sources, verbose);

  // 5. Scan each file
  const allIcons: Set<string> = new Set();

  for (const [file, content] of sources) {
    for (const icon of scanFile(file, content, combinedRegex, verbose)) {
      allIcons.add(icon);
    }
    if (wrappers.size > 0) {
      for (const icon of scanFileForWrappers(file, content, wrappers, verbose)) {
        allIcons.add(icon);
      }
    }
  }

  // 6. Merge with usage.json (dev-learned icons)
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
