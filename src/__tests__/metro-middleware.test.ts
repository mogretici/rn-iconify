/**
 * Metro Dev Server Middleware Tests
 */

import * as fs from 'fs';
import type { IncomingMessage, ServerResponse } from 'http';
import { createDevServerMiddleware } from '../metro/devServerMiddleware';

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  renameSync: jest.fn(),
}));

const mockExistsSync = fs.existsSync as jest.Mock;
const mockReadFileSync = fs.readFileSync as jest.Mock;
const mockWriteFileSync = fs.writeFileSync as jest.Mock;
const mockMkdirSync = fs.mkdirSync as jest.Mock;
const mockRenameSync = fs.renameSync as jest.Mock;

function createMockRequest(method: string, url: string, body?: string): IncomingMessage {
  const req = {
    method,
    url,
    on: jest.fn((event: string, cb: (chunk?: Buffer) => void) => {
      if (event === 'data' && body) {
        cb(Buffer.from(body));
      }
      if (event === 'end') {
        cb();
      }
      return req;
    }),
  } as unknown as IncomingMessage;
  return req;
}

function createMockResponse(): ServerResponse & {
  _statusCode: number;
  _headers: Record<string, string>;
  _body: string;
} {
  const res = {
    _statusCode: 200,
    _headers: {} as Record<string, string>,
    _body: '',
    writeHead: jest.fn(function (
      this: { _statusCode: number; _headers: Record<string, string> },
      code: number,
      headers?: Record<string, string>
    ) {
      this._statusCode = code;
      if (headers) this._headers = headers;
    }),
    end: jest.fn(function (this: { _body: string }, body?: string) {
      if (body) this._body = body;
    }),
  } as unknown as ServerResponse & {
    _statusCode: number;
    _headers: Record<string, string>;
    _body: string;
  };
  return res;
}

describe('Metro Dev Server Middleware', () => {
  let middleware: ReturnType<typeof createDevServerMiddleware>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReturnValue(false);
    middleware = createDevServerMiddleware({ outputDir: '/test/.rn-iconify' });
  });

  describe('POST /__rn_iconify_log', () => {
    it('adds a new icon to usage.json', async () => {
      mockExistsSync.mockReturnValue(false);

      const req = createMockRequest(
        'POST',
        '/__rn_iconify_log',
        JSON.stringify({ icon: 'ion:shirt' })
      );
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
      expect(mockWriteFileSync).toHaveBeenCalled();
      expect(mockRenameSync).toHaveBeenCalled();

      // Verify the written content contains the icon
      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      const parsed = JSON.parse(writtenContent);
      expect(parsed.icons).toContain('ion:shirt');
      expect(parsed.version).toBe('1.0.0');
    });

    it('deduplicates icons', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          version: '1.0.0',
          icons: ['ion:shirt'],
          updatedAt: '2026-01-01',
        })
      );

      const req = createMockRequest(
        'POST',
        '/__rn_iconify_log',
        JSON.stringify({ icon: 'ion:shirt' })
      );
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
      // Should NOT write since icon already exists
      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });

    it('rejects invalid icon names', async () => {
      const req = createMockRequest(
        'POST',
        '/__rn_iconify_log',
        JSON.stringify({ icon: 'invalid' })
      );
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.writeHead).toHaveBeenCalledWith(400, expect.any(Object));
    });

    it('rejects non-string icon values', async () => {
      const req = createMockRequest('POST', '/__rn_iconify_log', JSON.stringify({ icon: 123 }));
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.writeHead).toHaveBeenCalledWith(400, expect.any(Object));
    });

    it('creates output directory if missing', async () => {
      mockExistsSync.mockImplementation((p: string) => {
        if (p.endsWith('usage.json')) return false;
        if (p.endsWith('.rn-iconify')) return false;
        return false;
      });

      const req = createMockRequest(
        'POST',
        '/__rn_iconify_log',
        JSON.stringify({ icon: 'mdi:home' })
      );
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(mockMkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });
  });

  describe('GET /__rn_iconify_status', () => {
    it('returns usage stats', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          version: '1.0.0',
          icons: ['ion:home', 'mdi:settings'],
          updatedAt: '2026-01-01',
        })
      );

      const req = createMockRequest('GET', '/__rn_iconify_status');
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
      const body = JSON.parse(res._body);
      expect(body.iconCount).toBe(2);
      expect(body.icons).toEqual(['ion:home', 'mdi:settings']);
    });

    it('returns empty stats when no file exists', async () => {
      mockExistsSync.mockReturnValue(false);

      const req = createMockRequest('GET', '/__rn_iconify_status');
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      const body = JSON.parse(res._body);
      expect(body.iconCount).toBe(0);
      expect(body.icons).toEqual([]);
    });
  });

  describe('other routes', () => {
    it('passes through to next middleware', async () => {
      const req = createMockRequest('GET', '/some-other-path');
      const res = createMockResponse();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.writeHead).not.toHaveBeenCalled();
    });
  });
});
