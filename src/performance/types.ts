/**
 * Performance monitoring types for rn-iconify
 */

/**
 * Icon load event type
 */
export type LoadEventType = 'memory_hit' | 'bundled_hit' | 'disk_hit' | 'network_fetch' | 'error';

/**
 * Single icon load event
 */
export interface IconLoadEvent {
  /**
   * Icon name (e.g., "mdi:home")
   */
  iconName: string;

  /**
   * Event type
   */
  type: LoadEventType;

  /**
   * Load time in milliseconds
   */
  duration: number;

  /**
   * Timestamp of the event
   */
  timestamp: number;

  /**
   * Error message if type is 'error'
   */
  error?: string;
}

/**
 * Cache statistics
 */
export interface CacheStatistics {
  /**
   * Number of memory cache hits
   */
  memoryHits: number;

  /**
   * Number of bundled icon hits
   */
  bundledHits: number;

  /**
   * Number of disk cache hits
   */
  diskHits: number;

  /**
   * Number of network fetches
   */
  networkFetches: number;

  /**
   * Number of errors
   */
  errors: number;

  /**
   * Total requests
   */
  totalRequests: number;

  /**
   * Cache hit rate (0-1)
   */
  hitRate: number;
}

/**
 * Performance summary
 */
export interface PerformanceSummary {
  /**
   * Average load time in milliseconds
   */
  avgLoadTime: number;

  /**
   * Minimum load time in milliseconds
   */
  minLoadTime: number;

  /**
   * Maximum load time in milliseconds
   */
  maxLoadTime: number;

  /**
   * 50th percentile (median) load time
   */
  p50LoadTime: number;

  /**
   * 90th percentile load time
   */
  p90LoadTime: number;

  /**
   * 99th percentile load time
   */
  p99LoadTime: number;

  /**
   * Total icons loaded
   */
  totalLoads: number;

  /**
   * Total errors
   */
  totalErrors: number;

  /**
   * Uptime since monitoring started (ms)
   */
  uptime: number;
}

/**
 * Complete performance report
 */
export interface PerformanceReport {
  /**
   * Performance summary
   */
  summary: PerformanceSummary;

  /**
   * Cache statistics
   */
  cacheStats: CacheStatistics;

  /**
   * Load time breakdown by type
   */
  loadTimesByType: {
    memory: number;
    bundled: number;
    disk: number;
    network: number;
  };

  /**
   * Top slowest icons
   */
  slowestIcons: Array<{
    iconName: string;
    avgDuration: number;
    count: number;
  }>;

  /**
   * Most frequently loaded icons
   */
  mostUsedIcons: Array<{
    iconName: string;
    count: number;
  }>;

  /**
   * Recent events
   */
  recentEvents: IconLoadEvent[];

  /**
   * Report timestamp
   */
  generatedAt: number;
}

/**
 * Performance listener callback
 */
export type PerformanceListener = (event: IconLoadEvent) => void;
