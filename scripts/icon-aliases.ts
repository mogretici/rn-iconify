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
 * `true` means the key is the icon name. A string means the key had to be
 * sanitized to be a valid object key and resolves to the real name.
 *
 * Only current names go here. See `renderAliasUnion` for why the others do
 * not.
 */
export function renderIconEntries(names: readonly string[]): string {
  return names
    .map((name) => {
      const key = sanitizeIconName(name);
      return key !== name ? `  '${key}': '${name}',` : `  '${name}': true,`;
    })
    .join('\n');
}

/**
 * Renders the names that are still valid but are no longer the current one —
 * renamed upstream, or hidden from the listing while still being served.
 *
 * These are a type and not an object, and the difference is the whole point.
 * Mdi has 7,447 current names and 6,363 renamed ones; as map entries the
 * second group costs more than the first, because each carries two names
 * rather than a name and `true`. Written into the object, `import { Mdi }`
 * went from 36 kB to 73 kB — every application paying, forever, for names it
 * does not use.
 *
 * Nothing needs them at runtime. The Iconify API resolves an alias itself:
 * asking for `mdi:1-2-3` returns `numeric`. So an unrecognised name already
 * falls through as itself and arrives at an icon. A union gives autocomplete
 * every one of these names and compiles to nothing at all.
 *
 * They are also not sanitized. A key has to be a valid identifier or quoted;
 * a string literal type has no such rule, so the name is written as upstream
 * spells it — which is the name the API answers to.
 */
export function renderAliasUnion(
  names: readonly string[],
  aliases: Readonly<Record<string, string>>,
  deprecated: readonly string[] = []
): string[] {
  const current = new Set(names);

  return [...Object.keys(aliases), ...deprecated]
    .filter((name) => !current.has(name))
    .filter((name, index, all) => all.indexOf(name) === index)
    .sort((a, b) => a.localeCompare(b));
}
