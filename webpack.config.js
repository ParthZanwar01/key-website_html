const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Replace the node configuration with only valid properties
  if (config.node) {
    // Remove all invalid properties and only keep valid ones
    config.node = {
      __dirname: config.node.__dirname || false,
      __filename: config.node.__filename || false,
      global: config.node.global || true
    };
  }
  
  return config;
};