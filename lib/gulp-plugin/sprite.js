module.exports = function () {
  var through = require('through2')
    , path = require('path')
    , fs = require('fs');

  function getPath(dist, name) {
    return path.join(dist, name + '.png');
  }

  function getUrl(dist, name) {
    return (dist + '/' + name + '.png').replace(/([^\:])\/\//, '$1/');
  }

  function sprite(dist, spritePath) {

    spritePath = spritePath || dist;

    var replace = 
      function (file, cb) {
        var string = String(file.contents);
        string = string.replace(/sprite\-(.+?)\:\s*?url\((.+?)\)\;/g, function (all, name, p) {
          return 'background: url(' + p + ') no-repeat;';
        });
        file.contents = new Buffer(string);
        cb(file);
      };

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
        this.emit('error', 'Streams are not supported');
        return callback();
      }

    });
    return stream;
  }

  return sprite;
}();
