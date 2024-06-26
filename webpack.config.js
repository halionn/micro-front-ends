/* eslint-env node */
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
// const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: path.join(__dirname, 'src/index.ts'),
  externals: ['react', 'react-router-dom'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'micro.js',
    library: 'root',
    libraryTarget: 'umd',
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.(ts)x?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              presets: [
                '@babel/preset-env',
                '@babel/preset-react',
                // '@babel/preset-typescript'
              ],
              plugins: [
                ['@babel/plugin-transform-runtime', { corejs: 3 }],
                ['@babel/plugin-proposal-class-properties', { loose: true }],
              ],
            },
          },
          'ts-loader',
        ],
      },
    ],
  },
  plugins: [new CleanWebpackPlugin()],
};
