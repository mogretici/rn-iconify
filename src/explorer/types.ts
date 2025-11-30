/**
 * Icon Explorer types for rn-iconify
 * Development tool for exploring and testing icons
 */

import type { IconProps } from '../types';

/**
 * Icon set metadata
 */
export interface IconSetInfo {
  /**
   * Icon set prefix (e.g., "mdi", "heroicons")
   */
  prefix: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Number of icons in the set
   */
  total: number;

  /**
   * Icon set author
   */
  author?: string;

  /**
   * Icon set license
   */
  license?: string;

  /**
   * Sample icon names
   */
  samples?: string[];

  /**
   * Icon set category
   */
  category?: 'general' | 'brand' | 'emoji' | 'flags' | 'weather' | 'other';
}

/**
 * Search result item
 */
export interface SearchResult {
  /**
   * Full icon name (prefix:name)
   */
  fullName: string;

  /**
   * Icon set prefix
   */
  prefix: string;

  /**
   * Icon name without prefix
   */
  name: string;

  /**
   * Search relevance score (0-1)
   */
  score: number;
}

/**
 * Icon preview configuration
 */
export interface PreviewConfig {
  /**
   * Preview sizes to show
   */
  sizes: number[];

  /**
   * Preview colors to show
   */
  colors: string[];

  /**
   * Show icon name
   */
  showName: boolean;

  /**
   * Show icon code snippet
   */
  showCode: boolean;

  /**
   * Background color for preview
   */
  backgroundColor: string;
}

/**
 * Explorer configuration
 */
export interface ExplorerConfig {
  /**
   * Icon sets to include
   * If empty, includes all available sets
   */
  iconSets?: string[];

  /**
   * Initial search query
   */
  initialQuery?: string;

  /**
   * Maximum results to show
   * @default 100
   */
  maxResults?: number;

  /**
   * Preview configuration
   */
  preview?: Partial<PreviewConfig>;

  /**
   * Callback when icon is selected
   */
  onIconSelect?: (iconName: string) => void;

  /**
   * Callback when icon code is copied
   */
  onCopyCode?: (code: string) => void;

  /**
   * Enable keyboard shortcuts
   * @default true
   */
  keyboardShortcuts?: boolean;
}

/**
 * Resolved explorer configuration
 */
export interface ResolvedExplorerConfig {
  iconSets: string[];
  initialQuery: string;
  maxResults: number;
  preview: PreviewConfig;
  onIconSelect?: (iconName: string) => void;
  onCopyCode?: (code: string) => void;
  keyboardShortcuts: boolean;
}

/**
 * Explorer state
 */
export interface ExplorerState {
  /**
   * Current search query
   */
  query: string;

  /**
   * Search results
   */
  results: SearchResult[];

  /**
   * Currently selected icon
   */
  selectedIcon: string | null;

  /**
   * Currently active icon set filter
   */
  activeIconSet: string | null;

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error message if any
   */
  error: string | null;

  /**
   * Current preview size
   */
  previewSize: number;

  /**
   * Current preview color
   */
  previewColor: string;
}

/**
 * Explorer actions
 */
export interface ExplorerActions {
  /**
   * Update search query
   */
  setQuery: (query: string) => void;

  /**
   * Select an icon
   */
  selectIcon: (iconName: string | null) => void;

  /**
   * Filter by icon set
   */
  filterByIconSet: (prefix: string | null) => void;

  /**
   * Change preview size
   */
  setPreviewSize: (size: number) => void;

  /**
   * Change preview color
   */
  setPreviewColor: (color: string) => void;

  /**
   * Copy icon code to clipboard
   */
  copyIconCode: (iconName: string, format?: 'jsx' | 'import') => void;

  /**
   * Reset explorer state
   */
  reset: () => void;
}

/**
 * Icon Explorer context value
 */
export interface ExplorerContextValue extends ExplorerState, ExplorerActions {
  /**
   * Explorer configuration
   */
  config: ResolvedExplorerConfig;

  /**
   * Available icon sets
   */
  iconSets: IconSetInfo[];

  /**
   * Total number of icons available
   */
  totalIcons: number;

  /**
   * Whether all collections have been loaded
   */
  collectionsLoaded: boolean;
}

/**
 * Props for IconExplorer component
 */
export interface IconExplorerProps extends ExplorerConfig {
  /**
   * Whether the explorer is visible
   */
  visible?: boolean;

  /**
   * Callback when explorer is closed
   */
  onClose?: () => void;

  /**
   * Custom styles
   */
  style?: object;
}

/**
 * Props for IconGrid component
 */
export interface IconGridProps {
  /**
   * Icons to display
   */
  icons: SearchResult[];

  /**
   * Selected icon
   */
  selectedIcon?: string | null;

  /**
   * Preview size
   */
  size?: number;

  /**
   * Preview color
   */
  color?: string;

  /**
   * Callback when icon is pressed
   */
  onIconPress?: (iconName: string) => void;

  /**
   * Number of columns
   */
  columns?: number;
}

/**
 * Props for IconPreview component
 */
export interface IconPreviewProps {
  /**
   * Icon name to preview
   */
  iconName: string;

  /**
   * Preview config
   */
  config?: Partial<PreviewConfig>;

  /**
   * Additional icon props
   */
  iconProps?: Partial<IconProps>;

  /**
   * Callback when copy code is pressed
   */
  onCopyCode?: (code: string) => void;
}

/**
 * Props for SearchBar component
 */
export interface SearchBarProps {
  /**
   * Current search value
   */
  value: string;

  /**
   * Callback when search value changes
   */
  onChangeText: (text: string) => void;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Auto focus on mount
   */
  autoFocus?: boolean;
}

/**
 * Props for IconSetFilter component
 */
export interface IconSetFilterProps {
  /**
   * Available icon sets
   */
  iconSets: IconSetInfo[];

  /**
   * Currently selected icon set
   */
  selected: string | null;

  /**
   * Callback when selection changes
   */
  onSelect: (prefix: string | null) => void;
}
