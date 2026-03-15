# Quick Fix: Update performance monitoring imports to rn-iconify/dev

Generated: 2026-03-12

## Change Made

- File: `docs/docs/features/performance-monitoring.mdx`
- Change: All runtime imports of `PerformanceMonitor`, `enablePerformanceMonitoring`, `disablePerformanceMonitoring`, `getPerformanceReport`, `printPerformanceReport` changed from `from 'rn-iconify'` to `from 'rn-iconify/dev'`
- Admonition: Added `:::info Dev-only Import` block immediately after the frontmatter

## Imports Changed (14 total)

| Line (post-edit)          | Symbols                                                                 | Was → Now                       |
| ------------------------- | ----------------------------------------------------------------------- | ------------------------------- |
| Enable Monitoring block   | `enablePerformanceMonitoring, getPerformanceReport`                     | `rn-iconify` → `rn-iconify/dev` |
| Usage Example block       | `enablePerformanceMonitoring, getPerformanceReport, PerformanceMonitor` | `rn-iconify` → `rn-iconify/dev` |
| Debug Component block     | `enablePerformanceMonitoring, getPerformanceReport`                     | `rn-iconify` → `rn-iconify/dev` |
| Identify Slow Icons block | `getPerformanceReport`                                                  | `rn-iconify` → `rn-iconify/dev` |
| Subscribe to Events block | `PerformanceMonitor, enablePerformanceMonitoring`                       | `rn-iconify` → `rn-iconify/dev` |
| Print Report block        | `printPerformanceReport, enablePerformanceMonitoring`                   | `rn-iconify` → `rn-iconify/dev` |
| Reset Monitoring block    | `PerformanceMonitor, getPerformanceReport`                              | `rn-iconify` → `rn-iconify/dev` |
| Disable Monitoring block  | `disablePerformanceMonitoring`                                          | `rn-iconify` → `rn-iconify/dev` |
| getSummary API block      | `PerformanceMonitor`                                                    | `rn-iconify` → `rn-iconify/dev` |
| getEvents API block       | `PerformanceMonitor`                                                    | `rn-iconify` → `rn-iconify/dev` |
| getCacheStats API block   | `PerformanceMonitor`                                                    | `rn-iconify` → `rn-iconify/dev` |
| subscribe API block       | `PerformanceMonitor`                                                    | `rn-iconify` → `rn-iconify/dev` |
| isEnabled API block       | `PerformanceMonitor`                                                    | `rn-iconify` → `rn-iconify/dev` |

## Imports Left Unchanged (non-target symbols)

- `loadOfflineBundle, getBundleStats` — `from 'rn-iconify'` (Bundle Statistics section)
- `prefetchIcons` — `from 'rn-iconify'` (Optimization section)
- `configure` (x2) — `from 'rn-iconify'` (Optimization section)

## Verification

- Grep confirms 0 remaining `from 'rn-iconify'` lines for target symbols
- 4 non-target imports correctly remain on `rn-iconify`

## Files Modified

1. `docs/docs/features/performance-monitoring.mdx` - updated dev-only imports and added admonition
