/**
 * rn-iconify Babel Plugin
 *
 * Build-time icon bundling for 0ms first render.
 *
 * Usage in babel.config.js:
 *   plugins: ['rn-iconify/babel']
 *
 * Or with options:
 *   plugins: [['rn-iconify/babel', { verbose: true }]]
 */

// Re-export the Babel plugin from the built output
module.exports = require('./lib/commonjs/babel/index.js').default;
