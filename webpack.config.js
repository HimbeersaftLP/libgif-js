const path = require('path');
const WrapperPlugin = require("wrapper-webpack-plugin");

module.exports = {
  entry: './userscript.js',
  output: {
    filename: 'userscript_full.min.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'production',
  plugins: [
    new WrapperPlugin({
      header:
`// ==UserScript==
// @name        GIF Controls
// @namespace   https://github.com/HimbeersaftLP/libgif-js/
// @match       *://*/*
// @version     0.0.1
// @description Adds GIF controls to websites
// @run-at      document-idle
// @grant       GM_registerMenuCommand
// @grant       GM_notification
// @grant       GM_xmlhttpRequest
// @homepageURL https://github.com/HimbeersaftLP/libgif-js/
// ==/UserScript==
`,
      afterOptimizations: true
    })
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['to-string-loader', 'css-loader'],
      },
    ],
  }
};