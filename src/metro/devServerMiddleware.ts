/**
 * Metro Dev Server Middleware
 * Handles runtime icon usage reporting from the app
 */

import * as fs from 'fs';
import * as path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import type { UsageFile, RnIconifyMetroOptions } from './types';

const USAGE_ENDPOINT = '/__rn_iconify_log';
const STATUS_ENDPOINT = '/__rn_iconify_status';

/**
 * Read the current usage file
 */
function readUsageFile(usagePath: string): UsageFile {
  try {
    if (fs.existsSync(usagePath)) {
      const content = fs.readFileSync(usagePath, 'utf-8');
      const data = JSON.parse(content) as UsageFile;
      if (data.version === '1.0.0' && Array.isArray(data.icons)) {
        return data;
      }
    }
  } catch {
    // File corrupted or doesn't exist
  }

  return { version: '1.0.0', icons: [], updatedAt: new Date().toISOString() };
}

/**
 * Write usage file atomically (temp file + rename)
 */
function writeUsageFile(usagePath: string, data: UsageFile): void {
  const dir = path.dirname(usagePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tmpPath = usagePath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, usagePath);
}

/**
 * Parse JSON body from request
 */
function parseBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body) as Record<string, unknown>);
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Create the dev server middleware handler
 */
export function createDevServerMiddleware(options: RnIconifyMetroOptions = {}) {
  const { outputDir = '.rn-iconify', verbose = false } = options;
  const projectRoot = process.cwd();
  const usagePath = path.isAbsolute(outputDir)
    ? path.join(outputDir, 'usage.json')
    : path.join(projectRoot, outputDir, 'usage.json');

  return async function handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ): Promise<void> {
    const url = req.url;

    // POST /__rn_iconify_log — report icon usage
    if (req.method === 'POST' && url === USAGE_ENDPOINT) {
      try {
        const body = await parseBody(req);
        const icon = body.icon;

        if (typeof icon !== 'string' || !icon.includes(':')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid icon name' }));
          return;
        }

        // Read existing usage
        const usage = readUsageFile(usagePath);

        // Deduplicate
        if (!usage.icons.includes(icon)) {
          usage.icons.push(icon);
          usage.updatedAt = new Date().toISOString();
          writeUsageFile(usagePath, usage);

          if (verbose) {
            console.log(`[rn-iconify:metro] Learned icon: ${icon} (total: ${usage.icons.length})`);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal error' }));
      }
      return;
    }

    // GET /__rn_iconify_status — debug stats
    if (req.method === 'GET' && url === STATUS_ENDPOINT) {
      const usage = readUsageFile(usagePath);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          iconCount: usage.icons.length,
          icons: usage.icons,
          updatedAt: usage.updatedAt,
        })
      );
      return;
    }

    // Pass through to next middleware
    next();
  };
}
