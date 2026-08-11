import {
  diffInventories,
  formatDiff,
  formatReleaseNotes,
  hasRemovals,
  parseIconNames,
  type SetInventory,
} from '../icon-inventory';

const GENERATED = `/**
 * Pinhead Icon Set
 */

import { createIconSet } from '../createIconSet';

const pinheadIconNames = {
  '5': true,
  'arrow-left': true,
  '_500px': '500px',

  // Names upstream has renamed.
  'five': '5',
} as const;

export type PinheadIconName = keyof typeof pinheadIconNames;
`;

describe('parseIconNames', () => {
  it('reads plain, mapped and alias entries', () => {
    expect(parseIconNames(GENERATED)).toEqual(['5', 'arrow-left', '_500px', 'five']);
  });

  it('ignores the surrounding module code', () => {
    const names = parseIconNames(GENERATED);

    expect(names).not.toContain('createIconSet');
    expect(names).not.toContain('PinheadIconName');
  });

  it('returns nothing for a file with no entries', () => {
    expect(parseIconNames('export const x = 1;')).toEqual([]);
  });
});

describe('diffInventories', () => {
  const before: SetInventory[] = [{ component: 'Pinhead', names: ['one', 'two'] }];

  it('reports names that disappeared', () => {
    const after: SetInventory[] = [{ component: 'Pinhead', names: ['two'] }];

    expect(diffInventories(before, after)).toEqual({
      Pinhead: { added: [], removed: ['one'] },
    });
  });

  it('reports names that appeared', () => {
    const after: SetInventory[] = [{ component: 'Pinhead', names: ['one', 'two', 'three'] }];

    expect(diffInventories(before, after)).toEqual({
      Pinhead: { added: ['three'], removed: [] },
    });
  });

  /**
   * The case this exists for: a rename looks like one name added and another
   * removed. Preserving the old name as an alias keeps it in the inventory, so
   * a correctly generated rename shows up as purely additive.
   */
  it('treats a rename kept as an alias as additive', () => {
    const after: SetInventory[] = [{ component: 'Pinhead', names: ['one', 'two', '1'] }];
    const diff = diffInventories(before, after);

    expect(diff.Pinhead?.removed).toEqual([]);
    expect(hasRemovals(diff)).toBe(false);
  });

  it('reports a whole set disappearing', () => {
    expect(diffInventories(before, [])).toEqual({
      Pinhead: { added: [], removed: ['one', 'two'] },
    });
  });

  it('reports a brand new set as entirely added', () => {
    const after: SetInventory[] = [...before, { component: 'Reicon', names: ['a', 'b'] }];

    expect(diffInventories(before, after).Reicon).toEqual({ added: ['a', 'b'], removed: [] });
  });

  it('says nothing when nothing changed', () => {
    expect(diffInventories(before, before)).toEqual({});
  });
});

describe('formatDiff', () => {
  it('warns when names were removed', () => {
    const summary = formatDiff({ Pinhead: { added: [], removed: ['five'] } });

    expect(summary).toContain('WARNING');
    expect(summary).toContain('major version');
    expect(summary).toContain('five');
  });

  it('does not warn for a purely additive sync', () => {
    const summary = formatDiff({ Pinhead: { added: ['5'], removed: [] } });

    expect(summary).not.toContain('WARNING');
  });

  it('truncates a long removal list', () => {
    const removed = Array.from({ length: 20 }, (_, i) => `icon-${i}`);
    const summary = formatDiff({ Pinhead: { added: [], removed } });

    expect(summary).toContain('+12 more');
  });

  it('reports an unchanged run plainly', () => {
    expect(formatDiff({})).toBe('No icon names changed.');
  });
});

describe('parseIconNames with a union', () => {
  /**
   * Names upstream renamed or hid moved into a type union so they cost nothing
   * at runtime. They are still names an application can pass, so reading only
   * the object would report the loss of one as no change at all — and the sync
   * publishes on what this returns.
   */
  it('reads a name out of the union as well as the object', () => {
    const source = [
      'const mdiIconNames = {',
      '  home: true,',
      '} as const;',
      '',
      'type MdiIconAlias =',
      "  | '1-2-3'",
      "  | 'volume-vibrate';",
    ].join('\n');

    expect(parseIconNames(source)).toEqual(['home', '1-2-3', 'volume-vibrate']);
  });

  it('reads a union name an object key could not have held', () => {
    expect(parseIconNames("  | '123'")).toEqual(['123']);
  });

  it('ignores a union that is not a name list', () => {
    expect(parseIconNames('  | SomeOtherType')).toEqual([]);
  });
});

describe('formatReleaseNotes', () => {
  /**
   * The sync publishes without anyone reading it, so these notes are the only
   * thing a person deciding on the upgrade has. Everything that left has to be
   * in them.
   */
  it('names every removal rather than a sample of them', () => {
    const many = Array.from({ length: 30 }, (_, i) => `gone-${i}`);
    const notes = formatReleaseNotes({ Mdi: { added: [], removed: many } });

    for (const name of many) {
      expect(notes).toContain(name);
    }
    expect(notes).not.toContain('more');
  });

  it('says how many were added without listing them', () => {
    const notes = formatReleaseNotes({ Mdi: { added: ['a', 'b'], removed: [] } });

    expect(notes).toContain('2 names added, 0 removed.');
    expect(notes).toContain('Mdi 2');
  });

  it('leaves out a set that lost nothing', () => {
    const notes = formatReleaseNotes({
      Mdi: { added: [], removed: ['gone'] },
      Lucide: { added: ['new'], removed: [] },
    });
    const removedSection = notes.slice(notes.indexOf('Removed'), notes.indexOf('Added'));

    expect(removedSection).toContain('Mdi:');
    expect(removedSection).not.toContain('Lucide:');
  });

  // commitlint holds the body to 250 characters. A set losing a few hundred
  // names at once must not be what fails the release that reports it.
  it('wraps so no line can fail the commit', () => {
    const many = Array.from({ length: 500 }, (_, i) => `a-rather-long-icon-name-${i}`);
    const notes = formatReleaseNotes({ Mdi: { added: [], removed: many } });

    for (const line of notes.split('\n')) {
      expect(line.length).toBeLessThanOrEqual(250);
    }
  });

  it('says nothing changed when nothing did', () => {
    expect(formatReleaseNotes({})).toBe('0 names added, 0 removed.');
  });
});
