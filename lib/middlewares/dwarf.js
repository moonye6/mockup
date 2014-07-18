module.exports = function (p) {
  'use strict';
  var pipeMiddle = require('middleware-pipe')
    , through = require('through2')
    , path = require('path');

  function replace(file, cb) {
    var string = String(file.contents)
      , modules = []
      , moduleMap = {};
      string.replace(/require\(('|")(.*?)\1\)/g, function (match, quz, module) {
        if (!(module in moduleMap)) {
          moduleMap[module] = true;
          modules.push("'" + module + "'");
        }
      });
    file.contents = new Buffer("define('./" + path.basename(file.path, '.js') + "', [" + modules.join(', ') + "], function (require, exports, module) {" + string + "});");
    cb(file);
  }

  function dwarf() {
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

  return pipeMiddle(p, /\.js$/)
    .pipe(function (req) {
      return dwarf();
    });

};
