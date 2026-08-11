/**
 * The codegen spec file.
 *
 * React Native's codegen reads this file to generate the native interface and
 * requires exactly one TurboModuleRegistry call in it. Two extra accessors
 * lived here, nothing used them, and their presence stopped codegen from
 * running at all.
 */

// We use jest.resetModules + require to get fresh imports per test,
// so the TurboModuleRegistry mock is set up inline.

const mockGet = jest.fn();

jest.mock('react-native', () => ({
  TurboModuleRegistry: {
    get: mockGet,
  },
}));

function loadModule() {
  return require('../native/NativeRNIconify');
}

describe('NativeRNIconify', () => {
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
});
