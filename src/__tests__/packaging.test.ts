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
   * What the ESM manifest must contain is asserted against a real manifest in
   * `scripts/__tests__/finalize-package.test.ts`; the build's own output is
   * checked in CI after it runs. All this needs to know is that the step is
   * still wired in, because dropping it is silent — it costs 20× the bundle
   * size and breaks nothing else.
   */
  it('finalizes the generated ESM manifest after building', () => {
    expect(packageJson.scripts.build).toContain('finalize-package');
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
