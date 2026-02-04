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
});
