/**
 * Placeholder System Types
 * Provides type definitions for icon loading placeholders
 */

import type { ReactNode } from 'react';

/**
 * Built-in placeholder animation types
 * - skeleton: Static gray box (no animation)
 * - pulse: Opacity fade animation
 * - shimmer: Gradient sweep animation
 */
export type PlaceholderPreset = 'skeleton' | 'pulse' | 'shimmer';

/**
 * Placeholder type - can be a preset string or custom ReactNode
 */
export type PlaceholderType = PlaceholderPreset | ReactNode;

/**
 * Configuration for placeholder appearance
 */
export interface PlaceholderConfig {
  /**
   * Placeholder background color
   * @default '#E1E1E1'
   */
  color?: string;

  /**
   * Secondary color for shimmer gradient
   * @default '#F5F5F5'
   */
  highlightColor?: string;

  /**
   * Animation duration in milliseconds
   * @default 1000
   */
  duration?: number;

  /**
   * Border radius of the placeholder
   * @default 4
   */
  borderRadius?: number;
}

/**
 * Props for placeholder components
 */
export interface PlaceholderProps extends PlaceholderConfig {
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
 * Default placeholder configuration values
 */
export const DEFAULT_PLACEHOLDER_CONFIG: Required<PlaceholderConfig> = {
  color: '#E1E1E1',
  highlightColor: '#F5F5F5',
  duration: 1000,
  borderRadius: 4,
};
