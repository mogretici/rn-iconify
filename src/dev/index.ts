/**
 * rn-iconify/dev
 * Development-only utilities for exploring and profiling icons.
 * These are separated from the main entry point to avoid bloating production bundles.
 *
 * @example
 * ```tsx
 * import { IconExplorer, PerformanceMonitor } from 'rn-iconify/dev';
 * ```
 */

// Icon Explorer
export {
  IconExplorer,
  ExplorerContext,
  useExplorerContext,
  useExplorer,
  getAllIconSets,
  getIconSetByPrefix,
  getIconSetsByCategory,
  searchIconSets,
  generateImportStatement,
  generateIconJSX,
  POPULAR_ICON_SETS,
  DEFAULT_PREVIEW_CONFIG,
  DEFAULT_EXPLORER_CONFIG,
} from '../explorer';
export type {
  IconSetInfo,
  SearchResult,
  PreviewConfig,
  ExplorerConfig,
  ResolvedExplorerConfig,
  ExplorerState,
  ExplorerActions,
  ExplorerContextValue,
  IconExplorerProps,
  IconGridProps,
  IconPreviewProps,
  SearchBarProps,
  IconSetFilterProps,
} from '../explorer';

// Performance Monitoring
export {
  PerformanceMonitor,
  enablePerformanceMonitoring,
  disablePerformanceMonitoring,
  getPerformanceReport,
  printPerformanceReport,
} from '../performance';
export type {
  IconLoadEvent,
  LoadEventType,
  CacheStatistics,
  PerformanceSummary,
  PerformanceReport,
  PerformanceListener,
} from '../performance';
