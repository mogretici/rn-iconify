const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the library source
config.watchFolders = [workspaceRoot];

// Sadece example'ın node_modules'unu kullan
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Root'un node_modules'undaki çakışan paketleri engelle
// Regex'te özel karakterleri escape et
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rootNodeModules = escapeRegex(path.join(workspaceRoot, 'node_modules'));

config.resolver.blockList = [
  new RegExp(`${rootNodeModules}/react($|/.*)`),
  new RegExp(`${rootNodeModules}/react-native($|/.*)`),
  new RegExp(`${rootNodeModules}/react-native-svg($|/.*)`),
  new RegExp(`${rootNodeModules}/react-native-mmkv($|/.*)`),
];

module.exports = config;
