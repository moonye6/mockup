module.exports = function () {
  var spritesmith = require('spritesmith')
    , globby = require('globby')
    , path = require('path')
    , fs = require('fs');

  function getPath(dist, name) {
    return path.join(dist, name + '.png');
  }

  function getUrl(dist, name) {
    return (dist + '/' + name + '.png').replace(/([^\:])\/\//, '$1/');
  }

  function build(scsss, images, imgPath, save, cb) {
    var l = scsss.length;
    scsss.forEach(function (scss) {
      fs.readFile(scss, { encoding: 'utf8' }, function (err, data) {
        var dirname = path.dirname(path.resolve(scss))
        data = data.replace(/sprite\-(.+?)\:\s*?url\((.+?)\)\;/g, function (all, name, p) {
          p = path.join(dirname, p).replace(/\\/g, '/');
          return 'background: url(' + imgPath + path.basename(save) + ') no-repeat -' + images[p].x + 'px -' + images[p].y + 'px;';
        });
        fs.writeFileSync(scss, data);
        if (!(--l)) {
          cb();
        }
      });
    });
  }

  function sprite(images, scss, imgPath, save, cb) {
    var cb;
    images = path.resolve(images);
    globby(images, function (err, files) {
      spritesmith({
        src: files,
        algorithm: 'binary-tree'
      }, function (err, result) {
        fs.writeFileSync(save, result.image, 'binary');
        globby(scss, function (err, scsss) {
          build(scsss, result.coordinates, imgPath, save, cb);
        });
      });
    });
  }

  return sprite;
}();
