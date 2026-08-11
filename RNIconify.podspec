require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = "RNIconify"
  s.version      = package['version']
  s.summary      = package['description']
  s.homepage     = package['homepage']
  s.license      = package['license']
  s.authors      = package['author']

  # Follows React Native's own minimum rather than a number that
  # claimed support for versions React Native itself had dropped.
  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => package['repository']['url'], :tag => "v#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"

  # React Native dependency
  s.dependency "React-Core"

  # Enable TurboModules
  install_modules_dependencies(s)

  # Swift settings
  s.swift_version = "5.0"

  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES"
  }
end
