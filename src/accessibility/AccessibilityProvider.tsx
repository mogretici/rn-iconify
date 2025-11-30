/**
 * Accessibility Provider for rn-iconify
 * Provides accessibility context to all icon components
 */

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import type { AccessibilityRole } from 'react-native';
import type {
  AccessibilityConfig,
  ResolvedAccessibilityConfig,
  AccessibilityContextValue,
} from './types';
import { defaultLabelGenerator, adjustForHighContrast } from './utils';

/**
 * Default accessibility configuration
 */
export const DEFAULT_ACCESSIBILITY_CONFIG: ResolvedAccessibilityConfig = {
  autoLabels: true,
  labelGenerator: defaultLabelGenerator,
  highContrast: false,
  respectReducedMotion: true,
  defaultRole: 'image' as AccessibilityRole,
  showFocusIndicators: true,
  minTouchTargetSize: 44,
};

/**
 * Accessibility context
 */
export const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

/**
 * Props for AccessibilityProvider
 */
export interface AccessibilityProviderProps {
  /**
   * Initial accessibility configuration
   */
  config?: AccessibilityConfig;

  /**
   * Children components
   */
  children: React.ReactNode;
}

/**
 * Accessibility Provider Component
 * Wraps your app to provide accessibility features to all icons
 *
 * @example
 * ```tsx
 * import { AccessibilityProvider } from 'rn-iconify';
 *
 * function App() {
 *   return (
 *     <AccessibilityProvider config={{ autoLabels: true }}>
 *       <MyApp />
 *     </AccessibilityProvider>
 *   );
 * }
 * ```
 */
export function AccessibilityProvider({
  config: initialConfig,
  children,
}: AccessibilityProviderProps): React.ReactElement {
  // Resolved configuration state
  const [config, setConfigState] = useState<ResolvedAccessibilityConfig>(() => ({
    ...DEFAULT_ACCESSIBILITY_CONFIG,
    ...initialConfig,
    labelGenerator: initialConfig?.labelGenerator ?? DEFAULT_ACCESSIBILITY_CONFIG.labelGenerator,
  }));

  // System preferences
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);

  // Listen for reduced motion preference
  useEffect(() => {
    const checkReducedMotion = async () => {
      try {
        const isReducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
        setPrefersReducedMotion(isReducedMotion);
      } catch {
        // Ignore errors on unsupported platforms
      }
    };

    checkReducedMotion();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setPrefersReducedMotion
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  // Listen for high contrast preference (iOS only, via bold text as proxy)
  useEffect(() => {
    const checkHighContrast = async () => {
      try {
        // Use bold text as a proxy for high contrast preference
        const isBoldText = await AccessibilityInfo.isBoldTextEnabled();
        setIsHighContrast(isBoldText);
      } catch {
        // Ignore errors on unsupported platforms
      }
    };

    checkHighContrast();

    const subscription = AccessibilityInfo.addEventListener('boldTextChanged', setIsHighContrast);

    return () => {
      subscription?.remove();
    };
  }, []);

  // Update config handler
  const setConfig = useCallback((newConfig: Partial<AccessibilityConfig>) => {
    setConfigState((prev) => ({
      ...prev,
      ...newConfig,
      labelGenerator: newConfig.labelGenerator ?? prev.labelGenerator,
    }));
  }, []);

  // Destructure config for stable dependencies
  const { autoLabels, labelGenerator, highContrast, respectReducedMotion } = config;

  // Get label for icon
  const getLabel = useCallback(
    (iconName: string, customLabel?: string): string | undefined => {
      // Custom label takes precedence
      if (customLabel) return customLabel;

      // Return undefined if auto-labels are disabled
      if (!autoLabels) return undefined;

      // Generate label using configured generator
      return labelGenerator(iconName);
    },
    [autoLabels, labelGenerator]
  );

  // Get contrast-adjusted color
  const getContrastColor = useCallback(
    (color: string): string => {
      // Check if high contrast should be applied
      const shouldApplyHighContrast = highContrast || isHighContrast;

      if (shouldApplyHighContrast) {
        return adjustForHighContrast(color);
      }

      return color;
    },
    [highContrast, isHighContrast]
  );

  // Check if animations should be disabled
  const shouldDisableAnimations = useCallback((): boolean => {
    if (!respectReducedMotion) return false;
    return prefersReducedMotion;
  }, [respectReducedMotion, prefersReducedMotion]);

  // Context value
  const contextValue = useMemo<AccessibilityContextValue>(
    () => ({
      config,
      prefersReducedMotion,
      isHighContrast,
      setConfig,
      getLabel,
      getContrastColor,
      shouldDisableAnimations,
    }),
    [
      config,
      prefersReducedMotion,
      isHighContrast,
      setConfig,
      getLabel,
      getContrastColor,
      shouldDisableAnimations,
    ]
  );

  return (
    <AccessibilityContext.Provider value={contextValue}>{children}</AccessibilityContext.Provider>
  );
}

/**
 * Hook to access accessibility context
 * Throws if used outside AccessibilityProvider
 */
export function useAccessibilityContext(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider');
  }
  return context;
}

/**
 * Hook to safely access accessibility context
 * Returns null if used outside AccessibilityProvider
 */
export function useAccessibility(): AccessibilityContextValue | null {
  return useContext(AccessibilityContext);
}

export default AccessibilityProvider;
