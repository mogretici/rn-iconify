import type { ReactNode } from 'react';
import type { ViewStyle, StyleProp } from 'react-native';
import type { PlaceholderType } from '../placeholder/types';
import type { AnimationType, AnimationEasing } from '../animated/types';

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
   * @deprecated Use `placeholder` instead for built-in animated placeholders
   */
  fallback?: ReactNode;

  /**
   * Delay in milliseconds before showing the fallback/placeholder
   * @default 0
   */
  fallbackDelay?: number;

  /**
   * Placeholder shown while the icon is loading
   * Can be a preset ('skeleton', 'pulse', 'shimmer') or a custom ReactNode
   * @example 'shimmer'
   * @example <ActivityIndicator size="small" />
   */
  placeholder?: PlaceholderType;

  /**
   * Placeholder background color
   * @default '#E1E1E1'
   */
  placeholderColor?: string;

  /**
   * Placeholder animation duration in milliseconds
   * @default 1000
   */
  placeholderDuration?: number;

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

  // ─────────────────────────────────────────────────────────────────
  // Press/Touch Props
  // ─────────────────────────────────────────────────────────────────

  /**
   * Called when the icon is pressed.
   * When provided, the icon is automatically wrapped in a Pressable component.
   *
   * @example
   * ```tsx
   * <Mdi name="close" onPress={() => console.log('pressed')} />
   * ```
   */
  onPress?: () => void;

  /**
   * Called when the icon is long pressed.
   * When provided (along with or without onPress), the icon is wrapped in Pressable.
   */
  onLongPress?: () => void;

  /**
   * Called when press starts (finger down).
   */
  onPressIn?: () => void;

  /**
   * Called when press ends (finger up).
   */
  onPressOut?: () => void;

  /**
   * Whether the icon press is disabled.
   * Only applicable when onPress or onLongPress is provided.
   * @default false
   */
  disabled?: boolean;

  /**
   * Style applied to the icon when pressed.
   * Only applicable when onPress or onLongPress is provided.
   * If not provided, no visual feedback is shown on press.
   *
   * @example
   * ```tsx
   * <Mdi
   *   name="settings"
   *   onPress={() => {}}
   *   pressedStyle={{ opacity: 0.5, transform: [{ scale: 0.95 }] }}
   * />
   * ```
   */
  pressedStyle?: StyleProp<ViewStyle>;

  // ─────────────────────────────────────────────────────────────────
  // NativeWind Support
  // ─────────────────────────────────────────────────────────────────

  /**
   * NativeWind/Tailwind CSS class names for styling.
   * Only works in projects with NativeWind configured.
   *
   * @example
   * ```tsx
   * <Mdi name="home" className="w-6 h-6 text-blue-500" />
   * ```
   *
   * @see https://www.nativewind.dev/
   */
  className?: string;

  // ─────────────────────────────────────────────────────────────────
  // Animation Props
  // ─────────────────────────────────────────────────────────────────

  /**
   * Animation to apply to the icon
   * Can be a preset ('spin', 'pulse', 'bounce', 'shake', 'ping', 'wiggle')
   * or a custom animation configuration
   * @example 'spin'
   * @example { type: 'rotate', duration: 2000, easing: 'linear' }
   */
  animate?: AnimationType;

  /**
   * Animation duration in milliseconds (overrides preset default)
   */
  animationDuration?: number;

  /**
   * Whether the animation should loop
   * @default true for most presets
   */
  animationLoop?: boolean;

  /**
   * Animation easing function
   */
  animationEasing?: AnimationEasing;

  /**
   * Delay before animation starts (ms)
   * @default 0
   */
  animationDelay?: number;

  /**
   * Whether to start animation automatically
   * @default true
   */
  autoPlay?: boolean;

  /**
   * Callback when animation completes (for non-looping animations)
   */
  onAnimationComplete?: () => void;
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

// Re-export placeholder types for convenience
export type { PlaceholderType, PlaceholderConfig, PlaceholderPreset } from '../placeholder/types';

// Re-export animation types for convenience
export type {
  AnimationType,
  AnimationPreset,
  AnimationConfig,
  AnimationEasing,
  AnimationControls,
} from '../animated/types';
