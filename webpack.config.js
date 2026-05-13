const path = require('path');

/** @type {import('webpack').Configuration} */
const base = {
  devtool: 'source-map',
  resolve: { extensions: ['.ts', '.js'] },
  module: {
    rules: [
      { test: /\.ts$/, exclude: /node_modules/, use: ['ts-loader'] }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'out'),
    devtoolModuleFilenameTemplate: '../[resource-path]'
  }
};

/** @type {import('webpack').Configuration} */
const extensionConfig = {
  ...base,
  name: 'extension',
  target: 'node',
  entry: './src/extension.ts',
  output: {
    ...base.output,
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: { vscode: 'commonjs vscode' }
};

/** @type {import('webpack').Configuration} */
const webviewConfig = {
  ...base,
  name: 'webview',
  target: 'web',
  entry: './src/webview/index.ts',
  output: {
    ...base.output,
    filename: 'webview.js'
  }
};

module.exports = [extensionConfig, webviewConfig];
