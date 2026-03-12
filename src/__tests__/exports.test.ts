/**
 * Barrel Export Completeness Tests
 *
 * Verifies that all public APIs are properly exported from the main barrel
 * (src/index.ts) and sub-entry points (src/dev/index.ts), and that
 * dev-only exports do not leak into the main entry.
 */

import * as MainExports from '../index';
import * as DevExports from '../dev/index';

describe('Barrel exports', () => {
  // ---------------------------------------------------------------
  // Main entry point: rn-iconify
  // ---------------------------------------------------------------
  describe('Main entry (rn-iconify)', () => {
    // Core
    it.each(['createIconSet', 'IconLoadError'])('should export %s (Core)', (name) => {
      expect(MainExports).toHaveProperty(name);
    });

    // Theme System
    it.each([
      'IconThemeProvider',
      'IconThemeContext',
      'useIconTheme',
      'useIconThemeValue',
      'useMergedIconProps',
      'DEFAULT_ICON_THEME',
      'mergeWithDefaults',
    ])('should export %s (Theme)', (name) => {
      expect(MainExports).toHaveProperty(name);
    });

    // Alias System
    it.each([
      'Icon',
      'IconAliasProvider',
      'IconAliasContext',
      'useIconAliasContext',
      'useResolveIcon',
      'createIconAliases',
      'defineAliases',
    ])('should export %s (Alias)', (name) => {
      expect(MainExports).toHaveProperty(name);
    });

    // Cache
    it.each(['CacheManager'])('should export %s (Cache)', (name) => {
      expect(MainExports).toHaveProperty(name);
    });

    // Configuration
    it.each([
      'configure',
      'resetConfiguration',
      'getConfiguration',
      'ConfigManager',
      'DEFAULT_CONFIG',
    ])('should export %s (Config)', (name) => {
      expect(MainExports).toHaveProperty(name);
    });

    // Network / API
    it.each([
      'fetchIcon',
      'fetchIconsBatch',
      'parseIconName',
      'checkAPIHealth',
      'getAPIBaseUrl',
      'fetchCollection',
      'searchIconsAPI',
    ])('should export %s (Network)', (name) => {
      expect(MainExports).toHaveProperty(name);
    });

    // Native Module Utilities
    it.each(['getNativeIconify', 'isNativeModuleAvailable'])(
      'should export %s (Native)',
      (name) => {
        expect(MainExports).toHaveProperty(name);
      }
    );

    // Offline Bundle
    it.each([
      'loadOfflineBundle',
      'loadOfflineBundleAsync',
      'isBundleCompatible',
      'getBundleStats',
    ])('should export %s (Bundle)', (name) => {
      expect(MainExports).toHaveProperty(name);
    });

    // Placeholder Components
    it.each(['Skeleton', 'Pulse', 'Shimmer', 'PlaceholderFactory', 'DEFAULT_PLACEHOLDER_CONFIG'])(
      'should export %s (Placeholder)',
      (name) => {
        expect(MainExports).toHaveProperty(name);
      }
    );

    // Animation System
    it.each([
      'AnimatedIcon',
      'useIconAnimation',
      'ANIMATION_PRESETS',
      'resolveAnimation',
      'isAnimationPreset',
      'getEasingFunction',
      'getDefaultDuration',
      'getDefaultLoop',
      'DEFAULT_ANIMATION_DURATIONS',
      'DEFAULT_ANIMATION_LOOPS',
    ])('should export %s (Animation)', (name) => {
      expect(MainExports).toHaveProperty(name);
    });

    // Accessibility
    it.each([
      'AccessibilityProvider',
      'AccessibilityContext',
      'useAccessibilityContext',
      'useAccessibility',
      'useAccessibleIcon',
      'withAccessibility',
      'defaultLabelGenerator',
      'adjustForHighContrast',
      'meetsContrastRequirement',
      'getHighContrastAlternative',
      'calculateTouchTargetPadding',
      'DEFAULT_ACCESSIBILITY_CONFIG',
    ])('should export %s (Accessibility)', (name) => {
      expect(MainExports).toHaveProperty(name);
    });

    // React Navigation Integration
    it.each([
      'createTabBarIcon',
      'createTabBarIcons',
      'tabIcon',
      'createDrawerIcon',
      'createDrawerIcons',
      'createHeaderIcon',
      'createBackIcon',
      'createCloseIcon',
      'createMenuIcon',
      'useNavigationIcon',
      'DEFAULT_NAVIGATION_PRESETS',
    ])('should export %s (Navigation)', (name) => {
      expect(MainExports).toHaveProperty(name);
    });

    // Utility functions defined at top level
    it.each(['prefetchIcons', 'clearCache', 'getCacheStats'])(
      'should export %s (Utility)',
      (name) => {
        expect(MainExports).toHaveProperty(name);
      }
    );
  });

  // ---------------------------------------------------------------
  // Dev entry point: rn-iconify/dev
  // ---------------------------------------------------------------
  describe('Dev entry (rn-iconify/dev)', () => {
    // Icon Explorer
    it.each([
      'IconExplorer',
      'ExplorerContext',
      'useExplorerContext',
      'useExplorer',
      'getAllIconSets',
      'getIconSetByPrefix',
      'getIconSetsByCategory',
      'searchIconSets',
      'generateImportStatement',
      'generateIconJSX',
      'POPULAR_ICON_SETS',
      'DEFAULT_PREVIEW_CONFIG',
      'DEFAULT_EXPLORER_CONFIG',
    ])('should export %s (Explorer)', (name) => {
      expect(DevExports).toHaveProperty(name);
    });

    // Performance Monitoring
    it.each([
      'PerformanceMonitor',
      'enablePerformanceMonitoring',
      'disablePerformanceMonitoring',
      'getPerformanceReport',
      'printPerformanceReport',
    ])('should export %s (Performance)', (name) => {
      expect(DevExports).toHaveProperty(name);
    });
  });

  // ---------------------------------------------------------------
  // Dev-only exports must NOT appear in the main entry
  // ---------------------------------------------------------------
  describe('Dev-only exports not in main', () => {
    it.each([
      'IconExplorer',
      'ExplorerContext',
      'useExplorerContext',
      'useExplorer',
      'getAllIconSets',
      'getIconSetByPrefix',
      'getIconSetsByCategory',
      'searchIconSets',
      'generateImportStatement',
      'generateIconJSX',
      'POPULAR_ICON_SETS',
      'DEFAULT_PREVIEW_CONFIG',
      'DEFAULT_EXPLORER_CONFIG',
      'PerformanceMonitor',
      'enablePerformanceMonitoring',
      'disablePerformanceMonitoring',
      'getPerformanceReport',
      'printPerformanceReport',
    ])('should NOT export %s from main entry', (name) => {
      expect(MainExports).not.toHaveProperty(name);
    });
  });
});
