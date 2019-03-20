

var path = require('path');
// /\\css\\(.+?)\.css$/
var cssReg = new RegExp([path.sep, 'css', path.sep, '(.+?)\.css$'].join(''))

module.exports = function (p) {
  'use strict';
  var pipeMiddle = require('middleware-pipe')
    , tpl = require('../gulp-plugin/tpl')
    , replace = require('gulp-replace')
    , sass = require('node-sass')
    , path = require('path');

  return pipeMiddle(p, /tpl\.js$/, function (url) {
      return url.replace(/\.js$/, '.html');
    }).pipe(function (req) {
      return replace(/<link\sinline.+?href=(['"])(.+?)\1.+?>/g, function (all, quz, src) {

        src = path.resolve('src/js', src)
          .replace(cssReg, path.sep + 'scss' + path.sep + '$1.scss');

        return '<style>' +
          sass.renderSync({ file: src }).css.toString()
            .replace(/sprite\-(.+?)\:\s*?url\((.+?)\)\;/g, 'background: url($2) no-repeat;')
            .replace(/(background.*?)\:\s+?url\(\.\.\/img/g, '$1: url(http://dev.ke.qq.com/search/img') +
              '</style>';
      });
    }).pipe(function (req) {
      return tpl();
    });

};
