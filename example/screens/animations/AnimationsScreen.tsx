import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Switch,
  Animated,
} from 'react-native';
import { Mdi, AnimatedIcon, useIconAnimation, ANIMATION_PRESETS } from 'rn-iconify';
import { Section } from '../../components/common';

type AnimationType = 'spin' | 'pulse' | 'bounce' | 'shake' | 'ping' | 'wiggle';

const ANIMATIONS: AnimationType[] = ['spin', 'pulse', 'bounce', 'shake', 'ping', 'wiggle'];

export default function AnimationsScreen() {
  const isDark = useColorScheme() === 'dark';
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationType>('spin');
  const [duration, setDuration] = useState(1000);
  const [loop, setLoop] = useState(true);

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.content}
    >
      {/* Preset Animations */}
      <Section title="Animation Presets" description="6 built-in animation types">
        <View style={styles.presetsGrid}>
          {ANIMATIONS.map((anim) => (
            <View key={anim} style={styles.presetItem}>
              <AnimatedIcon animate={anim}>
                <Mdi name="loading" size={40} color={isDark ? '#FFF' : '#333'} />
              </AnimatedIcon>
              <Text style={[styles.presetLabel, isDark && styles.presetLabelDark]}>
                {anim}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      {/* Interactive Demo */}
      <Section title="Interactive Demo" description="Try different animation settings">
        <View style={styles.demoContainer}>
          <AnimatedIcon
            animate={selectedAnimation}
            animationDuration={duration}
            animationLoop={loop}
          >
            <Mdi name="star" size={64} color="#FFD700" />
          </AnimatedIcon>
        </View>

        {/* Animation Selector */}
        <Text style={[styles.label, isDark && styles.labelDark]}>Animation Type</Text>
        <View style={styles.animationSelector}>
          {ANIMATIONS.map((anim) => (
            <TouchableOpacity
              key={anim}
              style={[
                styles.animButton,
                selectedAnimation === anim && styles.animButtonActive,
              ]}
              onPress={() => setSelectedAnimation(anim)}
            >
              <Text
                style={[
                  styles.animButtonText,
                  selectedAnimation === anim && styles.animButtonTextActive,
                ]}
              >
                {anim}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Duration Slider */}
        <View style={styles.controlRow}>
          <Text style={[styles.label, isDark && styles.labelDark]}>Duration: {duration}ms</Text>
          <View style={styles.durationButtons}>
            {[500, 1000, 1500, 2000].map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.durationButton,
                  duration === d && styles.durationButtonActive,
                ]}
                onPress={() => setDuration(d)}
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    duration === d && styles.durationButtonTextActive,
                  ]}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Loop Toggle */}
        <View style={styles.switchRow}>
          <Text style={[styles.label, isDark && styles.labelDark]}>Loop</Text>
          <Switch value={loop} onValueChange={setLoop} />
        </View>
      </Section>

      {/* useIconAnimation Hook Demo */}
      <Section title="useIconAnimation Hook" description="Programmatic animation control">
        <HookDemo isDark={isDark} />
      </Section>

      {/* Use Cases */}
      <Section title="Common Use Cases">
        <View style={styles.useCases}>
          {/* Loading Spinner */}
          <View style={styles.useCase}>
            <AnimatedIcon animate="spin">
              <Mdi name="loading" size={32} color="#2196F3" />
            </AnimatedIcon>
            <Text style={[styles.useCaseLabel, isDark && styles.useCaseLabelDark]}>
              Loading
            </Text>
          </View>

          {/* Heart Pulse */}
          <View style={styles.useCase}>
            <AnimatedIcon animate="pulse">
              <Mdi name="heart" size={32} color="#E91E63" />
            </AnimatedIcon>
            <Text style={[styles.useCaseLabel, isDark && styles.useCaseLabelDark]}>
              Like
            </Text>
          </View>

          {/* Notification Shake */}
          <View style={styles.useCase}>
            <AnimatedIcon animate="shake">
              <Mdi name="bell" size={32} color="#FF9800" />
            </AnimatedIcon>
            <Text style={[styles.useCaseLabel, isDark && styles.useCaseLabelDark]}>
              Alert
            </Text>
          </View>

          {/* Success Bounce */}
          <View style={styles.useCase}>
            <AnimatedIcon animate="bounce">
              <Mdi name="check-circle" size={32} color="#4CAF50" />
            </AnimatedIcon>
            <Text style={[styles.useCaseLabel, isDark && styles.useCaseLabelDark]}>
              Success
            </Text>
          </View>
        </View>
      </Section>

      {/* Code Example */}
      <Section title="Code Example">
        <View style={styles.codeBlock}>
          <Text style={styles.code}>
{`import { AnimatedIcon, Mdi } from 'rn-iconify';

// Basic usage
<AnimatedIcon animate="spin">
  <Mdi name="loading" size={24} />
</AnimatedIcon>

// Custom settings
<AnimatedIcon
  animate="pulse"
  duration={1500}
  loop={true}
>
  <Mdi name="heart" size={32} color="red" />
</AnimatedIcon>`}
          </Text>
        </View>
      </Section>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function HookDemo({ isDark }: { isDark: boolean }) {
  const { animatedStyle, start, stop, reset, isAnimating, state } = useIconAnimation({
    animation: 'spin',
    autoPlay: false,
    loop: true,
  });

  return (
    <View>
      <View style={styles.hookDemoContainer}>
        <Animated.View style={animatedStyle}>
          <Mdi name="cog" size={48} color={isDark ? '#FFF' : '#333'} />
        </Animated.View>
        <View style={styles.stateIndicator}>
          <Text style={[styles.stateText, isDark && styles.stateTextDark]}>
            State: {state}
          </Text>
          <Text style={[styles.stateText, isDark && styles.stateTextDark]}>
            Animating: {isAnimating ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>

      <View style={styles.hookButtons}>
        <TouchableOpacity
          style={[styles.hookButton, styles.startButton]}
          onPress={start}
          disabled={isAnimating}
        >
          <Text style={styles.hookButtonText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.hookButton, styles.stopButton]}
          onPress={stop}
          disabled={!isAnimating}
        >
          <Text style={styles.hookButtonText}>Stop</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.hookButton, styles.resetButton]}
          onPress={reset}
        >
          <Text style={styles.hookButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.codeBlock}>
        <Text style={styles.code}>
{`const { animatedStyle, start, stop, reset } = useIconAnimation({
  animation: 'spin',
  autoPlay: false,
  loop: true,
});

<Animated.View style={animatedStyle}>
  <Mdi name="cog" size={48} />
</Animated.View>`}
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
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 16,
  },
  presetItem: {
    alignItems: 'center',
    width: 80,
  },
  presetLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  presetLabelDark: {
    color: '#AAA',
  },
  demoContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    marginBottom: 16,
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
  animationSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  animButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  animButtonActive: {
    backgroundColor: '#2196F3',
  },
  animButtonText: {
    fontSize: 14,
    color: '#333',
    textTransform: 'capitalize',
  },
  animButtonTextActive: {
    color: '#FFF',
  },
  controlRow: {
    marginBottom: 16,
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  durationButtonActive: {
    backgroundColor: '#2196F3',
  },
  durationButtonText: {
    fontSize: 14,
    color: '#333',
  },
  durationButtonTextActive: {
    color: '#FFF',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  hookDemoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 24,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    marginBottom: 16,
  },
  stateIndicator: {
    alignItems: 'flex-start',
  },
  stateText: {
    fontSize: 14,
    color: '#666',
  },
  stateTextDark: {
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
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  resetButton: {
    backgroundColor: '#FF9800',
  },
  hookButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  useCases: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  useCase: {
    alignItems: 'center',
    gap: 8,
  },
  useCaseLabel: {
    fontSize: 12,
    color: '#666',
  },
  useCaseLabelDark: {
    color: '#AAA',
  },
  codeBlock: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#D4D4D4',
  },
});
