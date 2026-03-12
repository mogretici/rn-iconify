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
