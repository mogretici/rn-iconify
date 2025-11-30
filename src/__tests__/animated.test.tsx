/**
 * Tests for Animation System
 */

import React from 'react';
import { render, renderHook } from '@testing-library/react-native';
import { View } from 'react-native';

import {
  AnimatedIcon,
  useIconAnimation,
  ANIMATION_PRESETS,
  resolveAnimation,
  isAnimationPreset,
  getEasingFunction,
  getDefaultDuration,
  getDefaultLoop,
} from '../animated';
import type { AnimationPreset, AnimationConfig } from '../animated/types';

describe('Animation System', () => {
  describe('ANIMATION_PRESETS', () => {
    it('should have all expected presets', () => {
      expect(ANIMATION_PRESETS).toHaveProperty('spin');
      expect(ANIMATION_PRESETS).toHaveProperty('pulse');
      expect(ANIMATION_PRESETS).toHaveProperty('bounce');
      expect(ANIMATION_PRESETS).toHaveProperty('shake');
      expect(ANIMATION_PRESETS).toHaveProperty('ping');
      expect(ANIMATION_PRESETS).toHaveProperty('wiggle');
    });

    it('spin preset should rotate 360 degrees', () => {
      expect(ANIMATION_PRESETS.spin.type).toBe('rotate');
      expect(ANIMATION_PRESETS.spin.from).toBe(0);
      expect(ANIMATION_PRESETS.spin.to).toBe(360);
      expect(ANIMATION_PRESETS.spin.loop).toBe(true);
    });

    it('pulse preset should animate opacity', () => {
      expect(ANIMATION_PRESETS.pulse.type).toBe('opacity');
      expect(ANIMATION_PRESETS.pulse.loop).toBe(true);
    });

    it('bounce preset should animate scale', () => {
      expect(ANIMATION_PRESETS.bounce.type).toBe('scale');
      expect(ANIMATION_PRESETS.bounce.loop).toBe(true);
    });

    it('shake preset should animate translate', () => {
      expect(ANIMATION_PRESETS.shake.type).toBe('translate');
      expect(ANIMATION_PRESETS.shake.loop).toBe(false);
    });

    it('ping preset should animate scale', () => {
      expect(ANIMATION_PRESETS.ping.type).toBe('scale');
      expect(ANIMATION_PRESETS.ping.loop).toBe(true);
    });

    it('wiggle preset should animate rotate', () => {
      expect(ANIMATION_PRESETS.wiggle.type).toBe('rotate');
      expect(ANIMATION_PRESETS.wiggle.loop).toBe(false);
    });
  });

  describe('isAnimationPreset', () => {
    it('should return true for valid presets', () => {
      expect(isAnimationPreset('spin')).toBe(true);
      expect(isAnimationPreset('pulse')).toBe(true);
      expect(isAnimationPreset('bounce')).toBe(true);
      expect(isAnimationPreset('shake')).toBe(true);
      expect(isAnimationPreset('ping')).toBe(true);
      expect(isAnimationPreset('wiggle')).toBe(true);
    });

    it('should return false for invalid presets', () => {
      expect(isAnimationPreset('invalid')).toBe(false);
      expect(isAnimationPreset('rotate')).toBe(false);
      expect(isAnimationPreset('')).toBe(false);
    });
  });

  describe('getDefaultDuration', () => {
    it('should return correct durations for presets', () => {
      expect(getDefaultDuration('spin')).toBe(1000);
      expect(getDefaultDuration('pulse')).toBe(1500);
      expect(getDefaultDuration('bounce')).toBe(600);
      expect(getDefaultDuration('shake')).toBe(500);
      expect(getDefaultDuration('ping')).toBe(1000);
      expect(getDefaultDuration('wiggle')).toBe(300);
    });
  });

  describe('getDefaultLoop', () => {
    it('should return correct loop settings for presets', () => {
      expect(getDefaultLoop('spin')).toBe(true);
      expect(getDefaultLoop('pulse')).toBe(true);
      expect(getDefaultLoop('bounce')).toBe(true);
      expect(getDefaultLoop('shake')).toBe(false);
      expect(getDefaultLoop('ping')).toBe(true);
      expect(getDefaultLoop('wiggle')).toBe(false);
    });
  });

  describe('getEasingFunction', () => {
    it('should return easing functions for all easing types', () => {
      expect(typeof getEasingFunction('linear')).toBe('function');
      expect(typeof getEasingFunction('ease')).toBe('function');
      expect(typeof getEasingFunction('ease-in')).toBe('function');
      expect(typeof getEasingFunction('ease-out')).toBe('function');
      expect(typeof getEasingFunction('ease-in-out')).toBe('function');
      expect(typeof getEasingFunction('bounce')).toBe('function');
    });

    it('should return custom function if provided', () => {
      const customEasing = (t: number) => t * t;
      expect(getEasingFunction(customEasing)).toBe(customEasing);
    });
  });

  describe('resolveAnimation', () => {
    it('should resolve preset string to full config', () => {
      const config = resolveAnimation('spin');

      expect(config.type).toBe('rotate');
      expect(config.duration).toBe(1000);
      expect(config.loop).toBe(true);
      expect(config.from).toBe(0);
      expect(config.to).toBe(360);
    });

    it('should apply overrides to preset', () => {
      const config = resolveAnimation('spin', {
        duration: 2000,
        loop: false,
      });

      expect(config.duration).toBe(2000);
      expect(config.loop).toBe(false);
    });

    it('should handle custom config object', () => {
      const customConfig: AnimationConfig = {
        type: 'scale',
        duration: 500,
        from: 1,
        to: 1.5,
        loop: false,
      };

      const config = resolveAnimation(customConfig);

      expect(config.type).toBe('scale');
      expect(config.duration).toBe(500);
      expect(config.from).toBe(1);
      expect(config.to).toBe(1.5);
    });

    it('should normalize translate values with required x/y', () => {
      const config = resolveAnimation({
        type: 'translate',
        from: { x: 0 },
        to: { x: 10 },
      });

      expect(config.from).toEqual({ x: 0, y: 0 });
      expect(config.to).toEqual({ x: 10, y: 0 });
    });

    it('should handle numeric from/to for non-translate types', () => {
      const config = resolveAnimation({
        type: 'scale',
        from: 1,
        to: 2,
      });

      expect(config.from).toBe(1);
      expect(config.to).toBe(2);
    });

    it('should apply delay override', () => {
      const config = resolveAnimation('spin', { delay: 500 });
      expect(config.delay).toBe(500);
    });

    it('should apply easing override', () => {
      const config = resolveAnimation('spin', { easing: 'ease-in-out' });
      expect(config.easing).toBe('ease-in-out');
    });
  });

  describe('useIconAnimation', () => {
    it('should return hasAnimation false when no animation', () => {
      const { result } = renderHook(() => useIconAnimation());

      expect(result.current.hasAnimation).toBe(false);
      expect(result.current.animatedStyle).toEqual({});
    });

    it('should return hasAnimation true when animation is provided', () => {
      const { result } = renderHook(() => useIconAnimation({ animation: 'spin', autoPlay: false }));

      expect(result.current.hasAnimation).toBe(true);
    });

    it('should have correct initial state', () => {
      const { result } = renderHook(() => useIconAnimation({ animation: 'spin', autoPlay: false }));

      expect(result.current.state).toBe('idle');
      expect(result.current.isAnimating).toBe(false);
    });

    it('should provide animation controls', () => {
      const { result } = renderHook(() => useIconAnimation({ animation: 'spin', autoPlay: false }));

      expect(typeof result.current.start).toBe('function');
      expect(typeof result.current.stop).toBe('function');
      expect(typeof result.current.pause).toBe('function');
      expect(typeof result.current.resume).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('should return transform style for rotate animation', () => {
      const { result } = renderHook(() => useIconAnimation({ animation: 'spin', autoPlay: false }));

      expect(result.current.animatedStyle).toHaveProperty('transform');
    });

    it('should return opacity style for pulse animation', () => {
      const { result } = renderHook(() =>
        useIconAnimation({ animation: 'pulse', autoPlay: false })
      );

      expect(result.current.animatedStyle).toHaveProperty('opacity');
    });

    it('should return scale transform for bounce animation', () => {
      const { result } = renderHook(() =>
        useIconAnimation({ animation: 'bounce', autoPlay: false })
      );

      expect(result.current.animatedStyle).toHaveProperty('transform');
    });

    it('should return translate transform for shake animation', () => {
      const { result } = renderHook(() =>
        useIconAnimation({ animation: 'shake', autoPlay: false })
      );

      expect(result.current.animatedStyle).toHaveProperty('transform');
    });

    it('should accept duration override', () => {
      const { result } = renderHook(() =>
        useIconAnimation({
          animation: 'spin',
          duration: 2000,
          autoPlay: false,
        })
      );

      expect(result.current.hasAnimation).toBe(true);
    });

    it('should accept loop override', () => {
      const { result } = renderHook(() =>
        useIconAnimation({
          animation: 'spin',
          loop: false,
          autoPlay: false,
        })
      );

      expect(result.current.hasAnimation).toBe(true);
    });
  });

  describe('AnimatedIcon', () => {
    it('should render children without animation', () => {
      const { getByTestId } = render(
        <AnimatedIcon testID="animated-icon">
          <View testID="child-icon" />
        </AnimatedIcon>
      );

      expect(getByTestId('child-icon')).toBeTruthy();
    });

    it('should render with animation wrapper when animate prop is provided', () => {
      const { getByTestId } = render(
        <AnimatedIcon animate="spin" testID="animated-icon">
          <View testID="child-icon" />
        </AnimatedIcon>
      );

      expect(getByTestId('animated-icon')).toBeTruthy();
      expect(getByTestId('child-icon')).toBeTruthy();
    });

    it('should accept custom width and height', () => {
      const { getByTestId } = render(
        <AnimatedIcon animate="spin" width={32} height={32} testID="animated-icon">
          <View testID="child-icon" />
        </AnimatedIcon>
      );

      expect(getByTestId('animated-icon')).toBeTruthy();
    });

    it('should accept autoPlay prop', () => {
      const { getByTestId } = render(
        <AnimatedIcon animate="spin" autoPlay={false} testID="animated-icon">
          <View testID="child-icon" />
        </AnimatedIcon>
      );

      expect(getByTestId('animated-icon')).toBeTruthy();
    });

    it('should accept animation duration override', () => {
      const { getByTestId } = render(
        <AnimatedIcon animate="spin" animationDuration={2000} testID="animated-icon">
          <View testID="child-icon" />
        </AnimatedIcon>
      );

      expect(getByTestId('animated-icon')).toBeTruthy();
    });

    it('should accept animation loop override', () => {
      const { getByTestId } = render(
        <AnimatedIcon animate="spin" animationLoop={false} testID="animated-icon">
          <View testID="child-icon" />
        </AnimatedIcon>
      );

      expect(getByTestId('animated-icon')).toBeTruthy();
    });

    it('should accept custom animation config', () => {
      const { getByTestId } = render(
        <AnimatedIcon
          animate={{ type: 'rotate', duration: 1500, from: 0, to: 180 }}
          testID="animated-icon"
        >
          <View testID="child-icon" />
        </AnimatedIcon>
      );

      expect(getByTestId('animated-icon')).toBeTruthy();
    });

    it('should render pulse animation', () => {
      const { getByTestId } = render(
        <AnimatedIcon animate="pulse" testID="animated-icon">
          <View testID="child-icon" />
        </AnimatedIcon>
      );

      expect(getByTestId('animated-icon')).toBeTruthy();
    });

    it('should render bounce animation', () => {
      const { getByTestId } = render(
        <AnimatedIcon animate="bounce" testID="animated-icon">
          <View testID="child-icon" />
        </AnimatedIcon>
      );

      expect(getByTestId('animated-icon')).toBeTruthy();
    });

    it('should render shake animation', () => {
      const { getByTestId } = render(
        <AnimatedIcon animate="shake" testID="animated-icon">
          <View testID="child-icon" />
        </AnimatedIcon>
      );

      expect(getByTestId('animated-icon')).toBeTruthy();
    });
  });

  describe('Animation presets behavior', () => {
    const presetNames: AnimationPreset[] = ['spin', 'pulse', 'bounce', 'shake', 'ping', 'wiggle'];

    presetNames.forEach((preset) => {
      it(`${preset} preset should have valid configuration`, () => {
        const config = ANIMATION_PRESETS[preset];

        expect(config).toBeDefined();
        expect(config.type).toBeDefined();
        expect(typeof config.duration).toBe('number');
        expect(typeof config.loop).toBe('boolean');
        expect(config.from).toBeDefined();
        expect(config.to).toBeDefined();
      });

      it(`${preset} preset should be resolvable`, () => {
        const resolved = resolveAnimation(preset);

        expect(resolved.type).toBeDefined();
        expect(resolved.duration).toBeGreaterThan(0);
        expect(typeof resolved.loop).toBe('boolean');
      });
    });
  });

  describe('Type exports', () => {
    it('should export all required functions and values', () => {
      const animated = require('../animated');

      expect(animated.AnimatedIcon).toBeDefined();
      expect(animated.useIconAnimation).toBeDefined();
      expect(animated.ANIMATION_PRESETS).toBeDefined();
      expect(animated.resolveAnimation).toBeDefined();
      expect(animated.isAnimationPreset).toBeDefined();
      expect(animated.getEasingFunction).toBeDefined();
      expect(animated.getDefaultDuration).toBeDefined();
      expect(animated.getDefaultLoop).toBeDefined();
      expect(animated.DEFAULT_ANIMATION_DURATIONS).toBeDefined();
      expect(animated.DEFAULT_ANIMATION_LOOPS).toBeDefined();
    });
  });
});
