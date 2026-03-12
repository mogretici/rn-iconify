/**
 * IconThemeProvider
 * Provides global theme configuration for all icon components
 *
 * v3.0 fix: Replaced useState + useEffect anti-pattern with useMemo.
 * Inline theme props no longer cause infinite re-render loops.
 * setTheme() still works for dynamic theme switching via internal override state.
 */

import React, { useState, useMemo, useCallback, memo } from 'react';
import { IconThemeContext, mergeWithDefaults } from './context';
import type { IconThemeProviderProps, IconTheme, IconThemeContextValue } from './types';

/**
 * IconThemeProvider
 *
 * Wraps your app to provide global icon theming.
 * All descendant icon components will inherit these defaults.
 *
 * @example Basic usage
 * ```tsx
 * import { IconThemeProvider } from 'rn-iconify';
 *
 * export default function App() {
 *   return (
 *     <IconThemeProvider theme={{ size: 20, color: '#333' }}>
 *       <YourApp />
 *     </IconThemeProvider>
 *   );
 * }
 * ```
 *
 * @example Dynamic theme switching
 * ```tsx
 * function App() {
 *   const [isDark, setIsDark] = useState(false);
 *
 *   return (
 *     <IconThemeProvider
 *       theme={{
 *         color: isDark ? '#ffffff' : '#000000',
 *         placeholderColor: isDark ? '#333333' : '#e1e1e1',
 *       }}
 *     >
 *       <YourApp />
 *     </IconThemeProvider>
 *   );
 * }
 * ```
 */
function IconThemeProviderComponent({
  theme: initialTheme,
  children,
}: IconThemeProviderProps): React.ReactElement {
  // Derive theme from prop (no useState + useEffect cycle)
  const externalTheme = useMemo(() => mergeWithDefaults(initialTheme), [initialTheme]);

  // Internal override state for setTheme() API
  const [overrideTheme, setOverrideTheme] = useState<IconTheme | null>(null);

  // When external theme changes, clear any override
  const prevExternalRef = React.useRef(externalTheme);
  if (prevExternalRef.current !== externalTheme) {
    prevExternalRef.current = externalTheme;
    if (overrideTheme !== null) {
      setOverrideTheme(null);
    }
  }

  const effectiveTheme = overrideTheme ?? externalTheme;

  // setTheme supports both direct value and updater function
  const setTheme = useCallback(
    (newTheme: IconTheme | ((prev: IconTheme) => IconTheme)) => {
      setOverrideTheme((prevOverride) => {
        const current = prevOverride ?? externalTheme;
        const nextTheme = typeof newTheme === 'function' ? newTheme(current) : newTheme;
        return mergeWithDefaults(nextTheme);
      });
    },
    [externalTheme]
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<IconThemeContextValue>(
    () => ({
      theme: effectiveTheme,
      setTheme,
    }),
    [effectiveTheme, setTheme]
  );

  return <IconThemeContext.Provider value={contextValue}>{children}</IconThemeContext.Provider>;
}

IconThemeProviderComponent.displayName = 'IconThemeProvider';

export const IconThemeProvider = memo(IconThemeProviderComponent);
