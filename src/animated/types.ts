/**
 * Animation types for rn-iconify
 * Supports preset animations and custom configurations
 */

import type { EasingFunction } from 'react-native';

/**
 * Built-in animation presets
 */
export type AnimationPreset = 'spin' | 'pulse' | 'bounce' | 'shake' | 'ping' | 'wiggle';

/**
 * Animation direction for reversible animations
 */
export type AnimationDirection = 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';

/**
 * Animation easing options
 */
export type AnimationEasing =
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'bounce'
  | EasingFunction;

/**
 * Custom animation configuration
 */
export interface AnimationConfig {
  /**
   * Animation type
   */
  type: 'rotate' | 'scale' | 'opacity' | 'translate' | 'sequence';

  /**
   * Animation duration in milliseconds
   * @default 1000
   */
  duration?: number;

  /**
   * Whether to loop the animation
   * @default true for spin/pulse/bounce/ping, false for shake/wiggle
   */
  loop?: boolean;

  /**
   * Number of times to loop (-1 for infinite)
   * @default -1
   */
  iterations?: number;

  /**
   * Animation easing function
   * @default varies by preset: 'linear' for spin, 'ease-in-out' for pulse/wiggle, 'bounce' for bounce, 'ease-out' for shake/ping
   */
  easing?: AnimationEasing;

  /**
   * Animation direction
   * @default 'normal'
   */
  direction?: AnimationDirection;

  /**
   * Delay before animation starts (ms)
   * @default 0
   */
  delay?: number;

  /**
   * For rotate: degrees to rotate (default: 360)
   * For scale: min/max scale values
   * For opacity: min/max opacity values
   * For translate: x/y translation values
   */
  from?: number | { x?: number; y?: number };
  to?: number | { x?: number; y?: number };
}

/**
 * Animation prop type - can be a preset string or custom config
 */
export type AnimationType = AnimationPreset | AnimationConfig;

/**
 * Resolved animation configuration with all defaults applied
 */
export interface ResolvedAnimationConfig {
  type: AnimationConfig['type'];
  duration: number;
  loop: boolean;
  iterations: number;
  easing: AnimationEasing;
  direction: AnimationDirection;
  delay: number;
  from: number | { x: number; y: number };
  to: number | { x: number; y: number };
}

/**
 * Animation state for tracking animation lifecycle
 */
export type AnimationState = 'idle' | 'running' | 'paused' | 'completed';

/**
 * Animation control interface returned by useIconAnimation
 */
export interface AnimationControls {
  /**
   * Start the animation
   */
  start: () => void;

  /**
   * Stop the animation
   */
  stop: () => void;

  /**
   * Pause the animation
   */
  pause: () => void;

  /**
   * Resume a paused animation
   */
  resume: () => void;

  /**
   * Reset animation to initial state
   */
  reset: () => void;

  /**
   * Current animation state
   */
  state: AnimationState;

  /**
   * Whether animation is currently running
   */
  isAnimating: boolean;
}

/**
 * Props for animated icon components
 */
export interface AnimatedIconProps {
  /**
   * Icon element to animate
   */
  children: React.ReactNode;

  /**
   * Animation to apply
   * Can be a preset name or custom configuration
   * @example 'spin'
   * @example { type: 'rotate', duration: 2000, easing: 'linear' }
   */
  animate?: AnimationType;

  /**
   * Animation duration override (ms)
   * @default varies by preset
   */
  animationDuration?: number;

  /**
   * Whether animation should loop
   * @default true
   */
  animationLoop?: boolean;

  /**
   * Animation easing override
   */
  animationEasing?: AnimationEasing;

  /**
   * Delay before animation starts (ms)
   * @default 0
   */
  animationDelay?: number;

  /**
   * Whether to start animation immediately
   * @default true
   */
  autoPlay?: boolean;

  /**
   * Callback when animation completes (for non-looping animations)
   */
  onAnimationComplete?: () => void;

  /**
   * Width of the animation container
   */
  width?: number;

  /**
   * Height of the animation container
   */
  height?: number;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Default animation durations by preset
 */
export const DEFAULT_ANIMATION_DURATIONS: Record<AnimationPreset, number> = {
  spin: 1000,
  pulse: 1500,
  bounce: 600,
  shake: 500,
  ping: 1000,
  wiggle: 300,
};

/**
 * Default animation loop settings by preset
 */
export const DEFAULT_ANIMATION_LOOPS: Record<AnimationPreset, boolean> = {
  spin: true,
  pulse: true,
  bounce: true,
  shake: false,
  ping: true,
  wiggle: false,
};
