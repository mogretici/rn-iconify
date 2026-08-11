/**
 * Icon name handling for the component generator.
 *
 * Kept separate from `generate-components.ts` so it can be tested without a
 * network call: that file reaches the Iconify API and uses `import.meta`, which
 * a CommonJS test transform cannot load. Everything here is pure.
 */

/** Turns an icon name into a valid TypeScript object key. */
export function sanitizeIconName(name: string): string {
  let sanitized = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  if (/^[0-9]/.test(sanitized)) {
    sanitized = '_' + sanitized;
  }
  return sanitized;
}

/**
 * Picks the aliases worth generating.
 *
 * Iconify keeps an alias whenever it renames an icon — `pinhead:five` became
 * `pinhead:5`, `fluent:text-add-28-filled` became `text-add-t-28-filled` — and
 * the old name keeps resolving through their API. Generating from the icon
 * list alone drops those names here, which breaks every app that uses them for
 * a rename this package never made.
 *
 * Two are skipped: a name that still exists on its own is not an alias, and an
 * alias pointing at something that is gone would only produce a broken icon.
 */
export function selectAliases(
  names: readonly string[],
  aliases: Readonly<Record<string, string>>
): Record<string, string> {
  const live = new Set(names);
  const selected: Record<string, string> = {};

  for (const [from, to] of Object.entries(aliases)) {
    if (!live.has(from) && live.has(to)) {
      selected[from] = to;
    }
  }

  return selected;
}

/**
 * Picks the deprecated icons worth keeping.
 *
 * Iconify hides an icon it no longer recommends instead of deleting it — the
 * API still returns valid SVG for `solar:4k-bold-duotone` long after it left
 * the listing. Dropping those from this package takes working icons away from
 * applications that use them, which is a breaking change for a decision
 * upstream did not make.
 *
 * A hidden name that also appears in the listing is already covered.
 */
export function selectDeprecated(names: readonly string[], hidden: readonly string[]): string[] {
  const live = new Set(names);

  return hidden.filter((name) => !live.has(name)).sort((a, b) => a.localeCompare(b));
}

/**
 * Renders the icon map for a generated component.
 *
 * `true` means the key is the icon name. A string means the key resolves to a
 * different name — used both for keys that had to be sanitized (`_500px` ->
 * `500px`) and for names upstream has renamed.
 */
export function renderIconEntries(
  names: readonly string[],
  aliases: Readonly<Record<string, string>>,
  deprecated: readonly string[] = []
): string {
  const lines = names.map((name) => {
    const key = sanitizeIconName(name);
    return key !== name ? `  '${key}': '${name}',` : `  '${name}': true,`;
  });

  const generated = new Set(names.map(sanitizeIconName));
  const aliasLines = Object.entries(aliases)
    .map(([from, to]) => [sanitizeIconName(from), to] as const)
    // A sanitized alias key can collide with a real icon; the real one wins.
    .filter(([key]) => !generated.has(key))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, to]) => `  '${key}': '${to}',`);

  const deprecatedLines = deprecated
    .map((name) => [sanitizeIconName(name), name] as const)
    .filter(([key]) => !generated.has(key) && !aliases[key])
    .map(([key, name]) => (key !== name ? `  '${key}': '${name}',` : `  '${name}': true,`));

  const sections = [...lines];

  if (aliasLines.length > 0) {
    sections.push(
      '',
      '  // Names upstream has renamed. Kept so existing code keeps working;',
      '  // each resolves to the icon that is current.',
      ...aliasLines
    );
  }

  if (deprecatedLines.length > 0) {
    sections.push(
      '',
      '  // Deprecated upstream: hidden from the listing but still served.',
      '  // Kept so existing code keeps working.',
      ...deprecatedLines
    );
  }

  return sections.join('\n');
}
