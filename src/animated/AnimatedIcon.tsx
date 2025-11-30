/**
 * AnimatedIcon - Wrapper component for animated icons
 * Provides animation capabilities to any icon component
 */

import React, { forwardRef, useImperativeHandle } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useIconAnimation } from './useIconAnimation';
import type { AnimatedIconProps, AnimationControls } from './types';

/**
 * AnimatedIcon wrapper component
 * Wraps any icon component to add animation capabilities
 *
 * @example Basic usage
 * ```tsx
 * import { AnimatedIcon } from 'rn-iconify/animated';
 * import { Mdi } from 'rn-iconify';
 *
 * <AnimatedIcon animate="spin">
 *   <Mdi name="loading" size={24} />
 * </AnimatedIcon>
 * ```
 *
 * @example With custom configuration
 * ```tsx
 * <AnimatedIcon
 *   animate={{ type: 'rotate', duration: 2000, easing: 'linear' }}
 *   autoPlay={true}
 * >
 *   <Mdi name="sync" size={24} />
 * </AnimatedIcon>
 * ```
 *
 * @example With ref for animation control
 * ```tsx
 * const animationRef = useRef<AnimationControls>(null);
 *
 * <AnimatedIcon ref={animationRef} animate="bounce" autoPlay={false}>
 *   <Mdi name="heart" size={24} />
 * </AnimatedIcon>
 *
 * // Later
 * animationRef.current?.start();
 * ```
 */
export const AnimatedIcon = forwardRef<AnimationControls, AnimatedIconProps>(function AnimatedIcon(
  {
    children,
    animate,
    animationDuration,
    animationLoop,
    animationEasing,
    animationDelay,
    autoPlay = true,
    onAnimationComplete,
    width,
    height,
    testID,
  },
  ref
) {
  const { animatedStyle, hasAnimation, start, stop, pause, resume, reset, state, isAnimating } =
    useIconAnimation({
      animation: animate,
      duration: animationDuration,
      loop: animationLoop,
      easing: animationEasing,
      delay: animationDelay,
      autoPlay,
      onComplete: onAnimationComplete,
    });

  // Expose animation controls via ref
  useImperativeHandle(
    ref,
    () => ({
      start,
      stop,
      pause,
      resume,
      reset,
      state,
      isAnimating,
    }),
    [start, stop, pause, resume, reset, state, isAnimating]
  );

  // If no animation, render children directly
  if (!hasAnimation) {
    return <>{children}</>;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        width !== undefined && { width },
        height !== undefined && { height },
        animatedStyle,
      ]}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AnimatedIcon;
