module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            'rn-iconify': '../src',
          },
        },
      ],
      // rn-iconify babel plugin for build-time icon bundling
      ['../babel', { verbose: true }],
      'react-native-reanimated/plugin',
    ],
  };
};
