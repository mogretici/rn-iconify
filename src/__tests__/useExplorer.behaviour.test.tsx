import { renderHook, waitFor, act } from '@testing-library/react-native';
import { Alert, Clipboard } from 'react-native';
import { useExplorer } from '../explorer/useExplorer';
import type { ExplorerConfig } from '../explorer/types';

/**
 * The explorer was covered by its pure helpers — which prefix maps to which
 * set, what JSX a name generates — and not by the hook that fetches, searches,
 * debounces, aborts and copies. That is where everything with a consequence
 * lives.
 */
jest.mock('../network/IconifyAPI', () => ({
  fetchCollection: jest.fn(),
  searchIconsAPI: jest.fn(),
}));

type Api = {
  fetchCollection: jest.Mock;
  searchIconsAPI: jest.Mock;
};

/**
 * Fetched collections are held in module state and deliberately outlive a
 * component. Resetting the module registry to clear it hands the hook a second
 * copy of React, so each test takes an icon set no other test has used and the
 * cache is never in the way.
 */
const AVAILABLE_SETS = [
  'mdi',
  'heroicons',
  'lucide',
  'ph',
  'feather',
  'tabler',
  'ion',
  'fa6-solid',
  'fa6-regular',
  'fa6-brands',
  'bi',
  'ri',
  'carbon',
  'ant-design',
  'octicon',
  'fluent',
  'material-symbols',
  'simple-icons',
  'logos',
  'twemoji',
  'noto',
  'flag',
  'circle-flags',
  'meteocons',
];
let used = 0;
const nextSet = (): string => {
  const prefix = AVAILABLE_SETS[used++];
  if (!prefix) throw new Error('Ran out of icon sets; add more or reuse deliberately.');
  return prefix;
};

describe('useExplorer', () => {
  let api: Api;
  let warn: jest.SpyInstance;

  beforeEach(() => {
    api = jest.requireMock('../network/IconifyAPI') as Api;
    api.fetchCollection.mockReset();
    api.searchIconsAPI.mockReset();
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const collection = (icons: string[]) => Promise.resolve({ icons });

  /** Mounts the hook against one freshly-claimed icon set. */
  const mount = async (icons: string[], extra: Omit<ExplorerConfig, 'iconSets'> = {}) => {
    const prefix = nextSet();
    api.fetchCollection.mockReturnValue(collection(icons));
    const { result, unmount } = renderHook(() => useExplorer({ iconSets: [prefix], ...extra }));
    await waitFor(() => expect(result.current.results).toHaveLength(icons.length));
    return { result, unmount, prefix };
  };

  describe('loading collections', () => {
    it('browses what it fetched', async () => {
      const { result, prefix } = await mount(['home', 'account', 'cog']);

      expect(result.current.results.map((r) => r.fullName)).toEqual([
        `${prefix}:home`,
        `${prefix}:account`,
        `${prefix}:cog`,
      ]);
      expect(result.current.isLoading).toBe(false);
    });

    /**
     * The regression, and the reason this file exists.
     *
     * `useExplorer({ iconSets: ['mdi'] })` — a hook called the way hooks are
     * called — built a new config object every render. The memo that picked
     * the icon sets was keyed on that object, so it produced a new array every
     * render, so the effect that fetches collections re-ran every render, and
     * that effect sets state. The result was an unbounded stream of requests
     * to the Iconify API; the test process ran out of memory before it stopped.
     *
     * There is a real wait here because the assertion is that nothing further
     * happened, and that cannot be observed at a point in time.
     */
    it('fetches a collection once, not on every render', async () => {
      await mount(['home']);

      await new Promise((resolve) => setTimeout(resolve, 250));

      expect(api.fetchCollection).toHaveBeenCalledTimes(1);
    });

    it('carries on when one collection fails', async () => {
      const prefix = nextSet();
      api.fetchCollection.mockRejectedValue(new Error('gateway said no'));

      const { result } = renderHook(() => useExplorer({ iconSets: [prefix] }));

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.results).toEqual([]);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(`Failed to fetch collection ${prefix}`),
        expect.anything()
      );
    });

    /**
     * Unmounting aborts every request in flight. Treating that as a failure
     * printed one warning per icon set for something that worked.
     */
    it('says nothing when a request was aborted', async () => {
      const prefix = nextSet();
      const aborted = new Error('The operation was aborted.');
      aborted.name = 'AbortError';
      api.fetchCollection.mockRejectedValue(aborted);

      const { result } = renderHook(() => useExplorer({ iconSets: [prefix] }));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('searching', () => {
    // A one-character query is a keystroke, not a search. Asking the API on
    // every one of those is what the local path exists to avoid.
    it('filters locally for a query too short to send', async () => {
      const { result } = await mount(['home', 'home-outline', 'account']);

      act(() => result.current.setQuery('h'));

      await waitFor(() => expect(result.current.results).toHaveLength(2));
      expect(api.searchIconsAPI).not.toHaveBeenCalled();
    });

    it('asks the API once the query is long enough', async () => {
      const { result, prefix } = await mount(['home', 'home-outline', 'account']);
      api.searchIconsAPI.mockResolvedValue([`${prefix}:home`, `${prefix}:home-outline`]);

      act(() => result.current.setQuery('home'));

      await waitFor(() => expect(api.searchIconsAPI).toHaveBeenCalledWith('home', [prefix], 100));
      await waitFor(() =>
        expect(result.current.results.map((r) => r.name)).toEqual(['home', 'home-outline'])
      );
    });

    // The network is the part most likely to be missing, and an explorer that
    // shows nothing offline is worse than one that shows what it already has.
    it('falls back to what it has when the API fails', async () => {
      const { result, prefix } = await mount(['home', 'home-outline', 'account']);
      api.searchIconsAPI.mockRejectedValue(new Error('offline'));

      act(() => result.current.setQuery('home'));

      await waitFor(() => expect(result.current.results).toHaveLength(2));
      expect(result.current.results.map((r) => r.fullName)).toEqual([
        `${prefix}:home`,
        `${prefix}:home-outline`,
      ]);
    });

    it('ranks an exact match above a partial one', async () => {
      const { result } = await mount(['home-outline', 'home']);

      act(() => result.current.setQuery('h'));
      await waitFor(() => expect(result.current.results).toHaveLength(2));

      const [first, second] = result.current.results;
      expect(first.score).toBeGreaterThanOrEqual(second.score);
    });

    it('keeps to the result limit it was given', async () => {
      const prefix = nextSet();
      api.fetchCollection.mockReturnValue(
        collection(Array.from({ length: 50 }, (_, i) => `icon-${i}`))
      );

      const { result } = renderHook(() => useExplorer({ iconSets: [prefix], maxResults: 10 }));

      await waitFor(() => expect(result.current.results).toHaveLength(10));
    });
  });

  describe('selection and filtering', () => {
    it('reports the icon that was selected', async () => {
      const onIconSelect = jest.fn();
      const { result, prefix } = await mount(['home'], { onIconSelect });

      act(() => result.current.selectIcon(`${prefix}:home`));

      expect(result.current.selectedIcon).toBe(`${prefix}:home`);
      expect(onIconSelect).toHaveBeenCalledWith(`${prefix}:home`);
    });

    it('reports nothing when the selection is cleared', async () => {
      const onIconSelect = jest.fn();
      const { result } = await mount(['home'], { onIconSelect });

      act(() => result.current.selectIcon(null));

      expect(result.current.selectedIcon).toBeNull();
      expect(onIconSelect).not.toHaveBeenCalled();
    });

    it('narrows to one icon set', async () => {
      const { result, prefix } = await mount(['home']);

      act(() => result.current.filterByIconSet(prefix));

      await waitFor(() => expect(result.current.activeIconSet).toBe(prefix));
      expect(result.current.results).toHaveLength(1);
    });

    it('remembers the preview settings', async () => {
      const { result } = await mount(['home']);

      act(() => {
        result.current.setPreviewSize(48);
        result.current.setPreviewColor('#FF0000');
      });

      expect(result.current.previewSize).toBe(48);
      expect(result.current.previewColor).toBe('#FF0000');
    });

    it('returns everything to how it started', async () => {
      const { result, prefix } = await mount(['home']);

      act(() => {
        result.current.setQuery('home');
        result.current.selectIcon(`${prefix}:home`);
        result.current.setPreviewSize(64);
      });
      act(() => result.current.reset());

      expect(result.current.query).toBe('');
      expect(result.current.selectedIcon).toBeNull();
      expect(result.current.previewSize).toBe(24);
    });
  });

  describe('copying code', () => {
    beforeEach(() => {
      jest.spyOn(Clipboard, 'setString').mockImplementation(() => undefined);
      jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    });

    const copied = () => (Clipboard.setString as jest.Mock).mock.calls[0][0] as string;

    it('copies the JSX for an icon', async () => {
      const { result, prefix } = await mount(['home']);

      act(() => result.current.copyIconCode(`${prefix}:home`));

      expect(copied()).toContain('name="home"');
      expect(copied()).not.toContain('import');
    });

    it('copies the import alongside the JSX when asked', async () => {
      const { result, prefix } = await mount(['home']);

      act(() => result.current.copyIconCode(`${prefix}:home`, 'import'));

      expect(copied()).toContain('import');
      expect(copied()).toContain('name="home"');
    });

    it('copies at the size and colour being previewed', async () => {
      const { result, prefix } = await mount(['home']);

      act(() => {
        result.current.setPreviewSize(48);
        result.current.setPreviewColor('#FF0000');
      });
      act(() => result.current.copyIconCode(`${prefix}:home`));

      expect(copied()).toContain('48');
      expect(copied()).toContain('#FF0000');
    });

    // The alert is the confirmation of last resort. An application that
    // handles the copy itself shows its own, and two would be one too many.
    it('confirms with an alert only when nobody else will', async () => {
      const { result, prefix } = await mount(['home']);

      act(() => result.current.copyIconCode(`${prefix}:home`));

      expect(Alert.alert).toHaveBeenCalled();
    });

    it('leaves the confirmation to the application that asked for it', async () => {
      const onCopyCode = jest.fn();
      const { result, prefix } = await mount(['home'], { onCopyCode });

      act(() => result.current.copyIconCode(`${prefix}:home`));

      expect(onCopyCode).toHaveBeenCalledWith(expect.stringContaining('name="home"'));
      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });
});
