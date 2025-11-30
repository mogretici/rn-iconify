/**
 * Tests for Accessibility Module
 */

import React from 'react';
import { render, act } from '@testing-library/react-native';
import { View } from 'react-native';
import {
  AccessibilityProvider,
  useAccessibilityContext,
  useAccessibility,
  useAccessibleIcon,
  DEFAULT_ACCESSIBILITY_CONFIG,
  defaultLabelGenerator,
  adjustForHighContrast,
  meetsContrastRequirement,
  getHighContrastAlternative,
  calculateTouchTargetPadding,
} from '../accessibility';

describe('Accessibility Utils', () => {
  describe('defaultLabelGenerator', () => {
    it('converts icon name to readable label', () => {
      expect(defaultLabelGenerator('mdi:home')).toBe('home icon');
      expect(defaultLabelGenerator('heroicons:user')).toBe('user icon');
    });

    it('handles kebab-case names', () => {
      expect(defaultLabelGenerator('mdi:arrow-left')).toBe('arrow left icon');
      expect(defaultLabelGenerator('lucide:chevron-right')).toBe('chevron right icon');
    });

    it('handles camelCase names', () => {
      expect(defaultLabelGenerator('mdi:arrowLeft')).toBe('arrow left icon');
      expect(defaultLabelGenerator('fa:userCircle')).toBe('user circle icon');
    });

    it('handles names without prefix', () => {
      expect(defaultLabelGenerator('home')).toBe('home icon');
    });

    it('handles underscores', () => {
      expect(defaultLabelGenerator('mdi:arrow_left')).toBe('arrow left icon');
    });
  });

  describe('adjustForHighContrast', () => {
    it('converts light colors to black', () => {
      expect(adjustForHighContrast('#FFFFFF')).toBe('#000000');
      expect(adjustForHighContrast('#CCCCCC')).toBe('#000000');
    });

    it('converts dark colors to white', () => {
      expect(adjustForHighContrast('#000000')).toBe('#FFFFFF');
      expect(adjustForHighContrast('#333333')).toBe('#FFFFFF');
    });

    it('handles rgb colors', () => {
      expect(adjustForHighContrast('rgb(255, 255, 255)')).toBe('#000000');
      expect(adjustForHighContrast('rgb(0, 0, 0)')).toBe('#FFFFFF');
    });

    it('handles named colors', () => {
      expect(adjustForHighContrast('white')).toBe('#000000');
      expect(adjustForHighContrast('black')).toBe('#FFFFFF');
    });

    it('returns original for unparseable colors', () => {
      expect(adjustForHighContrast('invalid')).toBe('invalid');
    });
  });

  describe('meetsContrastRequirement', () => {
    it('returns true for black on white (AA)', () => {
      expect(meetsContrastRequirement('#000000', '#FFFFFF', 'AA')).toBe(true);
    });

    it('returns true for white on black (AA)', () => {
      expect(meetsContrastRequirement('#FFFFFF', '#000000', 'AA')).toBe(true);
    });

    it('returns false for low contrast combinations', () => {
      expect(meetsContrastRequirement('#CCCCCC', '#FFFFFF', 'AA')).toBe(false);
    });

    it('handles AAA level', () => {
      expect(meetsContrastRequirement('#000000', '#FFFFFF', 'AAA')).toBe(true);
    });

    it('returns true for unparseable colors', () => {
      expect(meetsContrastRequirement('invalid', '#FFFFFF', 'AA')).toBe(true);
    });
  });

  describe('getHighContrastAlternative', () => {
    it('returns black for light backgrounds', () => {
      expect(getHighContrastAlternative('#666666', '#FFFFFF')).toBe('#000000');
    });

    it('returns white for dark backgrounds', () => {
      expect(getHighContrastAlternative('#999999', '#000000')).toBe('#FFFFFF');
    });
  });

  describe('calculateTouchTargetPadding', () => {
    it('returns 0 when icon is large enough', () => {
      expect(calculateTouchTargetPadding(48, 44)).toBe(0);
      expect(calculateTouchTargetPadding(44, 44)).toBe(0);
    });

    it('calculates padding for small icons', () => {
      expect(calculateTouchTargetPadding(24, 44)).toBe(10);
      expect(calculateTouchTargetPadding(16, 44)).toBe(14);
    });
  });
});

describe('DEFAULT_ACCESSIBILITY_CONFIG', () => {
  it('has correct defaults', () => {
    expect(DEFAULT_ACCESSIBILITY_CONFIG.autoLabels).toBe(true);
    expect(DEFAULT_ACCESSIBILITY_CONFIG.highContrast).toBe(false);
    expect(DEFAULT_ACCESSIBILITY_CONFIG.respectReducedMotion).toBe(true);
    expect(DEFAULT_ACCESSIBILITY_CONFIG.defaultRole).toBe('image');
    expect(DEFAULT_ACCESSIBILITY_CONFIG.showFocusIndicators).toBe(true);
    expect(DEFAULT_ACCESSIBILITY_CONFIG.minTouchTargetSize).toBe(44);
  });

  it('has a label generator', () => {
    expect(typeof DEFAULT_ACCESSIBILITY_CONFIG.labelGenerator).toBe('function');
    expect(DEFAULT_ACCESSIBILITY_CONFIG.labelGenerator('mdi:home')).toBe('home icon');
  });
});

describe('AccessibilityProvider', () => {
  // Helper component to test hooks
  function TestConsumer({ testFn }: { testFn: (context: any) => void }) {
    const context = useAccessibilityContext();
    testFn(context);
    return <View testID="consumer" />;
  }

  it('provides default config', () => {
    let receivedConfig: any = null;

    render(
      <AccessibilityProvider>
        <TestConsumer testFn={(ctx) => (receivedConfig = ctx.config)} />
      </AccessibilityProvider>
    );

    expect(receivedConfig.autoLabels).toBe(true);
    expect(receivedConfig.defaultRole).toBe('image');
  });

  it('merges custom config with defaults', () => {
    let receivedConfig: any = null;

    render(
      <AccessibilityProvider config={{ autoLabels: false, minTouchTargetSize: 48 }}>
        <TestConsumer testFn={(ctx) => (receivedConfig = ctx.config)} />
      </AccessibilityProvider>
    );

    expect(receivedConfig.autoLabels).toBe(false);
    expect(receivedConfig.minTouchTargetSize).toBe(48);
    expect(receivedConfig.defaultRole).toBe('image'); // Default unchanged
  });

  it('provides getLabel function', () => {
    let getLabel: any = null;

    render(
      <AccessibilityProvider>
        <TestConsumer testFn={(ctx) => (getLabel = ctx.getLabel)} />
      </AccessibilityProvider>
    );

    expect(getLabel('mdi:home')).toBe('home icon');
    expect(getLabel('mdi:home', 'Custom Label')).toBe('Custom Label');
  });

  it('getLabel returns undefined when autoLabels disabled', () => {
    let getLabel: any = null;

    render(
      <AccessibilityProvider config={{ autoLabels: false }}>
        <TestConsumer testFn={(ctx) => (getLabel = ctx.getLabel)} />
      </AccessibilityProvider>
    );

    expect(getLabel('mdi:home')).toBeUndefined();
  });

  it('provides getContrastColor function', () => {
    let getContrastColor: any = null;

    render(
      <AccessibilityProvider config={{ highContrast: true }}>
        <TestConsumer testFn={(ctx) => (getContrastColor = ctx.getContrastColor)} />
      </AccessibilityProvider>
    );

    expect(getContrastColor('#CCCCCC')).toBe('#000000');
  });

  it('getContrastColor returns original when highContrast disabled', () => {
    let getContrastColor: any = null;

    render(
      <AccessibilityProvider config={{ highContrast: false }}>
        <TestConsumer testFn={(ctx) => (getContrastColor = ctx.getContrastColor)} />
      </AccessibilityProvider>
    );

    expect(getContrastColor('#CCCCCC')).toBe('#CCCCCC');
  });

  it('provides shouldDisableAnimations function', () => {
    let shouldDisableAnimations: any = null;

    render(
      <AccessibilityProvider>
        <TestConsumer testFn={(ctx) => (shouldDisableAnimations = ctx.shouldDisableAnimations)} />
      </AccessibilityProvider>
    );

    expect(typeof shouldDisableAnimations).toBe('function');
    expect(shouldDisableAnimations()).toBe(false);
  });

  it('provides setConfig function', () => {
    let setConfig: any = null;
    let config: any = null;

    const TestSetConfig = () => {
      const ctx = useAccessibilityContext();
      setConfig = ctx.setConfig;
      config = ctx.config;
      return <View testID="test" />;
    };

    render(
      <AccessibilityProvider>
        <TestSetConfig />
      </AccessibilityProvider>
    );

    expect(config.autoLabels).toBe(true);

    act(() => {
      setConfig({ autoLabels: false });
    });
  });
});

describe('useAccessibility', () => {
  it('returns null outside provider', () => {
    let result: any = 'not-null';

    function TestComponent() {
      result = useAccessibility();
      return null;
    }

    render(<TestComponent />);
    expect(result).toBeNull();
  });

  it('returns context inside provider', () => {
    let result: any = null;

    function TestComponent() {
      result = useAccessibility();
      return null;
    }

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(result).not.toBeNull();
    expect(result).toHaveProperty('config');
  });
});

describe('useAccessibilityContext', () => {
  it('throws outside provider', () => {
    function TestComponent() {
      useAccessibilityContext();
      return null;
    }

    expect(() => render(<TestComponent />)).toThrow(
      'useAccessibilityContext must be used within an AccessibilityProvider'
    );
  });
});

describe('useAccessibleIcon', () => {
  it('returns default props without provider', () => {
    let result: any = null;

    function TestComponent() {
      result = useAccessibleIcon({
        iconName: 'mdi:home',
        size: 24,
        color: '#000000',
      });
      return null;
    }

    render(<TestComponent />);

    expect(result.accessibilityProps.accessible).toBe(true);
    expect(result.accessibilityProps.accessibilityRole).toBe('image');
    expect(result.adjustedColor).toBe('#000000');
    expect(result.touchTargetPadding).toBe(0);
    expect(result.shouldDisableAnimations).toBe(false);
  });

  it('generates accessibility label with provider', () => {
    let result: any = null;

    function TestComponent() {
      result = useAccessibleIcon({
        iconName: 'mdi:home',
      });
      return null;
    }

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(result.accessibilityProps.accessibilityLabel).toBe('home icon');
  });

  it('uses custom label when provided', () => {
    let result: any = null;

    function TestComponent() {
      result = useAccessibleIcon({
        iconName: 'mdi:home',
        accessibilityLabel: 'Go home',
      });
      return null;
    }

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(result.accessibilityProps.accessibilityLabel).toBe('Go home');
  });

  it('calculates touch target padding for interactive icons', () => {
    let result: any = null;

    function TestComponent() {
      result = useAccessibleIcon({
        iconName: 'mdi:home',
        size: 24,
        isInteractive: true,
      });
      return null;
    }

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(result.touchTargetPadding).toBe(10);
  });

  it('adjusts color for high contrast', () => {
    let result: any = null;

    function TestComponent() {
      result = useAccessibleIcon({
        iconName: 'mdi:home',
        color: '#CCCCCC',
        highContrast: true,
      });
      return null;
    }

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(result.adjustedColor).toBe('#000000');
  });

  it('hides from accessibility when accessibilityElementsHidden', () => {
    let result: any = null;

    function TestComponent() {
      result = useAccessibleIcon({
        iconName: 'mdi:decorative',
        accessibilityElementsHidden: true,
      });
      return null;
    }

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(result.accessibilityProps.accessible).toBe(false);
    expect(result.accessibilityProps.accessibilityLabel).toBeUndefined();
  });
});
