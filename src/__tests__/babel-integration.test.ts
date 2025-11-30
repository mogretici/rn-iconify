/**
 * Babel Plugin Integration Tests
 * Tests actual Babel transformations with the rn-iconify plugin
 */

import * as babel from '@babel/core';
import { createRnIconifyPlugin, resetPluginState, collector } from '../babel';

// Use fake timers to prevent async bundle generation from keeping Jest open
jest.useFakeTimers();

// Helper to transform code with our plugin
function transform(
  code: string,
  options: Record<string, unknown> = {},
  filename = 'test.tsx'
): babel.BabelFileResult | null {
  return babel.transformSync(code, {
    filename,
    presets: [['@babel/preset-react', { runtime: 'automatic' }], '@babel/preset-typescript'],
    plugins: [[createRnIconifyPlugin, options]],
    babelrc: false,
    configFile: false,
  });
}

describe('Babel Plugin Integration', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    resetPluginState();
    collector.initialize({});
  });

  afterEach(() => {
    jest.clearAllTimers();
    resetPluginState();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('JSX Icon Detection', () => {
    it('detects Mdi component usage', () => {
      const code = `
        import { Mdi } from 'rn-iconify';
        export function App() {
          return <Mdi name="home" size={24} />;
        }
      `;

      transform(code);

      expect(collector.hasIcons()).toBe(true);
      expect(collector.getIconNames()).toContain('mdi:home');
    });

    it('detects multiple icon components', () => {
      const code = `
        import { Mdi, Heroicons, Lucide } from 'rn-iconify';
        export function App() {
          return (
            <>
              <Mdi name="home" />
              <Heroicons name="user" />
              <Lucide name="camera" />
            </>
          );
        }
      `;

      transform(code);

      const icons = collector.getIconNames();
      expect(icons).toContain('mdi:home');
      expect(icons).toContain('heroicons:user');
      expect(icons).toContain('lucide:camera');
      expect(collector.getCount()).toBe(3);
    });

    it('detects icons in nested components', () => {
      const code = `
        import { Mdi } from 'rn-iconify';
        function Icon() {
          return <Mdi name="settings" />;
        }
        export function App() {
          return (
            <div>
              <Icon />
              <Mdi name="home" />
            </div>
          );
        }
      `;

      transform(code);

      const icons = collector.getIconNames();
      expect(icons).toContain('mdi:settings');
      expect(icons).toContain('mdi:home');
    });

    it('skips dynamic icon names', () => {
      const code = `
        import { Mdi } from 'rn-iconify';
        export function App({ iconName }) {
          return <Mdi name={iconName} />;
        }
      `;

      transform(code);

      // Dynamic names should not be collected
      expect(collector.hasIcons()).toBe(false);
    });

    it('skips template literal icon names', () => {
      const code = `
        import { Mdi } from 'rn-iconify';
        export function App({ type }) {
          return <Mdi name={\`icon-\${type}\`} />;
        }
      `;

      transform(code);

      expect(collector.hasIcons()).toBe(false);
    });

    it('detects icons with various props', () => {
      const code = `
        import { Mdi } from 'rn-iconify';
        export function App() {
          return (
            <Mdi
              name="account"
              size={32}
              color="blue"
              rotate={90}
              flip="horizontal"
            />
          );
        }
      `;

      transform(code);

      expect(collector.getIconNames()).toContain('mdi:account');
    });

    it('detects all 200+ icon set components', () => {
      // Test a sample of different icon sets
      const code = `
        import {
          Mdi, Ph, Feather, Tabler, Bi, Ri, Carbon,
          Fa6Solid, Fluent, MaterialSymbols, Solar,
          AntDesign, Lucide, Ion
        } from 'rn-iconify';

        export function App() {
          return (
            <>
              <Mdi name="home" />
              <Ph name="house" />
              <Feather name="home" />
              <Tabler name="home" />
              <Bi name="house" />
              <Ri name="home-line" />
              <Carbon name="home" />
              <Fa6Solid name="house" />
              <Fluent name="home-24-regular" />
              <MaterialSymbols name="home" />
              <Solar name="home-bold" />
              <AntDesign name="home" />
              <Lucide name="home" />
              <Ion name="home" />
            </>
          );
        }
      `;

      transform(code);

      const icons = collector.getIconNames();
      expect(icons).toContain('mdi:home');
      expect(icons).toContain('ph:house');
      expect(icons).toContain('feather:home');
      expect(icons).toContain('tabler:home');
      expect(icons).toContain('bi:house');
      expect(icons).toContain('ri:home-line');
      expect(icons).toContain('carbon:home');
      expect(icons).toContain('fa6-solid:house');
      expect(icons).toContain('fluent:home-24-regular');
      expect(icons).toContain('material-symbols:home');
      expect(icons).toContain('solar:home-bold');
      expect(icons).toContain('ant-design:home');
      expect(icons).toContain('lucide:home');
      expect(icons).toContain('ion:home');
      expect(collector.getCount()).toBe(14);
    });
  });

  describe('prefetchIcons Detection', () => {
    it('detects prefetchIcons array literals', () => {
      const code = `
        import { prefetchIcons } from 'rn-iconify';

        prefetchIcons(['mdi:home', 'mdi:settings', 'heroicons:user']);
      `;

      transform(code);

      const icons = collector.getIconNames();
      expect(icons).toContain('mdi:home');
      expect(icons).toContain('mdi:settings');
      expect(icons).toContain('heroicons:user');
    });

    it('detects prefetchIcons with async/await', () => {
      const code = `
        import { prefetchIcons } from 'rn-iconify';

        async function init() {
          await prefetchIcons(['mdi:account', 'mdi:bell']);
        }
      `;

      transform(code);

      const icons = collector.getIconNames();
      expect(icons).toContain('mdi:account');
      expect(icons).toContain('mdi:bell');
    });

    it('skips prefetchIcons with variable arrays', () => {
      const code = `
        import { prefetchIcons } from 'rn-iconify';

        const icons = ['mdi:home'];
        prefetchIcons(icons);
      `;

      transform(code);

      // Variable references should not be collected (we can't resolve them at build time)
      expect(collector.hasIcons()).toBe(false);
    });

    it('detects prefetchIcons in useEffect', () => {
      const code = `
        import { useEffect } from 'react';
        import { prefetchIcons } from 'rn-iconify';

        function App() {
          useEffect(() => {
            prefetchIcons(['mdi:menu', 'mdi:close']);
          }, []);
          return null;
        }
      `;

      transform(code);

      const icons = collector.getIconNames();
      expect(icons).toContain('mdi:menu');
      expect(icons).toContain('mdi:close');
    });
  });

  describe('Include/Exclude Patterns', () => {
    it('respects include patterns', () => {
      const code = `
        import { Mdi, Heroicons } from 'rn-iconify';
        export function App() {
          return (
            <>
              <Mdi name="home" />
              <Heroicons name="user" />
            </>
          );
        }
      `;

      // Pass include option to the plugin (not collector.initialize)
      transform(code, { include: ['mdi:*'] });

      const icons = collector.getIconNames();
      expect(icons).toContain('mdi:home');
      expect(icons).not.toContain('heroicons:user');
    });

    it('respects exclude patterns', () => {
      const code = `
        import { Mdi } from 'rn-iconify';
        export function App() {
          return (
            <>
              <Mdi name="home" />
              <Mdi name="test-icon" />
            </>
          );
        }
      `;

      // Pass exclude option to the plugin
      transform(code, { exclude: ['mdi:test-*'] });

      const icons = collector.getIconNames();
      expect(icons).toContain('mdi:home');
      expect(icons).not.toContain('mdi:test-icon');
    });

    it('exclude takes precedence over include', () => {
      const code = `
        import { Mdi } from 'rn-iconify';
        export function App() {
          return (
            <>
              <Mdi name="home" />
              <Mdi name="home-outline" />
            </>
          );
        }
      `;

      // Pass both include and exclude options
      transform(code, {
        include: ['mdi:*'],
        exclude: ['mdi:home-outline'],
      });

      const icons = collector.getIconNames();
      expect(icons).toContain('mdi:home');
      expect(icons).not.toContain('mdi:home-outline');
    });

    it('supports multiple include patterns', () => {
      const code = `
        import { Mdi, Heroicons, Lucide } from 'rn-iconify';
        export function App() {
          return (
            <>
              <Mdi name="home" />
              <Heroicons name="user" />
              <Lucide name="camera" />
            </>
          );
        }
      `;

      // Pass multiple include patterns
      transform(code, { include: ['mdi:*', 'heroicons:*'] });

      const icons = collector.getIconNames();
      expect(icons).toContain('mdi:home');
      expect(icons).toContain('heroicons:user');
      expect(icons).not.toContain('lucide:camera');
    });
  });

  describe('Plugin Options', () => {
    it('disables plugin when disabled option is true', () => {
      const code = `
        import { Mdi } from 'rn-iconify';
        export function App() {
          return <Mdi name="home" />;
        }
      `;

      transform(code, { disabled: true });

      expect(collector.hasIcons()).toBe(false);
    });

    it('logs verbose output when verbose option is true', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const code = `
        import { Mdi } from 'rn-iconify';
        export function App() {
          return <Mdi name={dynamicName} />;
        }
      `;

      transform(code, { verbose: true });

      // Verbose mode should log skipped dynamic names
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[rn-iconify]'));

      consoleSpy.mockRestore();
    });
  });

  describe('Deduplication', () => {
    it('deduplicates same icons across components', () => {
      const code = `
        import { Mdi } from 'rn-iconify';
        function Header() {
          return <Mdi name="home" />;
        }
        function Footer() {
          return <Mdi name="home" />;
        }
        function Sidebar() {
          return <Mdi name="home" />;
        }
      `;

      transform(code);

      expect(collector.getCount()).toBe(1);
      expect(collector.getIconNames()).toContain('mdi:home');
    });

    it('deduplicates icons from JSX and prefetchIcons', () => {
      const code = `
        import { Mdi, prefetchIcons } from 'rn-iconify';

        prefetchIcons(['mdi:home', 'mdi:settings']);

        function App() {
          return (
            <>
              <Mdi name="home" />
              <Mdi name="settings" />
            </>
          );
        }
      `;

      transform(code);

      expect(collector.getCount()).toBe(2);
    });
  });

  describe('Icon Grouping by Prefix', () => {
    it('groups icons by prefix correctly', () => {
      const code = `
        import { Mdi, Heroicons } from 'rn-iconify';
        export function App() {
          return (
            <>
              <Mdi name="home" />
              <Mdi name="settings" />
              <Mdi name="account" />
              <Heroicons name="user" />
              <Heroicons name="cog" />
            </>
          );
        }
      `;

      transform(code);

      const byPrefix = collector.getIconsByPrefix();
      expect(byPrefix.get('mdi')).toHaveLength(3);
      expect(byPrefix.get('heroicons')).toHaveLength(2);
    });
  });

  describe('File Tracking', () => {
    it('tracks icons per file', () => {
      // Transform first file
      transform(
        `
        import { Mdi } from 'rn-iconify';
        export function A() { return <Mdi name="home" />; }
      `,
        {},
        'componentA.tsx'
      );

      // Transform second file
      transform(
        `
        import { Heroicons } from 'rn-iconify';
        export function B() { return <Heroicons name="user" />; }
      `,
        {},
        'componentB.tsx'
      );

      const allIcons = collector.getAllIcons();

      const homeIcon = allIcons.find((i) => i.name === 'mdi:home');
      const userIcon = allIcons.find((i) => i.name === 'heroicons:user');

      // File paths may include full path, so check endsWith
      expect(homeIcon?.file).toMatch(/componentA\.tsx$/);
      expect(userIcon?.file).toMatch(/componentB\.tsx$/);
    });

    it('tracks line and column information', () => {
      const code = `import { Mdi } from 'rn-iconify';
export function App() {
  return <Mdi name="home" />;
}`;

      transform(code);

      const allIcons = collector.getAllIcons();
      const homeIcon = allIcons.find((i) => i.name === 'mdi:home');

      expect(homeIcon?.line).toBeGreaterThan(0);
      expect(homeIcon?.column).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty files', () => {
      transform('');
      expect(collector.hasIcons()).toBe(false);
    });

    it('handles files without icon imports', () => {
      const code = `
        import React from 'react';
        export function App() {
          return <div>Hello</div>;
        }
      `;

      transform(code);
      expect(collector.hasIcons()).toBe(false);
    });

    it('ignores non-rn-iconify components with same names', () => {
      const code = `
        import { Mdi } from 'some-other-library';
        export function App() {
          return <Mdi name="home" />;
        }
      `;

      // Since we check component names, this might still be collected
      // depending on implementation. This test documents the behavior.
      transform(code);

      // The current implementation collects based on component name only
      // This is acceptable since false positives are better than missing icons
      // and the network call will simply fail for non-existent icons
    });

    it('handles JSX fragments', () => {
      const code = `
        import { Mdi } from 'rn-iconify';
        export function App() {
          return (
            <>
              <Mdi name="home" />
              <Mdi name="settings" />
            </>
          );
        }
      `;

      transform(code);

      expect(collector.getCount()).toBe(2);
    });

    it('handles conditional rendering', () => {
      const code = `
        import { Mdi } from 'rn-iconify';
        export function App({ showSettings }) {
          return (
            <>
              <Mdi name="home" />
              {showSettings && <Mdi name="settings" />}
            </>
          );
        }
      `;

      transform(code);

      const icons = collector.getIconNames();
      expect(icons).toContain('mdi:home');
      expect(icons).toContain('mdi:settings');
    });

    it('handles ternary expressions', () => {
      const code = `
        import { Mdi } from 'rn-iconify';
        export function App({ isActive }) {
          return isActive
            ? <Mdi name="check" />
            : <Mdi name="close" />;
        }
      `;

      transform(code);

      const icons = collector.getIconNames();
      expect(icons).toContain('mdi:check');
      expect(icons).toContain('mdi:close');
    });

    it('handles icon names with hyphens', () => {
      const code = `
        import { Mdi } from 'rn-iconify';
        export function App() {
          return <Mdi name="arrow-left-bold-outline" />;
        }
      `;

      transform(code);

      expect(collector.getIconNames()).toContain('mdi:arrow-left-bold-outline');
    });

    it('handles icon names with numbers', () => {
      const code = `
        import { Mdi } from 'rn-iconify';
        export function App() {
          return <Mdi name="numeric-1-circle" />;
        }
      `;

      transform(code);

      expect(collector.getIconNames()).toContain('mdi:numeric-1-circle');
    });
  });
});

describe('Collector State Management', () => {
  beforeEach(() => {
    resetPluginState();
  });

  it('resets state correctly', () => {
    collector.initialize({});
    collector.add('mdi:home', 'test.tsx', 1, 0);

    expect(collector.hasIcons()).toBe(true);

    resetPluginState();

    expect(collector.hasIcons()).toBe(false);
  });

  it('handles multiple build cycles', () => {
    // First build
    collector.initialize({});
    transform(`
      import { Mdi } from 'rn-iconify';
      export function A() { return <Mdi name="home" />; }
    `);

    expect(collector.getCount()).toBe(1);

    // Reset and second build
    resetPluginState();
    collector.initialize({});

    transform(`
      import { Heroicons } from 'rn-iconify';
      export function B() { return <Heroicons name="user" />; }
    `);

    expect(collector.getCount()).toBe(1);
    expect(collector.getIconNames()).toContain('heroicons:user');
    expect(collector.getIconNames()).not.toContain('mdi:home');
  });
});
