/**
 * @author donaldyang & knightli
 */
module.exports = function () {
  'use strict';

  var connect = require('connect')
    , merge = require('utils-merge')
    , proto = require('./proto');

  var inhale = function () {
    var app = connect();

    return app;
  };
  merge(inhale, proto);

  return inhale;

}();