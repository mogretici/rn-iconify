/**
 * Integration Tests
 * End-to-end tests for the icon rendering pipeline
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Mdi, Heroicons, Lucide, Ph, Feather } from '../components';
import { CacheManager } from '../cache/CacheManager';
import { fetchIcon } from '../network/IconifyAPI';

// Mock fetch for network requests
const mockSvgResponse = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;

beforeEach(() => {
  jest.clearAllMocks();
  CacheManager.clear();

  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    // Simulate successful API response
    const iconMatch = url.match(/\/(\w+)\.json\?icons=(.+)/);
    if (iconMatch) {
      const [, prefix, iconName] = iconMatch;
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            prefix,
            icons: {
              [iconName]: {
                body: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>',
                width: 24,
                height: 24,
              },
            },
            width: 24,
            height: 24,
          }),
      });
    }

    return Promise.resolve({
      ok: false,
      status: 404,
    });
  });
});

describe('Icon Component Integration', () => {
  describe('Mdi Icons', () => {
    it('renders home icon correctly', async () => {
      const { getByTestId } = render(<Mdi name="home" size={24} color="blue" testID="mdi-home" />);

      await waitFor(() => {
        expect(getByTestId('mdi-home')).toBeTruthy();
      });
    });

    it('renders with custom size', async () => {
      const { getByTestId } = render(<Mdi name="settings" size={48} testID="mdi-settings" />);

      await waitFor(() => {
        expect(getByTestId('mdi-settings')).toBeTruthy();
      });
    });
  });

  describe('Heroicons', () => {
    it('renders user icon', async () => {
      const { getByTestId } = render(<Heroicons name="user" size={24} testID="hero-user" />);

      await waitFor(() => {
        expect(getByTestId('hero-user')).toBeTruthy();
      });
    });
  });

  describe('Lucide Icons', () => {
    it('renders camera icon', async () => {
      const { getByTestId } = render(<Lucide name="camera" size={24} testID="lucide-camera" />);

      await waitFor(() => {
        expect(getByTestId('lucide-camera')).toBeTruthy();
      });
    });
  });

  describe('Phosphor Icons', () => {
    it('renders house icon', async () => {
      const { getByTestId } = render(<Ph name="house" size={24} testID="ph-house" />);

      await waitFor(() => {
        expect(getByTestId('ph-house')).toBeTruthy();
      });
    });
  });

  describe('Feather Icons', () => {
    it('renders activity icon', async () => {
      const { getByTestId } = render(
        <Feather name="activity" size={24} testID="feather-activity" />
      );

      await waitFor(() => {
        expect(getByTestId('feather-activity')).toBeTruthy();
      });
    });
  });
});

describe('Cache Integration', () => {
  it('caches icons after fetch and set', async () => {
    // Fetch icon from API
    const svg = await fetchIcon('mdi:home');
    expect(svg).toContain('<svg');

    // Manually cache it (simulating what IconRenderer does)
    CacheManager.set('mdi:home', svg);

    // Should be cached now
    const cached = CacheManager.get('mdi:home');
    expect(cached).toBeTruthy();
    expect(cached).toContain('<svg');
  });

  it('returns cached icon on subsequent requests', async () => {
    // Pre-populate cache
    CacheManager.set('mdi:cached-icon', mockSvgResponse);

    // Should return from cache without network call
    const cached = CacheManager.get('mdi:cached-icon');
    expect(cached).toBe(mockSvgResponse);
  });

  it('prefetches multiple icons', async () => {
    const icons = ['mdi:home', 'mdi:settings', 'mdi:user'];
    const result = await CacheManager.prefetch(icons, fetchIcon);

    expect(result.success.length).toBeGreaterThan(0);
  });
});

describe('Props Integration', () => {
  it('applies color prop correctly', async () => {
    const { getByTestId } = render(
      <Mdi name="home" size={24} color="#FF0000" testID="colored-icon" />
    );

    await waitFor(() => {
      expect(getByTestId('colored-icon')).toBeTruthy();
    });
  });

  it('applies rotation prop', async () => {
    const { getByTestId } = render(
      <Mdi name="arrow-right" size={24} rotate={90} testID="rotated-icon" />
    );

    await waitFor(() => {
      expect(getByTestId('rotated-icon')).toBeTruthy();
    });
  });

  it('applies flip prop', async () => {
    const { getByTestId } = render(
      <Mdi name="arrow-right" size={24} flip="horizontal" testID="flipped-icon" />
    );

    await waitFor(() => {
      expect(getByTestId('flipped-icon')).toBeTruthy();
    });
  });

  it('renders fallback while loading', async () => {
    const FallbackComponent = () => <></>;
    const { getByTestId } = render(
      <Mdi name="slow-icon" size={24} fallback={<FallbackComponent />} testID="fallback-icon" />
    );

    await waitFor(() => {
      expect(getByTestId('fallback-icon')).toBeTruthy();
    });
  });

  it('calls onLoad callback', async () => {
    const onLoad = jest.fn();

    render(<Mdi name="home" size={24} onLoad={onLoad} testID="onload-icon" />);

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('calls onError callback on failure', async () => {
    const onError = jest.fn();

    // Mock a failing request
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({ ok: false, status: 404 })
    );

    render(<Mdi name="nonexistent-icon" size={24} onError={onError} testID="error-icon" />);

    await waitFor(
      () => {
        expect(onError).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });
});

describe('Accessibility', () => {
  it('sets accessibility label', async () => {
    const { getByLabelText } = render(<Mdi name="home" size={24} accessibilityLabel="Home icon" />);

    await waitFor(() => {
      expect(getByLabelText('Home icon')).toBeTruthy();
    });
  });

  it('uses icon name as default accessibility label', async () => {
    const { getByLabelText } = render(<Mdi name="settings" size={24} />);

    await waitFor(() => {
      expect(getByLabelText('settings')).toBeTruthy();
    });
  });
});

describe('Multiple Icon Sets', () => {
  it('renders icons from different sets', async () => {
    const { getByTestId } = render(
      <>
        <Mdi name="home" size={24} testID="mdi" />
        <Heroicons name="user" size={24} testID="heroicons" />
        <Lucide name="camera" size={24} testID="lucide" />
        <Ph name="house" size={24} testID="phosphor" />
        <Feather name="activity" size={24} testID="feather" />
      </>
    );

    await waitFor(() => {
      expect(getByTestId('mdi')).toBeTruthy();
      expect(getByTestId('heroicons')).toBeTruthy();
      expect(getByTestId('lucide')).toBeTruthy();
      expect(getByTestId('phosphor')).toBeTruthy();
      expect(getByTestId('feather')).toBeTruthy();
    });
  });
});
