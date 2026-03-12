/**
 * useIconAnimation - Hook for managing icon animations
 * Handles Animated values, timing, and animation lifecycle
 */

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { Animated } from 'react-native';
import type {
  AnimationType,
  AnimationState,
  AnimationControls,
  ResolvedAnimationConfig,
  AnimationEasing,
} from './types';
import { resolveAnimation, getEasingFunction } from './presets';

interface UseIconAnimationOptions {
  /**
   * Animation configuration
   */
  animation?: AnimationType;

  /**
   * Duration override (ms)
   */
  duration?: number;

  /**
   * Loop override
   */
  loop?: boolean;

  /**
   * Easing override
   */
  easing?: AnimationEasing;

  /**
   * Delay before animation starts (ms)
   */
  delay?: number;

  /**
   * Whether to start automatically
   * @default true
   */
  autoPlay?: boolean;

  /**
   * Callback when animation completes
   */
  onComplete?: () => void;
}

interface UseIconAnimationReturn extends AnimationControls {
  /**
   * Animated style to apply to the icon
   */
  animatedStyle: {
    transform?: Array<
      | { rotate: Animated.AnimatedInterpolation<string> }
      | { scale: Animated.Value }
      | { translateX: Animated.Value }
      | { translateY: Animated.Value }
    >;
    opacity?: Animated.Value;
  };

  /**
   * Whether animation is enabled
   */
  hasAnimation: boolean;
}

/**
 * Hook for managing icon animations
 */
export function useIconAnimation(options: UseIconAnimationOptions = {}): UseIconAnimationReturn {
  const { animation, duration, loop, easing, delay = 0, autoPlay = true, onComplete } = options;

  // Animation state
  const [state, setState] = useState<AnimationState>('idle');
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const mountedRef = useRef(true);

  // Animated values
  const rotateValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;
  const translateXValue = useRef(new Animated.Value(0)).current;
  const translateYValue = useRef(new Animated.Value(0)).current;

  // Resolve animation config
  const config = useMemo<ResolvedAnimationConfig | null>(() => {
    if (!animation) return null;
    return resolveAnimation(animation, { duration, loop, easing, delay });
  }, [animation, duration, loop, easing, delay]);

  // Create animation based on config
  const createAnimation = useCallback((): Animated.CompositeAnimation | null => {
    if (!config) return null;

    const easingFn = getEasingFunction(config.easing);
    const isAlternate =
      config.direction === 'alternate' || config.direction === 'alternate-reverse';
    const isReverse = config.direction === 'reverse' || config.direction === 'alternate-reverse';

    let fromValue: number;
    let toValue: number;
    let animatedValue: Animated.Value;

    switch (config.type) {
      case 'rotate':
        animatedValue = rotateValue;
        fromValue = isReverse ? (config.to as number) : (config.from as number);
        toValue = isReverse ? (config.from as number) : (config.to as number);
        break;

      case 'scale':
        animatedValue = scaleValue;
        fromValue = isReverse ? (config.to as number) : (config.from as number);
        toValue = isReverse ? (config.from as number) : (config.to as number);
        break;

      case 'opacity':
        animatedValue = opacityValue;
        fromValue = isReverse ? (config.to as number) : (config.from as number);
        toValue = isReverse ? (config.from as number) : (config.to as number);
        break;

      case 'translate': {
        const toT = config.to as { x: number; y: number };

        // Create sequence for shake effect
        const shakeSequence = Animated.sequence([
          Animated.timing(translateXValue, {
            toValue: toT.x,
            duration: config.duration / 6,
            easing: easingFn,
            useNativeDriver: true,
          }),
          Animated.timing(translateXValue, {
            toValue: -toT.x,
            duration: config.duration / 6,
            easing: easingFn,
            useNativeDriver: true,
          }),
          Animated.timing(translateXValue, {
            toValue: toT.x * 0.6,
            duration: config.duration / 6,
            easing: easingFn,
            useNativeDriver: true,
          }),
          Animated.timing(translateXValue, {
            toValue: -toT.x * 0.6,
            duration: config.duration / 6,
            easing: easingFn,
            useNativeDriver: true,
          }),
          Animated.timing(translateXValue, {
            toValue: toT.x * 0.3,
            duration: config.duration / 6,
            easing: easingFn,
            useNativeDriver: true,
          }),
          Animated.timing(translateXValue, {
            toValue: 0,
            duration: config.duration / 6,
            easing: easingFn,
            useNativeDriver: true,
          }),
        ]);

        if (config.loop && config.iterations === -1) {
          return Animated.loop(shakeSequence);
        }
        return shakeSequence;
      }

      case 'sequence':
        if (__DEV__) {
          console.warn(
            '[rn-iconify] Animation type "sequence" is not yet implemented. ' +
              'Use individual animation presets (spin, pulse, bounce, shake, ping, wiggle) instead.'
          );
        }
        return null;

      default:
        return null;
    }

    // Reset to starting value
    animatedValue.setValue(fromValue);

    // Create the animation
    let anim: Animated.CompositeAnimation;

    if (isAlternate) {
      // Alternate: go to target then back
      anim = Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: toValue,
          duration: config.duration / 2,
          easing: easingFn,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: fromValue,
          duration: config.duration / 2,
          easing: easingFn,
          useNativeDriver: true,
        }),
      ]);
    } else {
      anim = Animated.timing(animatedValue, {
        toValue: toValue,
        duration: config.duration,
        easing: easingFn,
        useNativeDriver: true,
      });
    }

    // Apply looping
    if (config.loop && config.iterations === -1) {
      return Animated.loop(anim);
    } else if (config.iterations > 1) {
      return Animated.loop(anim, { iterations: config.iterations });
    }

    return anim;
  }, [config, rotateValue, scaleValue, opacityValue, translateXValue]);

  // Start animation
  const start = useCallback(() => {
    if (!config) return;

    // Stop any existing animation
    if (animationRef.current) {
      animationRef.current.stop();
    }

    // Apply delay if specified
    const startAnimation = () => {
      const anim = createAnimation();
      if (!anim) return;

      animationRef.current = anim;
      // Use queueMicrotask to defer state update (React 19 compatibility)
      queueMicrotask(() => {
        if (mountedRef.current) {
          setState('running');
        }
      });

      anim.start(({ finished }) => {
        if (mountedRef.current) {
          // Use queueMicrotask to defer state update (React 19 compatibility)
          queueMicrotask(() => {
            if (mountedRef.current) {
              if (finished) {
                setState('completed');
                onComplete?.();
              } else {
                setState('idle');
              }
            }
          });
        }
      });
    };

    if (config.delay > 0) {
      setTimeout(startAnimation, config.delay);
    } else {
      startAnimation();
    }
  }, [config, createAnimation, onComplete]);

  // Stop animation
  const stop = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    // Use queueMicrotask to defer state update (React 19 compatibility)
    queueMicrotask(() => {
      if (mountedRef.current) {
        setState('idle');
      }
    });
  }, []);

  // Pause animation
  // Note: React Native's Animated API does not support true pause/resume.
  // pause() stops the animation at its current position.
  // resume() restarts the animation from the beginning.
  const pause = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    queueMicrotask(() => {
      if (mountedRef.current) {
        setState('paused');
      }
    });
  }, []);

  // Resume a paused animation (restarts from beginning due to RN Animated API limitations)
  const resume = useCallback(() => {
    if (state === 'paused') {
      start();
    }
  }, [state, start]);

  // Reset animation
  const reset = useCallback(() => {
    stop();
    rotateValue.setValue(0);
    scaleValue.setValue(1);
    opacityValue.setValue(1);
    translateXValue.setValue(0);
    translateYValue.setValue(0);
  }, [stop, rotateValue, scaleValue, opacityValue, translateXValue, translateYValue]);

  // Auto-play on mount
  useEffect(() => {
    mountedRef.current = true;

    if (animation && autoPlay) {
      start();
    }

    return () => {
      mountedRef.current = false;
      stop();
    };
  }, [animation, autoPlay, start, stop]);

  // Build animated style
  const animatedStyle = useMemo(() => {
    if (!config) return {};

    switch (config.type) {
      case 'rotate': {
        const fromDeg = config.from as number;
        const toDeg = config.to as number;
        return {
          transform: [
            {
              rotate: rotateValue.interpolate({
                inputRange: [fromDeg, toDeg],
                outputRange: [`${fromDeg}deg`, `${toDeg}deg`],
              }),
            },
          ],
        };
      }

      case 'scale':
        return {
          transform: [{ scale: scaleValue }],
        };

      case 'opacity':
        return {
          opacity: opacityValue,
        };

      case 'translate':
        return {
          transform: [{ translateX: translateXValue }, { translateY: translateYValue }],
        };

      default:
        return {};
    }
  }, [config, rotateValue, scaleValue, opacityValue, translateXValue, translateYValue]);

  return {
    animatedStyle,
    hasAnimation: !!animation,
    state,
    isAnimating: state === 'running',
    start,
    stop,
    pause,
    resume,
    reset,
  };
}

export default useIconAnimation;
