module.exports = function (p) {
  'use strict';
  var through = require('through2')
    , path = require('path')
    , fs = require('fs');

  function replace(file, cb) {
    var string = String(file.contents)
      , res = [];

    string = string.replace(/\<inline.*?src\=('|")(.*?)\1.*?\/?\>/g, function (all, quz, src) {
      src = path.resolve(path.dirname(file.path), src);
      fs.readFileSync(src);
    }).replace(/\<script.*?src\=('|")(.*?)\?__inline\1.*?\>[\s\S]*?\<\/script\>/g, function (all, quz, src) {
      src = path.resolve(path.dirname(file.path), src);
      return '<script>' + fs.readFileSync(src) + '</script>';
    }).replace(/\<link\s+inline[\s\S]+?href\=('|")(.*?)\1.*?\>/g, function (all, quz, src) {
      src = path.resolve('./dist', src);
      var basenames = path.basename(src).split('.')
        , dirname = path.dirname(src)
        , dirs = fs.readdirSync(dirname)
        , reg
        , res;

      dirs.forEach(function (dir) {
        var dirs = dir.split('.');
        dirs.splice(dirs.length - 2, 1);
        var match = true;
        for (var i = 0, l = dirs.length; i < l; i++) {
          if (dirs[i] !== basenames[i]) {
            match = false;
          }
        }
        if (match) {
          res = fs.readFileSync(path.join(dirname, dir));
        }
      });

      return '<style>' + res + '</style>';
    });

    file.contents = new Buffer(string);
    cb(file);
  }

  function htmlInline() {
    var stream = through.obj(function (file, enc, callback) {
      if (file.isNull()) {
        this.push(file);
        return callback();
      }

      if (file.isBuffer()) {
        var self = this;
        replace(file, function (file) {
          self.push(file);
          callback();
        });
        return;
      }

      if (file.isStream()) {
        this.emit('error', new PluginError('Dwarf', 'Streams are not supported!'));
        return callback();
      }
    });

    return stream;
  }

  return htmlInline;
}();
