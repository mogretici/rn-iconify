/**
 * createIconSet - Factory function for creating typed icon components
 *
 * v3.0 rewrite:
 * - React.memo + React.forwardRef
 * - useMergedIconProps (replaces inline ?? chains)
 * - Rest spread (new props automatically forwarded)
 * - Fuzzy matching in __DEV__ for typo suggestions
 */

import React from 'react';
import { type View } from 'react-native';
import { IconRenderer } from './IconRenderer';
import { useMergedIconProps } from './theme';
import type { IconProps } from './types';

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert prefix to PascalCase component name
 * @example "mdi-light" -> "MdiLight"
 */
function toPascalCase(str: string): string {
  return str.split(/[-_]/).map(capitalize).join('');
}

/**
 * Icon names can be either `true` (key is the icon name) or `string` (mapped name)
 * This allows for sanitized keys like `_500px` to map to original names like `500px`
 */
type IconNameValue = true | string;

/**
 * Simple Levenshtein distance for __DEV__ fuzzy matching
 * Only used for "Did you mean?" suggestions on typos
 */
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost
      );
    }
  }

  return matrix[b.length]![a.length]!;
}

/**
 * Find the closest icon name within a reasonable edit distance
 */
function findClosestMatch(name: string, validNames: string[]): string | null {
  let bestMatch: string | null = null;
  let bestDistance = Infinity;
  const maxDistance = Math.max(2, Math.floor(name.length * 0.4));

  for (const validName of validNames) {
    const distance = levenshtein(name, validName);
    if (distance < bestDistance && distance <= maxDistance) {
      bestDistance = distance;
      bestMatch = validName;
    }
  }

  return bestMatch;
}

/**
 * Create a typed icon component for a specific icon set
 *
 * @param prefix - Icon set prefix (e.g., "mdi", "heroicons")
 * @param iconNames - Object with icon names as keys. Value is `true` for direct names,
 *                    or `string` for mapped names (e.g., `_500px: "500px"`)
 * @returns A typed React component for the icon set
 *
 * @example
 * ```tsx
 * const mdiIcons = { home: true, settings: true } as const;
 * type MdiIconName = keyof typeof mdiIcons;
 * export const Mdi = createIconSet<MdiIconName>('mdi', mdiIcons);
 *
 * // Usage
 * <Mdi name="home" size={24} color="blue" />
 * ```
 */
export function createIconSet<T extends string>(
  prefix: string,
  iconNames: Record<T, IconNameValue>
) {
  // Cache valid names for fuzzy matching (only computed once per icon set)
  let cachedValidNames: string[] | null = null;

  const IconComponent = React.memo(
    React.forwardRef<View, IconProps<T>>(function IconComponent(
      { name, accessibilityLabel, ...restProps },
      ref
    ) {
      // Merge with theme defaults (memoized internally)
      const mergedProps = useMergedIconProps(restProps);

      // Runtime validation with fuzzy matching
      if (__DEV__ && !(name in iconNames)) {
        if (!cachedValidNames) {
          cachedValidNames = Object.keys(iconNames);
        }
        const suggestion = findClosestMatch(name, cachedValidNames);
        const suggestionText = suggestion ? ` Did you mean "${suggestion}"?` : '';
        console.warn(
          `[rn-iconify] Unknown icon name "${name}" for ${toPascalCase(prefix)}.${suggestionText}`
        );
      }

      // Get the actual icon name (handles mapped names like _500px -> "500px")
      const actualName = iconNames[name] === true ? name : iconNames[name];
      const iconName = `${prefix}:${actualName}`;

      return (
        <IconRenderer
          ref={ref}
          iconName={iconName}
          accessibilityLabel={accessibilityLabel ?? name}
          {...mergedProps}
        />
      );
    })
  );

  // Set display name for debugging
  IconComponent.displayName = `${toPascalCase(prefix)}Icon`;

  return IconComponent;
}

/**
 * Type helper for extracting icon name type from a component
 *
 * @example
 * ```tsx
 * type MdiIconName = IconNameType<typeof Mdi>;
 * ```
 */
export type IconNameType<T> = T extends React.ComponentType<IconProps<infer N>> ? N : never;
