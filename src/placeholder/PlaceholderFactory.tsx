/**
 * PlaceholderFactory
 * Creates the appropriate placeholder component based on type
 */

import React, { isValidElement } from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { Pulse } from './Pulse';
import { Shimmer } from './Shimmer';
import type { PlaceholderType, PlaceholderConfig, PlaceholderPreset } from './types';

/**
 * Props for PlaceholderFactory
 */
export interface PlaceholderFactoryProps extends PlaceholderConfig {
  /**
   * Type of placeholder to render
   */
  type: PlaceholderType;

  /**
   * Width of the placeholder
   */
  width: number;

  /**
   * Height of the placeholder
   */
  height: number;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Check if a value is a valid PlaceholderPreset
 */
function isPlaceholderPreset(value: unknown): value is PlaceholderPreset {
  return typeof value === 'string' && ['skeleton', 'pulse', 'shimmer'].includes(value);
}

/**
 * PlaceholderFactory - renders the appropriate placeholder component
 *
 * @example
 * ```tsx
 * // Using preset
 * <PlaceholderFactory type="shimmer" width={24} height={24} />
 *
 * // Using custom component
 * <PlaceholderFactory type={<ActivityIndicator />} width={24} height={24} />
 * ```
 */
export function PlaceholderFactory({
  type,
  width,
  height,
  color,
  highlightColor,
  duration,
  borderRadius,
  testID,
}: PlaceholderFactoryProps): React.ReactElement | null {
  // Handle preset strings
  if (isPlaceholderPreset(type)) {
    const props = {
      width,
      height,
      color,
      highlightColor,
      duration,
      borderRadius,
      testID,
    };

    switch (type) {
      case 'skeleton':
        return <Skeleton {...props} />;
      case 'pulse':
        return <Pulse {...props} />;
      case 'shimmer':
        return <Shimmer {...props} />;
      default:
        // TypeScript exhaustive check
        const _exhaustive: never = type;
        return _exhaustive;
    }
  }

  // Handle custom ReactNode
  if (isValidElement(type)) {
    return (
      <View style={[styles.customContainer, { width, height }]} testID={testID}>
        {type}
      </View>
    );
  }

  // Handle null/undefined - render nothing
  if (type === null || type === undefined) {
    return null;
  }

  // Fallback to skeleton for any other value
  if (__DEV__) {
    console.warn(
      `[rn-iconify] Invalid placeholder type: ${String(type)}. ` +
        `Expected 'skeleton', 'pulse', 'shimmer', or a ReactNode.`
    );
  }

  return (
    <Skeleton
      width={width}
      height={height}
      color={color}
      borderRadius={borderRadius}
      testID={testID}
    />
  );
}

PlaceholderFactory.displayName = 'PlaceholderFactory';

const styles = StyleSheet.create({
  customContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
