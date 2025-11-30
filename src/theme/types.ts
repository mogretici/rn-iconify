/**
 * Theme System Types
 * Defines types for global icon theming and configuration
 */

import type { ReactNode } from 'react';
import type { PlaceholderType } from '../placeholder/types';
import type { IconRotation, IconFlip } from '../types';

/**
 * Icon theme configuration
 * All properties are optional - components will use their own defaults if not provided
 */
export interface IconTheme {
  /**
   * Default icon size (width and height)
   * @default 24
   */
  size?: number;

  /**
   * Default icon color
   * @default '#000000'
   */
  color?: string;

  /**
   * Default placeholder type shown while icons load
   * @example 'shimmer'
   */
  placeholder?: PlaceholderType;

  /**
   * Default placeholder background color
   * @default '#E1E1E1'
   */
  placeholderColor?: string;

  /**
   * Default placeholder animation duration in milliseconds
   * @default 1000
   */
  placeholderDuration?: number;

  /**
   * Default rotation for all icons
   * @default 0
   */
  rotate?: IconRotation;

  /**
   * Default flip direction for all icons
   */
  flip?: IconFlip;

  /**
   * Default fallback delay in milliseconds
   * @default 0
   */
  fallbackDelay?: number;
}

/**
 * Props for IconThemeProvider component
 */
export interface IconThemeProviderProps {
  /**
   * Theme configuration
   */
  theme: IconTheme;

  /**
   * Child components that will receive the theme
   */
  children: ReactNode;
}

/**
 * Context value for icon theme
 */
export interface IconThemeContextValue {
  /**
   * Current theme configuration
   */
  theme: IconTheme;

  /**
   * Update theme dynamically
   * Useful for theme switching (e.g., dark mode)
   */
  setTheme: (theme: IconTheme | ((prev: IconTheme) => IconTheme)) => void;
}

/**
 * Default theme values
 * Used when no theme is provided or for missing properties
 */
export const DEFAULT_ICON_THEME: Required<Omit<IconTheme, 'placeholder' | 'flip'>> &
  Pick<IconTheme, 'placeholder' | 'flip'> = {
  size: 24,
  color: '#000000',
  placeholder: undefined,
  placeholderColor: '#E1E1E1',
  placeholderDuration: 1000,
  rotate: 0,
  flip: undefined,
  fallbackDelay: 0,
};
