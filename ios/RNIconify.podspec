require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name         = "RNIconify"
  s.version      = package['version']
  s.summary      = package['description']
  s.homepage     = package['homepage']
  s.license      = package['license']
  s.authors      = package['author']

  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => package['repository']['url'], :tag => "v#{s.version}" }

  s.source_files = "*.{h,m,mm,swift}"

  # React Native dependency
  s.dependency "React-Core"

  # Enable TurboModules
  install_modules_dependencies(s)

  # Swift settings
  s.swift_version = "5.0"

  # Compiler flags for C++
  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "SWIFT_OBJC_BRIDGING_HEADER" => "$(PODS_TARGET_SRCROOT)/RNIconify-Bridging-Header.h"
  }
end
