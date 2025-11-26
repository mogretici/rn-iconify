/**
 * Geo Icon Set
 * @see https://icon-sets.iconify.design/geo/
 *
 * Auto-generated - do not edit manually
 */

import { createIconSet } from '../createIconSet';

const geoIconNames = {
  'turf-along': true,
  'turf-bbox-polygon': true,
  'turf-bezier': true,
  'turf-buffer': true,
  'turf-center': true,
  'turf-centroid': true,
  'turf-concave': true,
  'turf-convex': true,
  'turf-destination': true,
  'turf-envelope': true,
  'turf-erased': true,
  'turf-explode': true,
  'turf-extent': true,
  'turf-intersect': true,
  'turf-kinks': true,
  'turf-line-slice': true,
  'turf-merge': true,
  'turf-midpoint': true,
  'turf-point-grid': true,
  'turf-point-on-line': true,
  'turf-point-on-surface': true,
  'turf-simplify': true,
  'turf-size': true,
  'turf-square': true,
  'turf-square-grid': true,
  'turf-tin': true,
  'turf-triangle-grid': true,
  'turf-union': true,
  'ui-earth-east': true,
  'ui-earth-west': true,
} as const;

export type GeoIconName = keyof typeof geoIconNames;
export const Geo = createIconSet<GeoIconName>('geo', geoIconNames);
