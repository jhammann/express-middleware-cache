const del = require('del');
const fs = require('fs');
const md5 = require('spark-md5');
const path = require('path');
const write = require('write');

const cache = {
  /**
   * Returns a path to the cache file based on the filename and directory.
   * The directory itself can be provided when calling the module.
   * If no directory is provided the cache will be stored inside the .cache folder in the module.
   * The filename is based on the URL of the API that's being called. The URL is hashed by MD5
   * to create a proper filename.
   *
   * @method pathToFile
   * @param dir {String} The directory the cache has to be saved in.
   * @param file {String} The filename of the cached file.
   * @returns {*} The path to the cache file.
   */
  pathToFile: (dir, url) => (dir
    ? path.resolve(dir, md5.hash(url))
    : path.resolve(__dirname, './.cache', md5.hash(url))
  ),

  /**
   * Returns the time the cached file was modified.
   * This is used to determine the cache's expiration.
   *
   * @method fileLastModified
   * @param cacheFile {String} The file location of the cache.
   * @returns {*} The file's last modified time.
   */
  fileLastModified: (cacheFile) => {
    const fileStats = fs.statSync(cacheFile);
    return fileStats.mtime;
  },

  /**
   * Creates the cache based on the response of the next middleware.
   *
   * @method create
   * @param cacheFile {String} The file the cache will be saved as.
   * @param res {Object} The response object.
   * @param next {Object} The next object to invoke the next middleware in the stack.
   */
  create: (cacheFile, res, next) => {
    res.sendResponse = res.send;
    res.send = (body) => {
      write.sync(cacheFile, body);
      res.sendResponse(body);
    };
    next();
  },

  /**
   * Sends the cache as a JSON response.
   *
   * @method send
   * @param cacheFile {String} The cache that needs to be send.
   * @param res {Object} The response object.
   */
  send: (cacheFile, res) => {
    res.setHeader('content-type', 'application/json');
    res.send(fs.readFileSync(cacheFile, {
      encoding: 'utf8',
    }));
  },
};

const init = (duration, dir) => (req, res, next) => {
  /**
   * Check if the 'clear_cache' parameter is in the URL.
   * If it is present the cache has to be cleared but the URL is used to determine the cache.
   * The parameter is filtered out of the URL. It's important that it's always added as the last
   * parameter in the query string, either like '?clear_cache' or '&clear_cache'.
   */
  const clearCache = 'clear_cache' in req.query;
  let url = req.originalUrl;
  if (clearCache) {
    url = url.replace(/[?,&]clear_cache/g, '');
  }

  const cacheFile = cache.pathToFile(dir, url);

  if (fs.existsSync(cacheFile)) {
    /**
     * Check the filetime to see if it has expired. Get the duration (in minutes) to determine how
     * long a call should be cached. When no duration is present the default (30 minutes) is used.
     */
    const fileTime = cache.fileLastModified(cacheFile);
    const currentTime = new Date();
    const expires = duration || 30;
    const fileExpired = (currentTime - fileTime) / 1000 > (expires * 60);

    /**
     * Check if the cache has expired or if the cache has to be cleared.
     * If one of both is the case the cache has to be deleted and recreated with new data.
     * Otherwise the cached file should be send as a response.
     */
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
