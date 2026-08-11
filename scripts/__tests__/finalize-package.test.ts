import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { finalizeEsmManifest } from '../finalize-package';

/**
 * The regression this guards is invisible in every way that usually catches
 * things: the package builds, the types resolve, the tests pass, and the app
 * runs. It is 20× larger. See the script's own comment for why the nested
 * manifest is the one that decides.
 */
describe('finalizeEsmManifest', () => {
  let libDir: string;

  const manifest = (): Record<string, unknown> =>
    JSON.parse(fs.readFileSync(path.join(libDir, 'module', 'package.json'), 'utf8'));

  beforeEach(() => {
    libDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-iconify-lib-'));
    fs.mkdirSync(path.join(libDir, 'module'));
  });

  afterEach(() => {
    fs.rmSync(libDir, { recursive: true, force: true });
  });

  const writeManifest = (contents: Record<string, unknown>) =>
    fs.writeFileSync(path.join(libDir, 'module', 'package.json'), JSON.stringify(contents));

  it('marks the ESM output free of side effects', () => {
    writeManifest({ type: 'module' });

    finalizeEsmManifest(libDir);

    expect(manifest().sideEffects).toBe(false);
  });

  // The builder owns this file; anything it puts there has a reason to be
  // there, and overwriting it is how the module type got lost before.
  it('keeps what the builder wrote', () => {
    writeManifest({ type: 'module', main: './index.js' });

    finalizeEsmManifest(libDir);

    expect(manifest()).toEqual({ type: 'module', main: './index.js', sideEffects: false });
  });

  // Silently creating the manifest would hide a build that stopped emitting
  // ESM at all, which is the case where the size regression actually returns.
  it('refuses to invent a manifest the build did not produce', () => {
    expect(() => finalizeEsmManifest(libDir)).toThrow(/did not produce/);
  });
});
