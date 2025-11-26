/**
 * IconifyAPI Unit Tests
 */

import { parseIconName, fetchIcon } from '../network/IconifyAPI';

// Mock fetch
const mockFetch = global.fetch as jest.Mock;

describe('IconifyAPI', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('parseIconName', () => {
    it('should parse valid icon name', () => {
      const result = parseIconName('mdi:home');
      expect(result).toEqual({ prefix: 'mdi', name: 'home' });
    });

    it('should parse icon name with dashes', () => {
      const result = parseIconName('heroicons:arrow-left');
      expect(result).toEqual({ prefix: 'heroicons', name: 'arrow-left' });
    });

    it('should return null for invalid format (no colon)', () => {
      const result = parseIconName('mdihome');
      expect(result).toBeNull();
    });

    it('should return null for empty prefix', () => {
      const result = parseIconName(':home');
      expect(result).toBeNull();
    });

    it('should return null for empty name', () => {
      const result = parseIconName('mdi:');
      expect(result).toBeNull();
    });

    it('should return null for multiple colons', () => {
      const result = parseIconName('mdi:home:extra');
      expect(result).toBeNull();
    });
  });

  describe('fetchIcon', () => {
    const mockIconResponse = {
      prefix: 'mdi',
      icons: {
        home: {
          body: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>',
          width: 24,
          height: 24,
        },
      },
      width: 24,
      height: 24,
    };

    it('should fetch and return SVG for valid icon', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIconResponse),
      });

      const svg = await fetchIcon('mdi:home');

      expect(mockFetch).toHaveBeenCalledWith('https://api.iconify.design/mdi.json?icons=home');
      expect(svg).toContain('<svg');
      expect(svg).toContain('viewBox="0 0 24 24"');
      expect(svg).toContain('<path');
    });

    it('should throw error for invalid icon name format', async () => {
      await expect(fetchIcon('invalid')).rejects.toThrow('Invalid icon name format');
    });

    it('should throw error for HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(fetchIcon('mdi:nonexistent')).rejects.toThrow('HTTP 404');
    });

    it('should throw error when icon not found in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'mdi',
            icons: {},
          }),
      });

      await expect(fetchIcon('mdi:nonexistent')).rejects.toThrow('not found');
    });

    it('should deduplicate concurrent requests for the same icon', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockIconResponse),
      });

      // Make 3 concurrent requests for the same icon
      const promises = [fetchIcon('mdi:home'), fetchIcon('mdi:home'), fetchIcon('mdi:home')];

      await Promise.all(promises);

      // Should only make 1 actual fetch request
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
