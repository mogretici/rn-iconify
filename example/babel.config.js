module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            // Every entry point the package publishes, so the example
            // reaches them the way an application does.
            'rn-iconify': '../src',
            'rn-iconify/dev': '../src/dev',
            'rn-iconify/animated': '../src/animated',
            'rn-iconify/navigation': '../src/navigation',
          },
        },
      ],
      // rn-iconify babel plugin for build-time icon bundling
      ['../babel', { verbose: true }],
      'react-native-reanimated/plugin',
    ],
  };
};
