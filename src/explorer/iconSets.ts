/**
 * Icon Set Registry for Icon Explorer
 * Contains metadata about all available icon sets
 */

import type { IconSetInfo } from './types';

/**
 * Popular icon sets with metadata
 * This is a subset of all available sets for the explorer
 */
export const POPULAR_ICON_SETS: IconSetInfo[] = [
  {
    prefix: 'mdi',
    name: 'Material Design Icons',
    total: 7000,
    author: 'Austin Andrews',
    license: 'Apache 2.0',
    samples: ['home', 'account', 'settings', 'menu', 'close'],
    category: 'general',
  },
  {
    prefix: 'heroicons',
    name: 'Heroicons',
    total: 292,
    author: 'Tailwind Labs',
    license: 'MIT',
    samples: ['home', 'user', 'cog', 'menu', 'x-mark'],
    category: 'general',
  },
  {
    prefix: 'lucide',
    name: 'Lucide',
    total: 1400,
    author: 'Lucide Contributors',
    license: 'ISC',
    samples: ['home', 'user', 'settings', 'menu', 'x'],
    category: 'general',
  },
  {
    prefix: 'ph',
    name: 'Phosphor',
    total: 7488,
    author: 'Phosphor Icons',
    license: 'MIT',
    samples: ['house', 'user', 'gear', 'list', 'x'],
    category: 'general',
  },
  {
    prefix: 'feather',
    name: 'Feather Icons',
    total: 287,
    author: 'Cole Bemis',
    license: 'MIT',
    samples: ['home', 'user', 'settings', 'menu', 'x'],
    category: 'general',
  },
  {
    prefix: 'tabler',
    name: 'Tabler Icons',
    total: 4500,
    author: 'Paweł Kuna',
    license: 'MIT',
    samples: ['home', 'user', 'settings', 'menu', 'x'],
    category: 'general',
  },
  {
    prefix: 'ion',
    name: 'Ionicons',
    total: 1300,
    author: 'Ionic',
    license: 'MIT',
    samples: ['home', 'person', 'settings', 'menu', 'close'],
    category: 'general',
  },
  {
    prefix: 'fa6-solid',
    name: 'Font Awesome 6 Solid',
    total: 1390,
    author: 'Fonticons',
    license: 'CC BY 4.0',
    samples: ['house', 'user', 'gear', 'bars', 'xmark'],
    category: 'general',
  },
  {
    prefix: 'fa6-regular',
    name: 'Font Awesome 6 Regular',
    total: 163,
    author: 'Fonticons',
    license: 'CC BY 4.0',
    samples: ['user', 'star', 'heart', 'bell', 'file'],
    category: 'general',
  },
  {
    prefix: 'fa6-brands',
    name: 'Font Awesome 6 Brands',
    total: 484,
    author: 'Fonticons',
    license: 'CC BY 4.0',
    samples: ['github', 'twitter', 'facebook', 'instagram', 'linkedin'],
    category: 'brand',
  },
  {
    prefix: 'bi',
    name: 'Bootstrap Icons',
    total: 2000,
    author: 'Bootstrap Team',
    license: 'MIT',
    samples: ['house', 'person', 'gear', 'list', 'x'],
    category: 'general',
  },
  {
    prefix: 'ri',
    name: 'Remix Icons',
    total: 2800,
    author: 'Remix Design',
    license: 'Apache 2.0',
    samples: ['home-line', 'user-line', 'settings-line', 'menu-line', 'close-line'],
    category: 'general',
  },
  {
    prefix: 'carbon',
    name: 'Carbon Icons',
    total: 2300,
    author: 'IBM',
    license: 'Apache 2.0',
    samples: ['home', 'user', 'settings', 'menu', 'close'],
    category: 'general',
  },
  {
    prefix: 'ant-design',
    name: 'Ant Design Icons',
    total: 789,
    author: 'Ant Design',
    license: 'MIT',
    samples: [
      'home-outlined',
      'user-outlined',
      'setting-outlined',
      'menu-outlined',
      'close-outlined',
    ],
    category: 'general',
  },
  {
    prefix: 'octicon',
    name: 'Octicons',
    total: 550,
    author: 'GitHub',
    license: 'MIT',
    samples: ['home', 'person', 'gear', 'three-bars', 'x'],
    category: 'general',
  },
  {
    prefix: 'fluent',
    name: 'Fluent UI Icons',
    total: 10000,
    author: 'Microsoft',
    license: 'MIT',
    samples: ['home-24-regular', 'person-24-regular', 'settings-24-regular'],
    category: 'general',
  },
  {
    prefix: 'material-symbols',
    name: 'Material Symbols',
    total: 3000,
    author: 'Google',
    license: 'Apache 2.0',
    samples: ['home', 'person', 'settings', 'menu', 'close'],
    category: 'general',
  },
  {
    prefix: 'simple-icons',
    name: 'Simple Icons',
    total: 2900,
    author: 'Simple Icons',
    license: 'CC0 1.0',
    samples: ['github', 'twitter', 'facebook', 'instagram', 'linkedin'],
    category: 'brand',
  },
  {
    prefix: 'logos',
    name: 'SVG Logos',
    total: 1300,
    author: 'Gil Barbara',
    license: 'CC0 1.0',
    samples: ['react', 'vue', 'angular', 'nodejs', 'typescript'],
    category: 'brand',
  },
  {
    prefix: 'twemoji',
    name: 'Twitter Emoji',
    total: 3600,
    author: 'Twitter',
    license: 'CC BY 4.0',
    samples: ['grinning-face', 'red-heart', 'thumbs-up', 'fire', 'star'],
    category: 'emoji',
  },
  {
    prefix: 'noto',
    name: 'Noto Emoji',
    total: 3000,
    author: 'Google',
    license: 'Apache 2.0',
    samples: ['grinning-face', 'red-heart', 'thumbs-up', 'fire', 'star'],
    category: 'emoji',
  },
  {
    prefix: 'flag',
    name: 'Flag Icons',
    total: 530,
    author: 'Iconify',
    license: 'MIT',
    samples: ['us', 'gb', 'de', 'fr', 'jp'],
    category: 'flags',
  },
  {
    prefix: 'circle-flags',
    name: 'Circle Flags',
    total: 400,
    author: 'HatScripts',
    license: 'MIT',
    samples: ['us', 'gb', 'de', 'fr', 'jp'],
    category: 'flags',
  },
  {
    prefix: 'meteocons',
    name: 'Meteocons',
    total: 300,
    author: 'Bas Milius',
    license: 'MIT',
    samples: ['clear-day', 'cloudy', 'rain', 'snow', 'thunderstorms'],
    category: 'weather',
  },
];

/**
 * Get all available icon sets
 */
export function getAllIconSets(): IconSetInfo[] {
  return POPULAR_ICON_SETS;
}

/**
 * Get icon set by prefix
 */
export function getIconSetByPrefix(prefix: string): IconSetInfo | undefined {
  return POPULAR_ICON_SETS.find((set) => set.prefix === prefix);
}

/**
 * Get icon sets by category
 */
export function getIconSetsByCategory(category: IconSetInfo['category']): IconSetInfo[] {
  return POPULAR_ICON_SETS.filter((set) => set.category === category);
}

/**
 * Search icon sets by name
 */
export function searchIconSets(query: string): IconSetInfo[] {
  const lowerQuery = query.toLowerCase();
  return POPULAR_ICON_SETS.filter(
    (set) =>
      set.prefix.toLowerCase().includes(lowerQuery) || set.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Generate import statement for an icon
 */
export function generateImportStatement(iconName: string): string {
  const [prefix] = iconName.split(':');
  const componentName = getComponentName(prefix);
  return `import { ${componentName} } from 'rn-iconify';`;
}

/**
 * Generate JSX code for an icon
 */
export function generateIconJSX(
  iconName: string,
  size: number = 24,
  color: string = 'currentColor'
): string {
  const [prefix, name] = iconName.split(':');
  const componentName = getComponentName(prefix);
  return `<${componentName} name="${name}" size={${size}} color="${color}" />`;
}

/**
 * Get component name from prefix
 */
function getComponentName(prefix: string): string {
  // Map common prefixes to component names
  const prefixMap: Record<string, string> = {
    mdi: 'Mdi',
    heroicons: 'Heroicons',
    lucide: 'Lucide',
    ph: 'Ph',
    feather: 'Feather',
    tabler: 'Tabler',
    ion: 'Ion',
    'fa6-solid': 'Fa6Solid',
    'fa6-regular': 'Fa6Regular',
    'fa6-brands': 'Fa6Brands',
    bi: 'Bi',
    ri: 'Ri',
    carbon: 'Carbon',
    'ant-design': 'AntDesign',
    octicon: 'Octicon',
    fluent: 'Fluent',
    'material-symbols': 'MaterialSymbols',
    'simple-icons': 'SimpleIcons',
    logos: 'Logos',
    twemoji: 'Twemoji',
    noto: 'Noto',
    flag: 'Flag',
    'circle-flags': 'CircleFlags',
    meteocons: 'Meteocons',
  };

  return prefixMap[prefix] || pascalCase(prefix);
}

/**
 * Convert string to PascalCase
 */
function pascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}
