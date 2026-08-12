/**
 * Checks that everything the documentation imports actually exists.
 *
 * The docs contain 461 import statements, and each one is a promise that a
 * name is exported from an entry point. Two of them were wrong at the same
 * time: the performance monitor and the icon explorer moved to `rn-iconify/dev`
 * and nine pages went on importing them from the root, where they are not
 * exported. Every one of those snippets fails the moment someone runs it, and
 * nothing noticed — a code block is not compiled by anything.
 *
 * Reading the pages is not a fix; the next move of an export puts it back. So
 * the compiler checks them: this collects the imports, writes them into one
 * TypeScript file pointed at the real sources, and typechecks it. A name that
 * has moved, been renamed or never existed fails here rather than in an
 * application.
 *
 *   npx tsx scripts/check-docs-imports.ts
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs', 'docs');
const OUT = path.join(ROOT, '.docs-imports-check');

/** Package entry point -> the source it resolves to, relative to `src`. */
const ENTRY_POINTS: Record<string, string> = {
  'rn-iconify': 'index',
  'rn-iconify/dev': 'dev/index',
  'rn-iconify/animated': 'animated/index',
  'rn-iconify/navigation': 'navigation/index',
  'rn-iconify/babel': 'babel/index',
  'rn-iconify/metro': 'metro/index',
};

interface DocImport {
  file: string;
  line: number;
  entry: string;
  source: string;
  names: string;
  typeOnly: boolean;
}

const IMPORT = /^import (type )?\{([^}]+)\} from '(rn-iconify(?:\/[\w/-]+)?)';?$/;

function resolveEntry(entry: string): string | null {
  if (ENTRY_POINTS[entry]) {
    return ENTRY_POINTS[entry];
  }

  // `rn-iconify/icons/Mdi` is one generated component per icon set.
  const icon = /^rn-iconify\/icons\/([A-Za-z0-9]+)$/.exec(entry);
  return icon ? `components/${icon[1]}` : null;
}

function collect(): DocImport[] {
  const found: DocImport[] = [];

  const walk = (dir: string): void => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        walk(full);
      } else if (item.name.endsWith('.mdx')) {
        fs.readFileSync(full, 'utf8')
          .split('\n')
          .forEach((line, index) => {
            const match = IMPORT.exec(line.trim());
            if (!match) return;

            const entry = match[3] as string;
            const source = resolveEntry(entry);
            if (!source) return;

            found.push({
              file: path.relative(ROOT, full),
              line: index + 1,
              entry,
              source,
              names: (match[2] as string).trim().replace(/,$/, ''),
              typeOnly: Boolean(match[1]),
            });
          });
      }
    }
  };

  walk(DOCS);

  return found;
}

function main(): void {
  const imports = collect();

  if (imports.length === 0) {
    console.error('No documentation imports found — the pattern stopped matching.');
    process.exit(2);
  }

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  // Each import is aliased so two pages importing the same name do not collide,
  // and so a failure names the page and line it came from.
  const lines = imports.map(({ source, names, typeOnly, file, line }, index) => {
    const aliased = names
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => {
        const bare = name.replace(/^type\s+/, '');
        return `${name} as ${bare.replace(/[^A-Za-z0-9]/g, '_')}_${index}`;
      })
      .join(', ');

    return [
      `// ${file}:${line} — ${names}`,
      `import ${typeOnly ? 'type ' : ''}{ ${aliased} } from '../src/${source}';`,
    ].join('\n');
  });

  const entry = path.join(OUT, 'index.ts');
  fs.writeFileSync(entry, `${lines.join('\n\n')}\n`);
  fs.writeFileSync(
    path.join(OUT, 'tsconfig.json'),
    `${JSON.stringify(
      {
        extends: '../tsconfig.json',
        compilerOptions: { noEmit: true, noUnusedLocals: false },
        include: ['index.ts'],
      },
      null,
      2
    )}\n`
  );

  console.log(
    `Checking ${imports.length} imports from ${new Set(imports.map((i) => i.file)).size} pages.`
  );

  try {
    execFileSync('npx', ['tsc', '--project', path.join(OUT, 'tsconfig.json')], {
      cwd: ROOT,
      stdio: 'inherit',
    });
  } catch {
    console.error(
      '\nA documented import does not resolve. The comment above each failing ' +
        'line gives the page and line number it came from.'
    );
    process.exit(1);
  }

  fs.rmSync(OUT, { recursive: true, force: true });
  console.log('Every documented import resolves.');
}

main();
