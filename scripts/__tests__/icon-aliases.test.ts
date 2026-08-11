import {
  renderAliasUnion,
  renderIconEntries,
  sanitizeIconName,
  selectAliases,
  selectDeprecated,
} from '../icon-aliases';

describe('sanitizeIconName', () => {
  it('leaves a valid name alone', () => {
    expect(sanitizeIconName('arrow-left')).toBe('arrow-left');
  });

  it('prefixes a name starting with a digit', () => {
    expect(sanitizeIconName('500px')).toBe('_500px');
  });

  it('replaces characters that cannot appear in a key', () => {
    expect(sanitizeIconName('foo.bar baz')).toBe('foo_bar_baz');
  });
});

describe('selectAliases', () => {
  /**
   * The regression this exists for: Iconify renamed `pinhead:five` to
   * `pinhead:5` and kept `five` working as an alias. Generating from the icon
   * list alone dropped 71 names from that set alone, which would break every
   * app using them — for a rename this package never made.
   */
  it('keeps a name upstream renamed', () => {
    const selected = selectAliases(['5', '4', '911'], {
      five: '5',
      four: '4',
      'nine-one-one': '911',
    });

    expect(selected).toEqual({ five: '5', four: '4', 'nine-one-one': '911' });
  });

  it('ignores an alias whose target no longer exists', () => {
    expect(selectAliases(['5'], { five: '5', gone: 'also-gone' })).toEqual({ five: '5' });
  });

  it('ignores an alias that is also a real icon', () => {
    // Upstream sometimes lists a name in both places; the icon wins, otherwise
    // the generated entry would redirect a live icon somewhere else.
    expect(selectAliases(['home', 'house'], { home: 'house' })).toEqual({});
  });

  it('returns nothing when there are no aliases', () => {
    expect(selectAliases(['a', 'b'], {})).toEqual({});
  });
});

describe('renderIconEntries', () => {
  it('maps a plain name to true', () => {
    expect(renderIconEntries(['arrow-left'])).toBe("  'arrow-left': true,");
  });

  it('maps a sanitized key back to the real name', () => {
    expect(renderIconEntries(['500px'])).toBe("  '_500px': '500px',");
  });

  // The object is what ships. Anything that does not have to be in it is the
  // difference between 36 kB and 73 kB for an application importing one set.
  it('carries current names only', () => {
    expect(renderIconEntries(['home'])).toBe("  'home': true,");
  });
});

describe('renderAliasUnion', () => {
  it('lists a name upstream renamed', () => {
    expect(renderAliasUnion(['home'], { house: 'home' })).toEqual(['house']);
  });

  it('lists a name upstream hid but still serves', () => {
    expect(renderAliasUnion(['home'], {}, ['4k-bold-duotone'])).toEqual(['4k-bold-duotone']);
  });

  /**
   * A key has to be a valid identifier or quoted; a member of a string literal
   * union has no such rule. Sanitizing here would produce `_1-2-3`, which the
   * Iconify API has never heard of — `1-2-3` is the name it answers to.
   */
  it('writes the name the way upstream spells it', () => {
    expect(renderAliasUnion(['numeric'], { '1-2-3': 'numeric' })).toEqual(['1-2-3']);
  });

  it('leaves out a name that is current in its own right', () => {
    expect(renderAliasUnion(['home', 'house'], { house: 'home' })).toEqual([]);
  });

  it('lists a name once when it is both renamed and hidden', () => {
    expect(renderAliasUnion(['home'], { house: 'home' }, ['house'])).toEqual(['house']);
  });

  it('sorts so regenerating produces a stable diff', () => {
    expect(renderAliasUnion([], { c: 'x', a: 'x', b: 'x' })).toEqual(['a', 'b', 'c']);
  });

  it('returns nothing when there is nothing to keep', () => {
    expect(renderAliasUnion(['home'], {})).toEqual([]);
  });
});

describe('selectDeprecated', () => {
  /**
   * Iconify hides an icon it no longer recommends rather than deleting it —
   * the API still returns valid SVG for `solar:4k-bold-duotone` long after it
   * left the listing. Dropping those takes working icons away from
   * applications for a decision upstream did not make. One sync would have
   * removed 152 of them from `solar` alone.
   */
  it('keeps a name upstream hid but still serves', () => {
    expect(selectDeprecated(['home'], ['4k-bold-duotone'])).toEqual(['4k-bold-duotone']);
  });

  it('ignores a hidden name that is also listed', () => {
    expect(selectDeprecated(['home'], ['home'])).toEqual([]);
  });

  it('sorts so regenerating produces a stable diff', () => {
    expect(selectDeprecated([], ['c', 'a', 'b'])).toEqual(['a', 'b', 'c']);
  });

  it('returns nothing when there is nothing hidden', () => {
    expect(selectDeprecated(['home'], [])).toEqual([]);
  });
});

describe('aliases pointing at deprecated icons', () => {
  /**
   * `solar:sort-by-alphabet-linear` is an alias for `sort-by-alphabet-broken`,
   * which is itself hidden rather than listed. Treating only listed icons as
   * valid targets dropped the alias even though its target is generated — one
   * name, but the same class of silent loss as the other 152.
   */
  it('accepts an alias whose target is a kept deprecated icon', () => {
    const deprecated = selectDeprecated(['home'], ['sort-by-alphabet-broken']);
    const aliases = selectAliases(['home', ...deprecated], {
      'sort-by-alphabet-linear': 'sort-by-alphabet-broken',
    });

    expect(aliases).toEqual({ 'sort-by-alphabet-linear': 'sort-by-alphabet-broken' });
  });

  it('still rejects an alias whose target is nowhere', () => {
    expect(selectAliases(['home'], { gone: 'also-gone' })).toEqual({});
  });
});
