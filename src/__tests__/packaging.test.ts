/**
 * Packaging guards.
 *
 * These check the shape of what gets published rather than the code itself,
 * because the two can drift apart silently: the build writes a manifest next to
 * the ESM output, and a bundler resolving `lib/module/index.js` reads that file
 * rather than the one at the root.
 */

import fs from 'node:fs';
import path from 'node:path';

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8')
) as {
  sideEffects?: unknown;
  scripts: Record<string, string>;
  'size-limit'?: Array<{ name: string; import?: string; limit: string }>;
};

describe('packaging', () => {
  it('declares the package free of side effects', () => {
    expect(packageJson.sideEffects).toBe(false);
  });

  /**
   * The regression this exists for: the build wrote `{"type":"module"}` beside
   * the ESM output with no `sideEffects`. A bundler reads that manifest instead
   * of the root one, so it treated every module as side-effectful and kept all
   * 226 icon sets — `import { Mdi } from 'rn-iconify'` pulled in 792 kB where
   * the icon set itself is 36 kB.
   */
  it('carries sideEffects into the generated ESM manifest', () => {
    expect(packageJson.scripts.build).toContain('sideEffects');
  });

  it('marks the generated ESM output as a module', () => {
    expect(packageJson.scripts.build).toContain('"type\\":\\"module');
  });

  /**
   * Measuring the whole barrel says nothing useful — nobody imports every icon
   * set, and the number grows on every sync, so the limit would just be raised
   * until it stopped meaning anything. Measuring an import of one set is what
   * catches tree-shaking breaking.
   */
  it('measures bundle size the way applications actually import', () => {
    const checks = packageJson['size-limit'] ?? [];

    expect(checks.length).toBeGreaterThan(0);
    expect(checks.some((check) => check.import?.includes('Mdi'))).toBe(true);
  });
});
