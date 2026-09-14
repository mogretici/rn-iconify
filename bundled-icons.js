/**
 * The icons the library reads when an application has not pointed
 * `rn-iconify/bundled-icons` at its own.
 *
 * `withRnIconify` (rn-iconify/metro) resolves this module to the application's
 * `.rn-iconify/icons.js`, which the Babel plugin keeps up to date. Without it,
 * this empty bundle is what `CacheManager` reads, and every icon comes from the
 * disk cache or the network — as it would with no bundle at all.
 */
module.exports = { version: '1.0.0', icons: {}, count: 0 };
