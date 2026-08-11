/**
 * Scanner Tests
 * Tests for the synchronous project file scanner
 */

import * as fs from 'fs';
import * as path from 'path';
import { scanProjectForIcons } from '../babel/scanner';

// Mock fs
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    readdirSync: jest.fn(),
    readFileSync: jest.fn(),
    existsSync: jest.fn(),
  };
});

const mockReaddirSync = fs.readdirSync as jest.Mock;
const mockReadFileSync = fs.readFileSync as jest.Mock;
const mockExistsSync = fs.existsSync as jest.Mock;

function createDirent(name: string, isDir: boolean): fs.Dirent {
  return {
    name,
    isFile: () => !isDir,
    isDirectory: () => isDir,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
    parentPath: '',
  } as fs.Dirent;
}

describe('Scanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReturnValue(false);
  });

  describe('scanProjectForIcons', () => {
    it('finds icons from JSX components', () => {
      mockReaddirSync.mockImplementation((dir: string) => {
        if (dir === '/project') {
          return [createDirent('App.tsx', false)];
        }
        return [];
      });

      mockReadFileSync.mockImplementation((filePath: string) => {
        if (filePath === path.join('/project', 'App.tsx')) {
          return `
            import { Ion, Mdi } from 'rn-iconify';
            export function App() {
              return (
                <>
                  <Ion name="home" size={24} />
                  <Mdi name="settings" />
                </>
              );
            }
          `;
        }
        return '';
      });

      const icons = scanProjectForIcons('/project');

      expect(icons).toContain('ion:home');
      expect(icons).toContain('mdi:settings');
      expect(icons).toHaveLength(2);
    });

    it('finds icons from prefetchIcons calls', () => {
      mockReaddirSync.mockImplementation((dir: string) => {
        if (dir === '/project') {
          return [createDirent('init.ts', false)];
        }
        return [];
      });

      mockReadFileSync.mockImplementation((filePath: string) => {
        if (filePath === path.join('/project', 'init.ts')) {
          return `
            import { prefetchIcons } from 'rn-iconify';
            prefetchIcons(['ion:home', 'mdi:settings', 'lucide:camera']);
          `;
        }
        return '';
      });

      const icons = scanProjectForIcons('/project');

      expect(icons).toContain('ion:home');
      expect(icons).toContain('mdi:settings');
      expect(icons).toContain('lucide:camera');
    });

    it('deduplicates icons', () => {
      mockReaddirSync.mockImplementation((dir: string) => {
        if (dir === '/project') {
          return [createDirent('A.tsx', false), createDirent('B.tsx', false)];
        }
        return [];
      });

      mockReadFileSync.mockImplementation((filePath: string) => {
        if (filePath.endsWith('A.tsx')) {
          return `import { Ion } from 'rn-iconify';\n<Ion name="home" />`;
        }
        if (filePath.endsWith('B.tsx')) {
          return `import { Ion } from 'rn-iconify';\n<Ion name="home" />`;
        }
        return '';
      });

      const icons = scanProjectForIcons('/project');

      expect(icons).toEqual(['ion:home']);
    });

    it('excludes node_modules and other default dirs', () => {
      mockReaddirSync.mockImplementation((dir: string) => {
        if (dir === '/project') {
          return [
            createDirent('node_modules', true),
            createDirent('lib', true),
            createDirent('.rn-iconify', true),
            createDirent('__tests__', true),
            createDirent('src', true),
          ];
        }
        if (dir === path.join('/project', 'src')) {
          return [createDirent('App.tsx', false)];
        }
        return [];
      });

      mockReadFileSync.mockImplementation((filePath: string) => {
        if (filePath.endsWith('App.tsx')) {
          return `import { Mdi } from 'rn-iconify';\n<Mdi name="home" />`;
        }
        return '';
      });

      const icons = scanProjectForIcons('/project');

      // Should only find icon from src/App.tsx, not from excluded dirs
      expect(icons).toContain('mdi:home');
      // readdirSync should NOT have been called for excluded dirs
      expect(mockReaddirSync).not.toHaveBeenCalledWith(
        path.join('/project', 'node_modules'),
        expect.anything()
      );
    });

    it('skips files without rn-iconify imports', () => {
      mockReaddirSync.mockImplementation((dir: string) => {
        if (dir === '/project') {
          return [createDirent('utils.ts', false)];
        }
        return [];
      });

      mockReadFileSync.mockImplementation(() => {
        return `export function add(a, b) { return a + b; }`;
      });

      const icons = scanProjectForIcons('/project');

      expect(icons).toHaveLength(0);
    });

    it('merges icons from usage.json', () => {
      mockReaddirSync.mockImplementation((dir: string) => {
        if (dir === '/project') {
          return [createDirent('App.tsx', false)];
        }
        return [];
      });

      mockReadFileSync.mockImplementation((filePath: string) => {
        if (filePath.endsWith('App.tsx')) {
          return `import { Ion } from 'rn-iconify';\n<Ion name="home" />`;
        }
        if (filePath.endsWith('usage.json')) {
          return JSON.stringify({
            version: '1.0.0',
            icons: ['mdi:dynamic-icon'],
            updatedAt: new Date().toISOString(),
          });
        }
        return '';
      });

      mockExistsSync.mockImplementation((p: string) => {
        return p.endsWith('usage.json');
      });

      const icons = scanProjectForIcons('/project');

      expect(icons).toContain('ion:home');
      expect(icons).toContain('mdi:dynamic-icon');
    });

    it('filters out icon names with trailing backslashes', () => {
      mockReaddirSync.mockImplementation((dir: string) => {
        if (dir === '/project') {
          return [createDirent('App.tsx', false)];
        }
        return [];
      });

      mockReadFileSync.mockImplementation((filePath: string) => {
        if (filePath === path.join('/project', 'App.tsx')) {
          return `
            import { Mdi } from 'rn-iconify';
            export function App() {
              return <Mdi name="home\\" />;
            }
          `;
        }
        return '';
      });

      const icons = scanProjectForIcons('/project');
      expect(icons).not.toContain('mdi:home\\');
      expect(icons).toHaveLength(0);
    });

    it('filters out icon names with spaces', () => {
      mockReaddirSync.mockImplementation((dir: string) => {
        if (dir === '/project') {
          return [createDirent('App.tsx', false)];
        }
        return [];
      });

      mockReadFileSync.mockImplementation((filePath: string) => {
        if (filePath === path.join('/project', 'App.tsx')) {
          return `
            import { Mdi } from 'rn-iconify';
            export function App() {
              return <Mdi name="home icon" />;
            }
          `;
        }
        return '';
      });

      const icons = scanProjectForIcons('/project');
      expect(icons).toHaveLength(0);
    });

    it('filters out invalid prefetchIcons entries', () => {
      mockReaddirSync.mockImplementation((dir: string) => {
        if (dir === '/project') {
          return [createDirent('init.ts', false)];
        }
        return [];
      });

      mockReadFileSync.mockImplementation((filePath: string) => {
        if (filePath === path.join('/project', 'init.ts')) {
          return `
            import { prefetchIcons } from 'rn-iconify';
            prefetchIcons(['ion:home', 'mdi:settings\\\\', 'bad name:icon']);
          `;
        }
        return '';
      });

      const icons = scanProjectForIcons('/project');
      expect(icons).toContain('ion:home');
      expect(icons).not.toContain('mdi:settings\\');
      expect(icons).toHaveLength(1);
    });

    it('handles empty project gracefully', () => {
      mockReaddirSync.mockReturnValue([]);

      const icons = scanProjectForIcons('/project');

      expect(icons).toHaveLength(0);
    });

    it('only scans specified extensions', () => {
      mockReaddirSync.mockImplementation((dir: string) => {
        if (dir === '/project') {
          return [
            createDirent('App.tsx', false),
            createDirent('style.css', false),
            createDirent('data.json', false),
          ];
        }
        return [];
      });

      mockReadFileSync.mockImplementation((filePath: string) => {
        if (filePath.endsWith('App.tsx')) {
          return `import { Ion } from 'rn-iconify';\n<Ion name="home" />`;
        }
        return '';
      });

      const icons = scanProjectForIcons('/project');

      // Only .tsx should be scanned
      expect(mockReadFileSync).toHaveBeenCalledTimes(1);
      expect(icons).toContain('ion:home');
    });
  });

  /**
   * Applications rarely write <Ion name="..."> at every call site. They build
   * a row, a button or an empty state that takes `icon`, and the name stays a
   * literal — it just sits on the wrapper. Those were invisible to the scan,
   * so they were left to be fetched from the network at runtime: a request per
   * icon on every install, a placeholder until it lands, and nothing at all
   * offline.
   *
   * The prop's declared type is what makes this exact. `icon?: IonIconName`
   * names the set, so no prefix is ever inferred.
   */
  describe('icons handed to wrapper components', () => {
    const project = (files: Record<string, string>) => {
      mockReaddirSync.mockImplementation((dir: string) =>
        dir === '/project' ? Object.keys(files).map((f) => createDirent(f, false)) : []
      );
      mockReadFileSync.mockImplementation((filePath: string) => {
        const name = path.basename(String(filePath));
        return files[name] ?? '';
      });
    };

    it('follows a name given to a component that declares an icon prop', () => {
      project({
        'Row.tsx': `
          import { Ion } from 'rn-iconify';
          import type { IonIconName } from 'rn-iconify';
          interface RowProps { icon?: IonIconName }
          export function Row({ icon }: RowProps) {
            return icon ? <Ion name={icon} /> : null;
          }
        `,
        'Screen.tsx': `
          import { Row } from './Row';
          export function Screen() {
            return <Row icon="person-outline" />;
          }
        `,
      });

      expect(scanProjectForIcons('/project')).toContain('ion:person-outline');
    });

    it('takes the icon set from the prop type, not from a guess', () => {
      project({
        'Bar.tsx': `
          import { MaterialSymbols } from 'rn-iconify';
          import type { MaterialSymbolsIconName } from 'rn-iconify';
          function Button({ icon }: { icon: MaterialSymbolsIconName }) {
            return <MaterialSymbols name={icon} />;
          }
          export function Bar() { return <Button icon="favorite" />; }
        `,
      });

      const icons = scanProjectForIcons('/project');
      expect(icons).toContain('material-symbols:favorite');
      expect(icons).not.toContain('ion:favorite');
    });

    // The button inside a bar, the row inside a list: declared locally, used
    // ten lines down, never exported.
    it('follows a component the file never exports', () => {
      project({
        'Bar.tsx': `
          import { Ion } from 'rn-iconify';
          import type { IonIconName } from 'rn-iconify';
          function LocalButton({ icon }: { icon: IonIconName }) {
            return <Ion name={icon} />;
          }
          export function Bar() { return <LocalButton icon="settings-outline" />; }
        `,
      });

      expect(scanProjectForIcons('/project')).toContain('ion:settings-outline');
    });

    it('handles a component with more than one icon prop', () => {
      project({
        'Empty.tsx': `
          import { Ion } from 'rn-iconify';
          import type { IonIconName } from 'rn-iconify';
          export function Empty(props: { icon?: IonIconName; defaultIcon?: IonIconName }) {
            return <Ion name={props.icon ?? props.defaultIcon} />;
          }
        `,
        'Use.tsx': `
          import { Empty } from './Empty';
          export const Use = () => <Empty icon="search-outline" defaultIcon="alert-outline" />;
        `,
      });

      const icons = scanProjectForIcons('/project');
      expect(icons).toContain('ion:search-outline');
      expect(icons).toContain('ion:alert-outline');
    });

    it('reads a name spread across several lines of props', () => {
      project({
        'Row.tsx': `
          import { Ion } from 'rn-iconify';
          import type { IonIconName } from 'rn-iconify';
          export function Row({ icon }: { icon: IonIconName }) { return <Ion name={icon} />; }
        `,
        'Screen.tsx': `
          import { Row } from './Row';
          export const Screen = () => (
            <Row
              label="Settings"
              onPress={handlePress}
              icon="cog-outline"
            />
          );
        `,
      });

      expect(scanProjectForIcons('/project')).toContain('ion:cog-outline');
    });

    it('leaves alone a prop that has nothing to do with icons', () => {
      project({
        'Card.tsx': `
          import { Ion } from 'rn-iconify';
          import type { IonIconName } from 'rn-iconify';
          export function Card({ icon, variant }: { icon: IonIconName; variant: string }) {
            return <Ion name={icon} />;
          }
        `,
        'Screen.tsx': `
          import { Card } from './Card';
          export const Screen = () => <Card icon="star" variant="rounded-outline" />;
        `,
      });

      const icons = scanProjectForIcons('/project');
      expect(icons).toContain('ion:star');
      expect(icons).not.toContain('ion:rounded-outline');
    });

    it('reads every file once, however many passes it takes', () => {
      project({
        'Row.tsx': `
          import { Ion } from 'rn-iconify';
          import type { IonIconName } from 'rn-iconify';
          export function Row({ icon }: { icon: IonIconName }) { return <Ion name={icon} />; }
        `,
        'Screen.tsx': `import { Row } from './Row'; export const S = () => <Row icon="home" />;`,
      });

      scanProjectForIcons('/project');

      expect(mockReadFileSync).toHaveBeenCalledTimes(2);
    });
  });
});
