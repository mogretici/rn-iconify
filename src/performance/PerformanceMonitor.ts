/**
 * PerformanceMonitor - Tracks icon loading performance
 * Provides metrics, statistics, and insights for optimization
 */

import { ConfigManager } from '../config';
import type {
  IconLoadEvent,
  LoadEventType,
  CacheStatistics,
  PerformanceSummary,
  PerformanceReport,
  PerformanceListener,
} from './types';

/**
 * Performance monitoring state
 */
let isEnabled = false;
let startTime = Date.now();
const events: IconLoadEvent[] = [];
const listeners: PerformanceListener[] = [];
const iconLoadCounts = new Map<string, number>();
const iconLoadTimes = new Map<string, number[]>();

/**
 * Counter statistics
 */
let stats = {
  memoryHits: 0,
  bundledHits: 0,
  diskHits: 0,
  networkFetches: 0,
  errors: 0,
};

/**
 * Get max history size from config
 */
function getMaxHistorySize(): number {
  return ConfigManager.getPerformanceConfig().maxHistorySize;
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, index)];
}

/**
 * Performance Monitor API
 */
export const PerformanceMonitor = {
  /**
   * Enable performance monitoring
   */
  enable(): void {
    isEnabled = true;
    startTime = Date.now();
    ConfigManager.setConfig({ performance: { enabled: true } });
  },

  /**
   * Disable performance monitoring
   */
  disable(): void {
    isEnabled = false;
    ConfigManager.setConfig({ performance: { enabled: false } });
  },

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return isEnabled || ConfigManager.getPerformanceConfig().enabled;
  },

  /**
   * Record an icon load event
   */
  recordEvent(iconName: string, type: LoadEventType, duration: number, error?: string): void {
    if (!PerformanceMonitor.isEnabled()) return;

    const event: IconLoadEvent = {
      iconName,
      type,
      duration,
      timestamp: Date.now(),
      error,
    };

    // Update statistics
    switch (type) {
      case 'memory_hit':
        stats.memoryHits++;
        break;
      case 'bundled_hit':
        stats.bundledHits++;
        break;
      case 'disk_hit':
        stats.diskHits++;
        break;
      case 'network_fetch':
        stats.networkFetches++;
        break;
      case 'error':
        stats.errors++;
        break;
    }

    // Track per-icon stats
    const count = (iconLoadCounts.get(iconName) ?? 0) + 1;
    iconLoadCounts.set(iconName, count);

    const times = iconLoadTimes.get(iconName) ?? [];
    times.push(duration);
    iconLoadTimes.set(iconName, times);

    // Add to events history
    events.push(event);

    // Trim history if needed
    const maxSize = getMaxHistorySize();
    while (events.length > maxSize) {
      events.shift();
    }

    // Notify listeners
    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        // Ignore listener errors
      }
    });
  },

  /**
   * Subscribe to performance events
   * Returns unsubscribe function
   */
  subscribe(listener: PerformanceListener): () => void {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  },

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStatistics {
    const totalRequests =
      stats.memoryHits + stats.bundledHits + stats.diskHits + stats.networkFetches + stats.errors;
    const hits = stats.memoryHits + stats.bundledHits + stats.diskHits;

    return {
      memoryHits: stats.memoryHits,
      bundledHits: stats.bundledHits,
      diskHits: stats.diskHits,
      networkFetches: stats.networkFetches,
      errors: stats.errors,
      totalRequests,
      hitRate: totalRequests > 0 ? hits / totalRequests : 0,
    };
  },

  /**
   * Get performance summary
   */
  getSummary(): PerformanceSummary {
    const durations = events
      .filter((e) => e.type !== 'error')
      .map((e) => e.duration)
      .sort((a, b) => a - b);

    const totalLoads = durations.length;
    const totalErrors = events.filter((e) => e.type === 'error').length;

    if (totalLoads === 0) {
      return {
        avgLoadTime: 0,
        minLoadTime: 0,
        maxLoadTime: 0,
        p50LoadTime: 0,
        p90LoadTime: 0,
        p99LoadTime: 0,
        totalLoads: 0,
        totalErrors,
        uptime: Date.now() - startTime,
      };
    }

    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      avgLoadTime: sum / totalLoads,
      minLoadTime: durations[0],
      maxLoadTime: durations[durations.length - 1],
      p50LoadTime: percentile(durations, 50),
      p90LoadTime: percentile(durations, 90),
      p99LoadTime: percentile(durations, 99),
      totalLoads,
      totalErrors,
      uptime: Date.now() - startTime,
    };
  },

  /**
   * Get full performance report
   */
  getReport(): PerformanceReport {
    const summary = PerformanceMonitor.getSummary();
    const cacheStats = PerformanceMonitor.getCacheStats();

    // Calculate avg load times by type
    const byType = {
      memory: [] as number[],
      bundled: [] as number[],
      disk: [] as number[],
      network: [] as number[],
    };

    events.forEach((e) => {
      if (e.type === 'memory_hit') byType.memory.push(e.duration);
      else if (e.type === 'bundled_hit') byType.bundled.push(e.duration);
      else if (e.type === 'disk_hit') byType.disk.push(e.duration);
      else if (e.type === 'network_fetch') byType.network.push(e.duration);
    });

    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    // Get slowest icons
    const slowestIcons = Array.from(iconLoadTimes.entries())
      .map(([iconName, times]) => ({
        iconName,
        avgDuration: avg(times),
        count: times.length,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    // Get most used icons
    const mostUsedIcons = Array.from(iconLoadCounts.entries())
      .map(([iconName, count]) => ({ iconName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      summary,
      cacheStats,
      loadTimesByType: {
        memory: avg(byType.memory),
        bundled: avg(byType.bundled),
        disk: avg(byType.disk),
        network: avg(byType.network),
      },
      slowestIcons,
      mostUsedIcons,
      recentEvents: events.slice(-100),
      generatedAt: Date.now(),
    };
  },

  /**
   * Reset all performance data
   */
  reset(): void {
    events.length = 0;
    iconLoadCounts.clear();
    iconLoadTimes.clear();
    stats = {
      memoryHits: 0,
      bundledHits: 0,
      diskHits: 0,
      networkFetches: 0,
      errors: 0,
    };
    startTime = Date.now();
  },

  /**
   * Get raw events (for debugging)
   */
  getEvents(): IconLoadEvent[] {
    return [...events];
  },

  /**
   * Format report as string (for console output)
   */
  formatReport(): string {
    const report = PerformanceMonitor.getReport();
    const { summary, cacheStats, loadTimesByType } = report;

    const lines = [
      '┌─────────────────────────────────────────────────────┐',
      '│ rn-iconify Performance Report                       │',
      '├─────────────────────────────────────────────────────┤',
      `│ Total Loads: ${summary.totalLoads.toString().padEnd(10)} │ Errors: ${summary.totalErrors.toString().padEnd(8)} │`,
      `│ Cache Hit Rate: ${(cacheStats.hitRate * 100).toFixed(1)}%                              │`,
      '├─────────────────────────────────────────────────────┤',
      '│ Load Times                                          │',
      `│   Average: ${summary.avgLoadTime.toFixed(2)}ms                                │`,
      `│   Min: ${summary.minLoadTime.toFixed(2)}ms │ Max: ${summary.maxLoadTime.toFixed(2)}ms              │`,
      `│   P50: ${summary.p50LoadTime.toFixed(2)}ms │ P90: ${summary.p90LoadTime.toFixed(2)}ms │ P99: ${summary.p99LoadTime.toFixed(2)}ms │`,
      '├─────────────────────────────────────────────────────┤',
      '│ By Source                                           │',
      `│   Memory: ${loadTimesByType.memory.toFixed(2)}ms (${cacheStats.memoryHits} hits)               │`,
      `│   Bundled: ${loadTimesByType.bundled.toFixed(2)}ms (${cacheStats.bundledHits} hits)             │`,
      `│   Disk: ${loadTimesByType.disk.toFixed(2)}ms (${cacheStats.diskHits} hits)                   │`,
      `│   Network: ${loadTimesByType.network.toFixed(2)}ms (${cacheStats.networkFetches} fetches)         │`,
      '└─────────────────────────────────────────────────────┘',
    ];

    if (report.slowestIcons.length > 0) {
      lines.push('');
      lines.push('🐌 Slowest Icons:');
      report.slowestIcons.slice(0, 5).forEach((icon, i) => {
        lines.push(
          `   ${i + 1}. ${icon.iconName} (${icon.avgDuration.toFixed(2)}ms avg, ${icon.count}x)`
        );
      });
    }

    return lines.join('\n');
  },
};

/**
 * Enable performance monitoring
 * Alias for PerformanceMonitor.enable()
 */
export function enablePerformanceMonitoring(): void {
  PerformanceMonitor.enable();
}

/**
 * Disable performance monitoring
 * Alias for PerformanceMonitor.disable()
 */
export function disablePerformanceMonitoring(): void {
  PerformanceMonitor.disable();
}

/**
 * Get performance report
 * Alias for PerformanceMonitor.getReport()
 */
export function getPerformanceReport(): PerformanceReport {
  return PerformanceMonitor.getReport();
}

/**
 * Print formatted performance report to console
 */
export function printPerformanceReport(): void {
  console.log(PerformanceMonitor.formatReport());
}

export default PerformanceMonitor;
