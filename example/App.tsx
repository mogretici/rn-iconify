/**
 * rn-iconify Example App
 * Demonstrates icon components, transformations, and cache management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  useColorScheme,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Mdi,
  Heroicons,
  Lucide,
  Ph,
  Feather,
  MdiLight,
  getCacheStats,
  clearCache,
  prefetchIcons,
  CacheManager,
} from 'rn-iconify';

// Section component
function Section({
  title,
  children,
  isDark,
}: {
  title: string;
  children: React.ReactNode;
  isDark?: boolean;
}) {
  return (
    <View style={[styles.section, isDark && styles.sectionDark]}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

// Icon row component
function IconRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.iconRow}>
      <Text style={styles.iconLabel}>{label}</Text>
      <View style={styles.iconContainer}>{children}</View>
    </View>
  );
}

export default function App() {
  const systemColorScheme = useColorScheme();
  const [manualDarkMode, setManualDarkMode] = useState<boolean | null>(null);
  const isDark = manualDarkMode ?? systemColorScheme === 'dark';
  const iconColor = isDark ? '#FFFFFF' : '#000000';

  const toggleDarkMode = () => {
    setManualDarkMode(prev => prev === null ? !isDark : !prev);
  };
  const [cacheStats, setCacheStats] = useState({ memoryCount: 0, diskCount: 0 });
  const [prefetchStatus, setPrefetchStatus] = useState<string>('');
  const [loadedIcons, setLoadedIcons] = useState<string[]>([]);
  const [nativeAvailable, setNativeAvailable] = useState(false);

  // Refresh cache stats on demand instead of polling
  const refreshCacheStats = useCallback(() => {
    setCacheStats(getCacheStats());
  }, []);

  // Initial cache stats load and native module check
  useEffect(() => {
    refreshCacheStats();
    setNativeAvailable(CacheManager.isNativeAvailable());
  }, [refreshCacheStats]);

  // Icon load handler
  const handleIconLoad = useCallback((iconName: string) => {
    setLoadedIcons(prev => prev.includes(iconName) ? prev : [...prev, iconName]);
  }, []);

  const handlePrefetch = async () => {
    setPrefetchStatus('Prefetching...');
    try {
      const result = await prefetchIcons([
        'mdi:account',
        'mdi:bell',
        'mdi:calendar',
        'heroicons:academic-cap',
        'heroicons:adjustments-horizontal',
        'lucide:activity',
        'lucide:airplay',
      ]);
      setPrefetchStatus(
        `Done! Success: ${result.success.length}, Failed: ${result.failed.length}`
      );
    } catch (error) {
      setPrefetchStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      refreshCacheStats();
    }
  };

  const handleClearCache = async () => {
    await clearCache();
    refreshCacheStats();
  };

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Sticky Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <View style={styles.headerText}>
          <Text style={[styles.title, isDark && styles.titleDark]}>
            rn-iconify Demo
          </Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            200,000+ icons for React Native
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.darkModeButton, isDark && styles.darkModeButtonDark]}
          onPress={toggleDarkMode}
        >
          <Mdi
            name={isDark ? 'weather-sunny' : 'weather-night'}
            size={24}
            color={isDark ? '#FFD700' : '#5C6BC0'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Icon Sets Section */}
        <Section isDark={isDark} title="Icon Sets">
          <IconRow label="MDI">
            <Mdi name="home" size={32} color={iconColor} />
            <Mdi name="account" size={32} color={iconColor} />
            <Mdi name="cog" size={32} color={iconColor} />
            <Mdi name="bell" size={32} color={iconColor} />
            <Mdi name="heart" size={32} color="#E91E63" />
          </IconRow>

          <IconRow label="Heroicons">
            <Heroicons name="home" size={32} color={iconColor} />
            <Heroicons name="user" size={32} color={iconColor} />
            <Heroicons name="cog-6-tooth" size={32} color={iconColor} />
            <Heroicons name="bell" size={32} color={iconColor} />
            <Heroicons name="heart" size={32} color="#E91E63" />
          </IconRow>

          <IconRow label="Lucide">
            <Lucide name="house" size={32} color={iconColor} />
            <Lucide name="user" size={32} color={iconColor} />
            <Lucide name="settings" size={32} color={iconColor} />
            <Lucide name="bell" size={32} color={iconColor} />
            <Lucide name="heart" size={32} color="#E91E63" />
          </IconRow>

          <IconRow label="Phosphor">
            <Ph name="house" size={32} color={iconColor} />
            <Ph name="user" size={32} color={iconColor} />
            <Ph name="gear" size={32} color={iconColor} />
            <Ph name="bell" size={32} color={iconColor} />
            <Ph name="heart" size={32} color="#E91E63" />
          </IconRow>

          <IconRow label="Feather">
            <Feather name="home" size={32} color={iconColor} />
            <Feather name="user" size={32} color={iconColor} />
            <Feather name="settings" size={32} color={iconColor} />
            <Feather name="bell" size={32} color={iconColor} />
            <Feather name="heart" size={32} color="#E91E63" />
          </IconRow>
        </Section>

        {/* Sizes Section */}
        <Section isDark={isDark} title="Sizes">
          <View style={styles.sizesRow}>
            <View style={styles.sizeItem}>
              <Mdi name="star" size={16} color={iconColor} />
              <Text style={[styles.sizeLabel, isDark && styles.sizeLabelDark]}>
                16
              </Text>
            </View>
            <View style={styles.sizeItem}>
              <Mdi name="star" size={24} color={iconColor} />
              <Text style={[styles.sizeLabel, isDark && styles.sizeLabelDark]}>
                24
              </Text>
            </View>
            <View style={styles.sizeItem}>
              <Mdi name="star" size={32} color={iconColor} />
              <Text style={[styles.sizeLabel, isDark && styles.sizeLabelDark]}>
                32
              </Text>
            </View>
            <View style={styles.sizeItem}>
              <Mdi name="star" size={48} color={iconColor} />
              <Text style={[styles.sizeLabel, isDark && styles.sizeLabelDark]}>
                48
              </Text>
            </View>
            <View style={styles.sizeItem}>
              <Mdi name="star" size={64} color={iconColor} />
              <Text style={[styles.sizeLabel, isDark && styles.sizeLabelDark]}>
                64
              </Text>
            </View>
          </View>
        </Section>

        {/* Colors Section */}
        <Section isDark={isDark} title="Colors">
          <View style={styles.colorsRow}>
            <Mdi name="palette" size={40} color="#F44336" />
            <Mdi name="palette" size={40} color="#E91E63" />
            <Mdi name="palette" size={40} color="#9C27B0" />
            <Mdi name="palette" size={40} color="#3F51B5" />
            <Mdi name="palette" size={40} color="#2196F3" />
            <Mdi name="palette" size={40} color="#4CAF50" />
            <Mdi name="palette" size={40} color="#FF9800" />
          </View>
        </Section>

        {/* Transformations Section */}
        <Section isDark={isDark} title="Transformations">
          <IconRow label="Rotation">
            <View style={styles.transformItem}>
              <Mdi name="arrow-up" size={32} color={iconColor} rotate={0} />
              <Text style={[styles.transformLabel, isDark && styles.transformLabelDark]}>0°</Text>
            </View>
            <View style={styles.transformItem}>
              <Mdi name="arrow-up" size={32} color={iconColor} rotate={90} />
              <Text style={[styles.transformLabel, isDark && styles.transformLabelDark]}>90°</Text>
            </View>
            <View style={styles.transformItem}>
              <Mdi name="arrow-up" size={32} color={iconColor} rotate={180} />
              <Text style={[styles.transformLabel, isDark && styles.transformLabelDark]}>180°</Text>
            </View>
            <View style={styles.transformItem}>
              <Mdi name="arrow-up" size={32} color={iconColor} rotate={270} />
              <Text style={[styles.transformLabel, isDark && styles.transformLabelDark]}>270°</Text>
            </View>
          </IconRow>

          <IconRow label="Flip">
            <View style={styles.transformItem}>
              <Mdi name="thumb-up" size={32} color={iconColor} />
              <Text style={[styles.transformLabel, isDark && styles.transformLabelDark]}>Normal</Text>
            </View>
            <View style={styles.transformItem}>
              <Mdi name="thumb-up" size={32} color={iconColor} flip="horizontal" />
              <Text style={[styles.transformLabel, isDark && styles.transformLabelDark]}>H-Flip</Text>
            </View>
            <View style={styles.transformItem}>
              <Mdi name="thumb-up" size={32} color={iconColor} flip="vertical" />
              <Text style={[styles.transformLabel, isDark && styles.transformLabelDark]}>V-Flip</Text>
            </View>
            <View style={styles.transformItem}>
              <Mdi name="thumb-up" size={32} color={iconColor} flip="both" />
              <Text style={[styles.transformLabel, isDark && styles.transformLabelDark]}>Both</Text>
            </View>
          </IconRow>
        </Section>

        {/* Additional Icon Set Section */}
        <Section isDark={isDark} title="More Icon Sets (212 Total)">
          <Text style={[styles.description, isDark && styles.descriptionDark]}>
            rn-iconify includes 212 icon sets. Here's MdiLight:
          </Text>
          <View style={styles.codeBlock}>
            <Text style={styles.code}>
              {`import { MdiLight } from 'rn-iconify';
<MdiLight name="home" size={32} />`}
            </Text>
          </View>
          <View style={[styles.iconShowcase, { marginTop: 12 }]}>
            <MdiLight name="home" size={32} color={iconColor} />
            <MdiLight name="account" size={32} color={iconColor} />
            <MdiLight name="settings" size={32} color={iconColor} />
            <MdiLight name="bell" size={32} color={iconColor} />
          </View>
        </Section>

        {/* Callbacks Section */}
        <Section isDark={isDark} title="Callbacks (onLoad / onError)">
          <Text style={[styles.description, isDark && styles.descriptionDark]}>
            Track when icons load or fail:
          </Text>
          <View style={styles.callbackDemo}>
            <Mdi
              name="check-circle"
              size={32}
              color="#4CAF50"
              onLoad={() => handleIconLoad('check-circle')}
              onError={(error) => console.log('Error:', error)}
            />
            <Text style={[styles.callbackText, isDark && styles.callbackTextDark]}>
              {loadedIcons.includes('check-circle') ? '✓ Loaded' : 'Loading...'}
            </Text>
          </View>
        </Section>

        {/* Fallback Section */}
        <Section isDark={isDark} title="Fallback Component">
          <Text style={[styles.description, isDark && styles.descriptionDark]}>
            Show a placeholder while loading:
          </Text>
          <View style={styles.fallbackDemo}>
            <Mdi
              name="cloud-download"
              size={48}
              color={iconColor}
              fallback={
                <View style={styles.fallbackPlaceholder}>
                  <Text style={styles.fallbackText}>...</Text>
                </View>
              }
            />
          </View>
        </Section>

        {/* Style & Accessibility Section */}
        <Section isDark={isDark} title="Style & Accessibility">
          <Text style={[styles.description, isDark && styles.descriptionDark]}>
            Custom styles and accessibility props:
          </Text>
          <View style={styles.styleDemo}>
            <Mdi
              name="star"
              size={48}
              color="#FFD700"
              style={{
                shadowColor: '#FFD700',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 10,
              }}
              testID="star-icon"
              accessibilityLabel="Gold star icon"
            />
            <Mdi
              name="heart"
              size={48}
              color="#E91E63"
              style={{ opacity: 0.5 }}
              accessibilityLabel="Pink heart icon"
            />
          </View>
        </Section>

        {/* Cache Management Section */}
        <Section isDark={isDark} title="Cache Management">
          <View style={styles.cacheStats}>
            <Text style={[styles.cacheText, isDark && styles.cacheTextDark]}>
              Memory: {cacheStats.memoryCount} icons
            </Text>
            <Text style={[styles.cacheText, isDark && styles.cacheTextDark]}>
              Disk: {cacheStats.diskCount} icons
            </Text>
          </View>
          <Text style={[styles.nativeStatus, isDark && styles.nativeStatusDark]}>
            Native Module: {nativeAvailable ? '✓ Available' : '✗ Not Available'}
          </Text>

          <View style={styles.cacheButtons}>
            <TouchableOpacity
              style={[styles.button, styles.prefetchButton]}
              onPress={handlePrefetch}
            >
              <Text style={styles.buttonText}>Prefetch Icons</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClearCache}
            >
              <Text style={styles.buttonText}>Clear Cache</Text>
            </TouchableOpacity>
          </View>

          {prefetchStatus ? (
            <Text style={[styles.prefetchStatus, isDark && styles.prefetchStatusDark]}>
              {prefetchStatus}
            </Text>
          ) : null}
        </Section>

        {/* Usage Example Section */}
        <Section isDark={isDark} title="Usage Example">
          <View style={styles.codeBlock}>
            <Text style={styles.code}>
              {`import { Mdi, Lucide } from 'rn-iconify';

<Mdi name="home" size={24} color="blue" />
<Lucide name="settings" size={32} />`}
            </Text>
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerDark: {
    backgroundColor: '#121212',
    borderBottomColor: '#333',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  titleDark: {
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  subtitleDark: {
    color: '#AAA',
  },
  darkModeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  darkModeButtonDark: {
    backgroundColor: '#333',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionDark: {
    backgroundColor: '#1E1E1E',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  sectionTitleDark: {
    color: '#FFF',
  },
  sectionContent: {},
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconLabel: {
    width: 80,
    fontSize: 14,
    color: '#666',
  },
  iconContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  sizesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  sizeItem: {
    alignItems: 'center',
  },
  sizeLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  sizeLabelDark: {
    color: '#AAA',
  },
  colorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  transformItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  transformLabel: {
    marginTop: 4,
    fontSize: 10,
    color: '#666',
  },
  transformLabelDark: {
    color: '#AAA',
  },
  cacheStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  cacheText: {
    fontSize: 14,
    color: '#333',
  },
  cacheTextDark: {
    color: '#CCC',
  },
  cacheButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  prefetchButton: {
    backgroundColor: '#2196F3',
  },
  clearButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  prefetchStatus: {
    textAlign: 'center',
    marginTop: 8,
    color: '#666',
  },
  prefetchStatusDark: {
    color: '#AAA',
  },
  codeBlock: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#D4D4D4',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  descriptionDark: {
    color: '#AAA',
  },
  iconShowcase: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  callbackDemo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  callbackText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  callbackTextDark: {
    color: '#81C784',
  },
  fallbackDemo: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  fallbackPlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 18,
    color: '#999',
  },
  styleDemo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 16,
  },
  nativeStatus: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  nativeStatusDark: {
    color: '#AAA',
  },
});
