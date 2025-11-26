/**
 * createIconSet Unit Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// Mock IconRenderer before importing createIconSet
const mockIconRenderer = jest.fn();

jest.mock('../IconRenderer', () => ({
  IconRenderer: (props: Record<string, unknown>) => {
    mockIconRenderer(props);
    const RN = require('react-native');
    return (
      <RN.View
        testID="icon-renderer"
        data-icon-name={props.iconName}
        data-size={props.size}
        data-color={props.color}
        {...props}
      />
    );
  },
}));

// Import after mock
import { createIconSet } from '../createIconSet';

describe('createIconSet', () => {
  const testIcons = {
    home: true,
    settings: true,
    user: true,
  } as const;

  type TestIconName = keyof typeof testIcons;
  const TestIcon = createIconSet<TestIconName>('test', testIcons);

  beforeEach(() => {
    mockIconRenderer.mockClear();
  });

  it('should create a component with correct display name', () => {
    expect(TestIcon.displayName).toBe('TestIcon');
  });

  it('should call IconRenderer with correct iconName', () => {
    render(<TestIcon name="home" size={32} color="blue" />);

    expect(mockIconRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        iconName: 'test:home',
        size: 32,
        color: 'blue',
      })
    );
  });

  it('should use default size and color', () => {
    render(<TestIcon name="home" />);

    expect(mockIconRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        iconName: 'test:home',
        size: 24,
        color: '#000000',
      })
    );
  });

  it('should pass through all props to IconRenderer', () => {
    const onLoad = jest.fn();
    const onError = jest.fn();

    render(
      <TestIcon
        name="settings"
        size={48}
        color="red"
        rotate={90}
        flip="horizontal"
        accessibilityLabel="Settings icon"
        testID="custom-test-id"
        onLoad={onLoad}
        onError={onError}
      />
    );

    expect(mockIconRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        iconName: 'test:settings',
        size: 48,
        color: 'red',
        rotate: 90,
        flip: 'horizontal',
        accessibilityLabel: 'Settings icon',
        testID: 'custom-test-id',
        onLoad,
        onError,
      })
    );
  });

  describe('TypeScript type safety', () => {
    it('should accept valid icon names', () => {
      // These should compile without errors
      render(<TestIcon name="home" />);
      render(<TestIcon name="settings" />);
      render(<TestIcon name="user" />);
    });

    // Note: Invalid names would cause TypeScript compilation errors
    // which cannot be tested at runtime
  });
});

describe('createIconSet with different prefixes', () => {
  beforeEach(() => {
    mockIconRenderer.mockClear();
  });

  it('should handle prefix with dashes', () => {
    const icons = { home: true } as const;
    const MdiLight = createIconSet<keyof typeof icons>('mdi-light', icons);

    expect(MdiLight.displayName).toBe('MdiLightIcon');

    render(<MdiLight name="home" />);
    expect(mockIconRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        iconName: 'mdi-light:home',
      })
    );
  });

  it('should handle prefix with underscores', () => {
    const icons = { home: true } as const;
    const CustomSet = createIconSet<keyof typeof icons>('custom_set', icons);

    expect(CustomSet.displayName).toBe('CustomSetIcon');
  });
});
