import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import {
  Mdi,
  configure,
  getConfiguration,
  resetConfiguration,
} from 'rn-iconify';
import { Section } from '../../components/common';
import type { ResolvedConfig } from 'rn-iconify';

export default function ConfigScreen() {
  const isDark = useColorScheme() === 'dark';
  const [config, setConfig] = useState<ResolvedConfig>(getConfiguration());
  const [apiUrl, setApiUrl] = useState(config.api.apiUrl);
  const [timeout, setTimeout] = useState(config.api.timeout);
  const [retries, setRetries] = useState(config.api.retries);
  const [maxMemory, setMaxMemory] = useState(config.cache.maxMemoryItems);
  const [enableDiskCache, setEnableDiskCache] = useState(config.cache.enableDiskCache);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const current = getConfiguration();
    const changed =
      apiUrl !== current.api.apiUrl ||
      timeout !== current.api.timeout ||
      retries !== current.api.retries ||
      maxMemory !== current.cache.maxMemoryItems ||
      enableDiskCache !== current.cache.enableDiskCache;
    setHasChanges(changed);
  }, [apiUrl, timeout, retries, maxMemory, enableDiskCache]);

  const applyChanges = () => {
    configure({
      api: {
        apiUrl,
        timeout,
        retries,
      },
      cache: {
        maxMemoryItems: maxMemory,
        enableDiskCache,
      },
    });
    setConfig(getConfiguration());
    setHasChanges(false);
    Alert.alert('Success', 'Configuration applied');
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Configuration',
      'Reset all settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetConfiguration();
            const defaults = getConfiguration();
            setConfig(defaults);
            setApiUrl(defaults.api.apiUrl);
            setTimeout(defaults.api.timeout);
            setRetries(defaults.api.retries);
            setMaxMemory(defaults.cache.maxMemoryItems);
            setEnableDiskCache(defaults.cache.enableDiskCache);
            setHasChanges(false);
            Alert.alert('Success', 'Configuration reset to defaults');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.content}
    >
      {/* Current Configuration */}
      <Section title="Current Configuration">
        <View style={[styles.configDisplay, isDark && styles.configDisplayDark]}>
          <ConfigRow label="API URL" value={config.api.apiUrl} isDark={isDark} />
          <ConfigRow label="Timeout" value={`${config.api.timeout}ms`} isDark={isDark} />
          <ConfigRow label="Retries" value={config.api.retries.toString()} isDark={isDark} />
          <ConfigRow label="Max Memory" value={config.cache.maxMemoryItems.toString()} isDark={isDark} />
          <ConfigRow label="Disk Cache" value={config.cache.enableDiskCache ? 'Enabled' : 'Disabled'} isDark={isDark} />
        </View>
      </Section>

      {/* API Configuration */}
      <Section title="API Settings">
        <Text style={[styles.label, isDark && styles.labelDark]}>API URL</Text>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          value={apiUrl}
          onChangeText={setApiUrl}
          placeholder="https://api.iconify.design"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={[styles.label, isDark && styles.labelDark]}>Timeout (ms)</Text>
        <View style={styles.optionsRow}>
          {[3000, 5000, 10000, 15000, 30000].map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.optionButton,
                timeout === t && styles.optionButtonActive,
              ]}
              onPress={() => setTimeout(t)}
            >
              <Text
                style={[
                  styles.optionText,
                  timeout === t && styles.optionTextActive,
                ]}
              >
                {t / 1000}s
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, isDark && styles.labelDark]}>Retries</Text>
        <View style={styles.optionsRow}>
          {[0, 1, 2, 3, 5].map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.optionButton,
                retries === r && styles.optionButtonActive,
              ]}
              onPress={() => setRetries(r)}
            >
              <Text
                style={[
                  styles.optionText,
                  retries === r && styles.optionTextActive,
                ]}
              >
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      {/* Cache Configuration */}
      <Section title="Cache Settings">
        <Text style={[styles.label, isDark && styles.labelDark]}>Max Memory Icons</Text>
        <View style={styles.optionsRow}>
          {[100, 250, 500, 1000, 2000].map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.optionButton,
                maxMemory === m && styles.optionButtonActive,
              ]}
              onPress={() => setMaxMemory(m)}
            >
              <Text
                style={[
                  styles.optionText,
                  maxMemory === m && styles.optionTextActive,
                ]}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.switchRow}>
          <View>
            <Text style={[styles.label, isDark && styles.labelDark]}>Disk Cache</Text>
            <Text style={[styles.hint, isDark && styles.hintDark]}>
              Save icons to native storage (MMKV)
            </Text>
          </View>
          <Switch value={enableDiskCache} onValueChange={setEnableDiskCache} />
        </View>
      </Section>

      {/* Actions */}
      <Section title="Actions">
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.applyButton,
              !hasChanges && styles.buttonDisabled,
            ]}
            onPress={applyChanges}
            disabled={!hasChanges}
          >
            <Mdi name="check" size={20} color="#FFF" />
            <Text style={styles.applyButtonText}>Apply Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Mdi name="refresh" size={20} color="#FFF" />
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {hasChanges && (
          <Text style={styles.changesWarning}>
            You have unsaved changes
          </Text>
        )}
      </Section>

      {/* Code Example */}
      <Section title="Code Example">
        <View style={styles.codeBlock}>
          <Text style={styles.code}>
{`import { configure, getConfiguration, resetConfiguration } from 'rn-iconify';

// Configure settings
configure({
  api: {
    baseUrl: 'https://api.iconify.design',
    timeout: 5000,
    retries: 3,
  },
  cache: {
    maxMemorySize: 500,
    persistToDisk: true,
    diskCacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});

// Get current configuration
const config = getConfiguration();
console.log('API URL:', config.api.baseUrl);

// Reset to defaults
resetConfiguration();`}
          </Text>
        </View>
      </Section>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function ConfigRow({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <View style={styles.configRow}>
      <Text style={[styles.configLabel, isDark && styles.configLabelDark]}>{label}</Text>
      <Text
        style={[styles.configValue, isDark && styles.configValueDark]}
        numberOfLines={1}
      >
        {value}
      </Text>
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
  configDisplay: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  configDisplayDark: {
    backgroundColor: '#2A2A2A',
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  configLabel: {
    fontSize: 14,
    color: '#666',
  },
  configLabelDark: {
    color: '#AAA',
  },
  configValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  configValueDark: {
    color: '#FFF',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  labelDark: {
    color: '#FFF',
  },
  hint: {
    fontSize: 12,
    color: '#666',
  },
  hintDark: {
    color: '#AAA',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },
  inputDark: {
    backgroundColor: '#2A2A2A',
    color: '#FFF',
    borderColor: '#444',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  optionButtonActive: {
    backgroundColor: '#2196F3',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextActive: {
    color: '#FFF',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  applyButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#F44336',
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  changesWarning: {
    textAlign: 'center',
    color: '#FF9800',
    fontSize: 14,
    marginTop: 12,
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
