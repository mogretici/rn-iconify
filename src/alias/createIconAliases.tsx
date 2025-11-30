/**
 * createIconAliases - Factory function for creating type-safe icon aliases
 * Provides full TypeScript autocomplete for alias names
 */

import React from 'react';
import { IconRenderer } from '../IconRenderer';
import { useIconTheme } from '../theme';
import { DEFAULT_ICON_THEME } from '../theme/types';
import { IconAliasProvider as BaseProvider } from './IconAliasContext';
import type {
  IconAliasMap,
  IconAliases,
  AliasName,
  GenericIconProps,
  CreateIconAliasesConfig,
  IconAliasResult,
} from './types';

/**
 * Validate that all alias values are valid icon names
 */
function validateAliases<T extends IconAliasMap>(aliases: T): void {
  Object.entries(aliases).forEach(([alias, iconName]) => {
    if (typeof iconName !== 'string') {
      throw new Error(
        `[rn-iconify] Invalid alias value for "${alias}": expected string, got ${typeof iconName}`
      );
    }

    if (!iconName.includes(':')) {
      throw new Error(
        `[rn-iconify] Invalid icon name for alias "${alias}": "${iconName}". ` +
          `Icon names must be in "prefix:name" format (e.g., "mdi:home").`
      );
    }
  });
}

/**
 * Create a type-safe icon alias system
 *
 * This function creates:
 * - A typed Icon component with autocomplete for alias names
 * - A Provider component to wrap your app
 * - A resolve function to convert aliases to full icon names
 *
 * @example Basic usage
 * ```tsx
 * // icons.ts
 * import { createIconAliases } from 'rn-iconify';
 *
 * export const { Icon, Provider: IconProvider, aliases } = createIconAliases({
 *   aliases: {
 *     back: 'mdi:arrow-left',
 *     forward: 'mdi:arrow-right',
 *     menu: 'heroicons:bars-3',
 *     close: 'mdi:close',
 *     home: 'mdi:home',
 *     settings: 'lucide:settings',
 *   } as const,
 * });
 *
 * // App.tsx
 * import { Icon, IconProvider } from './icons';
 *
 * function App() {
 *   return (
 *     <IconProvider>
 *       <Icon name="back" size={24} />    {// TypeScript autocomplete! }
 *       <Icon name="menu" color="blue" />
 *     </IconProvider>
 *   );
 * }
 * ```
 *
 * @example With navigation
 * ```tsx
 * import { Icon } from './icons';
 *
 * <Tab.Screen
 *   options={{
 *     tabBarIcon: ({ color, size }) => (
 *       <Icon name="home" color={color} size={size} />
 *     ),
 *   }}
 * />
 * ```
 */
export function createIconAliases<T extends IconAliasMap>(
  config: CreateIconAliasesConfig<T>
): IconAliasResult<T> {
  const { aliases, validate = true } = config;

  // Validate in development
  if (__DEV__ && validate) {
    validateAliases(aliases);
  }

  // Create resolve function
  const resolve = (name: AliasName<T> | string): string => {
    // If it's already a full icon name, return as-is
    if (name.includes(':')) {
      return name;
    }

    // Look up in aliases
    const resolved = (aliases as IconAliasMap)[name];
    if (resolved) {
      return resolved;
    }

    // Not found - warn in dev
    if (__DEV__) {
      console.warn(
        `[rn-iconify] Unknown alias "${name}". Available aliases: ${Object.keys(aliases).join(', ')}`
      );
    }

    return name;
  };

  /**
   * Type-safe Icon component with alias support
   */
  function TypedIcon({
    name,
    size,
    color,
    width,
    height,
    style,
    rotate,
    flip,
    fallback,
    fallbackDelay,
    placeholder,
    placeholderColor,
    placeholderDuration,
    onLoad,
    onError,
    accessibilityLabel,
    testID,
  }: GenericIconProps<AliasName<T>>) {
    // Get theme defaults
    const { theme } = useIconTheme();

    // Resolve the icon name
    const resolvedName = resolve(name);

    // Merge props with theme defaults
    const mergedSize = size ?? theme.size ?? DEFAULT_ICON_THEME.size;
    const mergedColor = color ?? theme.color ?? DEFAULT_ICON_THEME.color;
    const mergedRotate = rotate ?? theme.rotate ?? DEFAULT_ICON_THEME.rotate;
    const mergedFlip = flip ?? theme.flip;
    const mergedFallbackDelay =
      fallbackDelay ?? theme.fallbackDelay ?? DEFAULT_ICON_THEME.fallbackDelay;
    const mergedPlaceholder = placeholder ?? theme.placeholder;
    const mergedPlaceholderColor =
      placeholderColor ?? theme.placeholderColor ?? DEFAULT_ICON_THEME.placeholderColor;
    const mergedPlaceholderDuration =
      placeholderDuration ?? theme.placeholderDuration ?? DEFAULT_ICON_THEME.placeholderDuration;

    return (
      <IconRenderer
        iconName={resolvedName}
        size={mergedSize}
        color={mergedColor}
        width={width}
        height={height}
        style={style}
        rotate={mergedRotate}
        flip={mergedFlip}
        fallback={fallback}
        fallbackDelay={mergedFallbackDelay}
        placeholder={mergedPlaceholder}
        placeholderColor={mergedPlaceholderColor}
        placeholderDuration={mergedPlaceholderDuration}
        onLoad={onLoad}
        onError={onError}
        accessibilityLabel={accessibilityLabel ?? name}
        testID={testID}
      />
    );
  }

  TypedIcon.displayName = 'TypedIcon';

  /**
   * Provider component (pre-configured with aliases)
   */
  function Provider({ children }: { children: React.ReactNode }) {
    return <BaseProvider aliases={aliases}>{children}</BaseProvider>;
  }

  Provider.displayName = 'IconAliasProvider';

  return {
    aliases: aliases as IconAliases<T>,
    Icon: TypedIcon,
    Provider,
    resolve,
    // Type helper - this is just for type inference, not a runtime value
    AliasName: '' as AliasName<T>,
  };
}

/**
 * Quick helper to create aliases without full type safety
 * Useful for simple cases or when aliases are dynamic
 *
 * @example
 * ```tsx
 * import { defineAliases, Icon, IconAliasProvider } from 'rn-iconify';
 *
 * const aliases = defineAliases({
 *   back: 'mdi:arrow-left',
 *   menu: 'heroicons:bars-3',
 * });
 *
 * <IconAliasProvider aliases={aliases}>
 *   <Icon name="back" />
 * </IconAliasProvider>
 * ```
 */
export function defineAliases<T extends IconAliasMap>(aliases: T): T {
  if (__DEV__) {
    validateAliases(aliases);
  }
  return aliases;
}

export default createIconAliases;
