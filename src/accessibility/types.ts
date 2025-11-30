/**
 * Accessibility types for rn-iconify
 */

import type { AccessibilityRole } from 'react-native';

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  /**
   * Enable auto-generated accessibility labels
   * @default true
   */
  autoLabels?: boolean;

  /**
   * Custom label generator function
   */
  labelGenerator?: (iconName: string) => string;

  /**
   * Enable high contrast mode
   * @default false (auto-detect from system)
   */
  highContrast?: boolean;

  /**
   * Respect reduced motion preference
   * @default true
   */
  respectReducedMotion?: boolean;

  /**
   * Default accessibility role for icons
   * @default 'image'
   */
  defaultRole?: AccessibilityRole;

  /**
   * Enable focus indicators
   * @default true
   */
  showFocusIndicators?: boolean;

  /**
   * Minimum touch target size (for pressable icons)
   * @default 44
   */
  minTouchTargetSize?: number;
}

/**
 * Resolved accessibility config with defaults applied
 */
export interface ResolvedAccessibilityConfig {
  autoLabels: boolean;
  labelGenerator: (iconName: string) => string;
  highContrast: boolean;
  respectReducedMotion: boolean;
  defaultRole: AccessibilityRole;
  showFocusIndicators: boolean;
  minTouchTargetSize: number;
}

/**
 * Accessibility context value
 */
export interface AccessibilityContextValue {
  /**
   * Current accessibility configuration
   */
  config: ResolvedAccessibilityConfig;

  /**
   * System prefers reduced motion
   */
  prefersReducedMotion: boolean;

  /**
   * System high contrast mode enabled
   */
  isHighContrast: boolean;

  /**
   * Update accessibility configuration
   */
  setConfig: (config: Partial<AccessibilityConfig>) => void;

  /**
   * Generate label for icon
   */
  getLabel: (iconName: string, customLabel?: string) => string | undefined;

  /**
   * Get color adjusted for high contrast
   */
  getContrastColor: (color: string) => string;

  /**
   * Check if animations should be disabled
   */
  shouldDisableAnimations: () => boolean;
}

/**
 * Props for accessibility-enhanced icons
 */
export interface AccessibleIconProps {
  /**
   * Accessibility label (auto-generated if not provided)
   */
  accessibilityLabel?: string;

  /**
   * Accessibility hint
   */
  accessibilityHint?: string;

  /**
   * Accessibility role
   * @default 'image'
   */
  accessibilityRole?: AccessibilityRole;

  /**
   * Whether the icon is part of a button or pressable
   */
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };

  /**
   * Override high contrast mode for this icon
   */
  highContrast?: boolean;

  /**
   * Whether this icon should be hidden from screen readers
   * Useful for decorative icons
   */
  accessibilityElementsHidden?: boolean;

  /**
   * Import for Android accessibility
   */
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
}
