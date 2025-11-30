/**
 * IconThemeContext
 * React Context for icon theming
 */

import { createContext } from 'react';
import type { IconThemeContextValue, IconTheme } from './types';
import { DEFAULT_ICON_THEME } from './types';

/**
 * Default context value when no provider is present
 * setTheme is a no-op by default
 */
const defaultContextValue: IconThemeContextValue = {
  theme: DEFAULT_ICON_THEME,
  setTheme: () => {
    if (__DEV__) {
      console.warn(
        '[rn-iconify] setTheme called without IconThemeProvider. ' +
          'Wrap your app with <IconThemeProvider> to enable theme updates.'
      );
    }
  },
};

/**
 * IconThemeContext
 *
 * Provides icon theme configuration to all descendant icon components.
 * Use with IconThemeProvider for proper functionality.
 *
 * @example
 * ```tsx
 * // Access theme directly (prefer useIconTheme hook instead)
 * const { theme, setTheme } = useContext(IconThemeContext);
 * ```
 */
export const IconThemeContext = createContext<IconThemeContextValue>(defaultContextValue);

IconThemeContext.displayName = 'IconThemeContext';

/**
 * Helper to merge theme with defaults
 * Ensures all required properties have values
 */
export function mergeWithDefaults(theme: IconTheme): IconTheme {
  return {
    ...DEFAULT_ICON_THEME,
    ...theme,
  };
}
