module.exports = function () {
  'use strict';
  var through = require('through2')
    , crypto = require('crypto');

  function cal(file, cb) {
    var md5 = crypto.createHash('md5');
    md5.update(file.contents, 'utf8');
    file.path = file.path.replace(/\.([^\.]+)$/, '.' + md5.digest('hex').slice(0, 5) + '.$1');
    console.log(file.path);
    cb(file);
  }

  function md5() {
    var stream = through.obj(function (file, enc, callback) {
      if (file.isNull()) {
        this.push(file);
        return callback();
      }

      if (file.isBuffer()) {
        var self = this;
        cal(file, function (file) {
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

  return md5;
}();
