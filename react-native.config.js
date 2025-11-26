/**
 * React Native CLI Configuration
 * Configures Codegen for TurboModule generation
 */

module.exports = {
  dependency: {
    platforms: {
      ios: {
        podspecPath: './ios/RNIconify.podspec',
      },
      android: {
        sourceDir: './android',
        packageImportPath: 'import com.rniconify.RNIconifyPackage;',
        packageInstance: 'new RNIconifyPackage()',
      },
    },
  },
  codegenConfig: {
    name: 'RNIconifySpec',
    type: 'modules',
    jsSrcsDir: 'src/native',
    android: {
      javaPackageName: 'com.rniconify',
    },
  },
};
