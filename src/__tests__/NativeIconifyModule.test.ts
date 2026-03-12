/**
 * NativeIconifyModule Tests
 * Tests for getNativeIconifyModule, getEnforcingNativeIconifyModule, and default export
 */

// We use jest.resetModules + require to get fresh imports per test,
// so the TurboModuleRegistry mock is set up inline.

const mockGet = jest.fn();
const mockGetEnforcing = jest.fn();

jest.mock('react-native', () => ({
  TurboModuleRegistry: {
    get: mockGet,
    getEnforcing: mockGetEnforcing,
  },
}));

function loadModule() {
  return require('../native/NativeIconifyModule');
}

describe('NativeIconifyModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNativeIconifyModule', () => {
    it('returns the native module when available', () => {
      const mockModule = {
        prefetchIcons: jest.fn(),
        getCacheStats: jest.fn(),
        clearCache: jest.fn(),
        isCached: jest.fn(),
        getConstants: jest.fn(),
      };
      mockGet.mockReturnValue(mockModule);

      const { getNativeIconifyModule } = loadModule();
      const result = getNativeIconifyModule();

      expect(mockGet).toHaveBeenCalledWith('RNIconify');
      expect(result).toBe(mockModule);
    });

    it('returns null when native module is not available', () => {
      mockGet.mockReturnValue(null);

      const { getNativeIconifyModule } = loadModule();
      const result = getNativeIconifyModule();

      expect(mockGet).toHaveBeenCalledWith('RNIconify');
      expect(result).toBeNull();
    });

    it('returns null when TurboModuleRegistry.get throws', () => {
      mockGet.mockImplementation(() => {
        throw new Error('TurboModules not available');
      });

      const { getNativeIconifyModule } = loadModule();
      const result = getNativeIconifyModule();

      expect(result).toBeNull();
    });
  });

  describe('getEnforcingNativeIconifyModule', () => {
    it('returns the native module when available', () => {
      const mockModule = {
        prefetchIcons: jest.fn(),
        getCacheStats: jest.fn(),
        clearCache: jest.fn(),
        isCached: jest.fn(),
        getConstants: jest.fn(),
      };
      mockGetEnforcing.mockReturnValue(mockModule);

      const { getEnforcingNativeIconifyModule } = loadModule();
      const result = getEnforcingNativeIconifyModule();

      expect(mockGetEnforcing).toHaveBeenCalledWith('RNIconify');
      expect(result).toBe(mockModule);
    });

    it('throws when native module is not available', () => {
      mockGetEnforcing.mockImplementation(() => {
        throw new Error("TurboModule 'RNIconify' not found");
      });

      const { getEnforcingNativeIconifyModule } = loadModule();

      expect(() => getEnforcingNativeIconifyModule()).toThrow("TurboModule 'RNIconify' not found");
    });
  });

  describe('default export', () => {
    it('has a lazy module getter that calls getEnforcingNativeIconifyModule', () => {
      const mockModule = {
        prefetchIcons: jest.fn(),
        getCacheStats: jest.fn(),
        clearCache: jest.fn(),
        isCached: jest.fn(),
        getConstants: jest.fn(),
      };
      mockGetEnforcing.mockReturnValue(mockModule);

      const defaultExport = loadModule().default;

      // Accessing .module should trigger the lazy getter
      const result = defaultExport.module;

      expect(mockGetEnforcing).toHaveBeenCalledWith('RNIconify');
      expect(result).toBe(mockModule);
    });

    it('throws when accessing module if native module is unavailable', () => {
      mockGetEnforcing.mockImplementation(() => {
        throw new Error("TurboModule 'RNIconify' not found");
      });

      const defaultExport = loadModule().default;

      expect(() => defaultExport.module).toThrow("TurboModule 'RNIconify' not found");
    });

    it('calls getEnforcing each time module is accessed (lazy, not cached)', () => {
      const mockModule = { prefetchIcons: jest.fn() };
      mockGetEnforcing.mockReturnValue(mockModule);

      const defaultExport = loadModule().default;

      // Access module twice
      defaultExport.module;
      defaultExport.module;

      // Should call getEnforcing each time (it's a getter, not a cached value)
      expect(mockGetEnforcing).toHaveBeenCalledTimes(2);
    });
  });
});
