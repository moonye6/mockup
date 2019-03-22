module.exports = function () {
  'use strict';

  return {
    badjs: require('./middlewares/badjs'),
    inline: require('./middlewares/inline'),
    dwarf: require('./middlewares/dwarf'),
    tpl: require('./middlewares/tpl'),
    scss: require('./middlewares/scss'),
    plugin: {
        sprite: require('./gulp-plugin/sprite'),
        sprite2: require('./gulp-plugin/sprite2'),
        tpl: require('./gulp-plugin/tpl'),
        dwarf: require('./gulp-plugin/dwarf'),
        dmd: require('./gulp-plugin/dmd'),
        md5: require('./gulp-plugin/md5'),
        htmlInline: require('./gulp-plugin/htmlInline')
    }
  };

}();
