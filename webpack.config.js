// webpack.config.js
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    // Add any custom config here
  }, argv);
  
  // Silence the deprecation warnings
  config.devServer = {
    ...config.devServer,
    devMiddleware: {
      ...config.devServer?.devMiddleware,
      stats: 'errors-only'
    }
  };
  
  return config;
};