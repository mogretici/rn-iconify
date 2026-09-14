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
 * Where Metro resolved a module to (partial, only what we need)
 */
export type MetroResolution =
  | { type: 'sourceFile'; filePath: string }
  | { type: string; [key: string]: unknown };

/**
 * The context Metro hands a custom resolver; `resolveRequest` is its own
 */
export interface MetroResolutionContext {
  resolveRequest: MetroResolveRequest;
  [key: string]: unknown;
}

export type MetroResolveRequest = (
  context: MetroResolutionContext,
  moduleName: string,
  platform: string | null
) => MetroResolution;

/**
 * Metro resolver configuration
 */
export interface MetroResolverConfig {
  resolveRequest?: MetroResolveRequest;
  [key: string]: unknown;
}

/**
 * Metro configuration object (partial, only what we need)
 */
export interface MetroConfig {
  projectRoot?: string;
  resolver?: MetroResolverConfig;
  server?: MetroServerConfig;
  [key: string]: unknown;
}

/**
 * rn-iconify Metro plugin options
 */
export interface RnIconifyMetroOptions {
  /**
   * Directory holding the icon bundle and usage data — the Babel plugin's
   * `outputPath`, so the two must agree
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
