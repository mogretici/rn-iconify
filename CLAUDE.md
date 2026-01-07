# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

rn-iconify is a React Native library providing 268,000+ Iconify icons with native MMKV caching and full TypeScript autocomplete. It supports 200+ icon sets and includes features like animation presets, theme providers, and React Navigation integration.

## Build & Development Commands

```bash
# Build the library (outputs to lib/)
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Format code
npm run format
npm run format:check

# Run all tests
npm run test

# Run a single test file
npm test -- src/__tests__/CacheManager.test.ts

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Generate icon set components from Iconify registry
npm run generate-components
```

## Architecture

### Core Icon Rendering Flow

1. **Icon Components** (`src/components/*.tsx`) - 200+ auto-generated components (e.g., `Mdi`, `Heroicons`, `Lucide`) created via `createIconSet()` factory
2. **createIconSet** (`src/createIconSet.tsx`) - Factory that creates typed icon components with theme integration
3. **IconRenderer** (`src/IconRenderer.tsx`) - Core rendering component that handles cache lookup, network fetching, placeholders, and SVG rendering via react-native-svg

### Multi-Layer Cache System

Located in `src/cache/`, the cache follows this priority:

1. **MemoryCache** - In-memory Map, instant access (~0ms)
2. **Bundled Icons** - Pre-bundled at build time via Babel plugin
3. **DiskCache** - MMKV-based persistent storage (~1-5ms via JSI)
4. **Native Cache** - Optional native module for background prefetching
5. **Network** - Fetches from Iconify API as last resort

`CacheManager.ts` orchestrates all cache layers and promotes items up the chain for faster subsequent access.

### Babel Plugin (`src/babel/`)

Build-time optimization that:

- Scans JSX for icon component usage and `prefetchIcons()` calls
- Collects icon names during Metro bundling
- Generates offline icon bundles with pre-fetched SVG data

Key files:

- `plugin.ts` - Main visitor that detects icon usage
- `collector.ts` - Aggregates found icons across files
- `cache-writer.ts` - Generates the bundle file

### CLI (`src/cli/`)

Commands available via `npx rn-iconify`:

- `bundle` - Generate offline icon bundles from source analysis
- `analyze` - Analyze icon usage and output reports

### Module Exports

The package exports multiple entry points:

- `rn-iconify` - Main entry with all icon components and utilities
- `rn-iconify/babel` - Babel plugin for build-time optimization
- `rn-iconify/navigation` - React Navigation helpers (tab icons, drawer icons, header icons)
- `rn-iconify/animated` - Animation presets and utilities

### Key Subsystems

- **Theme** (`src/theme/`) - Global icon styling via `IconThemeProvider`
- **Alias** (`src/alias/`) - Custom icon name mapping via `IconAliasProvider`
- **Animation** (`src/animated/`) - 6 animation presets (spin, pulse, bounce, etc.)
- **Accessibility** (`src/accessibility/`) - A11y utilities and high contrast support
- **Placeholder** (`src/placeholder/`) - Loading states (skeleton, pulse, shimmer)
- **Explorer** (`src/explorer/`) - Dev-mode icon browser component

### Component Generation

`scripts/generate-components.ts` fetches icon metadata from Iconify API and generates typed components in `src/components/`. Each component exports icon names as a const object for TypeScript autocomplete.

## Testing

Tests use Jest with react-native preset. Test files are in `src/__tests__/`. Coverage threshold is 70% for branches, functions, lines, and statements.

## Peer Dependencies

Requires: `react`, `react-native`, `react-native-mmkv`, `react-native-svg`
