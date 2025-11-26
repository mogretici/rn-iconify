/**
 * Gala Icon Set
 * @see https://icon-sets.iconify.design/gala/
 *
 * Auto-generated - do not edit manually
 */

import { createIconSet } from '../createIconSet';

const galaIconNames = {
  add: true,
  airplay: true,
  apple: true,
  bag: true,
  bell: true,
  book: true,
  brochure: true,
  calendar: true,
  chart: true,
  chat: true,
  clock: true,
  copy: true,
  data: true,
  display: true,
  editor: true,
  file: true,
  'file-code1': true,
  'file-code2': true,
  'file-document': true,
  'file-error': true,
  'file-script': true,
  'file-spreadsheet': true,
  'file-text': true,
  folder: true,
  globe: true,
  help: true,
  image: true,
  issue: true,
  layer: true,
  lock: true,
  mouse: true,
  multi: true,
  orbit: true,
  portrait1: true,
  portrait2: true,
  radar: true,
  remove: true,
  search: true,
  secure: true,
  select: true,
  settings: true,
  shield: true,
  'sidebar-left': true,
  'sidebar-right': true,
  store: true,
  terminal: true,
  tv: true,
  unlock: true,
  usb: true,
  video: true,
  window: true,
} as const;

export type GalaIconName = keyof typeof galaIconNames;
export const Gala = createIconSet<GalaIconName>('gala', galaIconNames);
