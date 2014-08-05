module.exports = function (p) {
  'use strict';
  var pipeMiddle = require('middleware-pipe')
    , dwarf = require('../gulp-plugin/dwarf');

  return pipeMiddle(p, /\.js$/)
    .pipe(function (req) {
      return dwarf();
    });

};
