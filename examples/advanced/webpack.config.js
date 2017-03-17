const SplitByPathPlugin = require('webpack-split-by-path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')
const FileSystem = require("fs");
const path = require('path')

const __DEV__ = process.env.NODE_ENV === 'development'
const __PROD__ = process.env.NODE_ENV === 'production'
const __TEST__ = process.env.NODE_ENV === 'test'

const plugins = [
  new SplitByPathPlugin([
    {
      name: 'vendor',
      path: path.join(__dirname, '..','..','node_modules')
    },
    {
      name: 'vendor',
      path: path.join(__dirname, 'node_modules')
    },
    {
      name: 'vendor',
      path: path.join(__dirname, 'bower_components')
    }
  ], {
    manifest: 'app-manifest'
  }),
  new HtmlWebpackPlugin({
    filename: 'index.html',
    template: '!!html-loader!index-template.html'
  })
]
if (__PROD__) {
  // This takes forever, as it creates dozens of smaller images, so I disable in DEV
  plugins.push(new FaviconsWebpackPlugin('./cyclejs_logo.svg'))
}

module.exports = {
  entry: {
    app:'./src/app.ts'
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: __PROD__ ? "[name]-[chunkhash].js" : "[name].js",
    chunkFilename: __PROD__ ? "[name]-[chunkhash].js" : "[name].js"
  },
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    compress: true,
    historyApiFallback: true,
    port: 3002
  },
  plugins: plugins,
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
