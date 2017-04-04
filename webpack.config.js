const path = require('path')

const __DEV__ = process.env.NODE_ENV === 'development'
const __PROD__ = process.env.NODE_ENV === 'production'
const __TEST__ = process.env.NODE_ENV === 'test'

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'dist/index.js'
  },
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    compress: true,
    historyApiFallback: true,
    port: 3002
  },
  resolve: {
    extensions: ['.ts','.js']
  },
  module: {
    rules: [{ 
      test: /\.ts$/,
      exclude: /node_modules/,
      loader: 'ts-loader'
    }]
  },
  devtool: __DEV__ ? 'eval-source-map' : 'source-map'
}
