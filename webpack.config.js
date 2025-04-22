const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  // 1. First get the default config
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // 2. Safely modify node configuration
  if (!config.node) {
    config.node = {};
  }
  
  // 3. Only set allowed properties
  config.node = {
    ...config.node, // Preserve existing valid settings
    __dirname: process.env.NODE_ENV !== 'production',
    __filename: process.env.NODE_ENV !== 'production',
    global: false
  };

  // 4. Handle fallbacks safely
  if (!config.resolve.fallback) {
    config.resolve.fallback = {};
  }
  
  // 5. Add only necessary fallbacks
  const nodeModules = {
    fs: false,
    net: false,
    tls: false,
    dgram: false,
    dns: false,
    child_process: false,
    http2: false,
    module: false
  };
  
  config.resolve.fallback = {
    ...config.resolve.fallback,
    ...nodeModules
  };

  return config;
};