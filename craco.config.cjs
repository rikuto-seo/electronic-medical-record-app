module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const rule = webpackConfig.module.rules.find(
        (r) => r.use && r.use.some(u => u.loader && u.loader.includes('source-map-loader'))
      );
      if (rule) {
        rule.exclude = [
          /node_modules\/react-datepicker/,
          /node_modules\/@mediapipe/
        ];
      }
      return webpackConfig;
    }
  }
};
