/**
 * useIconTheme Hook
 * Access and modify icon theme from any component
 */

import { useContext, useMemo } from 'react';
import { IconThemeContext } from './context';
import type { IconTheme, IconThemeContextValue } from './types';
import { DEFAULT_ICON_THEME } from './types';

/**
 * useIconTheme
 *
 * Hook to access and modify the icon theme.
 * Must be used within an IconThemeProvider.
 *
 * @returns Current theme and setTheme function
 *
 * @example Access current theme
 * ```tsx
 * function MyComponent() {
 *   const { theme } = useIconTheme();
 *   console.log('Current icon size:', theme.size);
 *   return <Text>Icon color: {theme.color}</Text>;
 * }
 * ```
 *
 * @example Update theme dynamically
 * ```tsx
 * function ThemeToggle() {
 *   const { theme, setTheme } = useIconTheme();
 *
 *   const toggleDarkMode = () => {
 *     setTheme(prev => ({
 *       ...prev,
 *       color: prev.color === '#000000' ? '#ffffff' : '#000000',
 *     }));
 *   };
 *
 *   return <Button onPress={toggleDarkMode} title="Toggle Dark Mode" />;
 * }
 * ```
 */
export function useIconTheme(): IconThemeContextValue {
  const context = useContext(IconThemeContext);
  return context;
}

/**
 * useIconThemeValue
 *
 * Get a specific theme value with automatic fallback to default.
 * Useful when you need just one property.
 *
 * @param key - Theme property key
 * @returns The theme value or default
 *
 * @example
 * ```tsx
 * function MyIcon() {
 *   const defaultSize = useIconThemeValue('size');
 *   const defaultColor = useIconThemeValue('color');
 *   return <Text>Default: {defaultSize}px, {defaultColor}</Text>;
 * }
 * ```
 */
export function useIconThemeValue<K extends keyof IconTheme>(
  key: K
): NonNullable<IconTheme[K]> | undefined {
  const { theme } = useIconTheme();
  const value = theme[key];
  if (value !== undefined) {
    return value as NonNullable<IconTheme[K]>;
  }
  const defaultValue = DEFAULT_ICON_THEME[key as keyof typeof DEFAULT_ICON_THEME];
  return defaultValue as NonNullable<IconTheme[K]> | undefined;
}

/**
 * useMergedIconProps
 *
 * Merges component props with theme defaults.
 * Props take precedence over theme values.
 *
 * @param props - Component props
 * @returns Merged props with theme defaults
 *
 * @example
 * ```tsx
 * function CustomIcon({ size, color, ...rest }: IconProps) {
 *   const mergedProps = useMergedIconProps({ size, color });
 *   // mergedProps.size = props.size ?? theme.size ?? 24
 *   // mergedProps.color = props.color ?? theme.color ?? '#000000'
 * }
 * ```
 */
export function useMergedIconProps<T extends Partial<IconTheme>>(
  props: T
): T & Required<Pick<IconTheme, 'size' | 'color'>> & Omit<IconTheme, 'size' | 'color'> {
  const { theme } = useIconTheme();

  return useMemo(() => {
    return {
      ...props,
      size: props.size ?? theme.size ?? DEFAULT_ICON_THEME.size,
      color: props.color ?? theme.color ?? DEFAULT_ICON_THEME.color,
      placeholder: props.placeholder ?? theme.placeholder,
      placeholderColor:
        props.placeholderColor ?? theme.placeholderColor ?? DEFAULT_ICON_THEME.placeholderColor,
      placeholderDuration:
        props.placeholderDuration ??
        theme.placeholderDuration ??
        DEFAULT_ICON_THEME.placeholderDuration,
      rotate: props.rotate ?? theme.rotate ?? DEFAULT_ICON_THEME.rotate,
      flip: props.flip ?? theme.flip,
      fallbackDelay: props.fallbackDelay ?? theme.fallbackDelay ?? DEFAULT_ICON_THEME.fallbackDelay,
    } as T & Required<Pick<IconTheme, 'size' | 'color'>> & Omit<IconTheme, 'size' | 'color'>;
  }, [props, theme]);
}
