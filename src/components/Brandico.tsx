/**
 * Brandico Icon Set
 * @see https://icon-sets.iconify.design/brandico/
 *
 * Auto-generated - do not edit manually
 */

import { createIconSet } from '../createIconSet';

const brandicoIconNames = {
  amex: true,
  bandcamp: true,
  blogger: true,
  'blogger-rect': true,
  box: true,
  'box-rect': true,
  codepen: true,
  deviantart: true,
  diigo: true,
  discover: true,
  facebook: true,
  'facebook-rect': true,
  friendfeed: true,
  'friendfeed-rect': true,
  github: true,
  'github-text': true,
  'googleplus-rect': true,
  houzz: true,
  icq: true,
  instagram: true,
  'instagram-filled': true,
  jabber: true,
  lastfm: true,
  'lastfm-rect': true,
  linkedin: true,
  'linkedin-rect': true,
  mastercard: true,
  odnoklassniki: true,
  'odnoklassniki-rect': true,
  picasa: true,
  skype: true,
  tudou: true,
  tumblr: true,
  'tumblr-rect': true,
  twitter: true,
  'twitter-bird': true,
  vimeo: true,
  'vimeo-rect': true,
  visa: true,
  'vkontakte-rect': true,
  win8: true,
  wordpress: true,
  yandex: true,
  'yandex-rect': true,
  youku: true,
} as const;

export type BrandicoIconName = keyof typeof brandicoIconNames;
export const Brandico = createIconSet<BrandicoIconName>('brandico', brandicoIconNames);
