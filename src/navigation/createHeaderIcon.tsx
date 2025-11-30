/**
 * createHeaderIcon - Helper for React Navigation header icons
 * Creates header icons for headerLeft, headerRight, etc.
 */

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '../alias';
import type { HeaderIconProps } from './types';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Configuration for header icon
 */
export interface HeaderIconConfig {
  /**
   * Icon name (full name or alias)
   */
  icon: string;

  /**
   * Icon size
   * @default 24
   */
  size?: number;

  /**
   * Icon color (uses tintColor from navigation if not provided)
   */
  color?: string;

  /**
   * Callback when icon is pressed
   */
  onPress?: () => void;

  /**
   * Container style
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Accessibility label
   */
  accessibilityLabel?: string;

  /**
   * Hit slop for touch area
   */
  hitSlop?: { top?: number; bottom?: number; left?: number; right?: number };
}

/**
 * Create a header icon component for React Navigation
 *
 * @example headerRight with back action
 * ```tsx
 * import { createHeaderIcon } from 'rn-iconify/navigation';
 *
 * <Stack.Screen
 *   name="Details"
 *   options={({ navigation }) => ({
 *     headerRight: createHeaderIcon({
 *       icon: 'mdi:close',
 *       onPress: () => navigation.goBack(),
 *     }),
 *   })}
 * />
 * ```
 *
 * @example headerLeft with menu
 * ```tsx
 * <Stack.Screen
 *   options={({ navigation }) => ({
 *     headerLeft: createHeaderIcon({
 *       icon: 'mdi:menu',
 *       onPress: () => navigation.openDrawer(),
 *       accessibilityLabel: 'Open menu',
 *     }),
 *   })}
 * />
 * ```
 *
 * @example Custom styling
 * ```tsx
 * <Stack.Screen
 *   options={{
 *     headerRight: createHeaderIcon({
 *       icon: 'mdi:dots-vertical',
 *       size: 28,
 *       color: '#007AFF',
 *       style: { marginRight: 8 },
 *     }),
 *   }}
 * />
 * ```
 */
export function createHeaderIcon(config: HeaderIconConfig) {
  const {
    icon,
    size = 24,
    color,
    onPress,
    style,
    accessibilityLabel,
    hitSlop = { top: 10, bottom: 10, left: 10, right: 10 },
  } = config;

  return function HeaderIcon(props: HeaderIconProps) {
    const iconColor = color ?? props.tintColor ?? '#000000';

    const iconElement = (
      <Icon name={icon} size={size} color={iconColor} accessibilityLabel={accessibilityLabel} />
    );

    if (onPress) {
      return (
        <TouchableOpacity
          onPress={onPress}
          style={[styles.container, style, { padding: 8 }]}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          activeOpacity={props.pressOpacity ?? 0.7}
        >
          {iconElement}
        </TouchableOpacity>
      );
    }

    return iconElement;
  };
}

/**
 * Create a back button icon for navigation headers
 *
 * @example
 * ```tsx
 * import { createBackIcon } from 'rn-iconify/navigation';
 *
 * <Stack.Screen
 *   options={({ navigation }) => ({
 *     headerLeft: createBackIcon({
 *       onPress: () => navigation.goBack(),
 *     }),
 *   })}
 * />
 * ```
 */
export function createBackIcon(options: Omit<HeaderIconConfig, 'icon'> = {}) {
  return createHeaderIcon({
    icon: 'mdi:arrow-left',
    accessibilityLabel: 'Go back',
    ...options,
  });
}

/**
 * Create a close button icon for modal screens
 *
 * @example
 * ```tsx
 * import { createCloseIcon } from 'rn-iconify/navigation';
 *
 * <Stack.Screen
 *   options={({ navigation }) => ({
 *     headerRight: createCloseIcon({
 *       onPress: () => navigation.goBack(),
 *     }),
 *   })}
 * />
 * ```
 */
export function createCloseIcon(options: Omit<HeaderIconConfig, 'icon'> = {}) {
  return createHeaderIcon({
    icon: 'mdi:close',
    accessibilityLabel: 'Close',
    ...options,
  });
}

/**
 * Create a menu button icon for opening drawers
 *
 * @example
 * ```tsx
 * import { createMenuIcon } from 'rn-iconify/navigation';
 *
 * <Stack.Screen
 *   options={({ navigation }) => ({
 *     headerLeft: createMenuIcon({
 *       onPress: () => navigation.openDrawer(),
 *     }),
 *   })}
 * />
 * ```
 */
export function createMenuIcon(options: Omit<HeaderIconConfig, 'icon'> = {}) {
  return createHeaderIcon({
    icon: 'mdi:menu',
    accessibilityLabel: 'Open menu',
    ...options,
  });
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
});

export default createHeaderIcon;
