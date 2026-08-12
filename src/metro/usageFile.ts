/**
 * The file the development server writes as it learns which icons an app
 * renders, and the one place its shape is defined.
 *
 * Every icon the scan cannot prove is fetched at runtime, and the middleware
 * records it here so the next build ships it. That makes the file the reason
 * those icons work — and, left alone, the reason nobody notices they were
 * never found in the source.
 *
 * Version 1 was a list of names. A name went in once and stayed: nothing
 * updated it, nothing removed it, and the only timestamp was on the file. So a
 * screen could be deleted and its icons would keep shipping, indistinguishable
 * from the ones still in use. One application carried 175 names, 24 of them
 * belonging to screens that no longer existed.
 *
 * Version 2 records when each name was last rendered, which is the one fact
 * that tells those apart. A version 1 file is read as though every name was
 * last seen when the file was written, so nothing is lost by upgrading.
 */

import * as fs from 'fs';
import * as path from 'path';

/** Icon name -> when it was last rendered, as an ISO timestamp. */
export interface UsageFile {
  version: string;
  icons: Record<string, string>;
  updatedAt: string;
  /**
   * Whether the timestamps were invented on read.
   *
   * A version 1 file has one timestamp for the whole list, so upgrading gives
   * every name the same one — they are all as old as the file. That is enough
   * to keep the names, and not enough to decide which to remove.
   */
  upgraded?: boolean;
}

/** What a version 1 file looked like. */
interface LegacyUsageFile {
  version?: string;
  icons?: string[] | Record<string, string>;
  updatedAt?: string;
}

export const USAGE_FILE_VERSION = '2.0.0';

/** The usage file for a project, whether or not `.rn-iconify` is in the path. */
export function usageFilePath(projectRoot: string, outputDir = '.rn-iconify'): string {
  return path.isAbsolute(outputDir)
    ? path.join(outputDir, 'usage.json')
    : path.join(projectRoot, outputDir, 'usage.json');
}

export function emptyUsageFile(now: string): UsageFile {
  return { version: USAGE_FILE_VERSION, icons: {}, updatedAt: now };
}

/**
 * Read the file, upgrading a version 1 list on the way.
 *
 * An unreadable or unrecognised file is treated as empty rather than as an
 * error: it is a cache of what development happened to see, and refusing to
 * build over a corrupt one would be a worse failure than relearning.
 */
export function readUsageFile(usagePath: string, now: string): UsageFile {
  try {
    if (!fs.existsSync(usagePath)) return emptyUsageFile(now);

    const data = JSON.parse(fs.readFileSync(usagePath, 'utf-8')) as LegacyUsageFile;
    const updatedAt = data.updatedAt ?? now;

    if (Array.isArray(data.icons)) {
      // Stamped now, not with the file's own date. When each name was last
      // rendered is not recorded anywhere in a version 1 file, and treating
      // them all as just-seen is the reading that cannot remove one that is
      // still in use. The clock starts here and tells the truth from here on.
      const icons: Record<string, string> = {};
      for (const icon of data.icons) {
        if (typeof icon === 'string') icons[icon] = now;
      }
      return { version: USAGE_FILE_VERSION, icons, updatedAt, upgraded: true };
    }

    if (data.icons && typeof data.icons === 'object') {
      return { version: USAGE_FILE_VERSION, icons: { ...data.icons }, updatedAt };
    }
  } catch {
    // Falls through to an empty file.
  }

  return emptyUsageFile(now);
}

/** Write atomically, so a crash mid-write cannot leave a half-file behind. */
export function writeUsageFile(usagePath: string, data: UsageFile): void {
  fs.mkdirSync(path.dirname(usagePath), { recursive: true });

  const tmpPath = `${usagePath}.tmp`;
  fs.writeFileSync(tmpPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
  fs.renameSync(tmpPath, usagePath);
}

/** The names in the file, in the order they were first seen. */
export function usageNames(file: UsageFile): string[] {
  return Object.keys(file.icons);
}

/**
 * Record that an icon was rendered.
 *
 * The timestamp is written every time, not only the first: a name that is
 * still in use has to look different from one that is not, and that is the
 * whole difference.
 *
 * @returns whether this is a name the file did not already have
 */
export function recordUsage(file: UsageFile, icon: string, now: string): boolean {
  const isNew = !(icon in file.icons);

  file.icons[icon] = now;
  file.updatedAt = now;

  return isNew;
}

/**
 * Drop the names not rendered since a cutoff.
 *
 * Deliberately not automatic. A screen visited twice a year is still a screen,
 * and quietly dropping its icons would put them back on the network for the
 * one person who opens it. This runs when someone asks, and says what it took.
 */
export function pruneUsage(
  file: UsageFile,
  cutoff: Date
): { pruned: UsageFile; removed: Array<{ icon: string; lastSeen: string }> } {
  const icons: Record<string, string> = {};
  const removed: Array<{ icon: string; lastSeen: string }> = [];

  for (const [icon, lastSeen] of Object.entries(file.icons)) {
    const seen = new Date(lastSeen);
    // An unparseable timestamp is kept: it says nothing about whether the icon
    // is still used, and guessing would remove a working one.
    if (!Number.isNaN(seen.getTime()) && seen < cutoff) {
      removed.push({ icon, lastSeen });
    } else {
      icons[icon] = lastSeen;
    }
  }

  return { pruned: { ...file, icons }, removed };
}

/**
 * Drop the names the build can prove on its own.
 *
 * This file exists to carry what the scan cannot find. A name it now finds is
 * carried for no reason — and after the scan learns a new shape, that is most
 * of the file: one application had 175 names, 149 of which its own source had
 * proved all along.
 *
 * Unlike the age of a name, this is not a judgement. The scan found it; the
 * build ships it either way; removing it changes nothing.
 */
export function dropResolved(
  file: UsageFile,
  resolved: readonly string[]
): { pruned: UsageFile; removed: string[] } {
  const found = new Set(resolved);
  const icons: Record<string, string> = {};
  const removed: string[] = [];

  for (const [icon, lastSeen] of Object.entries(file.icons)) {
    if (found.has(icon)) removed.push(icon);
    else icons[icon] = lastSeen;
  }

  return { pruned: { ...file, icons }, removed };
}
