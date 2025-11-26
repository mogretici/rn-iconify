/**
 * Iconify API Client
 * Handles fetching icon data from Iconify API
 */

import type { IconifyAPIResponse, IconifyIconData } from '../types';

const ICONIFY_API_BASE = 'https://api.iconify.design';

/**
 * Request deduplication map
 * Prevents multiple simultaneous requests for the same icon
 */
const pendingRequests = new Map<string, Promise<string>>();

/**
 * Parse icon name into prefix and name parts
 * @example "mdi:home" -> { prefix: "mdi", name: "home" }
 */
export function parseIconName(iconName: string): { prefix: string; name: string } | null {
  const parts = iconName.split(':');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }
  return { prefix: parts[0], name: parts[1] };
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
 * Fetch single icon from Iconify API
 * @param iconName Full icon name (e.g., "mdi:home")
 * @returns SVG string
 */
export async function fetchIcon(iconName: string): Promise<string> {
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
    try {
      const url = `${ICONIFY_API_BASE}/${prefix}.json?icons=${name}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch icon "${iconName}"`);
      }

      const data: IconifyAPIResponse = await response.json();

      // Check if icon exists in response
      const iconData = data.icons[name];
      if (!iconData) {
        throw new Error(`Icon "${iconName}" not found in Iconify API response`);
      }

      // Build SVG from icon data
      const svg = buildSvg(iconData, data.width, data.height);

      return svg;
    } finally {
      // Clean up pending request
      pendingRequests.delete(iconName);
    }
  })();

  pendingRequests.set(iconName, requestPromise);
  return requestPromise;
}

/**
 * Fetch multiple icons in a single request (batch)
 * @param iconNames Array of icon names with the same prefix
 * @returns Map of icon name to SVG string
 */
export async function fetchIconsBatch(iconNames: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  // Group icons by prefix
  const byPrefix = new Map<string, string[]>();
  for (const iconName of iconNames) {
    const parsed = parseIconName(iconName);
    if (!parsed) continue;

    const names = byPrefix.get(parsed.prefix) ?? [];
    names.push(parsed.name);
    byPrefix.set(parsed.prefix, names);
  }

  // Fetch each prefix group
  const fetchPromises = Array.from(byPrefix.entries()).map(async ([prefix, names]) => {
    const url = `${ICONIFY_API_BASE}/${prefix}.json?icons=${names.join(',')}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch icons for prefix "${prefix}"`);
    }

    const data: IconifyAPIResponse = await response.json();

    // Build SVGs for each icon
    for (const name of names) {
      const iconData = data.icons[name];
      if (iconData) {
        const svg = buildSvg(iconData, data.width, data.height);
        result.set(`${prefix}:${name}`, svg);
      }
    }
  });

  await Promise.all(fetchPromises);
  return result;
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
