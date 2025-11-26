/**
 * RNIconify - TurboModule Spec Implementation (New Architecture)
 */

package com.rniconify

import com.facebook.react.bridge.ReactApplicationContext

/**
 * New Architecture adapter - the main module already implements
 * the TurboModule interface via annotations
 */
abstract class RNIconifySpec(context: ReactApplicationContext) :
    NativeRNIconifySpec(context)
