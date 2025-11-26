/**
 * Fontelico Icon Set
 * @see https://icon-sets.iconify.design/fontelico/
 *
 * Auto-generated - do not edit manually
 */

import { createIconSet } from '../createIconSet';

const fontelicoIconNames = {
  chrome: true,
  crown: true,
  'crown-minus': true,
  'crown-plus': true,
  'emo-angry': true,
  'emo-beer': true,
  'emo-coffee': true,
  'emo-cry': true,
  'emo-devil': true,
  'emo-displeased': true,
  'emo-grin': true,
  'emo-happy': true,
  'emo-laugh': true,
  'emo-saint': true,
  'emo-shoot': true,
  'emo-sleep': true,
  'emo-squint': true,
  'emo-sunglasses': true,
  'emo-surprised': true,
  'emo-thumbsup': true,
  'emo-tongue': true,
  'emo-unhappy': true,
  'emo-wink': true,
  'emo-wink2': true,
  firefox: true,
  ie: true,
  marquee: true,
  opera: true,
  spin1: true,
  spin2: true,
  spin3: true,
  spin4: true,
  spin5: true,
  spin6: true,
} as const;

export type FontelicoIconName = keyof typeof fontelicoIconNames;
export const Fontelico = createIconSet<FontelicoIconName>('fontelico', fontelicoIconNames);
