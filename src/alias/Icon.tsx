/**
 * Generic Icon Component
 * Renders any icon by full name (prefix:name) or alias
 */

import React from 'react';
import { IconRenderer } from '../IconRenderer';
import { useIconTheme } from '../theme';
import { DEFAULT_ICON_THEME } from '../theme/types';
import { useIconAliasContext } from './IconAliasContext';
import type { GenericIconProps } from './types';

/**
 * Generic Icon component that accepts any icon name or alias
 *
 * @example With full icon name
 * ```tsx
 * import { Icon } from 'rn-iconify';
 *
 * <Icon name="mdi:home" size={24} color="blue" />
 * <Icon name="heroicons:user" size={24} />
 * ```
 *
 * @example With aliases (requires IconAliasProvider)
 * ```tsx
 * import { Icon, IconAliasProvider } from 'rn-iconify';
 *
 * const aliases = {
 *   back: 'mdi:arrow-left',
 *   menu: 'heroicons:bars-3',
 * };
 *
 * <IconAliasProvider aliases={aliases}>
 *   <Icon name="back" size={24} />
 *   <Icon name="menu" size={24} />
 * </IconAliasProvider>
 * ```
 */
export function Icon({
  name,
  size,
  color,
  width,
  height,
  style,
  className,
  rotate,
  flip,
  fallback,
  fallbackDelay,
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
  autoPlay,
  onAnimationComplete,
}: GenericIconProps) {
  // Get theme defaults
  const { theme } = useIconTheme();

  // Get alias context
  const { resolveIcon } = useIconAliasContext();

  // Resolve the icon name (alias → full name)
  const resolvedName = resolveIcon(name);

  // Merge props with theme defaults (props take precedence)
  const mergedSize = size ?? theme.size ?? DEFAULT_ICON_THEME.size;
  const mergedColor = color ?? theme.color ?? DEFAULT_ICON_THEME.color;
  const mergedRotate = rotate ?? theme.rotate ?? DEFAULT_ICON_THEME.rotate;
  const mergedFlip = flip ?? theme.flip;
  const mergedFallbackDelay =
    fallbackDelay ?? theme.fallbackDelay ?? DEFAULT_ICON_THEME.fallbackDelay;
  const mergedPlaceholder = placeholder ?? theme.placeholder;
  const mergedPlaceholderColor =
    placeholderColor ?? theme.placeholderColor ?? DEFAULT_ICON_THEME.placeholderColor;
  const mergedPlaceholderDuration =
    placeholderDuration ?? theme.placeholderDuration ?? DEFAULT_ICON_THEME.placeholderDuration;

  // Validate icon name format in development
  if (__DEV__ && !resolvedName.includes(':')) {
    console.warn(
      `[rn-iconify] Icon name "${name}" is not a valid icon name or registered alias. ` +
        `Expected format: "prefix:name" (e.g., "mdi:home") or a registered alias.`
    );
  }

  return (
    <IconRenderer
      iconName={resolvedName}
      size={mergedSize}
      color={mergedColor}
      width={width}
      height={height}
      style={style}
      className={className}
      rotate={mergedRotate}
      flip={mergedFlip}
      fallback={fallback}
      fallbackDelay={mergedFallbackDelay}
      placeholder={mergedPlaceholder}
      placeholderColor={mergedPlaceholderColor}
      placeholderDuration={mergedPlaceholderDuration}
      onLoad={onLoad}
      onError={onError}
      accessibilityLabel={accessibilityLabel ?? name}
      testID={testID}
      // Press props
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      pressedStyle={pressedStyle}
      // Animation props
      animate={animate}
      animationDuration={animationDuration}
      animationLoop={animationLoop}
      animationEasing={animationEasing}
      animationDelay={animationDelay}
      autoPlay={autoPlay}
      onAnimationComplete={onAnimationComplete}
    />
  );
}

Icon.displayName = 'Icon';

export default Icon;
