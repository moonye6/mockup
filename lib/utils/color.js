module.exports = function () {
  'use strict';

  var COLOR_16_BASE = {
    'black': 30,
    'red': 31,
    'green': 32,
    'yellow': 33,
    'blue': 34,
    'magenta': 35,
    'cyan': 36,
    'white': 37
  };

  var exports = {}, styles = {}, color, code, key;

  for (color in COLOR_16_BASE) {
    var code = COLOR_16_BASE[color];
    styles[color + '_BASIC'] = '\u001b[' + code + 'm';
    styles[color + '_BG'] = '\u001b['+ (code + 60) + ';3m';
    styles[color] = '\u001b[' + (code + 60) + 'm';
    styles[color + '_UL'] = '\u001b[' + (code + 60) + ';4m';
  }

  for (key in styles) {
    (function (p) {
        exports[p] = function (text) {
            return styles[p] + text + '\u001b[0m';
        }
    })(key);
  }

  return exports;
}();
