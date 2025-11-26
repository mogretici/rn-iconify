# rn-iconify

> **268,000+ icons** for React Native with Expo Vector Icons-style API, native MMKV caching, and full TypeScript autocomplete

[![npm version](https://img.shields.io/npm/v/rn-iconify.svg)](https://www.npmjs.com/package/rn-iconify)
[![license](https://img.shields.io/npm/l/rn-iconify.svg)](https://github.com/mogretici/rn-iconify/blob/main/LICENSE)

## Features

- **212 Icon Sets** - Material Design, Heroicons, Lucide, Phosphor, Font Awesome, and 200+ more
- **268,000+ Icons** - Access the entire [Iconify](https://iconify.design) ecosystem
- **Expo Vector Icons API** - Familiar `<Mdi name="home" />` syntax
- **Full TypeScript Autocomplete** - Per-component type safety without IDE slowdown
- **Native MMKV Caching** - 30x faster than AsyncStorage, persistent disk cache
- **TurboModule Support** - Native background prefetching for New Architecture
- **Offline Support** - Icons persist across app restarts

## Installation

```bash
npm install rn-iconify react-native-svg react-native-mmkv
```

### iOS

```bash
cd ios && pod install
```

### Expo

```bash
npx expo install react-native-svg react-native-mmkv
npx expo prebuild
```

> **Note:** rn-iconify requires a development build. It will not work with Expo Go.

## Quick Start

```tsx
import { Mdi, Heroicons, Lucide, Ph } from 'rn-iconify';

export default function App() {
  return (
    <>
      <Mdi name="home" size={24} color="blue" />
      <Heroicons name="user" size={24} color="red" />
      <Lucide name="camera" size={24} />
      <Ph name="house" size={24} color="#6366f1" />
    </>
  );
}
```

## Popular Icon Sets

| Component         | Prefix           | Icons  | Description             |
| ----------------- | ---------------- | ------ | ----------------------- |
| `Mdi`             | mdi              | 7,447  | Material Design Icons   |
| `Heroicons`       | heroicons        | 1,288  | Heroicons by Tailwind   |
| `Lucide`          | lucide           | 1,650  | Lucide Icons            |
| `Ph`              | ph               | 9,072  | Phosphor Icons          |
| `Feather`         | feather          | 286    | Feather Icons           |
| `Tabler`          | tabler           | 5,963  | Tabler Icons            |
| `Bi`              | bi               | 2,078  | Bootstrap Icons         |
| `Fa6Solid`        | fa6-solid        | 1,402  | Font Awesome 6 Solid    |
| `Fa7Solid`        | fa7-solid        | 1,983  | Font Awesome 7 Solid    |
| `Ri`              | ri               | 3,135  | Remix Icons             |
| `Carbon`          | carbon           | 2,392  | IBM Carbon Icons        |
| `Fluent`          | fluent           | 18,729 | Microsoft Fluent UI     |
| `MaterialSymbols` | material-symbols | 15,049 | Google Material Symbols |
| `Solar`           | solar            | 7,401  | Solar Icons             |
| `Ion`             | ion              | 1,357  | Ionicons                |
| `AntDesign`       | ant-design       | 830    | Ant Design Icons        |

...and **196 more icon sets**! Browse all at [icon-sets.iconify.design](https://icon-sets.iconify.design/)

## Props

| Prop                 | Type                                   | Default      | Description                        |
| -------------------- | -------------------------------------- | ------------ | ---------------------------------- |
| `name`               | `string`                               | **required** | Icon name (with autocomplete)      |
| `size`               | `number`                               | `24`         | Icon width and height              |
| `color`              | `string`                               | `'#000000'`  | Icon color                         |
| `width`              | `number`                               | -            | Custom width (overrides size)      |
| `height`             | `number`                               | -            | Custom height (overrides size)     |
| `rotate`             | `0 \| 90 \| 180 \| 270`                | `0`          | Rotation angle                     |
| `flip`               | `'horizontal' \| 'vertical' \| 'both'` | -            | Flip direction                     |
| `style`              | `ViewStyle`                            | -            | Additional styles                  |
| `fallback`           | `ReactNode`                            | -            | Component shown while loading      |
| `fallbackDelay`      | `number`                               | `0`          | Delay before showing fallback (ms) |
| `onLoad`             | `() => void`                           | -            | Called when icon loads             |
| `onError`            | `(error: Error) => void`               | -            | Called on load failure             |
| `accessibilityLabel` | `string`                               | icon name    | Accessibility label                |
| `testID`             | `string`                               | -            | Test identifier                    |

## TypeScript

Full autocomplete for all 268,000+ icons:

```tsx
import { Mdi, type MdiIconName } from 'rn-iconify';

interface TabBarIconProps {
  name: MdiIconName;
  focused: boolean;
}

function TabBarIcon({ name, focused }: TabBarIconProps) {
  return (
    <Mdi
      name={name} // Full autocomplete!
      size={24}
      color={focused ? 'blue' : 'gray'}
    />
  );
}

<TabBarIcon name="home" focused />     // Valid
<TabBarIcon name="invalid" focused />  // TypeScript error
```

## Prefetching

Preload icons for instant rendering:

```tsx
import { prefetchIcons } from 'rn-iconify';

async function initApp() {
  const result = await prefetchIcons(['mdi:home', 'mdi:settings', 'heroicons:user']);
  console.log(`Prefetched: ${result.success.length}`);
}
```

## Cache Management

```tsx
import { getCacheStats, clearCache } from 'rn-iconify';

// Get statistics
const stats = getCacheStats();
console.log(`Memory: ${stats.memoryCount}, Disk: ${stats.diskCount}`);

// Clear all caches
await clearCache();
```

## Examples

```tsx
// Basic
<Mdi name="home" size={24} color="blue" />

// Rotation
<Mdi name="arrow-right" rotate={90} />

// Flip
<Mdi name="arrow-left" flip="horizontal" />

// Loading fallback
<Mdi
  name="home"
  fallback={<ActivityIndicator size="small" />}
  onLoad={() => console.log('Loaded!')}
/>
```

## Performance

| Metric             | Value     |
| ------------------ | --------- |
| Memory cache       | < 1ms     |
| MMKV disk cache    | < 5ms     |
| Network fetch      | 100-500ms |
| Bundle size (core) | ~50KB     |

## Compatibility

| Platform                | Version |
| ----------------------- | ------- |
| React Native            | 0.60.0+ |
| React Native (New Arch) | 0.72.0+ |
| iOS                     | 13.0+   |
| Android                 | API 21+ |

## Contributing

```bash
git clone https://github.com/mogretici/rn-iconify.git
npm install
npm test
npm run build
npm run generate-components  # Regenerate from Iconify API
```

## Credits

- [Iconify](https://iconify.design/) - Icon framework
- [react-native-svg](https://github.com/software-mansion/react-native-svg) - SVG rendering
- [react-native-mmkv](https://github.com/mrousavy/react-native-mmkv) - Fast storage

## License

MIT
