module.exports = function (p) {
  'use strict';
  var through = require('through2')
    , path = require('path')
    , tplF = require('../utils/tpl');

  // build tpl
  function replace(file, cb) {
    var tmpl = String(file.contents);
    file.contents = new Buffer("define('./" + path.basename(file.path, '.js') + "', [], function (require, exports, module) { return module.exports = " + tplF(tmpl) + "});");
    file.path = file.path.replace(/\.html$/, '.js');
    cb(file);
  }

  function tpl() {
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

  return tpl;
}();
