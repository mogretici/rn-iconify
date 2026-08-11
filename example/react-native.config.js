const path = require('path');
const pkg = require('../package.json');

/**
 * The library is one directory up rather than installed, so autolinking has no
 * package in node_modules to find. Without this the example built and ran, but
 * without the native module in it — which is how it went unnoticed that the
 * native module was never linked anywhere at all.
 */
module.exports = {
  dependencies: {
    [pkg.name]: {
      root: path.join(__dirname, '..'),
      platforms: {
        // Codegen fails to resolve the platforms unless they are named.
        ios: {},
        android: {},
      },
    },
  },
};
