/**
 * Icon Alias System
 * Create custom icon name mappings for consistent usage across your app
 *
 * @example Basic usage
 * ```tsx
 * import { createIconAliases } from 'rn-iconify';
 *
 * const { Icon, Provider } = createIconAliases({
 *   aliases: {
 *     back: 'mdi:arrow-left',
 *     menu: 'heroicons:bars-3',
 *   } as const,
 * });
 *
 * <Provider>
 *   <Icon name="back" />
 * </Provider>
 * ```
 *
 * @example With generic Icon component
 * ```tsx
 * import { Icon, IconAliasProvider } from 'rn-iconify';
 *
 * <IconAliasProvider aliases={{ back: 'mdi:arrow-left' }}>
 *   <Icon name="back" />
 *   <Icon name="mdi:home" />  // Full names still work
 * </IconAliasProvider>
 * ```
 */

// Types
export type {
  IconAliasMap,
  IconAliases,
  AliasName,
  GenericIconProps,
  IconAliasContextValue,
  IconAliasProviderProps,
  CreateIconAliasesConfig,
  IconAliasResult,
} from './types';

// Context and Provider
export {
  IconAliasContext,
  IconAliasProvider,
  useIconAliasContext,
  useResolveIcon,
} from './IconAliasContext';

// Generic Icon component
export { Icon } from './Icon';

// Factory functions
export { createIconAliases, defineAliases } from './createIconAliases';

// Default export
export { createIconAliases as default } from './createIconAliases';
