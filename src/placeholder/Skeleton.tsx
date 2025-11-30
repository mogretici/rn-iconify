/**
 * Skeleton Placeholder Component
 * Static gray box shown while icon is loading
 */

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { DEFAULT_PLACEHOLDER_CONFIG } from './types';
import type { PlaceholderProps } from './types';

/**
 * Skeleton placeholder - a simple static colored box
 * Lightweight alternative when animation is not needed
 */
function SkeletonComponent({
  width,
  height,
  color = DEFAULT_PLACEHOLDER_CONFIG.color,
  borderRadius = DEFAULT_PLACEHOLDER_CONFIG.borderRadius,
  testID,
}: PlaceholderProps): React.ReactElement {
  return (
    <View
      style={[
        styles.skeleton,
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
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});

/**
 * Memoized Skeleton component
 * Only re-renders when dimensions or styling change
 */
export const Skeleton = memo(SkeletonComponent);
Skeleton.displayName = 'Skeleton';
