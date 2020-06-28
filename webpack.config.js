const path = require('path');

module.exports = {
  entry: './userscript.js',
  output: {
    filename: 'userscript_full.min..js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: 'production'
};