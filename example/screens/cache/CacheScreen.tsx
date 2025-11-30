import React, { useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {
  Icon,
  Mdi,
  getCacheStats,
  clearCache,
  prefetchIcons,
  CacheManager,
} from 'rn-iconify';
import { Section } from '../../components/common';

export default function CacheScreen() {
  const isDark = useColorScheme() === 'dark';
  const [stats, setStats] = useState(getCacheStats());
  const [prefetchInput, setPrefetchInput] = useState('mdi:home, mdi:account, mdi:cog');
  const [prefetchResult, setPrefetchResult] = useState<{ success: string[]; failed: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nativeAvailable, setNativeAvailable] = useState(false);

  const refreshStats = useCallback(() => {
    setStats(getCacheStats());
  }, []);

  useEffect(() => {
    refreshStats();
    setNativeAvailable(CacheManager.isNativeAvailable());
  }, [refreshStats]);

  const handlePrefetch = async () => {
    setIsLoading(true);
    setPrefetchResult(null);
    try {
      const icons = prefetchInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (icons.length === 0) {
        Alert.alert('Error', 'Please enter at least one icon name');
        return;
      }

      const result = await prefetchIcons(icons);
      setPrefetchResult(result);
      refreshStats();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    Alert.alert(
      'Clear All Cache',
      'Are you sure you want to clear all cached icons?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearCache();
            refreshStats();
            Alert.alert('Success', 'All cache cleared');
          },
        },
      ]
    );
  };

  const handleClearMemory = () => {
    CacheManager.clear();
    refreshStats();
    Alert.alert('Success', 'Memory cache cleared');
  };

  const handleClearDisk = async () => {
    await CacheManager.clearNative();
    refreshStats();
    Alert.alert('Success', 'Disk cache cleared');
  };

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.content}
    >
      {/* Cache Statistics */}
      <Section title="Cache Statistics">
        <View style={styles.statsGrid}>
          <StatCard
            label="Memory"
            value={stats.memoryCount}
            icon="memory"
            color="#4CAF50"
            isDark={isDark}
          />
          <StatCard
            label="Bundled"
            value={stats.bundledCount}
            icon="package-variant"
            color="#2196F3"
            isDark={isDark}
          />
          <StatCard
            label="Disk"
            value={stats.diskCount}
            icon="harddisk"
            color="#FF9800"
            isDark={isDark}
          />
          <StatCard
            label="Disk Size"
            value={`${(stats.diskSizeBytes / 1024).toFixed(1)} KB`}
            icon="database"
            color="#9C27B0"
            isDark={isDark}
            isText
          />
        </View>

        <View style={styles.nativeStatus}>
          <Mdi
            name={nativeAvailable ? 'check-circle' : 'close-circle'}
            size={20}
            color={nativeAvailable ? '#4CAF50' : '#F44336'}
          />
          <Text style={[styles.nativeStatusText, isDark && styles.nativeStatusTextDark]}>
            Native Module: {nativeAvailable ? 'Available' : 'Not Available'}
          </Text>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={refreshStats}>
          <Mdi name="refresh" size={20} color="#FFF" />
          <Text style={styles.refreshButtonText}>Refresh Stats</Text>
        </TouchableOpacity>
      </Section>

      {/* Prefetch Icons */}
      <Section
        title="Prefetch Icons"
        description="Preload icons into cache"
      >
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          value={prefetchInput}
          onChangeText={setPrefetchInput}
          placeholder="Enter icon names (comma-separated)"
          placeholderTextColor="#999"
          multiline
        />

        <TouchableOpacity
          style={[styles.prefetchButton, isLoading && styles.buttonDisabled]}
          onPress={handlePrefetch}
          disabled={isLoading}
        >
          <Mdi name="download" size={20} color="#FFF" />
          <Text style={styles.prefetchButtonText}>
            {isLoading ? 'Prefetching...' : 'Prefetch Icons'}
          </Text>
        </TouchableOpacity>

        {prefetchResult && (
          <View style={[styles.resultBox, isDark && styles.resultBoxDark]}>
            <View style={styles.resultRow}>
              <Mdi name="check-circle" size={18} color="#4CAF50" />
              <Text style={[styles.resultText, isDark && styles.resultTextDark]}>
                Success: {prefetchResult.success.length}
              </Text>
            </View>
            {prefetchResult.success.length > 0 && (
              <Text style={[styles.resultIcons, isDark && styles.resultIconsDark]}>
                {prefetchResult.success.join(', ')}
              </Text>
            )}
            {prefetchResult.failed.length > 0 && (
              <>
                <View style={styles.resultRow}>
                  <Mdi name="close-circle" size={18} color="#F44336" />
                  <Text style={[styles.resultText, isDark && styles.resultTextDark]}>
                    Failed: {prefetchResult.failed.length}
                  </Text>
                </View>
                <Text style={[styles.resultIcons, styles.resultIconsFailed]}>
                  {prefetchResult.failed.join(', ')}
                </Text>
              </>
            )}
          </View>
        )}
      </Section>

      {/* Cache Actions */}
      <Section title="Cache Actions">
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionButton, styles.clearMemoryButton]}
            onPress={handleClearMemory}
          >
            <Mdi name="memory" size={24} color="#FFF" />
            <Text style={styles.actionButtonText}>Clear Memory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.clearDiskButton]}
            onPress={handleClearDisk}
          >
            <Mdi name="harddisk" size={24} color="#FFF" />
            <Text style={styles.actionButtonText}>Clear Disk</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.clearAllButton]}
            onPress={handleClearAll}
          >
            <Mdi name="delete" size={24} color="#FFF" />
            <Text style={styles.actionButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </Section>

      {/* Code Example */}
      <Section title="Code Example">
        <View style={styles.codeBlock}>
          <Text style={styles.code}>
{`import { getCacheStats, prefetchIcons, clearCache } from 'rn-iconify';

// Get cache statistics
const stats = getCacheStats();
console.log(\`Memory: \${stats.memoryCount}\`);
console.log(\`Bundled: \${stats.bundledCount}\`);
console.log(\`Disk: \${stats.diskCount}\`);
console.log(\`Disk Size: \${stats.diskSizeBytes / 1024} KB\`);

// Prefetch icons
const result = await prefetchIcons([
  'mdi:home',
  'mdi:account',
  'mdi:cog',
]);
console.log(\`Loaded: \${result.success.length}\`);

// Clear all cache
await clearCache();`}
          </Text>
        </View>
      </Section>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  isDark,
  isText,
}: {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  isDark: boolean;
  isText?: boolean;
}) {
  return (
    <View style={[styles.statCard, isDark && styles.statCardDark]}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Icon name={`mdi:${icon}`} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, isDark && styles.statValueDark]}>
        {isText ? value : value.toString()}
      </Text>
      <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>{label}</Text>
    </View>
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
  content: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statCardDark: {
    backgroundColor: '#2A2A2A',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statValueDark: {
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statLabelDark: {
    color: '#AAA',
  },
  nativeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  nativeStatusText: {
    fontSize: 14,
    color: '#666',
  },
  nativeStatusTextDark: {
    color: '#AAA',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#607D8B',
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 60,
    marginBottom: 12,
  },
  inputDark: {
    backgroundColor: '#2A2A2A',
    color: '#FFF',
    borderColor: '#444',
  },
  prefetchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  prefetchButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resultBox: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  resultBoxDark: {
    backgroundColor: '#2A2A2A',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  resultTextDark: {
    color: '#FFF',
  },
  resultIcons: {
    fontSize: 12,
    color: '#666',
    marginLeft: 26,
    marginBottom: 8,
  },
  resultIconsDark: {
    color: '#AAA',
  },
  resultIconsFailed: {
    color: '#F44336',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  clearMemoryButton: {
    backgroundColor: '#4CAF50',
  },
  clearDiskButton: {
    backgroundColor: '#FF9800',
  },
  clearAllButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  codeBlock: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#D4D4D4',
  },
});
