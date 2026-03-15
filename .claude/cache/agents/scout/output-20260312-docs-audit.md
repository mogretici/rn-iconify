# Docs Audit: v3.0 API Changes

Generated: 2026-03-12

## Summary

All 17 documentation files were read in full and cross-referenced against the actual v3.0 source code.
The audit found **8 distinct categories of outdated API references** across multiple files.
Each issue below is marked with its verification status and exact line numbers.

---

## Verified v3.0 Source Facts (cross-checked against src/)

| Claim                                                                | Source Evidence                                             | Status   |
| -------------------------------------------------------------------- | ----------------------------------------------------------- | -------- |
| `IconExplorer` moved to `rn-iconify/dev`                             | `src/index.ts:223` comment; `src/dev/index.ts:14`           | VERIFIED |
| `PerformanceMonitor` moved to `rn-iconify/dev`                       | `src/index.ts:187` comment; `src/dev/index.ts:46`           | VERIFIED |
| `rotate` type is `number` (was `0\|90\|180\|270`)                    | `src/types/index.ts:10` `export type IconRotation = number` | VERIFIED |
| `pause()` stops at position, `resume()` restarts from beginning      | `src/animated/useIconAnimation.ts:295-314` comments         | VERIFIED |
| `IconLoadError` is new typed error class                             | `src/errors.ts:8`; `src/IconRenderer.tsx:22,35`             | VERIFIED |
| `rn-iconify/icons/*` deep import is new                              | `package.json exports["./icons/*"]`                         | VERIFIED |
| Theme system uses `useMemo` (no infinite loop)                       | `src/theme/IconThemeProvider.tsx:5-10,56`                   | VERIFIED |
| Accessibility uses `isInvertColorsEnabled` (not `isBoldTextEnabled`) | `src/accessibility/AccessibilityProvider.tsx:108,118`       | VERIFIED |
| `shouldDisableAnimations()` is integrated into `IconRenderer`        | `src/IconRenderer.tsx:233`                                  | VERIFIED |
| Auto `accessibilityRole="image"` in `IconRenderer`                   | `src/IconRenderer.tsx:417,438,452,490,515,538,556,577`      | VERIFIED |
| Auto label generation via `a11y?.getLabel(iconName)`                 | `src/IconRenderer.tsx:236`                                  | VERIFIED |

---

## Issue 1 — Wrong import path for `IconExplorer`

**Affects:** `docs/features/icon-explorer.mdx`, `docs/api-reference/hooks.mdx`

**Root cause:** `IconExplorer`, `useExplorer`, `useExplorerContext`, `ExplorerContext`, and all explorer utilities were moved from `rn-iconify` to `rn-iconify/dev` in v3.0. The main entry point (`src/index.ts:223`) now only re-exports **types**, not the runtime components.

### icon-explorer.mdx

Line 14:

```tsx
// WRONG — will cause "module has no exported member" at runtime
import { IconExplorer } from 'rn-iconify';
```

Change to:

```tsx
import { IconExplorer } from 'rn-iconify/dev';
```

Line 78:

```tsx
// WRONG
import { useExplorer } from 'rn-iconify';
```

Change to:

```tsx
import { useExplorer } from 'rn-iconify/dev';
```

Line 149, 172, 186, 213, 218, 272, 276, 304, 414–419:
All imports of `getAllIconSets`, `getIconSetByPrefix`, `getIconSetsByCategory`, `searchIconSets`, `generateImportStatement`, `generateIconJSX`, `POPULAR_ICON_SETS`, `ExplorerContext`, `useExplorerContext` from `'rn-iconify'` must change to `'rn-iconify/dev'`.

### hooks.mdx

Line 459:

```tsx
// WRONG
import { useExplorer } from 'rn-iconify';
```

Change to:

```tsx
import { useExplorer } from 'rn-iconify/dev';
```

Line 878:

```tsx
// WRONG
import { useExplorerContext } from 'rn-iconify';
```

Change to:

```tsx
import { useExplorerContext } from 'rn-iconify/dev';
```

Line 918:

```tsx
// WRONG
import { useExplorerContext, IconExplorer, ExplorerContext } from 'rn-iconify';
```

Change to:

```tsx
import { useExplorerContext, IconExplorer, ExplorerContext } from 'rn-iconify/dev';
```

---

## Issue 2 — Wrong import path for `PerformanceMonitor` and related exports

**Affects:** `docs/features/performance-monitoring.mdx`

**Root cause:** `PerformanceMonitor`, `enablePerformanceMonitoring`, `disablePerformanceMonitoring`, `getPerformanceReport`, `printPerformanceReport` were moved from `rn-iconify` to `rn-iconify/dev`. Only types remain in the main entry (`src/index.ts:187-196`).

Lines 16, 79, 112–113, 218, 224, 241, 277, 432, 454, 474, 492, 512:
Every `from 'rn-iconify'` that imports a **runtime** performance symbol must change to `from 'rn-iconify/dev'`.

Examples:

```tsx
// WRONG (line 16)
import { enablePerformanceMonitoring, getPerformanceReport } from 'rn-iconify';

// CORRECT
import { enablePerformanceMonitoring, getPerformanceReport } from 'rn-iconify/dev';
```

```tsx
// WRONG (line 79)
import { useEffect } from 'react';
import { enablePerformanceMonitoring, getPerformanceReport, PerformanceMonitor } from 'rn-iconify';

// CORRECT — change the rn-iconify import source
import {
  enablePerformanceMonitoring,
  getPerformanceReport,
  PerformanceMonitor,
} from 'rn-iconify/dev';
```

A note should also be added to the page warning that these are dev-only utilities and must not be imported in production bundles.

---

## Issue 3 — `rotate` prop type is outdated (`0 | 90 | 180 | 270` → `number`)

**Affects:** `docs/getting-started/quick-start.mdx`, `docs/features/theme-provider.mdx`, `docs/api-reference/hooks.mdx`

**Root cause:** `src/types/index.ts:10` defines `export type IconRotation = number`. The docs still show the old union type.

### quick-start.mdx

Line 39 (props table):

```
| `rotate` | `0 \| 90 \| 180 \| 270` | `0` | Rotation angle |
```

Change to:

```
| `rotate` | `number` | `0` | Rotation angle in degrees |
```

### theme-provider.mdx

Line 43 (Theme Options table):

```
| `rotate` | `0 \| 90 \| 180 \| 270` | `0` | Default rotation for all icons |
```

Change to:

```
| `rotate` | `number` | `0` | Default rotation for all icons in degrees |
```

### hooks.mdx (useIconTheme returns / IconTheme interface)

Line 57:

```tsx
/** Default rotation @default 0 */
rotate?: 0 | 90 | 180 | 270;
```

Change to:

```tsx
/** Default rotation in degrees @default 0 */
rotate?: number;
```

### api-reference/types.mdx

The `IconProps` interface at line 131 still documents:

```tsx
/** Rotation in degrees */
rotate?: 0 | 90 | 180 | 270;
```

Change to:

```tsx
/** Rotation in degrees */
rotate?: number;
```

The `IconTheme` interface at line 246 uses `IconRotation` as a type alias comment (`0 | 90 | 180 | 270`). The displayed comment should be updated to reflect `number`.

---

## Issue 4 — `pause()` / `resume()` RN Animated limitations not documented

**Affects:** `docs/features/animations.mdx`

**Root cause:** `src/animated/useIconAnimation.ts:295-314` documents explicitly:

- `pause()` — stops the animation at its current position (using `stop()` internally)
- `resume()` — **restarts from the beginning**, not from the paused position, due to RN `Animated` API not supporting true pause/resume

The AnimationControls API table (lines 282–289) and useIconAnimation returns table (lines 369–379) present `pause()` and `resume()` without this critical caveat.

### animations.mdx

After line 286 (the AnimationControls API table), add a note:

```
:::warning[React Native Animated Limitations]
`pause()` stops the animation at its current value. `resume()` restarts from the **beginning** of the animation cycle — not from the paused position. This is a limitation of the React Native `Animated` API which does not support true mid-animation pause/resume.
:::
```

In the `useIconAnimation Return Value` table (lines 369–379), update the descriptions:

```
| `pause` | `() => void` | Pause the animation (stops at current position) |
| `resume` | `() => void` | Resume animation (restarts from beginning — RN Animated limitation) |
```

---

## Issue 5 — `IconLoadError` typed errors not documented anywhere

**Affects:** All files that mention `onError` — primarily `docs/api-reference/types.mdx`

**Root cause:** `src/errors.ts:8` exports `IconLoadError extends Error` with `name = 'IconLoadError'`. `src/IconRenderer.tsx:35` types the error state as `IconLoadError | Error | null`. The `onError` callback on `IconProps` receives `IconLoadError` for fetch failures but the docs only show `(error: Error) => void`.

### api-reference/types.mdx — IconProps section (line 155)

Current:

```tsx
/** Called when the icon fails to load */
onError?: (error: Error) => void;
```

Should be:

```tsx
/** Called when the icon fails to load with a typed error */
onError?: (error: IconLoadError | Error) => void;
```

Add a new section documenting `IconLoadError`:

```tsx
## IconLoadError

Typed error class thrown when icon loading fails.

import { IconLoadError } from 'rn-iconify';

function MyIcon() {
  return (
    <Mdi
      name="home"
      onError={(error) => {
        if (error instanceof IconLoadError) {
          console.error('Icon load failed:', error.iconName, error.message);
        }
      }}
    />
  );
}
```

---

## Issue 6 — `rn-iconify/icons/*` deep import not documented

**Affects:** No existing file documents this. Missing documentation.

**Root cause:** `package.json` exports `"./icons/*"` pointing to `src/components/*.ts`. This allows tree-shaking-friendly per-component imports. There is no mention of this anywhere in the docs.

A new section should be added to either `docs/getting-started/typescript.mdx` or `docs/advanced/architecture.mdx`:

```tsx
## Deep Imports (rn-iconify/icons/*)

For better tree shaking, import individual icon sets directly:

// Instead of:
import { Mdi, Heroicons } from 'rn-iconify';

// You can use:
import { Mdi } from 'rn-iconify/icons/Mdi';
import { Heroicons } from 'rn-iconify/icons/Heroicons';
```

---

## Issue 7 — Theme system infinite loop warning is missing (useMemo fix)

**Affects:** `docs/features/theme-provider.mdx`

**Root cause:** `src/theme/IconThemeProvider.tsx:5-10` documents a v3.0 fix: "Inline theme props no longer cause infinite re-render loops" due to replacing the `useState + useEffect` anti-pattern with `useMemo`. The docs show patterns like:

```tsx
// This pattern in theme-provider.mdx (lines 99-109):
<IconThemeProvider theme={{ size: 24, color: isDark ? '#ffffff' : '#000000' }}>
```

In older versions this caused infinite re-renders because the inline object was a new reference every render. In v3.0 this is fixed. The docs should note this was a known issue that is now resolved, so users upgrading from v2.x know to remove any workarounds (e.g., `useMemo`-wrapped theme objects) they may have added.

Add a note in the `useIconTheme` section of theme-provider.mdx after line 204:

```
:::info[v3.0 Change]
Prior to v3.0, passing an inline theme object (e.g., `theme={{ size: 24 }}`) could cause
infinite re-render loops. This is fixed in v3.0 — inline objects are safe to use directly.
:::
```

---

## Issue 8 — Accessibility docs use wrong API for high contrast detection

**Affects:** `docs/features/accessibility.mdx`

**Root cause:** `src/accessibility/AccessibilityProvider.tsx:108,118` uses `AccessibilityInfo.isInvertColorsEnabled()` and listens to `'invertColorsChanged'` for high contrast detection. The docs at line 166-174 show `isGrayscaleEnabled()` / `'grayscaleChanged'` as the proxy.

### accessibility.mdx

Lines 164-175 (ManualHighContrastIcon example):

```tsx
// WRONG — shows isGrayscaleEnabled / grayscaleChanged
AccessibilityInfo.isGrayscaleEnabled().then(setHighContrast);
const subscription = AccessibilityInfo.addEventListener('grayscaleChanged', setHighContrast);
```

Change to match the actual implementation:

```tsx
// CORRECT — matches AccessibilityProvider implementation
AccessibilityInfo.isInvertColorsEnabled().then(setHighContrast);
const subscription = AccessibilityInfo.addEventListener('invertColorsChanged', setHighContrast);
```

Also update the inline comment at line 165:

```tsx
// WRONG comment:
// Note: React Native doesn't have direct high contrast detection
// Use isGrayscaleEnabled or isInvertColorsEnabled as proxies

// CORRECT comment:
// Note: React Native doesn't have direct high contrast detection
// rn-iconify uses isInvertColorsEnabled as a proxy (matches AccessibilityProvider behavior)
```

---

## Issue 9 — Auto `accessibilityRole="image"` and auto label generation not documented

**Affects:** `docs/features/accessibility.mdx`

**Root cause:** `src/IconRenderer.tsx:417,438,452,490,515,538,556,577` — every rendered icon path applies `accessibilityRole="image"` automatically. Line 236 auto-generates the a11y label: `const resolvedA11yLabel = accessibilityLabel ?? a11y?.getLabel(iconName)`.

The accessibility.mdx page (lines 12-23) shows auto-generated labels but doesn't explain that `accessibilityRole="image"` is also automatic. Users may be manually adding `accessibilityRole="image"` unnecessarily.

Add to the "Accessibility Labels" section (after line 23):

```
:::info[Auto-applied in v3.0]
All icons automatically receive `accessibilityRole="image"` and an auto-generated label
derived from the icon name (e.g., `"home icon"` for `name="home"`). You only need to
provide `accessibilityLabel` to override the generated label, or set `accessible={false}`
for decorative icons.
:::
```

---

## Issue 10 — `shouldDisableAnimations()` integrated into IconRenderer not documented

**Affects:** `docs/features/animations.mdx`, `docs/features/accessibility.mdx`

**Root cause:** `src/IconRenderer.tsx:233,239-247` — when `AccessibilityProvider` is present, IconRenderer automatically reads `shouldDisableAnimations()` and passes `undefined` (disabling) the `animation` prop when reduced motion is preferred. The animations docs (lines 469-493) show manual `AccessibilityInfo.isReduceMotionEnabled()` checks as if they are required.

### animations.mdx

The "Respect Motion Preferences" section (lines 467-494) currently shows:

```tsx
// Manual pattern — still works but no longer necessary
function AccessibleIcon() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);
  if (reduceMotion) { return <Mdi .../>; }
  return <AnimatedIcon animate="spin">...
```

Replace with:

```
:::info[v3.0 Automatic Behavior]
When `AccessibilityProvider` is present, all icon animations are automatically disabled
when the user has enabled reduced motion. You do not need to manually check
`AccessibilityInfo.isReduceMotionEnabled()` for icons — `IconRenderer` handles this.

The manual pattern below still works but is only needed if you are NOT using `AccessibilityProvider`.
:::
```

### accessibility.mdx

The "Reduced Motion" section (lines 185-219) shows the same manual `isReduceMotionEnabled()` pattern. Add a note before the code block:

```
:::info[v3.0]
If you use `AccessibilityProvider`, reduced motion is automatically respected for all icons
without manual checks. The pattern below is for cases without a provider.
:::
```

---

## File-by-File Summary

| File                                  | Issues Found                                                                                   | Severity                           |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------- |
| `features/icon-explorer.mdx`          | Issue 1 (wrong import path — all `rn-iconify` imports)                                         | HIGH — breaks at runtime           |
| `features/performance-monitoring.mdx` | Issue 2 (wrong import path — all runtime exports)                                              | HIGH — breaks at runtime           |
| `getting-started/quick-start.mdx`     | Issue 3 (rotate type)                                                                          | MEDIUM — misleads TypeScript users |
| `features/theme-provider.mdx`         | Issue 3 (rotate type), Issue 7 (useMemo note)                                                  | MEDIUM                             |
| `features/animations.mdx`             | Issue 4 (pause/resume caveats), Issue 10 (auto reduced motion)                                 | MEDIUM                             |
| `features/accessibility.mdx`          | Issue 8 (isInvertColorsEnabled), Issue 9 (auto role/label), Issue 10 (shouldDisableAnimations) | MEDIUM                             |
| `api-reference/hooks.mdx`             | Issue 1 (explorer imports), Issue 3 (rotate type)                                              | HIGH / MEDIUM                      |
| `api-reference/types.mdx`             | Issue 3 (rotate type), Issue 5 (IconLoadError)                                                 | MEDIUM                             |
| `api-reference/utilities.mdx`         | No v3.0 issues found                                                                           | OK                                 |
| `getting-started/installation.mdx`    | No v3.0 issues found                                                                           | OK                                 |
| `getting-started/typescript.mdx`      | Issue 6 (missing icons/\* deep import docs)                                                    | LOW — missing feature              |
| `features/icon-aliases.mdx`           | No v3.0 issues found                                                                           | OK                                 |
| `features/placeholders.mdx`           | No v3.0 issues found                                                                           | OK                                 |
| `features/react-navigation.mdx`       | No v3.0 issues found                                                                           | OK                                 |
| `advanced/architecture.mdx`           | Issue 6 (missing icons/\* deep import docs)                                                    | LOW — missing feature              |
| `advanced/babel-plugin.mdx`           | No v3.0 issues found                                                                           | OK                                 |
| `advanced/custom-server.mdx`          | No v3.0 issues found                                                                           | OK                                 |
| `advanced/native-module.mdx`          | No v3.0 issues found                                                                           | OK                                 |

---

## Priority Order for Fixes

1. **icon-explorer.mdx** + **hooks.mdx** — Wrong import path breaks all explorer usage at runtime
2. **performance-monitoring.mdx** — Wrong import path breaks all monitoring usage at runtime
3. **accessibility.mdx** line 164-174 — `isGrayscaleEnabled` must be `isInvertColorsEnabled`
4. **rotate** type across quick-start, theme-provider, hooks, types — misleads TypeScript users
5. **animations.mdx** — pause/resume caveat prevents user confusion about missing pause-at-position behavior
6. All auto-behavior docs (role, label, reduced motion) — reduces unnecessary boilerplate in user code
7. Deep imports section — low priority, net-new feature documentation
