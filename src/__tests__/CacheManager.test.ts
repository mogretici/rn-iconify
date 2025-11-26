/**
 * CacheManager Unit Tests
 */

import { CacheManager } from '../cache/CacheManager';
import { MemoryCache } from '../cache/MemoryCache';
import { DiskCache } from '../cache/DiskCache';

// Mock DiskCache since it uses MMKV
jest.mock('../cache/DiskCache', () => {
  const storage = new Map<string, string>();
  return {
    DiskCache: {
      get: jest.fn((key: string) => storage.get(key) ?? null),
      set: jest.fn((key: string, value: string) => storage.set(key, value)),
      has: jest.fn((key: string) => storage.has(key)),
      delete: jest.fn((key: string) => storage.delete(key)),
      clear: jest.fn(() => storage.clear()),
      keys: jest.fn(() => Array.from(storage.keys())),
      getStats: jest.fn(() => ({ iconCount: storage.size, sizeBytes: 0 })),
    },
  };
});

describe('CacheManager', () => {
  beforeEach(() => {
    MemoryCache.clear();
    (DiskCache.clear as jest.Mock).mockClear();
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return from memory cache first', () => {
      MemoryCache.set('mdi:home', '<svg>memory</svg>');
      (DiskCache.get as jest.Mock).mockReturnValue('<svg>disk</svg>');

      const result = CacheManager.get('mdi:home');

      expect(result).toBe('<svg>memory</svg>');
      expect(DiskCache.get).not.toHaveBeenCalled();
    });

    it('should fall back to disk cache and promote to memory', () => {
      (DiskCache.get as jest.Mock).mockReturnValue('<svg>disk</svg>');

      const result = CacheManager.get('mdi:home');

      expect(result).toBe('<svg>disk</svg>');
      expect(MemoryCache.get('mdi:home')).toBe('<svg>disk</svg>');
    });

    it('should return null when not in any cache', () => {
      (DiskCache.get as jest.Mock).mockReturnValue(null);

      const result = CacheManager.get('mdi:nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store in both memory and disk cache', () => {
      CacheManager.set('mdi:home', '<svg>test</svg>');

      expect(MemoryCache.get('mdi:home')).toBe('<svg>test</svg>');
      expect(DiskCache.set).toHaveBeenCalledWith('mdi:home', '<svg>test</svg>');
    });
  });

  describe('has', () => {
    it('should return true if in memory cache', () => {
      MemoryCache.set('mdi:home', '<svg>test</svg>');
      expect(CacheManager.has('mdi:home')).toBe(true);
    });

    it('should return true if in disk cache', () => {
      (DiskCache.has as jest.Mock).mockReturnValue(true);
      expect(CacheManager.has('mdi:settings')).toBe(true);
    });

    it('should return false if not in any cache', () => {
      (DiskCache.has as jest.Mock).mockReturnValue(false);
      expect(CacheManager.has('mdi:nonexistent')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove from both caches', () => {
      MemoryCache.set('mdi:home', '<svg>test</svg>');

      CacheManager.delete('mdi:home');

      expect(MemoryCache.has('mdi:home')).toBe(false);
      expect(DiskCache.delete).toHaveBeenCalledWith('mdi:home');
    });
  });

  describe('clear', () => {
    it('should clear both caches', () => {
      MemoryCache.set('mdi:home', '<svg>test</svg>');

      CacheManager.clear();

      expect(MemoryCache.size).toBe(0);
      expect(DiskCache.clear).toHaveBeenCalled();
    });
  });

  describe('clearMemory', () => {
    it('should only clear memory cache', () => {
      MemoryCache.set('mdi:home', '<svg>test</svg>');

      CacheManager.clearMemory();

      expect(MemoryCache.size).toBe(0);
      expect(DiskCache.clear).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return stats from both caches', () => {
      MemoryCache.set('mdi:home', '<svg>test</svg>');
      MemoryCache.set('mdi:settings', '<svg>test</svg>');
      (DiskCache.getStats as jest.Mock).mockReturnValue({
        iconCount: 5,
        sizeBytes: 1000,
      });

      const stats = CacheManager.getStats();

      expect(stats.memoryCount).toBe(2);
      expect(stats.diskCount).toBe(5);
      expect(stats.diskSizeBytes).toBe(1000);
    });
  });

  describe('prefetch', () => {
    it('should prefetch multiple icons', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce('<svg>home</svg>')
        .mockResolvedValueOnce('<svg>settings</svg>');

      const result = await CacheManager.prefetch(['mdi:home', 'mdi:settings'], mockFetch);

      expect(result.success).toEqual(['mdi:home', 'mdi:settings']);
      expect(result.failed).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should skip already cached icons', async () => {
      MemoryCache.set('mdi:home', '<svg>cached</svg>');
      const mockFetch = jest.fn().mockResolvedValue('<svg>new</svg>');

      await CacheManager.prefetch(['mdi:home', 'mdi:settings'], mockFetch);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('mdi:settings');
    });

    it('should handle failed fetches', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce('<svg>home</svg>')
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await CacheManager.prefetch(['mdi:home', 'mdi:settings'], mockFetch);

      expect(result.success).toEqual(['mdi:home']);
      expect(result.failed).toEqual(['mdi:settings']);
    });
  });
});
