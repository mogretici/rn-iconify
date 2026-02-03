/**
 * rn-iconify Metro Plugin
 *
 * Adds dev server middleware for runtime icon usage learning.
 *
 * Usage in metro.config.js:
 *   const { withRnIconify } = require('rn-iconify/metro');
 *   module.exports = withRnIconify(config);
 */

// Re-export the Metro plugin from the built output
module.exports = require('./lib/commonjs/metro/index.js');
