/**
 * IconRenderer - Core component for rendering SVG icons
 * Handles cache lookup, network fetching, and SVG rendering
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { CacheManager } from './cache/CacheManager';
import { fetchIcon } from './network/IconifyAPI';
import type { IconRendererProps, IconLoadingState } from './types';

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
  onLoad,
  onError,
  accessibilityLabel,
  testID,
}: IconRendererProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [state, setState] = useState<IconLoadingState>('idle');
  const [showFallback, setShowFallback] = useState(false);
  const mountedRef = useRef(true);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate dimensions
  const iconWidth = propWidth ?? size;
  const iconHeight = propHeight ?? size;

  // Load icon
  const loadIcon = useCallback(async () => {
    if (!iconName) return;

    // 1. Check cache first (synchronous)
    const cached = CacheManager.get(iconName);
    if (cached) {
      if (mountedRef.current) {
        setSvg(cached);
        setState('loaded');
        onLoad?.();
      }
      return;
    }

    // 2. Set loading state and start fallback timer
    setState('loading');
    if (fallbackDelay > 0) {
      fallbackTimerRef.current = setTimeout(() => {
        if (mountedRef.current && state === 'loading') {
          setShowFallback(true);
        }
      }, fallbackDelay);
    } else if (fallback) {
      setShowFallback(true);
    }

    // 3. Fetch from network
    try {
      const fetchedSvg = await fetchIcon(iconName);

      if (mountedRef.current) {
        // Store in cache
        CacheManager.set(iconName, fetchedSvg);

        setSvg(fetchedSvg);
        setState('loaded');
        setShowFallback(false);
        onLoad?.();
      }
    } catch (error) {
      if (mountedRef.current) {
        setState('error');
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }, [iconName, fallback, fallbackDelay, onLoad, onError, state]);

  // Effect to load icon
  useEffect(() => {
    mountedRef.current = true;
    loadIcon();

    return () => {
      mountedRef.current = false;
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, [loadIcon]);

  // Calculate transform for rotation and flip
  const getTransformStyle = ():
    | Array<{ rotate: string } | { scaleX: number } | { scaleY: number }>
    | undefined => {
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
  };

  // Apply color to SVG
  const colorizedSvg = svg
    ? svg.replace(/currentColor/g, color).replace(/<svg/, `<svg fill="${color}"`)
    : null;

  // Render fallback
  if ((state === 'loading' && showFallback) || state === 'error') {
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
    // Return empty view if no fallback
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
    return (
      <View
        style={[
          styles.container,
          { width: iconWidth, height: iconHeight, transform: getTransformStyle() },
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
