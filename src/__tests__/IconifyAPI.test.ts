/**
 * IconifyAPI Unit Tests
 */

import {
  parseIconName,
  fetchIcon,
  fetchIconsBatch,
  checkAPIHealth,
  getAPIBaseUrl,
  fetchCollection,
  searchIconsAPI,
} from '../network/IconifyAPI';
import { IconLoadError } from '../errors';
import { ConfigManager } from '../config';

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

    it('should throw IconLoadError with INVALID_NAME code for bad format', async () => {
      try {
        await fetchIcon('badname');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(IconLoadError);
        expect((error as IconLoadError).code).toBe('INVALID_NAME');
      }
    });

    it('should throw IconLoadError with NOT_FOUND code for 404', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      try {
        await fetchIcon('mdi:missing');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(IconLoadError);
        expect((error as IconLoadError).code).toBe('NOT_FOUND');
      }
    });

    it('should throw IconLoadError with NOT_FOUND code when icon missing from response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ prefix: 'mdi', icons: {} }),
      });

      try {
        await fetchIcon('mdi:absent');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(IconLoadError);
        expect((error as IconLoadError).code).toBe('NOT_FOUND');
      }
    });

    it('should apply rotate transformation in buildSvg', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'mdi',
            icons: {
              rotated: {
                body: '<path d="M0 0"/>',
                width: 24,
                height: 24,
                rotate: 1,
              },
            },
            width: 24,
            height: 24,
          }),
      });

      const svg = await fetchIcon('mdi:rotated');
      expect(svg).toContain('transform=');
      expect(svg).toContain('rotate(90');
    });

    it('should apply hFlip transformation in buildSvg', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'mdi',
            icons: {
              flipped: {
                body: '<path d="M0 0"/>',
                width: 24,
                height: 24,
                hFlip: true,
              },
            },
            width: 24,
            height: 24,
          }),
      });

      const svg = await fetchIcon('mdi:flipped');
      expect(svg).toContain('transform=');
      expect(svg).toContain('scale(-1 1)');
      expect(svg).toContain('translate(24 0)');
    });

    it('should apply vFlip transformation in buildSvg', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'mdi',
            icons: {
              vflipped: {
                body: '<path d="M0 0"/>',
                width: 24,
                height: 24,
                vFlip: true,
              },
            },
            width: 24,
            height: 24,
          }),
      });

      const svg = await fetchIcon('mdi:vflipped');
      expect(svg).toContain('transform=');
      expect(svg).toContain('scale(1 -1)');
      expect(svg).toContain('translate(0 24)');
    });

    it('should apply combined rotate and flip transformations', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'mdi',
            icons: {
              combo: {
                body: '<path d="M0 0"/>',
                width: 24,
                height: 24,
                rotate: 2,
                hFlip: true,
                vFlip: true,
              },
            },
            width: 24,
            height: 24,
          }),
      });

      const svg = await fetchIcon('mdi:combo');
      expect(svg).toContain('rotate(180');
      expect(svg).toContain('scale(-1 -1)');
      expect(svg).toContain('<g');
    });

    it('should use default width/height when icon data omits them', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'custom',
            icons: {
              minimal: {
                body: '<circle cx="12" cy="12" r="10"/>',
              },
            },
          }),
      });

      const svg = await fetchIcon('custom:minimal');
      // Default width/height of 24 when response doesn't specify
      expect(svg).toContain('viewBox="0 0 24 24"');
      expect(svg).toContain('width="24"');
      expect(svg).toContain('height="24"');
    });

    it('should use left and top offsets in viewBox when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'custom',
            icons: {
              offset: {
                body: '<path d="M0 0"/>',
                width: 32,
                height: 32,
                left: 4,
                top: 4,
              },
            },
          }),
      });

      const svg = await fetchIcon('custom:offset');
      expect(svg).toContain('viewBox="4 4 32 32"');
    });

    it('should reject with abort for deduplicated request with already-aborted signal', async () => {
      // Create a slow-resolving first request
      let resolveFirst!: (value: unknown) => void;
      const firstFetchPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });

      mockFetch.mockReturnValueOnce(firstFetchPromise);

      // Start the first request (no signal)
      const firstRequest = fetchIcon('mdi:dedup-abort');

      // Create an already-aborted signal
      const controller = new AbortController();
      controller.abort();

      // Second request with aborted signal should reject immediately
      await expect(fetchIcon('mdi:dedup-abort', controller.signal)).rejects.toThrow();

      // Resolve the first request so it cleans up
      resolveFirst({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'mdi',
            icons: {
              'dedup-abort': {
                body: '<path d="M0 0"/>',
                width: 24,
                height: 24,
              },
            },
            width: 24,
            height: 24,
          }),
      });

      await firstRequest;
    });

    it('should reject deduplicated request when signal aborts during pending', async () => {
      // Create a slow-resolving first request
      let resolveFirst!: (value: unknown) => void;
      const firstFetchPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });

      mockFetch.mockReturnValueOnce(firstFetchPromise);

      // Start the first request
      const firstRequest = fetchIcon('mdi:dedup-signal');

      // Create a signal and make second request
      const controller = new AbortController();
      const secondRequest = fetchIcon('mdi:dedup-signal', controller.signal);

      // Abort while pending
      controller.abort();

      // Second request should reject with AbortError
      await expect(secondRequest).rejects.toThrow();

      // Resolve the first request so it cleans up
      resolveFirst({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'mdi',
            icons: {
              'dedup-signal': {
                body: '<path d="M0 0"/>',
                width: 24,
                height: 24,
              },
            },
            width: 24,
            height: 24,
          }),
      });

      await firstRequest;
    });

    it('should log fetch attempts when logging is enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Enable logging
      ConfigManager.setConfig({ api: { logging: true } });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'mdi',
            icons: {
              logged: {
                body: '<path d="M0 0"/>',
                width: 24,
                height: 24,
              },
            },
            width: 24,
            height: 24,
          }),
      });

      await fetchIcon('mdi:logged');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[rn-iconify] Fetching:'));

      // Reset config
      ConfigManager.setConfig({ api: { logging: false } });
      consoleSpy.mockRestore();
    });

    it('should log retry attempts when logging is enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Enable logging with fast retries
      ConfigManager.setConfig({ api: { logging: true, retryDelay: 1, retries: 1 } });

      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 }).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'mdi',
            icons: {
              retrylog: {
                body: '<path d="M0 0"/>',
                width: 24,
                height: 24,
              },
            },
            width: 24,
            height: 24,
          }),
      });

      await fetchIcon('mdi:retrylog');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[rn-iconify] Retry'));

      // Reset config
      ConfigManager.setConfig({ api: { logging: false, retryDelay: 1000, retries: 2 } });
      consoleSpy.mockRestore();
    });

    it('should pass user signal through to fetch (exercises anySignal merge)', async () => {
      const controller = new AbortController();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'mdi',
            icons: {
              signaled: {
                body: '<path d="M0 0"/>',
                width: 24,
                height: 24,
              },
            },
            width: 24,
            height: 24,
          }),
      });

      const svg = await fetchIcon('mdi:signaled', controller.signal);

      expect(svg).toContain('<svg');
      // fetch was called with a merged signal
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: expect.any(Object) })
      );
    });

    it('should abort mid-fetch and propagate AbortError', async () => {
      const controller = new AbortController();

      // Simulate fetch being aborted mid-request
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      mockFetch.mockImplementationOnce(() => {
        controller.abort();
        return Promise.reject(abortError);
      });

      await expect(fetchIcon('mdi:abortmid', controller.signal)).rejects.toThrow();
    });

    it('should propagate AbortError when fetch aborts without user signal', async () => {
      // Configure no retries so we get a clean single attempt
      ConfigManager.setConfig({ api: { retries: 0 } });

      // Simulate a timeout abort (AbortError where user signal is NOT aborted)
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      mockFetch.mockRejectedValueOnce(abortError);

      // Without user signal, AbortError implies internal timeout
      await expect(fetchIcon('mdi:timeout-test')).rejects.toThrow();

      // Reset config
      ConfigManager.setConfig({ api: { retries: 2 } });
    });

    it('should handle non-Error throws as NETWORK errors', async () => {
      ConfigManager.setConfig({ api: { retries: 0 } });

      // Simulate a non-Error throw (string)
      mockFetch.mockRejectedValueOnce('string error');

      try {
        await fetchIcon('mdi:nonobj');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(IconLoadError);
        expect((error as IconLoadError).code).toBe('NETWORK');
      }

      ConfigManager.setConfig({ api: { retries: 2 } });
    });
  });

  describe('fetchIconsBatch', () => {
    const mockBatchResponse = {
      prefix: 'mdi',
      icons: {
        home: {
          body: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>',
          width: 24,
          height: 24,
        },
        star: {
          body: '<path d="M12 2l3 6h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z"/>',
          width: 24,
          height: 24,
        },
      },
      width: 24,
      height: 24,
    };

    it('should fetch multiple icons from the same prefix', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBatchResponse),
      });

      const result = await fetchIconsBatch(['mdi:home', 'mdi:star']);

      expect(result.success.size).toBe(2);
      expect(result.success.has('mdi:home')).toBe(true);
      expect(result.success.has('mdi:star')).toBe(true);
      expect(result.failed).toHaveLength(0);
    });

    it('should report invalid icon names as failures', async () => {
      const result = await fetchIconsBatch(['badname', 'also-bad']);

      expect(result.success.size).toBe(0);
      expect(result.failed).toHaveLength(2);
      expect(result.failed[0].error).toBe('Invalid icon name format');
    });

    it('should handle mixed valid and invalid icon names', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBatchResponse),
      });

      const result = await fetchIconsBatch(['mdi:home', 'badname']);

      expect(result.success.size).toBe(1);
      expect(result.success.has('mdi:home')).toBe(true);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].iconName).toBe('badname');
    });

    it('should handle HTTP errors for a prefix group', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await fetchIconsBatch(['mdi:home', 'mdi:star']);

      expect(result.success.size).toBe(0);
      expect(result.failed).toHaveLength(2);
      expect(result.failed[0].error).toBe('HTTP 500');
    });

    it('should handle invalid API response structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'data' }),
      });

      const result = await fetchIconsBatch(['mdi:home']);

      expect(result.success.size).toBe(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toBe('Invalid API response');
    });

    it('should handle icons missing from response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
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
          }),
      });

      const result = await fetchIconsBatch(['mdi:home', 'mdi:missing']);

      expect(result.success.size).toBe(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].iconName).toBe('mdi:missing');
      expect(result.failed[0].error).toBe('Icon not found in response');
    });

    it('should group icons by prefix and make separate requests', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              prefix: 'mdi',
              icons: {
                home: {
                  body: '<path d="M0 0"/>',
                  width: 24,
                  height: 24,
                },
              },
              width: 24,
              height: 24,
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              prefix: 'fa',
              icons: {
                star: {
                  body: '<path d="M0 0"/>',
                  width: 16,
                  height: 16,
                },
              },
              width: 16,
              height: 16,
            }),
        });

      const result = await fetchIconsBatch(['mdi:home', 'fa:star']);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.success.size).toBe(2);
    });

    it('should handle aborted signal', async () => {
      const controller = new AbortController();
      controller.abort();

      const result = await fetchIconsBatch(['mdi:home'], controller.signal);

      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toBe('Aborted');
    });

    it('should handle network errors without failing the entire batch', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const result = await fetchIconsBatch(['mdi:home']);

      expect(result.success.size).toBe(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toBe('Network failure');
    });

    it('should sort icon names alphabetically in the request URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'mdi',
            icons: {
              alpha: { body: '<path d="M0 0"/>', width: 24, height: 24 },
              beta: { body: '<path d="M0 0"/>', width: 24, height: 24 },
              gamma: { body: '<path d="M0 0"/>', width: 24, height: 24 },
            },
            width: 24,
            height: 24,
          }),
      });

      await fetchIconsBatch(['mdi:gamma', 'mdi:alpha', 'mdi:beta']);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('icons=alpha,beta,gamma');
    });

    it('should log batch fetch when logging is enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      ConfigManager.setConfig({ api: { logging: true } });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'mdi',
            icons: {
              home: { body: '<path d="M0 0"/>', width: 24, height: 24 },
            },
            width: 24,
            height: 24,
          }),
      });

      await fetchIconsBatch(['mdi:home']);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[rn-iconify] Batch fetching:')
      );

      ConfigManager.setConfig({ api: { logging: false } });
      consoleSpy.mockRestore();
    });
  });

  describe('checkAPIHealth', () => {
    it('should return true when API is reachable', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const result = await checkAPIHealth();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/collections'),
        expect.objectContaining({ method: 'HEAD' })
      );
    });

    it('should return false when API returns non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });

      const result = await checkAPIHealth();

      expect(result).toBe(false);
    });

    it('should return false when network error occurs', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await checkAPIHealth();

      expect(result).toBe(false);
    });

    it('should use provided timeout', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const result = await checkAPIHealth(1000);

      expect(result).toBe(true);
    });
  });

  describe('getAPIBaseUrl', () => {
    it('should return the default base URL', () => {
      const url = getAPIBaseUrl();
      expect(url).toBe('https://api.iconify.design');
    });

    it('should return custom base URL when configured', () => {
      ConfigManager.setConfig({ api: { apiUrl: 'https://custom.api.com' } });

      const url = getAPIBaseUrl();
      expect(url).toBe('https://custom.api.com');

      // Reset
      ConfigManager.setConfig({ api: { apiUrl: 'https://api.iconify.design' } });
    });
  });

  describe('fetchCollection', () => {
    it('should fetch collection info with uncategorized icons', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'mdi',
            total: 3,
            title: 'Material Design Icons',
            uncategorized: ['home', 'star', 'check'],
          }),
      });

      const result = await fetchCollection('mdi');

      expect(result.prefix).toBe('mdi');
      expect(result.total).toBe(3);
      expect(result.title).toBe('Material Design Icons');
      expect(result.icons).toEqual(['home', 'star', 'check']);
    });

    it('should fetch collection info with categorized icons', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'mdi',
            total: 5,
            title: 'Material Design Icons',
            categories: {
              Navigation: ['home', 'arrow-left'],
              Actions: ['check', 'close', 'star'],
            },
          }),
      });

      const result = await fetchCollection('mdi');

      expect(result.icons).toContain('home');
      expect(result.icons).toContain('check');
      expect(result.icons).toHaveLength(5);
      expect(result.categories).toBeDefined();
    });

    it('should deduplicate icons across uncategorized and categories', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'mdi',
            total: 3,
            uncategorized: ['home', 'star'],
            categories: {
              Actions: ['star', 'check'],
            },
          }),
      });

      const result = await fetchCollection('mdi');

      // 'star' appears in both but should be deduplicated
      expect(result.icons).toHaveLength(3);
      expect(new Set(result.icons).size).toBe(3);
    });

    it('should throw error for invalid prefix', async () => {
      await expect(fetchCollection('bad/prefix')).rejects.toThrow('Invalid icon set prefix');
      await expect(fetchCollection('bad?prefix')).rejects.toThrow('Invalid icon set prefix');
    });

    it('should throw error on HTTP failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(fetchCollection('nonexistent')).rejects.toThrow('HTTP 404');
    });

    it('should throw error on invalid API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(null),
      });

      await expect(fetchCollection('mdi')).rejects.toThrow('Invalid API response');
    });

    it('should pass signal to fetch for cancellation', async () => {
      const controller = new AbortController();
      controller.abort();

      mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

      await expect(fetchCollection('mdi', controller.signal)).rejects.toThrow();
    });

    it('should use total from response or fallback to icons count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'mdi',
            uncategorized: ['home', 'star'],
          }),
      });

      const result = await fetchCollection('mdi');

      // No total in response, should use icons.length
      expect(result.total).toBe(2);
    });

    it('should log when logging is enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      ConfigManager.setConfig({ api: { logging: true } });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'mdi',
            total: 1,
            uncategorized: ['home'],
          }),
      });

      await fetchCollection('mdi');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[rn-iconify] Fetching collection:')
      );

      ConfigManager.setConfig({ api: { logging: false } });
      consoleSpy.mockRestore();
    });

    it('should return aliases from response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'mdi',
            total: 1,
            uncategorized: ['home'],
            aliases: { house: 'home' },
          }),
      });

      const result = await fetchCollection('mdi');
      expect(result.aliases).toEqual({ house: 'home' });
    });

    it('should handle empty collection (no icons)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix: 'empty-set',
            total: 0,
          }),
      });

      const result = await fetchCollection('empty-set');

      expect(result.icons).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('searchIconsAPI', () => {
    it('should search icons with query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            icons: ['mdi:home', 'mdi:home-outline', 'fa:home'],
          }),
      });

      const result = await searchIconsAPI('home');

      expect(result).toEqual(['mdi:home', 'mdi:home-outline', 'fa:home']);
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('query=home');
    });

    it('should include prefixes filter in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ icons: ['mdi:home'] }),
      });

      await searchIconsAPI('home', ['mdi', 'fa']);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('prefixes=mdi%2Cfa');
    });

    it('should include limit in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ icons: ['mdi:home'] }),
      });

      await searchIconsAPI('home', undefined, 50);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('limit=50');
    });

    it('should use default limit of 100', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ icons: ['mdi:home'] }),
      });

      await searchIconsAPI('home');

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('limit=100');
    });

    it('should throw error on HTTP failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(searchIconsAPI('home')).rejects.toThrow('HTTP 500');
    });

    it('should return empty array when response has no icons array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ total: 0 }),
      });

      const result = await searchIconsAPI('nonexistent');

      expect(result).toEqual([]);
    });

    it('should pass signal for cancellation', async () => {
      const controller = new AbortController();
      controller.abort();

      mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

      await expect(searchIconsAPI('home', undefined, 100, controller.signal)).rejects.toThrow();
    });

    it('should log search when logging is enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      ConfigManager.setConfig({ api: { logging: true } });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ icons: [] }),
      });

      await searchIconsAPI('test');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[rn-iconify] Searching icons:')
      );

      ConfigManager.setConfig({ api: { logging: false } });
      consoleSpy.mockRestore();
    });

    it('should not include prefixes param when array is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ icons: [] }),
      });

      await searchIconsAPI('home', []);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).not.toContain('prefixes=');
    });
  });
});
