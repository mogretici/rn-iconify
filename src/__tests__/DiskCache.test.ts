/**
 * DiskCache Unit Tests
 *
 * Tests the MMKV-backed disk cache with support for:
 * - MMKV v3 (MMKV constructor) and v4 (createMMKV function)
 * - Graceful failure when MMKV is unavailable
 * - Cache version migration
 * - Metadata batching and LRU eviction
 *
 * Because DiskCache creates storage at module load time (top-level singleton),
 * we use jest.isolateModules to get fresh module instances for each scenario.
 */

// Helper to create a mock MMKV storage backed by a Map
function createMockStorage() {
  const store = new Map<string, string | number | boolean>();
  return {
    store,
    instance: {
      getString: jest.fn((key: string) => {
        const val = store.get(key);
        return typeof val === 'string' ? val : undefined;
      }),
      set: jest.fn((key: string, value: string | number | boolean) => {
        store.set(key, value);
      }),
      getNumber: jest.fn((key: string) => {
        const val = store.get(key);
        return typeof val === 'number' ? val : undefined;
      }),
      contains: jest.fn((key: string) => store.has(key)),
      delete: jest.fn((key: string) => store.delete(key)),
      getAllKeys: jest.fn(() => Array.from(store.keys())),
      clearAll: jest.fn(() => store.clear()),
    },
  };
}

describe('DiskCache', () => {
  // ----------------------------------------------------------------
  // 1. MMKV v3 compatibility (default mock uses MMKV constructor)
  // ----------------------------------------------------------------
  describe('MMKV v3 compatibility', () => {
    let DiskCache: typeof import('../cache/DiskCache').DiskCache;
    let mockStorage: ReturnType<typeof createMockStorage>;

    beforeEach(() => {
      jest.useFakeTimers();
      mockStorage = createMockStorage();

      jest.isolateModules(() => {
        jest.doMock('react-native-mmkv', () => ({
          MMKV: jest.fn().mockImplementation(() => mockStorage.instance),
        }));

        DiskCache = require('../cache/DiskCache').DiskCache;
      });
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('should return cached SVG via get()', () => {
      DiskCache.set('mdi:home', '<svg>home</svg>');

      const result = DiskCache.get('mdi:home');

      expect(result).toBe('<svg>home</svg>');
    });

    it('should return null for missing key via get()', () => {
      const result = DiskCache.get('mdi:nonexistent');

      expect(result).toBeNull();
    });

    it('should store SVG and metadata via set()', () => {
      const beforeSet = Date.now();
      DiskCache.set('mdi:star', '<svg>star</svg>');

      // SVG stored
      expect(mockStorage.instance.set).toHaveBeenCalledWith('mdi:star', '<svg>star</svg>');

      // Metadata stored (access timestamp)
      const metaCalls = mockStorage.instance.set.mock.calls.filter(
        (call: unknown[]) => call[0] === '__meta:mdi:star'
      );
      expect(metaCalls.length).toBe(1);
      expect(metaCalls[0][1]).toBeGreaterThanOrEqual(beforeSet);
    });

    it('should check existence via has()', () => {
      expect(DiskCache.has('mdi:home')).toBe(false);

      DiskCache.set('mdi:home', '<svg>home</svg>');

      expect(DiskCache.has('mdi:home')).toBe(true);
    });

    it('should remove SVG and metadata via delete()', () => {
      DiskCache.set('mdi:home', '<svg>home</svg>');

      DiskCache.delete('mdi:home');

      expect(DiskCache.has('mdi:home')).toBe(false);
      // Should delete both the SVG key and the metadata key
      expect(mockStorage.instance.delete).toHaveBeenCalledWith('mdi:home');
      expect(mockStorage.instance.delete).toHaveBeenCalledWith('__meta:mdi:home');
    });

    it('should reset everything via clear()', () => {
      DiskCache.set('mdi:home', '<svg>home</svg>');
      DiskCache.set('mdi:star', '<svg>star</svg>');

      DiskCache.clear();

      expect(mockStorage.instance.clearAll).toHaveBeenCalled();
      // After clear, it should re-set the cache version
      const versionCalls = mockStorage.instance.set.mock.calls.filter(
        (call: unknown[]) => call[0] === '__cache_version'
      );
      expect(versionCalls.length).toBeGreaterThanOrEqual(1);
    });

    it('should exclude metadata and version keys from keys()', () => {
      DiskCache.set('mdi:home', '<svg>home</svg>');
      DiskCache.set('mdi:star', '<svg>star</svg>');

      const keys = DiskCache.keys();

      expect(keys).toContain('mdi:home');
      expect(keys).toContain('mdi:star');
      // Should not include metadata keys or cache version key
      expect(keys.every((k) => !k.startsWith('__meta:'))).toBe(true);
      expect(keys).not.toContain('__cache_version');
    });

    it('should return correct count and size from getStats()', () => {
      DiskCache.set('mdi:home', '<svg>home</svg>');
      DiskCache.set('mdi:star', '<svg>star</svg>');

      const stats = DiskCache.getStats();

      expect(stats.iconCount).toBe(2);
      // Size is value.length * 2 for UTF-16 approximation
      const expectedSize = '<svg>home</svg>'.length * 2 + '<svg>star</svg>'.length * 2;
      expect(stats.sizeBytes).toBe(expectedSize);
    });

    it('should return zero stats when cache is empty', () => {
      const stats = DiskCache.getStats();

      expect(stats.iconCount).toBe(0);
      expect(stats.sizeBytes).toBe(0);
    });
  });

  // ----------------------------------------------------------------
  // 2. MMKV v4 compatibility (uses createMMKV function)
  // ----------------------------------------------------------------
  describe('MMKV v4 compatibility', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should use createMMKV when available', () => {
      const mockStorage = createMockStorage();
      const createMMKV = jest.fn(() => mockStorage.instance);

      let DiskCache: typeof import('../cache/DiskCache').DiskCache;
      jest.isolateModules(() => {
        jest.doMock('react-native-mmkv', () => ({
          createMMKV,
        }));

        DiskCache = require('../cache/DiskCache').DiskCache;
      });

      // createMMKV should have been called with the storage ID
      expect(createMMKV).toHaveBeenCalledWith({ id: 'rn-iconify-cache' });

      // Verify it works - set and get
      DiskCache!.set('mdi:home', '<svg>home</svg>');
      expect(DiskCache!.get('mdi:home')).toBe('<svg>home</svg>');
    });

    it('should prefer createMMKV over MMKV constructor when both exist', () => {
      const v4Storage = createMockStorage();
      const v3Storage = createMockStorage();
      const createMMKV = jest.fn(() => v4Storage.instance);
      const MMKVConstructor = jest.fn(() => v3Storage.instance);

      jest.isolateModules(() => {
        jest.doMock('react-native-mmkv', () => ({
          createMMKV,
          MMKV: MMKVConstructor,
        }));

        require('../cache/DiskCache');
      });

      expect(createMMKV).toHaveBeenCalled();
      expect(MMKVConstructor).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------------
  // 3. MMKV unavailable (graceful error)
  // ----------------------------------------------------------------
  describe('MMKV unavailable', () => {
    it('should throw a meaningful error when neither v3 nor v4 is available', () => {
      expect(() => {
        jest.isolateModules(() => {
          jest.doMock('react-native-mmkv', () => ({}));
          require('../cache/DiskCache');
        });
      }).toThrow('Could not initialize MMKV storage');
    });

    it('should throw when MMKV export is not a function', () => {
      expect(() => {
        jest.isolateModules(() => {
          jest.doMock('react-native-mmkv', () => ({
            MMKV: 'not-a-function',
            createMMKV: 42,
          }));
          require('../cache/DiskCache');
        });
      }).toThrow('Could not initialize MMKV storage');
    });
  });

  // ----------------------------------------------------------------
  // 4. Eviction
  // ----------------------------------------------------------------
  describe('evictToSize', () => {
    let DiskCache: typeof import('../cache/DiskCache').DiskCache;
    let mockStorage: ReturnType<typeof createMockStorage>;

    beforeEach(() => {
      jest.useFakeTimers();
      mockStorage = createMockStorage();

      jest.isolateModules(() => {
        jest.doMock('react-native-mmkv', () => ({
          MMKV: jest.fn().mockImplementation(() => mockStorage.instance),
        }));

        DiskCache = require('../cache/DiskCache').DiskCache;
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should remove oldest entries first when over size limit', () => {
      // Each SVG is 10 chars = 20 bytes (UTF-16)
      // Set entries via DiskCache.set(), then override metadata timestamps
      // directly in the store to control eviction order
      DiskCache.set('iconA', '0123456789'); // 20 bytes
      DiskCache.set('iconB', '0123456789'); // 20 bytes
      DiskCache.set('iconC', '0123456789'); // 20 bytes

      // Override metadata timestamps directly (oldest first)
      mockStorage.store.set('__meta:iconA', 1000);
      mockStorage.store.set('__meta:iconB', 2000);
      mockStorage.store.set('__meta:iconC', 3000);

      // Total: 60 bytes. Evict to 30 bytes max.
      DiskCache.evictToSize(30);

      // Oldest entries (iconA, then iconB) should be evicted; iconC kept
      expect(DiskCache.has('iconC')).toBe(true);
      // At least one old entry should be gone
      const remaining = DiskCache.keys();
      expect(remaining.length).toBeLessThanOrEqual(2);
    });

    it('should not evict if already under size limit', () => {
      DiskCache.set('mdi:small', 'tiny');

      const deleteSpy = mockStorage.instance.delete;
      const callsBefore = deleteSpy.mock.calls.length;

      DiskCache.evictToSize(999999);

      // No additional deletes should occur
      expect(deleteSpy.mock.calls.length).toBe(callsBefore);
    });

    it('should stop evicting once under the size limit', () => {
      // 10 chars each = 20 bytes each, total 60 bytes
      DiskCache.set('iconA', '0123456789');
      DiskCache.set('iconB', '0123456789');
      DiskCache.set('iconC', '0123456789');

      // Override metadata timestamps directly (oldest first)
      mockStorage.store.set('__meta:iconA', 1000);
      mockStorage.store.set('__meta:iconB', 2000);
      mockStorage.store.set('__meta:iconC', 3000);

      // Evict to 40 bytes - only need to remove 1 entry (oldest = iconA)
      DiskCache.evictToSize(40);

      // iconA (oldest) should be removed, B and C remain
      expect(DiskCache.has('iconA')).toBe(false);
      expect(DiskCache.has('iconB')).toBe(true);
      expect(DiskCache.has('iconC')).toBe(true);
    });

    it('should handle entries with no metadata (timestamp defaults to 0)', () => {
      // Manually insert entries without metadata (simulating legacy data)
      mockStorage.store.set('legacy-icon', '<svg>old</svg>');
      DiskCache.set('new-icon', '<svg>new!</svg>');

      // The legacy icon has no __meta: key, so its timestamp will be 0
      // It should be evicted first
      DiskCache.evictToSize(1);

      expect(DiskCache.has('legacy-icon')).toBe(false);
    });
  });

  // ----------------------------------------------------------------
  // 5. Metadata sync (batched access times)
  // ----------------------------------------------------------------
  describe('metadata sync', () => {
    let DiskCache: typeof import('../cache/DiskCache').DiskCache;
    let mockStorage: ReturnType<typeof createMockStorage>;

    beforeEach(() => {
      jest.useFakeTimers();
      mockStorage = createMockStorage();

      jest.isolateModules(() => {
        jest.doMock('react-native-mmkv', () => ({
          MMKV: jest.fn().mockImplementation(() => mockStorage.instance),
        }));

        DiskCache = require('../cache/DiskCache').DiskCache;
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should not write metadata to disk on every get()', () => {
      DiskCache.set('mdi:home', '<svg>home</svg>');

      // Clear the set calls from the set() operation
      mockStorage.instance.set.mockClear();

      // Access the entry via get()
      DiskCache.get('mdi:home');

      // The metadata should NOT be written to disk immediately
      const metaWriteCalls = mockStorage.instance.set.mock.calls.filter(
        (call: unknown[]) =>
          typeof call[0] === 'string' && (call[0] as string).startsWith('__meta:')
      );
      expect(metaWriteCalls.length).toBe(0);
    });

    it('should batch metadata writes after 30 seconds', () => {
      DiskCache.set('mdi:home', '<svg>home</svg>');
      mockStorage.instance.set.mockClear();

      // Access entry to trigger deferred metadata sync
      DiskCache.get('mdi:home');

      // Advance time by 30 seconds
      jest.advanceTimersByTime(30000);

      // Now metadata should have been synced to disk
      const metaWriteCalls = mockStorage.instance.set.mock.calls.filter(
        (call: unknown[]) =>
          typeof call[0] === 'string' && (call[0] as string).startsWith('__meta:')
      );
      expect(metaWriteCalls.length).toBe(1);
      expect(metaWriteCalls[0][0]).toBe('__meta:mdi:home');
    });

    it('should only schedule one sync for multiple get() calls', () => {
      DiskCache.set('mdi:home', '<svg>home</svg>');
      DiskCache.set('mdi:star', '<svg>star</svg>');
      mockStorage.instance.set.mockClear();

      // Multiple get() calls before sync fires
      DiskCache.get('mdi:home');
      DiskCache.get('mdi:star');
      DiskCache.get('mdi:home'); // duplicate

      // Advance 30s
      jest.advanceTimersByTime(30000);

      // Both icons' metadata should be synced
      const metaWriteCalls = mockStorage.instance.set.mock.calls.filter(
        (call: unknown[]) =>
          typeof call[0] === 'string' && (call[0] as string).startsWith('__meta:')
      );
      expect(metaWriteCalls.length).toBe(2);
    });

    it('should cancel pending metadata sync on clear()', () => {
      DiskCache.set('mdi:home', '<svg>home</svg>');
      DiskCache.get('mdi:home'); // schedules sync

      // Clear before sync fires
      DiskCache.clear();
      mockStorage.instance.set.mockClear();

      // Advance past sync interval
      jest.advanceTimersByTime(30000);

      // No metadata writes should have occurred
      const metaWriteCalls = mockStorage.instance.set.mock.calls.filter(
        (call: unknown[]) =>
          typeof call[0] === 'string' && (call[0] as string).startsWith('__meta:')
      );
      expect(metaWriteCalls.length).toBe(0);
    });

    it('should not schedule sync when get() returns null', () => {
      mockStorage.instance.set.mockClear();

      DiskCache.get('mdi:nonexistent');

      jest.advanceTimersByTime(30000);

      const metaWriteCalls = mockStorage.instance.set.mock.calls.filter(
        (call: unknown[]) =>
          typeof call[0] === 'string' && (call[0] as string).startsWith('__meta:')
      );
      expect(metaWriteCalls.length).toBe(0);
    });
  });

  // ----------------------------------------------------------------
  // 6. Cache version migration
  // ----------------------------------------------------------------
  describe('cache version migration', () => {
    it('should clear cache and set version when no version key exists', () => {
      const mockStorage = createMockStorage();

      jest.isolateModules(() => {
        jest.doMock('react-native-mmkv', () => ({
          MMKV: jest.fn().mockImplementation(() => mockStorage.instance),
        }));

        require('../cache/DiskCache');
      });

      // Should have called clearAll (migration) and then set version
      expect(mockStorage.instance.clearAll).toHaveBeenCalled();
      expect(mockStorage.instance.set).toHaveBeenCalledWith('__cache_version', 1);
    });

    it('should not clear cache when version matches', () => {
      const mockStorage = createMockStorage();
      // Pre-set the correct version
      mockStorage.store.set('__cache_version', 1);

      jest.isolateModules(() => {
        jest.doMock('react-native-mmkv', () => ({
          MMKV: jest.fn().mockImplementation(() => mockStorage.instance),
        }));

        require('../cache/DiskCache');
      });

      // clearAll should NOT have been called
      expect(mockStorage.instance.clearAll).not.toHaveBeenCalled();
    });

    it('should clear cache when version is outdated', () => {
      const mockStorage = createMockStorage();
      // Set an old version
      mockStorage.store.set('__cache_version', 0);

      jest.isolateModules(() => {
        jest.doMock('react-native-mmkv', () => ({
          MMKV: jest.fn().mockImplementation(() => mockStorage.instance),
        }));

        require('../cache/DiskCache');
      });

      // Should clear due to version mismatch
      expect(mockStorage.instance.clearAll).toHaveBeenCalled();
      expect(mockStorage.instance.set).toHaveBeenCalledWith('__cache_version', 1);
    });
  });

  // ----------------------------------------------------------------
  // 7. Edge cases
  // ----------------------------------------------------------------
  describe('edge cases', () => {
    let DiskCache: typeof import('../cache/DiskCache').DiskCache;
    let mockStorage: ReturnType<typeof createMockStorage>;

    beforeEach(() => {
      jest.useFakeTimers();
      mockStorage = createMockStorage();

      jest.isolateModules(() => {
        jest.doMock('react-native-mmkv', () => ({
          MMKV: jest.fn().mockImplementation(() => mockStorage.instance),
        }));

        DiskCache = require('../cache/DiskCache').DiskCache;
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should handle keys() with only metadata and version entries', () => {
      // Only internal keys exist (version key was set in constructor)
      const keys = DiskCache.keys();
      expect(keys).toEqual([]);
    });

    it('should handle getStats() when getString returns undefined for some keys', () => {
      // Insert a key that will return undefined from getString
      mockStorage.store.set('broken-entry', 42); // not a string

      // The key will appear in getAllKeys but getString returns undefined
      const stats = DiskCache.getStats();

      // Should not crash, non-string entries contribute 0 bytes
      expect(stats).toBeDefined();
      expect(stats.sizeBytes).toBe(0);
    });

    it('should handle deleting a key that does not exist', () => {
      expect(() => {
        DiskCache.delete('nonexistent');
      }).not.toThrow();
    });

    it('should overwrite existing entry via set()', () => {
      DiskCache.set('mdi:home', '<svg>v1</svg>');
      DiskCache.set('mdi:home', '<svg>v2</svg>');

      expect(DiskCache.get('mdi:home')).toBe('<svg>v2</svg>');
    });
  });
});
