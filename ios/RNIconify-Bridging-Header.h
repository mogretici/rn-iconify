/**
 * RNIconify Bridging Header
 * Exposes React Native types to Swift
 */

#ifndef RNIconify_Bridging_Header_h
#define RNIconify_Bridging_Header_h

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

// TurboModule support
#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTTurboModule.h>
#import <ReactCommon/RCTTurboModule.h>
#endif

// Promise types for Swift
typedef void (^RCTPromiseResolveBlock)(id result);
typedef void (^RCTPromiseRejectBlock)(NSString *code, NSString *message, NSError *error);

#endif /* RNIconify_Bridging_Header_h */
