/**
 * Icon Explorer Module for rn-iconify
 * Development tool for exploring and testing icons
 *
 * @example
 * ```tsx
 * import { IconExplorer } from 'rn-iconify/explorer';
 *
 * // Only render in development
 * function DevTools() {
 *   const [showExplorer, setShowExplorer] = useState(false);
 *
 *   if (!__DEV__) return null;
 *
 *   return (
 *     <>
 *       <Button title="Open Icon Explorer" onPress={() => setShowExplorer(true)} />
 *       <IconExplorer
 *         visible={showExplorer}
 *         onClose={() => setShowExplorer(false)}
 *         onIconSelect={(name) => console.log('Selected:', name)}
 *       />
 *     </>
 *   );
 * }
 * ```
 */

// Types
export type {
  IconSetInfo,
  SearchResult,
  PreviewConfig,
  ExplorerConfig,
  ResolvedExplorerConfig,
  ExplorerState,
  ExplorerActions,
  ExplorerContextValue,
  IconExplorerProps,
  IconGridProps,
  IconPreviewProps,
  SearchBarProps,
  IconSetFilterProps,
} from './types';

// Components
export { IconExplorer, ExplorerContext, useExplorerContext } from './IconExplorer';

// Hooks
export { useExplorer, DEFAULT_PREVIEW_CONFIG, DEFAULT_EXPLORER_CONFIG } from './useExplorer';

// Icon Set Utilities
export {
  POPULAR_ICON_SETS,
  getAllIconSets,
  getIconSetByPrefix,
  getIconSetsByCategory,
  searchIconSets,
  generateImportStatement,
  generateIconJSX,
} from './iconSets';

// Default export
export { IconExplorer as default } from './IconExplorer';
