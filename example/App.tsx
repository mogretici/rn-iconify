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
  Phosphor,
  Feather,
  getCacheStats,
  clearCache,
  prefetchIcons,
} from 'rn-iconify';

// Section component
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? '#FFFFFF' : '#000000';
  const [cacheStats, setCacheStats] = useState({ memoryCount: 0, diskCount: 0 });
  const [prefetchStatus, setPrefetchStatus] = useState<string>('');

  // Refresh cache stats on demand instead of polling
  const refreshCacheStats = useCallback(() => {
    setCacheStats(getCacheStats());
  }, []);

  // Initial cache stats load
  useEffect(() => {
    refreshCacheStats();
  }, [refreshCacheStats]);

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, isDark && styles.titleDark]}>
          rn-iconify Demo
        </Text>
        <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
          200,000+ icons for React Native
        </Text>

        {/* Icon Sets Section */}
        <Section title="Icon Sets">
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
            <Lucide name="home" size={32} color={iconColor} />
            <Lucide name="user" size={32} color={iconColor} />
            <Lucide name="settings" size={32} color={iconColor} />
            <Lucide name="bell" size={32} color={iconColor} />
            <Lucide name="heart" size={32} color="#E91E63" />
          </IconRow>

          <IconRow label="Phosphor">
            <Phosphor name="house" size={32} color={iconColor} />
            <Phosphor name="user" size={32} color={iconColor} />
            <Phosphor name="gear" size={32} color={iconColor} />
            <Phosphor name="bell" size={32} color={iconColor} />
            <Phosphor name="heart" size={32} color="#E91E63" />
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
        <Section title="Sizes">
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
        <Section title="Colors">
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
        <Section title="Transformations">
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

        {/* Cache Management Section */}
        <Section title="Cache Management">
          <View style={styles.cacheStats}>
            <Text style={[styles.cacheText, isDark && styles.cacheTextDark]}>
              Memory: {cacheStats.memoryCount} icons
            </Text>
            <Text style={[styles.cacheText, isDark && styles.cacheTextDark]}>
              Disk: {cacheStats.diskCount} icons
            </Text>
          </View>

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
        <Section title="Usage Example">
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
    marginTop: 8,
  },
  titleDark: {
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  subtitleDark: {
    color: '#AAA',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
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
});
