/**
 * Metro Dev Server Middleware
 * Handles runtime icon usage reporting from the app
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { RnIconifyMetroOptions } from './types';
import { readUsageFile, recordUsage, usageNames, usageFilePath, writeUsageFile } from './usageFile';

const USAGE_ENDPOINT = '/__rn_iconify_log';
const STATUS_ENDPOINT = '/__rn_iconify_status';

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
  const usagePath = usageFilePath(projectRoot, outputDir);

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

        // The timestamp is rewritten on every sighting, not only the first.
        // A name still being rendered has to look different from one whose
        // screen was deleted, and that is the only thing telling them apart.
        const now = new Date().toISOString();
        const usage = readUsageFile(usagePath, now);
        const isNew = recordUsage(usage, icon, now);

        writeUsageFile(usagePath, usage);

        if (verbose && isNew) {
          console.log(
            `[rn-iconify:metro] Learned icon: ${icon} (total: ${usageNames(usage).length})`
          );
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
      const usage = readUsageFile(usagePath, new Date().toISOString());
      const names = usageNames(usage);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          iconCount: names.length,
          icons: names,
          updatedAt: usage.updatedAt,
        })
      );
      return;
    }

    // Pass through to next middleware
    next();
  };
}
