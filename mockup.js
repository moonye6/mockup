/**
 * @author donaldyang & knightli
 */
module.exports = function () {
  'use strict';
  var program = require('commander');

  program
    .version('0.3.5')
    .usage('[options] <value ...>')
    .option('-c, --cgi [path]', 'set mockup cgi data path')
    .option('-M, --MD5', 'enable MD5 replace mode')
    .option('-C, --CDN [path]', 'set CDN path')
    .option('-l, --local [path]', 'set local path')
    .option('-r, --record', 'enable cgi recording')
    .option('-p, --path [path]', 'site path')
    .parse(process.argv);

  var connect = require('connect')
    , httpProxy = require('http-proxy')
    , proxy = httpProxy.createProxyServer()
    , fs = require('fs')
    , zlib = require('zlib')
    , path = require('path')
    , mkdirp = require('mkdirp')
    , URL = require('url')
    , Log = require('log')
    , debug = require('debug')
    , log = new Log('debug', fs.createWriteStream('badjs.log'))
    , send = require('send')
    , logMap = {
      '2': ['info','green'],
      '4': ['warning','magenta'],
      '8': ['error','red']
    };

  debug.enable('badjs');

  var badjs = debug('badjs');


  var color = (function(){

    var color_16_base = {
        'black': 30,
        'red': 31,
        'green': 32,
        'yellow': 33,
        'blue': 34,
        'magenta': 35,
        'cyan': 36,
        'white': 37
    };

    var styles = {};

    for(var color in color_16_base){

        var code = color_16_base[color];

        styles[color+'_BASIC'] = '\u001b['+code+'m';
        styles[color+'_BG'] = '\u001b['+(code+60)+';3m';
        styles[color] = '\u001b['+(code+60)+'m';
        styles[color+'_UL'] = '\u001b['+(code+60)+';4m';
    }

    var ex = {};

    for(var key in styles){

        (function(p){
            ex[p] = function(text){
                return styles[p] + text + '\u001b[0m';
            }
        })(key);

    }

    return ex;

  })();

  var app = connect()
              .use('/cgi-bin-dev/badjs_mock', connect.query())
              .use('/cgi-bin-dev/badjs_mock', function (req, res, next) {
                log[logMap[req.query.level][0]](req.query.msg);
                var msg = req.query.msg.split('|_|');
                badjs(logMap[req.query.level][0], color[logMap[req.query.level][1]](msg[0]) , msg[1]||'', msg[2]||'', msg[3]||'');
                res.writeHead(204, {'Content-Type': 'image/png'});
                res.statusCode = 204;
                res.end('');
              })
              .use('/cgi-bin-dev', connect.json())
              .use('/cgi-bin-dev', connect.urlencoded())
              .use('/cgi-bin-dev', function (req, res, next) {
                var url = req.url.replace(/\?.*$/, '')
                  , cgiPaths = program.cgi ?
                    program.cgi.split('|') :
                    [path.join(__dirname, '/mockup/cgi-bin')]
                  , ps = []
                  , isNext = true;

                cgiPaths.forEach(function (cgipath) {
                  ps.push(path.join(cgiPath, url));
                });

                ps.every(function (p, i) {
                  if (fs.existsSync(p + '.js')) {
                    isNext = false;
                    p = p + '.js';

                    var script = fs.readFileSync(p).toString()
                      , foo
                      , mod = {
                        exports: {}
                      }
                      , query = URL.parse(req.url, true).query;

                    for (var i in query) {
                      req.body[i] = query[i];
                    }

                    foo = new Function('module', 'exports', script);
                    foo(mod);

                    res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
                    res.statusCode = 200;
                    res.end(JSON.stringify(mod.exports(req.body)));
                    return false;
                  } else if (fs.existsSync(p + '.json')) {
                    isNext = false;
                    p = p + '.json';

                    res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
                    res.statusCode = 200;
                    res.end(fs.readFileSync(p));
                    return false;
                  }
                  return true;
                });

                isNext && next();
              });

  if (program.MD5) {
    app.use('/' + program.CDN, function (req, res, next) {
      var file = path.join(__dirname, program.local || '/dev', req.url)
        , dirname = path.dirname(file)
        , basename = path.basename(file);

      if (!fs.existsSync(file)) {
        var nBasename = basename.split('.');
        nBasename[nBasename.length - 2] = '.*?';
        var dirs = fs.readdirSync(dirname)
          , reg = new RegExp(nBasename.join('\\.'));
        dirs.forEach(function (dir) {
          if (reg.test(dir)) {
            req.url = req.url.replace(basename, dir);
          }
        });
      }

      function error(err) {
        if (err.status === 404) return next();
        next(err);
      }

      send(req, URL.parse(req.url).pathname, { root: path.join(__dirname, program.local || '/dev') })
        .on('error', error)
        .pipe(res);
    });
  }

  var lpath = path.join(__dirname, program.local || '/dev');
  var rpaths = [];

  if (program.path) {
    console.log('path:'+path.join('', program.path));
    rpaths.push(  ('/' +program.path).replace(/\/+/g, '/')  );
  }

  if (program.CDN) {
    console.info('cdn:'+program.CDN);
    rpaths.push(  ('/' +program.CDN).replace(/\/+/g, '/')  );
  }

  rpaths.forEach(function(rpath){
    app.use(rpath, connect.static(lpath));
  });

  var CGI_REG = /^\/cgi-bin/;

  function writeCgi(buffer, url, isJSON) {
    var cgiPath = program.cgi ?
          program.cgi :
          path.join(__dirname, '/mockup/cgi-bin');
    url = url.replace(CGI_REG, '');
    var file = path.join(cgiPath, url)
      , fileDir = path.dirname(file)
      , fileName = encodeURIComponent(path.basename(file)) + (isJSON ? '.json' : '.vm.html') 
      , string = buffer.toString();
    file = path.join(fileDir, fileName);
    isJSON &&
      (string = JSON.stringify(JSON.parse(string), null, '    '));
    fs.writeFile(file, string, function (e) {
      if (e && e.code === 'ENOENT') 
        return mkdirp(fileDir, '0777', function (e) {
          if (e) return;
          fs.writeFile(file, string);
        });
    });
  }

  app
    .use(function (req, res, next) {
      var host = req.headers.host.replace(/^dev\./, '');
      req.url === '/' && (req.url = '/index.html');
      if (program.record && CGI_REG.test(req.url)) {
        var buffers = [], isGzip;
        res.on('pipe', function (proxyReq) {
          proxyReq.on('data', function (buffer) {
            buffers.push(buffer);
            res.write(buffer);
          });
          isGzip = proxyReq.headers['content-encoding'] === 'gzip';
          res.on('finish', function () {
            var buffer = Buffer.concat(buffers);
            isGzip ? 
              zlib.gunzip(Buffer.concat(buffers), function (err, buffer) {
                if (err) return;
                writeCgi(buffer, req.url, ~proxyReq.headers['content-type'].indexOf('application/json'));
              }) :
              writeCgi(buffer, req.url, ~proxyReq.headers['content-type'].indexOf('application/json'));
          });
        });
      }
      proxy.web(req, res, {
        target: 'http://' + host
      }, function (e) {
        next(e);
      });
    })
    .listen(80);

}();
