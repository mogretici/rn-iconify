/**
 * IconRenderer - Core component for rendering SVG icons
 * Handles cache lookup, network fetching, and SVG rendering
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Pressable } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { CacheManager } from './cache/CacheManager';
import { fetchIcon } from './network/IconifyAPI';
import { PlaceholderFactory } from './placeholder';
import { useIconAnimation } from './animated/useIconAnimation';
import { ConfigManager } from './config';
import type { IconRendererProps, IconLoadingState } from './types';

/**
 * Escape special characters for XML attribute values
 * Prevents XSS attacks when user input is used as color prop
 */
function escapeXmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function IconRenderer({
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
}: IconRendererProps) {
  // Resolve defaults from config
  const defaultsConfig = ConfigManager.getDefaultsConfig();
  const effectivePlaceholder = placeholder !== undefined
    ? placeholder
    : (defaultsConfig.placeholder !== false ? defaultsConfig.placeholder : undefined);
  const fadeIn = defaultsConfig.fadeIn;
  const fadeInDuration = defaultsConfig.fadeInDuration;

  const [svg, setSvg] = useState<string | null>(null);
  const [state, setState] = useState<IconLoadingState>('idle');
  const [showFallback, setShowFallback] = useState(false);
  const [wasCacheHit, setWasCacheHit] = useState(false);
  const mountedRef = useRef(true);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);

  // Fade-in animation value
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Calculate dimensions
  const iconWidth = propWidth ?? size;
  const iconHeight = propHeight ?? size;

  // Animation hook
  const { animatedStyle, hasAnimation } = useIconAnimation({
    animation: animate,
    duration: animationDuration,
    loop: animationLoop,
    easing: animationEasing,
    delay: animationDelay,
    autoPlay,
    onComplete: onAnimationComplete,
  });

  // Load icon
  const loadIcon = useCallback(async () => {
    if (!iconName) return;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // 1. Check cache first (synchronous)
    const cached = CacheManager.get(iconName);
    if (cached) {
      if (mountedRef.current) {
        setSvg(cached);
        setState('loaded');
        setWasCacheHit(true);
        isLoadingRef.current = false;
        fadeAnim.setValue(1); // No fade for cache hits
        onLoad?.();
      }
      return;
    }

    // 2. Set loading state and start fallback timer
    setState('loading');
    isLoadingRef.current = true;
    setWasCacheHit(false);

    if (fallbackDelay > 0) {
      fallbackTimerRef.current = setTimeout(() => {
        if (mountedRef.current && isLoadingRef.current) {
          setShowFallback(true);
        }
      }, fallbackDelay);
    } else if (fallback || effectivePlaceholder !== undefined) {
      setShowFallback(true);
    }

    // 3. Fetch from network
    try {
      const fetchedSvg = await fetchIcon(iconName, abortControllerRef.current.signal);

      if (mountedRef.current) {
        CacheManager.set(iconName, fetchedSvg);

        setSvg(fetchedSvg);
        setState('loaded');
        isLoadingRef.current = false;
        setShowFallback(false);

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

        onLoad?.();
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      if (mountedRef.current) {
        setState('error');
        isLoadingRef.current = false;
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }, [iconName, fallback, fallbackDelay, onLoad, onError, effectivePlaceholder, fadeIn, fadeInDuration, fadeAnim]);

  // Effect to load icon
  useEffect(() => {
    mountedRef.current = true;
    loadIcon();

    return () => {
      mountedRef.current = false;
      isLoadingRef.current = false;
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
      // Abort any in-flight requests on unmount
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

  // Memoize colorized SVG to avoid recalculating on every render
  const colorizedSvg = useMemo(() => {
    if (!svg) return null;
    const safeColor = escapeXmlAttribute(color);
    return svg.replace(/currentColor/g, safeColor).replace(/<svg/, `<svg fill="${safeColor}"`);
  }, [svg, color]);

  // Determine if we should show placeholder/fallback
  const shouldShowPlaceholder = (state === 'loading' && showFallback) || state === 'error';

  // Whether to use fade-in wrapper (only for non-cached, non-animated icons)
  const useFadeIn = fadeIn && !wasCacheHit && state === 'loaded' && !hasAnimation;

  // Check if icon should be pressable
  const isPressable = !!(onPress || onLongPress);

  // NativeWind className support - conditional spread to avoid TS errors
  const nativeWindProps = className ? { className } : {};

  /**
   * Wraps content with Pressable if onPress/onLongPress is provided
   */
  const wrapWithPressable = (content: React.ReactNode) => {
    if (!isPressable) return content;

    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        style={({ pressed }) => [pressed && pressedStyle]}
      >
        {content}
      </Pressable>
    );
  };

  // Render placeholder or fallback during loading/error
  if (shouldShowPlaceholder) {
    // Priority: effectivePlaceholder (includes config default) > fallback
    if (effectivePlaceholder !== undefined) {
      return wrapWithPressable(
        <View
          style={[{ width: iconWidth, height: iconHeight }, style]}
          accessibilityLabel={accessibilityLabel}
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

    // Fallback for backwards compatibility (deprecated)
    if (fallback) {
      return wrapWithPressable(
        <View
          style={[{ width: iconWidth, height: iconHeight }, style]}
          accessibilityLabel={accessibilityLabel}
          testID={testID}
          {...nativeWindProps}
        >
          {fallback}
        </View>
      );
    }

    // Return empty view if no placeholder/fallback
    return wrapWithPressable(
      <View
        style={[{ width: iconWidth, height: iconHeight }, style]}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        {...nativeWindProps}
      />
    );
  }

  // Render icon
  if (colorizedSvg) {
    // Render with animation wrapper if animation is enabled
    if (hasAnimation) {
      return wrapWithPressable(
        <Animated.View
          style={[
            styles.container,
            { width: iconWidth, height: iconHeight, transform: transformStyle },
            style,
            animatedStyle,
          ]}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="image"
          testID={testID}
          {...nativeWindProps}
        >
          <SvgXml xml={colorizedSvg} width={iconWidth} height={iconHeight} />
        </Animated.View>
      );
    }

    // Render without animation (with optional fade-in)
    if (useFadeIn) {
      return wrapWithPressable(
        <Animated.View
          style={[
            styles.container,
            { width: iconWidth, height: iconHeight, transform: transformStyle, opacity: fadeAnim },
            style,
          ]}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="image"
          testID={testID}
          {...nativeWindProps}
        >
          <SvgXml xml={colorizedSvg} width={iconWidth} height={iconHeight} />
        </Animated.View>
      );
    }

    return wrapWithPressable(
      <View
        style={[
          styles.container,
          { width: iconWidth, height: iconHeight, transform: transformStyle },
          style,
        ]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="image"
        testID={testID}
        {...nativeWindProps}
      >
        <SvgXml xml={colorizedSvg} width={iconWidth} height={iconHeight} />
      </View>
    );
  }

  // Show placeholder immediately if set (no delay), otherwise empty view
  if (effectivePlaceholder !== undefined && state === 'loading') {
    return wrapWithPressable(
      <View
        style={[{ width: iconWidth, height: iconHeight }, style]}
        accessibilityLabel={accessibilityLabel}
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

  // Return empty view while loading (before fallback delay)
  return wrapWithPressable(
    <View
      style={[{ width: iconWidth, height: iconHeight }, style]}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      {...nativeWindProps}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
