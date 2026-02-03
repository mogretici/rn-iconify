/**
 * Metro configuration types
 * Minimal type definitions for Metro config integration
 */

import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Metro middleware function
 */
export type MetroMiddleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;

/**
 * Metro server configuration
 */
export interface MetroServerConfig {
  enhanceMiddleware?: (middleware: MetroMiddleware, server: unknown) => MetroMiddleware;
}

/**
 * Metro configuration object (partial, only what we need)
 */
export interface MetroConfig {
  server?: MetroServerConfig;
  [key: string]: unknown;
}

/**
 * rn-iconify Metro plugin options
 */
export interface RnIconifyMetroOptions {
  /**
   * Directory to store usage data
   * @default '.rn-iconify'
   */
  outputDir?: string;

  /**
   * Enable verbose logging
   * @default false
   */
  verbose?: boolean;
}

/**
 * Usage file structure
 */
export interface UsageFile {
  version: string;
  icons: string[];
  updatedAt: string;
}
