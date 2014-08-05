module.exports = function (p) {
  'use strict';
  var pipeMiddle = require('middleware-pipe')
    , tpl = require('../gulp-plugin/tpl');

  return pipeMiddle(p, /tpl\.js$/, function (url) {
      return url.replace(/\.js$/, '.html');
    }).pipe(function (req) {
        return tpl();
      });

};
