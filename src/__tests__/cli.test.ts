/**
 * CLI Tests
 * Tests for CLI parser and bundle utilities
 */

import * as path from 'path';
import * as fs from 'fs';
import { analyzeDirectory, getUniqueIcons, parseIconList } from '../cli/parser';
import { loadOfflineBundle, isBundleCompatible, getBundleStats, type IconBundle } from '../bundle';
import { CacheManager } from '../cache/CacheManager';

// Mock CacheManager
jest.mock('../cache/CacheManager', () => ({
  CacheManager: {
    get: jest.fn(() => null),
    set: jest.fn(),
    clear: jest.fn(),
  },
}));

describe('CLI Parser', () => {
  describe('parseIconList', () => {
    it('parses comma-separated string', () => {
      const result = parseIconList('mdi:home,mdi:settings,heroicons:user');
      expect(result).toEqual(['mdi:home', 'mdi:settings', 'heroicons:user']);
    });

    it('handles spaces in string', () => {
      const result = parseIconList('mdi:home, mdi:settings , heroicons:user');
      expect(result).toEqual(['mdi:home', 'mdi:settings', 'heroicons:user']);
    });

    it('returns array as-is', () => {
      const input = ['mdi:home', 'mdi:settings'];
      const result = parseIconList(input);
      expect(result).toEqual(input);
    });

    it('filters empty strings', () => {
      const result = parseIconList('mdi:home,,mdi:settings,');
      expect(result).toEqual(['mdi:home', 'mdi:settings']);
    });
  });

  describe('analyzeDirectory', () => {
    const testDir = path.join(__dirname, '__fixtures__', 'test-src');

    beforeAll(() => {
      // Create test fixture directory
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }

      // Create a test file with icon usage
      const testFile = `
import React from 'react';
import { Mdi, Heroicons } from 'rn-iconify';

export function TestComponent() {
  return (
    <>
      <Mdi name="home" size={24} />
      <Mdi name="settings" size={24} />
      <Heroicons name="user" size={24} />
      <Mdi name="home" size={32} />
    </>
  );
}
      `;

      fs.writeFileSync(path.join(testDir, 'Test.tsx'), testFile);
    });

    afterAll(() => {
      // Clean up test fixtures
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
      }
    });

    it('finds icons in source files', () => {
      const result = analyzeDirectory(testDir);

      expect(result.totalIcons).toBeGreaterThan(0);
      expect(result.filesAnalyzed).toBe(1);
    });

    it('counts icon usage correctly', () => {
      const result = analyzeDirectory(testDir);

      // Should find mdi:home (used twice), mdi:settings (once), heroicons:user (once)
      const homeIcon = result.icons.find((i) => i.icon === 'mdi:home');
      expect(homeIcon?.count).toBe(2);

      const settingsIcon = result.icons.find((i) => i.icon === 'mdi:settings');
      expect(settingsIcon?.count).toBe(1);
    });

    it('groups icons by prefix', () => {
      const result = analyzeDirectory(testDir);

      expect(result.byPrefix.mdi).toBeDefined();
      expect(result.byPrefix.mdi.icons).toContain('mdi:home');
      expect(result.byPrefix.mdi.icons).toContain('mdi:settings');

      expect(result.byPrefix.heroicons).toBeDefined();
      expect(result.byPrefix.heroicons.icons).toContain('heroicons:user');
    });

    it('records file locations', () => {
      const result = analyzeDirectory(testDir);

      const homeIcon = result.icons.find((i) => i.icon === 'mdi:home');
      expect(homeIcon?.locations.length).toBe(2);
      expect(homeIcon?.locations[0].file).toContain('Test.tsx');
    });
  });

  describe('getUniqueIcons', () => {
    it('extracts unique icon names', () => {
      const result = {
        totalIcons: 3,
        totalUsage: 5,
        byPrefix: {},
        icons: [
          { icon: 'mdi:home', count: 2, locations: [] },
          { icon: 'mdi:settings', count: 1, locations: [] },
          { icon: 'heroicons:user', count: 2, locations: [] },
        ],
        filesAnalyzed: 1,
        timestamp: new Date().toISOString(),
      };

      const icons = getUniqueIcons(result);
      expect(icons).toEqual(['mdi:home', 'mdi:settings', 'heroicons:user']);
    });
  });
});

describe('Bundle Module', () => {
  const mockBundle: IconBundle = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    icons: {
      'mdi:home': {
        svg: '<svg><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
        width: 24,
        height: 24,
      },
      'mdi:settings': {
        svg: '<svg><path d="M12 15.5A3.5 3.5 0 0115.5 12..."/></svg>',
        width: 24,
        height: 24,
      },
    },
    count: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isBundleCompatible', () => {
    it('returns true for valid v1.x bundle', () => {
      expect(isBundleCompatible(mockBundle)).toBe(true);
    });

    it('returns false for null/undefined', () => {
      expect(isBundleCompatible(null as any)).toBe(false);
      expect(isBundleCompatible(undefined as any)).toBe(false);
    });

    it('returns false for missing fields', () => {
      expect(isBundleCompatible({} as any)).toBe(false);
      expect(isBundleCompatible({ version: '1.0.0' } as any)).toBe(false);
    });

    it('returns false for incompatible version', () => {
      const bundle = { ...mockBundle, version: '2.0.0' };
      expect(isBundleCompatible(bundle)).toBe(false);
    });
  });

  describe('getBundleStats', () => {
    it('returns correct statistics', () => {
      const stats = getBundleStats(mockBundle);

      expect(stats.iconCount).toBe(2);
      expect(stats.prefixes).toEqual(['mdi']);
      expect(stats.estimatedSizeBytes).toBeGreaterThan(0);
      expect(stats.generatedAt).toBeInstanceOf(Date);
    });

    it('handles multiple prefixes', () => {
      const multiPrefixBundle: IconBundle = {
        ...mockBundle,
        icons: {
          'mdi:home': mockBundle.icons['mdi:home'],
          'heroicons:user': {
            svg: '<svg><path d="..."/></svg>',
            width: 24,
            height: 24,
          },
        },
        count: 2,
      };

      const stats = getBundleStats(multiPrefixBundle);
      expect(stats.prefixes).toEqual(['heroicons', 'mdi']);
    });
  });

  describe('loadOfflineBundle', () => {
    it('loads icons into cache', () => {
      const result = loadOfflineBundle(mockBundle);

      expect(result.loaded).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.total).toBe(2);
      expect(result.version).toBe('1.0.0');
      expect(result.loadTimeMs).toBeGreaterThanOrEqual(0);

      // Verify CacheManager.set was called for each icon
      expect(CacheManager.set).toHaveBeenCalledTimes(2);
    });

    it('skips existing icons when skipExisting is true', () => {
      // Mock that one icon already exists
      (CacheManager.get as jest.Mock).mockImplementation((name: string) => {
        return name === 'mdi:home' ? '<svg>cached</svg>' : null;
      });

      const result = loadOfflineBundle(mockBundle, { skipExisting: true });

      expect(result.loaded).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it('overwrites existing icons when skipExisting is false', () => {
      (CacheManager.get as jest.Mock).mockReturnValue('<svg>cached</svg>');

      const result = loadOfflineBundle(mockBundle, { skipExisting: false });

      expect(result.loaded).toBe(2);
      expect(result.skipped).toBe(0);
    });
  });
});
