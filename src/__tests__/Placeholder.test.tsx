/**
 * Placeholder System Tests
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import {
  Skeleton,
  Pulse,
  Shimmer,
  PlaceholderFactory,
  DEFAULT_PLACEHOLDER_CONFIG,
} from '../placeholder';

// Mock Animated to avoid animation timing issues in tests
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

describe('Placeholder System', () => {
  describe('Skeleton', () => {
    it('renders without crashing', () => {
      const { toJSON } = render(<Skeleton width={24} height={24} />);
      expect(toJSON()).not.toBeNull();
    });

    it('renders with correct dimensions', () => {
      const { toJSON } = render(<Skeleton width={32} height={48} />);
      const tree = toJSON();
      expect(tree?.props?.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ width: 32, height: 48 })])
      );
    });

    it('renders with custom color', () => {
      const { toJSON } = render(<Skeleton width={24} height={24} color="#FF0000" />);
      const tree = toJSON();
      expect(tree?.props?.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ backgroundColor: '#FF0000' })])
      );
    });

    it('renders with custom borderRadius', () => {
      const { toJSON } = render(<Skeleton width={24} height={24} borderRadius={12} />);
      const tree = toJSON();
      expect(tree?.props?.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ borderRadius: 12 })])
      );
    });

    it('uses default config values', () => {
      const { toJSON } = render(<Skeleton width={24} height={24} />);
      const tree = toJSON();
      expect(tree?.props?.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: DEFAULT_PLACEHOLDER_CONFIG.color,
            borderRadius: DEFAULT_PLACEHOLDER_CONFIG.borderRadius,
          }),
        ])
      );
    });
  });

  describe('Pulse', () => {
    it('renders without crashing', async () => {
      const { toJSON } = render(<Pulse width={24} height={24} />);
      await waitFor(() => {
        expect(toJSON()).not.toBeNull();
      });
    });

    it('renders with custom color', async () => {
      const { toJSON } = render(<Pulse width={24} height={24} color="#00FF00" />);
      await waitFor(() => {
        expect(toJSON()).not.toBeNull();
      });
    });
  });

  describe('Shimmer', () => {
    it('renders without crashing', async () => {
      const { toJSON } = render(<Shimmer width={24} height={24} />);
      await waitFor(() => {
        expect(toJSON()).not.toBeNull();
      });
    });

    it('renders with custom colors', async () => {
      const { toJSON } = render(
        <Shimmer width={24} height={24} color="#333333" highlightColor="#666666" />
      );
      await waitFor(() => {
        expect(toJSON()).not.toBeNull();
      });
    });
  });

  describe('PlaceholderFactory', () => {
    it('renders skeleton for "skeleton" type', () => {
      const { toJSON } = render(<PlaceholderFactory type="skeleton" width={24} height={24} />);
      expect(toJSON()).not.toBeNull();
    });

    it('renders pulse for "pulse" type', async () => {
      const { toJSON } = render(<PlaceholderFactory type="pulse" width={24} height={24} />);
      await waitFor(() => {
        expect(toJSON()).not.toBeNull();
      });
    });

    it('renders shimmer for "shimmer" type', async () => {
      const { toJSON } = render(<PlaceholderFactory type="shimmer" width={24} height={24} />);
      await waitFor(() => {
        expect(toJSON()).not.toBeNull();
      });
    });

    it('renders custom ReactNode', () => {
      const CustomComponent = <Text>Loading...</Text>;
      const { toJSON } = render(
        <PlaceholderFactory type={CustomComponent} width={24} height={24} />
      );
      const tree = toJSON();
      expect(tree).not.toBeNull();
      // Check that the custom component is rendered inside
      expect(tree?.children).toContainEqual(expect.objectContaining({ type: 'Text' }));
    });

    it('returns null for null type', () => {
      const { toJSON } = render(<PlaceholderFactory type={null} width={24} height={24} />);
      expect(toJSON()).toBeNull();
    });

    it('returns null for undefined type', () => {
      const { toJSON } = render(<PlaceholderFactory type={undefined} width={24} height={24} />);
      expect(toJSON()).toBeNull();
    });

    it('passes dimensions to skeleton preset', () => {
      const { toJSON } = render(<PlaceholderFactory type="skeleton" width={48} height={48} />);
      const tree = toJSON();
      expect(tree?.props?.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            width: 48,
            height: 48,
          }),
        ])
      );
    });

    it('passes config props to skeleton preset', () => {
      const { toJSON } = render(
        <PlaceholderFactory
          type="skeleton"
          width={24}
          height={24}
          color="#AABBCC"
          borderRadius={8}
        />
      );
      const tree = toJSON();
      expect(tree?.props?.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: '#AABBCC',
            borderRadius: 8,
          }),
        ])
      );
    });

    it('falls back to skeleton for invalid type with warning in dev', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const invalidType = 'invalid' as any;

      const { toJSON } = render(<PlaceholderFactory type={invalidType} width={24} height={24} />);

      expect(toJSON()).not.toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid placeholder type'));

      consoleSpy.mockRestore();
    });
  });

  describe('DEFAULT_PLACEHOLDER_CONFIG', () => {
    it('has expected default values', () => {
      expect(DEFAULT_PLACEHOLDER_CONFIG).toEqual({
        color: '#E1E1E1',
        highlightColor: '#F5F5F5',
        duration: 1000,
        borderRadius: 4,
      });
    });
  });
});
