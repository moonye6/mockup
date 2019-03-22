module.exports = function () {
  'use strict';
  var through = require('through2')
    , path = require('path')
    , fs = require('fs');

  function wrap(string, name) {
    var modules = []
      , moduleMap = {};

    string.replace(/require\(('|")(.*?)\1\)/g, function (match, quz, module) {
      if (!(module in moduleMap)) {
        moduleMap[module] = true;
        modules.push("'" + module + "'");
      }
    });

    return "ke.define('" + name + "', [" + modules.join(', ') + "], function (require, exports, module) {\n\r" + string + "});";
  }

  function getMods(base, p, string, mods) {
    var res = [];
    string.replace(/require\(('|")(.*?)\1\)/g, function (match, quz, mod) {
      // 相对路径迭
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
    var res = [], EOL = '\n';
    tmpl.replace(/<\/script>/ig, '</s<%=""%>cript>');
    res.push([
      "function (it, opt) {",
      "    it = it || {};",
      "    with(it) {",
      "        var _$out_= [];",
      "        _$out_.push('" + tmpl
        .replace(/<link\sinline.+?href=(['"])(.+?)\1.+?>/g, function (all, quz, src) {
          src = path.resolve('dist/js', src);

          var basenames = path.basename(src).split('.')
            , dirname = path.dirname(src)
            , dirs = fs.readdirSync(dirname)
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

          return '<style>' +
                  res +
                  '</style>';
        })
        .replace(/\r\n|\n|\r/g, "\v")
        .replace(/(?:^|%>).*?(?:<%|$)/g, function($0) {
          return $0.replace(/('|\\)/g, "\\$1").replace(/[\v\t]/g, "").replace(/\s+/g, " ")
        })
        .replace(/[\v]/g, EOL)
        .replace(/<%==(.*?)%>/g, "', opt.encodeHtml($1), '")
        .replace(/<%=(.*?)%>/g, "', $1, '")
        .replace(/<%(<-)?/g, "');" + EOL + "      ")
        .replace(/->(\w+)%>/g, EOL + "      $1.push('")
        .split("%>").join(EOL + "      _$out_.push('") + "');",
      "      return _$out_.join('');",
      "    }",
      "}"
    ].join(EOL).replace(/_\$out_\.push\(''\);/g, ''));

    return "return module.exports = " + res.join('') + ";";
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
