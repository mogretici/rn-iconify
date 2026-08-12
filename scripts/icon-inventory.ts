/**
 * Compares what the generated icon sets expose between two runs.
 *
 * The generated files are this package's public API: every key is a name an
 * application can pass to `name=`. Losing one is a breaking change, and it is
 * invisible in a 6000-line diff — a sync PR once dropped 76 names while
 * describing itself as a feature, which would have shipped as a minor release
 * and broken every app using them.
 *
 * Pure on purpose, so it can be tested without touching the filesystem.
 */

export interface SetInventory {
  /** Component name, e.g. `Pinhead`. */
  component: string;
  /** Every key the set exposes, aliases included. */
  names: string[];
}

export interface IconChanges {
  added: string[];
  removed: string[];
}

export type InventoryDiff = Record<string, IconChanges>;

/**
 * Reads the keys out of a generated component.
 *
 * The files are machine-written with one entry per line, so a line-wise match
 * is enough — and it fails loudly (returns nothing) if that ever stops being
 * true, rather than reporting a false result.
 */
export function parseIconNames(source: string): string[] {
  const names: string[] = [];

  for (const line of source.split('\n')) {
    const entry = /^\s{2}'?([A-Za-z0-9_-]+)'?:\s*(?:true|'[^']*'),$/.exec(line);
    if (entry) {
      names.push(entry[1] as string);
      continue;
    }

    // Names upstream has renamed or hidden live in a union rather than the
    // object, so they cost nothing at runtime. They are still names an
    // application can pass, so losing one is still a breaking change — reading
    // only the object would report that as no change at all.
    // The last member carries the semicolon that ends the type.
    const member = /^\s{2}\|\s'([^']+)';?$/.exec(line);
    if (member) {
      names.push(member[1] as string);
    }
  }

  return names;
}

/** Names present before but not after, per icon set. */
export function diffInventories(
  before: readonly SetInventory[],
  after: readonly SetInventory[]
): InventoryDiff {
  const previous = new Map(before.map((set) => [set.component, new Set(set.names)]));
  const diff: InventoryDiff = {};

  for (const set of after) {
    const old = previous.get(set.component);
    // A brand new set has nothing to lose; report it as entirely added.
    const oldNames = old ?? new Set<string>();
    const current = new Set(set.names);

    const added = set.names.filter((name) => !oldNames.has(name));
    const removed = [...oldNames].filter((name) => !current.has(name));

    if (added.length > 0 || removed.length > 0) {
      diff[set.component] = { added, removed: removed.sort() };
    }
  }

  // A set that disappeared entirely loses all of its names.
  for (const set of before) {
    if (!after.some((candidate) => candidate.component === set.component)) {
      diff[set.component] = { added: [], removed: [...set.names].sort() };
    }
  }

  return diff;
}

/** Whether any name went away, which is what makes a sync breaking. */
export function hasRemovals(diff: InventoryDiff): boolean {
  return Object.values(diff).some((changes) => changes.removed.length > 0);
}

/** A short markdown summary for the pull request body. */
export function formatDiff(diff: InventoryDiff): string {
  const sets = Object.keys(diff).sort();

  if (sets.length === 0) {
    return 'No icon names changed.';
  }

  const totalAdded = sets.reduce((sum, set) => sum + (diff[set]?.added.length ?? 0), 0);
  const totalRemoved = sets.reduce((sum, set) => sum + (diff[set]?.removed.length ?? 0), 0);

  const lines = [
    `**${totalAdded} names added, ${totalRemoved} removed** across ${sets.length} sets.`,
    '',
  ];

  if (totalRemoved > 0) {
    lines.push(
      '> [!WARNING]',
      '> Removing a name breaks any app using it. Release this as a major version,',
      '> or keep the name as an alias instead.',
      ''
    );
  }

  lines.push('| Set | Added | Removed | Names removed |', '| --- | ---: | ---: | --- |');

  for (const set of sets) {
    const { added, removed } = diff[set] as IconChanges;
    const sample = removed.slice(0, 8).join(', ');
    const rest = removed.length > 8 ? `, +${removed.length - 8} more` : '';
    lines.push(`| ${set} | ${added.length} | ${removed.length} | ${sample}${rest} |`);
  }

  return lines.join('\n');
}

/**
 * Writes what changed as the body of a release.
 *
 * The sync commits and publishes without anyone reading it, so this text is
 * the whole contract: someone deciding whether to take the upgrade has nothing
 * else to look at. That rules out the two shortcuts the pull-request table
 * takes — it lists every set whether or not anything left it, and it stops
 * after eight removed names. A name that is not written down here is a name
 * that disappears from an application's build with no explanation.
 *
 * Lines are wrapped because commitlint holds the body to 250 characters, and a
 * release should not fail over a set that lost a lot of names at once.
 */
export function formatReleaseNotes(diff: InventoryDiff): string {
  const sets = Object.keys(diff).sort();
  const added = sets.filter((set) => (diff[set]?.added.length ?? 0) > 0);
  const removed = sets.filter((set) => (diff[set]?.removed.length ?? 0) > 0);

  const totalAdded = sets.reduce((sum, set) => sum + (diff[set]?.added.length ?? 0), 0);
  const totalRemoved = sets.reduce((sum, set) => sum + (diff[set]?.removed.length ?? 0), 0);

  const lines = [`${totalAdded} names added, ${totalRemoved} removed.`];

  if (removed.length > 0) {
    lines.push('', 'Removed — code using one of these no longer compiles:');
    for (const set of removed) {
      lines.push('', `${set}:`, ...wrap((diff[set] as IconChanges).removed));
    }
  }

  if (added.length > 0) {
    lines.push('', 'Added:');
    lines.push(...wrap(added.map((set) => `${set} ${diff[set]?.added.length}`)));
  }

  return lines.join('\n');
}

/** Joins names into comma-separated lines no wider than 100 characters. */
function wrap(items: readonly string[]): string[] {
  const lines: string[] = [];
  let line = '';

  for (const item of items) {
    const next = line ? `${line}, ${item}` : `  ${item}`;
    if (next.length > 100) {
      lines.push(`${line},`);
      line = `  ${item}`;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);

  return lines;
}
