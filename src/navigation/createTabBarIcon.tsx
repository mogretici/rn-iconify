/**
 * createTabBarIcon - Helper for React Navigation tab bar icons
 * Creates a tabBarIcon function that handles focused/unfocused states
 */

import React from 'react';
import { Icon } from '../alias';
import type {
  TabBarIconProps,
  TabBarIconConfig,
  SimpleTabBarIconConfig,
  TabBarIconFunction,
} from './types';

/**
 * Normalize config to full TabBarIconConfig
 */
function normalizeConfig(config: SimpleTabBarIconConfig | TabBarIconConfig): TabBarIconConfig {
  // String: same icon for both states
  if (typeof config === 'string') {
    return { focused: config };
  }

  // Array: [focused, unfocused]
  if (Array.isArray(config)) {
    return { focused: config[0], unfocused: config[1] };
  }

  // Full config object
  return config;
}

/**
 * Create a tab bar icon function for React Navigation
 *
 * @example Simple usage (same icon for both states)
 * ```tsx
 * import { createTabBarIcon } from 'rn-iconify/navigation';
 *
 * <Tab.Screen
 *   name="Home"
 *   component={HomeScreen}
 *   options={{
 *     tabBarIcon: createTabBarIcon('mdi:home'),
 *   }}
 * />
 * ```
 *
 * @example Different icons for focused/unfocused
 * ```tsx
 * <Tab.Screen
 *   options={{
 *     tabBarIcon: createTabBarIcon(['mdi:home', 'mdi:home-outline']),
 *   }}
 * />
 * ```
 *
 * @example With full configuration
 * ```tsx
 * <Tab.Screen
 *   options={{
 *     tabBarIcon: createTabBarIcon({
 *       focused: 'mdi:home',
 *       unfocused: 'mdi:home-outline',
 *       size: 28,
 *       focusedColor: '#007AFF',
 *     }),
 *   }}
 * />
 * ```
 *
 * @example With aliases (requires IconAliasProvider)
 * ```tsx
 * <Tab.Screen
 *   options={{
 *     tabBarIcon: createTabBarIcon(['home', 'home-outline']),
 *   }}
 * />
 * ```
 */
export function createTabBarIcon(
  config: SimpleTabBarIconConfig | TabBarIconConfig
): TabBarIconFunction {
  const normalizedConfig = normalizeConfig(config);

  return function TabBarIcon({ focused, color, size }: TabBarIconProps) {
    const {
      focused: focusedIcon,
      unfocused: unfocusedIcon,
      size: customSize,
      focusedColor,
      unfocusedColor,
      style,
      accessibilityLabel,
    } = normalizedConfig;

    // Determine which icon to show
    const iconName = focused ? focusedIcon : (unfocusedIcon ?? focusedIcon);

    // Determine color
    const iconColor = focused ? (focusedColor ?? color) : (unfocusedColor ?? color);

    // Determine size
    const iconSize = customSize ?? size;

    return (
      <Icon
        name={iconName}
        size={iconSize}
        color={iconColor}
        style={style}
        accessibilityLabel={accessibilityLabel}
      />
    );
  };
}

/**
 * Create multiple tab bar icons at once
 *
 * @example
 * ```tsx
 * import { createTabBarIcons } from 'rn-iconify/navigation';
 *
 * const tabIcons = createTabBarIcons({
 *   Home: ['mdi:home', 'mdi:home-outline'],
 *   Search: 'mdi:magnify',
 *   Profile: ['mdi:account', 'mdi:account-outline'],
 *   Settings: {
 *     focused: 'mdi:cog',
 *     unfocused: 'mdi:cog-outline',
 *     size: 26,
 *   },
 * });
 *
 * <Tab.Screen
 *   name="Home"
 *   options={{ tabBarIcon: tabIcons.Home }}
 * />
 * ```
 */
export function createTabBarIcons<
  T extends Record<string, SimpleTabBarIconConfig | TabBarIconConfig>,
>(configs: T): { [K in keyof T]: TabBarIconFunction } {
  const result = {} as { [K in keyof T]: TabBarIconFunction };

  for (const [key, config] of Object.entries(configs)) {
    result[key as keyof T] = createTabBarIcon(config);
  }

  return result;
}

/**
 * Quick helper for common tab patterns
 * Uses filled/outline icon variants automatically
 *
 * @example
 * ```tsx
 * import { tabIcon } from 'rn-iconify/navigation';
 *
 * <Tab.Screen
 *   options={{
 *     tabBarIcon: tabIcon('mdi', 'home'),  // mdi:home / mdi:home-outline
 *   }}
 * />
 * ```
 */
export function tabIcon(
  prefix: string,
  name: string,
  outlineSuffix = '-outline'
): TabBarIconFunction {
  return createTabBarIcon({
    focused: `${prefix}:${name}`,
    unfocused: `${prefix}:${name}${outlineSuffix}`,
  });
}

export default createTabBarIcon;
