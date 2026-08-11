## [3.2.1](https://github.com/mogretici/rn-iconify/compare/v3.2.0...v3.2.1) (2026-08-11)

### Bug Fixes

- **icons:** ask for an unrecognised name as itself, not as undefined ([#11](https://github.com/mogretici/rn-iconify/issues/11)) ([e604eed](https://github.com/mogretici/rn-iconify/commit/e604eedd5e4ec88fcfecaf5e1b6316f6844685d4))

# [3.2.0](https://github.com/mogretici/rn-iconify/compare/v3.1.5...v3.2.0) (2026-08-11)

### Bug Fixes

- **ci:** stop our own hook from blocking releases ([#9](https://github.com/mogretici/rn-iconify/issues/9)) ([b130a6b](https://github.com/mogretici/rn-iconify/commit/b130a6bb2b5bb3e1e1b2846fbcf5d1080ca6bfbc))

### Features

- make icons fetched at runtime visible, and declarable ([#8](https://github.com/mogretici/rn-iconify/issues/8)) ([a4b785f](https://github.com/mogretici/rn-iconify/commit/a4b785f335fee14a73d85b6015bea412fb751755))

## [3.1.5](https://github.com/mogretici/rn-iconify/compare/v3.1.4...v3.1.5) (2026-08-11)

### Bug Fixes

- resolve aliases that point at a hidden icon ([995752c](https://github.com/mogretici/rn-iconify/commit/995752c86f2f4cc76ea3677f034bcf8be6c77f1a))

## [3.1.4](https://github.com/mogretici/rn-iconify/compare/v3.1.3...v3.1.4) (2026-08-11)

### Bug Fixes

- keep icons Iconify has hidden rather than deleted ([68f948c](https://github.com/mogretici/rn-iconify/commit/68f948c6e8e6971ea39d850b40d4151a378a6e50))

## [3.1.3](https://github.com/mogretici/rn-iconify/compare/v3.1.2...v3.1.3) (2026-08-11)

### Bug Fixes

- emit generated components already formatted ([5d19059](https://github.com/mogretici/rn-iconify/commit/5d1905952643894dc75ce9511866cb8b3bc0fc01))

## [3.1.2](https://github.com/mogretici/rn-iconify/compare/v3.1.1...v3.1.2) (2026-08-11)

### Bug Fixes

- keep icon names that Iconify has renamed ([6d5a526](https://github.com/mogretici/rn-iconify/commit/6d5a526efe63d9a728b707b1614aec50730ac103))

## [3.1.1](https://github.com/mogretici/rn-iconify/compare/v3.1.0...v3.1.1) (2026-08-11)

### Bug Fixes

- let bundlers tree-shake the icon sets ([1c6fba7](https://github.com/mogretici/rn-iconify/commit/1c6fba79654f4ff46c2ddd16ccbc2c333c4aec02))

# [3.1.0](https://github.com/mogretici/rn-iconify/compare/v3.0.3...v3.1.0) (2026-08-08)

### Features

- sync icon sets with Iconify API ([ba30720](https://github.com/mogretici/rn-iconify/commit/ba307209e6655eb08745b241dc1d5998387c8e9c))

## [3.0.3](https://github.com/mogretici/rn-iconify/compare/v3.0.2...v3.0.3) (2026-08-07)

### Bug Fixes

- **network:** stop aborts from crashing on Hermes ([a3c3669](https://github.com/mogretici/rn-iconify/commit/a3c3669af5a79242048347c6126811f78796b748))

## [3.0.2](https://github.com/mogretici/rn-iconify/compare/v3.0.1...v3.0.2) (2026-03-15)

### Bug Fixes

- **cache:** support MMKV v4.x remove() method (replaces deprecated delete()) ([739d913](https://github.com/mogretici/rn-iconify/commit/739d9133e62cef82133e0bad6f4e6f9890de750a))

## [3.0.1](https://github.com/mogretici/rn-iconify/compare/v3.0.0...v3.0.1) (2026-03-12)

### Bug Fixes

- **ci:** ignore attw node10/esm rules for RN library ([d3fdc69](https://github.com/mogretici/rn-iconify/commit/d3fdc69d5890d09571af09d4ebb250d19245a69e))

# [3.0.0](https://github.com/mogretici/rn-iconify/compare/v2.2.1...v3.0.0) (2026-03-12)

- feat!: core engine rewrite, typed errors, accessibility, performance ([d471692](https://github.com/mogretici/rn-iconify/commit/d471692ceb1487f8aef6df7d74820061e2cd4852))

### Bug Fixes

- **ci:** pin react and react-native dev deps for strict npm ci ([4518430](https://github.com/mogretici/rn-iconify/commit/4518430de8d2dc8bf117bf31b824adb124731903))

### BREAKING CHANGES

- IconRenderer rewritten with useReducer
  state machine. SVG colorization regex removed for native
  SvgXml color prop. Rotate prop widened to number.
  Dev exports moved to rn-iconify/dev.
  onError receives IconLoadError instead of Error.

# [3.0.0](https://github.com/mogretici/rn-iconify/compare/v2.2.1...v3.0.0) (2026-03-12)

### BREAKING CHANGES

- **IconRenderer rewrite** — `useReducer` state machine replaces 4 independent `useState` calls. SVG colorization regex removed in favor of `SvgXml` native `color` prop (multi-color icons now render correctly).
- **Rotate prop** — `IconRotation` type widened from `0 | 90 | 180 | 270` to `number` (any degree value).
- **Dev exports moved** — `IconExplorer` and `PerformanceMonitor` runtime exports moved to `rn-iconify/dev`. Type-only exports remain in main entry.
- **Typed errors** — `onError` callback now receives `IconLoadError` (with `.code: 'NOT_FOUND' | 'NETWORK' | 'TIMEOUT' | 'INVALID_SVG'`) instead of generic `Error`.

### Features

- **React.memo + forwardRef** — All icon components (`createIconSet`, `createIconAliases`) wrapped with `React.memo` and `React.forwardRef` for optimal re-render performance and ref access.
- **Auto accessibility** — `accessibilityRole="image"` and auto-generated labels on all icons. `shouldDisableAnimations()` respects system reduce motion. Auto 44dp minimum touch target via `hitSlop`.
- **O(1) LRU cache** — `MemoryCache` rewritten with Map insertion-order LRU. Eviction no longer requires O(n log n) sort.
- **Typed errors** — New `IconLoadError` class with `code` property for consumer-friendly error handling.
- **Deep imports** — `import { Mdi } from 'rn-iconify/icons/Mdi'` for per-icon-set tree-shaking.
- **Dev entry point** — `rn-iconify/dev` for `IconExplorer` and `PerformanceMonitor` (keeps production bundle lean).
- **Fuzzy matching** — `__DEV__` mode shows "Did you mean X?" for misspelled icon names via Levenshtein distance.
- **Shimmer gradient** — Placeholder shimmer effect upgraded from single solid bar to 3 staggered opacity bars.
- **Accessibility** — `isInvertColorsEnabled` replaces incorrect `isBoldTextEnabled` proxy for high contrast detection.

### Bug Fixes

- **Theme infinite loop** — `useState` + `useEffect` anti-pattern replaced with `useMemo` approach. Inline theme props no longer cause infinite re-renders.
- **Animation rotate** — Interpolation now uses `config.from`/`config.to` instead of hardcoded `[0, 360]`.
- **Animation sequence** — `__DEV__` warning instead of silent null for unsupported sequence type.
- **CacheManager** — `loadBundle()` wrapped in `try/finally` to ensure `isLoadingBundle` flag is always reset.
- **Network abort** — Abort signal isolation for concurrent fetch deduplication.
- **Babel plugin** — Stale build detection (>60s auto-reset) with `try/finally` cleanup in `post()` hook.
- **Scanner** — O(n) single-pass regex replaces nested iteration.
- **CLI** — Version reads from `package.json` instead of hardcoded `'1.0.0'`. Parser uses full 200+ component prefix map.

### Package Quality

- **797 tests** across 25 suites (was 523/20 in v2.2.1)
- **81% statement coverage** with enforced thresholds
- **38.5 MB** unpacked (source maps excluded)
- **publint** — 1 warning (bob tooling limitation)
- **size-limit** — Full bundle 687 kB, single icon set 36 kB
- **ESM/CJS** — Proper dual package with `lib/module/package.json` `{"type":"module"}`
- **Conditional exports** — Nested `import`/`require` types for correct module resolution

---

## [2.2.1](https://github.com/mogretici/rn-iconify/compare/v2.2.0...v2.2.1) (2026-02-04)

### Bug Fixes

- resolve project root, scanner validation, and multi-worker dedup ([ddecd27](https://github.com/mogretici/rn-iconify/commit/ddecd27c45abbad4bb661d1568d94c76070e2292))

# [2.2.0](https://github.com/mogretici/rn-iconify/compare/v2.1.1...v2.2.0) (2026-02-03)

### Features

- **babel:** add project scanner, incremental bundles, and auto-inject ([d9d86f1](https://github.com/mogretici/rn-iconify/commit/d9d86f1c5123710c95aab13dc37a0511af2b16ea))
- **metro:** add dev server plugin, warmup, fade-in, and package exports ([e89eb4c](https://github.com/mogretici/rn-iconify/commit/e89eb4c1aec5e3f666b278c7c17753e2c51946bb))

## [2.1.1](https://github.com/mogretici/rn-iconify/compare/v2.1.0...v2.1.1) (2026-01-07)

### Bug Fixes

- add `CLAUDE.md`, update test types, improve caching, CLI, and API handling ([8505d7a](https://github.com/mogretici/rn-iconify/commit/8505d7af945a383e93272b4e812876fa6efa5311))
- bump dependencies and update version ([2da32e2](https://github.com/mogretici/rn-iconify/commit/2da32e23b93e447208798331c9d24b9a6b064e0d))
- bump dependencies and update version ([90cde1d](https://github.com/mogretici/rn-iconify/commit/90cde1db1b4a6fb73e6a18c2274f9bb6e9cf0a05))
- enable trusted publishing for npm releases ([cca7df5](https://github.com/mogretici/rn-iconify/commit/cca7df59e281e9e6fa157352e0742ee184c63bdf))

## [2.1.1](https://github.com/mogretici/rn-iconify/compare/v2.1.0...v2.1.1) (2026-01-07)

### Bug Fixes

- add `CLAUDE.md`, update test types, improve caching, CLI, and API handling ([8505d7a](https://github.com/mogretici/rn-iconify/commit/8505d7af945a383e93272b4e812876fa6efa5311))
- bump dependencies and update version ([2da32e2](https://github.com/mogretici/rn-iconify/commit/2da32e23b93e447208798331c9d24b9a6b064e0d))
- bump dependencies and update version ([90cde1d](https://github.com/mogretici/rn-iconify/commit/90cde1db1b4a6fb73e6a18c2274f9bb6e9cf0a05))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-12-05

### Added

- **Pressable Icons** - All icons now support `onPress`, `onLongPress`, `onPressIn`, `onPressOut` props
- **Press Feedback** - New `pressedStyle` prop for custom visual feedback when pressed
- **Disabled State** - New `disabled` prop to disable press interactions
- **NativeWind Support** - New `className` prop for Tailwind CSS styling with NativeWind
- **Icon Sets Reference** - New documentation page with all icon set prefixes and usage examples

### Changed

- Icons are automatically wrapped in `Pressable` when `onPress` or `onLongPress` is provided (no wrapper needed otherwise)
- Updated `components.mdx` documentation with new props and examples
- Improved JSDoc documentation for `IconProps` interface

### Fixed

- `alias/Icon.tsx` now correctly passes animation and press props to `IconRenderer`

---

## [2.0.1] - 2025-12-04

### Changed

- **Cache Location** - Default cache output path changed to `node_modules/.cache/rn-iconify` (no more `.rn-iconify-cache` in project root)
- Improved documentation build workflow and test coverage
- Added Open Graph and Twitter meta tags for better social sharing

### Fixed

- Logo image source in README

---

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
