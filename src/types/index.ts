import type { ReactNode } from 'react';
import type { ViewStyle, StyleProp } from 'react-native';

/**
 * Icon transformation rotation values
 */
export type IconRotation = 0 | 90 | 180 | 270;

/**
 * Icon flip direction
 */
export type IconFlip = 'horizontal' | 'vertical' | 'both';

/**
 * Base props for all icon components
 */
export interface IconProps<T extends string = string> {
  /**
   * Icon name from the icon set
   * @example "home", "settings", "user"
   */
  name: T;

  /**
   * Icon size (width and height)
   * @default 24
   */
  size?: number;

  /**
   * Icon color
   * @default "#000000"
   */
  color?: string;

  /**
   * Custom width (overrides size)
   */
  width?: number;

  /**
   * Custom height (overrides size)
   */
  height?: number;

  /**
   * Additional styles applied to the icon container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Rotation in degrees
   * @default 0
   */
  rotate?: IconRotation;

  /**
   * Flip the icon horizontally, vertically, or both
   */
  flip?: IconFlip;

  /**
   * Fallback component shown while the icon is loading
   */
  fallback?: ReactNode;

  /**
   * Delay in milliseconds before showing the fallback
   * @default 0
   */
  fallbackDelay?: number;

  /**
   * Called when the icon loads successfully
   */
  onLoad?: () => void;

  /**
   * Called when the icon fails to load
   */
  onError?: (error: Error) => void;

  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;

  /**
   * Test ID for testing purposes
   */
  testID?: string;
}

/**
 * Internal icon data structure from Iconify API
 */
export interface IconifyIconData {
  body: string;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  rotate?: number;
  hFlip?: boolean;
  vFlip?: boolean;
}

/**
 * Iconify API response structure
 * @see https://iconify.design/docs/api/icon-data.html
 */
export interface IconifyAPIResponse {
  /** Icon set prefix */
  prefix: string;
  /** Map of icon names to their data */
  icons: Record<string, IconifyIconData>;
  /** Default width for icons without explicit width */
  width?: number;
  /** Default height for icons without explicit height */
  height?: number;
  /** Last modification timestamp */
  lastModified?: number;
  /** Array of icon names that were not found (if any requested icons don't exist) */
  not_found?: string[];
}

/**
 * Cache entry for storing icon data
 */
export interface CacheEntry {
  svg: string;
  timestamp: number;
  width: number;
  height: number;
}

/**
 * Icon loading state
 */
export type IconLoadingState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Internal renderer props (used by IconRenderer)
 */
export interface IconRendererProps extends Omit<IconProps<string>, 'name'> {
  /**
   * Full icon name including prefix
   * @example "mdi:home", "heroicons:user"
   */
  iconName: string;
}
