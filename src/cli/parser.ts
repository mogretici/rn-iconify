/**
 * Icon Usage Parser
 * Analyzes source code to find icon usage patterns
 */

import * as fs from 'fs';
import * as path from 'path';
import type { IconUsage, AnalysisResult } from './types';

/**
 * File extensions to analyze
 */
const ANALYZABLE_EXTENSIONS = ['.tsx', '.jsx', '.ts', '.js'];

/**
 * Regex patterns for finding icon usage
 */
const PATTERNS = {
  // JSX component usage: <Mdi name="home" /> or <Mdi name='home' />
  jsxComponent: /<(\w+)\s+[^>]*name\s*=\s*["']([^"']+)["'][^>]*\/?>/g,

  // Import statement to find component names
  iconImport: /import\s*{([^}]+)}\s*from\s*['"]rn-iconify['"]/g,

  // prefetchIcons usage: prefetchIcons(['mdi:home', 'mdi:settings'])
  prefetchIcons: /prefetchIcons\s*\(\s*\[([^\]]+)\]/g,

  // String icon names in arrays or objects: 'mdi:home' or "mdi:home"
  iconString: /['"](\w+:[^'"]+)['"]/g,
};

/**
 * Map of component names to icon prefixes
 */
const COMPONENT_PREFIX_MAP: Record<string, string> = {
  Mdi: 'mdi',
  MdiLight: 'mdi-light',
  Heroicons: 'heroicons',
  Lucide: 'lucide',
  Ph: 'ph',
  Feather: 'feather',
  Tabler: 'tabler',
  Bi: 'bi',
  Fa6Solid: 'fa6-solid',
  Fa6Regular: 'fa6-regular',
  Fa6Brands: 'fa6-brands',
  Fa7Solid: 'fa7-solid',
  Ri: 'ri',
  Carbon: 'carbon',
  Fluent: 'fluent',
  MaterialSymbols: 'material-symbols',
  Solar: 'solar',
  Ion: 'ion',
  AntDesign: 'ant-design',
  // Add more mappings as needed
};

/**
 * Get all files recursively from a directory
 */
function getFilesRecursively(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip node_modules and hidden directories
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }

    if (entry.isDirectory()) {
      getFilesRecursively(fullPath, files);
    } else if (ANALYZABLE_EXTENSIONS.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Parse a single file for icon usage
 */
function parseFile(filePath: string, verbose: boolean = false): Map<string, IconUsage> {
  const usageMap = new Map<string, IconUsage>();

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Track which icon components are imported
    const importedComponents = new Set<string>();

    // Find imports from rn-iconify
    let importMatch;
    PATTERNS.iconImport.lastIndex = 0;
    while ((importMatch = PATTERNS.iconImport.exec(content)) !== null) {
      const imports = importMatch[1].split(',').map((s) => s.trim());
      imports.forEach((imp) => {
        // Handle renamed imports: Mdi as Icon
        const name = imp.split(/\s+as\s+/)[0].trim();
        if (COMPONENT_PREFIX_MAP[name]) {
          importedComponents.add(name);
        }
      });
    }

    // Find JSX component usage
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineNum = lineIndex + 1;

      // Match <ComponentName name="iconName" />
      for (const componentName of importedComponents) {
        const componentRegex = new RegExp(
          `<${componentName}\\s+[^>]*name\\s*=\\s*["']([^"']+)["']`,
          'g'
        );

        let match;
        while ((match = componentRegex.exec(line)) !== null) {
          const iconName = match[1];
          const prefix = COMPONENT_PREFIX_MAP[componentName];
          const fullIconName = `${prefix}:${iconName}`;
          const column = match.index + 1;

          if (!usageMap.has(fullIconName)) {
            usageMap.set(fullIconName, {
              icon: fullIconName,
              count: 0,
              locations: [],
            });
          }

          const usage = usageMap.get(fullIconName)!;
          usage.count++;
          usage.locations.push({
            file: filePath,
            line: lineNum,
            column,
          });
        }
      }

      // Match prefetchIcons and direct string patterns
      PATTERNS.iconString.lastIndex = 0;
      let stringMatch;
      while ((stringMatch = PATTERNS.iconString.exec(line)) !== null) {
        const iconName = stringMatch[1];

        // Validate icon name format (prefix:name)
        if (iconName.includes(':') && !iconName.includes('/')) {
          if (!usageMap.has(iconName)) {
            usageMap.set(iconName, {
              icon: iconName,
              count: 0,
              locations: [],
            });
          }

          const usage = usageMap.get(iconName)!;
          usage.count++;
          usage.locations.push({
            file: filePath,
            line: lineNum,
            column: stringMatch.index + 1,
          });
        }
      }
    }

    if (verbose && usageMap.size > 0) {
      console.log(`  Found ${usageMap.size} icons in ${filePath}`);
    }
  } catch (error) {
    if (verbose) {
      console.error(`  Error parsing ${filePath}:`, error);
    }
  }

  return usageMap;
}

/**
 * Merge icon usage maps
 */
function mergeUsageMaps(target: Map<string, IconUsage>, source: Map<string, IconUsage>): void {
  for (const [icon, usage] of source) {
    if (target.has(icon)) {
      const existing = target.get(icon)!;
      existing.count += usage.count;
      existing.locations.push(...usage.locations);
    } else {
      target.set(icon, { ...usage });
    }
  }
}

/**
 * Analyze a directory for icon usage
 */
export function analyzeDirectory(srcDir: string, verbose: boolean = false): AnalysisResult {
  const absolutePath = path.resolve(srcDir);

  if (verbose) {
    console.log(`Analyzing directory: ${absolutePath}`);
  }

  const files = getFilesRecursively(absolutePath);

  if (verbose) {
    console.log(`Found ${files.length} files to analyze`);
  }

  const allUsage = new Map<string, IconUsage>();

  for (const file of files) {
    const fileUsage = parseFile(file, verbose);
    mergeUsageMaps(allUsage, fileUsage);
  }

  // Group by prefix
  const byPrefix: Record<string, { count: number; icons: string[] }> = {};
  const icons: IconUsage[] = [];

  for (const [iconName, usage] of allUsage) {
    const [prefix] = iconName.split(':');

    if (!byPrefix[prefix]) {
      byPrefix[prefix] = { count: 0, icons: [] };
    }

    byPrefix[prefix].count += usage.count;
    byPrefix[prefix].icons.push(iconName);
    icons.push(usage);
  }

  // Sort icons by count (descending)
  icons.sort((a, b) => b.count - a.count);

  return {
    totalIcons: allUsage.size,
    totalUsage: icons.reduce((sum, i) => sum + i.count, 0),
    byPrefix,
    icons,
    filesAnalyzed: files.length,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get unique icon names from analysis result
 */
export function getUniqueIcons(result: AnalysisResult): string[] {
  return result.icons.map((i) => i.icon);
}

/**
 * Parse icon list from string
 */
export function parseIconList(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return input;
  }

  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
