const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withSplitApk(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('def enableSeparateBuildPerCPUArchitecture = false')) {
      config.modResults.contents = config.modResults.contents.replace(
        /def enableSeparateBuildPerCPUArchitecture = false/,
        'def enableSeparateBuildPerCPUArchitecture = true'
      );
    } else {
      // For newer RN versions where it's configured differently or missing
      // We can inject it into android.splits
      const splitsBlock = `
android {
    splits {
        abi {
            enable true
            reset()
            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
            universalApk false
        }
    }
}
`;
      config.modResults.contents = config.modResults.contents + splitsBlock;
    }
    return config;
  });
};
