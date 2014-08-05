module.exports = function (p) {
  'use strict';

  var pipeMiddle = require('middleware-pipe')
    , sprite = require('../gulp-plugin/sprite')
    , sass = require('gulp-sass');

  return pipeMiddle(p, /\.css$/, function (url) {
    return url.replace(/\.css$/, '.scss');
  }).pipe(function () {
    return sass();
  }).pipe(function () {
    return sprite();
  });
};
