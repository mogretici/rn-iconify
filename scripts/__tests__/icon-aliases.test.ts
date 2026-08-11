import { renderIconEntries, sanitizeIconName, selectAliases } from '../icon-aliases';

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
    expect(renderIconEntries(['arrow-left'], {})).toBe("  'arrow-left': true,");
  });

  it('maps a sanitized key back to the real name', () => {
    expect(renderIconEntries(['500px'], {})).toBe("  '_500px': '500px',");
  });

  it('emits renamed names as mappings, under a comment', () => {
    const output = renderIconEntries(['home'], { house: 'home' });

    expect(output).toContain("  'home': true,");
    expect(output).toContain("  'house': 'home',");
    expect(output).toContain('renamed');
  });

  it('sanitizes alias keys too', () => {
    expect(renderIconEntries(['5'], { '5-alt': '5' })).toContain("  '_5-alt': '5',");
  });

  it('does not let an alias overwrite a real icon entry', () => {
    // '5' sanitizes to the key `_5`, and so does the alias — a duplicate key
    // in the generated object literal would silently win over the icon.
    const output = renderIconEntries(['5'], { '5': '5' });
    const keys = [...output.matchAll(/^ {2}'([^']+)':/gm)].map((m) => m[1]);

    expect(keys).toEqual(['_5']);
  });

  it('sorts aliases so regenerating produces a stable diff', () => {
    const output = renderIconEntries(['1', '2', '3'], { c: '3', a: '1', b: '2' });
    const order = [...output.matchAll(/'([abc])':/g)].map((m) => m[1]);

    expect(order).toEqual(['a', 'b', 'c']);
  });
});
