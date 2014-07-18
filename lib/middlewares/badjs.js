module.exports = function () {
  'use strict';

  var LOG_MAP = {
    '2': ['info','green'],
    '4': ['warning','magenta'],
    '8': ['error','red']
  }

  var fs = require('fs')
    , Log = require('log')
    , log = new Log('debug', fs.createWriteStream('badjs.log'))
    , debug = require('debug')
    , color = require('../utils/color')
    , getQuery = require('../utils/query')
    , badjs;

  debug.enable('badjs');
  badjs = debug('badjs');

  return function (req, res, next) {
    var query = getQuery(req)
      , msg;
    if (query.level && query.msg) {
      msg = query.msg.split('|_|');
      log[LOG_MAP[query.level][0]](query.msg);
      badjs(LOG_MAP[query.level][0], color[LOG_MAP[query.level][1]](msg[0]) , msg[1] || '', msg[2] || '', msg[3] || '');
      res.writeHead(204, { 'Content-Type': 'image/png' });
      res.statusCode = 204;
      res.end('');
    } else {
      next();
    }
  };

};
