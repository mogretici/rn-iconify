/**
 * Declaring icons the scan cannot infer.
 *
 * Most icon names are found in the source: written on the icon component, or
 * handed to a component whose prop says which set it belongs to. Some are not
 * — a name assembled at runtime, or a lookup table typed loosely enough that
 * nothing connects its values to an icon set:
 *
 * ```ts
 * const CATEGORY_ICON: Record<string, string> = { OUTFIT: 'hanger' }
 * ```
 *
 * There is no way to know 'hanger' is an Mdi icon from that. Not because the
 * scan is weak, but because the source does not say so. Left alone, those
 * names are fetched from the Iconify API at runtime — on every install, with
 * a placeholder until they land, and never at all offline.
 *
 * `defineIcons` is where you say so. It returns its argument unchanged; the
 * whole purpose is to be a shape the build can recognise and the type checker
 * can verify.
 *
 * ```ts
 * import { defineIcons } from 'rn-iconify';
 * import type { MdiIconName } from 'rn-iconify';
 *
 * const CATEGORY_ICON = defineIcons<MdiIconName>({
 *   OUTFIT: 'hanger',
 *   SPOTLIGHT: 'theater',
 * });
 * ```
 *
 * The type argument does two things at once: it stops a typo reaching a build
 * and it tells the scanner which set these names belong to.
 */

/**
 * Declare a group of icon names so the build includes them.
 *
 * @param icons Object or array of icon names, without a set prefix
 * @returns The same value, typed
 */
export function defineIcons<TName extends string, TShape extends Record<string, TName>>(
  icons: TShape
): TShape;
export function defineIcons<TName extends string>(icons: readonly TName[]): readonly TName[];
export function defineIcons<TName extends string>(
  icons: Record<string, TName> | readonly TName[]
): Record<string, TName> | readonly TName[] {
  return icons;
}
