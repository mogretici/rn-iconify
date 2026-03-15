# Quick Fix: animations.mdx - Pause/Resume Warning + Reduced Motion Section

Generated: 2026-03-12

## Changes Made

### Change 1: Pause/Resume Limitations Warning

- File: `docs/docs/features/animations.mdx`
- After line 289 (end of AnimationControls API table)
- Added `:::warning` admonition block explaining that `pause()` stops in place but `resume()` restarts from the beginning, and recommending `react-native-reanimated` for true pause/resume.

### Change 2: Reduced Motion Support Section

- File: `docs/docs/features/animations.mdx`
- Inserted before existing `## Performance` section (now at line 429)
- New `## Reduced Motion Support (v3.0)` section with prose description and TSX example showing `AccessibilityProvider` wrapper.

## Verification

- Syntax check: PASS (MDX admonition syntax `:::warning ... :::` is valid Docusaurus syntax)
- Pattern followed: Matches existing Docusaurus MDX structure; existing sections use `##` headings and fenced code blocks

## Files Modified

1. `docs/docs/features/animations.mdx` - Added warning admonition after AnimationControls API table; added Reduced Motion Support section before Performance section

## Notes

- The existing "### 3. Respect Motion Preferences" tip (manual `AccessibilityInfo` approach) is left intact — the new section describes the automatic v3.0 behavior, which is complementary, not redundant.
