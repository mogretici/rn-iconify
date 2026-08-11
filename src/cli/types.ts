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
 * Doctor command options
 */
export interface DoctorOptions {
  /**
   * Project root to inspect
   * @default process.cwd()
   */
  src?: string;

  /**
   * Exit non-zero when any icon would be fetched at runtime.
   * Off by default so the number can be looked at before it is enforced.
   * @default false
   */
  strict?: boolean;

  /**
   * Output format
   * @default 'text'
   */
  format?: 'text' | 'json';

  /**
   * Verbose output
   * @default false
   */
  verbose?: boolean;
}

/**
 * What the project ships and what it will ask the network for.
 */
export interface DoctorResult {
  /** Icons the source itself proves, and which are therefore bundled. */
  bundled: string[];

  /**
   * Icons that reach the app only by being fetched at runtime.
   * Present in usage.json but not derivable from the source.
   */
  runtimeOnly: string[];

  /**
   * How many icons usage.json holds in total.
   *
   * Reported rather than judged: a name in there that the scan cannot find is
   * either still in use and unresolvable, or left over from a screen that is
   * gone. Nothing here can tell those apart.
   */
  learnedTotal: number;

  /** When usage.json was last written, if it exists. */
  learnedAt: string | null;
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
