/**
 * Performance Monitoring Module
 * Track and analyze icon loading performance
 *
 * @example
 * ```tsx
 * import { enablePerformanceMonitoring, getPerformanceReport } from 'rn-iconify';
 *
 * // Enable monitoring
 * enablePerformanceMonitoring();
 *
 * // Later, get the report
 * const report = getPerformanceReport();
 * console.log(`Cache hit rate: ${report.cacheStats.hitRate * 100}%`);
 * console.log(`Avg load time: ${report.summary.avgLoadTime}ms`);
 * ```
 */

// Types
export type {
  IconLoadEvent,
  LoadEventType,
  CacheStatistics,
  PerformanceSummary,
  PerformanceReport,
  PerformanceListener,
} from './types';

// PerformanceMonitor
export {
  PerformanceMonitor,
  enablePerformanceMonitoring,
  disablePerformanceMonitoring,
  getPerformanceReport,
  printPerformanceReport,
} from './PerformanceMonitor';

// Default export
export { PerformanceMonitor as default } from './PerformanceMonitor';
