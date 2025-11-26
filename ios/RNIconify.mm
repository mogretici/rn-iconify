/**
 * RNIconify - Objective-C++ Bridge
 * Connects Swift implementation to React Native Bridge/TurboModule
 */

#import <React/RCTBridgeModule.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTTurboModule.h>
#import <ReactCommon/RCTTurboModule.h>
#import "RNIconifySpec.h"
#endif

@interface RCT_EXTERN_MODULE(RNIconify, NSObject)

// Prefetch multiple icons in background
RCT_EXTERN_METHOD(prefetchIcons:(NSArray<NSString *> *)icons
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

// Get cache statistics
RCT_EXTERN_METHOD(getCacheStats:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

// Clear all caches
RCT_EXTERN_METHOD(clearCache:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

// Synchronous cache check
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(isCached:(NSString *)iconName)

// Export constants
+ (BOOL)requiresMainQueueSetup {
  return NO;
}

@end

#ifdef RCT_NEW_ARCH_ENABLED

// TurboModule implementation
@interface RNIconify () <NativeRNIconifySpec>
@end

@implementation RNIconify (TurboModule)

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeRNIconifySpecJSI>(params);
}

@end

#endif
