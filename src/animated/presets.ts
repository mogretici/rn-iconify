/**
 * Animation presets for rn-iconify
 * Pre-configured animations for common use cases
 */

import { Easing } from 'react-native';
import type {
  AnimationPreset,
  AnimationConfig,
  ResolvedAnimationConfig,
  AnimationType,
  AnimationEasing,
} from './types';

/**
 * Preset animation configurations
 */
export const ANIMATION_PRESETS: Record<AnimationPreset, AnimationConfig> = {
  /**
   * Continuous rotation (loading spinner)
   */
  spin: {
    type: 'rotate',
    duration: 1000,
    loop: true,
    iterations: -1,
    easing: 'linear',
    direction: 'normal',
    delay: 0,
    from: 0,
    to: 360,
  },

  /**
   * Pulsing opacity (heartbeat effect)
   */
  pulse: {
    type: 'opacity',
    duration: 1500,
    loop: true,
    iterations: -1,
    easing: 'ease-in-out',
    direction: 'alternate',
    delay: 0,
    from: 1,
    to: 0.4,
  },

  /**
   * Bouncing scale (attention grabber)
   */
  bounce: {
    type: 'scale',
    duration: 600,
    loop: true,
    iterations: -1,
    easing: 'bounce',
    direction: 'alternate',
    delay: 0,
    from: 1,
    to: 1.2,
  },

  /**
   * Horizontal shake (error/warning)
   */
  shake: {
    type: 'translate',
    duration: 500,
    loop: false,
    iterations: 1,
    easing: 'ease-out',
    direction: 'normal',
    delay: 0,
    from: { x: 0, y: 0 },
    to: { x: 10, y: 0 },
  },

  /**
   * Ping effect (notification)
   */
  ping: {
    type: 'scale',
    duration: 1000,
    loop: true,
    iterations: -1,
    easing: 'ease-out',
    direction: 'normal',
    delay: 0,
    from: 1,
    to: 1.5,
  },

  /**
   * Quick wiggle (playful attention)
   */
  wiggle: {
    type: 'rotate',
    duration: 300,
    loop: false,
    iterations: 1,
    easing: 'ease-in-out',
    direction: 'alternate',
    delay: 0,
    from: -15,
    to: 15,
  },
};

/**
 * Convert easing string to React Native Easing function
 */
export function getEasingFunction(easing: AnimationEasing): (value: number) => number {
  if (typeof easing === 'function') {
    return easing;
  }

  switch (easing) {
    case 'linear':
      return Easing.linear;
    case 'ease':
      return Easing.ease;
    case 'ease-in':
      return Easing.in(Easing.ease);
    case 'ease-out':
      return Easing.out(Easing.ease);
    case 'ease-in-out':
      return Easing.inOut(Easing.ease);
    case 'bounce':
      return Easing.bounce;
    default:
      return Easing.linear;
  }
}

/**
 * Resolve animation type to full configuration
 */
export function resolveAnimation(
  animation: AnimationType,
  overrides?: {
    duration?: number;
    loop?: boolean;
    easing?: AnimationEasing;
    delay?: number;
  }
): ResolvedAnimationConfig {
  // Get base config from preset or use custom config
  const baseConfig: AnimationConfig =
    typeof animation === 'string' ? { ...ANIMATION_PRESETS[animation] } : { ...animation };

  // Normalize from/to values
  const rawFrom = baseConfig.from ?? 0;
  const rawTo = baseConfig.to ?? 1;

  // Normalize translate values to have required x/y
  let normalizedFrom: number | { x: number; y: number };
  let normalizedTo: number | { x: number; y: number };

  if (baseConfig.type === 'translate') {
    if (typeof rawFrom === 'number') {
      normalizedFrom = { x: rawFrom, y: 0 };
    } else {
      normalizedFrom = { x: rawFrom.x ?? 0, y: rawFrom.y ?? 0 };
    }
    if (typeof rawTo === 'number') {
      normalizedTo = { x: rawTo, y: 0 };
    } else {
      normalizedTo = { x: rawTo.x ?? 0, y: rawTo.y ?? 0 };
    }
  } else {
    normalizedFrom = typeof rawFrom === 'number' ? rawFrom : 0;
    normalizedTo = typeof rawTo === 'number' ? rawTo : 1;
  }

  // Apply overrides
  const config: ResolvedAnimationConfig = {
    type: baseConfig.type,
    duration: overrides?.duration ?? baseConfig.duration ?? 1000,
    loop: overrides?.loop ?? baseConfig.loop ?? true,
    iterations: baseConfig.iterations ?? -1,
    easing: overrides?.easing ?? baseConfig.easing ?? 'linear',
    direction: baseConfig.direction ?? 'normal',
    delay: overrides?.delay ?? baseConfig.delay ?? 0,
    from: normalizedFrom,
    to: normalizedTo,
  };

  return config;
}

/**
 * Check if a string is a valid animation preset
 */
export function isAnimationPreset(value: string): value is AnimationPreset {
  return value in ANIMATION_PRESETS;
}

/**
 * Get default duration for a preset
 */
export function getDefaultDuration(preset: AnimationPreset): number {
  return ANIMATION_PRESETS[preset]?.duration ?? 1000;
}

/**
 * Get default loop setting for a preset
 */
export function getDefaultLoop(preset: AnimationPreset): boolean {
  return ANIMATION_PRESETS[preset]?.loop ?? true;
}
