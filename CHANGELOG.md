# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
