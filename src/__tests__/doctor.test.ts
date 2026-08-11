import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { diagnose, doctorCommand } from '../cli/commands/doctor';
import { EXIT_CODES } from '../cli/types';

/**
 * An icon the build cannot see is not a broken icon — it is fetched from the
 * Iconify API at runtime, in release builds as much as in development. A
 * request on every install, a placeholder until it lands, nothing at all
 * offline.
 *
 * None of that is visible from inside the app, and development hides it
 * twice over: the fetch succeeds, and the name is written into usage.json so
 * the next build looks healthy. This command exists to say the number out
 * loud, which is why its own correctness matters more than most.
 */
describe('doctor', () => {
  let projectRoot: string;

  const write = (relative: string, contents: string) => {
    const full = path.join(projectRoot, relative);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents);
  };

  const writeUsage = (icons: string[]) =>
    write(
      '.rn-iconify/usage.json',
      JSON.stringify({ version: '1.0.0', icons, updatedAt: '2026-01-01T00:00:00.000Z' })
    );

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-iconify-doctor-'));
  });

  afterEach(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it('counts what the source itself proves', () => {
    write(
      'App.tsx',
      `import { Ion } from 'rn-iconify';\nexport const A = () => <Ion name="home" />;`
    );

    expect(diagnose(projectRoot).bundled).toEqual(['ion:home']);
  });

  it('names the icons that will be fetched at runtime', () => {
    write(
      'App.tsx',
      `import { Ion } from 'rn-iconify';\nexport const A = () => <Ion name="home" />;`
    );
    writeUsage(['ion:home', 'mdi:hanger']);

    const result = diagnose(projectRoot);

    expect(result.runtimeOnly).toEqual(['mdi:hanger']);
    expect(result.bundled).toEqual(['ion:home']);
  });

  /**
   * The report must not be able to congratulate itself. usage.json is exactly
   * what makes an unresolvable icon appear fine, so counting it as coverage
   * would hide the thing being measured.
   */
  it('does not count a learned icon as resolved', () => {
    write('App.tsx', `import { Ion } from 'rn-iconify';\nexport const A = () => null;`);
    writeUsage(['ion:home', 'ion:settings']);

    const result = diagnose(projectRoot);

    expect(result.bundled).toEqual([]);
    expect(result.runtimeOnly).toEqual(['ion:home', 'ion:settings']);
  });

  it('leaves usage.json exactly as it found it', () => {
    write(
      'App.tsx',
      `import { Ion } from 'rn-iconify';\nexport const A = () => <Ion name="home" />;`
    );
    writeUsage(['mdi:hanger']);
    const before = fs.readFileSync(path.join(projectRoot, '.rn-iconify/usage.json'), 'utf-8');

    diagnose(projectRoot);

    expect(fs.readFileSync(path.join(projectRoot, '.rn-iconify/usage.json'), 'utf-8')).toBe(before);
  });

  it('reports a project with no usage file as fully resolved', () => {
    write(
      'App.tsx',
      `import { Ion } from 'rn-iconify';\nexport const A = () => <Ion name="home" />;`
    );

    const result = diagnose(projectRoot);

    expect(result.runtimeOnly).toEqual([]);
    expect(result.learnedTotal).toBe(0);
    expect(result.learnedAt).toBeNull();
  });

  it('treats an unreadable usage file as empty rather than failing', () => {
    write(
      'App.tsx',
      `import { Ion } from 'rn-iconify';\nexport const A = () => <Ion name="home" />;`
    );
    write('.rn-iconify/usage.json', '{ not json');

    expect(() => diagnose(projectRoot)).not.toThrow();
    expect(diagnose(projectRoot).runtimeOnly).toEqual([]);
  });

  describe('exit codes', () => {
    let logSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
      logSpy.mockRestore();
      errorSpy.mockRestore();
    });

    // Reporting is useful before it is enforced; a project part-way through
    // fixing this has to be able to see the number without being blocked.
    it('succeeds without --strict even when icons are unresolved', async () => {
      write('App.tsx', `import { Ion } from 'rn-iconify';\nexport const A = () => null;`);
      writeUsage(['mdi:hanger']);

      await expect(doctorCommand({ src: projectRoot })).resolves.toBe(EXIT_CODES.SUCCESS);
    });

    it('fails with --strict when an icon would be fetched at runtime', async () => {
      write('App.tsx', `import { Ion } from 'rn-iconify';\nexport const A = () => null;`);
      writeUsage(['mdi:hanger']);

      await expect(doctorCommand({ src: projectRoot, strict: true })).resolves.toBe(
        EXIT_CODES.ERROR
      );
    });

    it('passes with --strict once everything resolves', async () => {
      write(
        'App.tsx',
        `import { Ion } from 'rn-iconify';\nexport const A = () => <Ion name="home" />;`
      );
      writeUsage(['ion:home']);

      await expect(doctorCommand({ src: projectRoot, strict: true })).resolves.toBe(
        EXIT_CODES.SUCCESS
      );
    });

    it('reports a missing directory rather than scanning nothing', async () => {
      await expect(doctorCommand({ src: path.join(projectRoot, 'nope') })).resolves.toBe(
        EXIT_CODES.ERROR
      );
    });

    it('emits machine-readable output on request', async () => {
      write(
        'App.tsx',
        `import { Ion } from 'rn-iconify';\nexport const A = () => <Ion name="home" />;`
      );

      await doctorCommand({ src: projectRoot, format: 'json' });

      const printed = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(printed.bundled).toEqual(['ion:home']);
    });
  });
});
