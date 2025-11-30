/**
 * IconRenderer - Core component for rendering SVG icons
 * Handles cache lookup, network fetching, and SVG rendering
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { CacheManager } from './cache/CacheManager';
import { fetchIcon } from './network/IconifyAPI';
import { PlaceholderFactory } from './placeholder';
import { useIconAnimation } from './animated/useIconAnimation';
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
  // Animation props
  animate,
  animationDuration,
  animationLoop,
  animationEasing,
  animationDelay,
  autoPlay = true,
  onAnimationComplete,
}: IconRendererProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [state, setState] = useState<IconLoadingState>('idle');
  const [showFallback, setShowFallback] = useState(false);
  const mountedRef = useRef(true);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false); // Track loading state for closure

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
        isLoadingRef.current = false;
        onLoad?.();
      }
      return;
    }

    // 2. Set loading state and start fallback timer
    setState('loading');
    isLoadingRef.current = true;

    if (fallbackDelay > 0) {
      fallbackTimerRef.current = setTimeout(() => {
        // Use ref instead of state to avoid stale closure
        if (mountedRef.current && isLoadingRef.current) {
          setShowFallback(true);
        }
      }, fallbackDelay);
    } else if (fallback) {
      setShowFallback(true);
    }

    // 3. Fetch from network
    try {
      const fetchedSvg = await fetchIcon(iconName, abortControllerRef.current.signal);

      if (mountedRef.current) {
        // Store in cache
        CacheManager.set(iconName, fetchedSvg);

        setSvg(fetchedSvg);
        setState('loaded');
        isLoadingRef.current = false;
        setShowFallback(false);
        onLoad?.();
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      if (mountedRef.current) {
        setState('error');
        isLoadingRef.current = false;
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }, [iconName, fallback, fallbackDelay, onLoad, onError]); // Removed 'state' from deps

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

  // Render placeholder or fallback during loading/error
  if (shouldShowPlaceholder) {
    // Priority: placeholder > fallback
    if (placeholder !== undefined) {
      return (
        <View
          style={[{ width: iconWidth, height: iconHeight }, style]}
          accessibilityLabel={accessibilityLabel}
          testID={testID}
        >
          <PlaceholderFactory
            type={placeholder}
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
      return (
        <View
          style={[{ width: iconWidth, height: iconHeight }, style]}
          accessibilityLabel={accessibilityLabel}
          testID={testID}
        >
          {fallback}
        </View>
      );
    }

    // Return empty view if no placeholder/fallback
    return (
      <View
        style={[{ width: iconWidth, height: iconHeight }, style]}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      />
    );
  }

  // Render icon
  if (colorizedSvg) {
    // Render with animation wrapper if animation is enabled
    if (hasAnimation) {
      return (
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
        >
          <SvgXml xml={colorizedSvg} width={iconWidth} height={iconHeight} />
        </Animated.View>
      );
    }

    // Render without animation
    return (
      <View
        style={[
          styles.container,
          { width: iconWidth, height: iconHeight, transform: transformStyle },
          style,
        ]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="image"
        testID={testID}
      >
        <SvgXml xml={colorizedSvg} width={iconWidth} height={iconHeight} />
      </View>
    );
  }

  // Show placeholder immediately if set (no delay), otherwise empty view
  if (placeholder !== undefined && state === 'loading') {
    return (
      <View
        style={[{ width: iconWidth, height: iconHeight }, style]}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      >
        <PlaceholderFactory
          type={placeholder}
          width={iconWidth}
          height={iconHeight}
          color={placeholderColor}
          duration={placeholderDuration}
        />
      </View>
    );
  }

  // Return empty view while loading (before fallback delay)
  return (
    <View
      style={[{ width: iconWidth, height: iconHeight }, style]}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
