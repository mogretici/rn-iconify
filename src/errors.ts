/**
 * Typed error classes for rn-iconify
 * Consumers can use error.code to distinguish error types
 */

export type IconErrorCode = 'NOT_FOUND' | 'NETWORK' | 'TIMEOUT' | 'INVALID_SVG' | 'INVALID_NAME';

export class IconLoadError extends Error {
  public readonly name = 'IconLoadError';

  constructor(
    public readonly code: IconErrorCode,
    message: string
  ) {
    super(message);
  }
}

/**
 * Rejection used when an icon request is cancelled.
 *
 * The web platform signals this with `DOMException('Aborted', 'AbortError')`,
 * and that is what this library used to throw. Hermes has no `DOMException` —
 * it is a browser class, and React Native has never shipped one. Constructing
 * it threw a ReferenceError on top of the abort it was reporting, so a request
 * cancelled by a timeout or an unmounting screen surfaced as a red error
 * screen instead of being swallowed. The slower the network, the more often it
 * happened.
 *
 * `name` stays `'AbortError'` because that is what callers branch on, both
 * inside this library and in anything written against the abort contract.
 */
export class AbortError extends Error {
  public readonly name = 'AbortError';

  constructor(message = 'Aborted') {
    super(message);
  }
}
