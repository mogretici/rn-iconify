/**
 * Usage reporting posts to a Metro dev server on localhost.
 *
 * Kept in its own file on purpose: CacheManager is a singleton that schedules
 * a batch timer the first time anything is cached, and a test that has already
 * started one cannot then observe a new one being started. Jest gives each
 * file its own module registry, which is the cheapest way to be sure this one
 * begins with nothing pending.
 */
jest.mock('../cache/DiskCache', () => ({
  DiskCache: {
    get: jest.fn(() => null),
    set: jest.fn(),
    has: jest.fn(() => false),
    delete: jest.fn(),
    clear: jest.fn(),
    keys: jest.fn(() => []),
    getStats: jest.fn(() => ({ iconCount: 0, sizeBytes: 0 })),
  },
}));

import { CacheManager } from '../cache/CacheManager';

describe('CacheManager usage reporting', () => {
  const realDev = (global as { __DEV__?: boolean }).__DEV__;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.useRealTimers();
    (global as { __DEV__?: boolean }).__DEV__ = realDev;
  });

  /**
   * This posts to a Metro dev server on localhost. A shipped app doing that
   * would be reaching for a machine that is not there, on every icon, from
   * every install.
   */
  it('never reaches for localhost outside development', () => {
    (global as { __DEV__?: boolean }).__DEV__ = false;

    CacheManager.reportIconUsage('mdi:home');
    jest.runAllTimers();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('reports in development, once the batch window closes', () => {
    (global as { __DEV__?: boolean }).__DEV__ = true;

    CacheManager.reportIconUsage('mdi:reported-icon');
    expect(global.fetch).not.toHaveBeenCalled();

    jest.runAllTimers();

    expect(global.fetch).toHaveBeenCalled();
    const body = String((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body).toContain('mdi:reported-icon');
  });

  // A screen rendering thirty icons should not open thirty connections.
  it('batches a burst into one window', () => {
    (global as { __DEV__?: boolean }).__DEV__ = true;

    CacheManager.reportIconUsage('mdi:a');
    CacheManager.reportIconUsage('mdi:b');
    CacheManager.reportIconUsage('mdi:c');
    jest.runAllTimers();

    expect(global.fetch).toHaveBeenCalledTimes(3);
    const urls = (global.fetch as jest.Mock).mock.calls.map((call) => String(call[0]));
    expect(new Set(urls).size).toBe(1);
  });

  it('says nothing when a dev server is not listening', () => {
    (global as { __DEV__?: boolean }).__DEV__ = true;
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('ECONNREFUSED')) as unknown as typeof fetch;

    expect(() => {
      CacheManager.reportIconUsage('mdi:home');
      jest.runAllTimers();
    }).not.toThrow();
  });
});
