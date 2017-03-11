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
    rules: [{
      test: /\.scss$/,
      use: [{
        loader: "style-loader" // creates style nodes from JS strings
      }, {
        loader: "css-loader" // translates CSS into CommonJS
      }, {
        loader: "sass-loader" // compiles Sass to CSS
      }]
    },{ 
      test: /\.tsx?$/,
      exclude: /node_modules/,
      loader: 'ts-loader'
    }, {
      test: /\.html$/,
      loader: 'wc-loader'
    }]
  }
}
