<a href="https://rn-iconify.vercel.app">
<p align="center">
  <img src="https://raw.githubusercontent.com/mogretici/rn-iconify/main/assets/logo.gif" alt="rn-iconify" width="400" />
</p>

<h2 align="center">Everything you need for icons</h2>

<p align="center">
Built for performance, designed for developers.<br/>
Native MMKV caching, full TypeScript autocomplete, and seamless React Navigation integration.
</p>
</a>

<p align="center">
  <a href="https://www.npmjs.com/package/rn-iconify"><img src="https://img.shields.io/npm/v/rn-iconify.svg" alt="npm version" /></a>
  <a href="https://github.com/mogretici/rn-iconify/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/rn-iconify.svg" alt="license" /></a>
  <a href="https://rn-iconify.vercel.app"><img src="https://img.shields.io/badge/TypeScript-Ready-blue.svg" alt="TypeScript" /></a>
</p>

<br/>

<p align="center">
  <a href="https://rn-iconify.vercel.app/docs/getting-started/installation"><img src="https://img.shields.io/badge/GET_STARTED-4f46e5?style=for-the-badge&logoColor=white&labelColor=4f46e5&color=4f46e5" height="40" alt="Get Started" /></a>
  &nbsp;&nbsp;
  <a href="https://rn-iconify.vercel.app"><img src="https://img.shields.io/badge/DOCUMENTATION-1e293b?style=for-the-badge" height="40" alt="Documentation" /></a>
  &nbsp;&nbsp;
  <a href="https://rn-iconify.vercel.app/icon-sets"><img src="https://img.shields.io/badge/BROWSE_268K+_ICONS-7c3aed?style=for-the-badge" height="40" alt="Browse Icons" /></a>
</p>
<br/>

<p align="center">
  <a href="https://rn-iconify.vercel.app"><img src="https://img.shields.io/badge/📦_200+_Icon_Sets-268K+_icons-blueviolet?style=for-the-badge" alt="200+ Icon Sets" /></a>
  &nbsp;
  <a href="https://rn-iconify.vercel.app"><img src="https://img.shields.io/badge/⚡_30x_Faster-MMKV_Cache-00d4aa?style=for-the-badge" alt="30x Faster" /></a>
</p>

<p align="center">
  <a href="https://rn-iconify.vercel.app"><img src="https://img.shields.io/badge/🔷_TypeScript-Autocomplete-3178c6?style=for-the-badge" alt="TypeScript" /></a>
  &nbsp;
  <a href="https://rn-iconify.vercel.app"><img src="https://img.shields.io/badge/🔧_Babel_Plugin-0ms_Render-f5da55?style=for-the-badge" alt="Babel Plugin" /></a>
</p>

<p align="center">
  <a href="https://rn-iconify.vercel.app"><img src="https://img.shields.io/badge/🎭_Theme_Provider-Global_Styles-10b981?style=for-the-badge" alt="Theme Provider" /></a>
  &nbsp;
  <a href="https://rn-iconify.vercel.app"><img src="https://img.shields.io/badge/✨_Animations-6_Presets-ff69b4?style=for-the-badge" alt="Animations" /></a>
</p>

<p align="center">
  <a href="https://rn-iconify.vercel.app"><img src="https://img.shields.io/badge/🧭_Navigation-Ready-6366f1?style=for-the-badge" alt="Navigation" /></a>
  &nbsp;
  <a href="https://rn-iconify.vercel.app"><img src="https://img.shields.io/badge/♿_Accessibility-A11y-14b8a6?style=for-the-badge" alt="Accessibility" /></a>
  &nbsp;
  <a href="https://rn-iconify.vercel.app"><img src="https://img.shields.io/badge/👆_Pressable-onPress-f97316?style=for-the-badge" alt="Pressable" /></a>
</p>

<p align="center">
  <a href="https://rn-iconify.vercel.app"><img src="https://img.shields.io/badge/🎨_NativeWind-className-06b6d4?style=for-the-badge" alt="NativeWind" /></a>
  &nbsp;
  <a href="https://rn-iconify.vercel.app"><img src="https://img.shields.io/badge/+10_more_features-→-lightgreen?style=for-the-badge&labelColor=lightgreen" alt="+10 more features" /></a>
</p>

---

## Installation

```bash
npm install rn-iconify react-native-svg react-native-mmkv
```

For iOS, run `npx pod-install` after installation.

## Quick Start

```tsx
import { Mdi, Lucide, Heroicons } from 'rn-iconify';

function App() {
  return (
    <>
      <Mdi name="home" size={24} color="#333" />
      <Lucide name="settings" size={20} color="blue" />
      <Heroicons name="user" size={28} />
    </>
  );
}
```

Full TypeScript autocomplete for all 268,000+ icon names across 200+ sets.

## Theme Provider

```tsx
import { IconThemeProvider, Mdi } from 'rn-iconify';

function App() {
  return (
    <IconThemeProvider theme={{ size: 20, color: '#333' }}>
      <Mdi name="home" /> {/* inherits size=20, color=#333 */}
      <Mdi name="star" color="gold" /> {/* overrides color */}
    </IconThemeProvider>
  );
}
```

## Animations

```tsx
import { Mdi } from 'rn-iconify';

<Mdi name="loading" animate="spin" />
<Mdi name="heart" animate="pulse" />
<Mdi name="bell" animate="shake" />
```

6 built-in presets: `spin`, `pulse`, `bounce`, `shake`, `ping`, `wiggle`.

## React Navigation

```tsx
import { createTabBarIcon } from 'rn-iconify/navigation';

<Tab.Screen
  name="Home"
  options={{
    tabBarIcon: createTabBarIcon('mdi:home'),
  }}
/>;
```

## Pressable Icons

```tsx
<Mdi name="heart" size={24} color="red" onPress={() => console.log('Liked!')} />
```

Auto 44dp minimum touch target for accessibility.

## Tree-Shaking

Import only the icon sets you need:

```tsx
import { Mdi } from 'rn-iconify/icons/Mdi';
```

## Typed Errors

```tsx
import { IconLoadError } from 'rn-iconify';

try {
  // ...
} catch (error) {
  if (error instanceof IconLoadError) {
    switch (error.code) {
      case 'NOT_FOUND': // icon doesn't exist
      case 'NETWORK': // network failure
      case 'TIMEOUT': // request timed out
      case 'INVALID_SVG': // malformed SVG
    }
  }
}
```

## Dev Tools

Icon Explorer and Performance Monitor are available as a separate import to keep your production bundle lean:

```tsx
import { IconExplorer, PerformanceMonitor } from 'rn-iconify/dev';
```

## Platform Support

| Platform     | Supported |
| ------------ | --------- |
| iOS          | >=13.0    |
| Android      | >=5.0     |
| React Native | >=0.60    |
| Expo         | SDK 49+   |

## Documentation

Full documentation at [rn-iconify.vercel.app](https://rn-iconify.vercel.app)

<p align="center">
  MIT © 2025-2026 | <a href="https://github.com/mogretici">mogretici</a>
</p>
