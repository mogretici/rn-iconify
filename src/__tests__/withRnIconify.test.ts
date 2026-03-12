/**
 * withRnIconify Metro Config Wrapper Tests
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { MetroConfig, MetroMiddleware } from '../metro/types';

// Mock the devServerMiddleware module
jest.mock('../metro/devServerMiddleware', () => ({
  createDevServerMiddleware: jest.fn(),
}));

import { createDevServerMiddleware } from '../metro/devServerMiddleware';
import { withRnIconify } from '../metro/withRnIconify';

const mockCreateDevServerMiddleware = createDevServerMiddleware as jest.Mock;

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
    expect(result.resolver).toEqual({ sourceExts: ['ts', 'tsx'] });
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
});
