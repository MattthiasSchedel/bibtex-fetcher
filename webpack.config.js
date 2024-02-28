const path = require('path');

module.exports = {
  target: 'node', // Important: Extensions run in a Node.js-context
  entry: './src/extension.ts', // Entry point of your extension
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.js', // Output file
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode' // Important: Exclude the 'vscode' module
  },
  resolve: {
    extensions: ['.ts', '.js'] // Resolve these file types
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: ['ts-loader']
      }
    ]
  }
};
