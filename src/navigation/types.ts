/**
 * React Navigation Integration Types
 * Type definitions for navigation icon helpers
 */

import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Props passed by React Navigation to tabBarIcon
 */
export interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

/**
 * Props passed by React Navigation to drawerIcon
 */
export interface DrawerIconProps {
  focused: boolean;
  color: string;
  size: number;
}

/**
 * Props passed by React Navigation to headerLeft/headerRight icons
 */
export interface HeaderIconProps {
  tintColor?: string;
  pressColor?: string;
  pressOpacity?: number;
}

/**
 * Icon specification - can be a full name or alias
 * @example 'mdi:home' or 'home' (if alias is registered)
 */
export type IconSpec = string;

/**
 * Configuration for tab bar icon
 */
export interface TabBarIconConfig {
  /**
   * Icon to show when tab is focused
   * Can be a full icon name (mdi:home) or alias (home)
   */
  focused: IconSpec;

  /**
   * Icon to show when tab is not focused
   * If not provided, uses the focused icon with different styling
   */
  unfocused?: IconSpec;

  /**
   * Custom size override (default: uses navigation's size)
   */
  size?: number;

  /**
   * Custom color override for focused state
   */
  focusedColor?: string;

  /**
   * Custom color override for unfocused state
   */
  unfocusedColor?: string;

  /**
   * Additional style for the icon container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Accessibility label
   */
  accessibilityLabel?: string;
}

/**
 * Simple config - just icon names
 */
export type SimpleTabBarIconConfig = IconSpec | [IconSpec, IconSpec];

/**
 * Configuration for drawer icon
 */
export interface DrawerIconConfig {
  /**
   * Icon to show
   */
  icon: IconSpec;

  /**
   * Icon when drawer item is focused
   */
  focusedIcon?: IconSpec;

  /**
   * Custom size override
   */
  size?: number;

  /**
   * Additional style
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Return type for createTabBarIcon
 */
export type TabBarIconFunction = (props: TabBarIconProps) => ReactNode;

/**
 * Return type for createDrawerIcon
 */
export type DrawerIconFunction = (props: DrawerIconProps) => ReactNode;

/**
 * Return type for createHeaderIcon
 */
export type HeaderIconFunction = (props: HeaderIconProps) => ReactNode;

/**
 * Navigation icon preset - common icon patterns
 */
export interface NavigationIconPreset {
  home: { focused: IconSpec; unfocused: IconSpec };
  search: { focused: IconSpec; unfocused: IconSpec };
  profile: { focused: IconSpec; unfocused: IconSpec };
  settings: { focused: IconSpec; unfocused: IconSpec };
  notifications: { focused: IconSpec; unfocused: IconSpec };
  messages: { focused: IconSpec; unfocused: IconSpec };
  favorites: { focused: IconSpec; unfocused: IconSpec };
  cart: { focused: IconSpec; unfocused: IconSpec };
}

/**
 * Default icon presets using popular icon sets
 */
export const DEFAULT_NAVIGATION_PRESETS: NavigationIconPreset = {
  home: { focused: 'mdi:home', unfocused: 'mdi:home-outline' },
  search: { focused: 'mdi:magnify', unfocused: 'mdi:magnify' },
  profile: { focused: 'mdi:account', unfocused: 'mdi:account-outline' },
  settings: { focused: 'mdi:cog', unfocused: 'mdi:cog-outline' },
  notifications: { focused: 'mdi:bell', unfocused: 'mdi:bell-outline' },
  messages: { focused: 'mdi:message', unfocused: 'mdi:message-outline' },
  favorites: { focused: 'mdi:heart', unfocused: 'mdi:heart-outline' },
  cart: { focused: 'mdi:cart', unfocused: 'mdi:cart-outline' },
};
