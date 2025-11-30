/**
 * Icon Alias System Types
 * Type definitions for the icon alias feature
 */

import type { IconProps } from '../types';

/**
 * Icon alias definition - maps alias name to full icon name
 * @example { back: 'mdi:arrow-left', menu: 'heroicons:bars-3' }
 */
export type IconAliasMap = Record<string, string>;

/**
 * Type-safe alias configuration
 * Uses 'as const' for full TypeScript inference
 */
export type IconAliases<T extends IconAliasMap> = {
  readonly [K in keyof T]: T[K];
};

/**
 * Extract alias names from an alias map
 */
export type AliasName<T extends IconAliasMap> = keyof T & string;

/**
 * Props for the generic Icon component
 * Accepts either a full icon name (prefix:name) or an alias
 */
export interface GenericIconProps<TAlias extends string = string>
  extends Omit<IconProps<TAlias>, 'name'> {
  /**
   * Icon name - can be:
   * - Full icon name: "mdi:home", "heroicons:user"
   * - Alias name: "back", "menu" (if aliases are configured)
   */
  name: TAlias | string;
}

/**
 * Icon alias context value
 */
export interface IconAliasContextValue {
  /**
   * Registered aliases
   */
  aliases: IconAliasMap;

  /**
   * Resolve an alias or icon name to full icon name
   * @param name Alias or full icon name
   * @returns Full icon name (prefix:name format)
   */
  resolveIcon: (name: string) => string;

  /**
   * Check if a name is a registered alias
   */
  isAlias: (name: string) => boolean;

  /**
   * Register additional aliases at runtime
   */
  registerAliases: (newAliases: IconAliasMap) => void;
}

/**
 * Props for IconAliasProvider
 */
export interface IconAliasProviderProps {
  /**
   * Icon alias definitions
   */
  aliases: IconAliasMap;

  /**
   * Allow extending parent aliases (default: true)
   */
  extend?: boolean;

  /**
   * Children components
   */
  children: React.ReactNode;
}

/**
 * Configuration for createIconAliases
 */
export interface CreateIconAliasesConfig<T extends IconAliasMap> {
  /**
   * Alias definitions
   */
  aliases: T;

  /**
   * Validate icon names at creation time (dev only)
   * @default true
   */
  validate?: boolean;
}

/**
 * Return type for createIconAliases
 */
export interface IconAliasResult<T extends IconAliasMap> {
  /**
   * The alias map
   */
  aliases: IconAliases<T>;

  /**
   * Type-safe Icon component with alias support
   */
  Icon: React.ComponentType<GenericIconProps<AliasName<T>>>;

  /**
   * Provider component for alias context
   */
  Provider: React.ComponentType<{ children: React.ReactNode }>;

  /**
   * Resolve function
   */
  resolve: (name: AliasName<T> | string) => string;

  /**
   * Type helper for alias names
   */
  AliasName: AliasName<T>;
}
