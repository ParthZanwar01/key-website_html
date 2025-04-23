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
    '@react-native-async-storage/async-storage': 'react-native-web/dist/exports/AsyncStorage',
    'react-native-safe-area-context': 'react-native-web/dist/exports/SafeAreaContext',
  };

  // Add support for path aliases in tsconfig.json
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