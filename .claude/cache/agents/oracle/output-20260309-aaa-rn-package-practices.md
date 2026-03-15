# Research Report: AAA-Quality React Native NPM Package Best Practices (2025-2026)

Generated: 2026-03-09

## Summary

This report covers 10 areas of best practices for AAA-quality React Native npm packages, based on how top packages (react-native-reanimated, react-native-svg, @shopify/flash-list, expo-image, etc.) operate in 2025-2026. The key trends are: ESM-first with the "react-native" condition in exports, react-native-builder-bob as the dominant build tool (now defaulting to ESM-only in v0.40+), Reanimated 3 as the animation standard, and semantic-release or changesets for CI/CD.

---

## Questions Answered

### Q1: Package Structure & Exports

**Answer:** The "react-native" condition in package.json exports is now a first-class citizen in Metro (enabled by default since Metro 0.82 / React Native 0.79). Top packages use it as the highest-priority condition. Builder-bob v0.40+ defaults to ESM-only output.
**Source:** https://metrobundler.dev/docs/package-exports/, https://reactnative.dev/blog/2023/06/21/package-exports-support
**Confidence:** High

### Q2: Build Tooling

**Answer:** react-native-builder-bob is the de facto standard. Version 0.40+ defaults to ESM-only. Some packages still use dual CJS/ESM for broader compatibility.
**Source:** https://github.com/callstack/react-native-builder-bob, https://oss.callstack.com/react-native-builder-bob/esm
**Confidence:** High

### Q3: Icon Library Performance Patterns

**Answer:** Tree-shaking via individual icon imports, SVG-based rendering (not font-based), and context-based default styling are the standard patterns. @expo/vector-icons uses ESM for tree-shaking. phosphor-react-native recommends individual file path imports.
**Source:** https://docs.expo.dev/guides/icons/, https://www.npmjs.com/package/phosphor-react-native
**Confidence:** High

### Q4: Testing Standards

**Answer:** Jest + React Native Testing Library (RNTL), 80% coverage threshold, user-centric queries (getByText, getByTestId), manual mocks for native modules.
**Source:** https://www.creolestudios.com/react-native-testing-with-jest-and-rtl/, https://reactnative.dev/docs/testing-overview
**Confidence:** High

### Q5: Documentation Standards

**Answer:** TypeDoc for API docs, Storybook for component demos, comprehensive README with Quick Start, API tables, and visual examples. The typedoc-storybook-theme bridges both tools.
**Source:** https://github.com/TypeStrong/typedoc, https://www.npmjs.com/package/@storybook/react-native
**Confidence:** Medium

### Q6: CI/CD & Release

**Answer:** semantic-release for fully automated releases; changesets for monorepo or team-reviewed releases. Both are industry standard.
**Source:** https://oleksiipopov.com/blog/npm-release-automation/, https://brianschiller.com/blog/2023/09/18/changesets-vs-semantic-release/
**Confidence:** High

### Q7: Error Handling

**Answer:** `__DEV__` conditional warnings, react-error-boundary for graceful degradation, fallback UI for failed icon loads, global error handlers for native crashes.
**Source:** https://reactnative.dev/docs/debugging, https://javascript.plainenglish.io/building-a-comprehensive-error-handling-system-in-react-native-a-diy-guide-6a67de9436b4
**Confidence:** High

### Q8: Accessibility

**Answer:** WCAG 2.1 compliance: 44x44pt touch targets, 4.5:1 contrast ratio, accessibilityLabel on all icons, accessibilityRole="image" for decorative icons, dynamic announcements for state changes.
**Source:** https://reactnative.dev/docs/accessibility, https://www.accessibilitychecker.org/blog/react-native-accessibility/
**Confidence:** High

### Q9: Animation

**Answer:** Reanimated 3 is the standard for 2025-2026. Runs on UI thread via worklets, 120fps capable, eliminates bridge overhead. Built-in Animated API only for trivial cases.
**Source:** https://docs.swmansion.com/react-native-reanimated/, https://dev.to/erenelagz/react-native-reanimated-3-the-ultimate-guide-to-high-performance-animations-in-2025-4ae4
**Confidence:** High

### Q10: Developer Experience

**Answer:** Zero-config setup, TypeScript-first, helpful **DEV** error messages, auto-linking, sensible defaults, comprehensive types for IDE autocomplete.
**Source:** https://medium.com/@ddylanlinn/npm-package-development-guide-build-publish-and-best-practices-674714b7aef1, https://snyk.io/blog/best-practices-create-modern-npm-package/
**Confidence:** High

---

## Detailed Findings

### Finding 1: Package.json Exports with "react-native" Condition

**Source:** https://metrobundler.dev/docs/package-exports/

The `"react-native"` condition is now a recognized community condition in Metro, analogous to `"node"` and `"deno"`. It was enabled by default in Metro 0.82 (React Native 0.79+). When Metro resolves packages, `unstable_conditionNames` defaults to `['require', 'react-native']`.

**Critical ordering rule:** The `"react-native"` condition MUST come before `"import"` and `"require"` in the exports field, because conditions are evaluated top-to-bottom and the first match wins.

**Gold-standard exports structure for rn-iconify:**

```json
{
  "exports": {
    ".": {
      "react-native": "./src/index.ts",
      "types": "./lib/typescript/index.d.ts",
      "import": "./lib/module/index.js",
      "require": "./lib/commonjs/index.js"
    },
    "./babel": {
      "types": "./lib/typescript/babel/index.d.ts",
      "import": "./lib/module/babel/index.js",
      "require": "./lib/commonjs/babel/index.js"
    },
    "./navigation": {
      "react-native": "./src/navigation/index.ts",
      "types": "./lib/typescript/navigation/index.d.ts",
      "import": "./lib/module/navigation/index.js",
      "require": "./lib/commonjs/navigation/index.js"
    },
    "./animated": {
      "react-native": "./src/animated/index.ts",
      "types": "./lib/typescript/animated/index.d.ts",
      "import": "./lib/module/animated/index.js",
      "require": "./lib/commonjs/animated/index.js"
    },
    "./metro": {
      "types": "./lib/typescript/metro/index.d.ts",
      "import": "./lib/module/metro/index.js",
      "require": "./lib/commonjs/metro/index.js"
    }
  }
}
```

**Key points:**

- The `"react-native"` condition points to **source TypeScript** files, letting Metro use the raw source (faster HMR, no build step during dev).
- `"types"` must come before `"import"`/`"require"` for TypeScript resolution.
- `"./babel"` and `"./metro"` should NOT have a `"react-native"` condition since they run in Node.js, not the RN runtime.
- Avoid `.mjs`/`.cjs` extensions -- they break Metro's platform-specific extension resolution (e.g., `.ios.ts`, `.android.ts`).

**What rn-iconify is currently missing:** The `"react-native"` condition entirely, and `"source"` field in exports. The current `"react-native": "src/index.ts"` at the top level is the legacy approach; exports field conditions are the modern replacement.

### Finding 2: Build Tooling -- react-native-builder-bob

**Source:** https://oss.callstack.com/react-native-builder-bob/esm, https://github.com/callstack/react-native-builder-bob/releases/tag/react-native-builder-bob@0.40.0

**Current state (v0.40+, April 2025):**

- Default template is now **ESM-only** (dropped dual CJS/ESM)
- The recommended `bob` config uses `"module"` target with `"esm": true`
- TypeScript declarations generated separately

**However**, for maximum compatibility, the **dual package approach is still valid** and recommended for libraries that need to work in:

- Jest environments (Jest doesn't natively handle ESM well)
- Older Node.js tools
- Legacy Metro configurations

**rn-iconify's current builder-bob version (^0.23.0) is significantly outdated.** The latest is 0.40.18.

**Recommended bob config for rn-iconify (dual output for max compat):**

```json
{
  "react-native-builder-bob": {
    "source": "src",
    "output": "lib",
    "targets": [
      ["commonjs", { "esm": true }],
      ["module", { "esm": true }],
      ["typescript", { "project": "tsconfig.build.json" }]
    ]
  }
}
```

The `"esm": true` option adds `.js` extensions to import statements in the generated files, which is required for proper ESM resolution.

**Alternative: ESM-only (bleeding edge):**

```json
{
  "react-native-builder-bob": {
    "source": "src",
    "output": "lib",
    "targets": [
      ["module", { "esm": true }],
      ["typescript", { "project": "tsconfig.build.json" }]
    ]
  }
}
```

**Consideration:** ESM-only means consumers must configure Jest to transform your library. For an icon library with 200+ icon set components, the dual approach is safer to avoid friction for consumers.

**Other build tools:**

- **tsup**: Popular for general npm packages, but lacks React Native-specific awareness (platform extensions, Metro compatibility).
- **Custom Babel scripts**: Used by react-native-reanimated due to its unique native module + Babel plugin architecture.
- **Bob remains the community standard** for RN libraries, maintained by Callstack (same team behind react-native-paper, react-navigation).

### Finding 3: Icon Library Performance Patterns

**Sources:** https://docs.expo.dev/guides/icons/, https://www.npmjs.com/package/phosphor-react-native, https://javascript.plainenglish.io/best-react-native-icon-libraries-in-2025-d12272119b09

**How top icon libraries handle performance:**

#### react-native-vector-icons

- Uses **font-based rendering** (TrueType fonts with glyph maps)
- Pros: Fast rendering, small per-icon overhead
- Cons: Requires native linking, large font files bundled even for few icons, no tree-shaking of individual icons
- GlyphMap is loaded entirely even if only 1 icon is used

#### @expo/vector-icons

- Built on react-native-vector-icons but distributed as **ES modules**
- Tree-shaking supported (experimentally in Expo SDK 52+)
- Auto-configures icon fonts
- Still font-based, same fundamental limitations

#### phosphor-react-native

- Uses **SVG-based rendering** (react-native-svg)
- Tree-shaking via individual icon imports: `import { Heart } from 'phosphor-react-native/Heart'`
- Context API for default styling (`<IconContext.Provider value={{...}}>`)
- No caching layer -- icons are inline SVG components
- ~9000 icons, all bundled as React components

#### Key patterns for rn-iconify to follow/improve on:

| Pattern                       | Industry Standard                   | rn-iconify Status                           |
| ----------------------------- | ----------------------------------- | ------------------------------------------- |
| SVG rendering                 | Yes (phosphor, lucide-react-native) | Yes (react-native-svg)                      |
| Multi-layer caching           | Unique to rn-iconify                | Memory -> Bundled -> MMKV -> Network        |
| Tree-shaking                  | Individual icon imports             | 200+ icon set components (good granularity) |
| Build-time bundling           | Not common                          | Babel plugin (ahead of the curve)           |
| Context-based theming         | phosphor does this                  | IconThemeProvider (good)                    |
| Lazy loading / code splitting | Not common in RN                    | Network fetch with cache (good)             |

**rn-iconify's multi-layer cache is actually best-in-class** -- no other RN icon library has Memory -> Bundled -> Disk (MMKV/JSI) -> Network with cache promotion. This is a significant differentiator.

**Bundle size concern:** With 200+ auto-generated icon set components in `src/components/`, even with tree-shaking, the published package is large. Consider:

1. Publishing icon sets as separate packages (`rn-iconify-mdi`, `rn-iconify-lucide`) for ultimate tree-shaking
2. Or documenting that consumers should only import specific icon set components

### Finding 4: Testing Standards

**Sources:** https://www.creolestudios.com/react-native-testing-with-jest-and-rtl/, https://reactnative.dev/docs/testing-overview, https://www.browserstack.com/guide/top-react-testing-libraries

**AAA-quality testing stack:**

| Layer           | Tool                                 | Purpose                                       |
| --------------- | ------------------------------------ | --------------------------------------------- |
| Unit tests      | Jest                                 | Business logic, utilities, cache layers       |
| Component tests | RNTL (@testing-library/react-native) | UI rendering, user interaction                |
| Snapshot tests  | Jest snapshots                       | Regression detection for rendered SVGs        |
| E2E tests       | Detox or Maestro                     | Full app integration (optional for libraries) |
| Type tests      | tsd or vitest typecheck              | Ensure public API types are correct           |

**Coverage standards from top packages:**

| Package                 | Coverage Target                          |
| ----------------------- | ---------------------------------------- |
| react-native-reanimated | Not publicly documented, extensive tests |
| @shopify/flash-list     | ~80%                                     |
| react-native-paper      | ~80% with RNTL                           |
| Industry standard       | **80% lines/branches/functions**         |

**rn-iconify currently has 70% threshold** -- should be raised to 80%.

**Testing patterns for an icon library specifically:**

```typescript
// 1. Cache layer tests (unit)
describe('CacheManager', () => {
  it('should check memory cache before disk', async () => { ... });
  it('should promote disk hits to memory', async () => { ... });
  it('should fetch from network on cache miss', async () => { ... });
});

// 2. Icon rendering tests (component)
describe('IconRenderer', () => {
  it('renders SVG with correct viewBox', () => { ... });
  it('applies theme colors', () => { ... });
  it('shows placeholder while loading', () => { ... });
  it('handles missing icon gracefully', () => { ... });
});

// 3. Accessibility tests
describe('Accessibility', () => {
  it('sets accessibilityRole="image"', () => { ... });
  it('uses accessibilityLabel from name prop', () => { ... });
});

// 4. Babel plugin tests (unit)
describe('BabelPlugin', () => {
  it('collects icon names from JSX', () => { ... });
  it('handles prefetchIcons() calls', () => { ... });
});
```

**Mock strategy:** Create manual mocks for react-native-mmkv, react-native-svg, and fetch in `__mocks__/` directory.

### Finding 5: Documentation Standards

**Sources:** https://github.com/TypeStrong/typedoc, https://www.npmjs.com/package/@storybook/react-native

**What AAA packages include:**

1. **README.md** - The most critical doc
   - Hero image/logo
   - One-line description
   - Badges (npm version, CI status, coverage, license)
   - Installation (with peer deps clearly listed)
   - Quick Start (copy-paste example that works)
   - Feature highlights with GIFs/screenshots
   - API table for main component props
   - Links to detailed docs

2. **API Reference** - Auto-generated
   - TypeDoc from TSDoc comments
   - Published to GitHub Pages or docs site
   - Every public API documented with @param, @returns, @example

3. **Documentation Site** - For complex libraries
   - Docusaurus (react-navigation, reanimated) or custom
   - Guides, tutorials, migration docs
   - Interactive examples (Expo Snack embeds)

4. **CHANGELOG.md** - Auto-generated by semantic-release

5. **CONTRIBUTING.md** - Development setup, PR process

6. **Storybook** - Component demos
   - @storybook/react-native v10.x for in-app component browser
   - Good for icon libraries: browse all icons visually

**For rn-iconify specifically:**

- The Explorer component already serves as an in-app icon browser (good)
- TypeDoc integration would auto-generate API docs from the extensive TypeScript types
- Expo Snack examples for the docs site would be high-impact

### Finding 6: CI/CD & Release

**Sources:** https://oleksiipopov.com/blog/npm-release-automation/, https://brianschiller.com/blog/2023/09/18/changesets-vs-semantic-release/

**Comparison:**

| Feature      | semantic-release               | changesets                | release-it     |
| ------------ | ------------------------------ | ------------------------- | -------------- |
| Automation   | Fully automated                | Semi-automated            | Semi-automated |
| Monorepo     | Plugin (limited)               | Native support            | Plugin         |
| Changelog    | Auto from commits              | From changeset files      | Configurable   |
| Human review | None (commit-driven)           | PR review of changesets   | Manual trigger |
| Used by      | rn-iconify (current), many OSS | react-navigation, Shopify | release-it     |

**rn-iconify already uses semantic-release** -- this is appropriate for a single-package repo with a solo maintainer. The workflow is:

1. Conventional commits (enforced by commitlint + husky)
2. CI analyzes commits on main branch
3. Determines version bump (patch/minor/major)
4. Generates CHANGELOG, publishes to npm, creates GitHub release

**Gold-standard CI pipeline additions:**

```yaml
# .github/workflows/ci.yml additions
- name: Typecheck
  run: npm run typecheck

- name: Lint
  run: npm run lint

- name: Test with coverage
  run: npm run test:coverage

- name: Build
  run: npm run build

- name: Check package size
  run: npx size-limit # or bundlesize

- name: Verify package exports
  run: npx publint # Checks exports field correctness

- name: Test package installation
  run: npm pack && npx install-peerdeps --test
```

**Tools to add:**

- **publint** -- Validates package.json exports, types, and entry points
- **size-limit** or **bundlesize** -- Prevents accidental bundle size regressions
- **attw (Are The Types Wrong?)** -- Validates TypeScript declarations match exports

### Finding 7: Error Handling Patterns

**Sources:** https://javascript.plainenglish.io/building-a-comprehensive-error-handling-system-in-react-native-a-diy-guide-6a67de9436b4, https://reactnative.dev/docs/debugging

**Standard patterns for RN libraries:**

#### 1. `__DEV__` Conditional Warnings

```typescript
// Only shown in development, stripped in production builds
if (__DEV__) {
  console.warn(
    `[rn-iconify] Icon "${name}" not found in ${setName}. ` +
      `Available icons: https://icon-sets.iconify.design/${setName}/`
  );
}
```

#### 2. Graceful Degradation (Production)

```typescript
// Never crash in production -- render nothing or a fallback
const IconRenderer = ({ name, fallback, ...props }) => {
  const [iconData, setIconData] = useState(null);
  const [error, setError] = useState(false);

  if (error) {
    // In production: render fallback or nothing
    // In dev: render error indicator
    return __DEV__ ? <DevErrorIndicator /> : (fallback ?? null);
  }

  return <SvgComponent data={iconData} {...props} />;
};
```

#### 3. Error Boundaries for Library Components

```typescript
// Wrap the public API with an error boundary
import { ErrorBoundary } from 'react-error-boundary';

const SafeIcon = (props) => (
  <ErrorBoundary fallback={<View />} onError={(e) => {
    if (__DEV__) console.error('[rn-iconify]', e);
  }}>
    <IconRenderer {...props} />
  </ErrorBoundary>
);
```

#### 4. Network Error Handling

```typescript
// Retry with exponential backoff for network fetches
const fetchWithRetry = async (url, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
};
```

#### 5. Validation at Boundaries

```typescript
// Validate props in development
if (__DEV__) {
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error(
      '[rn-iconify] "name" prop must be a non-empty string. ' + 'Received: ' + JSON.stringify(name)
    );
  }
}
```

### Finding 8: Accessibility Standards

**Sources:** https://reactnative.dev/docs/accessibility, https://www.accessibilitychecker.org/blog/react-native-accessibility/, https://oneuptime.com/blog/post/2026-01-15-react-native-accessible-components/view

**WCAG 2.1 requirements for icon libraries:**

| Requirement    | Standard                  | Implementation                                                       |
| -------------- | ------------------------- | -------------------------------------------------------------------- |
| Touch target   | 44x44 points minimum      | `minWidth: 44, minHeight: 44` on pressable icons                     |
| Color contrast | 4.5:1 ratio minimum       | Validate icon color against background                               |
| Screen reader  | Meaningful labels         | `accessibilityLabel` on every icon                                   |
| Role           | Correct semantics         | `accessibilityRole="image"` for decorative, `"button"` for pressable |
| Reduced motion | Respect system setting    | Check `AccessibilityInfo.isReduceMotionEnabled()`                    |
| High contrast  | Support system preference | Adjust icon weight/color in high contrast mode                       |

**What the best libraries do:**

```typescript
// 1. Default accessibility props
<Svg
  accessible={true}
  accessibilityRole="image"
  accessibilityLabel={accessibilityLabel ?? humanize(name)}
  // "home" -> "Home", "arrow-left" -> "Arrow Left"
>

// 2. Decorative vs. informative
// If icon is purely decorative (next to text), hide from screen reader
<Svg
  accessible={false}
  importantForAccessibility="no-hide-descendants"
>

// 3. Reduced motion support
const prefersReducedMotion = useAccessibilityInfo().reduceMotionEnabled;
const animationDuration = prefersReducedMotion ? 0 : 300;

// 4. Minimum touch target
const PressableIcon = ({ size = 24, ...props }) => (
  <Pressable
    hitSlop={{ top: Math.max(0, (44 - size) / 2), ... }}
    accessibilityRole="button"
  >
    <Icon size={size} {...props} />
  </Pressable>
);
```

**rn-iconify already has `src/accessibility/`** -- this is ahead of most icon libraries. The key thing to verify is that:

1. Every icon has a default `accessibilityLabel` derived from its name
2. `accessibilityRole="image"` is set by default
3. Animated icons respect `isReduceMotionEnabled`
4. Touch targets meet 44pt minimum when icons are pressable

### Finding 9: Animation Standards (2025-2026)

**Sources:** https://docs.swmansion.com/react-native-reanimated/, https://dev.to/erenelagz/react-native-reanimated-3-the-ultimate-guide-to-high-performance-animations-in-2025-4ae4

**Reanimated 3 is the clear standard:**

| Aspect              | Built-in Animated                          | Reanimated 3                    |
| ------------------- | ------------------------------------------ | ------------------------------- |
| Thread              | JS thread (or native with useNativeDriver) | UI thread (worklets)            |
| FPS                 | Up to 60fps                                | Up to 120fps                    |
| Gesture integration | Manual                                     | Native (via gesture-handler)    |
| Layout animations   | Not supported                              | `entering`, `exiting`, `layout` |
| Shared elements     | Not supported                              | `SharedTransition`              |
| Bridge overhead     | Yes                                        | No (JSI-based)                  |

**For animated icons specifically:**

```typescript
// Reanimated approach (recommended)
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const SpinIcon = ({ children }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1, // infinite
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};
```

**However, for a library like rn-iconify**, making Reanimated a **peer dependency** is heavy. The standard pattern is:

1. **Built-in Animated API** for basic presets (spin, pulse, bounce) -- zero additional deps
2. **Optional Reanimated integration** via the `rn-iconify/animated` export for advanced animations
3. **Respect `isReduceMotionEnabled`** in all animation presets
4. **Let consumers wrap icons** with their own Reanimated animations

This is essentially what rn-iconify already does with its `src/animated/` module. The key is to document that the basic animated presets use the built-in Animated API (good enough for most icon animations) while advanced users can use Reanimated directly.

### Finding 10: Developer Experience (DX)

**Sources:** https://medium.com/@ddylanlinn/npm-package-development-guide-build-publish-and-best-practices-674714b7aef1, https://snyk.io/blog/best-practices-create-modern-npm-package/

**What makes developers love an npm package:**

#### 1. Zero-Config Installation

```bash
npm install rn-iconify react-native-svg react-native-mmkv
# That's it. Auto-linking handles the rest.
```

- No manual native setup
- No Metro config changes for basic usage
- Babel plugin is opt-in, not required

#### 2. TypeScript-First with Autocomplete

```typescript
// This is rn-iconify's killer feature
<Mdi name="home" />  // TS autocomplete shows all 7000+ MDI icon names
```

- Every prop fully typed
- Icon names as string literal unions
- IntelliSense for all icon sets

#### 3. Helpful Error Messages

```
// BAD: "Cannot read property 'path' of undefined"
// GOOD: "[rn-iconify] Icon "hme" not found in "mdi". Did you mean "home"?
//        Browse icons: https://icon-sets.iconify.design/mdi/"
```

- Include the library name in all messages
- Suggest corrections (fuzzy matching)
- Link to documentation
- Only in `__DEV__`

#### 4. Sensible Defaults

- Default size: 24 (Material Design standard)
- Default color: "currentColor" or inherited from theme
- Default cache: enabled with MMKV
- Default placeholder: none (renders nothing until loaded)

#### 5. Progressive Disclosure

- Basic: `<Mdi name="home" size={24} />`
- Intermediate: `<IconThemeProvider>` for global styling
- Advanced: Babel plugin for build-time optimization
- Expert: Custom cache strategies, prefetching

#### 6. Fast Feedback Loop

- Icons load instantly from cache after first use
- HMR works with source pointing in exports
- Development mode shows warnings for missing icons

#### 7. Package Quality Signals

- Badges: npm version, CI, coverage, bundle size, TypeScript
- `sideEffects: false` for tree-shaking
- `engines` field specifying Node.js requirements
- `peerDependenciesMeta` for optional deps
- `publint` and `attw` passing

---

## Recommendations for rn-iconify

### Critical (Do These First)

1. **Add `"react-native"` condition to exports** -- Currently missing. This is the #1 standard for RN packages in 2025-2026.

2. **Upgrade react-native-builder-bob** from ^0.23.0 to ^0.40.x -- This is over a year behind. The new version has significant improvements including proper ESM support.

3. **Add `"source"` field to each export entry** -- Builder-bob uses this for source-level resolution during development.

### Important (Near-Term)

4. **Raise test coverage threshold** from 70% to 80% -- Industry standard is 80%.

5. **Add CI quality checks**: `publint`, `attw` (Are The Types Wrong?), and `size-limit` to the CI pipeline.

6. **Add `"react-native"` to `peerDependencies` minimum version** -- Bump from `>=0.60.0` to `>=0.72.0` since that's when Package Exports support was introduced.

7. **Ensure all icons have default `accessibilityLabel`** derived from name (e.g., "arrow-left" -> "Arrow left").

### Nice-to-Have (Long-Term)

8. **TypeDoc integration** for auto-generated API reference on the docs site.

9. **Bundle size monitoring** via size-limit in CI to prevent regressions.

10. **"Did you mean?" fuzzy matching** in `__DEV__` warnings for mistyped icon names.

### Implementation Notes

- When adding `"react-native"` to exports, it MUST be the first condition (before `"types"`, `"import"`, `"require"`)
- The `"react-native"` condition should point to source `.ts` files, not compiled output
- Keep dual CJS/ESM output for now (don't go ESM-only) since the library has 200+ components and consumers need Jest compatibility
- The `"./babel"` and `"./metro"` exports should NOT have `"react-native"` condition since they're Node.js-only

---

## Updated Exports Structure (Recommended)

```json
{
  "exports": {
    ".": {
      "react-native": {
        "types": "./src/index.ts",
        "default": "./src/index.ts"
      },
      "types": "./lib/typescript/index.d.ts",
      "import": "./lib/module/index.js",
      "require": "./lib/commonjs/index.js"
    },
    "./babel": {
      "types": "./lib/typescript/babel/index.d.ts",
      "import": "./lib/module/babel/index.js",
      "require": "./lib/commonjs/babel/index.js"
    },
    "./navigation": {
      "react-native": {
        "types": "./src/navigation/index.ts",
        "default": "./src/navigation/index.ts"
      },
      "types": "./lib/typescript/navigation/index.d.ts",
      "import": "./lib/module/navigation/index.js",
      "require": "./lib/commonjs/navigation/index.js"
    },
    "./animated": {
      "react-native": {
        "types": "./src/animated/index.ts",
        "default": "./src/animated/index.ts"
      },
      "types": "./lib/typescript/animated/index.d.ts",
      "import": "./lib/module/animated/index.js",
      "require": "./lib/commonjs/animated/index.js"
    },
    "./metro": {
      "types": "./lib/typescript/metro/index.d.ts",
      "import": "./lib/module/metro/index.js",
      "require": "./lib/commonjs/metro/index.js"
    }
  }
}
```

---

## Sources

1. [Metro Package Exports Documentation](https://metrobundler.dev/docs/package-exports/) - Official Metro docs on "react-native" condition
2. [Package Exports Support in React Native](https://reactnative.dev/blog/2023/06/21/package-exports-support) - RN blog post on exports
3. [react-native-builder-bob](https://github.com/callstack/react-native-builder-bob) - Build tool repository
4. [Builder Bob ESM Support](https://oss.callstack.com/react-native-builder-bob/esm) - ESM configuration docs
5. [Builder Bob v0.40.0 Release](https://github.com/callstack/react-native-builder-bob/releases/tag/react-native-builder-bob@0.40.0) - ESM-only default change
6. [Publishing Dual Module ESM Libraries](https://satya164.page/posts/publishing-dual-module-esm-libraries) - Satya164's blog (bob maintainer)
7. [Expo Icons Documentation](https://docs.expo.dev/guides/icons/) - @expo/vector-icons tree-shaking
8. [Expo Tree Shaking](https://docs.expo.dev/guides/tree-shaking/) - SDK 52+ tree-shaking
9. [Best RN Icon Libraries 2025](https://javascript.plainenglish.io/best-react-native-icon-libraries-in-2025-d12272119b09) - Icon library comparison
10. [RN Testing with Jest and RTL](https://www.creolestudios.com/react-native-testing-with-jest-and-rtl/) - 2025 testing guide
11. [React Native Testing Overview](https://reactnative.dev/docs/testing-overview) - Official testing docs
12. [Top React Testing Libraries 2026](https://www.browserstack.com/guide/top-react-testing-libraries) - BrowserStack testing guide
13. [TypeDoc](https://github.com/TypeStrong/typedoc) - Documentation generator
14. [Storybook React Native](https://www.npmjs.com/package/@storybook/react-native) - Component demos
15. [NPM Release Automation Guide](https://oleksiipopov.com/blog/npm-release-automation/) - Semantic-release vs changesets vs release-please
16. [Changesets vs Semantic Release](https://brianschiller.com/blog/2023/09/18/changesets-vs-semantic-release/) - Comparison
17. [RN Accessibility Docs](https://reactnative.dev/docs/accessibility) - Official accessibility reference
18. [RN Accessibility Best Practices 2025](https://www.accessibilitychecker.org/blog/react-native-accessibility/) - WCAG compliance guide
19. [Implementing Accessible RN Components](https://oneuptime.com/blog/post/2026-01-15-react-native-accessible-components/view) - 2026 accessible components guide
20. [Reanimated 3 Docs](https://docs.swmansion.com/react-native-reanimated/) - Official reanimated docs
21. [Reanimated 3 Guide 2025](https://dev.to/erenelagz/react-native-reanimated-3-the-ultimate-guide-to-high-performance-animations-in-2025-4ae4) - Performance guide
22. [NPM Package Best Practices](https://snyk.io/blog/best-practices-create-modern-npm-package/) - Snyk security-focused guide
23. [TypeScript ESM/CJS Publishing 2025](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing) - Liran Tal's analysis
24. [RN Error Handling Guide](https://javascript.plainenglish.io/building-a-comprehensive-error-handling-system-in-react-native-a-diy-guide-6a67de9436b4) - Comprehensive error handling

## Open Questions

- What is the exact exports structure used by react-native-reanimated's published package? (Monorepo structure made it hard to extract from search)
- Does Expo SDK 53+ enable tree-shaking by default for all platforms, or only web?
- What is the performance overhead of SVG-based icon rendering vs. font-based at scale (1000+ icons on screen)?
