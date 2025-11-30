/**
 * Hook for managing Icon Explorer state
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Clipboard, Alert, Platform } from 'react-native';
import type {
  ExplorerConfig,
  ResolvedExplorerConfig,
  ExplorerState,
  ExplorerActions,
  ExplorerContextValue,
  SearchResult,
  PreviewConfig,
} from './types';
import { getAllIconSets, generateImportStatement, generateIconJSX } from './iconSets';
import { fetchCollection, searchIconsAPI } from '../network/IconifyAPI';

/**
 * Default preview configuration
 */
export const DEFAULT_PREVIEW_CONFIG: PreviewConfig = {
  sizes: [16, 24, 32, 48, 64],
  colors: ['#000000', '#6366F1', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
  showName: true,
  showCode: true,
  backgroundColor: '#FFFFFF',
};

/**
 * Default explorer configuration
 */
export const DEFAULT_EXPLORER_CONFIG: ResolvedExplorerConfig = {
  iconSets: [],
  initialQuery: '',
  maxResults: 100,
  preview: DEFAULT_PREVIEW_CONFIG,
  keyboardShortcuts: true,
};

/**
 * Initial explorer state
 */
const initialState: ExplorerState = {
  query: '',
  results: [],
  selectedIcon: null,
  activeIconSet: null,
  isLoading: false,
  error: null,
  previewSize: 24,
  previewColor: '#000000',
};

/**
 * Cache for fetched collection icons
 */
const collectionCache = new Map<string, string[]>();

/**
 * Search icons locally from cached collections
 */
function searchIconsLocally(
  query: string,
  cachedIcons: Map<string, string[]>,
  iconSetPrefix: string | null,
  maxResults: number
): SearchResult[] {
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  // Get prefixes to search
  const prefixesToSearch = iconSetPrefix ? [iconSetPrefix] : Array.from(cachedIcons.keys());

  for (const prefix of prefixesToSearch) {
    const icons = cachedIcons.get(prefix) || [];

    for (const iconName of icons) {
      const fullName = `${prefix}:${iconName}`;

      // If query is empty, show all icons
      // If query exists, filter by query
      const matchesQuery = !query || iconName.toLowerCase().includes(lowerQuery);

      if (matchesQuery) {
        // Calculate relevance score
        let score = 0.5;
        if (query) {
          if (iconName.toLowerCase() === lowerQuery) {
            score = 1;
          } else if (iconName.toLowerCase().startsWith(lowerQuery)) {
            score = 0.8;
          }
        }

        results.push({
          fullName,
          prefix,
          name: iconName,
          score,
        });
      }

      if (results.length >= maxResults) break;
    }

    if (results.length >= maxResults) break;
  }

  // Sort by score (for searches) or keep order (for initial load)
  if (query) {
    results.sort((a, b) => b.score - a.score);
  }

  return results.slice(0, maxResults);
}

/**
 * Hook for Icon Explorer functionality
 */
export function useExplorer(config?: ExplorerConfig): ExplorerContextValue {
  // Resolve configuration
  const resolvedConfig = useMemo<ResolvedExplorerConfig>(
    () => ({
      ...DEFAULT_EXPLORER_CONFIG,
      ...config,
      preview: {
        ...DEFAULT_PREVIEW_CONFIG,
        ...config?.preview,
      },
    }),
    [config]
  );

  // State
  const [state, setState] = useState<ExplorerState>(() => ({
    ...initialState,
    query: resolvedConfig.initialQuery,
    previewSize: resolvedConfig.preview.sizes[1] || 24,
    previewColor: resolvedConfig.preview.colors[0] || '#000000',
  }));

  // Cached icons from API
  const [cachedIcons, setCachedIcons] = useState<Map<string, string[]>>(new Map());
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);
  const [totalIcons, setTotalIcons] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get available icon sets
  const iconSets = useMemo(() => {
    const allSets = getAllIconSets();
    if (resolvedConfig.iconSets.length === 0) {
      return allSets;
    }
    return allSets.filter((set) => resolvedConfig.iconSets.includes(set.prefix));
  }, [resolvedConfig.iconSets]);

  // Fetch all collections on mount
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchAllCollections = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const newCache = new Map<string, string[]>();
      let total = 0;
      const prefixesToFetch = iconSets.map((set) => set.prefix);

      // Fetch collections in parallel
      const results = await Promise.allSettled(
        prefixesToFetch.map(async (prefix) => {
          // Check global cache first
          if (collectionCache.has(prefix)) {
            return { prefix, icons: collectionCache.get(prefix)! };
          }

          try {
            const collection = await fetchCollection(prefix, controller.signal);
            // Store in global cache
            collectionCache.set(prefix, collection.icons);
            return { prefix, icons: collection.icons };
          } catch (error) {
            console.warn(`Failed to fetch collection ${prefix}:`, error);
            return { prefix, icons: [] };
          }
        })
      );

      if (cancelled) return;

      // Process results
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { prefix, icons } = result.value;
          newCache.set(prefix, icons);
          total += icons.length;
        }
      }

      setCachedIcons(newCache);
      setTotalIcons(total);
      setCollectionsLoaded(true);
      setState((prev) => ({ ...prev, isLoading: false }));
    };

    fetchAllCollections();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [iconSets]);

  // Search when query or filter changes
  useEffect(() => {
    if (!collectionsLoaded) return;

    let cancelled = false;

    const performSearch = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        let results: SearchResult[];

        // Use API search for queries, local search for browsing
        if (state.query && state.query.length >= 2) {
          // Use Iconify search API for better results
          const prefixes = state.activeIconSet
            ? [state.activeIconSet]
            : iconSets.map((s) => s.prefix);

          try {
            const apiResults = await searchIconsAPI(
              state.query,
              prefixes,
              resolvedConfig.maxResults
            );

            results = apiResults.map((fullName) => {
              const [prefix, name] = fullName.split(':');
              return {
                fullName,
                prefix,
                name,
                score: 1,
              };
            });
          } catch {
            // Fallback to local search if API fails
            results = searchIconsLocally(
              state.query,
              cachedIcons,
              state.activeIconSet,
              resolvedConfig.maxResults
            );
          }
        } else {
          // Local search for browsing (no query or short query)
          results = searchIconsLocally(
            state.query,
            cachedIcons,
            state.activeIconSet,
            resolvedConfig.maxResults
          );
        }

        if (!cancelled) {
          setState((prev) => ({ ...prev, results, isLoading: false }));
        }
      } catch (error) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Search failed',
          }));
        }
      }
    };

    // Debounce search only if there's a query, otherwise load immediately
    const delay = state.query ? 300 : 0;
    const timeoutId = setTimeout(performSearch, delay);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [
    state.query,
    state.activeIconSet,
    resolvedConfig.maxResults,
    collectionsLoaded,
    cachedIcons,
    iconSets,
  ]);

  // Destructure callbacks for stable dependencies
  const { onIconSelect, onCopyCode, preview } = resolvedConfig;

  // Actions
  const setQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, query }));
  }, []);

  const selectIcon = useCallback(
    (iconName: string | null) => {
      setState((prev) => ({ ...prev, selectedIcon: iconName }));
      if (iconName && onIconSelect) {
        onIconSelect(iconName);
      }
    },
    [onIconSelect]
  );

  const filterByIconSet = useCallback((prefix: string | null) => {
    setState((prev) => ({ ...prev, activeIconSet: prefix }));
  }, []);

  const setPreviewSize = useCallback((size: number) => {
    setState((prev) => ({ ...prev, previewSize: size }));
  }, []);

  const setPreviewColor = useCallback((color: string) => {
    setState((prev) => ({ ...prev, previewColor: color }));
  }, []);

  const copyIconCode = useCallback(
    (iconName: string, format: 'jsx' | 'import' = 'jsx') => {
      const code =
        format === 'import'
          ? `${generateImportStatement(iconName)}\n\n${generateIconJSX(iconName, state.previewSize, state.previewColor)}`
          : generateIconJSX(iconName, state.previewSize, state.previewColor);

      // Copy to clipboard
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'clipboard' in navigator) {
        (
          navigator as unknown as { clipboard: { writeText: (text: string) => Promise<void> } }
        ).clipboard
          .writeText(code)
          .then(() => {
            if (onCopyCode) {
              onCopyCode(code);
            }
          });
      } else {
        Clipboard.setString(code);
        if (onCopyCode) {
          onCopyCode(code);
        } else {
          Alert.alert('Copied!', 'Icon code copied to clipboard');
        }
      }
    },
    [state.previewSize, state.previewColor, onCopyCode]
  );

  const reset = useCallback(() => {
    setState({
      ...initialState,
      previewSize: preview.sizes[1] || 24,
      previewColor: preview.colors[0] || '#000000',
    });
  }, [preview]);

  // Build context value
  const actions: ExplorerActions = {
    setQuery,
    selectIcon,
    filterByIconSet,
    setPreviewSize,
    setPreviewColor,
    copyIconCode,
    reset,
  };

  return {
    ...state,
    ...actions,
    config: resolvedConfig,
    iconSets,
    totalIcons,
    collectionsLoaded,
  };
}

export default useExplorer;
