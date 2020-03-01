
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  target: 'node',
  entry: { 
    'QS': './src/main.ts',
    'testLexer':'./src/test/TestLexer.ts',
    'testGrammar':'./src/test/TestGrammar.ts',
    'test':'./src/test/test.ts'
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/out/',
    library: '[name]',
    libraryTarget: 'umd'
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'awesome-typescript-loader' },
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' }
    ]
  }
};