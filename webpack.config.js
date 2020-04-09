module.exports = {
  target: 'node',
  entry: { 
    'QS': './src/main.ts',
    'testLexer':'./src/Test/TestLexer.ts',
    'testGrammar':'./src/Test/TestGrammar.ts',
    'test':'./src/Test/Test.ts'
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