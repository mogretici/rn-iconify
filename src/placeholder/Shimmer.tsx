/**
 * Shimmer Placeholder Component
 * Animated gradient-like sweep effect while icon is loading
 *
 * Uses 3 overlapping bars with staggered opacity to simulate a gradient,
 * without requiring any external gradient library.
 */

import React, { memo, useEffect, useRef, useMemo } from 'react';
import { Animated, StyleSheet, View, Easing } from 'react-native';
import { DEFAULT_PLACEHOLDER_CONFIG } from './types';
import type { PlaceholderProps } from './types';

/**
 * Bar configuration for the gradient-like shimmer
 * Each bar has a different width and opacity, staggered in time
 */
const SHIMMER_BARS = [
  { widthFactor: 0.5, opacity: 0.15, delay: 0 },
  { widthFactor: 0.35, opacity: 0.3, delay: 0.15 },
  { widthFactor: 0.2, opacity: 0.5, delay: 0.3 },
] as const;

/**
 * Shimmer placeholder - animated gradient-like sweep effect
 * 3 overlapping bars create a soft gradient without native dependencies
 * Uses translateX animation for smooth 60fps performance
 */
function ShimmerComponent({
  width,
  height,
  color = DEFAULT_PLACEHOLDER_CONFIG.color,
  highlightColor = DEFAULT_PLACEHOLDER_CONFIG.highlightColor,
  duration = DEFAULT_PLACEHOLDER_CONFIG.duration,
  borderRadius = DEFAULT_PLACEHOLDER_CONFIG.borderRadius,
  testID,
}: PlaceholderProps): React.ReactElement {
  // One Animated.Value per bar for staggered animation
  const bar0 = useRef(new Animated.Value(-width)).current;
  const bar1 = useRef(new Animated.Value(-width)).current;
  const bar2 = useRef(new Animated.Value(-width)).current;
  const bars = useMemo(() => [bar0, bar1, bar2], [bar0, bar1, bar2]);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Reset all bars
    for (const bar of bars) {
      bar.setValue(-width);
    }

    // Create staggered looping animations
    const animations = SHIMMER_BARS.map((config, i) =>
      Animated.loop(
        Animated.sequence([
          // Stagger delay
          ...(config.delay > 0 ? [Animated.delay(duration * config.delay)] : []),
          Animated.timing(bars[i], {
            toValue: width,
            duration: duration * (1 - config.delay),
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          // Reset for next loop iteration
          Animated.timing(bars[i], {
            toValue: -width,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      )
    );

    animationRef.current = Animated.parallel(animations);
    animationRef.current.start();

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [bars, width, duration]);

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          backgroundColor: color,
          borderRadius,
        },
      ]}
      testID={testID}
      accessibilityRole="none"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {SHIMMER_BARS.map((config, i) => (
        <Animated.View
          key={i}
          style={[
            styles.shimmer,
            {
              width: Math.max(width * config.widthFactor, 12),
              height,
              backgroundColor: highlightColor,
              opacity: config.opacity,
              transform: [{ translateX: bars[i] }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

/**
 * Memoized Shimmer component
 * Animation runs independently of re-renders
 */
export const Shimmer = memo(ShimmerComponent);
Shimmer.displayName = 'Shimmer';
