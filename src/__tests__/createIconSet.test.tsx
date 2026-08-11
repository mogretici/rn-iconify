/**
 * createIconSet Unit Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// Mock IconRenderer before importing createIconSet
const mockIconRenderer = jest.fn();

jest.mock('../IconRenderer', () => ({
  IconRenderer: (props: Record<string, unknown>) => {
    mockIconRenderer(props);
    const RN = require('react-native');
    return (
      <RN.View
        testID="icon-renderer"
        data-icon-name={props.iconName}
        data-size={props.size}
        data-color={props.color}
        {...props}
      />
    );
  },
}));

// Import after mock
import { createIconSet } from '../createIconSet';

describe('createIconSet', () => {
  const testIcons = {
    home: true,
    settings: true,
    user: true,
  } as const;

  type TestIconName = keyof typeof testIcons;
  const TestIcon = createIconSet<TestIconName>('test', testIcons);

  beforeEach(() => {
    mockIconRenderer.mockClear();
  });

  it('should create a component with correct display name', () => {
    expect(TestIcon.displayName).toBe('TestIcon');
  });

  it('should call IconRenderer with correct iconName', () => {
    render(<TestIcon name="home" size={32} color="blue" />);

    expect(mockIconRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        iconName: 'test:home',
        size: 32,
        color: 'blue',
      })
    );
  });

  it('should use default size and color', () => {
    render(<TestIcon name="home" />);

    expect(mockIconRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        iconName: 'test:home',
        size: 24,
        color: '#000000',
      })
    );
  });

  it('should pass through all props to IconRenderer', () => {
    const onLoad = jest.fn();
    const onError = jest.fn();

    render(
      <TestIcon
        name="settings"
        size={48}
        color="red"
        rotate={90}
        flip="horizontal"
        accessibilityLabel="Settings icon"
        testID="custom-test-id"
        onLoad={onLoad}
        onError={onError}
      />
    );

    expect(mockIconRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        iconName: 'test:settings',
        size: 48,
        color: 'red',
        rotate: 90,
        flip: 'horizontal',
        accessibilityLabel: 'Settings icon',
        testID: 'custom-test-id',
        onLoad,
        onError,
      })
    );
  });

  describe('TypeScript type safety', () => {
    it('should accept valid icon names', () => {
      // These should compile without errors
      render(<TestIcon name="home" />);
      render(<TestIcon name="settings" />);
      render(<TestIcon name="user" />);
    });

    // Note: Invalid names would cause TypeScript compilation errors
    // which cannot be tested at runtime
  });
});

describe('createIconSet with different prefixes', () => {
  beforeEach(() => {
    mockIconRenderer.mockClear();
  });

  it('should handle prefix with dashes', () => {
    const icons = { home: true } as const;
    const MdiLight = createIconSet<keyof typeof icons>('mdi-light', icons);

    expect(MdiLight.displayName).toBe('MdiLightIcon');

    render(<MdiLight name="home" />);
    expect(mockIconRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        iconName: 'mdi-light:home',
      })
    );
  });

  it('should handle prefix with underscores', () => {
    const icons = { home: true } as const;
    const CustomSet = createIconSet<keyof typeof icons>('custom_set', icons);

    expect(CustomSet.displayName).toBe('CustomSetIcon');
  });

  describe('mapped names', () => {
    /**
     * A mapped entry resolves to a different icon than its key. It covers two
     * cases the generator produces: keys that had to be sanitized to be valid
     * TypeScript (`_500px`), and names Iconify has since renamed, which are
     * kept so upgrading this package does not break existing code.
     */
    const mappedIcons = {
      _500px: '500px',
      five: '5',
      'nine-one-one': '911',
      home: true,
    } as const;

    const MappedSet = createIconSet<keyof typeof mappedIcons>('pinhead', mappedIcons);

    it('requests the sanitized key under its real name', () => {
      render(<MappedSet name="_500px" />);

      expect(mockIconRenderer).toHaveBeenCalledWith(
        expect.objectContaining({ iconName: 'pinhead:500px' })
      );
    });

    it('requests a renamed icon under its current name', () => {
      render(<MappedSet name="five" />);

      expect(mockIconRenderer).toHaveBeenCalledWith(
        expect.objectContaining({ iconName: 'pinhead:5' })
      );
    });

    it('resolves a renamed icon whose new name looks unrelated', () => {
      render(<MappedSet name="nine-one-one" />);

      expect(mockIconRenderer).toHaveBeenCalledWith(
        expect.objectContaining({ iconName: 'pinhead:911' })
      );
    });

    it('still passes plain entries through unchanged', () => {
      render(<MappedSet name="home" />);

      expect(mockIconRenderer).toHaveBeenCalledWith(
        expect.objectContaining({ iconName: 'pinhead:home' })
      );
    });

    it('labels the icon with the name the caller used', () => {
      render(<MappedSet name="five" />);

      expect(mockIconRenderer).toHaveBeenCalledWith(
        expect.objectContaining({ accessibilityLabel: 'five' })
      );
    });
  });
});

/**
 * The "Did you mean?" suggestion is the only part of this factory that runs
 * an algorithm, and it runs in every consumer's development build on every
 * render of a mistyped icon. An exception here would surface inside their app
 * rather than ours, so its edges matter more than its usefulness does.
 */
describe('createIconSet unknown name warnings', () => {
  const icons = {
    home: true,
    settings: true,
    'account-circle': true,
  } as const;

  const Icon = createIconSet<keyof typeof icons>('mdi', icons);
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockIconRenderer.mockClear();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  const warningText = () => warnSpy.mock.calls.map((call) => String(call[0])).join('\n');

  it('says nothing about a name that exists', () => {
    render(<Icon name="home" />);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('names the icon set it was asked about', () => {
    render(<Icon name={'hme' as 'home'} />);

    expect(warningText()).toContain('Mdi');
    expect(warningText()).toContain('hme');
  });

  it('suggests the name that was probably meant', () => {
    render(<Icon name={'settigns' as 'settings'} />);

    expect(warningText()).toContain('Did you mean "settings"');
  });

  it('suggests nothing when nothing is close', () => {
    render(<Icon name={'zzzzzzzzzzzz' as 'home'} />);

    expect(warnSpy).toHaveBeenCalled();
    expect(warningText()).not.toContain('Did you mean');
  });

  // Distance is allowed to grow with the name, so a long name with two typos
  // still resolves while a short one with two is already too far gone.
  it('matches a longer name through more than one typo', () => {
    render(<Icon name={'acount-circle' as 'home'} />);

    expect(warningText()).toContain('Did you mean "account-circle"');
  });

  it('survives an empty name', () => {
    expect(() => render(<Icon name={'' as 'home'} />)).not.toThrow();
  });

  it('survives a name longer than anything in the set', () => {
    expect(() => render(<Icon name={'a'.repeat(500) as 'home'} />)).not.toThrow();
  });

  /**
   * The generated name lists are a snapshot of Iconify from when the package
   * was built. An icon added upstream since then is missing from them and yet
   * perfectly real, so an unrecognised name is asked for as itself — the
   * alternative was asking for "mdi:undefined", which could never resolve.
   */
  it('asks for an unrecognised name as itself, not as undefined', () => {
    render(<Icon name={'added-upstream-last-week' as 'home'} />);

    expect(mockIconRenderer).toHaveBeenCalledWith(
      expect.objectContaining({ iconName: 'mdi:added-upstream-last-week' })
    );
  });

  it('handles a set with no icons at all', () => {
    const Empty = createIconSet<string>('empty', {});

    expect(() => render(<Empty name="anything" />)).not.toThrow();
  });
});

describe('createIconSet display names', () => {
  it.each([
    ['mdi', 'MdiIcon'],
    ['mdi-light', 'MdiLightIcon'],
    ['material_symbols', 'MaterialSymbolsIcon'],
    ['fa6-solid', 'Fa6SolidIcon'],
  ])('turns %s into %s', (prefix, expected) => {
    expect(createIconSet<string>(prefix, { a: true }).displayName).toBe(expected);
  });
});
