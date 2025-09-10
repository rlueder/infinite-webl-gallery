const { merge } = require('webpack-merge')
const path = require('path')

const config = require('./webpack.config')

module.exports = merge(config, {
  mode: 'development',

  devtool: 'inline-source-map',

  devServer: {
    static: {
      directory: path.join(__dirname, 'InifniteAutoScrollingGallery')
    },
    compress: true,
    port: 8080,
    open: true
  },

  output: {
    path: path.join(__dirname, 'InifniteAutoScrollingGallery')
  }
})
