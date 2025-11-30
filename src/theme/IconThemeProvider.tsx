/**
 * IconThemeProvider
 * Provides global theme configuration for all icon components
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
 * @example With placeholder defaults
 * ```tsx
 * <IconThemeProvider
 *   theme={{
 *     size: 24,
 *     color: '#1a1a1a',
 *     placeholder: 'shimmer',
 *     placeholderColor: '#f0f0f0',
 *   }}
 * >
 *   <YourApp />
 * </IconThemeProvider>
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
  const [theme, setThemeState] = useState<IconTheme>(() => mergeWithDefaults(initialTheme));

  // Memoized setTheme that supports both direct value and updater function
  const setTheme = useCallback((newTheme: IconTheme | ((prev: IconTheme) => IconTheme)) => {
    setThemeState((prevTheme) => {
      const nextTheme = typeof newTheme === 'function' ? newTheme(prevTheme) : newTheme;
      return mergeWithDefaults(nextTheme);
    });
  }, []);

  // Update internal state when prop changes
  React.useEffect(() => {
    setThemeState(mergeWithDefaults(initialTheme));
  }, [initialTheme]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<IconThemeContextValue>(
    () => ({
      theme,
      setTheme,
    }),
    [theme, setTheme]
  );

  return <IconThemeContext.Provider value={contextValue}>{children}</IconThemeContext.Provider>;
}

IconThemeProviderComponent.displayName = 'IconThemeProvider';

export const IconThemeProvider = memo(IconThemeProviderComponent);
