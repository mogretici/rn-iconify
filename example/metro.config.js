const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the library source
config.watchFolders = [workspaceRoot];

// Let Metro know where to resolve packages - ONLY example's node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Force Metro to resolve the library from dist (built version)
// and all shared dependencies from example app's node_modules
config.resolver.extraNodeModules = new Proxy(
  {
    'rn-iconify': path.resolve(workspaceRoot, 'dist'),
  },
  {
    get: (target, name) => {
      if (target.hasOwnProperty(name)) {
        return target[name];
      }
      // Fallback to example's node_modules for everything else
      return path.resolve(projectRoot, 'node_modules', name);
    },
  }
);

// Block the library's node_modules from being used
config.resolver.blockList = [
  new RegExp(`${workspaceRoot}/node_modules/react/.*`),
  new RegExp(`${workspaceRoot}/node_modules/react-native/.*`),
  new RegExp(`${workspaceRoot}/node_modules/react-native-svg/.*`),
  new RegExp(`${workspaceRoot}/node_modules/react-native-mmkv/.*`),
];

module.exports = config;
