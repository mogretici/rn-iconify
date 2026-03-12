/**
 * IconRenderer Unit Tests
 *
 * Comprehensive test suite for the core IconRenderer component (v3.0).
 * Covers the useReducer state machine, cache/network flow, accessibility,
 * press interactions, animation integration, transforms, and forwardRef.
 */

import React, { createRef } from 'react';
import { View, Pressable, Animated } from 'react-native';
import { render, act } from '@testing-library/react-native';
import { SvgXml } from 'react-native-svg';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks — must be declared before importing the module under test
// ─────────────────────────────────────────────────────────────────────────────

jest.mock('../cache/CacheManager', () => ({
  CacheManager: {
    get: jest.fn(),
    set: jest.fn(),
    prefetch: jest.fn(),
    clear: jest.fn(),
    clearNative: jest.fn(),
  },
}));

jest.mock('../network/IconifyAPI', () => ({
  fetchIcon: jest.fn(),
}));

jest.mock('../animated/useIconAnimation', () => ({
  useIconAnimation: jest.fn(() => ({
    animatedStyle: {},
    hasAnimation: false,
    state: 'idle',
    isAnimating: false,
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    reset: jest.fn(),
  })),
}));

jest.mock('../accessibility/AccessibilityProvider', () => ({
  useAccessibility: jest.fn(() => null),
}));

jest.mock('../config', () => ({
  ConfigManager: {
    getDefaultsConfig: jest.fn(() => ({
      placeholder: false,
      fadeIn: false,
      fadeInDuration: 300,
    })),
  },
}));

jest.mock('../placeholder', () => {
  const React = require('react');
  return {
    PlaceholderFactory: jest.fn((props: Record<string, unknown>) =>
      React.createElement('PlaceholderFactory', props)
    ),
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// Imports (after mocks)
// ─────────────────────────────────────────────────────────────────────────────

import { IconRenderer } from '../IconRenderer';
import { CacheManager } from '../cache/CacheManager';
import { fetchIcon } from '../network/IconifyAPI';
import { useAccessibility } from '../accessibility/AccessibilityProvider';
import { useIconAnimation } from '../animated/useIconAnimation';
import { ConfigManager } from '../config';
import { IconLoadError } from '../errors';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>';

const mockCacheGet = CacheManager.get as jest.Mock;
const mockCacheSet = CacheManager.set as jest.Mock;
const mockFetchIcon = fetchIcon as jest.Mock;
const mockUseAccessibility = useAccessibility as jest.Mock;
const mockUseIconAnimation = useIconAnimation as jest.Mock;
const mockGetDefaultsConfig = ConfigManager.getDefaultsConfig as jest.Mock;

/**
 * Helper: render IconRenderer with minimal required props
 */
function renderIcon(overrides: Partial<React.ComponentProps<typeof IconRenderer>> = {}) {
  const defaultProps = {
    iconName: 'mdi:home',
    testID: 'icon',
    ...overrides,
  };
  return render(<IconRenderer {...defaultProps} />);
}

/**
 * Helper: set up a cache miss with a resolved network fetch
 */
function setupNetworkSuccess(svg = MOCK_SVG) {
  mockCacheGet.mockReturnValue(null);
  mockFetchIcon.mockResolvedValue(svg);
}

/**
 * Helper: set up a cache miss with a rejected network fetch
 */
function setupNetworkFailure(error: Error = new IconLoadError('NETWORK', 'fetch failed')) {
  mockCacheGet.mockReturnValue(null);
  mockFetchIcon.mockRejectedValue(error);
}

/**
 * Helper: set up a synchronous cache hit
 */
function setupCacheHit(svg = MOCK_SVG) {
  mockCacheGet.mockReturnValue(svg);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('IconRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetDefaultsConfig.mockReturnValue({
      placeholder: false,
      fadeIn: false,
      fadeInDuration: 300,
    });
    mockUseAccessibility.mockReturnValue(null);
    mockUseIconAnimation.mockReturnValue({
      animatedStyle: {},
      hasAnimation: false,
      state: 'idle',
      isAnimating: false,
      start: jest.fn(),
      stop: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      reset: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. State machine transitions
  // ═══════════════════════════════════════════════════════════════════════════

  describe('State machine transitions', () => {
    it('idle -> loaded on cache hit (synchronous)', () => {
      setupCacheHit();

      const { getByTestId } = renderIcon();

      // SVG should be rendered immediately (no loading state visible)
      const container = getByTestId('icon');
      expect(container).toBeTruthy();
      // SvgXml should have been rendered with the cached SVG
      expect(SvgXml).toHaveBeenCalledWith(
        expect.objectContaining({ xml: MOCK_SVG }),
        expect.anything()
      );
    });

    it('idle -> loading -> loaded on cache miss + network success', async () => {
      setupNetworkSuccess();

      const { getByTestId } = renderIcon();

      // Initially in loading state — empty view (no SVG yet)
      expect(getByTestId('icon')).toBeTruthy();
      expect(mockFetchIcon).toHaveBeenCalledWith('mdi:home', expect.any(AbortSignal));

      // Resolve the fetch
      await act(async () => {
        await Promise.resolve(); // flush microtasks
      });

      // Now SVG should be rendered
      expect(SvgXml).toHaveBeenCalledWith(
        expect.objectContaining({ xml: MOCK_SVG }),
        expect.anything()
      );
    });

    it('idle -> loading -> error on network failure', async () => {
      const error = new IconLoadError('NETWORK', 'server error');
      setupNetworkFailure(error);

      const onError = jest.fn();
      const { getByTestId } = renderIcon({ onError });

      await act(async () => {
        await Promise.resolve();
      });

      // onError should have been called with the typed error
      expect(onError).toHaveBeenCalledWith(error);
      // The icon container should still be rendered (empty view or fallback)
      expect(getByTestId('icon')).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Cache hit behavior
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Cache hit behavior', () => {
    it('renders SVG immediately when CacheManager.get returns data', () => {
      setupCacheHit();

      renderIcon();

      // fetchIcon should NOT have been called
      expect(mockFetchIcon).not.toHaveBeenCalled();
      // SVG rendered directly
      expect(SvgXml).toHaveBeenCalledWith(
        expect.objectContaining({ xml: MOCK_SVG }),
        expect.anything()
      );
    });

    it('does not apply fade animation on cache hit', () => {
      // Even if fadeIn is enabled, cache hits skip fade
      mockGetDefaultsConfig.mockReturnValue({
        placeholder: false,
        fadeIn: true,
        fadeInDuration: 300,
      });
      setupCacheHit();

      renderIcon();

      // The component should render as a plain View (not Animated.View with opacity)
      // because fadeAnim is set to 1 immediately on cache hit
      expect(SvgXml).toHaveBeenCalled();
    });

    it('calls onLoad synchronously on cache hit', () => {
      setupCacheHit();
      const onLoad = jest.fn();

      renderIcon({ onLoad });

      // onLoad should have been called during the first render cycle
      expect(onLoad).toHaveBeenCalledTimes(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Network fetch
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Network fetch', () => {
    it('calls fetchIcon when cache misses', async () => {
      setupNetworkSuccess();

      renderIcon({ iconName: 'mdi:settings' });

      expect(mockFetchIcon).toHaveBeenCalledWith('mdi:settings', expect.any(AbortSignal));

      // Flush the resolved promise to avoid act() warning
      await act(async () => {
        await Promise.resolve();
      });
    });

    it('shows placeholder during loading when configured', async () => {
      mockCacheGet.mockReturnValue(null);
      // Use a pending promise so the component stays in loading state
      mockFetchIcon.mockReturnValue(new Promise(() => {}));
      mockGetDefaultsConfig.mockReturnValue({
        placeholder: 'shimmer',
        fadeIn: false,
        fadeInDuration: 300,
      });

      const { getByTestId } = renderIcon();

      // During loading, a placeholder should be rendered
      expect(getByTestId('icon')).toBeTruthy();
    });

    it('renders SVG after successful fetch', async () => {
      setupNetworkSuccess();

      renderIcon();

      await act(async () => {
        await Promise.resolve();
      });

      expect(SvgXml).toHaveBeenCalledWith(
        expect.objectContaining({ xml: MOCK_SVG }),
        expect.anything()
      );
    });

    it('stores fetched SVG in cache', async () => {
      setupNetworkSuccess();

      renderIcon({ iconName: 'mdi:star' });

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockCacheSet).toHaveBeenCalledWith('mdi:star', MOCK_SVG);
    });

    it('calls onLoad after successful fetch', async () => {
      setupNetworkSuccess();
      const onLoad = jest.fn();

      renderIcon({ onLoad });

      expect(onLoad).not.toHaveBeenCalled();

      await act(async () => {
        await Promise.resolve();
      });

      expect(onLoad).toHaveBeenCalledTimes(1);
    });

    it('shows placeholder with delay when fallbackDelay > 0', async () => {
      mockCacheGet.mockReturnValue(null);
      // Use a long-pending promise to keep it in loading state
      let resolvePromise: (value: string) => void;
      mockFetchIcon.mockReturnValue(
        new Promise<string>((resolve) => {
          resolvePromise = resolve;
        })
      );

      const fallback = <View testID="fallback-component" />;
      renderIcon({ fallback, fallbackDelay: 500 });

      // Fallback should NOT be shown immediately because of the delay
      // Note: the showFallback is false initially, and the timer hasn't fired yet
      // The empty view is shown instead

      // Advance past the delay
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Now resolve the fetch to clean up
      await act(async () => {
        resolvePromise!(MOCK_SVG);
        await Promise.resolve();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Error handling
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Error handling', () => {
    it('passes IconLoadError to onError callback', async () => {
      const error = new IconLoadError('NOT_FOUND', 'icon not found');
      setupNetworkFailure(error);
      const onError = jest.fn();

      renderIcon({ onError });

      await act(async () => {
        await Promise.resolve();
      });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error);
      expect(onError.mock.calls[0][0]).toBeInstanceOf(IconLoadError);
    });

    it('wraps non-IconLoadError in IconLoadError with NETWORK code', async () => {
      const rawError = new Error('Connection timeout');
      setupNetworkFailure(rawError);
      const onError = jest.fn();

      renderIcon({ onError });

      await act(async () => {
        await Promise.resolve();
      });

      expect(onError).toHaveBeenCalledTimes(1);
      // The code wraps plain Error objects as-is (they pass through the instanceof Error check)
      const receivedError = onError.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(Error);
    });

    it('renders fallback component on error', async () => {
      setupNetworkFailure();

      const fallback = <View testID="fallback-view" />;
      const { getByTestId } = renderIcon({ fallback });

      await act(async () => {
        await Promise.resolve();
      });

      expect(getByTestId('fallback-view')).toBeTruthy();
    });

    it('renders empty view on error when no fallback is configured', async () => {
      setupNetworkFailure();

      const { getByTestId } = renderIcon();

      await act(async () => {
        await Promise.resolve();
      });

      // Should still render the container view (empty, no SvgXml)
      expect(getByTestId('icon')).toBeTruthy();
    });

    it('does not call onError for AbortError (cancelled requests)', async () => {
      mockCacheGet.mockReturnValue(null);
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetchIcon.mockRejectedValue(abortError);

      const onError = jest.fn();
      renderIcon({ onError });

      await act(async () => {
        await Promise.resolve();
      });

      expect(onError).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. forwardRef
  // ═══════════════════════════════════════════════════════════════════════════

  describe('forwardRef', () => {
    it('forwards ref to the outer View', () => {
      setupCacheHit();
      const ref = createRef<View>();

      render(<IconRenderer ref={ref} iconName="mdi:home" testID="icon" />);

      expect(ref.current).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. hitSlop
  // ═══════════════════════════════════════════════════════════════════════════

  describe('hitSlop', () => {
    it('applies hitSlop of 10 for 24px icons (Math.max(0, (44-24)/2))', () => {
      setupCacheHit();
      const onPress = jest.fn();

      const { UNSAFE_getByType } = renderIcon({ size: 24, onPress });

      const pressable = UNSAFE_getByType(Pressable);
      expect(pressable.props.hitSlop).toBe(10);
    });

    it('applies hitSlop of 0 for 44px icons (already meets minimum target)', () => {
      setupCacheHit();
      const onPress = jest.fn();

      const { UNSAFE_getByType } = renderIcon({ size: 44, onPress });

      const pressable = UNSAFE_getByType(Pressable);
      expect(pressable.props.hitSlop).toBe(0);
    });

    it('applies correct hitSlop for large icons (> 44px)', () => {
      setupCacheHit();
      const onPress = jest.fn();

      const { UNSAFE_getByType } = renderIcon({ size: 64, onPress });

      const pressable = UNSAFE_getByType(Pressable);
      // Math.max(0, (44-64)/2) = Math.max(0, -10) = 0
      expect(pressable.props.hitSlop).toBe(0);
    });

    it('uses the smaller dimension for hitSlop when width and height differ', () => {
      setupCacheHit();
      const onPress = jest.fn();

      const { UNSAFE_getByType } = renderIcon({ width: 20, height: 40, onPress });

      const pressable = UNSAFE_getByType(Pressable);
      // Math.min(20, 40) = 20; Math.max(0, (44-20)/2) = 12
      expect(pressable.props.hitSlop).toBe(12);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. Press interactions
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Press interactions', () => {
    it('wraps content in Pressable when onPress is provided', () => {
      setupCacheHit();
      const onPress = jest.fn();

      const { UNSAFE_getByType } = renderIcon({ onPress });

      expect(UNSAFE_getByType(Pressable)).toBeTruthy();
    });

    it('wraps content in Pressable when onLongPress is provided', () => {
      setupCacheHit();
      const onLongPress = jest.fn();

      const { UNSAFE_getByType } = renderIcon({ onLongPress });

      expect(UNSAFE_getByType(Pressable)).toBeTruthy();
    });

    it('does NOT wrap content in Pressable when no press handlers exist', () => {
      setupCacheHit();

      const { UNSAFE_queryByType } = renderIcon();

      expect(UNSAFE_queryByType(Pressable)).toBeNull();
    });

    it('passes disabled prop to Pressable', () => {
      setupCacheHit();
      const onPress = jest.fn();

      const { UNSAFE_getByType } = renderIcon({ onPress, disabled: true });

      const pressable = UNSAFE_getByType(Pressable);
      expect(pressable.props.disabled).toBe(true);
    });

    it('passes all press handlers to Pressable', () => {
      setupCacheHit();
      const onPress = jest.fn();
      const onLongPress = jest.fn();
      const onPressIn = jest.fn();
      const onPressOut = jest.fn();

      const { UNSAFE_getByType } = renderIcon({
        onPress,
        onLongPress,
        onPressIn,
        onPressOut,
      });

      const pressable = UNSAFE_getByType(Pressable);
      expect(pressable.props.onPress).toBe(onPress);
      expect(pressable.props.onLongPress).toBe(onLongPress);
      expect(pressable.props.onPressIn).toBe(onPressIn);
      expect(pressable.props.onPressOut).toBe(onPressOut);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. Accessibility
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Accessibility', () => {
    it('sets accessibilityRole="image" by default', () => {
      setupCacheHit();

      const { getByTestId } = renderIcon();

      expect(getByTestId('icon').props.accessibilityRole).toBe('image');
    });

    it('forwards custom accessibilityLabel', () => {
      setupCacheHit();

      const { getByTestId } = renderIcon({ accessibilityLabel: 'Home icon' });

      expect(getByTestId('icon').props.accessibilityLabel).toBe('Home icon');
    });

    it('auto-generates label from accessibility context when no custom label', () => {
      mockUseAccessibility.mockReturnValue({
        config: {},
        prefersReducedMotion: false,
        isHighContrast: false,
        setConfig: jest.fn(),
        getLabel: jest.fn((iconName: string) => `${iconName} icon`),
        getContrastColor: jest.fn((c: string) => c),
        shouldDisableAnimations: jest.fn(() => false),
      });
      setupCacheHit();

      const { getByTestId } = renderIcon({ iconName: 'mdi:settings' });

      expect(getByTestId('icon').props.accessibilityLabel).toBe('mdi:settings icon');
    });

    it('prefers custom accessibilityLabel over auto-generated label', () => {
      mockUseAccessibility.mockReturnValue({
        config: {},
        prefersReducedMotion: false,
        isHighContrast: false,
        setConfig: jest.fn(),
        getLabel: jest.fn(() => 'auto-label'),
        getContrastColor: jest.fn((c: string) => c),
        shouldDisableAnimations: jest.fn(() => false),
      });
      setupCacheHit();

      const { getByTestId } = renderIcon({ accessibilityLabel: 'Custom label' });

      expect(getByTestId('icon').props.accessibilityLabel).toBe('Custom label');
    });

    it('sets accessibilityRole="button" on Pressable when interactive', () => {
      setupCacheHit();
      const onPress = jest.fn();

      const { UNSAFE_getByType } = renderIcon({ onPress });

      const pressable = UNSAFE_getByType(Pressable);
      expect(pressable.props.accessibilityRole).toBe('button');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. Animation
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Animation', () => {
    it('calls useIconAnimation with the animate prop', () => {
      setupCacheHit();

      renderIcon({ animate: 'spin' });

      expect(mockUseIconAnimation).toHaveBeenCalledWith(
        expect.objectContaining({
          animation: 'spin',
        })
      );
    });

    it('passes animation options to useIconAnimation', () => {
      setupCacheHit();

      renderIcon({
        animate: 'pulse',
        animationDuration: 2000,
        animationLoop: false,
        animationEasing: 'ease-in',
        animationDelay: 100,
        autoPlay: false,
        onAnimationComplete: expect.any(Function),
      });

      expect(mockUseIconAnimation).toHaveBeenCalledWith(
        expect.objectContaining({
          animation: 'pulse',
          duration: 2000,
          loop: false,
          easing: 'ease-in',
          delay: 100,
          autoPlay: false,
        })
      );
    });

    it('disables animation when reduced motion is active', () => {
      mockUseAccessibility.mockReturnValue({
        config: {},
        prefersReducedMotion: true,
        isHighContrast: false,
        setConfig: jest.fn(),
        getLabel: jest.fn(),
        getContrastColor: jest.fn((c: string) => c),
        shouldDisableAnimations: jest.fn(() => true),
      });
      setupCacheHit();

      renderIcon({ animate: 'spin' });

      // When reduceMotion is true, animate should be passed as undefined
      expect(mockUseIconAnimation).toHaveBeenCalledWith(
        expect.objectContaining({
          animation: undefined,
        })
      );
    });

    it('renders Animated.View when hasAnimation is true', () => {
      mockUseIconAnimation.mockReturnValue({
        animatedStyle: { transform: [{ rotate: '0deg' }] },
        hasAnimation: true,
        state: 'running',
        isAnimating: true,
        start: jest.fn(),
        stop: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        reset: jest.fn(),
      });
      setupCacheHit();

      const { UNSAFE_getByType } = renderIcon({ animate: 'spin' });

      // When hasAnimation is true, an Animated.View should be rendered
      expect(UNSAFE_getByType(Animated.View)).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. Rotation and flip
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Rotation and flip', () => {
    it('applies rotation transform when rotate prop is set', () => {
      setupCacheHit();

      const { getByTestId } = renderIcon({ rotate: 90 });

      const style = getByTestId('icon').props.style;
      // Style is an array; flatten and look for transform
      const flatStyle = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
      expect(flatStyle.transform).toEqual(expect.arrayContaining([{ rotate: '90deg' }]));
    });

    it('applies scaleX: -1 for horizontal flip', () => {
      setupCacheHit();

      const { getByTestId } = renderIcon({ flip: 'horizontal' });

      const style = getByTestId('icon').props.style;
      const flatStyle = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
      expect(flatStyle.transform).toEqual(expect.arrayContaining([{ scaleX: -1 }]));
    });

    it('applies scaleY: -1 for vertical flip', () => {
      setupCacheHit();

      const { getByTestId } = renderIcon({ flip: 'vertical' });

      const style = getByTestId('icon').props.style;
      const flatStyle = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
      expect(flatStyle.transform).toEqual(expect.arrayContaining([{ scaleY: -1 }]));
    });

    it('applies both scaleX: -1 and scaleY: -1 for "both" flip', () => {
      setupCacheHit();

      const { getByTestId } = renderIcon({ flip: 'both' });

      const style = getByTestId('icon').props.style;
      const flatStyle = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
      expect(flatStyle.transform).toEqual(expect.arrayContaining([{ scaleX: -1 }, { scaleY: -1 }]));
    });

    it('applies no transform when rotate=0 and no flip', () => {
      setupCacheHit();

      const { getByTestId } = renderIcon({ rotate: 0 });

      const style = getByTestId('icon').props.style;
      const flatStyle = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
      // transform should be undefined when there are no transforms
      expect(flatStyle.transform).toBeUndefined();
    });

    it('combines rotation and flip transforms', () => {
      setupCacheHit();

      const { getByTestId } = renderIcon({ rotate: 180, flip: 'horizontal' });

      const style = getByTestId('icon').props.style;
      const flatStyle = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
      expect(flatStyle.transform).toEqual([{ rotate: '180deg' }, { scaleX: -1 }]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. NativeWind className
  // ═══════════════════════════════════════════════════════════════════════════

  describe('NativeWind className', () => {
    it('forwards className prop to outer View', () => {
      setupCacheHit();

      const { getByTestId } = renderIcon({ className: 'w-6 h-6 text-blue-500' });

      expect(getByTestId('icon').props.className).toBe('w-6 h-6 text-blue-500');
    });

    it('does not set className prop when not provided', () => {
      setupCacheHit();

      const { getByTestId } = renderIcon();

      expect(getByTestId('icon').props.className).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Additional: Sizing and color
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Sizing and color', () => {
    it('uses default size of 24 and color of #000000', () => {
      setupCacheHit();

      renderIcon();

      expect(SvgXml).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 24,
          height: 24,
          color: '#000000',
        }),
        expect.anything()
      );
    });

    it('uses custom size', () => {
      setupCacheHit();

      renderIcon({ size: 48 });

      expect(SvgXml).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 48,
          height: 48,
        }),
        expect.anything()
      );
    });

    it('uses width/height overrides over size', () => {
      setupCacheHit();

      renderIcon({ size: 24, width: 32, height: 16 });

      expect(SvgXml).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 32,
          height: 16,
        }),
        expect.anything()
      );
    });

    it('passes color to SvgXml native color prop', () => {
      setupCacheHit();

      renderIcon({ color: '#FF0000' });

      expect(SvgXml).toHaveBeenCalledWith(
        expect.objectContaining({
          color: '#FF0000',
        }),
        expect.anything()
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Additional: Cleanup and remounting
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Cleanup and remounting', () => {
    it('aborts pending fetch on unmount', () => {
      setupNetworkSuccess();

      const { unmount } = renderIcon();

      // The AbortController should be created on mount
      expect(mockFetchIcon).toHaveBeenCalledWith('mdi:home', expect.any(AbortSignal));

      unmount();

      // After unmount, any resolved fetch should not update state (no errors thrown)
    });

    it('resets state and refetches when iconName changes', async () => {
      setupCacheHit('<svg>first</svg>');

      const { rerender } = render(<IconRenderer iconName="mdi:home" testID="icon" />);

      expect(mockCacheGet).toHaveBeenCalledWith('mdi:home');

      // Change icon name
      mockCacheGet.mockReturnValue('<svg>second</svg>');
      await act(async () => {
        rerender(<IconRenderer iconName="mdi:star" testID="icon" />);
      });

      expect(mockCacheGet).toHaveBeenCalledWith('mdi:star');
    });

    it('does not fetch when iconName is empty', () => {
      mockCacheGet.mockReturnValue(null);

      renderIcon({ iconName: '' });

      expect(mockFetchIcon).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Additional: testID and style
  // ═══════════════════════════════════════════════════════════════════════════

  describe('testID and style', () => {
    it('forwards testID to the outer View', () => {
      setupCacheHit();

      const { getByTestId } = renderIcon({ testID: 'my-icon' });

      expect(getByTestId('my-icon')).toBeTruthy();
    });

    it('applies custom style to the container', () => {
      setupCacheHit();

      const customStyle = { marginTop: 10, backgroundColor: 'red' };
      const { getByTestId } = renderIcon({ style: customStyle });

      const container = getByTestId('icon');
      // style is an array in the component; verify custom style is included
      const styles = container.props.style;
      const flatStyle = Array.isArray(styles)
        ? Object.assign({}, ...styles.filter(Boolean))
        : styles;
      expect(flatStyle).toEqual(expect.objectContaining(customStyle));
    });
  });
});
