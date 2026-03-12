/**
 * IconRenderer - Core component for rendering SVG icons
 * Handles cache lookup, network fetching, placeholders, and SVG rendering
 *
 * v3.0 rewrite:
 * - useReducer state machine (eliminates impossible states)
 * - SvgXml color prop (preserves multi-color icons)
 * - React.memo + React.forwardRef
 * - Stable loadIcon deps (only iconName triggers refetch)
 * - Auto 44dp hitSlop for small icons
 * - Typed IconLoadError
 */

import React, { useEffect, useCallback, useRef, useMemo, useReducer } from 'react';
import { View, StyleSheet, Animated, Pressable, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { CacheManager } from './cache/CacheManager';
import { fetchIcon } from './network/IconifyAPI';
import { PlaceholderFactory } from './placeholder';
import { useIconAnimation } from './animated/useIconAnimation';
import { ConfigManager } from './config';
import { IconLoadError } from './errors';
import { useAccessibility } from './accessibility/AccessibilityProvider';
import type { IconRendererProps } from './types';

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

interface IconState {
  svg: string | null;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  showFallback: boolean;
  wasCacheHit: boolean;
  error: IconLoadError | Error | null;
}

type IconAction =
  | { type: 'CACHE_HIT'; svg: string }
  | { type: 'FETCH_START' }
  | { type: 'SHOW_FALLBACK' }
  | { type: 'FETCH_SUCCESS'; svg: string }
  | { type: 'FETCH_ERROR'; error: IconLoadError | Error }
  | { type: 'RESET' };

const initialState: IconState = {
  svg: null,
  status: 'idle',
  showFallback: false,
  wasCacheHit: false,
  error: null,
};

function iconReducer(state: IconState, action: IconAction): IconState {
  switch (action.type) {
    case 'CACHE_HIT':
      return {
        svg: action.svg,
        status: 'loaded',
        showFallback: false,
        wasCacheHit: true,
        error: null,
      };
    case 'FETCH_START':
      return {
        svg: null,
        status: 'loading',
        showFallback: false,
        wasCacheHit: false,
        error: null,
      };
    case 'SHOW_FALLBACK':
      if (state.status !== 'loading') return state;
      return { ...state, showFallback: true };
    case 'FETCH_SUCCESS':
      return {
        svg: action.svg,
        status: 'loaded',
        showFallback: false,
        wasCacheHit: false,
        error: null,
      };
    case 'FETCH_ERROR':
      return {
        svg: null,
        status: 'error',
        showFallback: true,
        wasCacheHit: false,
        error: action.error,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// PressableWrapper — extracted and memoized
// ---------------------------------------------------------------------------

interface PressableWrapperProps {
  onPress?: () => void;
  onLongPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  disabled?: boolean;
  pressedStyle?: ViewStyle;
  hitSlop: number;
  children: React.ReactNode;
}

const PressableWrapper = React.memo(function PressableWrapper({
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  disabled,
  pressedStyle,
  hitSlop,
  children,
}: PressableWrapperProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={pressedStyle ? ({ pressed }) => [pressed && pressedStyle] : undefined}
    >
      {children}
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// MIN_TOUCH_TARGET for automatic hitSlop
// ---------------------------------------------------------------------------

const MIN_TOUCH_TARGET = 44;

// ---------------------------------------------------------------------------
// IconRenderer component
// ---------------------------------------------------------------------------

export const IconRenderer = React.memo(
  React.forwardRef<View, IconRendererProps>(function IconRenderer(
    {
      iconName,
      size = 24,
      color = '#000000',
      width: propWidth,
      height: propHeight,
      style,
      className,
      rotate = 0,
      flip,
      fallback,
      fallbackDelay = 0,
      placeholder,
      placeholderColor,
      placeholderDuration,
      onLoad,
      onError,
      accessibilityLabel,
      testID,
      // Press props
      onPress,
      onLongPress,
      onPressIn,
      onPressOut,
      disabled,
      pressedStyle,
      // Animation props
      animate,
      animationDuration,
      animationLoop,
      animationEasing,
      animationDelay,
      autoPlay = true,
      onAnimationComplete,
    },
    ref
  ) {
    // Resolve defaults from config
    const defaultsConfig = ConfigManager.getDefaultsConfig();
    const effectivePlaceholder =
      placeholder !== undefined
        ? placeholder
        : defaultsConfig.placeholder !== false
          ? defaultsConfig.placeholder
          : undefined;
    const fadeIn = defaultsConfig.fadeIn;
    const fadeInDuration = defaultsConfig.fadeInDuration;

    // State machine
    const [state, dispatch] = useReducer(iconReducer, initialState);

    // Refs for callback stability (these never invalidate loadIcon)
    const mountedRef = useRef(true);
    const abortControllerRef = useRef<AbortController | null>(null);
    const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onLoadRef = useRef(onLoad);
    const onErrorRef = useRef(onError);
    const fallbackRef = useRef(fallback);
    const effectivePlaceholderRef = useRef(effectivePlaceholder);

    // Keep refs up to date
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
    fallbackRef.current = fallback;
    effectivePlaceholderRef.current = effectivePlaceholder;

    // Fade-in animation value
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Calculate dimensions
    const iconWidth = propWidth ?? size;
    const iconHeight = propHeight ?? size;

    // Auto hitSlop for accessibility (44dp minimum touch target)
    const hitSlop = useMemo(
      () => Math.max(0, (MIN_TOUCH_TARGET - Math.min(iconWidth, iconHeight)) / 2),
      [iconWidth, iconHeight]
    );

    // Accessibility context (optional — works without AccessibilityProvider)
    const a11y = useAccessibility();
    const reduceMotion = a11y?.shouldDisableAnimations() ?? false;

    // Auto-generate accessibility label from icon name when not provided
    const resolvedA11yLabel = accessibilityLabel ?? a11y?.getLabel(iconName);

    // Animation hook — disabled when user prefers reduced motion
    const { animatedStyle, hasAnimation } = useIconAnimation({
      animation: reduceMotion ? undefined : animate,
      duration: animationDuration,
      loop: animationLoop,
      easing: animationEasing,
      delay: animationDelay,
      autoPlay,
      onComplete: onAnimationComplete,
    });

    // ------------------------------------------------------------------
    // loadIcon — deps are only [iconName, fadeIn, fadeInDuration, fadeAnim]
    // Callbacks and fallback are read from refs → never invalidate this
    // ------------------------------------------------------------------
    const loadIcon = useCallback(() => {
      if (!iconName) return;

      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Clear previous fallback timer
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }

      // 1. Check cache first (synchronous)
      const cached = CacheManager.get(iconName);
      if (cached) {
        dispatch({ type: 'CACHE_HIT', svg: cached });
        fadeAnim.setValue(1); // No fade for cache hits
        onLoadRef.current?.();
        return;
      }

      // 2. Set loading state
      dispatch({ type: 'FETCH_START' });

      // 3. Start fallback timer or show immediately
      if (fallbackDelay > 0) {
        fallbackTimerRef.current = setTimeout(() => {
          if (mountedRef.current) {
            dispatch({ type: 'SHOW_FALLBACK' });
          }
        }, fallbackDelay);
      } else if (fallbackRef.current || effectivePlaceholderRef.current !== undefined) {
        dispatch({ type: 'SHOW_FALLBACK' });
      }

      // 4. Fetch from network (async, fire-and-forget from useCallback's perspective)
      const controller = abortControllerRef.current;
      fetchIcon(iconName, controller.signal)
        .then((fetchedSvg) => {
          if (!mountedRef.current) return;

          CacheManager.set(iconName, fetchedSvg);
          dispatch({ type: 'FETCH_SUCCESS', svg: fetchedSvg });

          // Fade-in for non-cached icons
          if (fadeIn) {
            fadeAnim.setValue(0);
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: fadeInDuration,
              useNativeDriver: true,
            }).start();
          } else {
            fadeAnim.setValue(1);
          }

          onLoadRef.current?.();
        })
        .catch((error) => {
          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }
          if (!mountedRef.current) return;

          const typedError =
            error instanceof IconLoadError
              ? error
              : error instanceof Error
                ? error
                : new IconLoadError('NETWORK', String(error));

          dispatch({ type: 'FETCH_ERROR', error: typedError });
          onErrorRef.current?.(typedError);
        });
    }, [iconName, fallbackDelay, fadeIn, fadeInDuration, fadeAnim]);

    // Effect to load icon
    useEffect(() => {
      mountedRef.current = true;
      dispatch({ type: 'RESET' });
      loadIcon();

      return () => {
        mountedRef.current = false;
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current);
        }
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }, [loadIcon]);

    // Memoize transform style calculation
    const transformStyle = useMemo(() => {
      const transforms: Array<{ rotate: string } | { scaleX: number } | { scaleY: number }> = [];

      if (rotate !== 0) {
        transforms.push({ rotate: `${rotate}deg` });
      }

      if (flip === 'horizontal' || flip === 'both') {
        transforms.push({ scaleX: -1 });
      }

      if (flip === 'vertical' || flip === 'both') {
        transforms.push({ scaleY: -1 });
      }

      return transforms.length > 0 ? transforms : undefined;
    }, [rotate, flip]);

    // Determine rendering flags
    const shouldShowPlaceholder =
      (state.status === 'loading' && state.showFallback) || state.status === 'error';
    const useFadeIn = fadeIn && !state.wasCacheHit && state.status === 'loaded' && !hasAnimation;
    const isPressable = !!(onPress || onLongPress);

    // NativeWind className support
    const nativeWindProps = className ? { className } : {};

    // ------------------------------------------------------------------
    // Helper: wrap content with PressableWrapper if interactive
    // ------------------------------------------------------------------
    const wrapContent = (content: React.ReactNode) => {
      if (!isPressable) return content;
      return (
        <PressableWrapper
          onPress={onPress}
          onLongPress={onLongPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={disabled}
          pressedStyle={pressedStyle as ViewStyle}
          hitSlop={hitSlop}
        >
          {content}
        </PressableWrapper>
      );
    };

    // ------------------------------------------------------------------
    // Render: placeholder / fallback during loading or error
    // ------------------------------------------------------------------
    if (shouldShowPlaceholder) {
      if (effectivePlaceholder !== undefined) {
        return wrapContent(
          <View
            ref={ref}
            style={[{ width: iconWidth, height: iconHeight }, style]}
            accessibilityLabel={resolvedA11yLabel}
            accessibilityRole="image"
            testID={testID}
            {...nativeWindProps}
          >
            <PlaceholderFactory
              type={effectivePlaceholder}
              width={iconWidth}
              height={iconHeight}
              color={placeholderColor}
              duration={placeholderDuration}
            />
          </View>
        );
      }

      if (fallback) {
        return wrapContent(
          <View
            ref={ref}
            style={[{ width: iconWidth, height: iconHeight }, style]}
            accessibilityLabel={resolvedA11yLabel}
            accessibilityRole="image"
            testID={testID}
            {...nativeWindProps}
          >
            {fallback}
          </View>
        );
      }

      return wrapContent(
        <View
          ref={ref}
          style={[{ width: iconWidth, height: iconHeight }, style]}
          accessibilityLabel={resolvedA11yLabel}
          accessibilityRole="image"
          testID={testID}
          {...nativeWindProps}
        />
      );
    }

    // ------------------------------------------------------------------
    // Render: loaded SVG
    // Uses SvgXml's native `color` prop instead of regex replacement.
    // This preserves multi-color icons (color only replaces currentColor).
    // ------------------------------------------------------------------
    if (state.svg) {
      const svgElement = (
        <SvgXml xml={state.svg} width={iconWidth} height={iconHeight} color={color} />
      );

      // With animation
      if (hasAnimation) {
        return wrapContent(
          <Animated.View
            ref={ref as React.Ref<Animated.LegacyRef<View>>}
            style={[
              styles.container,
              {
                width: iconWidth,
                height: iconHeight,
                transform: transformStyle,
              },
              style,
              animatedStyle,
            ]}
            accessibilityLabel={resolvedA11yLabel}
            accessibilityRole="image"
            testID={testID}
            {...nativeWindProps}
          >
            {svgElement}
          </Animated.View>
        );
      }

      // With fade-in (non-cached network fetch)
      if (useFadeIn) {
        return wrapContent(
          <Animated.View
            ref={ref as React.Ref<Animated.LegacyRef<View>>}
            style={[
              styles.container,
              {
                width: iconWidth,
                height: iconHeight,
                transform: transformStyle,
                opacity: fadeAnim,
              },
              style,
            ]}
            accessibilityLabel={resolvedA11yLabel}
            accessibilityRole="image"
            testID={testID}
            {...nativeWindProps}
          >
            {svgElement}
          </Animated.View>
        );
      }

      // Static render (cache hit or fade disabled)
      return wrapContent(
        <View
          ref={ref}
          style={[
            styles.container,
            {
              width: iconWidth,
              height: iconHeight,
              transform: transformStyle,
            },
            style,
          ]}
          accessibilityLabel={resolvedA11yLabel}
          accessibilityRole="image"
          testID={testID}
          {...nativeWindProps}
        >
          {svgElement}
        </View>
      );
    }

    // ------------------------------------------------------------------
    // Render: initial loading (before fallback delay)
    // ------------------------------------------------------------------
    if (effectivePlaceholder !== undefined && state.status === 'loading') {
      return wrapContent(
        <View
          ref={ref}
          style={[{ width: iconWidth, height: iconHeight }, style]}
          accessibilityLabel={resolvedA11yLabel}
          accessibilityRole="image"
          testID={testID}
          {...nativeWindProps}
        >
          <PlaceholderFactory
            type={effectivePlaceholder}
            width={iconWidth}
            height={iconHeight}
            color={placeholderColor}
            duration={placeholderDuration}
          />
        </View>
      );
    }

    // Empty view while loading
    return wrapContent(
      <View
        ref={ref}
        style={[{ width: iconWidth, height: iconHeight }, style]}
        accessibilityLabel={resolvedA11yLabel}
        accessibilityRole="image"
        testID={testID}
        {...nativeWindProps}
      />
    );
  })
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
