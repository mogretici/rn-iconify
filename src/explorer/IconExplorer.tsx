/**
 * Icon Explorer Component
 * Development tool for exploring and testing icons
 * Mobile-first responsive design with dark mode support
 *
 * @example
 * ```tsx
 * import { IconExplorer } from 'rn-iconify/explorer';
 *
 * // Only render in development
 * if (__DEV__) {
 *   return <IconExplorer onIconSelect={(name) => console.log(name)} />;
 * }
 * ```
 */

import React, { createContext, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  Modal,
  useColorScheme,
  Dimensions,
  SafeAreaView,
  Pressable,
} from 'react-native';
import type { IconExplorerProps, ExplorerContextValue, SearchResult, IconSetInfo } from './types';
import { useExplorer } from './useExplorer';
import { generateIconJSX, generateImportStatement } from './iconSets';
import { IconRenderer } from '../IconRenderer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = SCREEN_WIDTH > 500 ? 5 : 4;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 32 - (NUM_COLUMNS - 1) * 8) / NUM_COLUMNS;

/**
 * Theme colors
 */
interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  border: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryText: string;
  error: string;
  codeBackground: string;
  codeText: string;
}

const lightTheme: ThemeColors = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  primary: '#6366F1',
  primaryText: '#FFFFFF',
  error: '#EF4444',
  codeBackground: '#1F2937',
  codeText: '#E5E7EB',
};

const darkTheme: ThemeColors = {
  background: '#111827',
  surface: '#1F2937',
  surfaceSecondary: '#374151',
  border: '#374151',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  primary: '#818CF8',
  primaryText: '#FFFFFF',
  error: '#F87171',
  codeBackground: '#0F172A',
  codeText: '#E2E8F0',
};

/**
 * Explorer Context with theme
 */
interface ExplorerContextWithTheme extends ExplorerContextValue {
  theme: ThemeColors;
  isDark: boolean;
  closePreview: () => void;
}

export const ExplorerContext = createContext<ExplorerContextWithTheme | null>(null);

/**
 * Hook to access explorer context
 */
export function useExplorerContext(): ExplorerContextWithTheme {
  const context = useContext(ExplorerContext);
  if (!context) {
    throw new Error('useExplorerContext must be used within IconExplorer');
  }
  return context;
}

/**
 * Search Bar Component
 */
function SearchBar() {
  const { query, setQuery, theme } = useExplorerContext();

  return (
    <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.searchIconContainer, { backgroundColor: theme.surfaceSecondary }]}>
        <IconRenderer iconName="mdi:magnify" size={20} color={theme.textSecondary} />
      </View>
      <TextInput
        style={[styles.searchInput, { color: theme.text }]}
        value={query}
        onChangeText={setQuery}
        placeholder="Search icons..."
        placeholderTextColor={theme.textTertiary}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {query.length > 0 && (
        <TouchableOpacity
          style={[styles.clearButton, { backgroundColor: theme.surfaceSecondary }]}
          onPress={() => setQuery('')}
        >
          <IconRenderer iconName="mdi:close" size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Icon Set Filter Component
 */
function IconSetFilter() {
  const { iconSets, activeIconSet, filterByIconSet, theme } = useExplorerContext();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
    >
      <TouchableOpacity
        style={[
          styles.filterChip,
          { backgroundColor: theme.surface, borderColor: theme.border },
          !activeIconSet && { backgroundColor: theme.primary, borderColor: theme.primary },
        ]}
        onPress={() => filterByIconSet(null)}
      >
        <Text
          style={[
            styles.filterChipText,
            { color: theme.textSecondary },
            !activeIconSet && { color: theme.primaryText },
          ]}
        >
          All
        </Text>
      </TouchableOpacity>
      {iconSets.map((set: IconSetInfo) => (
        <TouchableOpacity
          key={set.prefix}
          style={[
            styles.filterChip,
            { backgroundColor: theme.surface, borderColor: theme.border },
            activeIconSet === set.prefix && {
              backgroundColor: theme.primary,
              borderColor: theme.primary,
            },
          ]}
          onPress={() => filterByIconSet(set.prefix)}
        >
          <Text
            style={[
              styles.filterChipText,
              { color: theme.textSecondary },
              activeIconSet === set.prefix && { color: theme.primaryText },
            ]}
          >
            {set.prefix}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

/**
 * Icon Grid Item Component - Renders actual icons
 */
function IconGridItem({ item }: { item: SearchResult }) {
  const { selectedIcon, selectIcon, theme, isDark } = useExplorerContext();
  const isSelected = selectedIcon === item.fullName;

  return (
    <TouchableOpacity
      style={[
        styles.gridItem,
        { backgroundColor: theme.surfaceSecondary },
        isSelected && {
          backgroundColor: isDark ? '#312E81' : '#EEF2FF',
          borderWidth: 2,
          borderColor: theme.primary,
        },
      ]}
      onPress={() => selectIcon(item.fullName)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <IconRenderer
          iconName={item.fullName}
          size={28}
          color={isSelected ? theme.primary : theme.text}
          placeholder="skeleton"
          placeholderColor={theme.textTertiary}
        />
      </View>
      <Text
        style={[styles.iconName, { color: isSelected ? theme.primary : theme.textSecondary }]}
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Icon Grid Component
 */
function IconGrid() {
  const { results, isLoading, error, theme, query, collectionsLoaded } = useExplorerContext();

  if (isLoading && !collectionsLoaded) {
    return (
      <View style={styles.centerContainer}>
        <IconRenderer iconName="mdi:loading" size={40} color={theme.primary} animate="spin" />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading icon collections...
        </Text>
        <Text style={[styles.loadingHint, { color: theme.textTertiary }]}>
          Fetching all available icons from Iconify API
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <IconRenderer iconName="mdi:loading" size={32} color={theme.primary} animate="spin" />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Searching...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <IconRenderer iconName="mdi:alert-circle" size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <IconRenderer iconName="mdi:magnify-close" size={64} color={theme.textTertiary} />
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          {query ? `No icons found for "${query}"` : 'Loading icons...'}
        </Text>
        {query && (
          <Text style={[styles.emptyHint, { color: theme.textTertiary }]}>
            Try a different search term
          </Text>
        )}
      </View>
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item.fullName}
      renderItem={({ item }) => <IconGridItem item={item} />}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={styles.gridContent}
      showsVerticalScrollIndicator={false}
      columnWrapperStyle={styles.gridRow}
    />
  );
}

/**
 * Preview Modal Component - Bottom sheet style
 */
function PreviewModal() {
  const {
    selectedIcon,
    previewSize,
    previewColor,
    setPreviewSize,
    setPreviewColor,
    copyIconCode,
    config,
    theme,
    isDark,
    closePreview,
  } = useExplorerContext();

  if (!selectedIcon) return null;

  const sizes = config.preview.sizes;
  const colors = config.preview.colors;

  return (
    <Modal
      visible={!!selectedIcon}
      animationType="slide"
      transparent
      presentationStyle="overFullScreen"
    >
      <Pressable style={styles.modalOverlay} onPress={closePreview}>
        <Pressable
          style={[styles.previewModal, { backgroundColor: theme.surface }]}
          onPress={() => {}}
        >
          {/* Handle bar */}
          <View style={styles.handleBarContainer}>
            <View style={[styles.handleBar, { backgroundColor: theme.border }]} />
          </View>

          {/* Header */}
          <View style={styles.previewHeader}>
            <Text style={[styles.previewTitle, { color: theme.text }]} numberOfLines={1}>
              {selectedIcon}
            </Text>
            <TouchableOpacity
              style={[styles.closePreviewButton, { backgroundColor: theme.surfaceSecondary }]}
              onPress={closePreview}
            >
              <IconRenderer iconName="mdi:close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Large Preview */}
          <View
            style={[
              styles.largePreviewContainer,
              { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
            ]}
          >
            <IconRenderer iconName={selectedIcon} size={previewSize} color={previewColor} />
          </View>

          {/* Size Selector */}
          <View style={styles.selectorRow}>
            <Text style={[styles.selectorLabel, { color: theme.textSecondary }]}>Size</Text>
            <View style={styles.selectorOptions}>
              {sizes.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.selectorButton,
                    { backgroundColor: theme.surfaceSecondary },
                    previewSize === size && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setPreviewSize(size)}
                >
                  <Text
                    style={[
                      styles.selectorButtonText,
                      { color: theme.text },
                      previewSize === size && { color: theme.primaryText },
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Color Selector */}
          <View style={styles.selectorRow}>
            <Text style={[styles.selectorLabel, { color: theme.textSecondary }]}>Color</Text>
            <View style={styles.selectorOptions}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color, borderColor: 'transparent' },
                    previewColor === color && { borderColor: theme.text, borderWidth: 3 },
                  ]}
                  onPress={() => setPreviewColor(color)}
                />
              ))}
            </View>
          </View>

          {/* Code Preview */}
          <View style={[styles.codePreview, { backgroundColor: theme.codeBackground }]}>
            <Text style={[styles.codeText, { color: theme.codeText }]}>
              {generateImportStatement(selectedIcon)}
            </Text>
            <Text style={[styles.codeText, { color: theme.codeText }]}>
              {generateIconJSX(selectedIcon, previewSize, previewColor)}
            </Text>
          </View>

          {/* Copy Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.copyButton, { backgroundColor: theme.primary }]}
              onPress={() => copyIconCode(selectedIcon, 'jsx')}
            >
              <IconRenderer iconName="mdi:content-copy" size={18} color={theme.primaryText} />
              <Text style={[styles.copyButtonText, { color: theme.primaryText }]}>Copy JSX</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.copyButton,
                {
                  backgroundColor: theme.surfaceSecondary,
                  borderWidth: 1,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => copyIconCode(selectedIcon, 'import')}
            >
              <IconRenderer iconName="mdi:code-tags" size={18} color={theme.text} />
              <Text style={[styles.copyButtonText, { color: theme.text }]}>With Import</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * Results Count Component
 */
function ResultsCount() {
  const { results, isLoading, theme, totalIcons, collectionsLoaded, config } = useExplorerContext();

  if (isLoading && !collectionsLoaded) return null;

  const maxResults = config.maxResults;
  const showingText =
    results.length === maxResults
      ? `Showing ${results.length} of ${totalIcons.toLocaleString()}`
      : `${results.length} icon${results.length !== 1 ? 's' : ''}`;

  return (
    <View style={styles.resultsCountContainer}>
      <Text style={[styles.resultsCount, { color: theme.textTertiary }]}>
        {showingText}
        {collectionsLoaded && totalIcons > 0 && (
          <Text style={{ color: theme.textTertiary }}>
            {' '}
            ({totalIcons.toLocaleString()} total available)
          </Text>
        )}
      </Text>
    </View>
  );
}

/**
 * Icon Explorer Component
 * Development tool for exploring and testing icons
 */
export function IconExplorer({
  visible = true,
  onClose,
  style,
  ...config
}: IconExplorerProps): React.ReactElement | null {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const explorer = useExplorer(config);

  const closePreview = () => {
    explorer.selectIcon(null);
  };

  const contextValue: ExplorerContextWithTheme = {
    ...explorer,
    theme,
    isDark,
    closePreview,
  };

  const content = (
    <ExplorerContext.Provider value={contextValue}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }, style]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
          ]}
        >
          <View style={styles.headerLeft}>
            <IconRenderer iconName="mdi:palette-outline" size={24} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.text }]}>Icon Explorer</Text>
          </View>
          {onClose && (
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.surfaceSecondary }]}
              onPress={onClose}
            >
              <IconRenderer iconName="mdi:close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search */}
        <SearchBar />

        {/* Filters */}
        <IconSetFilter />

        {/* Results Count */}
        <ResultsCount />

        {/* Icon Grid - Full width */}
        <View
          style={[
            styles.gridContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <IconGrid />
        </View>

        {/* Preview Modal */}
        <PreviewModal />
      </SafeAreaView>
    </ExplorerContext.Provider>
  );

  // If used as modal
  if (onClose) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        {content}
      </Modal>
    );
  }

  // Inline mode
  if (!visible) return null;
  return content;
}

/**
 * Styles - Mobile-first design
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchIconContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 16,
  },
  clearButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginRight: 8,
  },
  filterContainer: {
    maxHeight: 48,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultsCountContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  gridContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gridContent: {
    padding: 12,
  },
  gridRow: {
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE + 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconName: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
  },
  loadingHint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Preview Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  previewModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34, // Safe area for iPhone
    maxHeight: '85%',
  },
  handleBarContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  closePreviewButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  largePreviewContainer: {
    marginHorizontal: 20,
    borderRadius: 16,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  selectorRow: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  selectorButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
  },
  codePreview: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  copyButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default IconExplorer;
