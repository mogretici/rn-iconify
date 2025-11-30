/**
 * Accessibility Module for rn-iconify
 * Provides accessibility features for icon components
 *
 * @example
 * ```tsx
 * import { AccessibilityProvider, useAccessibleIcon } from 'rn-iconify';
 *
 * // Wrap your app with AccessibilityProvider
 * function App() {
 *   return (
 *     <AccessibilityProvider config={{ autoLabels: true, highContrast: false }}>
 *       <MyApp />
 *     </AccessibilityProvider>
 *   );
 * }
 *
 * // Use the hook in your components
 * function MyIcon({ name, size, color }) {
 *   const { accessibilityProps, adjustedColor } = useAccessibleIcon({
 *     iconName: name,
 *     size,
 *     color,
 *   });
 *
 *   return <Icon name={name} size={size} color={adjustedColor} {...accessibilityProps} />;
 * }
 * ```
 */

// Types
export type {
  AccessibilityConfig,
  ResolvedAccessibilityConfig,
  AccessibilityContextValue,
  AccessibleIconProps,
} from './types';

// Provider
export {
  AccessibilityProvider,
  AccessibilityContext,
  useAccessibilityContext,
  useAccessibility,
  DEFAULT_ACCESSIBILITY_CONFIG,
} from './AccessibilityProvider';
export type { AccessibilityProviderProps } from './AccessibilityProvider';

// Hook
export { useAccessibleIcon, withAccessibility } from './useAccessibleIcon';
export type { UseAccessibleIconInput, UseAccessibleIconOutput } from './useAccessibleIcon';

// Utilities
export {
  defaultLabelGenerator,
  adjustForHighContrast,
  meetsContrastRequirement,
  getHighContrastAlternative,
  calculateTouchTargetPadding,
} from './utils';

// Default export
export { AccessibilityProvider as default } from './AccessibilityProvider';
