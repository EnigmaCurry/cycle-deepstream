const SplitByPathPlugin = require('webpack-split-by-path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const FileSystem = require("fs");
const path = require('path')

const __DEV__ = process.env.NODE_ENV === 'development'
const __PROD__ = process.env.NODE_ENV === 'production'
const __TEST__ = process.env.NODE_ENV === 'test'

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
  plugins: [
    new CopyWebpackPlugin([
      { from: 'index.html' }
    ]),
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
      manifest: 'vendor'
    }),
    // Inject script tag into index.html
    function() {
      this.plugin("done", function(statsData) {
        const stats = statsData.toJson()
        if (__PROD__ && !stats.errors.length) {
          const htmlFileName = "index.html"
          const appHash = statsData.compilation.namedChunks['app'].hash.substr(0,20)
          const vendorHash = statsData.compilation.namedChunks['vendor'].hash.substr(0,20)
          const html = FileSystem.readFileSync(path.join(__dirname, htmlFileName), "utf8")
          var htmlOutput = html.replace(
            `<script src='\/vendor.js'><\/script>`,
            `<script src='/vendor-${vendorHash}.js'></script>`);
          htmlOutput = htmlOutput.replace(
            `<script src='\/app.js'><\/script>`,
            `<script src='/app-${appHash}.js'></script>`);
          FileSystem.writeFileSync(
            path.join(__dirname, "dist", htmlFileName),
            htmlOutput);
        }
      });
    }
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
