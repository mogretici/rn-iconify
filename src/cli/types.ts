/**
 * CLI Types
 * Type definitions for CLI commands and configuration
 */

/**
 * Bundle command options
 */
export interface BundleOptions {
  /**
   * Source directory to analyze for icon usage
   * @default './src'
   */
  src?: string;

  /**
   * Output file path for the bundle
   * @default './assets/icons.bundle.json'
   */
  output?: string;

  /**
   * Auto-detect icons from source code
   * @default true
   */
  auto?: boolean;

  /**
   * Manual list of icons to include (comma-separated or array)
   * @example 'mdi:home,mdi:settings' or ['mdi:home', 'mdi:settings']
   */
  icons?: string | string[];

  /**
   * Icon patterns to exclude
   */
  exclude?: string[];

  /**
   * Verbose output
   * @default false
   */
  verbose?: boolean;

  /**
   * Pretty print JSON output
   * @default false
   */
  pretty?: boolean;
}

/**
 * Analyze command options
 */
export interface AnalyzeOptions {
  /**
   * Source directory to analyze
   * @default './src'
   */
  src?: string;

  /**
   * Output format
   * @default 'table'
   */
  format?: 'table' | 'json' | 'markdown';

  /**
   * Show detailed file locations
   * @default false
   */
  detailed?: boolean;

  /**
   * Verbose output
   * @default false
   */
  verbose?: boolean;
}

/**
 * Icon usage information from code analysis
 */
export interface IconUsage {
  /**
   * Full icon name (prefix:name)
   */
  icon: string;

  /**
   * Number of times used
   */
  count: number;

  /**
   * File locations where icon is used
   */
  locations: Array<{
    file: string;
    line: number;
    column: number;
  }>;
}

/**
 * Analysis result
 */
export interface AnalysisResult {
  /**
   * Total number of unique icons
   */
  totalIcons: number;

  /**
   * Total usage count
   */
  totalUsage: number;

  /**
   * Icons grouped by prefix (icon set)
   */
  byPrefix: Record<
    string,
    {
      count: number;
      icons: string[];
    }
  >;

  /**
   * Detailed usage for each icon
   */
  icons: IconUsage[];

  /**
   * Files analyzed
   */
  filesAnalyzed: number;

  /**
   * Analysis timestamp
   */
  timestamp: string;
}

/**
 * Bundle file structure
 */
export interface IconBundle {
  /**
   * Bundle version
   */
  version: string;

  /**
   * Generation timestamp
   */
  generatedAt: string;

  /**
   * Icons in the bundle
   */
  icons: Record<
    string,
    {
      svg: string;
      width: number;
      height: number;
    }
  >;

  /**
   * Total icon count
   */
  count: number;
}

/**
 * CLI exit codes
 */
export const EXIT_CODES = {
  SUCCESS: 0,
  ERROR: 1,
  INVALID_ARGS: 2,
  FILE_NOT_FOUND: 3,
  NETWORK_ERROR: 4,
} as const;
