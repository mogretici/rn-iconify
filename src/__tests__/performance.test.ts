/**
 * Tests for Performance Monitoring System
 */

import {
  PerformanceMonitor,
  enablePerformanceMonitoring,
  disablePerformanceMonitoring,
  getPerformanceReport,
  printPerformanceReport,
} from '../performance';
import { resetConfiguration } from '../config';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    PerformanceMonitor.reset();
    resetConfiguration();
  });

  afterEach(() => {
    PerformanceMonitor.disable();
  });

  describe('enable/disable', () => {
    it('enables monitoring', () => {
      expect(PerformanceMonitor.isEnabled()).toBe(false);
      PerformanceMonitor.enable();
      expect(PerformanceMonitor.isEnabled()).toBe(true);
    });

    it('disables monitoring', () => {
      PerformanceMonitor.enable();
      PerformanceMonitor.disable();
      expect(PerformanceMonitor.isEnabled()).toBe(false);
    });

    it('enablePerformanceMonitoring is alias', () => {
      enablePerformanceMonitoring();
      expect(PerformanceMonitor.isEnabled()).toBe(true);
    });

    it('disablePerformanceMonitoring is alias', () => {
      enablePerformanceMonitoring();
      disablePerformanceMonitoring();
      expect(PerformanceMonitor.isEnabled()).toBe(false);
    });
  });

  describe('recordEvent', () => {
    beforeEach(() => {
      PerformanceMonitor.enable();
    });

    it('records memory hit events', () => {
      PerformanceMonitor.recordEvent('mdi:home', 'memory_hit', 1);

      const stats = PerformanceMonitor.getCacheStats();
      expect(stats.memoryHits).toBe(1);
    });

    it('records bundled hit events', () => {
      PerformanceMonitor.recordEvent('mdi:home', 'bundled_hit', 2);

      const stats = PerformanceMonitor.getCacheStats();
      expect(stats.bundledHits).toBe(1);
    });

    it('records disk hit events', () => {
      PerformanceMonitor.recordEvent('mdi:home', 'disk_hit', 5);

      const stats = PerformanceMonitor.getCacheStats();
      expect(stats.diskHits).toBe(1);
    });

    it('records network fetch events', () => {
      PerformanceMonitor.recordEvent('mdi:home', 'network_fetch', 100);

      const stats = PerformanceMonitor.getCacheStats();
      expect(stats.networkFetches).toBe(1);
    });

    it('records error events', () => {
      PerformanceMonitor.recordEvent('mdi:home', 'error', 0, 'Network error');

      const stats = PerformanceMonitor.getCacheStats();
      expect(stats.errors).toBe(1);
    });

    it('does not record when disabled', () => {
      PerformanceMonitor.disable();
      PerformanceMonitor.recordEvent('mdi:home', 'memory_hit', 1);

      const stats = PerformanceMonitor.getCacheStats();
      expect(stats.memoryHits).toBe(0);
    });

    it('tracks per-icon statistics', () => {
      PerformanceMonitor.recordEvent('mdi:home', 'memory_hit', 1);
      PerformanceMonitor.recordEvent('mdi:home', 'memory_hit', 2);
      PerformanceMonitor.recordEvent('mdi:settings', 'memory_hit', 1);

      const report = PerformanceMonitor.getReport();
      expect(report.mostUsedIcons[0].iconName).toBe('mdi:home');
      expect(report.mostUsedIcons[0].count).toBe(2);
    });
  });

  describe('getCacheStats', () => {
    beforeEach(() => {
      PerformanceMonitor.enable();
    });

    it('calculates total requests', () => {
      PerformanceMonitor.recordEvent('icon1', 'memory_hit', 1);
      PerformanceMonitor.recordEvent('icon2', 'disk_hit', 5);
      PerformanceMonitor.recordEvent('icon3', 'network_fetch', 100);

      const stats = PerformanceMonitor.getCacheStats();
      expect(stats.totalRequests).toBe(3);
    });

    it('calculates hit rate', () => {
      PerformanceMonitor.recordEvent('icon1', 'memory_hit', 1);
      PerformanceMonitor.recordEvent('icon2', 'disk_hit', 5);
      PerformanceMonitor.recordEvent('icon3', 'network_fetch', 100);
      PerformanceMonitor.recordEvent('icon4', 'error', 0);

      const stats = PerformanceMonitor.getCacheStats();
      // 2 hits out of 4 total
      expect(stats.hitRate).toBe(0.5);
    });

    it('returns 0 hit rate when no requests', () => {
      const stats = PerformanceMonitor.getCacheStats();
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('getSummary', () => {
    beforeEach(() => {
      PerformanceMonitor.enable();
    });

    it('calculates average load time', () => {
      PerformanceMonitor.recordEvent('icon1', 'memory_hit', 10);
      PerformanceMonitor.recordEvent('icon2', 'disk_hit', 20);
      PerformanceMonitor.recordEvent('icon3', 'network_fetch', 30);

      const summary = PerformanceMonitor.getSummary();
      expect(summary.avgLoadTime).toBe(20);
    });

    it('calculates min/max load times', () => {
      PerformanceMonitor.recordEvent('icon1', 'memory_hit', 5);
      PerformanceMonitor.recordEvent('icon2', 'disk_hit', 15);
      PerformanceMonitor.recordEvent('icon3', 'network_fetch', 25);

      const summary = PerformanceMonitor.getSummary();
      expect(summary.minLoadTime).toBe(5);
      expect(summary.maxLoadTime).toBe(25);
    });

    it('calculates percentiles', () => {
      // Add 100 events with durations 1-100
      for (let i = 1; i <= 100; i++) {
        PerformanceMonitor.recordEvent(`icon${i}`, 'memory_hit', i);
      }

      const summary = PerformanceMonitor.getSummary();
      expect(summary.p50LoadTime).toBe(50);
      expect(summary.p90LoadTime).toBe(90);
      expect(summary.p99LoadTime).toBe(99);
    });

    it('counts total loads and errors', () => {
      PerformanceMonitor.recordEvent('icon1', 'memory_hit', 1);
      PerformanceMonitor.recordEvent('icon2', 'error', 0);
      PerformanceMonitor.recordEvent('icon3', 'disk_hit', 5);

      const summary = PerformanceMonitor.getSummary();
      expect(summary.totalLoads).toBe(2); // Excludes errors
      expect(summary.totalErrors).toBe(1);
    });

    it('tracks uptime', () => {
      const summary = PerformanceMonitor.getSummary();
      expect(summary.uptime).toBeGreaterThanOrEqual(0);
    });

    it('returns zeros when no events', () => {
      const summary = PerformanceMonitor.getSummary();
      expect(summary.avgLoadTime).toBe(0);
      expect(summary.minLoadTime).toBe(0);
      expect(summary.maxLoadTime).toBe(0);
      expect(summary.totalLoads).toBe(0);
    });
  });

  describe('getReport', () => {
    beforeEach(() => {
      PerformanceMonitor.enable();
    });

    it('returns full performance report', () => {
      PerformanceMonitor.recordEvent('mdi:home', 'memory_hit', 1);

      const report = PerformanceMonitor.getReport();
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('cacheStats');
      expect(report).toHaveProperty('loadTimesByType');
      expect(report).toHaveProperty('slowestIcons');
      expect(report).toHaveProperty('mostUsedIcons');
      expect(report).toHaveProperty('recentEvents');
      expect(report).toHaveProperty('generatedAt');
    });

    it('calculates load times by type', () => {
      PerformanceMonitor.recordEvent('icon1', 'memory_hit', 1);
      PerformanceMonitor.recordEvent('icon2', 'memory_hit', 3);
      PerformanceMonitor.recordEvent('icon3', 'disk_hit', 10);
      PerformanceMonitor.recordEvent('icon4', 'network_fetch', 100);

      const report = PerformanceMonitor.getReport();
      expect(report.loadTimesByType.memory).toBe(2); // Average of 1 and 3
      expect(report.loadTimesByType.disk).toBe(10);
      expect(report.loadTimesByType.network).toBe(100);
    });

    it('identifies slowest icons', () => {
      PerformanceMonitor.recordEvent('slow-icon', 'network_fetch', 500);
      PerformanceMonitor.recordEvent('fast-icon', 'memory_hit', 1);

      const report = PerformanceMonitor.getReport();
      expect(report.slowestIcons[0].iconName).toBe('slow-icon');
      expect(report.slowestIcons[0].avgDuration).toBe(500);
    });

    it('identifies most used icons', () => {
      for (let i = 0; i < 10; i++) {
        PerformanceMonitor.recordEvent('popular-icon', 'memory_hit', 1);
      }
      PerformanceMonitor.recordEvent('rare-icon', 'memory_hit', 1);

      const report = PerformanceMonitor.getReport();
      expect(report.mostUsedIcons[0].iconName).toBe('popular-icon');
      expect(report.mostUsedIcons[0].count).toBe(10);
    });

    it('getPerformanceReport is alias', () => {
      PerformanceMonitor.recordEvent('mdi:home', 'memory_hit', 1);

      const report = getPerformanceReport();
      expect(report.cacheStats.memoryHits).toBe(1);
    });
  });

  describe('subscribe', () => {
    beforeEach(() => {
      PerformanceMonitor.enable();
    });

    it('subscribes to events', () => {
      const events: any[] = [];
      const unsubscribe = PerformanceMonitor.subscribe((event) => {
        events.push(event);
      });

      PerformanceMonitor.recordEvent('mdi:home', 'memory_hit', 1);

      expect(events.length).toBe(1);
      expect(events[0].iconName).toBe('mdi:home');

      unsubscribe();
    });

    it('unsubscribe stops events', () => {
      const events: any[] = [];
      const unsubscribe = PerformanceMonitor.subscribe((event) => {
        events.push(event);
      });

      PerformanceMonitor.recordEvent('icon1', 'memory_hit', 1);
      unsubscribe();
      PerformanceMonitor.recordEvent('icon2', 'memory_hit', 1);

      expect(events.length).toBe(1);
    });

    it('multiple subscribers receive events', () => {
      const events1: any[] = [];
      const events2: any[] = [];

      const unsub1 = PerformanceMonitor.subscribe((e) => events1.push(e));
      const unsub2 = PerformanceMonitor.subscribe((e) => events2.push(e));

      PerformanceMonitor.recordEvent('mdi:home', 'memory_hit', 1);

      expect(events1.length).toBe(1);
      expect(events2.length).toBe(1);

      unsub1();
      unsub2();
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      PerformanceMonitor.enable();
    });

    it('clears all data', () => {
      PerformanceMonitor.recordEvent('mdi:home', 'memory_hit', 1);
      PerformanceMonitor.reset();

      const stats = PerformanceMonitor.getCacheStats();
      expect(stats.memoryHits).toBe(0);
      expect(stats.totalRequests).toBe(0);
    });

    it('clears events', () => {
      PerformanceMonitor.recordEvent('mdi:home', 'memory_hit', 1);
      PerformanceMonitor.reset();

      const events = PerformanceMonitor.getEvents();
      expect(events.length).toBe(0);
    });
  });

  describe('formatReport', () => {
    beforeEach(() => {
      PerformanceMonitor.enable();
    });

    it('returns formatted string', () => {
      PerformanceMonitor.recordEvent('mdi:home', 'memory_hit', 1);

      const formatted = PerformanceMonitor.formatReport();
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('rn-iconify Performance Report');
    });

    it('printPerformanceReport logs to console', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      printPerformanceReport();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getEvents', () => {
    beforeEach(() => {
      PerformanceMonitor.enable();
    });

    it('returns copy of events', () => {
      PerformanceMonitor.recordEvent('mdi:home', 'memory_hit', 1);

      const events1 = PerformanceMonitor.getEvents();
      const events2 = PerformanceMonitor.getEvents();

      expect(events1).not.toBe(events2);
      expect(events1).toEqual(events2);
    });

    it('includes event details', () => {
      PerformanceMonitor.recordEvent('mdi:home', 'memory_hit', 5);

      const events = PerformanceMonitor.getEvents();
      expect(events[0]).toHaveProperty('iconName', 'mdi:home');
      expect(events[0]).toHaveProperty('type', 'memory_hit');
      expect(events[0]).toHaveProperty('duration', 5);
      expect(events[0]).toHaveProperty('timestamp');
    });
  });
});
