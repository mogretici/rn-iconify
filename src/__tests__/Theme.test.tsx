/**
 * Theme System Tests
 */

import React from 'react';
import { render, renderHook } from '@testing-library/react-native';
import { Text } from 'react-native';
import {
  IconThemeProvider,
  IconThemeContext,
  useIconTheme,
  useIconThemeValue,
  useMergedIconProps,
  DEFAULT_ICON_THEME,
  mergeWithDefaults,
} from '../theme';
import type { IconTheme } from '../theme';

// Mock Animated to avoid animation timing issues
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

describe('Theme System', () => {
  describe('DEFAULT_ICON_THEME', () => {
    it('has expected default values', () => {
      expect(DEFAULT_ICON_THEME).toEqual({
        size: 24,
        color: '#000000',
        placeholder: undefined,
        placeholderColor: '#E1E1E1',
        placeholderDuration: 1000,
        rotate: 0,
        flip: undefined,
        fallbackDelay: 0,
      });
    });
  });

  describe('mergeWithDefaults', () => {
    it('merges partial theme with defaults', () => {
      const partial: IconTheme = { size: 32, color: 'red' };
      const merged = mergeWithDefaults(partial);

      expect(merged.size).toBe(32);
      expect(merged.color).toBe('red');
      expect(merged.placeholderColor).toBe('#E1E1E1');
      expect(merged.rotate).toBe(0);
    });

    it('returns defaults for empty theme', () => {
      const merged = mergeWithDefaults({});

      expect(merged.size).toBe(24);
      expect(merged.color).toBe('#000000');
    });

    it('preserves all provided values', () => {
      const full: IconTheme = {
        size: 48,
        color: '#FF0000',
        placeholder: 'shimmer',
        placeholderColor: '#CCCCCC',
        placeholderDuration: 2000,
        rotate: 90,
        flip: 'horizontal',
        fallbackDelay: 500,
      };
      const merged = mergeWithDefaults(full);

      expect(merged).toEqual(expect.objectContaining(full));
    });
  });

  describe('IconThemeProvider', () => {
    it('renders children', () => {
      const { getByText } = render(
        <IconThemeProvider theme={{ size: 24 }}>
          <Text>Child Content</Text>
        </IconThemeProvider>
      );

      expect(getByText('Child Content')).toBeTruthy();
    });

    it('provides theme context to children', () => {
      let capturedTheme: IconTheme = {} as IconTheme;

      function Consumer() {
        const { theme } = React.useContext(IconThemeContext);
        capturedTheme = theme;
        return null;
      }

      render(
        <IconThemeProvider theme={{ size: 32, color: 'blue' }}>
          <Consumer />
        </IconThemeProvider>
      );

      expect(capturedTheme.size).toBe(32);
      expect(capturedTheme.color).toBe('blue');
    });

    it('merges theme with defaults', () => {
      let capturedTheme: IconTheme = {} as IconTheme;

      function Consumer() {
        const { theme } = React.useContext(IconThemeContext);
        capturedTheme = theme;
        return null;
      }

      render(
        <IconThemeProvider theme={{ size: 16 }}>
          <Consumer />
        </IconThemeProvider>
      );

      expect(capturedTheme.size).toBe(16);
      expect(capturedTheme.color).toBe('#000000'); // default
      expect(capturedTheme.placeholderColor).toBe('#E1E1E1'); // default
    });

    it('provides setTheme function', () => {
      let capturedSetTheme: ((theme: IconTheme) => void) | null = null;

      function Consumer() {
        const { setTheme } = React.useContext(IconThemeContext);
        capturedSetTheme = setTheme;
        return null;
      }

      render(
        <IconThemeProvider theme={{ size: 24 }}>
          <Consumer />
        </IconThemeProvider>
      );

      expect(typeof capturedSetTheme).toBe('function');
    });
  });

  describe('useIconTheme', () => {
    it('returns default theme when no provider', () => {
      const { result } = renderHook(() => useIconTheme());

      expect(result.current.theme).toEqual(DEFAULT_ICON_THEME);
    });

    it('returns provided theme from context', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <IconThemeProvider theme={{ size: 40, color: 'green' }}>{children}</IconThemeProvider>
      );

      const { result } = renderHook(() => useIconTheme(), { wrapper });

      expect(result.current.theme.size).toBe(40);
      expect(result.current.theme.color).toBe('green');
    });

    it('returns setTheme function', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <IconThemeProvider theme={{ size: 24 }}>{children}</IconThemeProvider>
      );

      const { result } = renderHook(() => useIconTheme(), { wrapper });

      expect(typeof result.current.setTheme).toBe('function');
    });
  });

  describe('useIconThemeValue', () => {
    it('returns specific theme value', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <IconThemeProvider theme={{ size: 36 }}>{children}</IconThemeProvider>
      );

      const { result } = renderHook(() => useIconThemeValue('size'), {
        wrapper,
      });

      expect(result.current).toBe(36);
    });

    it('returns default for unset value', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <IconThemeProvider theme={{}}>{children}</IconThemeProvider>
      );

      const { result } = renderHook(() => useIconThemeValue('size'), {
        wrapper,
      });

      expect(result.current).toBe(24); // default size
    });

    it('returns undefined for optional properties without default', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <IconThemeProvider theme={{}}>{children}</IconThemeProvider>
      );

      const { result } = renderHook(() => useIconThemeValue('flip'), {
        wrapper,
      });

      expect(result.current).toBeUndefined();
    });
  });

  describe('useMergedIconProps', () => {
    it('returns props with theme defaults', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <IconThemeProvider theme={{ size: 28, color: 'purple' }}>{children}</IconThemeProvider>
      );

      const { result } = renderHook(() => useMergedIconProps({}), { wrapper });

      expect(result.current.size).toBe(28);
      expect(result.current.color).toBe('purple');
    });

    it('props override theme values', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <IconThemeProvider theme={{ size: 28, color: 'purple' }}>{children}</IconThemeProvider>
      );

      const { result } = renderHook(() => useMergedIconProps({ size: 50, color: 'red' }), {
        wrapper,
      });

      expect(result.current.size).toBe(50);
      expect(result.current.color).toBe('red');
    });

    it('merges placeholder values', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <IconThemeProvider
          theme={{
            placeholder: 'shimmer',
            placeholderColor: '#DDD',
            placeholderDuration: 1500,
          }}
        >
          {children}
        </IconThemeProvider>
      );

      const { result } = renderHook(() => useMergedIconProps({}), { wrapper });

      expect(result.current.placeholder).toBe('shimmer');
      expect(result.current.placeholderColor).toBe('#DDD');
      expect(result.current.placeholderDuration).toBe(1500);
    });

    it('props placeholder overrides theme placeholder', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <IconThemeProvider theme={{ placeholder: 'shimmer' }}>{children}</IconThemeProvider>
      );

      const { result } = renderHook(() => useMergedIconProps({ placeholder: 'pulse' }), {
        wrapper,
      });

      expect(result.current.placeholder).toBe('pulse');
    });

    it('merges rotation and flip values', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <IconThemeProvider theme={{ rotate: 90, flip: 'horizontal' }}>{children}</IconThemeProvider>
      );

      const { result } = renderHook(() => useMergedIconProps({}), { wrapper });

      expect(result.current.rotate).toBe(90);
      expect(result.current.flip).toBe('horizontal');
    });
  });

  describe('Nested Providers', () => {
    it('inner provider overrides outer provider', () => {
      let capturedTheme: IconTheme = {} as IconTheme;

      function Consumer() {
        const { theme } = React.useContext(IconThemeContext);
        capturedTheme = theme;
        return null;
      }

      render(
        <IconThemeProvider theme={{ size: 24, color: 'blue' }}>
          <IconThemeProvider theme={{ size: 32, color: 'red' }}>
            <Consumer />
          </IconThemeProvider>
        </IconThemeProvider>
      );

      expect(capturedTheme.size).toBe(32);
      expect(capturedTheme.color).toBe('red');
    });

    it('inner provider can partially override', () => {
      let capturedTheme: IconTheme = {} as IconTheme;

      function Consumer() {
        const { theme } = React.useContext(IconThemeContext);
        capturedTheme = theme;
        return null;
      }

      render(
        <IconThemeProvider theme={{ size: 24, color: 'blue', placeholder: 'shimmer' }}>
          <IconThemeProvider theme={{ size: 32 }}>
            <Consumer />
          </IconThemeProvider>
        </IconThemeProvider>
      );

      // Inner provider sets size, other values come from defaults (not outer provider)
      expect(capturedTheme.size).toBe(32);
      expect(capturedTheme.color).toBe('#000000'); // default, not 'blue'
    });
  });

  describe('Context without Provider', () => {
    it('logs warning when setTheme called without provider', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { result } = renderHook(() => useIconTheme());
      result.current.setTheme({ size: 40 });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('setTheme called without IconThemeProvider')
      );

      consoleSpy.mockRestore();
    });
  });
});
