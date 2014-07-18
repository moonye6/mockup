module.exports = function () {
  'use strict';

  var qs = require('qs')
    , url = require('url');

  return function (req) {
    return ~req.url.indexOf('?') ?
      qs.parse(url.parse(req.url).query) : {};
  };
}();
