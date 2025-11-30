/**
 * useNavigationIcon - Hook for creating navigation icons
 * Provides a clean API for creating icons with navigation context
 */

import React, { useMemo, useCallback } from 'react';
import { Icon } from '../alias';
import type {
  TabBarIconProps,
  DrawerIconProps,
  TabBarIconFunction,
  DrawerIconFunction,
} from './types';

// IconSpec is just a type alias for string (icon name)
type IconSpec = string;

/**
 * Hook options
 */
export interface UseNavigationIconOptions {
  /**
   * Default size for icons
   * @default 24
   */
  defaultSize?: number;

  /**
   * Suffix for unfocused icon variants
   * @default '-outline'
   */
  outlineSuffix?: string;
}

/**
 * Return type for useNavigationIcon
 */
export interface UseNavigationIconReturn {
  /**
   * Create a tab bar icon function
   */
  tabBarIcon: (focused: IconSpec, unfocused?: IconSpec) => TabBarIconFunction;

  /**
   * Create a drawer icon function
   */
  drawerIcon: (icon: IconSpec, focusedIcon?: IconSpec) => DrawerIconFunction;

  /**
   * Create an auto-outline tab bar icon
   * Uses {name} for focused and {name}-outline for unfocused
   */
  autoTabBarIcon: (prefix: string, name: string) => TabBarIconFunction;

  /**
   * Render an icon directly with navigation props
   */
  renderIcon: (name: IconSpec, props: { color: string; size: number }) => React.ReactElement;
}

/**
 * Hook for creating navigation icons with consistent styling
 *
 * @example Basic usage
 * ```tsx
 * import { useNavigationIcon } from 'rn-iconify/navigation';
 *
 * function MyTabs() {
 *   const { tabBarIcon, drawerIcon } = useNavigationIcon();
 *
 *   return (
 *     <Tab.Navigator>
 *       <Tab.Screen
 *         name="Home"
 *         options={{
 *           tabBarIcon: tabBarIcon('mdi:home', 'mdi:home-outline'),
 *         }}
 *       />
 *       <Tab.Screen
 *         name="Settings"
 *         options={{
 *           tabBarIcon: tabBarIcon('mdi:cog'),
 *         }}
 *       />
 *     </Tab.Navigator>
 *   );
 * }
 * ```
 *
 * @example With auto-outline
 * ```tsx
 * const { autoTabBarIcon } = useNavigationIcon();
 *
 * <Tab.Screen
 *   options={{
 *     // Uses mdi:home (focused) and mdi:home-outline (unfocused)
 *     tabBarIcon: autoTabBarIcon('mdi', 'home'),
 *   }}
 * />
 * ```
 */
export function useNavigationIcon(options: UseNavigationIconOptions = {}): UseNavigationIconReturn {
  const { defaultSize = 24, outlineSuffix = '-outline' } = options;

  // Create tab bar icon function
  const tabBarIcon = useCallback(
    (focused: IconSpec, unfocused?: IconSpec): TabBarIconFunction => {
      return ({ focused: isFocused, color, size }: TabBarIconProps) => {
        const iconName = isFocused ? focused : (unfocused ?? focused);
        return <Icon name={iconName} size={size ?? defaultSize} color={color} />;
      };
    },
    [defaultSize]
  );

  // Create drawer icon function
  const drawerIcon = useCallback(
    (icon: IconSpec, focusedIcon?: IconSpec): DrawerIconFunction => {
      return ({ focused, color, size }: DrawerIconProps) => {
        const iconName = focused && focusedIcon ? focusedIcon : icon;
        return <Icon name={iconName} size={size ?? defaultSize} color={color} />;
      };
    },
    [defaultSize]
  );

  // Create auto-outline tab bar icon
  const autoTabBarIcon = useCallback(
    (prefix: string, name: string): TabBarIconFunction => {
      const focused = `${prefix}:${name}`;
      const unfocused = `${prefix}:${name}${outlineSuffix}`;
      return tabBarIcon(focused, unfocused);
    },
    [tabBarIcon, outlineSuffix]
  );

  // Render icon directly
  const renderIcon = useCallback(
    (name: IconSpec, props: { color: string; size: number }): React.ReactElement => {
      return <Icon name={name} size={props.size ?? defaultSize} color={props.color} />;
    },
    [defaultSize]
  );

  return useMemo(
    () => ({
      tabBarIcon,
      drawerIcon,
      autoTabBarIcon,
      renderIcon,
    }),
    [tabBarIcon, drawerIcon, autoTabBarIcon, renderIcon]
  );
}

export default useNavigationIcon;
