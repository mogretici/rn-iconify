/**
 * Accessibility utility functions for rn-iconify
 */

/**
 * Default label generator - converts icon names to readable labels
 * Examples:
 *   - "mdi:home" -> "home icon"
 *   - "heroicons:user-circle" -> "user circle icon"
 *   - "lucide:arrow-left" -> "arrow left icon"
 */
export function defaultLabelGenerator(iconName: string): string {
  // Extract icon name from prefix:name format
  const parts = iconName.split(':');
  const name = parts.length > 1 ? parts[1] : parts[0];

  // Convert kebab-case and camelCase to readable text
  const readable = name
    // Insert space before capital letters (camelCase)
    .replace(/([A-Z])/g, ' $1')
    // Replace hyphens and underscores with spaces
    .replace(/[-_]/g, ' ')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    // Trim and lowercase
    .trim()
    .toLowerCase();

  return `${readable} icon`;
}

/**
 * Adjust color for high contrast mode
 * Increases contrast by pushing colors toward black or white
 */
export function adjustForHighContrast(color: string): string {
  // Parse color
  const rgb = parseColor(color);
  if (!rgb) return color;

  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  // Push toward black or white based on luminance
  if (luminance > 0.5) {
    // Light color - make it darker (black)
    return '#000000';
  } else {
    // Dark color - make it lighter (white)
    return '#FFFFFF';
  }
}

/**
 * Parse color string to RGB values
 */
function parseColor(color: string): { r: number; g: number; b: number } | null {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
  }

  // Handle rgb/rgba colors
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // Handle named colors (common ones)
  const namedColors: Record<string, { r: number; g: number; b: number }> = {
    black: { r: 0, g: 0, b: 0 },
    white: { r: 255, g: 255, b: 255 },
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 128, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    yellow: { r: 255, g: 255, b: 0 },
    cyan: { r: 0, g: 255, b: 255 },
    magenta: { r: 255, g: 0, b: 255 },
    gray: { r: 128, g: 128, b: 128 },
    grey: { r: 128, g: 128, b: 128 },
    orange: { r: 255, g: 165, b: 0 },
    purple: { r: 128, g: 0, b: 128 },
    pink: { r: 255, g: 192, b: 203 },
    brown: { r: 165, g: 42, b: 42 },
  };

  const lowerColor = color.toLowerCase();
  if (namedColors[lowerColor]) {
    return namedColors[lowerColor];
  }

  return null;
}

/**
 * Check if a color meets WCAG contrast requirements against a background
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const fgRgb = parseColor(foreground);
  const bgRgb = parseColor(background);

  if (!fgRgb || !bgRgb) return true; // Assume it meets if we can't parse

  const fgLuminance = getRelativeLuminance(fgRgb);
  const bgLuminance = getRelativeLuminance(bgRgb);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  const contrastRatio = (lighter + 0.05) / (darker + 0.05);

  // WCAG requirements for normal text
  const requiredRatio = level === 'AAA' ? 7 : 4.5;

  return contrastRatio >= requiredRatio;
}

/**
 * Calculate relative luminance for WCAG calculations
 */
function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Generate a high contrast alternative for a color
 */
export function getHighContrastAlternative(color: string, background: string = '#FFFFFF'): string {
  const fgRgb = parseColor(color);
  const bgRgb = parseColor(background);

  if (!fgRgb || !bgRgb) return color;

  const bgLuminance = getRelativeLuminance(bgRgb);

  // If background is light, use black; if dark, use white
  if (bgLuminance > 0.5) {
    return '#000000';
  } else {
    return '#FFFFFF';
  }
}

/**
 * Calculate minimum touch target padding needed
 */
export function calculateTouchTargetPadding(iconSize: number, minTargetSize: number): number {
  if (iconSize >= minTargetSize) return 0;
  return (minTargetSize - iconSize) / 2;
}
