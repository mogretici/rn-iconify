/**
 * Doctor Command
 *
 * Reports which icons this project ships and which ones it will fetch over
 * the network at runtime.
 *
 * That second number is the one worth knowing and the one nothing used to
 * report. An icon the build cannot see is not a broken icon — IconRenderer
 * asks the Iconify API for it instead, in release builds as much as in
 * development. It costs a request on every install, a placeholder until it
 * lands, and on a device with no connection it never arrives at all. None of
 * that shows up in development, where the same fetch quietly succeeds and the
 * name is written into usage.json for next time.
 *
 * So the failure is invisible by construction. This is what makes it visible,
 * and `--strict` is what makes CI refuse to ship it.
 */

import * as fs from 'fs';
import * as path from 'path';
import { scanProjectForIcons } from '../../babel/scanner';
import { EXIT_CODES } from '../types';
import type { DoctorOptions, DoctorResult } from '../types';

interface UsageFile {
  version: string;
  icons: string[];
  updatedAt: string;
}

/**
 * Icons the app asked for at runtime during development.
 *
 * Every one of these is a name the scan could not find on its own. They end
 * up in the next bundle, which is why nothing looks wrong — but the bundle is
 * then only correct for as long as this file keeps up, and it is a build
 * artefact that happens to be committed.
 */
function readLearnedIcons(projectRoot: string): { icons: string[]; updatedAt: string | null } {
  const usagePath = path.join(projectRoot, '.rn-iconify', 'usage.json');

  try {
    if (!fs.existsSync(usagePath)) return { icons: [], updatedAt: null };
    const usage: UsageFile = JSON.parse(fs.readFileSync(usagePath, 'utf-8'));
    if (Array.isArray(usage.icons)) {
      return { icons: usage.icons, updatedAt: usage.updatedAt ?? null };
    }
  } catch {
    // A malformed usage file tells us nothing; treat it as empty.
  }

  return { icons: [], updatedAt: null };
}

/**
 * Scan the project counting only what the source itself proves.
 *
 * usage.json is deliberately excluded here — including it would report the
 * project as healthy precisely because of the file whose necessity is the
 * problem being measured.
 */
function scanWithoutLearnedIcons(projectRoot: string, verbose: boolean): string[] {
  const usagePath = path.join(projectRoot, '.rn-iconify', 'usage.json');
  const existed = fs.existsSync(usagePath);
  const original = existed ? fs.readFileSync(usagePath, 'utf-8') : null;

  try {
    if (existed) {
      // Emptied rather than deleted, and rewritten from whatever parses. A
      // file that does not parse is already contributing nothing, so it is
      // left to the scanner, which tolerates it.
      try {
        const usage: UsageFile = JSON.parse(original as string);
        fs.writeFileSync(usagePath, JSON.stringify({ ...usage, icons: [] }));
      } catch {
        // Unparseable: nothing to neutralise.
      }
    }
    return scanProjectForIcons(projectRoot, { verbose });
  } finally {
    if (existed && original !== null) {
      fs.writeFileSync(usagePath, original);
    }
  }
}

export function diagnose(projectRoot: string, verbose = false): DoctorResult {
  const statik = scanWithoutLearnedIcons(projectRoot, verbose);
  const staticSet = new Set(statik);

  const learned = readLearnedIcons(projectRoot);
  const runtimeOnly = learned.icons.filter((icon) => !staticSet.has(icon));

  return {
    bundled: statik.sort(),
    runtimeOnly: runtimeOnly.sort(),
    learnedTotal: new Set(learned.icons).size,
    learnedAt: learned.updatedAt,
  };
}

function groupByPrefix(icons: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();

  for (const icon of icons) {
    const prefix = icon.split(':')[0] ?? 'unknown';
    const existing = groups.get(prefix);
    if (existing) existing.push(icon);
    else groups.set(prefix, [icon]);
  }

  return groups;
}

function formatReport(result: DoctorResult): string {
  const lines: string[] = [];
  const total = result.bundled.length + result.runtimeOnly.length;

  lines.push('');
  lines.push('🩺 rn-iconify doctor');
  lines.push('');
  lines.push(`   Resolved from source : ${result.bundled.length}`);
  lines.push(`   Fetched at runtime   : ${result.runtimeOnly.length}`);

  if (total > 0) {
    const covered = Math.round((result.bundled.length / total) * 100);
    lines.push(`   Coverage             : ${covered}%`);
  }

  if (result.runtimeOnly.length === 0) {
    lines.push('');
    lines.push('   Every icon this project uses is in the bundle.');
    lines.push('   Nothing is fetched at runtime, and nothing depends on the network.');
    lines.push('');
    return lines.join('\n');
  }

  lines.push('');
  lines.push('   These icons are not in the bundle. Each one costs a request to the');
  lines.push('   Iconify API on every install, shows a placeholder until it arrives,');
  lines.push('   and does not appear at all on a device that is offline.');
  lines.push('');

  for (const [prefix, icons] of groupByPrefix(result.runtimeOnly)) {
    lines.push(`   ${prefix} (${icons.length})`);
    for (const icon of icons) {
      lines.push(`     · ${icon.slice(prefix.length + 1)}`);
    }
    lines.push('');
  }

  lines.push('   They are usually names the scan cannot tie to an icon set — a map');
  lines.push('   typed Record<string, string> rather than Record<string, IonIconName>,');
  lines.push('   or a name built at runtime. Two ways to fix that:');
  lines.push('');
  lines.push('     · type the values with the icon set, e.g. MdiIconName, or');
  lines.push('     · declare them with defineIcons() from rn-iconify');
  lines.push('');

  if (result.learnedTotal > 0) {
    lines.push(
      `   usage.json carries ${result.learnedTotal} name(s), written during development` +
        (result.learnedAt ? `, last on ${result.learnedAt}` : '') +
        '.'
    );
    lines.push('   The ones above ship today only because that file is committed.');
    lines.push('   Nothing prunes it, so a name stays after the screen using it is gone —');
    lines.push('   and which is which cannot be told apart from here.');
    lines.push('');
  }

  return lines.join('\n');
}

export async function doctorCommand(options: DoctorOptions): Promise<number> {
  const projectRoot = path.resolve(options.src ?? process.cwd());

  if (!fs.existsSync(projectRoot)) {
    console.error(`[rn-iconify] No such directory: ${projectRoot}`);
    return EXIT_CODES.ERROR;
  }

  const result = diagnose(projectRoot, options.verbose ?? false);

  if (options.format === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatReport(result));
  }

  // Only --strict turns this into a failure. Reporting is useful on its own,
  // and a project mid-migration should be able to see the number without
  // being blocked by it.
  if (options.strict && result.runtimeOnly.length > 0) {
    console.error(`[rn-iconify] ${result.runtimeOnly.length} icon(s) would be fetched at runtime.`);
    return EXIT_CODES.ERROR;
  }

  return EXIT_CODES.SUCCESS;
}
