const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const webpack = require('webpack');

module.exports = async function(env, argv) {
  // Disable progress reporting to avoid the ProgressPlugin error
  env.report = false;
  env.json = false;
  
  // Get the Expo webpack config with modified env
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Remove any existing ProgressPlugin instances
  if (config.plugins) {
    config.plugins = config.plugins.filter(plugin => {
      return plugin.constructor && 
             plugin.constructor.name !== 'ProgressPlugin' && 
             !(plugin instanceof webpack.ProgressPlugin);
    });
  }
  
  // Fix node configuration
  if (config.node) {
    config.node = {
      __dirname: config.node.__dirname || false,
      __filename: config.node.__filename || false,
      global: config.node.global || true
    };
  }
  
  // Fix devServer configuration
  if (config.devServer) {
    // Create a clean devServer object with only valid properties
    const validProperties = [
      'allowedHosts', 'bonjour', 'client', 'compress', 
      'devMiddleware', 'headers', 'historyApiFallback', 
      'host', 'hot', 'http2', 'https', 'ipc', 
      'liveReload', 'onAfterSetupMiddleware', 
      'onBeforeSetupMiddleware', 'onListening', 
      'open', 'port', 'proxy', 'setupExitSignals', 
      'static', 'watchFiles', 'webSocketServer'
    ];
    
    const cleanDevServer = {};
    
    for (const prop of validProperties) {
      if (config.devServer[prop] !== undefined) {
        cleanDevServer[prop] = config.devServer[prop];
      }
    }
    
    config.devServer = cleanDevServer;
  }
  
  return config;
};