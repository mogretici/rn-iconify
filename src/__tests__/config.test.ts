/**
 * Tests for Configuration System
 */

import {
  ConfigManager,
  configure,
  resetConfiguration,
  getConfiguration,
  DEFAULT_CONFIG,
} from '../config';

describe('ConfigManager', () => {
  beforeEach(() => {
    resetConfiguration();
  });

  describe('DEFAULT_CONFIG', () => {
    it('has correct default API config', () => {
      expect(DEFAULT_CONFIG.api.apiUrl).toBe('https://api.iconify.design');
      expect(DEFAULT_CONFIG.api.timeout).toBe(30000);
      expect(DEFAULT_CONFIG.api.retries).toBe(2);
      expect(DEFAULT_CONFIG.api.retryDelay).toBe(1000);
      expect(DEFAULT_CONFIG.api.logging).toBe(false);
    });

    it('has correct default cache config', () => {
      expect(DEFAULT_CONFIG.cache.maxMemoryItems).toBe(500);
      expect(DEFAULT_CONFIG.cache.enableDiskCache).toBe(true);
      expect(DEFAULT_CONFIG.cache.diskCachePrefix).toBe('rn-iconify:');
    });

    it('has correct default performance config', () => {
      expect(DEFAULT_CONFIG.performance.enabled).toBe(false);
      expect(DEFAULT_CONFIG.performance.maxHistorySize).toBe(1000);
      expect(DEFAULT_CONFIG.performance.trackLoadTimes).toBe(true);
      expect(DEFAULT_CONFIG.performance.trackCacheStats).toBe(true);
    });
  });

  describe('configure()', () => {
    it('updates API configuration', () => {
      configure({
        api: {
          apiUrl: 'https://custom.api.com',
          timeout: 5000,
        },
      });

      const config = ConfigManager.getAPIConfig();
      expect(config.apiUrl).toBe('https://custom.api.com');
      expect(config.timeout).toBe(5000);
      expect(config.retries).toBe(2); // Unchanged
    });

    it('updates cache configuration', () => {
      configure({
        cache: {
          maxMemoryItems: 1000,
          enableDiskCache: false,
        },
      });

      const config = ConfigManager.getCacheConfig();
      expect(config.maxMemoryItems).toBe(1000);
      expect(config.enableDiskCache).toBe(false);
      expect(config.diskCachePrefix).toBe('rn-iconify:'); // Unchanged
    });

    it('updates performance configuration', () => {
      configure({
        performance: {
          enabled: true,
          maxHistorySize: 500,
        },
      });

      const config = ConfigManager.getPerformanceConfig();
      expect(config.enabled).toBe(true);
      expect(config.maxHistorySize).toBe(500);
    });

    it('allows partial updates', () => {
      configure({ api: { timeout: 20000 } });
      configure({ api: { retries: 5 } });

      const config = ConfigManager.getAPIConfig();
      expect(config.timeout).toBe(20000);
      expect(config.retries).toBe(5);
      expect(config.apiUrl).toBe('https://api.iconify.design');
    });
  });

  describe('getConfiguration()', () => {
    it('returns full configuration', () => {
      const config = getConfiguration();
      expect(config).toHaveProperty('api');
      expect(config).toHaveProperty('cache');
      expect(config).toHaveProperty('performance');
    });

    it('returns current config (reference)', () => {
      const config1 = getConfiguration();
      const config2 = getConfiguration();
      expect(config1).toBe(config2);
    });
  });

  describe('resetConfiguration()', () => {
    it('resets all configuration to defaults', () => {
      configure({
        api: { apiUrl: 'https://custom.api.com' },
        cache: { maxMemoryItems: 9999 },
        performance: { enabled: true },
      });

      resetConfiguration();

      const config = getConfiguration();
      expect(config.api.apiUrl).toBe('https://api.iconify.design');
      expect(config.cache.maxMemoryItems).toBe(500);
      expect(config.performance.enabled).toBe(false);
    });
  });

  describe('ConfigManager methods', () => {
    it('setConfig updates configuration', () => {
      ConfigManager.setConfig({
        api: { headers: { 'X-Custom': 'value' } },
      });

      const config = ConfigManager.getAPIConfig();
      expect(config.headers).toEqual({ 'X-Custom': 'value' });
    });

    it('getAPIConfig returns API settings', () => {
      const apiConfig = ConfigManager.getAPIConfig();
      expect(apiConfig).toHaveProperty('apiUrl');
      expect(apiConfig).toHaveProperty('timeout');
      expect(apiConfig).toHaveProperty('retries');
    });

    it('getCacheConfig returns cache settings', () => {
      const cacheConfig = ConfigManager.getCacheConfig();
      expect(cacheConfig).toHaveProperty('maxMemoryItems');
      expect(cacheConfig).toHaveProperty('enableDiskCache');
      expect(cacheConfig).toHaveProperty('diskCachePrefix');
    });

    it('getPerformanceConfig returns performance settings', () => {
      const perfConfig = ConfigManager.getPerformanceConfig();
      expect(perfConfig).toHaveProperty('enabled');
      expect(perfConfig).toHaveProperty('maxHistorySize');
    });

    it('isCustomServer returns false for default', () => {
      expect(ConfigManager.isCustomServer()).toBe(false);
    });

    it('isCustomServer returns true for custom URL', () => {
      configure({ api: { apiUrl: 'https://custom.com' } });
      expect(ConfigManager.isCustomServer()).toBe(true);
    });

    it('getAPIUrl returns current URL', () => {
      expect(ConfigManager.getAPIUrl()).toBe('https://api.iconify.design');
      configure({ api: { apiUrl: 'https://custom.com' } });
      expect(ConfigManager.getAPIUrl()).toBe('https://custom.com');
    });
  });

  describe('Custom API Server', () => {
    it('supports custom API URL', () => {
      configure({
        api: {
          apiUrl: 'https://my-iconify-server.com/api',
        },
      });

      expect(ConfigManager.getAPIConfig().apiUrl).toBe('https://my-iconify-server.com/api');
    });

    it('supports custom headers', () => {
      configure({
        api: {
          headers: {
            Authorization: 'Bearer token123',
            'X-API-Key': 'key456',
          },
        },
      });

      const headers = ConfigManager.getAPIConfig().headers;
      expect(headers).toEqual({
        Authorization: 'Bearer token123',
        'X-API-Key': 'key456',
      });
    });

    it('supports custom timeout and retries', () => {
      configure({
        api: {
          timeout: 60000,
          retries: 5,
          retryDelay: 2000,
        },
      });

      const config = ConfigManager.getAPIConfig();
      expect(config.timeout).toBe(60000);
      expect(config.retries).toBe(5);
      expect(config.retryDelay).toBe(2000);
    });
  });

  describe('onConfigChange', () => {
    it('subscribes to config changes', () => {
      const listener = jest.fn();
      const unsubscribe = ConfigManager.onConfigChange(listener);

      configure({ api: { timeout: 5000 } });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          api: expect.objectContaining({ timeout: 5000 }),
        })
      );

      unsubscribe();
    });

    it('unsubscribes correctly', () => {
      const listener = jest.fn();
      const unsubscribe = ConfigManager.onConfigChange(listener);

      unsubscribe();
      configure({ api: { timeout: 5000 } });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
