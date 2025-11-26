/* eslint-env jest */
/**
 * Jest Setup File
 * Mocks for native modules and global setup
 */

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => {
  const storage = new Map();

  return {
    MMKV: jest.fn().mockImplementation(() => ({
      getString: jest.fn((key) => storage.get(key)),
      set: jest.fn((key, value) => storage.set(key, value)),
      getNumber: jest.fn((key) => {
        const val = storage.get(key);
        return typeof val === 'number' ? val : undefined;
      }),
      getBoolean: jest.fn((key) => {
        const val = storage.get(key);
        return typeof val === 'boolean' ? val : undefined;
      }),
      contains: jest.fn((key) => storage.has(key)),
      delete: jest.fn((key) => storage.delete(key)),
      getAllKeys: jest.fn(() => Array.from(storage.keys())),
      clearAll: jest.fn(() => storage.clear()),
    })),
  };
});

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    SvgXml: jest.fn(({ xml, width, height, ...props }) =>
      React.createElement('SvgXml', { xml, width, height, ...props })
    ),
    Svg: jest.fn((props) => React.createElement('Svg', props)),
    Path: jest.fn((props) => React.createElement('Path', props)),
    G: jest.fn((props) => React.createElement('G', props)),
    Circle: jest.fn((props) => React.createElement('Circle', props)),
    Rect: jest.fn((props) => React.createElement('Rect', props)),
  };
});

// Mock fetch for Iconify API
global.fetch = jest.fn();

// Silence console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string') {
    // Skip React Native internal warnings
    if (args[0].includes('ReactNative')) return;
    // Skip native module warnings in test environment
    if (args[0].includes('[rn-iconify] Native module not available')) return;
  }
  originalWarn.apply(console, args);
};

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
