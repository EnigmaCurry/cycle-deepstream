const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')

module.exports = {
  entry: './src/app.js',
  output: {
    path: path.join(__dirname, "dist"),
    filename: 'app.js'
  },
  
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    compress: true,
    port: 3001
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: 'index.html' }
    ])
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      query: {
        "presets": ["es2015"]
      }
    }]
  }
}
