/**
 * Icon Component Generator
 * Fetches all icon sets from Iconify API and generates typed React Native components
 *
 * Usage: npx tsx scripts/generate-components.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import { renderIconEntries, selectAliases, selectDeprecated } from './icon-aliases';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONIFY_API = 'https://api.iconify.design';
const COMPONENTS_DIR = path.join(__dirname, '../src/components');

// Popular icon sets to prioritize (these get generated first)
const PRIORITY_SETS = [
  'mdi',
  'heroicons',
  'lucide',
  'phosphor',
  'feather',
  'tabler',
  'bi',
  'fa6-solid',
  'fa6-regular',
  'ri',
  'carbon',
  'ion',
  'octicon',
  'simple-icons',
  'logos',
  'fluent',
  'ant-design',
  'material-symbols',
  'solar',
  'iconoir',
];

// Icon sets to skip (too large, deprecated, or problematic)
const SKIP_SETS = [
  'noto',
  'twemoji',
  'openmoji',
  'emojione',
  'emojione-v1',
  'fxemoji',
  'noto-v1',
  'flat-color-icons',
];

interface Collection {
  name: string;
  total: number;
  author?: { name: string };
  license?: { title: string };
  category?: string;
}

interface CollectionData {
  prefix: string;
  total: number;
  title: string;
  uncategorized?: string[];
  categories?: Record<string, string[]>;
  /** Renamed icons: the old name maps to the one that is current. */
  aliases?: Record<string, string>;
  /** Icons hidden from the listing but still served by the API. */
  hidden?: string[];
}

interface CollectionIcons {
  /** Icon names that exist under their own name. */
  names: string[];
  /** Old name -> current name, for icons upstream has since renamed. */
  aliases: Record<string, string>;
  /** Names upstream no longer lists but still serves. */
  deprecated: string[];
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

/**
 * Writes a generated file the way Prettier would.
 *
 * These files go through lint like any other source, and the generator's own
 * quoting does not match the project's style — it quotes every key, Prettier
 * only quotes the ones that need it. Formatting here keeps a sync from
 * producing thousands of lint errors, and keeps regenerating locally from
 * showing a diff that is purely formatting.
 */
async function writeFormatted(filePath: string, content: string): Promise<void> {
  const config = await prettier.resolveConfig(filePath);
  const formatted = await prettier.format(content, {
    ...config,
    filepath: filePath,
  });

  fs.writeFileSync(filePath, formatted);
}

async function fetchCollections(): Promise<Record<string, Collection>> {
  console.log('Fetching icon collections from Iconify API...');
  const response = await fetch(`${ICONIFY_API}/collections`);
  if (!response.ok) {
    throw new Error(`Failed to fetch collections: ${response.status}`);
  }
  return (await response.json()) as Record<string, Collection>;
}

/**
 * Fetches a collection's icons along with the aliases Iconify keeps for names
 * it has renamed.
 *
 * The aliases matter as much as the icons. Upstream renames happen routinely —
 * `pinhead:five` became `pinhead:5`, `fluent:text-add-28-filled` became
 * `text-add-t-28-filled` — and Iconify keeps the old name working. Generating
 * from the icon list alone silently drops those names from this package, which
 * breaks every app using them. Keeping them costs one line of output each.
 */
async function fetchCollectionIcons(prefix: string): Promise<CollectionIcons> {
  const response = await fetch(`${ICONIFY_API}/collection?prefix=${prefix}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch collection ${prefix}: ${response.status}`);
  }
  const data = (await response.json()) as CollectionData;
  const icons: string[] = [...(data.uncategorized ?? [])];
  if (data.categories) {
    for (const categoryIcons of Object.values(data.categories)) {
      icons.push(...categoryIcons);
    }
  }

  const names = [...new Set(icons)];

  const deprecated = selectDeprecated(names, data.hidden ?? []);

  // Aliases may point at a hidden icon, which is still generated — so the set
  // of valid targets is everything this component will expose, not just what
  // upstream currently lists.
  return {
    names,
    aliases: selectAliases([...names, ...deprecated], data.aliases ?? {}),
    deprecated,
  };
}

function generateComponentContent(
  prefix: string,
  componentName: string,
  icons: CollectionIcons
): string {
  const typeName = `${componentName}IconName`;
  const varName = prefix.replace(/-/g, '_');

  const iconNamesObj = renderIconEntries(icons.names, icons.aliases, icons.deprecated);

  return `/**
 * ${componentName} Icon Set
 * @see https://icon-sets.iconify.design/${prefix}/
 *
 * Auto-generated - do not edit manually
 */

import { createIconSet } from '../createIconSet';

const ${varName}IconNames = {
${iconNamesObj}
} as const;

export type ${typeName} = keyof typeof ${varName}IconNames;
export const ${componentName} = createIconSet<${typeName}>('${prefix}', ${varName}IconNames);
`;
}

function generateIndexContent(
  components: Array<{ componentName: string; typeName: string; fileName: string }>
): string {
  const exports = components
    .map(({ componentName, typeName, fileName }) => {
      return `export { ${componentName}, type ${typeName} } from './${fileName}';`;
    })
    .join('\n');

  return `/**
 * Icon Set Components
 * Auto-generated - do not edit manually
 *
 * ${components.length} icon sets available
 */

${exports}
`;
}

async function generateComponents(): Promise<void> {
  console.log('Starting icon component generation...\n');

  if (!fs.existsSync(COMPONENTS_DIR)) {
    fs.mkdirSync(COMPONENTS_DIR, { recursive: true });
  }

  const collections = await fetchCollections();
  const prefixes = Object.keys(collections);

  console.log(`Found ${prefixes.length} icon collections\n`);

  const sortedPrefixes = prefixes.sort((a, b) => {
    const aIndex = PRIORITY_SETS.indexOf(a);
    const bIndex = PRIORITY_SETS.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  const generatedComponents: Array<{
    componentName: string;
    typeName: string;
    fileName: string;
    iconCount: number;
  }> = [];

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const prefix of sortedPrefixes) {
    if (SKIP_SETS.includes(prefix)) {
      console.log(`⏭️  Skipping ${prefix} (in skip list)`);
      skipCount++;
      continue;
    }

    const collection = collections[prefix];
    const componentName = toPascalCase(prefix);
    const typeName = `${componentName}IconName`;
    const fileName = componentName;

    try {
      const icons = await fetchCollectionIcons(prefix);

      if (icons.names.length === 0) {
        console.log(`⏭️  Skipping ${prefix} (no icons)`);
        skipCount++;
        continue;
      }

      const content = generateComponentContent(prefix, componentName, icons);
      const filePath = path.join(COMPONENTS_DIR, `${fileName}.tsx`);
      await writeFormatted(filePath, content);

      generatedComponents.push({
        componentName,
        typeName,
        fileName,
        iconCount: icons.names.length,
      });

      successCount++;
      const aliasCount = Object.keys(icons.aliases).length;
      const keptCount = aliasCount + icons.deprecated.length;
      const aliasNote = keptCount > 0 ? ` +${keptCount} kept` : '';
      console.log(
        `✅ ${componentName} (${icons.names.length} icons${aliasNote}) - ${collection.name || prefix}`
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Failed to generate ${prefix}:`, error);
      errorCount++;
    }
  }

  console.log('\nGenerating index.ts...');
  const indexContent = generateIndexContent(generatedComponents);
  await writeFormatted(path.join(COMPONENTS_DIR, 'index.ts'), indexContent);

  console.log('\n' + '='.repeat(50));
  console.log('Generation Complete!');
  console.log('='.repeat(50));
  console.log(`✅ Generated: ${successCount} components`);
  console.log(`⏭️  Skipped: ${skipCount} sets`);
  console.log(`❌ Errors: ${errorCount} sets`);
  const totalIcons = generatedComponents.reduce((sum, c) => sum + c.iconCount, 0);
  console.log(`📊 Total icons: ${totalIcons.toLocaleString()}`);
  console.log('='.repeat(50));
}

generateComponents().catch(console.error);
