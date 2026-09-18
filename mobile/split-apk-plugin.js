const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withSplitApk(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const splitConfig = `
    splits {
        abi {
            reset()
            enable true
            universalApk false
            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        }
    }
`;
      // Inject the split configuration into the android {} block
      config.modResults.contents = config.modResults.contents.replace(
        /android\s*\{/,
        `android {\n${splitConfig}`
      );
    }
    return config;
  });
};
