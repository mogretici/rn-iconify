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

    it('should return null for unsafe characters in prefix', () => {
      expect(parseIconName('mdi%20:home')).toBeNull();
      expect(parseIconName('mdi&:home')).toBeNull();
      expect(parseIconName('mdi?:home')).toBeNull();
      expect(parseIconName('mdi#:home')).toBeNull();
      expect(parseIconName('mdi/:home')).toBeNull();
    });

    it('should return null for unsafe characters in name', () => {
      expect(parseIconName('mdi:home%20')).toBeNull();
      expect(parseIconName('mdi:home&bar')).toBeNull();
      expect(parseIconName('mdi:home?query')).toBeNull();
      expect(parseIconName('mdi:home#hash')).toBeNull();
      expect(parseIconName('mdi:home/path')).toBeNull();
    });

    it('should allow valid characters (alphanumeric, hyphen, underscore)', () => {
      expect(parseIconName('mdi-light:arrow-left')).toEqual({
        prefix: 'mdi-light',
        name: 'arrow-left',
      });
      expect(parseIconName('fa6_solid:home_icon')).toEqual({
        prefix: 'fa6_solid',
        name: 'home_icon',
      });
      expect(parseIconName('icon123:name456')).toEqual({ prefix: 'icon123', name: 'name456' });
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

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.iconify.design/mdi.json?icons=home',
        expect.objectContaining({ signal: expect.any(Object) })
      );
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
      // Mock returns valid response but without the requested icon
      mockFetch.mockResolvedValue({
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

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(fetchIcon('mdi:home')).rejects.toThrow('Network error');
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new SyntaxError('Unexpected token')),
      });

      await expect(fetchIcon('mdi:home')).rejects.toThrow();
    });

    it('should handle invalid API response structure', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' }),
      });

      await expect(fetchIcon('mdi:home')).rejects.toThrow('Invalid API response');
    });

    it('should handle AbortController cancellation', async () => {
      const controller = new AbortController();

      // Abort immediately
      controller.abort();

      await expect(fetchIcon('mdi:home', controller.signal)).rejects.toThrow();
    });

    it('should retry on 5xx server errors', async () => {
      // First two calls fail with 500, third succeeds
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockIconResponse),
        });

      const svg = await fetchIcon('mdi:home');

      // Should have retried twice (3 total calls)
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(svg).toContain('<svg');
    });

    it('should not retry on 4xx client errors', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 400 });

      await expect(fetchIcon('mdi:home')).rejects.toThrow('HTTP 400');

      // Should only call once (no retry for client errors)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
