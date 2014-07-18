module.exports = function () {
  'use strict';

  return {
    badjs: require('./middlewares/badjs'),
    inline: require('./middlewares/inline'),
    dwarf: require('./middlewares/dwarf')
  };

}();