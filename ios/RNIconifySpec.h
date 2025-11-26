/**
 * RNIconify TurboModule Spec
 * Auto-generated header for New Architecture support
 */

#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTBridgeModule.h>
#import <ReactCommon/RCTTurboModule.h>

namespace facebook::react {

class JSI_EXPORT NativeRNIconifySpecJSI : public ObjCTurboModule {
public:
  NativeRNIconifySpecJSI(const ObjCTurboModule::InitParams &params);
};

} // namespace facebook::react

@protocol NativeRNIconifySpec <RCTBridgeModule, RCTTurboModule>

- (void)prefetchIcons:(NSArray<NSString *> *)icons
              resolve:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject;

- (void)getCacheStats:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject;

- (void)clearCache:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject;

- (NSNumber *)isCached:(NSString *)iconName;

- (NSDictionary *)getConstants;

@end

#endif // RCT_NEW_ARCH_ENABLED
