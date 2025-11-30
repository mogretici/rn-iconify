/**
 * Icon Collector
 * Singleton that collects icons across all files during the build process
 */

import type { CollectedIcon, BabelPluginOptions } from './types';
import { shouldIncludeIcon, isValidIconName } from './ast-utils';

/**
 * Icon collection state
 * Uses a singleton pattern since Babel plugin runs in a single process
 */
class IconCollector {
  /**
   * Map of icon name -> collection info
   * Using Map to track first occurrence location
   */
  private icons: Map<string, CollectedIcon> = new Map();

  /**
   * Set of processed files to track progress
   */
  private processedFiles: Set<string> = new Set();

  /**
   * Options from plugin configuration
   */
  private options: BabelPluginOptions = {};

  /**
   * Whether bundle generation has been triggered
   */
  private bundleGenerated: boolean = false;

  /**
   * Start time for performance tracking
   */
  private startTime: number = 0;

  /**
   * Initialize the collector with options
   * Called at the start of each build
   */
  initialize(options: BabelPluginOptions): void {
    this.options = options;
    this.startTime = Date.now();

    if (options.verbose) {
      console.log('[rn-iconify] Babel plugin initialized');
    }
  }

  /**
   * Reset collector state
   * Should be called at the start of each build
   */
  reset(): void {
    this.icons.clear();
    this.processedFiles.clear();
    this.bundleGenerated = false;
    this.startTime = Date.now();
  }

  /**
   * Add an icon to the collection
   */
  add(iconName: string, file: string, line: number, column: number): boolean {
    // Validate icon name format
    if (!isValidIconName(iconName)) {
      if (this.options.verbose) {
        console.log(`[rn-iconify] Skipping invalid icon name: ${iconName}`);
      }
      return false;
    }

    // Check include/exclude patterns
    if (!shouldIncludeIcon(iconName, this.options.include, this.options.exclude)) {
      if (this.options.verbose) {
        console.log(`[rn-iconify] Excluded icon: ${iconName}`);
      }
      return false;
    }

    // Only track first occurrence
    if (!this.icons.has(iconName)) {
      this.icons.set(iconName, {
        name: iconName,
        file,
        line,
        column,
      });

      if (this.options.verbose) {
        console.log(`[rn-iconify] Found icon: ${iconName} in ${file}:${line}`);
      }

      return true;
    }

    return false;
  }

  /**
   * Mark a file as processed
   */
  markFileProcessed(filename: string): void {
    this.processedFiles.add(filename);
  }

  /**
   * Check if a file has been processed
   */
  isFileProcessed(filename: string): boolean {
    return this.processedFiles.has(filename);
  }

  /**
   * Check if there are any collected icons
   */
  hasIcons(): boolean {
    return this.icons.size > 0;
  }

  /**
   * Get all collected icon names
   */
  getIconNames(): string[] {
    return Array.from(this.icons.keys());
  }

  /**
   * Get all collected icons with their metadata
   */
  getAllIcons(): CollectedIcon[] {
    return Array.from(this.icons.values());
  }

  /**
   * Get icon count
   */
  getCount(): number {
    return this.icons.size;
  }

  /**
   * Get processed file count
   */
  getProcessedFileCount(): number {
    return this.processedFiles.size;
  }

  /**
   * Get icons grouped by prefix
   */
  getIconsByPrefix(): Map<string, string[]> {
    const byPrefix = new Map<string, string[]>();

    for (const iconName of this.icons.keys()) {
      const [prefix] = iconName.split(':');
      if (!byPrefix.has(prefix)) {
        byPrefix.set(prefix, []);
      }
      byPrefix.get(prefix)!.push(iconName);
    }

    return byPrefix;
  }

  /**
   * Mark bundle as generated
   */
  markBundleGenerated(): void {
    this.bundleGenerated = true;
  }

  /**
   * Check if bundle has been generated
   */
  isBundleGenerated(): boolean {
    return this.bundleGenerated;
  }

  /**
   * Get elapsed time since initialization
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get current options
   */
  getOptions(): BabelPluginOptions {
    return this.options;
  }

  /**
   * Print summary (for verbose mode)
   */
  printSummary(): void {
    if (!this.options.verbose) return;

    const byPrefix = this.getIconsByPrefix();
    const prefixSummary = Array.from(byPrefix.entries())
      .map(([prefix, icons]) => `${prefix}: ${icons.length}`)
      .join(', ');

    console.log(`[rn-iconify] Collection summary:`);
    console.log(`  Total icons: ${this.icons.size}`);
    console.log(`  Files processed: ${this.processedFiles.size}`);
    console.log(`  By prefix: ${prefixSummary}`);
    console.log(`  Time elapsed: ${this.getElapsedTime()}ms`);
  }
}

/**
 * Singleton instance
 */
export const collector = new IconCollector();

/**
 * Export class for testing
 */
export { IconCollector };
