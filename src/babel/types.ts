/**
 * Babel Plugin Types
 * Type definitions for the rn-iconify Babel plugin
 */

import type { NodePath } from '@babel/core';
import type { JSXOpeningElement, CallExpression } from '@babel/types';

/**
 * Plugin options that can be passed in babel.config.js
 */
export interface BabelPluginOptions {
  /**
   * Patterns for icons to include (supports wildcards)
   * @example ['mdi:*', 'heroicons:user']
   */
  include?: string[];

  /**
   * Patterns for icons to exclude
   * @example ['mdi:test-*']
   */
  exclude?: string[];

  /**
   * Output directory for the generated cache
   * @default 'node_modules/.cache/rn-iconify'
   */
  outputPath?: string;

  /**
   * Enable verbose logging during build
   * @default false
   */
  verbose?: boolean;

  /**
   * Disable the plugin (useful for debugging)
   * @default false
   */
  disabled?: boolean;
}

/**
 * Babel file object structure (for pre/post hooks)
 */
export interface BabelFile {
  opts: {
    filename?: string;
    root?: string;
  };
}

/**
 * Plugin state passed between visitors
 * Matches Babel's internal state structure
 * Note: filename and file may not always be present depending on Babel version/config
 */
export interface BabelPluginState {
  opts: BabelPluginOptions;
  filename?: string;
  file?: BabelFile;
}

/**
 * Type guard to check if an object has opts with filename
 */
function hasOptsWithFilename(obj: unknown): obj is { opts: { filename: string } } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'opts' in obj &&
    typeof (obj as Record<string, unknown>).opts === 'object' &&
    (obj as Record<string, unknown>).opts !== null &&
    'filename' in ((obj as Record<string, unknown>).opts as object) &&
    typeof (obj as Record<string, { filename: unknown }>).opts.filename === 'string'
  );
}

/**
 * Type guard to check if an object has a filename property
 */
function hasFilename(obj: unknown): obj is { filename: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'filename' in obj &&
    typeof (obj as Record<string, unknown>).filename === 'string'
  );
}

/**
 * Type guard to check if an object has file.opts.filename
 */
function hasFileOptsFilename(obj: unknown): obj is { file: { opts: { filename: string } } } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'file' in obj &&
    hasOptsWithFilename((obj as Record<string, unknown>).file)
  );
}

/**
 * Helper to safely extract filename from visitor state
 */
export function getFilenameFromState(state: BabelPluginState): string {
  // Babel provides filename directly on state
  if (state.filename) {
    return state.filename;
  }

  // Fallback to file.opts.filename
  if (state.file?.opts?.filename) {
    return state.file.opts.filename;
  }

  return '';
}

/**
 * Helper to safely extract filename from any object (pre/post hooks or visitor state)
 * Uses type guards to safely access nested properties
 */
export function getFilename(obj: unknown): string {
  // Check for direct filename property
  if (hasFilename(obj)) {
    return obj.filename;
  }

  // Check for opts.filename (BabelFile structure)
  if (hasOptsWithFilename(obj)) {
    return obj.opts.filename;
  }

  // Check for file.opts.filename
  if (hasFileOptsFilename(obj)) {
    return obj.file.opts.filename;
  }

  return '';
}

/**
 * Alias for getFilename - used in pre/post hooks where file object is passed
 * This is a more descriptive name for when working with BabelFile objects
 */
export function getFilenameFromFile(file: unknown): string {
  return getFilename(file);
}

/**
 * Collected icon information
 */
export interface CollectedIcon {
  /**
   * Full icon name (prefix:name)
   */
  name: string;

  /**
   * Source file where the icon was found
   */
  file: string;

  /**
   * Line number in source
   */
  line: number;

  /**
   * Column number in source
   */
  column: number;
}

/**
 * Icon bundle structure (matches CLI output)
 */
export interface IconBundle {
  version: string;
  generatedAt: string;
  icons: Record<
    string,
    {
      svg: string;
      width: number;
      height: number;
    }
  >;
  count: number;
}

/**
 * JSX visitor function type
 */
export type JSXVisitor = (path: NodePath<JSXOpeningElement>, state: BabelPluginState) => void;

/**
 * Call expression visitor function type
 */
export type CallVisitor = (path: NodePath<CallExpression>, state: BabelPluginState) => void;

/**
 * Complete mapping of React component names to Iconify prefixes
 * This covers all 200+ icon sets available in rn-iconify
 */
export const COMPONENT_PREFIX_MAP: Record<string, string> = {
  // Popular icon sets
  Mdi: 'mdi',
  MdiLight: 'mdi-light',
  Heroicons: 'heroicons',
  HeroiconsOutline: 'heroicons-outline',
  HeroiconsSolid: 'heroicons-solid',
  Lucide: 'lucide',
  LucideLab: 'lucide-lab',
  Ph: 'ph',
  Feather: 'feather',
  Tabler: 'tabler',
  Bi: 'bi',
  Ri: 'ri',
  Carbon: 'carbon',
  Ion: 'ion',
  Octicon: 'octicon',
  SimpleIcons: 'simple-icons',
  Logos: 'logos',
  Solar: 'solar',
  Iconoir: 'iconoir',

  // Font Awesome
  Fa: 'fa',
  FaBrands: 'fa-brands',
  FaRegular: 'fa-regular',
  FaSolid: 'fa-solid',
  Fa6Solid: 'fa6-solid',
  Fa6Regular: 'fa6-regular',
  Fa6Brands: 'fa6-brands',
  Fa7Solid: 'fa7-solid',
  Fa7Regular: 'fa7-regular',
  Fa7Brands: 'fa7-brands',
  Fad: 'fad',

  // Fluent
  Fluent: 'fluent',
  FluentColor: 'fluent-color',
  FluentEmoji: 'fluent-emoji',
  FluentEmojiFlat: 'fluent-emoji-flat',
  FluentEmojiHighContrast: 'fluent-emoji-high-contrast',
  FluentMdl2: 'fluent-mdl2',

  // Material
  MaterialSymbols: 'material-symbols',
  MaterialSymbolsLight: 'material-symbols-light',
  MaterialIconTheme: 'material-icon-theme',

  // Ant Design
  AntDesign: 'ant-design',

  // Academicons
  Academicons: 'academicons',

  // Akar
  AkarIcons: 'akar-icons',

  // Arcticons
  Arcticons: 'arcticons',

  // Basil
  Basil: 'basil',

  // Bitcoin
  BitcoinIcons: 'bitcoin-icons',

  // BPMN
  Bpmn: 'bpmn',

  // Brandico
  Brandico: 'brandico',

  // BoxIcons
  Bx: 'bx',
  Bxl: 'bxl',
  Bxs: 'bxs',

  // Bytesize
  Bytesize: 'bytesize',

  // Catppuccin
  Catppuccin: 'catppuccin',

  // CBI
  Cbi: 'cbi',

  // Charm
  Charm: 'charm',

  // Coolicons
  Ci: 'ci',

  // CoreUI
  Cib: 'cib',
  Cif: 'cif',
  Cil: 'cil',

  // Circle Flags
  CircleFlags: 'circle-flags',

  // Circum
  Circum: 'circum',

  // Clarity
  Clarity: 'clarity',

  // Codex
  Codex: 'codex',

  // Codicon
  Codicon: 'codicon',

  // Covid
  Covid: 'covid',

  // Cryptocurrency
  Cryptocurrency: 'cryptocurrency',
  CryptocurrencyColor: 'cryptocurrency-color',

  // Cuida
  Cuida: 'cuida',

  // Dashicons
  Dashicons: 'dashicons',

  // Devicon
  Devicon: 'devicon',
  DeviconPlain: 'devicon-plain',

  // Dinkie
  DinkieIcons: 'dinkie-icons',

  // Duo
  DuoIcons: 'duo-icons',

  // Evil Icons
  Ei: 'ei',

  // Elusive
  El: 'el',

  // Emojione
  EmojioneMonotone: 'emojione-monotone',

  // Entypo
  Entypo: 'entypo',
  EntypoSocial: 'entypo-social',

  // EOS Icons
  EosIcons: 'eos-icons',

  // Element Plus
  Ep: 'ep',

  // Elegant Themes
  Et: 'et',

  // Eva
  Eva: 'eva',

  // Framework7
  F7: 'f7',

  // Famicons
  Famicons: 'famicons',

  // Feather (alternate)
  Fe: 'fe',

  // File Icons
  FileIcons: 'file-icons',

  // Flags
  Flag: 'flag',
  Flagpack: 'flagpack',

  // Flat UI
  FlatUi: 'flat-ui',

  // Flowbite
  Flowbite: 'flowbite',

  // Fontelico
  Fontelico: 'fontelico',

  // Fontisto
  Fontisto: 'fontisto',

  // Formkit
  Formkit: 'formkit',

  // Foundation
  Foundation: 'foundation',

  // Gala
  Gala: 'gala',

  // Game Icons
  GameIcons: 'game-icons',

  // Garden
  Garden: 'garden',

  // Geo
  Geo: 'geo',

  // GG
  Gg: 'gg',

  // GIS
  Gis: 'gis',

  // Gravity UI
  GravityUi: 'gravity-ui',

  // Gridicons
  Gridicons: 'gridicons',

  // Grommet
  GrommetIcons: 'grommet-icons',

  // Guidance
  Guidance: 'guidance',

  // Health Icons
  Healthicons: 'healthicons',

  // Hugeicons
  Hugeicons: 'hugeicons',

  // Humble
  Humbleicons: 'humbleicons',

  // Google Material (IC)
  Ic: 'ic',

  // IcoMoon
  IcomoonFree: 'icomoon-free',

  // Icon Park
  IconPark: 'icon-park',
  IconParkOutline: 'icon-park-outline',
  IconParkSolid: 'icon-park-solid',
  IconParkTwotone: 'icon-park-twotone',

  // Iconamoon
  Iconamoon: 'iconamoon',

  // Icons8
  Icons8: 'icons8',

  // IL
  Il: 'il',

  // IWWA
  Iwwa: 'iwwa',

  // IX
  Ix: 'ix',

  // Jam
  Jam: 'jam',

  // Line Awesome
  La: 'la',

  // Lets Icons
  LetsIcons: 'lets-icons',

  // Line MD
  LineMd: 'line-md',

  // Line Icons
  Lineicons: 'lineicons',

  // LS
  Ls: 'ls',
  Lsicon: 'lsicon',

  // Mage
  Mage: 'mage',

  // Majesticons
  Majesticons: 'majesticons',

  // Maki
  Maki: 'maki',

  // Map
  Map: 'map',

  // Marketeq
  Marketeq: 'marketeq',

  // Medical
  MedicalIcon: 'medical-icon',

  // Memory
  Memory: 'memory',

  // Meteocons
  Meteocons: 'meteocons',

  // Meteor Icons
  MeteorIcons: 'meteor-icons',

  // MI
  Mi: 'mi',

  // Mingcute
  Mingcute: 'mingcute',

  // Mono
  MonoIcons: 'mono-icons',

  // Mynaui
  Mynaui: 'mynaui',

  // Nimbus
  Nimbus: 'nimbus',

  // Nonicons
  Nonicons: 'nonicons',

  // NRK
  Nrk: 'nrk',

  // Open Iconic
  Oi: 'oi',

  // OOUI
  Ooui: 'ooui',

  // OUI (Elastic)
  Oui: 'oui',

  // Pajamas (GitLab)
  Pajamas: 'pajamas',

  // Pepicons
  Pepicons: 'pepicons',
  PepiconsPencil: 'pepicons-pencil',
  PepiconsPop: 'pepicons-pop',
  PepiconsPrint: 'pepicons-print',

  // Picon
  Picon: 'picon',

  // Pixel
  Pixel: 'pixel',
  Pixelarticons: 'pixelarticons',

  // Prime
  Prime: 'prime',

  // Proicons
  Proicons: 'proicons',

  // PS
  Ps: 'ps',

  // Qlementine
  QlementineIcons: 'qlementine-icons',

  // Quill
  Quill: 'quill',

  // Radix
  RadixIcons: 'radix-icons',

  // Raphael
  Raphael: 'raphael',

  // Rivet
  RivetIcons: 'rivet-icons',

  // Roentgen
  Roentgen: 'roentgen',

  // SI
  Si: 'si',
  SiGlyph: 'si-glyph',

  // Sidekick
  Sidekickicons: 'sidekickicons',

  // Simple Line
  SimpleLineIcons: 'simple-line-icons',

  // Skill Icons
  SkillIcons: 'skill-icons',

  // Stash
  Stash: 'stash',

  // Streamline
  Streamline: 'streamline',
  StreamlineBlock: 'streamline-block',
  StreamlineColor: 'streamline-color',
  StreamlineCyber: 'streamline-cyber',
  StreamlineCyberColor: 'streamline-cyber-color',
  StreamlineEmojis: 'streamline-emojis',
  StreamlineFlex: 'streamline-flex',
  StreamlineFlexColor: 'streamline-flex-color',
  StreamlineFreehand: 'streamline-freehand',
  StreamlineFreehandColor: 'streamline-freehand-color',
  StreamlineKameleonColor: 'streamline-kameleon-color',
  StreamlineLogos: 'streamline-logos',
  StreamlinePixel: 'streamline-pixel',
  StreamlinePlump: 'streamline-plump',
  StreamlinePlumpColor: 'streamline-plump-color',
  StreamlineSharp: 'streamline-sharp',
  StreamlineSharpColor: 'streamline-sharp-color',
  StreamlineStickiesColor: 'streamline-stickies-color',
  StreamlineUltimate: 'streamline-ultimate',
  StreamlineUltimateColor: 'streamline-ultimate-color',

  // Subway
  Subway: 'subway',

  // SVG Spinners
  SvgSpinners: 'svg-spinners',

  // System UIcons
  SystemUicons: 'system-uicons',

  // TDesign
  Tdesign: 'tdesign',

  // Teenyicons
  Teenyicons: 'teenyicons',

  // Temaki
  Temaki: 'temaki',

  // Token
  Token: 'token',
  TokenBranded: 'token-branded',

  // Topcoat
  Topcoat: 'topcoat',

  // Typicons
  Typcn: 'typcn',

  // Unicons
  Uil: 'uil',
  Uim: 'uim',
  Uis: 'uis',
  Uit: 'uit',

  // UIW
  Uiw: 'uiw',

  // UnJS
  Unjs: 'unjs',

  // Vaadin
  Vaadin: 'vaadin',

  // VS
  Vs: 'vs',

  // VSCode Icons
  VscodeIcons: 'vscode-icons',

  // Web Symbol
  Websymbol: 'websymbol',

  // WeUI
  Weui: 'weui',

  // WHH
  Whh: 'whh',

  // Weather Icons
  Wi: 'wi',

  // WPF
  Wpf: 'wpf',

  // ZMDI
  Zmdi: 'zmdi',

  // Zondicons
  Zondicons: 'zondicons',
};

/**
 * Reverse map: prefix -> component name
 */
export const PREFIX_COMPONENT_MAP: Record<string, string> = Object.entries(
  COMPONENT_PREFIX_MAP
).reduce(
  (acc, [component, prefix]) => {
    acc[prefix] = component;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Set of all valid component names for fast lookup
 */
export const VALID_COMPONENTS = new Set(Object.keys(COMPONENT_PREFIX_MAP));

/**
 * Set of all valid prefixes for fast lookup
 */
export const VALID_PREFIXES = new Set(Object.values(COMPONENT_PREFIX_MAP));
