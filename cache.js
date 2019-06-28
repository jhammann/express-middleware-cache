const del = require('del');
const fs = require('fs');
const md5 = require('spark-md5');
const path = require('path');
const write = require('write');

const cache = {
  pathToFile: (dir, file) => (dir
    ? path.resolve(dir, file)
    : path.resolve(__dirname, './.cache', file)
  ),

  fileLastModified: (file) => {
    const fileStats = fs.statSync(file);
    return fileStats.mtime;
  },

  create: (cacheFile, res, next) => {
    res.sendResponse = res.send;
    res.send = (body) => {
      write.sync(cacheFile, body);
      res.sendResponse(body);
    };
    next();
  },

  send: (cacheFile, res) => {
    res.setHeader('content-type', 'application/json');
    res.send(fs.readFileSync(cacheFile, {
      encoding: 'utf8',
    }));
  },
};

const init = (duration, dir) => (req, res, next) => {
  const clearCache = 'clear_cache' in req.query;
  let url = req.originalUrl;
  if (clearCache) {
    url = url.replace(/[?,&]clear_cache/g, '');
  }

  const cacheFile = cache.pathToFile(dir, md5.hash(url));

  if (fs.existsSync(cacheFile)) {
    const fileTime = cache.fileLastModified(cacheFile);
    const currentTime = new Date();
    const fileExpired = (currentTime - fileTime) / 1000 > (duration * 60);

    if (fileExpired || clearCache) {
      del.sync(cacheFile);
      cache.create(cacheFile, res, next);
    } else {
      cache.send(cacheFile, res);
    }
  } else {
    cache.create(cacheFile, res, next);
  }
};

module.exports = init;
