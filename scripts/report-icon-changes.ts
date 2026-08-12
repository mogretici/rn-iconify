/**
 * Records what the generated icon sets expose, and reports what changed.
 *
 * Run once before regenerating and once after:
 *
 *   tsx scripts/report-icon-changes.ts snapshot .icon-inventory.json
 *   npm run generate-components
 *   tsx scripts/report-icon-changes.ts report .icon-inventory.json
 *   tsx scripts/report-icon-changes.ts notes .icon-inventory.json
 *
 * The report goes to stdout as markdown. It exits 0 either way — a removal is
 * something to surface on the pull request, not a reason to abort the sync —
 * and writes `breaking=true|false` to `$GITHUB_OUTPUT` when running in Actions
 * so the workflow can label the release accordingly.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  diffInventories,
  formatDiff,
  formatReleaseNotes,
  hasRemovals,
  parseIconNames,
  type SetInventory,
} from './icon-inventory';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COMPONENTS_DIR = path.join(__dirname, '../src/components');

function readInventory(): SetInventory[] {
  if (!fs.existsSync(COMPONENTS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(COMPONENTS_DIR)
    .filter((file) => file.endsWith('.tsx'))
    .sort()
    .map((file) => ({
      component: path.basename(file, '.tsx'),
      names: parseIconNames(fs.readFileSync(path.join(COMPONENTS_DIR, file), 'utf8')),
    }));
}

function main(): void {
  const [mode, target] = process.argv.slice(2);

  if (mode !== 'snapshot' && mode !== 'report' && mode !== 'notes') {
    console.error('Usage: report-icon-changes.ts <snapshot|report|notes> <file>');
    process.exit(2);
  }

  if (!target) {
    console.error('Missing output file path.');
    process.exit(2);
  }

  if (mode === 'snapshot') {
    fs.writeFileSync(target, JSON.stringify(readInventory()));
    console.error(`Recorded ${readInventory().length} icon sets.`);
    return;
  }

  const before = fs.existsSync(target)
    ? (JSON.parse(fs.readFileSync(target, 'utf8')) as SetInventory[])
    : [];
  const diff = diffInventories(before, readInventory());
  const breaking = hasRemovals(diff);

  // `notes` is what the release itself carries, so it names every removal
  // rather than a sample; `report` is the shorter table for a job summary.
  console.log(mode === 'notes' ? formatReleaseNotes(diff) : formatDiff(diff));

  // Only the report writes it. `notes` runs straight after on the same diff,
  // and a second identical line in the output file is noise at best.
  if (mode === 'report' && process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `breaking=${breaking}\n`);
  }
}

main();
