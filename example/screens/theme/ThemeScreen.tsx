import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import {
  Mdi,
  Heroicons,
  Lucide,
  IconThemeProvider,
  useIconTheme,
} from 'rn-iconify';
import { Section } from '../../components/common';

const PRESET_THEMES = [
  { name: 'Blue', size: 28, color: '#2196F3', placeholder: 'shimmer' as const },
  { name: 'Red', size: 32, color: '#F44336', placeholder: 'pulse' as const },
  { name: 'Green', size: 24, color: '#4CAF50', placeholder: 'skeleton' as const },
  { name: 'Purple', size: 36, color: '#9C27B0', placeholder: 'shimmer' as const },
];

const COLORS = ['#2196F3', '#F44336', '#4CAF50', '#9C27B0', '#FF9800', '#00BCD4', '#E91E63'];
const SIZES = [16, 20, 24, 28, 32, 40, 48];

export default function ThemeScreen() {
  const isDark = useColorScheme() === 'dark';
  const [selectedTheme, setSelectedTheme] = useState(PRESET_THEMES[0]);
  const [customSize, setCustomSize] = useState(24);
  const [customColor, setCustomColor] = useState('#2196F3');

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.content}
    >
      {/* Theme Presets */}
      <Section
        title="Theme Presets"
        description="Quick theme switching"
      >
        <View style={styles.presetsRow}>
          {PRESET_THEMES.map((theme) => (
            <TouchableOpacity
              key={theme.name}
              style={[
                styles.presetButton,
                { borderColor: theme.color },
                selectedTheme.name === theme.name && { backgroundColor: theme.color },
              ]}
              onPress={() => setSelectedTheme(theme)}
            >
              <Text
                style={[
                  styles.presetText,
                  selectedTheme.name === theme.name && styles.presetTextActive,
                ]}
              >
                {theme.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <IconThemeProvider theme={selectedTheme}>
          <View style={[styles.themePreview, isDark && styles.themePreviewDark]}>
            <Text style={[styles.previewLabel, isDark && styles.previewLabelDark]}>
              Theme: {selectedTheme.name} (size: {selectedTheme.size}, placeholder: {selectedTheme.placeholder})
            </Text>
            <View style={styles.iconsRow}>
              <Mdi name="home" />
              <Mdi name="account" />
              <Mdi name="cog" />
              <Mdi name="bell" />
              <Mdi name="heart" />
            </View>
          </View>
        </IconThemeProvider>
      </Section>

      {/* Custom Theme Builder */}
      <Section
        title="Custom Theme Builder"
        description="Build your own theme"
      >
        {/* Size Selector */}
        <Text style={[styles.label, isDark && styles.labelDark]}>Size: {customSize}px</Text>
        <View style={styles.optionsRow}>
          {SIZES.map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.optionButton,
                customSize === size && styles.optionButtonActive,
              ]}
              onPress={() => setCustomSize(size)}
            >
              <Text
                style={[
                  styles.optionText,
                  customSize === size && styles.optionTextActive,
                ]}
              >
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Color Selector */}
        <Text style={[styles.label, isDark && styles.labelDark]}>Color</Text>
        <View style={styles.colorsRow}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorButton,
                { backgroundColor: color },
                customColor === color && styles.colorButtonActive,
              ]}
              onPress={() => setCustomColor(color)}
            />
          ))}
        </View>

        <IconThemeProvider theme={{ size: customSize, color: customColor }}>
          <View style={[styles.themePreview, isDark && styles.themePreviewDark]}>
            <View style={styles.iconsRow}>
              <Mdi name="star" />
              <Heroicons name="heart" />
              <Lucide name="camera" />
              <Mdi name="fire" />
            </View>
          </View>
        </IconThemeProvider>
      </Section>

      {/* Nested Themes */}
      <Section
        title="Nested Themes"
        description="Override theme in nested components"
      >
        <IconThemeProvider theme={{ size: 24, color: '#2196F3' }}>
          <View style={[styles.nestedDemo, isDark && styles.nestedDemoDark]}>
            <View style={styles.nestedRow}>
              <Text style={[styles.nestedLabel, isDark && styles.nestedLabelDark]}>
                Parent: Blue, 24px
              </Text>
              <Mdi name="folder" />
            </View>

            <IconThemeProvider theme={{ size: 32, color: '#4CAF50' }}>
              <View style={[styles.nestedChild, isDark && styles.nestedChildDark]}>
                <View style={styles.nestedRow}>
                  <Text style={[styles.nestedLabel, isDark && styles.nestedLabelDark]}>
                    Child: Green, 32px
                  </Text>
                  <Mdi name="folder-open" />
                </View>
              </View>
            </IconThemeProvider>
          </View>
        </IconThemeProvider>

        <View style={styles.codeBlock}>
          <Text style={styles.code}>
{`<IconThemeProvider theme={{ size: 24, color: 'blue' }}>
  <Mdi name="folder" />  {/* Blue, 24px */}

  <IconThemeProvider theme={{ size: 32, color: 'green' }}>
    <Mdi name="folder-open" />  {/* Green, 32px */}
  </IconThemeProvider>
</IconThemeProvider>`}
          </Text>
        </View>
      </Section>

      {/* useIconTheme Hook */}
      <Section
        title="useIconTheme Hook"
        description="Programmatic theme access"
      >
        <IconThemeProvider theme={{ size: 28, color: '#E91E63' }}>
          <ThemeHookDemo isDark={isDark} />
        </IconThemeProvider>
      </Section>

      {/* Props Override */}
      <Section
        title="Props Override"
        description="Individual icon props override theme"
      >
        <IconThemeProvider theme={{ size: 24, color: '#666' }}>
          <View style={[styles.overrideDemo, isDark && styles.overrideDemoDark]}>
            <View style={styles.overrideItem}>
              <Mdi name="star" />
              <Text style={[styles.overrideLabel, isDark && styles.overrideLabelDark]}>
                Theme default
              </Text>
            </View>
            <View style={styles.overrideItem}>
              <Mdi name="star" color="#FFD700" />
              <Text style={[styles.overrideLabel, isDark && styles.overrideLabelDark]}>
                Color override
              </Text>
            </View>
            <View style={styles.overrideItem}>
              <Mdi name="star" size={40} />
              <Text style={[styles.overrideLabel, isDark && styles.overrideLabelDark]}>
                Size override
              </Text>
            </View>
            <View style={styles.overrideItem}>
              <Mdi name="star" size={32} color="#F44336" />
              <Text style={[styles.overrideLabel, isDark && styles.overrideLabelDark]}>
                Both override
              </Text>
            </View>
          </View>
        </IconThemeProvider>
      </Section>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function ThemeHookDemo({ isDark }: { isDark: boolean }) {
  const { theme, setTheme } = useIconTheme();
  const currentSize = theme.size ?? 24;

  return (
    <View>
      <View style={[styles.hookDemo, isDark && styles.hookDemoDark]}>
        <View style={styles.hookDemoRow}>
          <Text style={[styles.hookLabel, isDark && styles.hookLabelDark]}>
            Current theme:
          </Text>
          <Text style={[styles.hookValue, isDark && styles.hookValueDark]}>
            size: {currentSize}, color: {theme.color ?? 'default'}
          </Text>
        </View>
        <View style={styles.hookDemoRow}>
          <Mdi name="palette" />
          <Text style={[styles.hookNote, isDark && styles.hookNoteDark]}>
            Icon using theme
          </Text>
        </View>
      </View>

      <View style={styles.hookButtons}>
        <TouchableOpacity
          style={styles.hookButton}
          onPress={() => setTheme({ ...theme, color: '#FF5722' })}
        >
          <Text style={styles.hookButtonText}>Set Orange</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.hookButton}
          onPress={() => setTheme({ ...theme, size: currentSize + 4 })}
        >
          <Text style={styles.hookButtonText}>Increase Size</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.codeBlock}>
        <Text style={styles.code}>
{`const { theme, setTheme } = useIconTheme();

// Read current theme
console.log(theme.size, theme.color);

// Update theme
setTheme({ ...theme, color: 'orange' });`}
        </Text>
      </View>
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
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  presetTextActive: {
    color: '#FFF',
  },
  themePreview: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  themePreviewDark: {
    backgroundColor: '#2A2A2A',
  },
  previewLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  previewLabelDark: {
    color: '#AAA',
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  colorsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: '#000',
  },
  nestedDemo: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  nestedDemoDark: {
    backgroundColor: '#2A2A2A',
  },
  nestedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  nestedLabel: {
    fontSize: 14,
    color: '#333',
  },
  nestedLabelDark: {
    color: '#FFF',
  },
  nestedChild: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  nestedChildDark: {
    backgroundColor: '#1E1E1E',
  },
  hookDemo: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  hookDemoDark: {
    backgroundColor: '#2A2A2A',
  },
  hookDemoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  hookLabel: {
    fontSize: 14,
    color: '#333',
  },
  hookLabelDark: {
    color: '#FFF',
  },
  hookValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#666',
  },
  hookValueDark: {
    color: '#AAA',
  },
  hookNote: {
    fontSize: 12,
    color: '#666',
  },
  hookNoteDark: {
    color: '#AAA',
  },
  hookButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  hookButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  hookButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  overrideDemo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  overrideDemoDark: {
    backgroundColor: '#2A2A2A',
  },
  overrideItem: {
    alignItems: 'center',
    gap: 8,
  },
  overrideLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  overrideLabelDark: {
    color: '#AAA',
  },
  codeBlock: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#D4D4D4',
  },
});
