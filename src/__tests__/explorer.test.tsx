/**
 * Tests for Icon Explorer Module
 */

import React from 'react';
import { render, act } from '@testing-library/react-native';
import { View, Clipboard, Alert } from 'react-native';
import {
  IconExplorer,
  useExplorer,
  useExplorerContext,
  getAllIconSets,
  getIconSetByPrefix,
  getIconSetsByCategory,
  searchIconSets,
  generateImportStatement,
  generateIconJSX,
  POPULAR_ICON_SETS,
  DEFAULT_PREVIEW_CONFIG,
  DEFAULT_EXPLORER_CONFIG,
} from '../explorer';

// Mock Clipboard and Alert
jest.spyOn(Clipboard, 'setString').mockImplementation(() => {});
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('Icon Set Utilities', () => {
  describe('POPULAR_ICON_SETS', () => {
    it('contains popular icon sets', () => {
      expect(POPULAR_ICON_SETS.length).toBeGreaterThan(0);
      expect(POPULAR_ICON_SETS.some((set) => set.prefix === 'mdi')).toBe(true);
      expect(POPULAR_ICON_SETS.some((set) => set.prefix === 'heroicons')).toBe(true);
      expect(POPULAR_ICON_SETS.some((set) => set.prefix === 'lucide')).toBe(true);
    });

    it('icon sets have required properties', () => {
      POPULAR_ICON_SETS.forEach((set) => {
        expect(set).toHaveProperty('prefix');
        expect(set).toHaveProperty('name');
        expect(set).toHaveProperty('total');
        expect(typeof set.prefix).toBe('string');
        expect(typeof set.name).toBe('string');
        expect(typeof set.total).toBe('number');
      });
    });
  });

  describe('getAllIconSets', () => {
    it('returns all icon sets', () => {
      const sets = getAllIconSets();
      expect(sets).toEqual(POPULAR_ICON_SETS);
    });
  });

  describe('getIconSetByPrefix', () => {
    it('finds icon set by prefix', () => {
      const mdi = getIconSetByPrefix('mdi');
      expect(mdi).toBeDefined();
      expect(mdi?.prefix).toBe('mdi');
      expect(mdi?.name).toBe('Material Design Icons');
    });

    it('returns undefined for unknown prefix', () => {
      const unknown = getIconSetByPrefix('unknown-prefix');
      expect(unknown).toBeUndefined();
    });
  });

  describe('getIconSetsByCategory', () => {
    it('filters by category', () => {
      const generalSets = getIconSetsByCategory('general');
      expect(generalSets.every((set) => set.category === 'general')).toBe(true);

      const brandSets = getIconSetsByCategory('brand');
      expect(brandSets.every((set) => set.category === 'brand')).toBe(true);
    });
  });

  describe('searchIconSets', () => {
    it('searches by prefix', () => {
      const results = searchIconSets('mdi');
      expect(results.some((set) => set.prefix === 'mdi')).toBe(true);
    });

    it('searches by name', () => {
      const results = searchIconSets('Material');
      expect(results.some((set) => set.name.includes('Material'))).toBe(true);
    });

    it('is case insensitive', () => {
      const results = searchIconSets('HERO');
      expect(results.some((set) => set.prefix === 'heroicons')).toBe(true);
    });
  });

  describe('generateImportStatement', () => {
    it('generates import for mdi icons', () => {
      const result = generateImportStatement('mdi:home');
      expect(result).toBe("import { Mdi } from 'rn-iconify';");
    });

    it('generates import for heroicons', () => {
      const result = generateImportStatement('heroicons:user');
      expect(result).toBe("import { Heroicons } from 'rn-iconify';");
    });

    it('handles complex prefixes', () => {
      const result = generateImportStatement('fa6-solid:house');
      expect(result).toBe("import { Fa6Solid } from 'rn-iconify';");
    });
  });

  describe('generateIconJSX', () => {
    it('generates basic JSX', () => {
      const result = generateIconJSX('mdi:home');
      expect(result).toBe('<Mdi name="home" size={24} color="currentColor" />');
    });

    it('generates JSX with custom size', () => {
      const result = generateIconJSX('mdi:home', 32);
      expect(result).toBe('<Mdi name="home" size={32} color="currentColor" />');
    });

    it('generates JSX with custom color', () => {
      const result = generateIconJSX('mdi:home', 24, '#FF0000');
      expect(result).toBe('<Mdi name="home" size={24} color="#FF0000" />');
    });
  });
});

describe('DEFAULT_PREVIEW_CONFIG', () => {
  it('has correct defaults', () => {
    expect(DEFAULT_PREVIEW_CONFIG.sizes).toEqual([16, 24, 32, 48, 64]);
    expect(DEFAULT_PREVIEW_CONFIG.colors).toContain('#000000');
    expect(DEFAULT_PREVIEW_CONFIG.showName).toBe(true);
    expect(DEFAULT_PREVIEW_CONFIG.showCode).toBe(true);
    expect(DEFAULT_PREVIEW_CONFIG.backgroundColor).toBe('#FFFFFF');
  });
});

describe('DEFAULT_EXPLORER_CONFIG', () => {
  it('has correct defaults', () => {
    expect(DEFAULT_EXPLORER_CONFIG.iconSets).toEqual([]);
    expect(DEFAULT_EXPLORER_CONFIG.initialQuery).toBe('');
    expect(DEFAULT_EXPLORER_CONFIG.maxResults).toBe(100);
    expect(DEFAULT_EXPLORER_CONFIG.keyboardShortcuts).toBe(true);
  });
});

describe('useExplorer', () => {
  function TestComponent({ config, testFn }: { config?: any; testFn: (ctx: any) => void }) {
    const explorer = useExplorer(config);
    testFn(explorer);
    return <View testID="test" />;
  }

  it('returns initial state', () => {
    let state: any = null;

    render(<TestComponent testFn={(ctx) => (state = ctx)} />);

    expect(state.query).toBe('');
    expect(state.results).toEqual([]);
    expect(state.selectedIcon).toBeNull();
    expect(state.activeIconSet).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('provides config', () => {
    let config: any = null;

    render(<TestComponent testFn={(ctx) => (config = ctx.config)} />);

    expect(config.maxResults).toBe(100);
    expect(config.preview).toBeDefined();
  });

  it('provides iconSets', () => {
    let iconSets: any = null;

    render(<TestComponent testFn={(ctx) => (iconSets = ctx.iconSets)} />);

    expect(Array.isArray(iconSets)).toBe(true);
    expect(iconSets.length).toBeGreaterThan(0);
  });

  it('provides setQuery action', () => {
    let setQuery: any = null;
    let query: string = '';

    function TestSetQuery() {
      const explorer = useExplorer();
      setQuery = explorer.setQuery;
      query = explorer.query;
      return <View testID="test" />;
    }

    render(<TestSetQuery />);

    expect(query).toBe('');

    act(() => {
      setQuery('home');
    });
  });

  it('provides selectIcon action', () => {
    let selectIcon: any = null;
    let selectedIcon: any = null;

    function TestSelectIcon() {
      const explorer = useExplorer();
      selectIcon = explorer.selectIcon;
      selectedIcon = explorer.selectedIcon;
      return <View testID="test" />;
    }

    render(<TestSelectIcon />);

    expect(selectedIcon).toBeNull();

    act(() => {
      selectIcon('mdi:home');
    });
  });

  it('provides filterByIconSet action', () => {
    let filterByIconSet: any = null;

    render(<TestComponent testFn={(ctx) => (filterByIconSet = ctx.filterByIconSet)} />);

    expect(typeof filterByIconSet).toBe('function');
  });

  it('provides setPreviewSize action', () => {
    let setPreviewSize: any = null;

    render(<TestComponent testFn={(ctx) => (setPreviewSize = ctx.setPreviewSize)} />);

    expect(typeof setPreviewSize).toBe('function');
  });

  it('provides setPreviewColor action', () => {
    let setPreviewColor: any = null;

    render(<TestComponent testFn={(ctx) => (setPreviewColor = ctx.setPreviewColor)} />);

    expect(typeof setPreviewColor).toBe('function');
  });

  it('provides reset action', () => {
    let reset: any = null;

    render(<TestComponent testFn={(ctx) => (reset = ctx.reset)} />);

    expect(typeof reset).toBe('function');
  });

  it('respects custom config', () => {
    let config: any = null;

    render(
      <TestComponent
        config={{ maxResults: 50, initialQuery: 'home' }}
        testFn={(ctx) => (config = ctx.config)}
      />
    );

    expect(config.maxResults).toBe(50);
    expect(config.initialQuery).toBe('home');
  });

  it('filters iconSets when specified', () => {
    let iconSets: any = null;

    render(
      <TestComponent
        config={{ iconSets: ['mdi', 'heroicons'] }}
        testFn={(ctx) => (iconSets = ctx.iconSets)}
      />
    );

    expect(iconSets.length).toBe(2);
    expect(iconSets.every((set: any) => ['mdi', 'heroicons'].includes(set.prefix))).toBe(true);
  });

  describe('copyIconCode', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('copies JSX to clipboard', () => {
      let copyIconCode: any = null;

      function TestCopyCode() {
        const explorer = useExplorer();
        copyIconCode = explorer.copyIconCode;
        return <View testID="test" />;
      }

      render(<TestCopyCode />);

      act(() => {
        copyIconCode('mdi:home', 'jsx');
      });

      expect(Clipboard.setString).toHaveBeenCalledWith(expect.stringContaining('<Mdi name="home"'));
    });

    it('copies import statement when format is import', () => {
      let copyIconCode: any = null;

      function TestCopyCode() {
        const explorer = useExplorer();
        copyIconCode = explorer.copyIconCode;
        return <View testID="test" />;
      }

      render(<TestCopyCode />);

      act(() => {
        copyIconCode('mdi:home', 'import');
      });

      expect(Clipboard.setString).toHaveBeenCalledWith(expect.stringContaining('import { Mdi }'));
    });

    it('calls onCopyCode callback', () => {
      const onCopyCode = jest.fn();
      let copyIconCode: any = null;

      function TestCopyCode() {
        const explorer = useExplorer({ onCopyCode });
        copyIconCode = explorer.copyIconCode;
        return <View testID="test" />;
      }

      render(<TestCopyCode />);

      act(() => {
        copyIconCode('mdi:home', 'jsx');
      });

      expect(onCopyCode).toHaveBeenCalled();
    });

    it('shows alert when no callback provided', () => {
      let copyIconCode: any = null;

      function TestCopyCode() {
        const explorer = useExplorer();
        copyIconCode = explorer.copyIconCode;
        return <View testID="test" />;
      }

      render(<TestCopyCode />);

      act(() => {
        copyIconCode('mdi:home', 'jsx');
      });

      expect(Alert.alert).toHaveBeenCalledWith('Copied!', 'Icon code copied to clipboard');
    });
  });
});

describe('useExplorerContext', () => {
  it('throws outside ExplorerContext', () => {
    function TestComponent() {
      useExplorerContext();
      return null;
    }

    expect(() => render(<TestComponent />)).toThrow(
      'useExplorerContext must be used within IconExplorer'
    );
  });
});

describe('IconExplorer Component', () => {
  it('renders when visible', () => {
    const { getByText } = render(<IconExplorer visible={true} />);

    expect(getByText('Icon Explorer')).toBeTruthy();
  });

  it('does not render when not visible (inline mode)', () => {
    const { queryByText } = render(<IconExplorer visible={false} />);

    expect(queryByText('Icon Explorer')).toBeNull();
  });

  it('renders close button when onClose provided', () => {
    const onClose = jest.fn();
    const { getAllByText } = render(<IconExplorer visible={true} onClose={onClose} />);

    // The close button shows × (there might be multiple ×)
    const closeButtons = getAllByText('×');
    expect(closeButtons.length).toBeGreaterThan(0);
  });

  it('renders search input', () => {
    const { getByPlaceholderText } = render(<IconExplorer visible={true} />);

    expect(getByPlaceholderText('Search icons...')).toBeTruthy();
  });

  it('renders icon set filters', () => {
    const { getByText } = render(<IconExplorer visible={true} />);

    expect(getByText('All')).toBeTruthy();
    expect(getByText('mdi')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const { toJSON } = render(<IconExplorer visible={true} style={customStyle} />);

    const json = toJSON();
    expect(json).toBeTruthy();
  });
});
