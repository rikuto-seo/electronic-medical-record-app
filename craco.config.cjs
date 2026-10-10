const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 大量のMDX・解剖データによるディスクキャッシュの肥大化を防ぐ。
      webpackConfig.cache = false;
      const sourceMapRule = webpackConfig.module.rules.find(
        (rule) => (typeof rule.loader === 'string' && rule.loader.includes('source-map-loader')) ||
          (Array.isArray(rule.use) && rule.use.some((entry) =>
            (typeof entry === 'string' ? entry : entry.loader || '').includes('source-map-loader')))
      );
      if (sourceMapRule) {
        sourceMapRule.exclude = [
          ...[sourceMapRule.exclude].flat().filter(Boolean),
          /node_modules[\\/]react-datepicker[\\/]/,
          /node_modules[\\/]@mediapipe[\\/]/,
          /node_modules[\\/]html2pdf\.js[\\/]/,
        ];
      }
      const mdxRule = {
        test: /\.mdx$/,
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: { presets: [require.resolve('@babel/preset-react')] },
          },
          { loader: require.resolve('@mdx-js/loader') },
        ],
      };
      const oneOfRule = webpackConfig.module.rules.find((rule) => Array.isArray(rule.oneOf));
      if (oneOfRule) oneOfRule.oneOf.unshift(mdxRule);
      else webpackConfig.module.rules.push(mdxRule);
      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.alias = {
        ...(webpackConfig.resolve.alias || {}),
        'physiology-mdx': path.resolve(__dirname, 'src/components/physiology/physiology-mdx'),
      };
      webpackConfig.resolve.extensions = Array.from(new Set([
        ...(webpackConfig.resolve.extensions || []), '.mdx',
      ]));
      return webpackConfig;
    },
  },
};
