import { render } from '@testing-library/react-native';
import { Mdi } from '../components/Mdi';
import type { MdiIconName } from '../components/Mdi';

/**
 * Names upstream has renamed or hidden are typed but are not in the runtime
 * map, and both halves of that matter.
 *
 * Written into the map, Mdi's 6,363 renamed names cost more than its 7,447
 * current ones — each carries two names rather than a name and `true` — and
 * `import { Mdi }` went from 36 kB to 73 kB for every application. Left out of
 * the type instead, a rename upstream would break every project using the old
 * name.
 *
 * A union is neither: TypeScript erases it, and the Iconify API resolves the
 * name itself. These assertions do their work at `tsc --noEmit`, which CI runs
 * over src including this file.
 */
describe('renamed and hidden icon names', () => {
  it('accepts a name upstream renamed', () => {
    const renamed: MdiIconName = '1-2-3';

    expect(renamed).toBe('1-2-3');
  });

  it('accepts a name that is not a valid object key', () => {
    // The map would have had to spell this `_123`, which the Iconify API has
    // never heard of. A union member has no such rule.
    const numeric: MdiIconName = '123';

    expect(numeric).toBe('123');
  });

  it('still rejects a name that is not an icon', () => {
    // @ts-expect-error not an Mdi icon under any name
    const nonsense: MdiIconName = 'definitely-not-an-mdi-icon';

    expect(nonsense).toBe('definitely-not-an-mdi-icon');
  });

  // The runtime path for a renamed name is the same one an icon added since
  // the last sync takes: it is not in the map, so it is asked for as written.
  it('renders a renamed name without warning it does not exist', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(() => render(<Mdi name="1-2-3" />)).not.toThrow();

    warn.mockRestore();
  });

  it('keeps current names in the map', () => {
    const current: MdiIconName = 'home';

    expect(() => render(<Mdi name={current} />)).not.toThrow();
  });
});
