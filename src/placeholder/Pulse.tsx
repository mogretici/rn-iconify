/**
 * Pulse Placeholder Component
 * Animated opacity fade effect while icon is loading
 */

import React, { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Easing } from 'react-native';
import { DEFAULT_PLACEHOLDER_CONFIG } from './types';
import type { PlaceholderProps } from './types';

/**
 * Pulse placeholder - animated opacity fade effect
 * Provides subtle visual feedback during loading
 */
function PulseComponent({
  width,
  height,
  color = DEFAULT_PLACEHOLDER_CONFIG.color,
  duration = DEFAULT_PLACEHOLDER_CONFIG.duration,
  borderRadius = DEFAULT_PLACEHOLDER_CONFIG.borderRadius,
  testID,
}: PlaceholderProps): React.ReactElement {
  const opacity = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Create looping pulse animation
    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animationRef.current.start();

    return () => {
      // Clean up animation on unmount
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [opacity, duration]);

  return (
    <Animated.View
      style={[
        styles.pulse,
        {
          width,
          height,
          backgroundColor: color,
          borderRadius,
          opacity,
        },
      ]}
      testID={testID}
      accessibilityRole="none"
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

const styles = StyleSheet.create({
  pulse: {
    overflow: 'hidden',
  },
});

/**
 * Memoized Pulse component
 * Animation runs independently of re-renders
 */
export const Pulse = memo(PulseComponent);
Pulse.displayName = 'Pulse';
