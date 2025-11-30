/**
 * Tests for React Navigation integration helpers
 */

import React, { ReactElement } from 'react';
import { render, renderHook } from '@testing-library/react-native';

// Navigation helpers
import {
  createTabBarIcon,
  createTabBarIcons,
  tabIcon,
  createDrawerIcon,
  createDrawerIcons,
  createHeaderIcon,
  createBackIcon,
  createCloseIcon,
  createMenuIcon,
  useNavigationIcon,
} from '../navigation';

// Helper to cast ReactNode to ReactElement for testing
const asElement = (node: React.ReactNode): ReactElement => node as ReactElement;

// Mock the Icon component
jest.mock('../alias', () => ({
  Icon: ({ name, size, color, style, accessibilityLabel }: any) => {
    const { View, Text } = require('react-native');
    return (
      <View testID="mock-icon" accessibilityLabel={accessibilityLabel} style={style}>
        <Text testID="icon-name">{name}</Text>
        <Text testID="icon-size">{size}</Text>
        <Text testID="icon-color">{color}</Text>
      </View>
    );
  },
}));

describe('Navigation Helpers', () => {
  describe('createTabBarIcon', () => {
    it('should create tab bar icon with string config', () => {
      const tabBarIcon = createTabBarIcon('mdi:home');

      // Render focused state
      const { getByTestId, rerender } = render(
        asElement(tabBarIcon({ focused: true, color: '#007AFF', size: 24 }))
      );

      expect(getByTestId('icon-name').props.children).toBe('mdi:home');
      expect(getByTestId('icon-size').props.children).toBe(24);
      expect(getByTestId('icon-color').props.children).toBe('#007AFF');

      // Render unfocused state (same icon)
      rerender(asElement(tabBarIcon({ focused: false, color: '#8E8E93', size: 24 })));
      expect(getByTestId('icon-name').props.children).toBe('mdi:home');
      expect(getByTestId('icon-color').props.children).toBe('#8E8E93');
    });

    it('should create tab bar icon with array config [focused, unfocused]', () => {
      const tabBarIcon = createTabBarIcon(['mdi:home', 'mdi:home-outline']);

      // Focused state
      const { getByTestId, rerender } = render(
        asElement(tabBarIcon({ focused: true, color: '#007AFF', size: 24 }))
      );
      expect(getByTestId('icon-name').props.children).toBe('mdi:home');

      // Unfocused state
      rerender(asElement(tabBarIcon({ focused: false, color: '#8E8E93', size: 24 })));
      expect(getByTestId('icon-name').props.children).toBe('mdi:home-outline');
    });

    it('should create tab bar icon with full config object', () => {
      const tabBarIcon = createTabBarIcon({
        focused: 'mdi:heart',
        unfocused: 'mdi:heart-outline',
        size: 28,
        focusedColor: '#FF0000',
        unfocusedColor: '#999999',
      });

      // Focused state with custom color
      const { getByTestId, rerender } = render(
        asElement(tabBarIcon({ focused: true, color: '#007AFF', size: 24 }))
      );
      expect(getByTestId('icon-name').props.children).toBe('mdi:heart');
      expect(getByTestId('icon-size').props.children).toBe(28); // Custom size
      expect(getByTestId('icon-color').props.children).toBe('#FF0000'); // focusedColor

      // Unfocused state with custom color
      rerender(asElement(tabBarIcon({ focused: false, color: '#007AFF', size: 24 })));
      expect(getByTestId('icon-name').props.children).toBe('mdi:heart-outline');
      expect(getByTestId('icon-color').props.children).toBe('#999999'); // unfocusedColor
    });

    it('should use focused icon when unfocused is not provided', () => {
      const tabBarIcon = createTabBarIcon({
        focused: 'mdi:settings',
      });

      const { getByTestId, rerender } = render(
        asElement(tabBarIcon({ focused: true, color: '#007AFF', size: 24 }))
      );
      expect(getByTestId('icon-name').props.children).toBe('mdi:settings');

      rerender(asElement(tabBarIcon({ focused: false, color: '#8E8E93', size: 24 })));
      expect(getByTestId('icon-name').props.children).toBe('mdi:settings');
    });

    it('should use navigation color when custom colors not provided', () => {
      const tabBarIcon = createTabBarIcon({
        focused: 'mdi:star',
        unfocused: 'mdi:star-outline',
      });

      const { getByTestId, rerender } = render(
        asElement(tabBarIcon({ focused: true, color: '#007AFF', size: 24 }))
      );
      expect(getByTestId('icon-color').props.children).toBe('#007AFF');

      rerender(asElement(tabBarIcon({ focused: false, color: '#8E8E93', size: 24 })));
      expect(getByTestId('icon-color').props.children).toBe('#8E8E93');
    });
  });

  describe('createTabBarIcons', () => {
    it('should create multiple tab bar icons at once', () => {
      const icons = createTabBarIcons({
        Home: ['mdi:home', 'mdi:home-outline'],
        Search: 'mdi:magnify',
        Profile: {
          focused: 'mdi:account',
          unfocused: 'mdi:account-outline',
          size: 26,
        },
      });

      expect(typeof icons.Home).toBe('function');
      expect(typeof icons.Search).toBe('function');
      expect(typeof icons.Profile).toBe('function');

      // Test Home icon
      const { getByTestId } = render(
        asElement(icons.Home({ focused: true, color: '#007AFF', size: 24 }))
      );
      expect(getByTestId('icon-name').props.children).toBe('mdi:home');
    });
  });

  describe('tabIcon', () => {
    it('should create auto-outline tab icon', () => {
      const icon = tabIcon('mdi', 'home');

      const { getByTestId, rerender } = render(
        asElement(icon({ focused: true, color: '#007AFF', size: 24 }))
      );
      expect(getByTestId('icon-name').props.children).toBe('mdi:home');

      rerender(asElement(icon({ focused: false, color: '#8E8E93', size: 24 })));
      expect(getByTestId('icon-name').props.children).toBe('mdi:home-outline');
    });

    it('should support custom outline suffix', () => {
      const icon = tabIcon('ph', 'house', '-light');

      const { getByTestId, rerender } = render(
        asElement(icon({ focused: true, color: '#007AFF', size: 24 }))
      );
      expect(getByTestId('icon-name').props.children).toBe('ph:house');

      rerender(asElement(icon({ focused: false, color: '#8E8E93', size: 24 })));
      expect(getByTestId('icon-name').props.children).toBe('ph:house-light');
    });
  });

  describe('createDrawerIcon', () => {
    it('should create drawer icon with string config', () => {
      const drawerIcon = createDrawerIcon('mdi:home');

      const { getByTestId } = render(
        asElement(drawerIcon({ focused: true, color: '#007AFF', size: 24 }))
      );
      expect(getByTestId('icon-name').props.children).toBe('mdi:home');
    });

    it('should create drawer icon with object config', () => {
      const drawerIcon = createDrawerIcon({
        icon: 'mdi:home-outline',
        focusedIcon: 'mdi:home',
        size: 28,
      });

      const { getByTestId, rerender } = render(
        asElement(drawerIcon({ focused: true, color: '#007AFF', size: 24 }))
      );
      expect(getByTestId('icon-name').props.children).toBe('mdi:home');
      expect(getByTestId('icon-size').props.children).toBe(28);

      rerender(asElement(drawerIcon({ focused: false, color: '#8E8E93', size: 24 })));
      expect(getByTestId('icon-name').props.children).toBe('mdi:home-outline');
    });

    it('should use default icon when not focused and focusedIcon not provided', () => {
      const drawerIcon = createDrawerIcon({
        icon: 'mdi:settings',
      });

      const { getByTestId, rerender } = render(
        asElement(drawerIcon({ focused: true, color: '#007AFF', size: 24 }))
      );
      expect(getByTestId('icon-name').props.children).toBe('mdi:settings');

      rerender(asElement(drawerIcon({ focused: false, color: '#8E8E93', size: 24 })));
      expect(getByTestId('icon-name').props.children).toBe('mdi:settings');
    });
  });

  describe('createDrawerIcons', () => {
    it('should create multiple drawer icons at once', () => {
      const icons = createDrawerIcons({
        Home: 'mdi:home',
        Profile: 'mdi:account',
        Settings: {
          icon: 'mdi:cog-outline',
          focusedIcon: 'mdi:cog',
        },
      });

      expect(typeof icons.Home).toBe('function');
      expect(typeof icons.Profile).toBe('function');
      expect(typeof icons.Settings).toBe('function');

      // Test Settings icon focused state
      const { getByTestId } = render(
        asElement(icons.Settings({ focused: true, color: '#007AFF', size: 24 }))
      );
      expect(getByTestId('icon-name').props.children).toBe('mdi:cog');
    });
  });

  describe('createHeaderIcon', () => {
    it('should create header icon with basic config', () => {
      const HeaderIcon = createHeaderIcon({
        icon: 'mdi:dots-vertical',
      });

      const { getByTestId } = render(<HeaderIcon tintColor="#007AFF" />);
      expect(getByTestId('icon-name').props.children).toBe('mdi:dots-vertical');
      expect(getByTestId('icon-size').props.children).toBe(24); // default
      expect(getByTestId('icon-color').props.children).toBe('#007AFF');
    });

    it('should use custom color over tintColor', () => {
      const HeaderIcon = createHeaderIcon({
        icon: 'mdi:bell',
        color: '#FF0000',
      });

      const { getByTestId } = render(<HeaderIcon tintColor="#007AFF" />);
      expect(getByTestId('icon-color').props.children).toBe('#FF0000');
    });

    it('should use custom size', () => {
      const HeaderIcon = createHeaderIcon({
        icon: 'mdi:menu',
        size: 32,
      });

      const { getByTestId } = render(<HeaderIcon />);
      expect(getByTestId('icon-size').props.children).toBe(32);
    });

    it('should render touchable when onPress provided', () => {
      const onPress = jest.fn();
      const HeaderIcon = createHeaderIcon({
        icon: 'mdi:close',
        onPress,
      });

      const { getByRole } = render(<HeaderIcon />);
      expect(getByRole('button')).toBeTruthy();
    });

    it('should not render touchable when onPress not provided', () => {
      const HeaderIcon = createHeaderIcon({
        icon: 'mdi:info',
      });

      const { queryByRole } = render(<HeaderIcon />);
      expect(queryByRole('button')).toBeNull();
    });

    it('should use default color when no tintColor or custom color', () => {
      const HeaderIcon = createHeaderIcon({
        icon: 'mdi:search',
      });

      const { getByTestId } = render(<HeaderIcon />);
      expect(getByTestId('icon-color').props.children).toBe('#000000');
    });
  });

  describe('createBackIcon', () => {
    it('should create back icon with arrow-left', () => {
      const BackIcon = createBackIcon();

      const { getByTestId } = render(<BackIcon tintColor="#007AFF" />);
      expect(getByTestId('icon-name').props.children).toBe('mdi:arrow-left');
    });

    it('should accept custom options', () => {
      const onPress = jest.fn();
      const BackIcon = createBackIcon({
        onPress,
        size: 28,
      });

      const { getByTestId, getByRole } = render(<BackIcon />);
      expect(getByTestId('icon-size').props.children).toBe(28);
      expect(getByRole('button')).toBeTruthy();
    });
  });

  describe('createCloseIcon', () => {
    it('should create close icon with X', () => {
      const CloseIcon = createCloseIcon();

      const { getByTestId } = render(<CloseIcon tintColor="#007AFF" />);
      expect(getByTestId('icon-name').props.children).toBe('mdi:close');
    });
  });

  describe('createMenuIcon', () => {
    it('should create menu icon with hamburger', () => {
      const MenuIcon = createMenuIcon();

      const { getByTestId } = render(<MenuIcon tintColor="#007AFF" />);
      expect(getByTestId('icon-name').props.children).toBe('mdi:menu');
    });

    it('should accept onPress for drawer toggle', () => {
      const openDrawer = jest.fn();
      const MenuIcon = createMenuIcon({
        onPress: openDrawer,
      });

      const { getByRole } = render(<MenuIcon />);
      expect(getByRole('button')).toBeTruthy();
    });
  });

  describe('useNavigationIcon', () => {
    it('should return tabBarIcon function', () => {
      const { result } = renderHook(() => useNavigationIcon());

      expect(typeof result.current.tabBarIcon).toBe('function');
    });

    it('should return drawerIcon function', () => {
      const { result } = renderHook(() => useNavigationIcon());

      expect(typeof result.current.drawerIcon).toBe('function');
    });

    it('should return autoTabBarIcon function', () => {
      const { result } = renderHook(() => useNavigationIcon());

      expect(typeof result.current.autoTabBarIcon).toBe('function');
    });

    it('should return renderIcon function', () => {
      const { result } = renderHook(() => useNavigationIcon());

      expect(typeof result.current.renderIcon).toBe('function');
    });

    it('should create working tabBarIcon', () => {
      const { result } = renderHook(() => useNavigationIcon());
      const icon = result.current.tabBarIcon('mdi:home', 'mdi:home-outline');

      const { getByTestId, rerender } = render(
        asElement(icon({ focused: true, color: '#007AFF', size: 24 }))
      );
      expect(getByTestId('icon-name').props.children).toBe('mdi:home');

      rerender(asElement(icon({ focused: false, color: '#8E8E93', size: 24 })));
      expect(getByTestId('icon-name').props.children).toBe('mdi:home-outline');
    });

    it('should create working drawerIcon', () => {
      const { result } = renderHook(() => useNavigationIcon());
      const icon = result.current.drawerIcon('mdi:settings', 'mdi:cog');

      const { getByTestId, rerender } = render(
        asElement(icon({ focused: true, color: '#007AFF', size: 24 }))
      );
      expect(getByTestId('icon-name').props.children).toBe('mdi:cog');

      rerender(asElement(icon({ focused: false, color: '#8E8E93', size: 24 })));
      expect(getByTestId('icon-name').props.children).toBe('mdi:settings');
    });

    it('should create autoTabBarIcon with outline suffix', () => {
      const { result } = renderHook(() => useNavigationIcon());
      const icon = result.current.autoTabBarIcon('mdi', 'account');

      const { getByTestId, rerender } = render(
        asElement(icon({ focused: true, color: '#007AFF', size: 24 }))
      );
      expect(getByTestId('icon-name').props.children).toBe('mdi:account');

      rerender(asElement(icon({ focused: false, color: '#8E8E93', size: 24 })));
      expect(getByTestId('icon-name').props.children).toBe('mdi:account-outline');
    });

    it('should use custom outlineSuffix', () => {
      const { result } = renderHook(() => useNavigationIcon({ outlineSuffix: '-light' }));
      const icon = result.current.autoTabBarIcon('ph', 'house');

      const { getByTestId, rerender } = render(
        asElement(icon({ focused: true, color: '#007AFF', size: 24 }))
      );
      expect(getByTestId('icon-name').props.children).toBe('ph:house');

      rerender(asElement(icon({ focused: false, color: '#8E8E93', size: 24 })));
      expect(getByTestId('icon-name').props.children).toBe('ph:house-light');
    });

    it('should use custom defaultSize', () => {
      const { result } = renderHook(() => useNavigationIcon({ defaultSize: 32 }));
      const icon = result.current.tabBarIcon('mdi:star');

      // When navigation doesn't provide size (undefined), use defaultSize
      const { getByTestId } = render(
        asElement(icon({ focused: true, color: '#007AFF', size: undefined as any }))
      );
      expect(getByTestId('icon-size').props.children).toBe(32);
    });

    it('should render icon directly with renderIcon', () => {
      const { result } = renderHook(() => useNavigationIcon());
      const element = result.current.renderIcon('mdi:check', {
        color: '#00FF00',
        size: 20,
      });

      const { getByTestId } = render(asElement(element));
      expect(getByTestId('icon-name').props.children).toBe('mdi:check');
      expect(getByTestId('icon-color').props.children).toBe('#00FF00');
      expect(getByTestId('icon-size').props.children).toBe(20);
    });
  });

  describe('Type exports', () => {
    it('should export all required types', () => {
      // This test ensures the types are properly exported
      // TypeScript compilation will fail if these aren't exported
      const types = require('../navigation');

      expect(types.createTabBarIcon).toBeDefined();
      expect(types.createTabBarIcons).toBeDefined();
      expect(types.tabIcon).toBeDefined();
      expect(types.createDrawerIcon).toBeDefined();
      expect(types.createDrawerIcons).toBeDefined();
      expect(types.createHeaderIcon).toBeDefined();
      expect(types.createBackIcon).toBeDefined();
      expect(types.createCloseIcon).toBeDefined();
      expect(types.createMenuIcon).toBeDefined();
      expect(types.useNavigationIcon).toBeDefined();
      expect(types.DEFAULT_NAVIGATION_PRESETS).toBeDefined();
    });
  });
});
