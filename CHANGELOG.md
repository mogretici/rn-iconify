# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-12-03

### Added

- **Theme System** - `IconThemeProvider` and `useIconTheme` for global icon styling
- **Icon Aliases** - `createIconAliases` and `IconAliasProvider` for custom icon name mappings
- **Animated Icons** - `AnimatedIcon` component with 6 presets (spin, pulse, bounce, shake, ping, wiggle)
- **React Navigation Integration** - `createTabBarIcon`, `createDrawerIcon`, `createHeaderIcon` helpers
- **Accessibility Support** - `AccessibilityProvider`, `useAccessibleIcon`, high contrast mode, reduced motion
- **Performance Monitoring** - `PerformanceMonitor`, `getPerformanceReport`, cache hit rate tracking
- **Icon Explorer** - Interactive dev tool for browsing and testing 268,000+ icons
- **Placeholder System** - Built-in loading states (skeleton, pulse, shimmer)
- **Babel Plugin** - Build-time icon bundling for 0ms first render (`rn-iconify/babel`)
- **CLI Tools** - `npx rn-iconify bundle` and `npx rn-iconify analyze` commands
- **Config Manager** - `configure()` for API, cache, and performance settings
- **Bundle System** - `loadOfflineBundle` for offline icon support
- **Documentation Website** - Full docs at [rn-iconify.vercel.app](https://rn-iconify.vercel.app)

### Changed

- Simplified README (detailed documentation moved to website)
- Enhanced `CacheManager` with bundle support and improved cache layers
- Improved `IconifyAPI` with better error handling, timeout, and retry logic
- Updated example app with comprehensive feature demos

### Compatibility

- React Native 0.60+ (Old Architecture)
- React Native 0.72+ (New Architecture with TurboModules)
- iOS 13.0+
- Android API 21+

---

## [1.0.0] - 2025-11-26

### Added

- Initial release with 200+ icon sets and 268,000+ icons
- Simple component API (`<Mdi name="home" />`)
- Full TypeScript autocomplete for all icon names
- MMKV-based disk caching (30x faster than AsyncStorage)
- Memory caching with LRU eviction
- Native module for background prefetching (iOS & Android)
- TurboModule support for React Native New Architecture
- Bridge module fallback for Old Architecture
- Icon transformations (rotate, flip)
- Loading states with fallback components
- Accessibility support
- Cache management utilities (prefetch, clear, stats)

### Compatibility

- React Native 0.60+ (Old Architecture)
- React Native 0.72+ (New Architecture with TurboModules)
- iOS 13.0+
- Android API 21+
