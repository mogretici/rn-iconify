/**
 * Shimmer Placeholder Component
 * Animated gradient sweep effect while icon is loading
 */

import React, { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Easing } from 'react-native';
import { DEFAULT_PLACEHOLDER_CONFIG } from './types';
import type { PlaceholderProps } from './types';

/**
 * Shimmer placeholder - animated light sweep effect
 * Provides prominent visual feedback during loading
 * Uses translateX animation for smooth performance
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
  const translateX = useRef(new Animated.Value(-width)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Reset animation when width changes
    translateX.setValue(-width);

    // Create looping shimmer animation
    animationRef.current = Animated.loop(
      Animated.timing(translateX, {
        toValue: width,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animationRef.current.start();

    return () => {
      // Clean up animation on unmount
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [translateX, width, duration]);

  // Calculate shimmer bar width (30% of container width)
  const shimmerWidth = Math.max(width * 0.3, 20);

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
      <Animated.View
        style={[
          styles.shimmer,
          {
            width: shimmerWidth,
            height,
            backgroundColor: highlightColor,
            transform: [{ translateX }],
          },
        ]}
      />
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
    opacity: 0.5,
  },
});

/**
 * Memoized Shimmer component
 * Animation runs independently of re-renders
 */
export const Shimmer = memo(ShimmerComponent);
Shimmer.displayName = 'Shimmer';
