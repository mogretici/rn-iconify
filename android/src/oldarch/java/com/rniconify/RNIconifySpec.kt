/**
 * RNIconify - Bridge Module Spec (Old Architecture)
 */

package com.rniconify

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReadableArray

/**
 * Old Architecture stand-in for the spec codegen generates for the New
 * Architecture. It declares the same members, so the module overrides one
 * shape rather than two and either source set compiles the same file.
 *
 * `getConstants` is final on the generated spec, which is why constants are
 * reached through `getTypedExportedConstants` on both.
 */
abstract class RNIconifySpec(context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {

    abstract fun prefetchIcons(icons: ReadableArray, promise: Promise)

    abstract fun getCacheStats(promise: Promise)

    abstract fun clearCache(promise: Promise)

    abstract fun isCached(iconName: String): Boolean

    protected abstract fun getTypedExportedConstants(): Map<String, Any>

    override fun getConstants(): MutableMap<String, Any> =
        getTypedExportedConstants().toMutableMap()
}
