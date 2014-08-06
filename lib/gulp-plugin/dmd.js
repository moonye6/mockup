module.exports = function () {
  'use strict';
  var through = require('through2')
    , path = require('path')
    , fs = require('fs')
    , tplF = require('../utils/tpl');

  function wrap(string, name) {
    var modules = []
      , moduleMap = {};

    string.replace(/require\(('|")(.*?)\1\)/g, function (match, quz, module) {
      if (!(module in moduleMap)) {
        moduleMap[module] = true;
        modules.push("'" + module + "'");
      }
    });

    return "define('" + name + "', [" + modules.join(', ') + "], function (require, exports, module) {\n\r" + string + "});";
  }

  function getMods(base, p, string, mods) {
    var res = [];
    string.replace(/require\(('|")(.*?)\1\)/g, function (match, quz, mod) {
      // relative path
      if (mod.indexOf('.') === 0) {
        var ap = path.join(p, mod) + '.js'
        if (!(ap in mods)) {
          if (path.relative(base, ap).indexOf('.') !== 0) {
              mods[ap] = true;
              res.push({
                p: mod,
                ap: ap
              });
          }
        }
      }
    });
    return res;
  }

  function tpl(tmpl) {
    return "return module.exports = " + tplF(tmpl) + ";";
  }

  function readFile(path, cb) {
    var res;
    try {
      if (~path.indexOf('tpl.js')) {
        res = fs.readFileSync(path.replace(/\.js/, '.html'), { encoding: 'utf8' });
        cb(null, tpl(res));
      } else {
          res = fs.readFileSync(path, { encoding: 'utf8' });
          cb(null, res);
      }
    } catch(e) {
      cb(e);
    }
  }

  function make(file, cb) {
    var string = String(file.contents)
      , mods = {}
      , res = [];

    res.push(wrap(string, './' + path.basename(file.path, '.js')));

    pack(path.dirname(file.path), path.dirname(file.path), string, function () {
      file.contents = new Buffer(res.join(''));
      cb(file);
    });

    function pack(base, datum, string, cb) {
      var modList = getMods(base, datum, string, mods)
        , i = modList.length
        , name;
      if (i) {
        modList.forEach(function (mod) {
          readFile(mod.ap, function (err, data) {
            if (err) throw err;
            name = './' + path.relative(base, mod.ap).replace(/\\/g, '/').replace(/\.js$/, '');
            res.unshift(wrap(data, name));
            pack(base, path.dirname(mod.ap), data, function () {
              if (--i === 0) {
                cb();
              }
            });
          });
        });
      } else {
        cb();
      }
    }
  }

  function dmd() {
    var stream = through.obj(function (file, enc, callback) {
      if (file.isNull()) {
        this.push(file);
        return callback();
      }

      if (file.isBuffer()) {
        var self = this;
        make(file, function (file) {
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

  return dmd;
}();
