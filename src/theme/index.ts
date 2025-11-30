/**
 * Theme System
 * Global icon theming and configuration
 */

// Components
export { IconThemeProvider } from './IconThemeProvider';

// Context
export { IconThemeContext, mergeWithDefaults } from './context';

// Hooks
export { useIconTheme, useIconThemeValue, useMergedIconProps } from './useIconTheme';

// Types
export type { IconTheme, IconThemeProviderProps, IconThemeContextValue } from './types';

// Constants
export { DEFAULT_ICON_THEME } from './types';
