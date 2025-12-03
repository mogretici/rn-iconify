/**
 * rn-iconify
 * 268,000+ Iconify icons for React Native with native MMKV caching
 *
 * @example
 * ```tsx
 * import { Mdi, Heroicons, Lucide, Ph, Feather } from 'rn-iconify';
 *
 * <Mdi name="home" size={24} color="blue" />
 * <Heroicons name="user" size={24} color="red" />
 * <Lucide name="camera" size={24} />
 * <Ph name="house" size={24} />
 * ```
 */

// Icon Set Components (200+ sets, 268,000+ icons)
export * from './components';

// Core Types
export type {
  IconProps,
  IconRotation,
  IconFlip,
  IconLoadingState,
  IconifyIconData,
  IconifyAPIResponse,
  PlaceholderType,
  PlaceholderPreset,
  PlaceholderConfig,
  // Animation types
  AnimationType,
  AnimationPreset,
  AnimationConfig,
  AnimationEasing,
  AnimationControls,
} from './types';

// Placeholder Components
export {
  Skeleton,
  Pulse,
  Shimmer,
  PlaceholderFactory,
  DEFAULT_PLACEHOLDER_CONFIG,
} from './placeholder';
export type { PlaceholderProps, PlaceholderFactoryProps } from './placeholder';

// Theme System
export {
  IconThemeProvider,
  IconThemeContext,
  useIconTheme,
  useIconThemeValue,
  useMergedIconProps,
  DEFAULT_ICON_THEME,
  mergeWithDefaults,
} from './theme';
export type { IconTheme, IconThemeProviderProps, IconThemeContextValue } from './theme';

// Icon Alias System
export {
  Icon,
  IconAliasProvider,
  IconAliasContext,
  useIconAliasContext,
  useResolveIcon,
  createIconAliases,
  defineAliases,
} from './alias';
export type {
  IconAliasMap,
  IconAliases,
  AliasName,
  GenericIconProps,
  IconAliasContextValue,
  IconAliasProviderProps,
  CreateIconAliasesConfig,
  IconAliasResult,
} from './alias';

// Factory Function (for creating custom icon sets)
export { createIconSet } from './createIconSet';
export type { IconNameType } from './createIconSet';

// Animation System
export {
  AnimatedIcon,
  useIconAnimation,
  ANIMATION_PRESETS,
  resolveAnimation,
  isAnimationPreset,
  getEasingFunction,
  getDefaultDuration,
  getDefaultLoop,
  DEFAULT_ANIMATION_DURATIONS,
  DEFAULT_ANIMATION_LOOPS,
} from './animated';
export type {
  AnimatedIconProps,
  AnimationState,
  ResolvedAnimationConfig,
  AnimationDirection,
} from './animated';

// React Navigation Integration
export {
  createTabBarIcon,
  createTabBarIcons,
  tabIcon,
  createDrawerIcon,
  createDrawerIcons,
  createHeaderIcon,
  createBackIcon,
  createCloseIcon,
  createMenuIcon,
  useNavigationIcon,
  DEFAULT_NAVIGATION_PRESETS,
} from './navigation';
export type {
  TabBarIconProps,
  DrawerIconProps,
  HeaderIconProps,
  TabBarIconConfig,
  DrawerIconConfig,
  TabBarIconFunction,
  DrawerIconFunction,
  HeaderIconFunction,
  HeaderIconConfig,
  IconSpec,
  SimpleTabBarIconConfig,
  NavigationIconPreset,
  UseNavigationIconOptions,
  UseNavigationIconReturn,
} from './navigation';

// Cache Management - import for internal use and re-export
import { CacheManager } from './cache/CacheManager';
export { CacheManager };

// Configuration
export {
  configure,
  resetConfiguration,
  getConfiguration,
  ConfigManager,
  DEFAULT_CONFIG,
} from './config';
export type {
  IconifyConfig,
  IconifyAPIConfig,
  CacheConfig,
  PerformanceConfig,
  ResolvedConfig,
} from './config';

// Network Utilities - import fetchIcon for internal use
import { fetchIcon } from './network/IconifyAPI';
export {
  fetchIcon,
  fetchIconsBatch,
  parseIconName,
  checkAPIHealth,
  getAPIBaseUrl,
  fetchCollection,
  searchIconsAPI,
} from './network/IconifyAPI';
export type { BatchFetchResult, IconifyCollectionInfo } from './network/IconifyAPI';

// Native Module Utilities
export { getNativeIconify, isNativeModuleAvailable } from './native';
export type { PrefetchResult, CacheStats, ModuleConstants, NativeIconifyInterface } from './native';

// Offline Bundle
export {
  loadOfflineBundle,
  loadOfflineBundleAsync,
  isBundleCompatible,
  getBundleStats,
} from './bundle';
export type { IconBundle, BundleLoadResult } from './bundle';

// Performance Monitoring
export {
  PerformanceMonitor,
  enablePerformanceMonitoring,
  disablePerformanceMonitoring,
  getPerformanceReport,
  printPerformanceReport,
} from './performance';
export type {
  IconLoadEvent,
  LoadEventType,
  CacheStatistics,
  PerformanceSummary,
  PerformanceReport,
  PerformanceListener,
} from './performance';

// Accessibility
export {
  AccessibilityProvider,
  AccessibilityContext,
  useAccessibilityContext,
  useAccessibility,
  useAccessibleIcon,
  withAccessibility,
  defaultLabelGenerator,
  adjustForHighContrast,
  meetsContrastRequirement,
  getHighContrastAlternative,
  calculateTouchTargetPadding,
  DEFAULT_ACCESSIBILITY_CONFIG,
} from './accessibility';
export type {
  AccessibilityConfig,
  ResolvedAccessibilityConfig,
  AccessibilityContextValue,
  AccessibleIconProps,
  AccessibilityProviderProps,
  UseAccessibleIconInput,
  UseAccessibleIconOutput,
} from './accessibility';

// Icon Explorer (Dev Mode)
export {
  IconExplorer,
  ExplorerContext,
  useExplorerContext,
  useExplorer,
  getAllIconSets,
  getIconSetByPrefix,
  getIconSetsByCategory,
  searchIconSets,
  generateImportStatement,
  generateIconJSX,
  POPULAR_ICON_SETS,
  DEFAULT_PREVIEW_CONFIG,
  DEFAULT_EXPLORER_CONFIG,
} from './explorer';
export type {
  IconSetInfo,
  SearchResult,
  PreviewConfig,
  ExplorerConfig,
  ResolvedExplorerConfig,
  ExplorerState,
  ExplorerActions,
  ExplorerContextValue,
  IconExplorerProps,
  IconGridProps,
  IconPreviewProps,
  SearchBarProps,
  IconSetFilterProps,
} from './explorer';

/**
 * Prefetch multiple icons into cache
 * Useful for preloading icons before they're needed
 *
 * @example
 * ```tsx
 * import { prefetchIcons } from 'rn-iconify';
 *
 * // Prefetch during app startup
 * await prefetchIcons(['mdi:home', 'mdi:settings', 'heroicons:user']);
 * ```
 */
export async function prefetchIcons(
  iconNames: string[]
): Promise<{ success: string[]; failed: string[] }> {
  return CacheManager.prefetch(iconNames, fetchIcon);
}

/**
 * Clear all cached icons (memory, disk, and native)
 *
 * @example
 * ```tsx
 * import { clearCache } from 'rn-iconify';
 *
 * await clearCache();
 * ```
 */
export async function clearCache(): Promise<void> {
  CacheManager.clear();
  await CacheManager.clearNative();
}

/**
 * Get cache statistics
 *
 * @example
 * ```tsx
 * import { getCacheStats } from 'rn-iconify';
 *
 * const stats = getCacheStats();
 * console.log(`Cached: ${stats.memoryCount} in memory, ${stats.bundledCount} bundled, ${stats.diskCount} on disk`);
 * ```
 */
export function getCacheStats(): {
  memoryCount: number;
  bundledCount: number;
  diskCount: number;
  diskSizeBytes: number;
} {
  return CacheManager.getStats();
}
