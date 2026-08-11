import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { analyzeCommand } from '../cli/commands/analyze';
import { bundleCommand } from '../cli/commands/bundle';
import { EXIT_CODES } from '../cli/types';

/**
 * Both of these are documented, both are what someone reaches for when they
 * want to know or control what ships, and neither had a single test. A
 * documented command that exits zero while having done nothing is worse than
 * one that does not exist, because it is believed.
 *
 * Network access is stubbed: `bundle` fetches icon data from the Iconify API,
 * and a test suite that depends on that is a test suite that fails on a train.
 */
describe('CLI commands', () => {
  let projectRoot: string;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  const write = (relative: string, contents: string) => {
    const full = path.join(projectRoot, relative);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents);
  };

  const printed = () => logSpy.mock.calls.map((call) => String(call[0])).join('\n');

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-iconify-cli-'));
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    fs.rmSync(projectRoot, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  describe('analyze', () => {
    it('finds the icons a project uses', () => {
      write(
        'src/App.tsx',
        `import { Mdi } from 'rn-iconify';\nexport const A = () => <Mdi name="home" />;`
      );

      expect(analyzeCommand({ src: path.join(projectRoot, 'src') })).toBe(EXIT_CODES.SUCCESS);
      expect(printed()).toContain('mdi');
    });

    // Succeeding while having found nothing is the answer most likely to be
    // misread, so it says so in words rather than printing an empty table.
    it('says so plainly when a project uses none', () => {
      write('src/App.tsx', `export const A = () => null;`);

      const code = analyzeCommand({ src: path.join(projectRoot, 'src') });

      expect(code).toBe(EXIT_CODES.SUCCESS);
      expect(printed()).toContain('No icons found');
    });

    it('emits machine-readable output on request', () => {
      write(
        'src/App.tsx',
        `import { Mdi } from 'rn-iconify';\nexport const A = () => <Mdi name="home" />;`
      );

      analyzeCommand({ src: path.join(projectRoot, 'src'), format: 'json' });

      const json = printed().slice(printed().indexOf('{'));
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('emits markdown on request', () => {
      write(
        'src/App.tsx',
        `import { Mdi } from 'rn-iconify';\nexport const A = () => <Mdi name="home" />;`
      );

      analyzeCommand({ src: path.join(projectRoot, 'src'), format: 'markdown' });

      expect(printed()).toContain('|');
    });

    it('survives a directory that is not there', () => {
      expect(() => analyzeCommand({ src: path.join(projectRoot, 'nope') })).not.toThrow();
    });
  });

  describe('bundle', () => {
    const stubIconifyApi = (icons: Record<string, unknown>) => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ prefix: 'mdi', icons, width: 24, height: 24 }),
      }) as unknown as typeof fetch;
    };

    it('writes a bundle of the icons it found', async () => {
      write(
        'src/App.tsx',
        `import { Mdi } from 'rn-iconify';\nexport const A = () => <Mdi name="home" />;`
      );
      stubIconifyApi({ home: { body: '<path d="M0 0h24v24H0z"/>' } });
      const output = path.join(projectRoot, 'icons.json');

      const code = await bundleCommand({ src: path.join(projectRoot, 'src'), output });

      expect(code).toBe(EXIT_CODES.SUCCESS);
      expect(fs.existsSync(output)).toBe(true);
      expect(JSON.parse(fs.readFileSync(output, 'utf-8')).icons).toHaveProperty('mdi:home');
    });

    it('bundles an explicitly listed icon', async () => {
      write('src/App.tsx', `export const A = () => null;`);
      stubIconifyApi({ settings: { body: '<path d="M1 1h2v2H1z"/>' } });
      const output = path.join(projectRoot, 'icons.json');

      await bundleCommand({
        src: path.join(projectRoot, 'src'),
        output,
        icons: 'mdi:settings',
      });

      expect(JSON.parse(fs.readFileSync(output, 'utf-8')).icons).toHaveProperty('mdi:settings');
    });

    // Writing an empty bundle would be taken for a working one, and the next
    // build would ship nothing while reporting success.
    it('refuses rather than writing an empty bundle', async () => {
      write('src/App.tsx', `export const A = () => null;`);
      const output = path.join(projectRoot, 'icons.json');

      const code = await bundleCommand({ src: path.join(projectRoot, 'src'), output });

      expect(code).toBe(EXIT_CODES.ERROR);
      expect(fs.existsSync(output)).toBe(false);
    });

    it('reports a network failure rather than writing a partial bundle', async () => {
      write(
        'src/App.tsx',
        `import { Mdi } from 'rn-iconify';\nexport const A = () => <Mdi name="home" />;`
      );
      global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
      const output = path.join(projectRoot, 'icons.json');

      const code = await bundleCommand({ src: path.join(projectRoot, 'src'), output });

      expect(code).not.toBe(EXIT_CODES.SUCCESS);
      expect(fs.existsSync(output)).toBe(false);
    });
  });
});
