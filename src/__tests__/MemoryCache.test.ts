/**
 * MemoryCache Unit Tests
 */

import { MemoryCache } from '../cache/MemoryCache';

describe('MemoryCache', () => {
  beforeEach(() => {
    MemoryCache.clear();
  });

  describe('get/set', () => {
    it('should store and retrieve icon SVG', () => {
      const iconName = 'mdi:home';
      const svg = '<svg>...</svg>';

      MemoryCache.set(iconName, svg);
      const result = MemoryCache.get(iconName);

      expect(result).toBe(svg);
    });

    it('should return null for non-existent icon', () => {
      const result = MemoryCache.get('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing icon', () => {
      MemoryCache.set('mdi:home', '<svg>...</svg>');
      expect(MemoryCache.has('mdi:home')).toBe(true);
    });

    it('should return false for non-existent icon', () => {
      expect(MemoryCache.has('non-existent')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove icon from cache', () => {
      MemoryCache.set('mdi:home', '<svg>...</svg>');
      expect(MemoryCache.has('mdi:home')).toBe(true);

      MemoryCache.delete('mdi:home');
      expect(MemoryCache.has('mdi:home')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all icons from cache', () => {
      MemoryCache.set('mdi:home', '<svg>...</svg>');
      MemoryCache.set('mdi:settings', '<svg>...</svg>');
      expect(MemoryCache.size).toBe(2);

      MemoryCache.clear();
      expect(MemoryCache.size).toBe(0);
    });
  });

  describe('size', () => {
    it('should return correct cache size', () => {
      expect(MemoryCache.size).toBe(0);

      MemoryCache.set('mdi:home', '<svg>...</svg>');
      expect(MemoryCache.size).toBe(1);

      MemoryCache.set('mdi:settings', '<svg>...</svg>');
      expect(MemoryCache.size).toBe(2);
    });
  });

  describe('keys', () => {
    it('should return all cached icon names', () => {
      MemoryCache.set('mdi:home', '<svg>...</svg>');
      MemoryCache.set('mdi:settings', '<svg>...</svg>');

      const keys = MemoryCache.keys();
      expect(keys).toContain('mdi:home');
      expect(keys).toContain('mdi:settings');
      expect(keys.length).toBe(2);
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entries when cache is full', () => {
      // MemoryCache has default maxSize of 500
      // Add more than maxSize entries
      for (let i = 0; i < 600; i++) {
        MemoryCache.set(`icon:${i}`, `<svg>${i}</svg>`);
      }

      // Cache should have evicted some entries
      expect(MemoryCache.size).toBeLessThanOrEqual(500);

      // Most recent entries should still be there
      expect(MemoryCache.has('icon:599')).toBe(true);
    });
  });
});
