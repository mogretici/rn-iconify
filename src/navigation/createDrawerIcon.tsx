/**
 * createDrawerIcon - Helper for React Navigation drawer icons
 * Creates a drawerIcon function for drawer navigation items
 */

import React from 'react';
import { Icon } from '../alias';
import type { DrawerIconProps, DrawerIconConfig, DrawerIconFunction } from './types';

// IconSpec is just a type alias for string (icon name)
type IconSpec = string;

/**
 * Normalize config to full DrawerIconConfig
 */
function normalizeConfig(config: IconSpec | DrawerIconConfig): DrawerIconConfig {
  if (typeof config === 'string') {
    return { icon: config };
  }
  return config;
}

/**
 * Create a drawer icon function for React Navigation
 *
 * @example Simple usage
 * ```tsx
 * import { createDrawerIcon } from 'rn-iconify/navigation';
 *
 * <Drawer.Screen
 *   name="Home"
 *   component={HomeScreen}
 *   options={{
 *     drawerIcon: createDrawerIcon('mdi:home'),
 *   }}
 * />
 * ```
 *
 * @example Different icons for focused/unfocused
 * ```tsx
 * <Drawer.Screen
 *   options={{
 *     drawerIcon: createDrawerIcon({
 *       icon: 'mdi:home-outline',
 *       focusedIcon: 'mdi:home',
 *     }),
 *   }}
 * />
 * ```
 *
 * @example With custom size
 * ```tsx
 * <Drawer.Screen
 *   options={{
 *     drawerIcon: createDrawerIcon({
 *       icon: 'mdi:settings',
 *       size: 28,
 *     }),
 *   }}
 * />
 * ```
 */
export function createDrawerIcon(config: IconSpec | DrawerIconConfig): DrawerIconFunction {
  const normalizedConfig = normalizeConfig(config);

  return function DrawerIcon({ focused, color, size }: DrawerIconProps) {
    const { icon, focusedIcon, size: customSize, style } = normalizedConfig;

    // Determine which icon to show
    const iconName = focused && focusedIcon ? focusedIcon : icon;

    // Determine size
    const iconSize = customSize ?? size;

    return <Icon name={iconName} size={iconSize} color={color} style={style} />;
  };
}

/**
 * Create multiple drawer icons at once
 *
 * @example
 * ```tsx
 * import { createDrawerIcons } from 'rn-iconify/navigation';
 *
 * const drawerIcons = createDrawerIcons({
 *   Home: 'mdi:home',
 *   Profile: 'mdi:account',
 *   Settings: {
 *     icon: 'mdi:cog-outline',
 *     focusedIcon: 'mdi:cog',
 *   },
 * });
 *
 * <Drawer.Screen
 *   name="Home"
 *   options={{ drawerIcon: drawerIcons.Home }}
 * />
 * ```
 */
export function createDrawerIcons<T extends Record<string, IconSpec | DrawerIconConfig>>(
  configs: T
): { [K in keyof T]: DrawerIconFunction } {
  const result = {} as { [K in keyof T]: DrawerIconFunction };

  for (const [key, config] of Object.entries(configs)) {
    result[key as keyof T] = createDrawerIcon(config);
  }

  return result;
}

export default createDrawerIcon;
