/**
 * RNIconify - Native Android Module
 * Provides background prefetching and cache management for rn-iconify
 */

package com.rniconify

import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import kotlinx.coroutines.*
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

@ReactModule(name = RNIconifyModule.NAME)
class RNIconifyModule(reactContext: ReactApplicationContext) :
    RNIconifySpec(reactContext) {

    companion object {
        const val NAME = "RNIconify"
        private const val CACHE_DIR_NAME = "rn-iconify"
        private const val MAX_CACHE_SIZE = 100 * 1024 * 1024L // 100MB
        private const val VERSION = "1.0.0"
    }

    private val httpClient: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private val cacheDirectory: File by lazy {
        File(reactApplicationContext.cacheDir, CACHE_DIR_NAME).also {
            if (!it.exists()) it.mkdirs()
        }
    }

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val hitCount = AtomicInteger(0)
    private val missCount = AtomicInteger(0)

    override fun getName(): String = NAME

    override fun getConstants(): Map<String, Any> {
        return mapOf(
            "cacheDirectory" to cacheDirectory.absolutePath,
            "maxCacheSize" to MAX_CACHE_SIZE,
            "version" to VERSION
        )
    }

    override fun invalidate() {
        scope.cancel()
        super.invalidate()
    }

    /**
     * Prefetch multiple icons in background threads
     */
    @ReactMethod
    fun prefetchIcons(icons: ReadableArray, promise: Promise) {
        scope.launch {
            val iconList = (0 until icons.size()).map { icons.getString(it) ?: "" }
            val successIcons = mutableListOf<String>()
            val failedIcons = mutableListOf<String>()

            val jobs = iconList.map { icon ->
                async {
                    try {
                        fetchIcon(icon)
                        synchronized(successIcons) { successIcons.add(icon) }
                    } catch (e: Exception) {
                        synchronized(failedIcons) { failedIcons.add(icon) }
                    }
                }
            }

            jobs.awaitAll()

            val result = Arguments.createMap().apply {
                putArray("success", Arguments.fromList(successIcons))
                putArray("failed", Arguments.fromList(failedIcons))
            }

            promise.resolve(result)
        }
    }

    /**
     * Get cache statistics
     */
    @ReactMethod
    fun getCacheStats(promise: Promise) {
        scope.launch {
            var diskCount = 0
            var diskSizeBytes = 0L

            cacheDirectory.listFiles()?.forEach { file ->
                if (file.isFile) {
                    diskCount++
                    diskSizeBytes += file.length()
                }
            }

            val totalRequests = hitCount.get() + missCount.get()
            val hitRate = if (totalRequests > 0) {
                hitCount.get().toDouble() / totalRequests.toDouble()
            } else 0.0

            val result = Arguments.createMap().apply {
                putInt("memoryCount", 0) // Memory cache managed by JS/MMKV
                putInt("diskCount", diskCount)
                putDouble("diskSizeBytes", diskSizeBytes.toDouble())
                putDouble("hitRate", hitRate)
            }

            promise.resolve(result)
        }
    }

    /**
     * Clear all caches
     */
    @ReactMethod
    fun clearCache(promise: Promise) {
        scope.launch {
            try {
                cacheDirectory.listFiles()?.forEach { it.delete() }
                hitCount.set(0)
                missCount.set(0)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("ERROR", "Failed to clear cache: ${e.message}", e)
            }
        }
    }

    /**
     * Check if icon is cached (synchronous)
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun isCached(iconName: String): Boolean {
        val cacheFile = getCacheFile(iconName)
        return cacheFile.exists()
    }

    // MARK: - Private Methods

    private suspend fun fetchIcon(name: String) {
        val parts = name.split(":")
        require(parts.size == 2) { "Invalid icon name format: $name" }

        val prefix = parts[0]
        val iconName = parts[1]

        val cacheFile = getCacheFile(name)

        // Check cache first
        if (cacheFile.exists()) {
            hitCount.incrementAndGet()
            return
        }

        missCount.incrementAndGet()

        // Fetch from Iconify API
        val url = "https://api.iconify.design/$prefix/$iconName.svg"
        val request = Request.Builder()
            .url(url)
            .build()

        withContext(Dispatchers.IO) {
            httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    throw Exception("HTTP ${response.code}")
                }

                val body = response.body?.bytes()
                    ?: throw Exception("Empty response")

                // Cache the SVG data
                cacheFile.writeBytes(body)
            }
        }
    }

    private fun getCacheFile(iconName: String): File {
        val safeFileName = iconName
            .replace(":", "_")
            .replace("/", "_")
        return File(cacheDirectory, "$safeFileName.svg")
    }
}
