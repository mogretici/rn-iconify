/**
 * Hook for creating accessible icon props
 */

import { useMemo } from 'react';
import type { AccessibilityRole } from 'react-native';
import { useAccessibility } from './AccessibilityProvider';
import type { AccessibleIconProps } from './types';
import { calculateTouchTargetPadding, adjustForHighContrast } from './utils';

/**
 * Input props for useAccessibleIcon hook
 */
export interface UseAccessibleIconInput {
  /**
   * Icon name for auto-label generation
   */
  iconName: string;

  /**
   * Icon size for touch target calculation
   */
  size?: number;

  /**
   * Custom accessibility label
   */
  accessibilityLabel?: string;

  /**
   * Custom accessibility hint
   */
  accessibilityHint?: string;

  /**
   * Custom accessibility role
   */
  accessibilityRole?: AccessibilityRole;

  /**
   * Override high contrast for this icon
   */
  highContrast?: boolean;

  /**
   * Hide from screen readers (decorative icon)
   */
  accessibilityElementsHidden?: boolean;

  /**
   * Android importantForAccessibility
   */
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';

  /**
   * Icon color for contrast adjustment
   */
  color?: string;

  /**
   * Whether the icon is interactive (button, etc.)
   */
  isInteractive?: boolean;
}

/**
 * Output props from useAccessibleIcon hook
 */
export interface UseAccessibleIconOutput {
  /**
   * Props to spread on the icon component
   */
  accessibilityProps: {
    accessible: boolean;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityRole: AccessibilityRole;
    accessibilityElementsHidden?: boolean;
    importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  };

  /**
   * Adjusted color for high contrast
   */
  adjustedColor?: string;

  /**
   * Padding needed to meet minimum touch target
   */
  touchTargetPadding: number;

  /**
   * Whether animations should be disabled
   */
  shouldDisableAnimations: boolean;

  /**
   * Whether high contrast mode is active
   */
  isHighContrast: boolean;
}

/**
 * Hook for creating accessible icon props
 * Automatically generates labels, adjusts colors, and calculates touch targets
 *
 * @example
 * ```tsx
 * function MyIcon({ name, size, color }) {
 *   const { accessibilityProps, adjustedColor, touchTargetPadding } = useAccessibleIcon({
 *     iconName: name,
 *     size,
 *     color,
 *   });
 *
 *   return (
 *     <View style={{ padding: touchTargetPadding }} {...accessibilityProps}>
 *       <Icon name={name} size={size} color={adjustedColor} />
 *     </View>
 *   );
 * }
 * ```
 */
export function useAccessibleIcon(input: UseAccessibleIconInput): UseAccessibleIconOutput {
  const accessibility = useAccessibility();

  return useMemo(() => {
    // Default values when no provider is present
    const defaults: UseAccessibleIconOutput = {
      accessibilityProps: {
        accessible: true,
        accessibilityRole: input.accessibilityRole ?? 'image',
        accessibilityLabel: input.accessibilityLabel,
        accessibilityHint: input.accessibilityHint,
        accessibilityElementsHidden: input.accessibilityElementsHidden,
        importantForAccessibility: input.importantForAccessibility,
      },
      adjustedColor: input.color,
      touchTargetPadding: 0,
      shouldDisableAnimations: false,
      isHighContrast: false,
    };

    // Return defaults if no accessibility context
    if (!accessibility) {
      return defaults;
    }

    const { config, getLabel, getContrastColor, shouldDisableAnimations, isHighContrast } =
      accessibility;

    // Determine accessibility role
    const role: AccessibilityRole = input.accessibilityRole ?? config.defaultRole;

    // Generate label
    const label = input.accessibilityElementsHidden
      ? undefined
      : getLabel(input.iconName, input.accessibilityLabel);

    // Calculate touch target padding for interactive icons
    const touchTargetPadding =
      input.isInteractive && input.size
        ? calculateTouchTargetPadding(input.size, config.minTouchTargetSize)
        : 0;

    // Adjust color for high contrast if needed
    const shouldUseHighContrast = input.highContrast ?? isHighContrast;
    // Use adjustForHighContrast directly when prop is set, otherwise use context's getContrastColor
    const adjustedColor =
      input.color && shouldUseHighContrast
        ? input.highContrast
          ? adjustForHighContrast(input.color)
          : getContrastColor(input.color)
        : input.color;

    return {
      accessibilityProps: {
        accessible: !input.accessibilityElementsHidden,
        accessibilityLabel: label,
        accessibilityHint: input.accessibilityHint,
        accessibilityRole: role,
        accessibilityElementsHidden: input.accessibilityElementsHidden,
        importantForAccessibility: input.importantForAccessibility,
      },
      adjustedColor,
      touchTargetPadding,
      shouldDisableAnimations: shouldDisableAnimations(),
      isHighContrast: shouldUseHighContrast,
    };
  }, [
    accessibility,
    input.iconName,
    input.size,
    input.accessibilityLabel,
    input.accessibilityHint,
    input.accessibilityRole,
    input.highContrast,
    input.accessibilityElementsHidden,
    input.importantForAccessibility,
    input.color,
    input.isInteractive,
  ]);
}

/**
 * Higher-order component props enhancer
 * Use this to add accessibility to existing icon components
 */
export function withAccessibility<P extends AccessibleIconProps>(
  props: P & UseAccessibleIconInput
): P & UseAccessibleIconOutput['accessibilityProps'] {
  // This is a simple merge for use without hooks (SSR, etc.)
  return {
    ...props,
    accessible: !props.accessibilityElementsHidden,
    accessibilityRole: props.accessibilityRole ?? 'image',
  };
}

export default useAccessibleIcon;
