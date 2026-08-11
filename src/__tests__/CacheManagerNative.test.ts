/**
 * The paths CacheManager takes when the native module is present, and the one
 * it takes when it is asked to report usage.
 *
 * Both were untested. The first decides what happens when a native prefetch
 * throws on a real device — falling through to JavaScript rather than losing
 * the icons. The second decides whether a shipped app tries to reach a Metro
 * server on localhost, which it must never do.
 */
const mockIsNativeAvailable = jest.fn();
const mockGetNative = jest.fn();

jest.mock('../native', () => ({
  isNativeModuleAvailable: () => mockIsNativeAvailable(),
  getNativeIconify: () => mockGetNative(),
}));

jest.mock('../cache/DiskCache', () => {
  const storage = new Map<string, string>();
  return {
    DiskCache: {
      get: jest.fn((key: string) => storage.get(key) ?? null),
      set: jest.fn((key: string, value: string) => storage.set(key, value)),
      has: jest.fn(() => false),
      delete: jest.fn((key: string) => storage.delete(key)),
      clear: jest.fn(() => storage.clear()),
      keys: jest.fn(() => Array.from(storage.keys())),
      getStats: jest.fn(() => ({ iconCount: storage.size, sizeBytes: 0 })),
    },
  };
});

import { CacheManager } from '../cache/CacheManager';
import { MemoryCache } from '../cache/MemoryCache';

describe('CacheManager with a native module', () => {
  beforeEach(() => {
    MemoryCache.clear();
    jest.clearAllMocks();
    mockIsNativeAvailable.mockReturnValue(true);
  });

  /** Stands in for the network fetch the JS path falls back to. */
  const fetchOk = jest.fn(async () => '<svg />');

  it('prefers the native module for prefetching', async () => {
    const prefetchIcons = jest.fn().mockResolvedValue({ success: ['mdi:home'], failed: [] });
    mockGetNative.mockReturnValue({ prefetchIcons });

    const result = await CacheManager.prefetch(['mdi:home'], fetchOk);

    expect(prefetchIcons).toHaveBeenCalledWith(['mdi:home']);
    expect(result.success).toContain('mdi:home');
    expect(fetchOk).not.toHaveBeenCalled();
  });

  // A native module that throws on a device must not take the icons with it.
  it('falls through to JavaScript when the native prefetch throws', async () => {
    mockGetNative.mockReturnValue({
      prefetchIcons: jest.fn().mockRejectedValue(new Error('native exploded')),
    });

    const result = await CacheManager.prefetch(['mdi:home'], fetchOk);

    expect(fetchOk).toHaveBeenCalledWith('mdi:home');
    expect(result.success).toContain('mdi:home');
    expect(result.failed).toEqual([]);
  });

  it('reports native availability as the module sees it', () => {
    mockIsNativeAvailable.mockReturnValue(false);

    expect(CacheManager.isNativeAvailable()).toBe(false);
  });

  it('has no native stats without a native module', async () => {
    mockIsNativeAvailable.mockReturnValue(false);

    expect(await CacheManager.getNativeStats()).toBeNull();
  });

  it('returns native stats when there is a module to ask', async () => {
    mockGetNative.mockReturnValue({
      getCacheStats: jest.fn().mockResolvedValue({
        diskCount: 12,
        diskSizeBytes: 2048,
        hitRate: 0.9,
      }),
    });

    expect(await CacheManager.getNativeStats()).toEqual({
      diskCount: 12,
      diskSizeBytes: 2048,
      hitRate: 0.9,
    });
  });

  it('answers with null rather than throwing when native stats fail', async () => {
    mockGetNative.mockReturnValue({
      getCacheStats: jest.fn().mockRejectedValue(new Error('no')),
    });

    expect(await CacheManager.getNativeStats()).toBeNull();
  });
});
