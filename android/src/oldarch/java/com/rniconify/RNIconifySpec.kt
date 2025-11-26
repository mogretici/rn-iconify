/**
 * RNIconify - Bridge Module Spec (Old Architecture)
 */

package com.rniconify

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

/**
 * Old Architecture adapter - provides base class for the module
 */
abstract class RNIconifySpec(context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context)
