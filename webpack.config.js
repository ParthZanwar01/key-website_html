const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Customize the config before returning it.
  
  // Add support for importing SVG files
  config.module.rules.push({
    test: /\.svg$/,
    use: ['@svgr/webpack', 'url-loader'],
  });

  // Support for native modules
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    // Alias your app directory
    '@': path.resolve(__dirname),
    // Add aliases for React Native components on web
    'react-native$': 'react-native-web',
    // Use the correct paths for these packages
    '@react-native-async-storage/async-storage': require.resolve('@react-native-async-storage/async-storage/lib/module/index.js'),
    'react-native-safe-area-context': require.resolve('react-native-safe-area-context/lib/module/index.js'),
  };

  // Make sure the proper extensions are resolved
  config.resolve.extensions = [
    '.web.js',
    '.web.jsx',
    '.web.ts',
    '.web.tsx',
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
  ];

  // Add support for key club specific integrations
  config.module.rules.push({
    test: /\.(js|jsx|ts|tsx)$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env', '@babel/preset-react'],
        plugins: ['@babel/plugin-proposal-class-properties']
      },
    },
  });

  return config;
};