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
    `<(${componentNames})\\s[^>]*?name=(?:"([^"]+)"|\\{([^}]*)\\}|\\\`([^\`]+)\\\`)`,
    'g'
  );
}

/**
 * The icon names an attribute value can produce.
 *
 * `name="home"` is one. `name={paused ? 'play' : 'pause'}` is two, and it is
 * how a React component says an icon depends on state — the names are still
 * literals, still in the source, still certain. Reading only the first quoted
 * string missed every one of them, so an icon that toggles was fetched over
 * the network the first time it toggled.
 *
 * Every literal in the expression is taken; a string that is not an icon in
 * that set is dropped by the validity check downstream.
 */
function literalsIn(value: string): string[] {
  const names: string[] = [];

  STRING_ITEM_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = STRING_ITEM_REGEX.exec(value)) !== null) {
    if (match[1]) names.push(match[1]);
  }

  return names;
}

/**
 * Matches a defineIcons call and captures its type argument and body.
 *
 * `defineIcons<MdiIconName>({ OUTFIT: 'hanger' })` — the type argument names
 * the set, the body holds the names. This is the one place an application can
 * state icons the source could not otherwise prove, so it is read as
 * carefully as the icon components themselves.
 */
const DEFINE_ICONS_REGEX = /defineIcons\s*<\s*(\w+)IconName\s*>\s*\(\s*([[{])/g;

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
 * Take the text between a bracket and its match.
 *
 * A declaration can nest — an object of arrays, a comment holding a brace —
 * so the closing bracket is found by counting rather than by the next one
 * that appears.
 */
function extractBalanced(content: string, openIndex: number, opener: string): string | null {
  const closer = opener === '[' ? ']' : '}';
  let depth = 0;

  for (let i = openIndex; i < content.length; i++) {
    const char = content[i];
    if (char === opener) depth++;
    else if (char === closer) {
      depth--;
      if (depth === 0) return content.slice(openIndex + 1, i);
    }
  }

  return null;
}

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
    if (!componentName) continue;

    const prefix = COMPONENT_PREFIX_MAP[componentName];
    if (!prefix) continue;

    // A quoted attribute is the name itself; a braced one is an expression
    // that may hold more than one.
    const candidates = match[2]
      ? [match[2]]
      : match[3] !== undefined
        ? literalsIn(match[3])
        : match[4]
          ? [match[4]]
          : [];

    for (const iconName of candidates) {
      const fullName = `${prefix}:${iconName}`;
      if (!isValidIconName(fullName)) continue;
      icons.push(fullName);
      if (verbose) {
        console.log(`[rn-iconify:scanner] Found ${fullName} in ${filePath}`);
      }
    }
  }

  // Scan for defineIcons declarations
  DEFINE_ICONS_REGEX.lastIndex = 0;
  while ((match = DEFINE_ICONS_REGEX.exec(content)) !== null) {
    const componentName = match[1];
    const opener = match[2];
    if (!componentName || !opener) continue;

    const prefix = COMPONENT_PREFIX_MAP[componentName];
    if (!prefix) continue;

    const body = extractBalanced(content, match.index + match[0].length - 1, opener);
    if (body === null) continue;

    STRING_ITEM_REGEX.lastIndex = 0;
    let itemMatch: RegExpExecArray | null;
    while ((itemMatch = STRING_ITEM_REGEX.exec(body)) !== null) {
      const iconName = itemMatch[1];
      if (!iconName) continue;

      const fullName = `${prefix}:${iconName}`;
      if (!isValidIconName(fullName)) continue;

      icons.push(fullName);
      if (verbose) {
        console.log(`[rn-iconify:scanner] Found ${fullName} via defineIcons in ${filePath}`);
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

/** Any field annotated with a type: `icon?: IonIconName`, `name: IoniconName`. */
const TYPED_FIELD_REGEX = /(\w+)\s*\??\s*:\s*(\w+)\b/g;

/**
 * A name for an icon set's name type, declared in the file itself.
 *
 * `type IoniconName = ComponentProps<typeof Ion>['name']` is the same
 * statement as `IonIconName`, written the way someone reaches for when they
 * want the type of a prop rather than the exported alias. Without this the
 * field it annotates names no set, and every icon assigned to it is fetched
 * at runtime.
 */
const TYPE_ALIAS_REGEX =
  /type\s+(\w+)\s*=\s*(?:React\.)?ComponentProps<\s*typeof\s+(\w+)\s*>\s*\[\s*['"]name['"]\s*\]/g;

/**
 * A field assigned a string, anywhere: `{ icon: 'explore' }`.
 *
 * Only ever consulted for a field this file has already annotated with an
 * icon set, so the match is narrow despite the pattern being wide.
 */
const FIELD_LITERAL_REGEX = /(\w+)\s*:\s*['"]([^'"]+)['"]/g;

/** A table whose values are all icons: `Record<string, MdiIconName> = {`. */
const RECORD_TYPE_REGEX = /:\s*(?:Readonly<)?Record<[^,>]+,\s*(\w+)\s*>>?\s*=\s*\{/g;

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
 * Every name in one file that means "an icon of this set".
 *
 * `IonIconName` always does. So does anything the file declares for the same
 * purpose — see TYPE_ALIAS_REGEX.
 */
function collectIconTypes(content: string): Map<string, string> {
  const types = new Map<string, string>();

  for (const [component, prefix] of Object.entries(COMPONENT_PREFIX_MAP)) {
    types.set(`${component}IconName`, prefix);
  }

  TYPE_ALIAS_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TYPE_ALIAS_REGEX.exec(content)) !== null) {
    const alias = match[1];
    const component = match[2];
    if (!alias || !component) continue;
    const prefix = COMPONENT_PREFIX_MAP[component];
    if (prefix) types.set(alias, prefix);
  }

  return types;
}

/** Fields this file has annotated with an icon set: `icon` -> `ion`. */
function collectIconFields(content: string): WrapperProps {
  const types = collectIconTypes(content);
  const fields: WrapperProps = new Map();

  TYPED_FIELD_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TYPED_FIELD_REGEX.exec(content)) !== null) {
    const field = match[1];
    const type = match[2];
    if (!field || !type) continue;
    const prefix = types.get(type);
    if (prefix) fields.set(field, prefix);
  }

  return fields;
}

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

    const props = collectIconFields(content);
    let match: RegExpExecArray | null;

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
 * Scan one file for icon names assigned to a field it has typed with a set.
 *
 * A name does not have to reach `<Ion>` directly to be known at build time. It
 * is just as certain in a table the file declares:
 *
 * ```ts
 * interface TabConfig { icon: MaterialSymbolsIconName }
 * const TABS: TabConfig[] = [{ icon: 'explore', route: 'Home' }]
 * ```
 *
 * The type says which set, the literal says which icon, and both are in the
 * file. Reading only JSX attributes and `defineIcons` left every table like
 * this out of the bundle — correct, idiomatic code, fetched over the network
 * on first render because the scan stopped short of it.
 *
 * Scoped to the file: a field is only read as an icon where that file has
 * annotated it with a set.
 */
function scanFileForTypedFields(filePath: string, content: string, verbose: boolean): string[] {
  if (!content.includes('IconName') && !content.includes('ComponentProps')) return [];

  const types = collectIconTypes(content);
  const fields = collectIconFields(content);
  const icons: string[] = [];

  // `const ICONS: Record<string, MdiIconName> = { WIN: 'trophy' }` — no field
  // is named an icon here; the whole table is one. Every value in it is.
  RECORD_TYPE_REGEX.lastIndex = 0;
  let record: RegExpExecArray | null;
  while ((record = RECORD_TYPE_REGEX.exec(content)) !== null) {
    const prefix = types.get(record[1] ?? '');
    if (!prefix) continue;

    const body = extractBalanced(
      content,
      content.indexOf('{', record.index + record[0].length - 1),
      '{'
    );
    if (!body) continue;

    STRING_ITEM_REGEX.lastIndex = 0;
    let item: RegExpExecArray | null;
    while ((item = STRING_ITEM_REGEX.exec(body)) !== null) {
      const fullName = `${prefix}:${item[1]}`;
      if (!isValidIconName(fullName)) continue;
      icons.push(fullName);
      if (verbose) {
        console.log(`[rn-iconify:scanner] Found ${fullName} via a typed record in ${filePath}`);
      }
    }
  }

  if (fields.size === 0) return icons;

  FIELD_LITERAL_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = FIELD_LITERAL_REGEX.exec(content)) !== null) {
    const field = match[1];
    const value = match[2];
    if (!field || !value) continue;

    const prefix = fields.get(field);
    if (!prefix) continue;

    const fullName = `${prefix}:${value}`;
    if (!isValidIconName(fullName)) continue;

    icons.push(fullName);
    if (verbose) {
      console.log(`[rn-iconify:scanner] Found ${fullName} via ${field}: in ${filePath}`);
    }
  }

  return icons;
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
        `<${componentName}\\s(?:[^>]|\\n)*?\\b${propName}=(?:"([^"]+)"|\\{([^}]*)\\})`,
        'g'
      );

      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        const candidates = match[1] ? [match[1]] : literalsIn(match[2] ?? '');

        for (const iconName of candidates) {
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
    for (const icon of scanFileForTypedFields(file, content, verbose)) {
      allIcons.add(icon);
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
