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
        // Cleanup OkHttpClient resources
        httpClient.dispatcher.executorService.shutdown()
        httpClient.connectionPool.evictAll()
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

    /**
     * Iconify API Response data classes
     */
    private data class IconifyResponse(
        val prefix: String,
        val icons: Map<String, IconData>,
        val width: Int? = null,
        val height: Int? = null,
        val not_found: List<String>? = null
    )

    private data class IconData(
        val body: String,
        val width: Int? = null,
        val height: Int? = null,
        val left: Int? = null,
        val top: Int? = null,
        val rotate: Int? = null,
        val hFlip: Boolean? = null,
        val vFlip: Boolean? = null
    )

    /**
     * Build SVG string from Iconify icon data (matches JS implementation)
     */
    private fun buildSvg(data: IconData, defaultWidth: Int, defaultHeight: Int): String {
        val width = data.width ?: defaultWidth
        val height = data.height ?: defaultHeight
        val left = data.left ?: 0
        val top = data.top ?: 0
        val viewBox = "$left $top $width $height"

        var body = data.body

        // Apply transformations if needed
        val transforms = mutableListOf<String>()

        data.rotate?.let { rotate ->
            if (rotate != 0) {
                val rotation = rotate * 90
                transforms.add("rotate($rotation ${width / 2} ${height / 2})")
            }
        }

        if (data.hFlip == true || data.vFlip == true) {
            val scaleX = if (data.hFlip == true) -1 else 1
            val scaleY = if (data.vFlip == true) -1 else 1
            val translateX = if (data.hFlip == true) width else 0
            val translateY = if (data.vFlip == true) height else 0
            transforms.add("translate($translateX $translateY) scale($scaleX $scaleY)")
        }

        if (transforms.isNotEmpty()) {
            val transform = transforms.joinToString(" ")
            body = "<g transform=\"$transform\">$body</g>"
        }

        return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="$viewBox" width="$width" height="$height">$body</svg>"""
    }

    /**
     * Fetch single icon using JSON API (consistent with JS implementation)
     */
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

        // Fetch from Iconify JSON API (consistent with JS implementation)
        val url = "https://api.iconify.design/$prefix.json?icons=$iconName"
        val request = Request.Builder()
            .url(url)
            .build()

        withContext(Dispatchers.IO) {
            httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    throw Exception("HTTP ${response.code}")
                }

                val body = response.body?.string()
                    ?: throw Exception("Empty response")

                // Parse JSON response
                val gson = com.google.gson.Gson()
                val iconifyResponse = gson.fromJson(body, IconifyResponse::class.java)

                val iconData = iconifyResponse.icons[iconName]
                    ?: throw Exception("Icon '$name' not found in API response")

                // Build SVG from icon data
                val defaultWidth = iconifyResponse.width ?: 24
                val defaultHeight = iconifyResponse.height ?: 24
                val svg = buildSvg(iconData, defaultWidth, defaultHeight)

                // Cache the SVG data
                cacheFile.writeText(svg)
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
