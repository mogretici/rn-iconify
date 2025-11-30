/**
 * Animated Icons Module
 * Provides animation capabilities for rn-iconify icons
 *
 * @example Basic usage with preset
 * ```tsx
 * import { Mdi } from 'rn-iconify';
 *
 * // Direct usage with animate prop
 * <Mdi name="loading" animate="spin" />
 * <Mdi name="heart" animate="pulse" />
 * <Mdi name="bell" animate="shake" />
 * ```
 *
 * @example Using AnimatedIcon wrapper
 * ```tsx
 * import { AnimatedIcon } from 'rn-iconify/animated';
 * import { Mdi } from 'rn-iconify';
 *
 * <AnimatedIcon animate="bounce">
 *   <Mdi name="star" size={24} />
 * </AnimatedIcon>
 * ```
 *
 * @example Custom animation configuration
 * ```tsx
 * <Mdi
 *   name="sync"
 *   animate={{
 *     type: 'rotate',
 *     duration: 2000,
 *     easing: 'linear',
 *     loop: true,
 *   }}
 * />
 * ```
 *
 * @example Animation control with ref
 * ```tsx
 * import { useRef } from 'react';
 * import { AnimatedIcon, AnimationControls } from 'rn-iconify/animated';
 *
 * function MyComponent() {
 *   const animRef = useRef<AnimationControls>(null);
 *
 *   const handlePress = () => {
 *     if (animRef.current?.isAnimating) {
 *       animRef.current.stop();
 *     } else {
 *       animRef.current?.start();
 *     }
 *   };
 *
 *   return (
 *     <TouchableOpacity onPress={handlePress}>
 *       <AnimatedIcon ref={animRef} animate="spin" autoPlay={false}>
 *         <Mdi name="refresh" size={24} />
 *       </AnimatedIcon>
 *     </TouchableOpacity>
 *   );
 * }
 * ```
 */

// Types
export type {
  AnimationPreset,
  AnimationDirection,
  AnimationEasing,
  AnimationConfig,
  AnimationType,
  ResolvedAnimationConfig,
  AnimationState,
  AnimationControls,
  AnimatedIconProps,
} from './types';

export { DEFAULT_ANIMATION_DURATIONS, DEFAULT_ANIMATION_LOOPS } from './types';

// Presets
export {
  ANIMATION_PRESETS,
  getEasingFunction,
  resolveAnimation,
  isAnimationPreset,
  getDefaultDuration,
  getDefaultLoop,
} from './presets';

// Hook
export { useIconAnimation } from './useIconAnimation';

// Component
export { AnimatedIcon } from './AnimatedIcon';

// Default export
export { AnimatedIcon as default } from './AnimatedIcon';
