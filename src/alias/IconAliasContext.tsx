/**
 * Icon Alias Context
 * Provides alias resolution throughout the component tree
 */

import React, { createContext, useContext, useMemo, useCallback, useState } from 'react';
import type { IconAliasContextValue, IconAliasProviderProps, IconAliasMap } from './types';

/**
 * Default context value (no aliases)
 */
const defaultContextValue: IconAliasContextValue = {
  aliases: {},
  resolveIcon: (name: string) => name,
  isAlias: () => false,
  registerAliases: () => {},
};

/**
 * Icon Alias Context
 */
export const IconAliasContext = createContext<IconAliasContextValue>(defaultContextValue);

/**
 * Hook to access icon alias context
 *
 * @example
 * ```tsx
 * const { resolveIcon, isAlias } = useIconAliasContext();
 * const fullName = resolveIcon('back'); // 'mdi:arrow-left'
 * ```
 */
export function useIconAliasContext(): IconAliasContextValue {
  return useContext(IconAliasContext);
}

/**
 * Hook to resolve an icon name (alias or full name)
 *
 * @example
 * ```tsx
 * const resolvedName = useResolveIcon('back'); // 'mdi:arrow-left'
 * const resolvedName2 = useResolveIcon('mdi:home'); // 'mdi:home'
 * ```
 */
export function useResolveIcon(name: string): string {
  const { resolveIcon } = useIconAliasContext();
  return resolveIcon(name);
}

/**
 * Check if a name is a full icon name (contains colon)
 */
function isFullIconName(name: string): boolean {
  return name.includes(':');
}

/**
 * Validate icon name format
 */
function validateIconName(name: string, source: string): void {
  if (!name || typeof name !== 'string') {
    console.warn(`[rn-iconify] Invalid icon name in ${source}: ${name}`);
    return;
  }

  if (!isFullIconName(name)) {
    console.warn(
      `[rn-iconify] Alias "${source}" should map to a full icon name (prefix:name format), got: "${name}"`
    );
  }
}

/**
 * Icon Alias Provider
 * Provides alias resolution to all child components
 *
 * @example
 * ```tsx
 * const aliases = {
 *   back: 'mdi:arrow-left',
 *   menu: 'heroicons:bars-3',
 * };
 *
 * <IconAliasProvider aliases={aliases}>
 *   <App />
 * </IconAliasProvider>
 * ```
 */
export function IconAliasProvider({
  aliases: initialAliases,
  extend = true,
  children,
}: IconAliasProviderProps) {
  const parentContext = useContext(IconAliasContext);
  const [dynamicAliases, setDynamicAliases] = useState<IconAliasMap>({});

  // Merge aliases: parent (if extend) + initial + dynamic
  const mergedAliases = useMemo(() => {
    const base = extend ? { ...parentContext.aliases } : {};
    return {
      ...base,
      ...initialAliases,
      ...dynamicAliases,
    };
  }, [parentContext.aliases, initialAliases, dynamicAliases, extend]);

  // Validate aliases in development
  if (__DEV__) {
    Object.entries(initialAliases).forEach(([alias, iconName]) => {
      validateIconName(iconName, alias);
    });
  }

  // Resolve icon name
  const resolveIcon = useCallback(
    (name: string): string => {
      // If it's already a full icon name, return as-is
      if (isFullIconName(name)) {
        return name;
      }

      // Look up in aliases
      const resolved = mergedAliases[name];
      if (resolved) {
        return resolved;
      }

      // Not found - warn in dev and return original
      if (__DEV__) {
        console.warn(
          `[rn-iconify] Unknown icon alias "${name}". ` +
            `Use a full icon name (prefix:name) or register the alias.`
        );
      }

      return name;
    },
    [mergedAliases]
  );

  // Check if name is a registered alias
  const isAlias = useCallback(
    (name: string): boolean => {
      return name in mergedAliases;
    },
    [mergedAliases]
  );

  // Register additional aliases at runtime
  const registerAliases = useCallback((newAliases: IconAliasMap) => {
    if (__DEV__) {
      Object.entries(newAliases).forEach(([alias, iconName]) => {
        validateIconName(iconName, alias);
      });
    }

    setDynamicAliases((prev) => ({
      ...prev,
      ...newAliases,
    }));
  }, []);

  const contextValue = useMemo<IconAliasContextValue>(
    () => ({
      aliases: mergedAliases,
      resolveIcon,
      isAlias,
      registerAliases,
    }),
    [mergedAliases, resolveIcon, isAlias, registerAliases]
  );

  return <IconAliasContext.Provider value={contextValue}>{children}</IconAliasContext.Provider>;
}

/**
 * Default export for convenience
 */
export default IconAliasProvider;
