module.exports = function (p) {
  'use strict';
  var pipeMiddle = require('middleware-pipe')
    , replace = require('gulp-replace')
    , path = require('path')
    , fs = require('fs');

  return pipeMiddle(p, /\.html$/)
    .pipe(function (req) {
      return replace(/\<inline.*?src\=('|")(.*?)\1.*?\/?\>/g, function (all, quz, src) {
        var file = path.resolve(path.dirname(path.join(p, req.url)), src);
        return fs.readFileSync(file);
      });
    }).pipe(function (req) {
      return replace(/\<script.*?src\=('|")(.*?)\?__inline\1.*?\>[\s\S]*?\<\/script\>/g, function (all, quz, src) {
        var file = path.resolve(path.dirname(path.join(p, req.url)), src);
        return '<script>' + fs.readFileSync(file) + '</script>';
      });
    });

};
