const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')

module.exports = {
  entry: './src/app.ts',
  output: {
    path: path.join(__dirname, "dist"),
    filename: 'app.js'
  },
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    compress: true,
    historyApiFallback: true,
    port: 3002
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: 'index.html' }
    ])
  ],
  resolve: {
    extensions: ['.ts','.js']
  },
  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'ts-loader'
      },
      {
        // web components
        // handles html files. <link rel="import" href="path.html"> and import 'path.html';
        test: /\.html$/, 
        loader: 'ts-loader!wc-loader'
      },
    ]
  }
}
