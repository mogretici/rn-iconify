/**
 * Post-build step: carry `sideEffects` into the generated ESM manifest.
 *
 * The builder writes `{"type":"module"}` next to the ESM output so Node reads
 * those files as modules. That file then becomes the nearest `package.json` to
 * `lib/module/index.js`, and a bundler resolving it reads *that* manifest, not
 * the one at the package root. Without `sideEffects` there, every module is
 * assumed side-effectful and nothing is dropped: `import { Mdi } from
 * 'rn-iconify'` pulled in all 226 icon sets — 792 kB where the set itself is
 * 36 kB.
 *
 * This merges rather than overwrites, so whatever the builder decides to put
 * in that manifest survives.
 */

import * as fs from 'fs';
import * as path from 'path';

export function finalizeEsmManifest(libDir: string): void {
  const manifestPath = path.join(libDir, 'module', 'package.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `Expected an ESM manifest at ${manifestPath}. The build did not produce one, ` +
        `so tree-shaking cannot be guaranteed.`
    );
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Record<string, unknown>;

  fs.writeFileSync(manifestPath, `${JSON.stringify({ ...manifest, sideEffects: false })}\n`);
}

if (require.main === module) {
  finalizeEsmManifest(path.join(__dirname, '..', 'lib'));
}
