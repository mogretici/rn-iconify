/**
 * Cache Writer Tests
 * Tests for the Babel plugin's icon fetching and bundle generation
 */

import * as fs from 'fs';
import {
  fetchAndCreateBundle,
  writeBundleToFile,
  generateBundle,
  isBundleValid,
  groupIconsByPrefix,
  buildSvg,
} from '../babel/cache-writer';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
}));

// Mock path.dirname to work properly
jest.mock('path', () => {
  const actual = jest.requireActual('path');
  return {
    ...actual,
    dirname: actual.dirname,
    join: actual.join,
    isAbsolute: actual.isAbsolute,
  };
});

describe('Cache Writer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('groupIconsByPrefix', () => {
    it('groups icons by their prefix', () => {
      const icons = ['mdi:home', 'mdi:settings', 'heroicons:user', 'lucide:camera'];
      const grouped = groupIconsByPrefix(icons);

      expect(grouped.get('mdi')).toEqual(['home', 'settings']);
      expect(grouped.get('heroicons')).toEqual(['user']);
      expect(grouped.get('lucide')).toEqual(['camera']);
    });

    it('handles empty array', () => {
      const grouped = groupIconsByPrefix([]);
      expect(grouped.size).toBe(0);
    });

    it('handles icons with hyphenated prefixes', () => {
      const icons = ['fa6-solid:house', 'fa6-regular:star'];
      const grouped = groupIconsByPrefix(icons);

      expect(grouped.get('fa6-solid')).toEqual(['house']);
      expect(grouped.get('fa6-regular')).toEqual(['star']);
    });

    it('skips invalid icon names', () => {
      const icons = ['mdi:home', 'invalid', 'heroicons:user', ''];
      const grouped = groupIconsByPrefix(icons);

      expect(grouped.get('mdi')).toEqual(['home']);
      expect(grouped.get('heroicons')).toEqual(['user']);
      expect(grouped.size).toBe(2);
    });
  });

  describe('buildSvg', () => {
    it('builds basic SVG from icon data', () => {
      const iconData = {
        body: '<path d="M12 2L2 7v10l10 5l10-5V7l-10-5z"/>',
        width: 24,
        height: 24,
      };

      const result = buildSvg(iconData);

      expect(result.svg).toContain('<svg');
      expect(result.svg).toContain('viewBox="0 0 24 24"');
      expect(result.svg).toContain(iconData.body);
      expect(result.width).toBe(24);
      expect(result.height).toBe(24);
    });

    it('uses default dimensions when not specified', () => {
      const iconData = {
        body: '<path d="M12 2L2 7"/>',
      };

      const result = buildSvg(iconData, 32, 32);

      expect(result.width).toBe(32);
      expect(result.height).toBe(32);
      expect(result.svg).toContain('viewBox="0 0 32 32"');
    });

    it('handles custom viewBox with left/top offsets', () => {
      const iconData = {
        body: '<path d="M0 0"/>',
        width: 100,
        height: 100,
        left: -10,
        top: -10,
      };

      const result = buildSvg(iconData);

      expect(result.svg).toContain('viewBox="-10 -10 100 100"');
    });

    it('applies rotation transformation', () => {
      const iconData = {
        body: '<path d="M0 0"/>',
        width: 24,
        height: 24,
        rotate: 1, // 90 degrees
      };

      const result = buildSvg(iconData);

      expect(result.svg).toContain('transform="rotate(90 12 12)"');
    });

    it('applies horizontal flip transformation', () => {
      const iconData = {
        body: '<path d="M0 0"/>',
        width: 24,
        height: 24,
        hFlip: true,
      };

      const result = buildSvg(iconData);

      // SVG uses space separator, not comma
      expect(result.svg).toContain('scale(-1 1)');
    });

    it('applies vertical flip transformation', () => {
      const iconData = {
        body: '<path d="M0 0"/>',
        width: 24,
        height: 24,
        vFlip: true,
      };

      const result = buildSvg(iconData);

      // SVG uses space separator, not comma
      expect(result.svg).toContain('scale(1 -1)');
    });
  });

  describe('fetchAndCreateBundle', () => {
    it('fetches icons and creates bundle', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          prefix: 'mdi',
          icons: {
            home: {
              body: '<path d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8h5z"/>',
              width: 24,
              height: 24,
            },
          },
          width: 24,
          height: 24,
        }),
      });

      const bundle = await fetchAndCreateBundle(['mdi:home'], { verbose: false });

      expect(bundle.version).toBe('1.0.0');
      expect(bundle.count).toBe(1);
      expect(bundle.icons['mdi:home']).toBeDefined();
      expect(bundle.icons['mdi:home'].svg).toContain('<svg');
    });

    it('handles multiple icons from same prefix', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          prefix: 'mdi',
          icons: {
            home: { body: '<path d="home"/>' },
            settings: { body: '<path d="settings"/>' },
          },
          width: 24,
          height: 24,
        }),
      });

      const bundle = await fetchAndCreateBundle(['mdi:home', 'mdi:settings'], {});

      expect(bundle.count).toBe(2);
      expect(bundle.icons['mdi:home']).toBeDefined();
      expect(bundle.icons['mdi:settings']).toBeDefined();
    });

    it('handles multiple prefixes', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            prefix: 'mdi',
            icons: { home: { body: '<path d="mdi-home"/>' } },
            width: 24,
            height: 24,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            prefix: 'heroicons',
            icons: { user: { body: '<path d="hero-user"/>' } },
            width: 24,
            height: 24,
          }),
        });

      const bundle = await fetchAndCreateBundle(['mdi:home', 'heroicons:user'], {});

      expect(bundle.count).toBe(2);
      expect(bundle.icons['mdi:home']).toBeDefined();
      expect(bundle.icons['heroicons:user']).toBeDefined();
    });

    it('returns empty bundle for empty icon list', async () => {
      const bundle = await fetchAndCreateBundle([], {});

      expect(bundle.count).toBe(0);
      expect(Object.keys(bundle.icons)).toHaveLength(0);
    });

    it('retries on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prefix: 'mdi',
          icons: { home: { body: '<path/>' } },
        }),
      });

      const bundle = await fetchAndCreateBundle(['mdi:home'], {});

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(bundle.count).toBe(1);
    });

    it('handles partial failures gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            prefix: 'mdi',
            icons: { home: { body: '<path/>' } },
          }),
        })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      // Should succeed with partial results
      const bundle = await fetchAndCreateBundle(['mdi:home', 'heroicons:user'], {});

      expect(bundle.icons['mdi:home']).toBeDefined();
      // heroicons:user failed after all retries
    });
  });

  describe('writeBundleToFile', () => {
    it('writes bundle to file', () => {
      const bundle = {
        version: '1.0.0',
        generatedAt: '2024-01-01T00:00:00.000Z',
        icons: { 'mdi:home': { svg: '<svg/>', width: 24, height: 24 } },
        count: 1,
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      writeBundleToFile(bundle, '/output/icons.json', false);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/output/icons.json',
        expect.stringContaining('"version":"1.0.0"'),
        'utf-8'
      );
    });

    it('creates directory if not exists', () => {
      const bundle = {
        version: '1.0.0',
        generatedAt: '2024-01-01T00:00:00.000Z',
        icons: {},
        count: 0,
      };

      (fs.existsSync as jest.Mock).mockReturnValue(false);

      writeBundleToFile(bundle, '/new/path/icons.json', false);

      expect(fs.mkdirSync).toHaveBeenCalledWith('/new/path', { recursive: true });
    });

    it('logs with verbose option', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const bundle = {
        version: '1.0.0',
        generatedAt: '2024-01-01T00:00:00.000Z',
        icons: {},
        count: 0,
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      writeBundleToFile(bundle, '/output/icons.json', true);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[rn-iconify] Bundle written to')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('isBundleValid', () => {
    it('returns true for valid bundle', () => {
      const validBundle = {
        version: '1.0.0',
        generatedAt: '2024-01-01T00:00:00.000Z',
        icons: {},
        count: 5,
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(validBundle));

      const result = isBundleValid('.rn-iconify-cache', '/project');

      expect(result).toBe(true);
    });

    it('returns false if file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = isBundleValid('.rn-iconify-cache', '/project');

      expect(result).toBe(false);
    });

    it('returns false for invalid version', () => {
      const invalidBundle = {
        version: '0.9.0',
        icons: {},
        count: 0,
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(invalidBundle));

      const result = isBundleValid('.rn-iconify-cache', '/project');

      expect(result).toBe(false);
    });

    it('returns false for invalid JSON', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

      const result = isBundleValid('.rn-iconify-cache', '/project');

      expect(result).toBe(false);
    });

    it('handles absolute output paths', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      isBundleValid('/absolute/cache/path', '/project');

      expect(fs.existsSync).toHaveBeenCalledWith('/absolute/cache/path/icons.json');
    });
  });

  describe('generateBundle', () => {
    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
    });

    it('generates bundle with default options', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          prefix: 'mdi',
          icons: { home: { body: '<path/>' } },
        }),
      });

      await generateBundle(['mdi:home'], {}, '/project');

      expect(fs.writeFileSync).toHaveBeenCalledTimes(2); // .json and .js
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('icons.json'),
        expect.any(String),
        'utf-8'
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('icons.js'),
        expect.stringContaining('module.exports'),
        'utf-8'
      );
    });

    it('skips generation for empty icon list', async () => {
      await generateBundle([], {}, '/project');

      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('uses custom output path', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          prefix: 'mdi',
          icons: { home: { body: '<path/>' } },
        }),
      });

      await generateBundle(['mdi:home'], { outputPath: 'custom-cache' }, '/project');

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('custom-cache'),
        expect.any(String),
        'utf-8'
      );
    });

    it('handles fetch errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockFetch.mockRejectedValue(new Error('Network error'));

      // Should not throw
      await generateBundle(['mdi:home'], {}, '/project');

      // Either the fetch failure or bundle generation failure error
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[rn-iconify]'),
        expect.anything()
      );

      consoleSpy.mockRestore();
    });

    it('logs progress with verbose option', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          prefix: 'mdi',
          icons: { home: { body: '<path/>' } },
        }),
      });

      await generateBundle(['mdi:home'], { verbose: true }, '/project');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[rn-iconify]'));

      consoleSpy.mockRestore();
    });
  });
});
