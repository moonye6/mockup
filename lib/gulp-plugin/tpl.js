module.exports = function (p) {
  var through = require('through2')
    , path = require('path')
    , EOL = '\n';

  function replace(file, cb) {
    var tmpl = String(file.contents)
      , res = [];
    tmpl.replace(/<\/script>/ig, '</s<%=""%>cript>');
    res.push([
      "function (it, opt) {",
      "    it = it || {};",
      "    with(it) {",
      "        var _$out_= [];",
      "        _$out_.push('" + tmpl
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

    file.path = file.path.replace(/\.html$/, '.js');
    file.contents = new Buffer("define('./" + path.basename(file.path, '.js') + "', [], function (require, exports, module) { return module.exports = " + res.join('') + "});");
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
