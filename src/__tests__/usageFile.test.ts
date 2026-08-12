import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  dropResolved,
  emptyUsageFile,
  pruneUsage,
  readUsageFile,
  recordUsage,
  usageNames,
  writeUsageFile,
} from '../metro/usageFile';

/**
 * usage.json is what makes an icon the scan cannot prove still ship, so
 * nothing in it can be checked against the source — it is precisely the set
 * of names the source does not mention.
 *
 * Version 1 was a list. A name went in once and stayed: nothing updated it,
 * nothing removed it, and the only timestamp was on the file. A screen could
 * be deleted and its icons would keep shipping, indistinguishable from the
 * ones still in use. One application carried 175 names, 24 of them from
 * screens that no longer existed.
 */
describe('usage file', () => {
  let dir: string;
  let usagePath: string;

  const NOW = '2026-08-12T10:00:00.000Z';

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-iconify-usage-'));
    usagePath = path.join(dir, 'usage.json');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  describe('reading', () => {
    it('reads a file it has written', () => {
      const file = emptyUsageFile(NOW);
      recordUsage(file, 'ion:home', NOW);
      writeUsageFile(usagePath, file);

      expect(usageNames(readUsageFile(usagePath, NOW))).toEqual(['ion:home']);
    });

    /**
     * A version 1 file does not record when any name was last rendered, so an
     * upgrade has to choose. Treating them all as just-seen is the only
     * reading that cannot drop one still in daily use: the clock starts at the
     * upgrade and is honest from there.
     */
    it('upgrades a version 1 list without losing a name', () => {
      fs.writeFileSync(
        usagePath,
        JSON.stringify({
          version: '1.0.0',
          icons: ['ion:home', 'mdi:trophy'],
          updatedAt: '2026-01-01T00:00:00.000Z',
        })
      );

      const file = readUsageFile(usagePath, NOW);

      expect(usageNames(file)).toEqual(['ion:home', 'mdi:trophy']);
      expect(file.icons['ion:home']).toBe(NOW);
      expect(file.version).toBe('2.0.0');
      expect(file.upgraded).toBe(true);
    });

    // Refusing to build over a corrupt cache would be a worse failure than
    // relearning what it held.
    it('treats an unreadable file as empty', () => {
      fs.writeFileSync(usagePath, '{ not json');

      expect(usageNames(readUsageFile(usagePath, NOW))).toEqual([]);
    });

    it('treats a missing file as empty', () => {
      expect(usageNames(readUsageFile(usagePath, NOW))).toEqual([]);
    });
  });

  describe('recording', () => {
    it('reports a name it has not seen before', () => {
      const file = emptyUsageFile(NOW);

      expect(recordUsage(file, 'ion:home', NOW)).toBe(true);
      expect(recordUsage(file, 'ion:home', NOW)).toBe(false);
    });

    /**
     * The whole point of version 2. A name rendered today must not look like
     * one last rendered a year ago, and only rewriting the timestamp on every
     * sighting makes that true.
     */
    it('moves the timestamp of a name it already has', () => {
      const file = emptyUsageFile('2026-01-01T00:00:00.000Z');
      recordUsage(file, 'ion:home', '2026-01-01T00:00:00.000Z');

      recordUsage(file, 'ion:home', NOW);

      expect(file.icons['ion:home']).toBe(NOW);
      expect(usageNames(file)).toEqual(['ion:home']);
    });
  });

  describe('pruning', () => {
    const cutoff = new Date('2026-08-01T00:00:00.000Z');

    it('drops a name not seen since the cutoff', () => {
      const file = emptyUsageFile(NOW);
      recordUsage(file, 'ion:gone', '2026-01-01T00:00:00.000Z');
      recordUsage(file, 'ion:home', NOW);

      const { pruned, removed } = pruneUsage(file, cutoff);

      expect(usageNames(pruned)).toEqual(['ion:home']);
      expect(removed).toEqual([{ icon: 'ion:gone', lastSeen: '2026-01-01T00:00:00.000Z' }]);
    });

    it('keeps a name seen exactly at the cutoff', () => {
      const file = emptyUsageFile(NOW);
      recordUsage(file, 'ion:home', cutoff.toISOString());

      expect(usageNames(pruneUsage(file, cutoff).pruned)).toEqual(['ion:home']);
    });

    // A timestamp that cannot be read says nothing about whether the icon is
    // still used, and guessing would remove a working one.
    it('keeps a name whose timestamp cannot be read', () => {
      const file = emptyUsageFile(NOW);
      recordUsage(file, 'ion:home', 'not a date');

      const { pruned, removed } = pruneUsage(file, cutoff);

      expect(usageNames(pruned)).toEqual(['ion:home']);
      expect(removed).toEqual([]);
    });

    it('leaves the file alone when nothing is stale', () => {
      const file = emptyUsageFile(NOW);
      recordUsage(file, 'ion:home', NOW);

      expect(pruneUsage(file, cutoff).removed).toEqual([]);
    });
  });

  // A crash mid-write must not leave a half-file where the next build reads
  // its icon list.
  it('writes atomically', () => {
    const file = emptyUsageFile(NOW);
    recordUsage(file, 'ion:home', NOW);

    writeUsageFile(usagePath, file);

    expect(fs.existsSync(`${usagePath}.tmp`)).toBe(false);
    expect(JSON.parse(fs.readFileSync(usagePath, 'utf-8')).icons['ion:home']).toBe(NOW);
  });
});

describe('dropResolved', () => {
  const NOW = '2026-08-12T10:00:00.000Z';

  /**
   * The file carries what the scan cannot find. A name it now finds is carried
   * for no reason, and after the scan learns a new shape that is most of the
   * file — one application had 175 names, 149 of which its source had proved
   * all along.
   */
  it('drops a name the scan proves', () => {
    const file = emptyUsageFile(NOW);
    recordUsage(file, 'ion:home', NOW);
    recordUsage(file, 'ion:only-here', NOW);

    const { pruned, removed } = dropResolved(file, ['ion:home']);

    expect(usageNames(pruned)).toEqual(['ion:only-here']);
    expect(removed).toEqual(['ion:home']);
  });

  // Unlike the age of a name, this needs no judgement: the build ships it
  // either way, so removing it cannot change anything.
  it('keeps a name the scan does not prove', () => {
    const file = emptyUsageFile(NOW);
    recordUsage(file, 'ion:only-here', NOW);

    expect(dropResolved(file, ['ion:home']).removed).toEqual([]);
  });

  it('keeps the timestamps of what it leaves', () => {
    const file = emptyUsageFile(NOW);
    recordUsage(file, 'ion:only-here', '2026-01-01T00:00:00.000Z');

    expect(dropResolved(file, []).pruned.icons['ion:only-here']).toBe('2026-01-01T00:00:00.000Z');
  });
});
