/**
 * createIconSet - Factory function for creating typed icon components
 */

import React from 'react';
import { IconRenderer } from './IconRenderer';
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
  /**
   * Icon component for the specific icon set
   */
  function IconComponent({
    name,
    size = 24,
    color = '#000000',
    width,
    height,
    style,
    rotate = 0,
    flip,
    fallback,
    fallbackDelay = 0,
    onLoad,
    onError,
    accessibilityLabel,
    testID,
  }: IconProps<T>) {
    // Runtime validation for icon name
    if (__DEV__ && !(name in iconNames)) {
      console.warn(
        `[rn-iconify] Invalid icon name "${name}" for prefix "${prefix}". ` +
          `Check if the icon exists in the icon set.`
      );
    }

    // Get the actual icon name (handles mapped names like _500px -> "500px")
    const actualName = iconNames[name] === true ? name : iconNames[name];
    const iconName = `${prefix}:${actualName}`;

    return (
      <IconRenderer
        iconName={iconName}
        size={size}
        color={color}
        width={width}
        height={height}
        style={style}
        rotate={rotate}
        flip={flip}
        fallback={fallback}
        fallbackDelay={fallbackDelay}
        onLoad={onLoad}
        onError={onError}
        accessibilityLabel={accessibilityLabel ?? name}
        testID={testID}
      />
    );
  }

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
