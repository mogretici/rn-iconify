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
  private let statsLock = NSLock() // Thread safety for hit/miss counts

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

  deinit {
    // Cleanup URLSession resources
    urlSession.invalidateAndCancel()
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

      self.statsLock.lock()
      let totalRequests = self.hitCount + self.missCount
      let hitRate = totalRequests > 0 ? Double(self.hitCount) / Double(totalRequests) : 0.0
      self.statsLock.unlock()

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

        self.statsLock.lock()
        self.hitCount = 0
        self.missCount = 0
        self.statsLock.unlock()

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

  /**
   * Iconify API Response Structure
   */
  private struct IconifyResponse: Codable {
    let prefix: String
    let icons: [String: IconData]
    let width: Int?
    let height: Int?
    let notFound: [String]?

    enum CodingKeys: String, CodingKey {
      case prefix, icons, width, height
      case notFound = "not_found"
    }
  }

  private struct IconData: Codable {
    let body: String
    let width: Int?
    let height: Int?
    let left: Int?
    let top: Int?
    let rotate: Int?
    let hFlip: Bool?
    let vFlip: Bool?
  }

  /**
   * Build SVG string from Iconify icon data (matches JS implementation)
   */
  private func buildSvg(from data: IconData, defaultWidth: Int, defaultHeight: Int) -> String {
    let width = data.width ?? defaultWidth
    let height = data.height ?? defaultHeight
    let left = data.left ?? 0
    let top = data.top ?? 0
    let viewBox = "\(left) \(top) \(width) \(height)"

    var body = data.body

    // Apply transformations if needed
    var transforms: [String] = []

    if let rotate = data.rotate, rotate != 0 {
      let rotation = rotate * 90
      transforms.append("rotate(\(rotation) \(width / 2) \(height / 2))")
    }

    if data.hFlip == true || data.vFlip == true {
      let scaleX = data.hFlip == true ? -1 : 1
      let scaleY = data.vFlip == true ? -1 : 1
      let translateX = data.hFlip == true ? width : 0
      let translateY = data.vFlip == true ? height : 0
      transforms.append("translate(\(translateX) \(translateY)) scale(\(scaleX) \(scaleY))")
    }

    if !transforms.isEmpty {
      let transform = transforms.joined(separator: " ")
      body = "<g transform=\"\(transform)\">\(body)</g>"
    }

    return """
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="\(viewBox)" width="\(width)" height="\(height)">\(body)</svg>
    """
  }

  /**
   * Fetch single icon using JSON API (consistent with JS implementation)
   */
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
      statsLock.lock()
      hitCount += 1
      statsLock.unlock()
      completion(.success(cachedData))
      return
    }

    statsLock.lock()
    missCount += 1
    statsLock.unlock()

    // Fetch from Iconify JSON API (consistent with JS implementation)
    let urlString = "https://api.iconify.design/\(prefix).json?icons=\(iconName)"
    guard let url = URL(string: urlString) else {
      completion(.failure(NSError(
        domain: "RNIconify",
        code: 2,
        userInfo: [NSLocalizedDescriptionKey: "Invalid URL: \(urlString)"]
      )))
      return
    }

    urlSession.dataTask(with: url) { [weak self] data, response, error in
      guard let self = self else { return }

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

      // Parse JSON response
      do {
        let iconifyResponse = try JSONDecoder().decode(IconifyResponse.self, from: data)

        guard let iconData = iconifyResponse.icons[iconName] else {
          completion(.failure(NSError(
            domain: "RNIconify",
            code: 5,
            userInfo: [NSLocalizedDescriptionKey: "Icon '\(name)' not found in API response"]
          )))
          return
        }

        // Build SVG from icon data
        let defaultWidth = iconifyResponse.width ?? 24
        let defaultHeight = iconifyResponse.height ?? 24
        let svg = self.buildSvg(from: iconData, defaultWidth: defaultWidth, defaultHeight: defaultHeight)

        guard let svgData = svg.data(using: .utf8) else {
          completion(.failure(NSError(
            domain: "RNIconify",
            code: 6,
            userInfo: [NSLocalizedDescriptionKey: "Failed to encode SVG"]
          )))
          return
        }

        // Cache the SVG data
        try? svgData.write(to: cacheFile)

        completion(.success(svgData))
      } catch {
        completion(.failure(NSError(
          domain: "RNIconify",
          code: 7,
          userInfo: [NSLocalizedDescriptionKey: "Failed to parse API response: \(error.localizedDescription)"]
        )))
      }
    }.resume()
  }

  private func cacheFileURL(for iconName: String) -> URL {
    let safeFileName = iconName
      .replacingOccurrences(of: ":", with: "_")
      .replacingOccurrences(of: "/", with: "_")
    return cacheDirectory.appendingPathComponent("\(safeFileName).svg")
  }
}
