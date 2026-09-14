/**
 * withRnIconify Metro Config Wrapper Tests
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import type { MetroConfig, MetroMiddleware, MetroResolutionContext } from '../metro/types';

// Mock the devServerMiddleware module
jest.mock('../metro/devServerMiddleware', () => ({
  createDevServerMiddleware: jest.fn(),
}));

// The wrapper creates the application's bundle module when it is missing;
// these tests must not write into the repository or the filesystem root.
jest.mock('../babel/cache-writer', () => ({
  ...jest.requireActual('../babel/cache-writer'),
  writeFileIfChanged: jest.fn(),
}));

import { writeFileIfChanged } from '../babel/cache-writer';
import { createDevServerMiddleware } from '../metro/devServerMiddleware';
import { BUNDLED_ICONS_MODULE, withRnIconify } from '../metro/withRnIconify';

const mockCreateDevServerMiddleware = createDevServerMiddleware as jest.Mock;
const mockWriteFileIfChanged = writeFileIfChanged as jest.Mock;

function createMockReq(url: string): IncomingMessage {
  return { url } as unknown as IncomingMessage;
}

function createMockRes(): ServerResponse {
  return {} as unknown as ServerResponse;
}

describe('withRnIconify', () => {
  let mockMiddleware: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMiddleware = jest.fn();
    mockCreateDevServerMiddleware.mockReturnValue(mockMiddleware);
  });

  it('calls createDevServerMiddleware with provided options', () => {
    const options = { outputDir: '/custom/dir', verbose: true };
    withRnIconify({}, options);

    expect(mockCreateDevServerMiddleware).toHaveBeenCalledWith(options);
  });

  it('calls createDevServerMiddleware with undefined when no options provided', () => {
    withRnIconify({});

    expect(mockCreateDevServerMiddleware).toHaveBeenCalledWith(undefined);
  });

  it('preserves existing config properties', () => {
    const config: MetroConfig = {
      watchFolders: ['/some/path'],
      resolver: { sourceExts: ['ts', 'tsx'] },
    };

    const result = withRnIconify(config);

    expect(result.watchFolders).toEqual(['/some/path']);
    expect(result.resolver).toEqual(expect.objectContaining({ sourceExts: ['ts', 'tsx'] }));
    expect(result.resolver?.resolveRequest).toBeInstanceOf(Function);
  });

  it('adds enhanceMiddleware to server config', () => {
    const result = withRnIconify({});

    expect(result.server).toBeDefined();
    expect(result.server!.enhanceMiddleware).toBeInstanceOf(Function);
  });

  it('preserves existing server config properties', () => {
    const config: MetroConfig = {
      server: {
        port: 8081,
      } as MetroConfig['server'] & { port: number },
    };

    const result = withRnIconify(config);

    expect((result.server as Record<string, unknown>).port).toBe(8081);
    expect(result.server!.enhanceMiddleware).toBeInstanceOf(Function);
  });

  describe('enhanceMiddleware', () => {
    it('uses metroMiddleware directly when no existing enhanceMiddleware', () => {
      const config: MetroConfig = {};
      const result = withRnIconify(config);

      const metroMiddleware: MetroMiddleware = jest.fn();
      const server = {};
      const wrappedMiddleware = result.server!.enhanceMiddleware!(metroMiddleware, server);

      const req = createMockReq('/some-path');
      const res = createMockRes();
      const next = jest.fn();

      wrappedMiddleware(req, res, next);

      // Should call the original metro middleware (passthrough)
      expect(metroMiddleware).toHaveBeenCalledWith(req, res, next);
      expect(mockMiddleware).not.toHaveBeenCalled();
    });

    it('applies existing enhanceMiddleware when present', () => {
      const existingEnhanced: MetroMiddleware = jest.fn();
      const existingEnhance = jest.fn().mockReturnValue(existingEnhanced);

      const config: MetroConfig = {
        server: {
          enhanceMiddleware: existingEnhance,
        },
      };

      const result = withRnIconify(config);

      const metroMiddleware: MetroMiddleware = jest.fn();
      const server = { fake: true };
      const wrappedMiddleware = result.server!.enhanceMiddleware!(metroMiddleware, server);

      // Verify existing enhanceMiddleware was called with original args
      expect(existingEnhance).toHaveBeenCalledWith(metroMiddleware, server);

      const req = createMockReq('/other-path');
      const res = createMockRes();
      const next = jest.fn();

      wrappedMiddleware(req, res, next);

      // Should call the enhanced middleware (from existing enhanceMiddleware), not the raw metro one
      expect(existingEnhanced).toHaveBeenCalledWith(req, res, next);
      expect(metroMiddleware).not.toHaveBeenCalled();
      expect(mockMiddleware).not.toHaveBeenCalled();
    });

    it('routes /__rn_iconify_log to rn-iconify middleware', () => {
      const result = withRnIconify({});

      const metroMiddleware: MetroMiddleware = jest.fn();
      const wrappedMiddleware = result.server!.enhanceMiddleware!(metroMiddleware, {});

      const req = createMockReq('/__rn_iconify_log');
      const res = createMockRes();
      const next = jest.fn();

      wrappedMiddleware(req, res, next);

      expect(mockMiddleware).toHaveBeenCalledWith(req, res, next);
      expect(metroMiddleware).not.toHaveBeenCalled();
    });

    it('routes /__rn_iconify_status to rn-iconify middleware', () => {
      const result = withRnIconify({});

      const metroMiddleware: MetroMiddleware = jest.fn();
      const wrappedMiddleware = result.server!.enhanceMiddleware!(metroMiddleware, {});

      const req = createMockReq('/__rn_iconify_status');
      const res = createMockRes();
      const next = jest.fn();

      wrappedMiddleware(req, res, next);

      expect(mockMiddleware).toHaveBeenCalledWith(req, res, next);
      expect(metroMiddleware).not.toHaveBeenCalled();
    });

    it('passes non-iconify URLs through to enhanced middleware', () => {
      const result = withRnIconify({});

      const metroMiddleware: MetroMiddleware = jest.fn();
      const wrappedMiddleware = result.server!.enhanceMiddleware!(metroMiddleware, {});

      const req = createMockReq('/bundle.js');
      const res = createMockRes();
      const next = jest.fn();

      wrappedMiddleware(req, res, next);

      expect(metroMiddleware).toHaveBeenCalledWith(req, res, next);
      expect(mockMiddleware).not.toHaveBeenCalled();
    });

    it('passes URLs with similar prefixes through (not intercepted)', () => {
      const result = withRnIconify({});

      const metroMiddleware: MetroMiddleware = jest.fn();
      const wrappedMiddleware = result.server!.enhanceMiddleware!(metroMiddleware, {});

      // Similar but not exact match
      const req = createMockReq('/__rn_iconify_log/extra');
      const res = createMockRes();
      const next = jest.fn();

      wrappedMiddleware(req, res, next);

      expect(metroMiddleware).toHaveBeenCalledWith(req, res, next);
      expect(mockMiddleware).not.toHaveBeenCalled();
    });

    it('routes iconify URLs even when existing enhanceMiddleware is present', () => {
      const existingEnhanced: MetroMiddleware = jest.fn();
      const existingEnhance = jest.fn().mockReturnValue(existingEnhanced);

      const config: MetroConfig = {
        server: {
          enhanceMiddleware: existingEnhance,
        },
      };

      const result = withRnIconify(config);

      const metroMiddleware: MetroMiddleware = jest.fn();
      const wrappedMiddleware = result.server!.enhanceMiddleware!(metroMiddleware, {});

      const req = createMockReq('/__rn_iconify_log');
      const res = createMockRes();
      const next = jest.fn();

      wrappedMiddleware(req, res, next);

      // Should go to our middleware, not the existing enhanced one
      expect(mockMiddleware).toHaveBeenCalledWith(req, res, next);
      expect(existingEnhanced).not.toHaveBeenCalled();
    });
  });

  describe('rn-iconify/bundled-icons', () => {
    const context = (resolveRequest = jest.fn()): MetroResolutionContext => ({ resolveRequest });

    it('resolves the module to the application bundle', () => {
      const result = withRnIconify({ projectRoot: '/app' });

      expect(result.resolver!.resolveRequest!(context(), BUNDLED_ICONS_MODULE, 'ios')).toEqual({
        type: 'sourceFile',
        filePath: path.join('/app', '.rn-iconify', 'icons.js'),
      });
    });

    it("follows the Babel plugin's output directory", () => {
      const result = withRnIconify({ projectRoot: '/app' }, { outputDir: 'icon-cache' });

      expect(result.resolver!.resolveRequest!(context(), BUNDLED_ICONS_MODULE, null)).toEqual({
        type: 'sourceFile',
        filePath: path.join('/app', 'icon-cache', 'icons.js'),
      });
    });

    it('hands every other module to the resolver it wrapped', () => {
      const existing = jest.fn().mockReturnValue({ type: 'sourceFile', filePath: '/elsewhere.js' });
      const result = withRnIconify({ projectRoot: '/app', resolver: { resolveRequest: existing } });
      const ctx = context();

      expect(result.resolver!.resolveRequest!(ctx, 'react', 'ios')).toEqual({
        type: 'sourceFile',
        filePath: '/elsewhere.js',
      });
      expect(existing).toHaveBeenCalledWith(ctx, 'react', 'ios');
    });

    it("falls back to Metro's own resolution when it wrapped none", () => {
      const metroResolve = jest.fn().mockReturnValue({ type: 'empty' });
      const result = withRnIconify({ projectRoot: '/app' });
      const ctx = context(metroResolve);

      result.resolver!.resolveRequest!(ctx, 'react', 'android');

      expect(metroResolve).toHaveBeenCalledWith(ctx, 'react', 'android');
    });

    it('creates an empty bundle module when the plugin has not written one', () => {
      withRnIconify({ projectRoot: '/app-without-bundle' });

      expect(mockWriteFileIfChanged).toHaveBeenCalledWith(
        path.join('/app-without-bundle', '.rn-iconify', 'icons.js'),
        expect.stringContaining('"count":0')
      );
    });

    it('leaves an existing bundle module alone', () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-iconify-metro-'));
      fs.mkdirSync(path.join(root, '.rn-iconify'));
      fs.writeFileSync(path.join(root, '.rn-iconify', 'icons.js'), 'module.exports = {};');
      try {
        withRnIconify({ projectRoot: root });

        expect(mockWriteFileIfChanged).not.toHaveBeenCalled();
      } finally {
        fs.rmSync(root, { recursive: true, force: true });
      }
    });
  });
});
