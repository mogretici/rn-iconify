import {
  diffInventories,
  formatDiff,
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
