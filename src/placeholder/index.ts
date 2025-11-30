/**
 * Placeholder System
 * Provides visual feedback while icons are loading
 */

// Types
export type {
  PlaceholderPreset,
  PlaceholderType,
  PlaceholderConfig,
  PlaceholderProps,
} from './types';

export { DEFAULT_PLACEHOLDER_CONFIG } from './types';

// Components
export { Skeleton } from './Skeleton';
export { Pulse } from './Pulse';
export { Shimmer } from './Shimmer';
export { PlaceholderFactory } from './PlaceholderFactory';
export type { PlaceholderFactoryProps } from './PlaceholderFactory';
