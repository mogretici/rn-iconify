# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-XX

### Added

- Initial release with 212 icon sets and 268,000+ icons
- Expo Vector Icons-style API (`<Mdi name="home" />`)
- Full TypeScript autocomplete for all icon names
- MMKV-based disk caching (30x faster than AsyncStorage)
- Memory caching with LRU eviction
- TurboModule support for React Native New Architecture
- Bridge module fallback for React Native 0.60-0.71
- Background prefetching via native module
- Icon transformations (rotate, flip)
- Loading states with fallback components
- Accessibility support
- Cache management utilities (prefetch, clear, stats)

### Icon Sets

Popular icon sets included:

- Material Design Icons (7,447 icons)
- Heroicons (1,288 icons)
- Lucide (1,650 icons)
- Phosphor (9,072 icons)
- Feather (286 icons)
- Tabler (5,963 icons)
- Bootstrap Icons (2,078 icons)
- Font Awesome 6 & 7
- Remix Icons (3,135 icons)
- Carbon (2,392 icons)
- Fluent UI (18,729 icons)
- Material Symbols (15,049 icons)
- Solar (7,401 icons)
- And 196 more...

### Technical

- React Native 0.60+ support (Old Architecture)
- React Native 0.72+ support (New Architecture with TurboModules)
- iOS 13.0+ support
- Android API 21+ support
- Synchronous cache reads via MMKV JSI bindings
- Request deduplication for concurrent fetches
- Automatic icon name sanitization for TypeScript compatibility

## [Unreleased]

### Planned

- CI/CD workflow for weekly icon sync with Iconify API
- Performance benchmarks documentation
- Example app improvements
