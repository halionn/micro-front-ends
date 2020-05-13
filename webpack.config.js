/* eslint-env node */
const path = require('path')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: path.join(__dirname, 'src/index.js'),
  externals: ['react', 'prop-types', 'react-router-dom'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'micro-frontend.js',
    library: 'root',
    libraryTarget: 'umd'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
          presets: [
            [
              '@babel/preset-env',
              {
                targets: {
                  browsers: ['safari >=7', 'ie >= 8', 'chrome >=43']
                }
              }
            ],
            '@babel/preset-react'
          ],
          plugins: [
            ['@babel/plugin-transform-runtime', { corejs: 3 }],
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            ['@babel/plugin-proposal-class-properties', { loose: true }],
            '@babel/plugin-syntax-dynamic-import'
          ]
        }
      },
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new UglifyJsPlugin({
      uglifyOptions: {
        warning: false,
        compress: {
          drop_debugger: true,
          drop_console: true
        }
      }
    })
  ]
}