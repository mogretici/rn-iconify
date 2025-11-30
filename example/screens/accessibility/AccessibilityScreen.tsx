import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Icon,
  Mdi,
  AccessibilityProvider,
  useAccessibleIcon,
} from 'rn-iconify';
import { Section } from '../../components/common';

export default function AccessibilityScreen() {
  const isDark = useColorScheme() === 'dark';
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [minTouchTarget, setMinTouchTarget] = useState(44);

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.content}
    >
      {/* AccessibilityProvider Demo */}
      <Section
        title="AccessibilityProvider"
        description="Global accessibility settings for all icons"
      >
        <View style={styles.controlsContainer}>
          <View style={styles.switchRow}>
            <View>
              <Text style={[styles.switchLabel, isDark && styles.switchLabelDark]}>
                High Contrast Mode
              </Text>
              <Text style={[styles.switchHint, isDark && styles.switchHintDark]}>
                Increases color contrast
              </Text>
            </View>
            <Switch value={highContrast} onValueChange={setHighContrast} />
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={[styles.switchLabel, isDark && styles.switchLabelDark]}>
                Reduce Motion
              </Text>
              <Text style={[styles.switchHint, isDark && styles.switchHintDark]}>
                Disables animations
              </Text>
            </View>
            <Switch value={reduceMotion} onValueChange={setReduceMotion} />
          </View>

          <View style={styles.sliderRow}>
            <Text style={[styles.switchLabel, isDark && styles.switchLabelDark]}>
              Min Touch Target: {minTouchTarget}px
            </Text>
            <View style={styles.sizeButtons}>
              {[32, 44, 48, 56].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeButton,
                    minTouchTarget === size && styles.sizeButtonActive,
                  ]}
                  onPress={() => setMinTouchTarget(size)}
                >
                  <Text
                    style={[
                      styles.sizeButtonText,
                      minTouchTarget === size && styles.sizeButtonTextActive,
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <AccessibilityProvider
          config={{
            highContrast,
            respectReducedMotion: reduceMotion,
            minTouchTargetSize: minTouchTarget,
          }}
        >
          <View style={[styles.previewContainer, isDark && styles.previewContainerDark]}>
            <Text style={[styles.previewTitle, isDark && styles.previewTitleDark]}>
              Preview with settings applied:
            </Text>
            <View style={styles.iconRow}>
              <AccessibleIconDemo name="home" label="Home" />
              <AccessibleIconDemo name="cog" label="Settings" />
              <AccessibleIconDemo name="bell" label="Notifications" />
              <AccessibleIconDemo name="heart" label="Favorites" />
            </View>
          </View>
        </AccessibilityProvider>

        <View style={styles.codeBlock}>
          <Text style={styles.code}>
{`import { AccessibilityProvider } from 'rn-iconify';

<AccessibilityProvider
  config={{
    highContrast: true,
    respectReducedMotion: true,
    minTouchTargetSize: 44,
  }}
>
  <App />
</AccessibilityProvider>`}
          </Text>
        </View>
      </Section>

      {/* useAccessibleIcon Hook */}
      <Section
        title="useAccessibleIcon Hook"
        description="Get accessibility props for any icon"
      >
        <UseAccessibleIconDemo isDark={isDark} />
      </Section>

      {/* Decorative vs Functional Icons */}
      <Section
        title="Decorative vs Functional Icons"
        description="Different accessibility handling"
      >
        <View style={styles.comparisonContainer}>
          <View style={styles.comparisonItem}>
            <Text style={[styles.comparisonTitle, isDark && styles.comparisonTitleDark]}>
              Decorative (hidden)
            </Text>
            <View
              style={styles.comparisonIcon}
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            >
              <Mdi name="star" size={32} color="#FFD700" />
            </View>
            <Text style={[styles.comparisonHint, isDark && styles.comparisonHintDark]}>
              Hidden from screen readers
            </Text>
          </View>

          <View style={styles.comparisonItem}>
            <Text style={[styles.comparisonTitle, isDark && styles.comparisonTitleDark]}>
              Functional (labeled)
            </Text>
            <TouchableOpacity
              style={styles.comparisonIcon}
              accessibilityRole="button"
              accessibilityLabel="Add to favorites"
            >
              <Mdi name="heart" size={32} color="#E91E63" />
            </TouchableOpacity>
            <Text style={[styles.comparisonHint, isDark && styles.comparisonHintDark]}>
              Announced as button
            </Text>
          </View>
        </View>

        <View style={styles.codeBlock}>
          <Text style={styles.code}>
{`// Decorative icon (hidden from screen readers)
<View accessibilityElementsHidden={true}>
  <Mdi name="star" size={32} />
</View>

// Functional icon (button)
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Add to favorites"
>
  <Mdi name="heart" size={32} />
</TouchableOpacity>`}
          </Text>
        </View>
      </Section>

      {/* Platform-Specific Props */}
      <Section
        title="Platform-Specific Props"
        description="iOS and Android specific accessibility"
      >
        <View style={[styles.platformDemo, isDark && styles.platformDemoDark]}>
          <Text style={[styles.platformTitle, isDark && styles.platformTitleDark]}>
            iOS: accessibilityLabel
          </Text>
          <View accessibilityLabel="Information icon" accessible>
            <Mdi
              name="information"
              size={24}
              color={isDark ? '#FFF' : '#333'}
            />
          </View>

          <Text style={[styles.platformTitle, isDark && styles.platformTitleDark]}>
            Android: importantForAccessibility
          </Text>
          <View importantForAccessibility="yes" accessible>
            <Mdi
              name="alert"
              size={24}
              color={isDark ? '#FFF' : '#333'}
            />
          </View>
        </View>

        <View style={styles.codeBlock}>
          <Text style={styles.code}>
{`// iOS
<View
  accessibilityLabel="Information"
  accessibilityHint="Tap for more info"
  accessible
>
  <Mdi name="information" size={24} />
</View>

// Android
<View importantForAccessibility="yes" accessible>
  <Mdi name="alert" size={24} />
</View>`}
          </Text>
        </View>
      </Section>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function AccessibleIconDemo({ name, label }: { name: string; label: string }) {
  return (
    <TouchableOpacity
      style={styles.accessibleIcon}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => Alert.alert('Pressed', label)}
    >
      <Icon name={`mdi:${name}`} size={28} color="#2196F3" />
      <Text style={styles.accessibleIconLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function UseAccessibleIconDemo({ isDark }: { isDark: boolean }) {
  const { accessibilityProps, adjustedColor, touchTargetPadding, shouldDisableAnimations } =
    useAccessibleIcon({
      iconName: 'mdi:bell',
      size: 24,
      color: '#2196F3',
      isInteractive: true,
    });

  return (
    <View>
      <View style={[styles.hookOutput, isDark && styles.hookOutputDark]}>
        <Text style={[styles.hookOutputLabel, isDark && styles.hookOutputLabelDark]}>
          accessibilityProps:
        </Text>
        <Text style={[styles.hookOutputValue, isDark && styles.hookOutputValueDark]}>
          {JSON.stringify(accessibilityProps, null, 2)}
        </Text>

        <Text style={[styles.hookOutputLabel, isDark && styles.hookOutputLabelDark]}>
          adjustedColor: {adjustedColor || 'unchanged'}
        </Text>

        <Text style={[styles.hookOutputLabel, isDark && styles.hookOutputLabelDark]}>
          touchTargetPadding: {touchTargetPadding}px
        </Text>

        <Text style={[styles.hookOutputLabel, isDark && styles.hookOutputLabelDark]}>
          shouldDisableAnimations: {shouldDisableAnimations ? 'true' : 'false'}
        </Text>
      </View>

      <View style={styles.codeBlock}>
        <Text style={styles.code}>
{`import { useAccessibleIcon } from 'rn-iconify';

const {
  accessibilityProps,
  adjustedColor,
  touchTargetPadding,
  shouldDisableAnimations,
} = useAccessibleIcon({
  iconName: 'mdi:bell',
  size: 24,
  color: '#2196F3',
  isInteractive: true,
});`}
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
  controlsContainer: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  switchLabelDark: {
    color: '#FFF',
  },
  switchHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  switchHintDark: {
    color: '#AAA',
  },
  sliderRow: {
    paddingVertical: 12,
  },
  sizeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  sizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  sizeButtonActive: {
    backgroundColor: '#2196F3',
  },
  sizeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  sizeButtonTextActive: {
    color: '#FFF',
  },
  previewContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  previewContainerDark: {
    backgroundColor: '#2A2A2A',
  },
  previewTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  previewTitleDark: {
    color: '#AAA',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  accessibleIcon: {
    alignItems: 'center',
    padding: 8,
  },
  accessibleIconLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  comparisonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  comparisonTitleDark: {
    color: '#FFF',
  },
  comparisonIcon: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  comparisonHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  comparisonHintDark: {
    color: '#AAA',
  },
  platformDemo: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 16,
  },
  platformDemoDark: {
    backgroundColor: '#2A2A2A',
  },
  platformTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  platformTitleDark: {
    color: '#AAA',
  },
  hookOutput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  hookOutputDark: {
    backgroundColor: '#2A2A2A',
  },
  hookOutputLabel: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
    marginTop: 8,
  },
  hookOutputLabelDark: {
    color: '#AAA',
  },
  hookOutputValue: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#333',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  hookOutputValueDark: {
    color: '#FFF',
    backgroundColor: '#1E1E1E',
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
