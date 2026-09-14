/**
 * The icons the library reads when an application has not pointed
 * `rn-iconify/bundled-icons` at its own — an empty bundle (see
 * bundled-icons.js). `withRnIconify` resolves this module to the
 * application's `.rn-iconify/icons.js`, which has the same shape.
 */
declare const bundle: {
  version: string;
  icons: Record<string, { svg: string; width: number; height: number }>;
  count: number;
};

export = bundle;
