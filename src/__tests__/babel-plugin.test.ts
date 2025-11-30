/**
 * Babel Plugin Tests
 * Tests for the rn-iconify Babel plugin
 */

import {
  COMPONENT_PREFIX_MAP,
  VALID_COMPONENTS,
  VALID_PREFIXES,
  PREFIX_COMPONENT_MAP,
} from '../babel/types';
import {
  getNodeLocation,
  matchesPattern,
  shouldIncludeIcon,
  isValidIconName,
} from '../babel/ast-utils';
import { collector, IconCollector } from '../babel/collector';

describe('Babel Plugin Types', () => {
  describe('COMPONENT_PREFIX_MAP', () => {
    it('contains popular icon sets', () => {
      expect(COMPONENT_PREFIX_MAP.Mdi).toBe('mdi');
      expect(COMPONENT_PREFIX_MAP.Heroicons).toBe('heroicons');
      expect(COMPONENT_PREFIX_MAP.Lucide).toBe('lucide');
      expect(COMPONENT_PREFIX_MAP.Ph).toBe('ph');
      expect(COMPONENT_PREFIX_MAP.Feather).toBe('feather');
      expect(COMPONENT_PREFIX_MAP.Tabler).toBe('tabler');
    });

    it('contains Font Awesome variants', () => {
      expect(COMPONENT_PREFIX_MAP.Fa6Solid).toBe('fa6-solid');
      expect(COMPONENT_PREFIX_MAP.Fa6Regular).toBe('fa6-regular');
      expect(COMPONENT_PREFIX_MAP.Fa6Brands).toBe('fa6-brands');
      expect(COMPONENT_PREFIX_MAP.Fa7Solid).toBe('fa7-solid');
    });

    it('contains Fluent variants', () => {
      expect(COMPONENT_PREFIX_MAP.Fluent).toBe('fluent');
      expect(COMPONENT_PREFIX_MAP.FluentColor).toBe('fluent-color');
      expect(COMPONENT_PREFIX_MAP.FluentEmoji).toBe('fluent-emoji');
    });

    it('contains Material variants', () => {
      expect(COMPONENT_PREFIX_MAP.MaterialSymbols).toBe('material-symbols');
      expect(COMPONENT_PREFIX_MAP.MaterialSymbolsLight).toBe('material-symbols-light');
    });

    it('has more than 200 icon sets', () => {
      expect(Object.keys(COMPONENT_PREFIX_MAP).length).toBeGreaterThan(200);
    });
  });

  describe('PREFIX_COMPONENT_MAP', () => {
    it('is the reverse of COMPONENT_PREFIX_MAP', () => {
      expect(PREFIX_COMPONENT_MAP.mdi).toBe('Mdi');
      expect(PREFIX_COMPONENT_MAP.heroicons).toBe('Heroicons');
      expect(PREFIX_COMPONENT_MAP['fa6-solid']).toBe('Fa6Solid');
    });
  });

  describe('VALID_COMPONENTS', () => {
    it('contains all component names', () => {
      expect(VALID_COMPONENTS.has('Mdi')).toBe(true);
      expect(VALID_COMPONENTS.has('Heroicons')).toBe(true);
      expect(VALID_COMPONENTS.has('NotAComponent')).toBe(false);
    });
  });

  describe('VALID_PREFIXES', () => {
    it('contains all prefixes', () => {
      expect(VALID_PREFIXES.has('mdi')).toBe(true);
      expect(VALID_PREFIXES.has('heroicons')).toBe(true);
      expect(VALID_PREFIXES.has('not-a-prefix')).toBe(false);
    });
  });
});

describe('AST Utilities', () => {
  describe('matchesPattern', () => {
    it('matches exact patterns', () => {
      expect(matchesPattern('mdi:home', 'mdi:home')).toBe(true);
      expect(matchesPattern('mdi:home', 'mdi:settings')).toBe(false);
    });

    it('matches wildcard prefix patterns', () => {
      expect(matchesPattern('mdi:home', 'mdi:*')).toBe(true);
      expect(matchesPattern('mdi:settings', 'mdi:*')).toBe(true);
      expect(matchesPattern('heroicons:user', 'mdi:*')).toBe(false);
    });

    it('matches glob patterns', () => {
      expect(matchesPattern('mdi:home-outline', 'mdi:home-*')).toBe(true);
      expect(matchesPattern('mdi:home-filled', 'mdi:home-*')).toBe(true);
      expect(matchesPattern('mdi:settings', 'mdi:home-*')).toBe(false);
    });
  });

  describe('shouldIncludeIcon', () => {
    it('includes all icons when no patterns specified', () => {
      expect(shouldIncludeIcon('mdi:home')).toBe(true);
      expect(shouldIncludeIcon('heroicons:user')).toBe(true);
    });

    it('respects include patterns', () => {
      expect(shouldIncludeIcon('mdi:home', ['mdi:*'])).toBe(true);
      expect(shouldIncludeIcon('heroicons:user', ['mdi:*'])).toBe(false);
    });

    it('respects exclude patterns', () => {
      expect(shouldIncludeIcon('mdi:home', undefined, ['mdi:test-*'])).toBe(true);
      expect(shouldIncludeIcon('mdi:test-icon', undefined, ['mdi:test-*'])).toBe(false);
    });

    it('exclude takes precedence over include', () => {
      expect(shouldIncludeIcon('mdi:home', ['mdi:*'], ['mdi:home'])).toBe(false);
    });
  });

  describe('isValidIconName', () => {
    it('validates correct format', () => {
      expect(isValidIconName('mdi:home')).toBe(true);
      expect(isValidIconName('heroicons:user')).toBe(true);
      expect(isValidIconName('fa6-solid:arrow-right')).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(isValidIconName('')).toBe(false);
      expect(isValidIconName('home')).toBe(false);
      expect(isValidIconName('mdi:')).toBe(false);
      expect(isValidIconName(':home')).toBe(false);
      expect(isValidIconName('mdi:home:extra')).toBe(false);
    });

    it('rejects non-string values', () => {
      expect(isValidIconName(null as unknown as string)).toBe(false);
      expect(isValidIconName(undefined as unknown as string)).toBe(false);
      expect(isValidIconName(123 as unknown as string)).toBe(false);
    });
  });

  describe('getNodeLocation', () => {
    it('returns location from node', () => {
      const node = {
        loc: {
          start: { line: 10, column: 5 },
          end: { line: 10, column: 20 },
        },
      } as any;

      expect(getNodeLocation(node)).toEqual({ line: 10, column: 5 });
    });

    it('returns defaults when no location', () => {
      const node = {} as any;
      expect(getNodeLocation(node)).toEqual({ line: 0, column: 0 });
    });
  });
});

describe('Icon Collector', () => {
  let testCollector: IconCollector;

  beforeEach(() => {
    testCollector = new IconCollector();
    testCollector.initialize({});
  });

  describe('add', () => {
    it('adds valid icons', () => {
      const added = testCollector.add('mdi:home', 'test.tsx', 10, 5);
      expect(added).toBe(true);
      expect(testCollector.hasIcons()).toBe(true);
      expect(testCollector.getIconNames()).toContain('mdi:home');
    });

    it('rejects invalid icon names', () => {
      const added = testCollector.add('invalid', 'test.tsx', 10, 5);
      expect(added).toBe(false);
    });

    it('skips duplicate icons', () => {
      testCollector.add('mdi:home', 'test.tsx', 10, 5);
      const addedAgain = testCollector.add('mdi:home', 'test.tsx', 20, 5);

      expect(addedAgain).toBe(false);
      expect(testCollector.getCount()).toBe(1);
    });

    it('tracks first occurrence location', () => {
      testCollector.add('mdi:home', 'first.tsx', 10, 5);
      testCollector.add('mdi:home', 'second.tsx', 20, 5);

      const icons = testCollector.getAllIcons();
      expect(icons[0].file).toBe('first.tsx');
      expect(icons[0].line).toBe(10);
    });
  });

  describe('getIconsByPrefix', () => {
    it('groups icons by prefix', () => {
      testCollector.add('mdi:home', 'test.tsx', 1, 0);
      testCollector.add('mdi:settings', 'test.tsx', 2, 0);
      testCollector.add('heroicons:user', 'test.tsx', 3, 0);

      const byPrefix = testCollector.getIconsByPrefix();

      expect(byPrefix.get('mdi')).toEqual(['mdi:home', 'mdi:settings']);
      expect(byPrefix.get('heroicons')).toEqual(['heroicons:user']);
    });
  });

  describe('reset', () => {
    it('clears all state', () => {
      testCollector.add('mdi:home', 'test.tsx', 1, 0);
      testCollector.markFileProcessed('test.tsx');

      testCollector.reset();

      expect(testCollector.hasIcons()).toBe(false);
      expect(testCollector.getProcessedFileCount()).toBe(0);
    });
  });

  describe('include/exclude patterns', () => {
    it('respects include patterns', () => {
      testCollector.initialize({ include: ['mdi:*'] });

      testCollector.add('mdi:home', 'test.tsx', 1, 0);
      testCollector.add('heroicons:user', 'test.tsx', 2, 0);

      expect(testCollector.getIconNames()).toContain('mdi:home');
      expect(testCollector.getIconNames()).not.toContain('heroicons:user');
    });

    it('respects exclude patterns', () => {
      testCollector.initialize({ exclude: ['mdi:test-*'] });

      testCollector.add('mdi:home', 'test.tsx', 1, 0);
      testCollector.add('mdi:test-icon', 'test.tsx', 2, 0);

      expect(testCollector.getIconNames()).toContain('mdi:home');
      expect(testCollector.getIconNames()).not.toContain('mdi:test-icon');
    });
  });
});

describe('Singleton Collector', () => {
  beforeEach(() => {
    collector.reset();
  });

  it('is singleton instance', () => {
    collector.add('mdi:home', 'test.tsx', 1, 0);

    // Re-import should get same instance
    const { collector: sameCollector } = require('../babel/collector');
    expect(sameCollector.hasIcons()).toBe(true);
  });

  it('can be reset', () => {
    collector.add('mdi:home', 'test.tsx', 1, 0);
    collector.reset();
    expect(collector.hasIcons()).toBe(false);
  });
});
