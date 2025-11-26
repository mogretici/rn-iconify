/**
 * Iconify API Client
 * Handles fetching icon data from Iconify API
 */

import type { IconifyAPIResponse, IconifyIconData } from '../types';

const ICONIFY_API_BASE = 'https://api.iconify.design';
const DEFAULT_TIMEOUT_MS = 30000; // 30 second timeout
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * Request deduplication map
 * Prevents multiple simultaneous requests for the same icon
 */
const pendingRequests = new Map<string, Promise<string>>();

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Merge abort signals if one is provided
  const signal = options.signal
    ? anySignal([options.signal, controller.signal])
    : controller.signal;

  try {
    const response = await fetch(url, { ...options, signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Combine multiple AbortSignals into one
 */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      return controller.signal;
    }

    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  return controller.signal;
}

/**
 * Validate SVG content
 */
function isValidSvg(content: string): boolean {
  return content.trim().startsWith('<svg') && content.includes('</svg>');
}

/**
 * Validate that a string contains only safe characters for URL path/query
 * Allows: a-z, 0-9, hyphen, underscore
 */
const SAFE_NAME_PATTERN = /^[a-z0-9\-_]+$/i;

/**
 * Parse icon name into prefix and name parts
 * @example "mdi:home" -> { prefix: "mdi", name: "home" }
 */
export function parseIconName(iconName: string): { prefix: string; name: string } | null {
  const parts = iconName.split(':');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  const [prefix, name] = parts;

  // Validate prefix and name contain only safe characters
  if (!SAFE_NAME_PATTERN.test(prefix) || !SAFE_NAME_PATTERN.test(name)) {
    return null;
  }

  return { prefix, name };
}

/**
 * Build SVG string from Iconify icon data
 */
function buildSvg(data: IconifyIconData, defaultWidth = 24, defaultHeight = 24): string {
  const width = data.width ?? defaultWidth;
  const height = data.height ?? defaultHeight;
  const left = data.left ?? 0;
  const top = data.top ?? 0;
  const viewBox = `${left} ${top} ${width} ${height}`;

  // Apply transformations
  let transform = '';
  const transforms: string[] = [];

  if (data.rotate) {
    const rotation = data.rotate * 90;
    transforms.push(`rotate(${rotation} ${width / 2} ${height / 2})`);
  }

  if (data.hFlip || data.vFlip) {
    const scaleX = data.hFlip ? -1 : 1;
    const scaleY = data.vFlip ? -1 : 1;
    const translateX = data.hFlip ? width : 0;
    const translateY = data.vFlip ? height : 0;
    transforms.push(`translate(${translateX} ${translateY}) scale(${scaleX} ${scaleY})`);
  }

  if (transforms.length > 0) {
    transform = ` transform="${transforms.join(' ')}"`;
  }

  const body = transform ? `<g${transform}>${data.body}</g>` : data.body;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">${body}</svg>`;
}

/**
 * Fetch single icon from Iconify API with retry support
 * @param iconName Full icon name (e.g., "mdi:home")
 * @param signal Optional AbortSignal for cancellation
 * @returns SVG string
 */
export async function fetchIcon(iconName: string, signal?: AbortSignal): Promise<string> {
  // Check for pending request (deduplication)
  const pending = pendingRequests.get(iconName);
  if (pending) {
    return pending;
  }

  // Parse icon name
  const parsed = parseIconName(iconName);
  if (!parsed) {
    throw new Error(`Invalid icon name format: "${iconName}". Expected "prefix:name" format.`);
  }

  const { prefix, name } = parsed;

  // Create and store the request promise
  const requestPromise = (async () => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Check if already aborted
        if (signal?.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }

        const url = `${ICONIFY_API_BASE}/${prefix}.json?icons=${name}`;
        const response = await fetchWithTimeout(url, { signal });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch icon "${iconName}"`);
        }

        const data: IconifyAPIResponse = await response.json();

        // Validate response structure
        if (!data || typeof data !== 'object' || !data.icons) {
          throw new Error(`Invalid API response for icon "${iconName}"`);
        }

        // Check if icon exists in response
        const iconData = data.icons[name];
        if (!iconData) {
          throw new Error(`Icon "${iconName}" not found in Iconify API response`);
        }

        // Build SVG from icon data
        const svg = buildSvg(iconData, data.width, data.height);

        // Validate SVG output
        if (!isValidSvg(svg)) {
          throw new Error(`Invalid SVG generated for icon "${iconName}"`);
        }

        return svg;
      } catch (error) {
        // Don't retry on abort or non-retryable errors
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw error;
          }
          // Don't retry on 4xx errors (client errors)
          if (error.message.includes('HTTP 4')) {
            throw error;
          }
        }

        lastError = error instanceof Error ? error : new Error(String(error));

        // Wait before retrying (except on last attempt)
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
        }
      }
    }

    // All retries exhausted
    throw (
      lastError ?? new Error(`Failed to fetch icon "${iconName}" after ${MAX_RETRIES + 1} attempts`)
    );
  })();

  pendingRequests.set(iconName, requestPromise);

  try {
    return await requestPromise;
  } finally {
    // Clean up pending request
    pendingRequests.delete(iconName);
  }
}

/**
 * Result type for batch fetch operations
 */
export interface BatchFetchResult {
  success: Map<string, string>;
  failed: Array<{ iconName: string; error: string }>;
}

/**
 * Fetch multiple icons in a single request (batch) with partial failure handling
 * @param iconNames Array of icon names with the same prefix
 * @param signal Optional AbortSignal for cancellation
 * @returns Object containing successful fetches and failures
 */
export async function fetchIconsBatch(
  iconNames: string[],
  signal?: AbortSignal
): Promise<BatchFetchResult> {
  const success = new Map<string, string>();
  const failed: Array<{ iconName: string; error: string }> = [];

  // Group icons by prefix
  const byPrefix = new Map<string, string[]>();
  for (const iconName of iconNames) {
    const parsed = parseIconName(iconName);
    if (!parsed) {
      failed.push({ iconName, error: 'Invalid icon name format' });
      continue;
    }

    const names = byPrefix.get(parsed.prefix) ?? [];
    names.push(parsed.name);
    byPrefix.set(parsed.prefix, names);
  }

  // Fetch each prefix group with error handling per group
  const fetchPromises = Array.from(byPrefix.entries()).map(async ([prefix, names]) => {
    try {
      // Check if aborted
      if (signal?.aborted) {
        names.forEach((name) => failed.push({ iconName: `${prefix}:${name}`, error: 'Aborted' }));
        return;
      }

      // Sort icon names alphabetically for consistent caching (Iconify best practice)
      const sortedNames = [...names].sort();
      const url = `${ICONIFY_API_BASE}/${prefix}.json?icons=${sortedNames.join(',')}`;
      const response = await fetchWithTimeout(url, { signal });

      if (!response.ok) {
        // Mark all icons in this prefix as failed
        names.forEach((name) =>
          failed.push({ iconName: `${prefix}:${name}`, error: `HTTP ${response.status}` })
        );
        return;
      }

      const data: IconifyAPIResponse = await response.json();

      // Validate response structure
      if (!data || typeof data !== 'object' || !data.icons) {
        names.forEach((name) =>
          failed.push({ iconName: `${prefix}:${name}`, error: 'Invalid API response' })
        );
        return;
      }

      // Build SVGs for each icon
      for (const name of names) {
        const iconData = data.icons[name];
        if (iconData) {
          const svg = buildSvg(iconData, data.width, data.height);
          if (isValidSvg(svg)) {
            success.set(`${prefix}:${name}`, svg);
          } else {
            failed.push({ iconName: `${prefix}:${name}`, error: 'Invalid SVG generated' });
          }
        } else {
          failed.push({ iconName: `${prefix}:${name}`, error: 'Icon not found in response' });
        }
      }
    } catch (error) {
      // Handle errors for this prefix group without failing the entire batch
      const errorMessage = error instanceof Error ? error.message : String(error);
      names.forEach((name) => failed.push({ iconName: `${prefix}:${name}`, error: errorMessage }));
    }
  });

  await Promise.all(fetchPromises);
  return { success, failed };
}

/**
 * Check if Iconify API is reachable
 */
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${ICONIFY_API_BASE}/collections`, {
      method: 'HEAD',
    });
    return response.ok;
  } catch {
    return false;
  }
}
