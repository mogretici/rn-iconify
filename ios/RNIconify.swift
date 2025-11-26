/**
 * RNIconify - Native iOS Module
 * Provides background prefetching and cache management for rn-iconify
 */

import Foundation

@objc(RNIconify)
class RNIconify: NSObject {

  // MARK: - Properties

  private let urlSession: URLSession
  private let cacheDirectory: URL
  private var hitCount: Int = 0
  private var missCount: Int = 0

  // MARK: - Initialization

  override init() {
    // Configure URLSession for background fetching
    let config = URLSessionConfiguration.default
    config.timeoutIntervalForRequest = 30
    config.timeoutIntervalForResource = 60
    config.httpMaximumConnectionsPerHost = 6
    self.urlSession = URLSession(configuration: config)

    // Get cache directory
    let paths = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)
    self.cacheDirectory = paths[0].appendingPathComponent("rn-iconify", isDirectory: true)

    super.init()

    // Create cache directory if needed
    try? FileManager.default.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
  }

  // MARK: - React Native Bridge

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc static func moduleName() -> String {
    return "RNIconify"
  }

  // MARK: - Module Methods

  /**
   * Prefetch multiple icons in background threads
   */
  @objc func prefetchIcons(_ icons: [String],
                           resolve: @escaping RCTPromiseResolveBlock,
                           reject: @escaping RCTPromiseRejectBlock) {

    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
      guard let self = self else {
        reject("ERROR", "Module deallocated", nil)
        return
      }

      var successIcons: [String] = []
      var failedIcons: [String] = []
      let lock = NSLock()
      let group = DispatchGroup()

      for icon in icons {
        group.enter()

        self.fetchIcon(icon) { result in
          lock.lock()
          switch result {
          case .success:
            successIcons.append(icon)
          case .failure:
            failedIcons.append(icon)
          }
          lock.unlock()
          group.leave()
        }
      }

      group.notify(queue: .main) {
        resolve([
          "success": successIcons,
          "failed": failedIcons
        ])
      }
    }
  }

  /**
   * Get cache statistics
   */
  @objc func getCacheStats(_ resolve: @escaping RCTPromiseResolveBlock,
                           reject: @escaping RCTPromiseRejectBlock) {

    DispatchQueue.global(qos: .utility).async { [weak self] in
      guard let self = self else {
        reject("ERROR", "Module deallocated", nil)
        return
      }

      var diskCount = 0
      var diskSizeBytes: Int64 = 0

      if let enumerator = FileManager.default.enumerator(
        at: self.cacheDirectory,
        includingPropertiesForKeys: [.fileSizeKey],
        options: [.skipsHiddenFiles]
      ) {
        for case let fileURL as URL in enumerator {
          if let resourceValues = try? fileURL.resourceValues(forKeys: [.fileSizeKey]),
             let fileSize = resourceValues.fileSize {
            diskCount += 1
            diskSizeBytes += Int64(fileSize)
          }
        }
      }

      let totalRequests = self.hitCount + self.missCount
      let hitRate = totalRequests > 0 ? Double(self.hitCount) / Double(totalRequests) : 0.0

      DispatchQueue.main.async {
        resolve([
          "memoryCount": 0, // Memory cache is managed by JS/MMKV
          "diskCount": diskCount,
          "diskSizeBytes": diskSizeBytes,
          "hitRate": hitRate
        ])
      }
    }
  }

  /**
   * Clear all caches
   */
  @objc func clearCache(_ resolve: @escaping RCTPromiseResolveBlock,
                        reject: @escaping RCTPromiseRejectBlock) {

    DispatchQueue.global(qos: .utility).async { [weak self] in
      guard let self = self else {
        reject("ERROR", "Module deallocated", nil)
        return
      }

      do {
        let contents = try FileManager.default.contentsOfDirectory(
          at: self.cacheDirectory,
          includingPropertiesForKeys: nil
        )

        for fileURL in contents {
          try FileManager.default.removeItem(at: fileURL)
        }

        self.hitCount = 0
        self.missCount = 0

        DispatchQueue.main.async {
          resolve(nil)
        }
      } catch {
        DispatchQueue.main.async {
          reject("ERROR", "Failed to clear cache: \(error.localizedDescription)", error)
        }
      }
    }
  }

  /**
   * Check if icon is cached (synchronous)
   * Returns NSNumber for ObjC bridge compatibility
   */
  @objc func isCached(_ iconName: String) -> NSNumber {
    let cacheFile = cacheFileURL(for: iconName)
    return NSNumber(value: FileManager.default.fileExists(atPath: cacheFile.path))
  }

  /**
   * Get module constants
   */
  @objc func constantsToExport() -> [String: Any] {
    return [
      "cacheDirectory": cacheDirectory.path,
      "maxCacheSize": 100 * 1024 * 1024, // 100MB
      "version": "1.0.0"
    ]
  }

  // MARK: - Private Methods

  private func fetchIcon(_ name: String, completion: @escaping (Result<Data, Error>) -> Void) {
    // Parse icon name (prefix:name)
    let parts = name.split(separator: ":")
    guard parts.count == 2 else {
      completion(.failure(NSError(
        domain: "RNIconify",
        code: 1,
        userInfo: [NSLocalizedDescriptionKey: "Invalid icon name format: \(name)"]
      )))
      return
    }

    let prefix = String(parts[0])
    let iconName = String(parts[1])

    // Check cache first
    let cacheFile = cacheFileURL(for: name)
    if FileManager.default.fileExists(atPath: cacheFile.path),
       let cachedData = try? Data(contentsOf: cacheFile) {
      hitCount += 1
      completion(.success(cachedData))
      return
    }

    missCount += 1

    // Fetch from Iconify API
    let urlString = "https://api.iconify.design/\(prefix)/\(iconName).svg"
    guard let url = URL(string: urlString) else {
      completion(.failure(NSError(
        domain: "RNIconify",
        code: 2,
        userInfo: [NSLocalizedDescriptionKey: "Invalid URL: \(urlString)"]
      )))
      return
    }

    urlSession.dataTask(with: url) { [weak self] data, response, error in
      if let error = error {
        completion(.failure(error))
        return
      }

      guard let httpResponse = response as? HTTPURLResponse else {
        completion(.failure(NSError(
          domain: "RNIconify",
          code: 3,
          userInfo: [NSLocalizedDescriptionKey: "Invalid response"]
        )))
        return
      }

      guard httpResponse.statusCode == 200 else {
        completion(.failure(NSError(
          domain: "RNIconify",
          code: httpResponse.statusCode,
          userInfo: [NSLocalizedDescriptionKey: "HTTP \(httpResponse.statusCode)"]
        )))
        return
      }

      guard let data = data else {
        completion(.failure(NSError(
          domain: "RNIconify",
          code: 4,
          userInfo: [NSLocalizedDescriptionKey: "Empty response"]
        )))
        return
      }

      // Cache the SVG data
      try? data.write(to: cacheFile)

      completion(.success(data))
    }.resume()
  }

  private func cacheFileURL(for iconName: String) -> URL {
    let safeFileName = iconName
      .replacingOccurrences(of: ":", with: "_")
      .replacingOccurrences(of: "/", with: "_")
    return cacheDirectory.appendingPathComponent("\(safeFileName).svg")
  }
}
