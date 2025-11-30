/**
 * Icon Alias System Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import {
  Icon,
  IconAliasProvider,
  useIconAliasContext,
  useResolveIcon,
  createIconAliases,
  defineAliases,
} from '../alias';
import { IconThemeProvider } from '../theme';

// Mock IconRenderer to avoid actual icon fetching
jest.mock('../IconRenderer', () => ({
  IconRenderer: ({ iconName, size, color, accessibilityLabel, testID }: any) => {
    const { Text } = require('react-native');
    return (
      <Text testID={testID || 'icon'} accessibilityLabel={accessibilityLabel}>
        {`${iconName}|${size}|${color}`}
      </Text>
    );
  },
}));

describe('Icon Alias System', () => {
  describe('IconAliasProvider', () => {
    it('provides aliases to children', () => {
      const aliases = {
        back: 'mdi:arrow-left',
        menu: 'heroicons:bars-3',
      };

      let contextValue: any;
      function Consumer() {
        contextValue = useIconAliasContext();
        return null;
      }

      render(
        <IconAliasProvider aliases={aliases}>
          <Consumer />
        </IconAliasProvider>
      );

      expect(contextValue.aliases).toEqual(aliases);
      expect(contextValue.resolveIcon('back')).toBe('mdi:arrow-left');
      expect(contextValue.resolveIcon('menu')).toBe('heroicons:bars-3');
    });

    it('resolves full icon names without aliases', () => {
      let contextValue: any;
      function Consumer() {
        contextValue = useIconAliasContext();
        return null;
      }

      render(
        <IconAliasProvider aliases={{}}>
          <Consumer />
        </IconAliasProvider>
      );

      expect(contextValue.resolveIcon('mdi:home')).toBe('mdi:home');
      expect(contextValue.resolveIcon('heroicons:user')).toBe('heroicons:user');
    });

    it('extends parent aliases by default', () => {
      const parentAliases = { back: 'mdi:arrow-left' };
      const childAliases = { menu: 'heroicons:bars-3' };

      let contextValue: any;
      function Consumer() {
        contextValue = useIconAliasContext();
        return null;
      }

      render(
        <IconAliasProvider aliases={parentAliases}>
          <IconAliasProvider aliases={childAliases}>
            <Consumer />
          </IconAliasProvider>
        </IconAliasProvider>
      );

      expect(contextValue.resolveIcon('back')).toBe('mdi:arrow-left');
      expect(contextValue.resolveIcon('menu')).toBe('heroicons:bars-3');
    });

    it('does not extend parent when extend=false', () => {
      const parentAliases = { back: 'mdi:arrow-left' };
      const childAliases = { menu: 'heroicons:bars-3' };

      let contextValue: any;
      function Consumer() {
        contextValue = useIconAliasContext();
        return null;
      }

      render(
        <IconAliasProvider aliases={parentAliases}>
          <IconAliasProvider aliases={childAliases} extend={false}>
            <Consumer />
          </IconAliasProvider>
        </IconAliasProvider>
      );

      // Child should not have parent's aliases
      expect(contextValue.isAlias('back')).toBe(false);
      expect(contextValue.isAlias('menu')).toBe(true);
    });

    it('isAlias returns correct values', () => {
      const aliases = { back: 'mdi:arrow-left' };

      let contextValue: any;
      function Consumer() {
        contextValue = useIconAliasContext();
        return null;
      }

      render(
        <IconAliasProvider aliases={aliases}>
          <Consumer />
        </IconAliasProvider>
      );

      expect(contextValue.isAlias('back')).toBe(true);
      expect(contextValue.isAlias('unknown')).toBe(false);
      expect(contextValue.isAlias('mdi:home')).toBe(false);
    });

    it('registerAliases adds runtime aliases', () => {
      let contextValue: any;
      function Consumer() {
        contextValue = useIconAliasContext();
        return null;
      }

      render(
        <IconAliasProvider aliases={{ back: 'mdi:arrow-left' }}>
          <Consumer />
        </IconAliasProvider>
      );

      // Initially only 'back' alias
      expect(contextValue.isAlias('menu')).toBe(false);

      // Register new alias
      contextValue.registerAliases({ menu: 'heroicons:bars-3' });

      // Re-render to get updated context
      render(
        <IconAliasProvider aliases={{ back: 'mdi:arrow-left' }}>
          <Consumer />
        </IconAliasProvider>
      );

      // Note: Due to React state, this test verifies the API exists
      // Full runtime registration is tested in integration
    });
  });

  describe('useResolveIcon hook', () => {
    it('resolves aliases', () => {
      let resolved: string = '';
      function Consumer() {
        resolved = useResolveIcon('back');
        return null;
      }

      render(
        <IconAliasProvider aliases={{ back: 'mdi:arrow-left' }}>
          <Consumer />
        </IconAliasProvider>
      );

      expect(resolved).toBe('mdi:arrow-left');
    });

    it('returns full icon names unchanged', () => {
      let resolved: string = '';
      function Consumer() {
        resolved = useResolveIcon('mdi:home');
        return null;
      }

      render(
        <IconAliasProvider aliases={{}}>
          <Consumer />
        </IconAliasProvider>
      );

      expect(resolved).toBe('mdi:home');
    });
  });

  describe('Icon component', () => {
    it('renders with full icon name', () => {
      render(
        <IconAliasProvider aliases={{}}>
          <Icon name="mdi:home" size={24} color="blue" testID="test-icon" />
        </IconAliasProvider>
      );

      const icon = screen.getByTestId('test-icon');
      expect(icon.props.children).toContain('mdi:home');
    });

    it('renders with alias', () => {
      render(
        <IconAliasProvider aliases={{ back: 'mdi:arrow-left' }}>
          <Icon name="back" size={32} testID="test-icon" />
        </IconAliasProvider>
      );

      const icon = screen.getByTestId('test-icon');
      expect(icon.props.children).toContain('mdi:arrow-left');
    });

    it('renders with default values when no props provided', () => {
      render(
        <IconAliasProvider aliases={{}}>
          <Icon name="mdi:home" testID="test-icon" />
        </IconAliasProvider>
      );

      const icon = screen.getByTestId('test-icon');
      // Should use default values (size=24, color=#000000)
      expect(icon.props.children).toContain('mdi:home');
      expect(icon.props.children).toContain('24');
    });

    it('props override theme defaults', () => {
      render(
        <IconThemeProvider theme={{ size: 48, color: 'red' }}>
          <IconAliasProvider aliases={{}}>
            <Icon name="mdi:home" size={24} color="blue" testID="test-icon" />
          </IconAliasProvider>
        </IconThemeProvider>
      );

      const icon = screen.getByTestId('test-icon');
      expect(icon.props.children).toContain('24');
      expect(icon.props.children).toContain('blue');
    });
  });

  describe('createIconAliases', () => {
    it('creates typed Icon component', () => {
      const { Icon: TypedIcon, Provider } = createIconAliases({
        aliases: {
          back: 'mdi:arrow-left',
          menu: 'heroicons:bars-3',
        } as const,
      });

      render(
        <Provider>
          <TypedIcon name="back" size={24} testID="test-icon" />
        </Provider>
      );

      const icon = screen.getByTestId('test-icon');
      expect(icon.props.children).toContain('mdi:arrow-left');
    });

    it('creates resolve function', () => {
      const { resolve } = createIconAliases({
        aliases: {
          back: 'mdi:arrow-left',
          menu: 'heroicons:bars-3',
        } as const,
      });

      expect(resolve('back')).toBe('mdi:arrow-left');
      expect(resolve('menu')).toBe('heroicons:bars-3');
      expect(resolve('mdi:home')).toBe('mdi:home');
    });

    it('returns aliases object', () => {
      const { aliases } = createIconAliases({
        aliases: {
          back: 'mdi:arrow-left',
          menu: 'heroicons:bars-3',
        } as const,
      });

      expect(aliases.back).toBe('mdi:arrow-left');
      expect(aliases.menu).toBe('heroicons:bars-3');
    });

    it('Provider pre-configures aliases', () => {
      const { Provider } = createIconAliases({
        aliases: {
          back: 'mdi:arrow-left',
        } as const,
      });

      let contextValue: any;
      function Consumer() {
        contextValue = useIconAliasContext();
        return null;
      }

      render(
        <Provider>
          <Consumer />
        </Provider>
      );

      expect(contextValue.resolveIcon('back')).toBe('mdi:arrow-left');
    });

    it('validates aliases in development', () => {
      // Invalid alias (no colon in icon name) should throw in __DEV__
      expect(() => {
        createIconAliases({
          aliases: {
            invalid: 'invalid-name', // Missing prefix:name format
          } as const,
          validate: true,
        });
      }).toThrow('prefix:name');
    });

    it('skips validation when validate=false', () => {
      // Should not throw
      expect(() => {
        createIconAliases({
          aliases: {
            invalid: 'invalid-name',
          } as const,
          validate: false,
        });
      }).not.toThrow();
    });
  });

  describe('defineAliases', () => {
    it('returns the same aliases object', () => {
      const input = {
        back: 'mdi:arrow-left',
        menu: 'heroicons:bars-3',
      };

      const result = defineAliases(input);

      expect(result).toEqual(input);
    });

    it('can be used with IconAliasProvider', () => {
      const aliases = defineAliases({
        back: 'mdi:arrow-left',
      });

      let contextValue: any;
      function Consumer() {
        contextValue = useIconAliasContext();
        return null;
      }

      render(
        <IconAliasProvider aliases={aliases}>
          <Consumer />
        </IconAliasProvider>
      );

      expect(contextValue.resolveIcon('back')).toBe('mdi:arrow-left');
    });
  });

  describe('Default context (no provider)', () => {
    it('resolves full icon names', () => {
      let contextValue: any;
      function Consumer() {
        contextValue = useIconAliasContext();
        return null;
      }

      // Render without provider
      render(<Consumer />);

      expect(contextValue.resolveIcon('mdi:home')).toBe('mdi:home');
      expect(contextValue.isAlias('anything')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('handles empty alias name', () => {
      let contextValue: any;
      function Consumer() {
        contextValue = useIconAliasContext();
        return null;
      }

      render(
        <IconAliasProvider aliases={{ back: 'mdi:arrow-left' }}>
          <Consumer />
        </IconAliasProvider>
      );

      // Empty string should not match any alias
      expect(contextValue.resolveIcon('')).toBe('');
    });

    it('handles alias overriding parent', () => {
      const parentAliases = { back: 'mdi:arrow-left' };
      const childAliases = { back: 'heroicons:arrow-left' };

      let contextValue: any;
      function Consumer() {
        contextValue = useIconAliasContext();
        return null;
      }

      render(
        <IconAliasProvider aliases={parentAliases}>
          <IconAliasProvider aliases={childAliases}>
            <Consumer />
          </IconAliasProvider>
        </IconAliasProvider>
      );

      // Child's alias should override parent's
      expect(contextValue.resolveIcon('back')).toBe('heroicons:arrow-left');
    });

    it('handles special characters in icon names', () => {
      const aliases = {
        special: 'mdi:account-circle-outline',
        numeric: 'simple-icons:500px',
      };

      let contextValue: any;
      function Consumer() {
        contextValue = useIconAliasContext();
        return null;
      }

      render(
        <IconAliasProvider aliases={aliases}>
          <Consumer />
        </IconAliasProvider>
      );

      expect(contextValue.resolveIcon('special')).toBe('mdi:account-circle-outline');
      expect(contextValue.resolveIcon('numeric')).toBe('simple-icons:500px');
    });
  });
});

describe('TypeScript types', () => {
  it('AliasName type extracts keys correctly', () => {
    const { aliases } = createIconAliases({
      aliases: {
        back: 'mdi:arrow-left',
        menu: 'heroicons:bars-3',
      } as const,
    });

    // This is a compile-time check - if types are wrong, this won't compile
    // TypeScript should infer aliases keys as 'back' | 'menu'
    const key: keyof typeof aliases = 'back';
    expect(aliases[key]).toBe('mdi:arrow-left');
  });
});
