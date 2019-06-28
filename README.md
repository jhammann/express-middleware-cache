# 📦 express-middleware-caching
<p>
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  <a href="https://github.com/jhammann/express-middleware-caching/blob/master/LICENSE">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" target="_blank" />
  </a>
</p>

For some of my projects I use Google Spreadsheets as an API for data. Google offers a JSON API which I request with an Express.js app so I can restructure it before using it in my application. Because the Google Spreadsheet API isn't super fast when requesting it and because I don't want to be rate limited I decided to look for caching modules that stored data on the disk. I thought [flat-cache](https://github.com/royriojas/flat-cache/) came pretty close but it doesn't have an expiration and uses a big file with a key for every request. I'd rather have multiple small files that uses an MD5 hash of the URL as a key. I also needed automatic and manual cache expiration. So that's how this module came to fruitation.

Basically you can add this as a middleware for your Express route and it takes the URL you're requesting, makes an MD5 hash of it and uses that as a filename for a cache file which contains the response. The next time you or anyone else requests the URL the cache middleware checks if the file exists on disk, checks wether it's expired or not and servers (or recreates) the cached data.

## Install
Add this module to your Express project:

```sh
npm install express-middleware-caching -S
```

## Usage
Say you have a route file that calls the index function of a controller. This function requests data from a source and you want this data cached on your server's disk. You can easily add this module as a middleware to handle the caching and expiration for you. Just add it to your `GET` route give it an expiration (*in minutes*) and optionally (but recommended) a path where the cache files should be saved (if none is supplied the cache will be saved in the module's folder under `.cache/`).

```js
// cars.route.js
const path = require('path');
const express = require('express');
const cache = require('express-middleware-caching');

const router = express.Router();
const carsController = require('../controllers/cars.controller');

// Cache the data for 10 minutes and save the cache in the project's root in the .cache/ folder.
router.get('/cars/:id/', cache(10, path.resolve('./.cache')), carsController.index);

module.exports = router;
```

Let's say the URL for this request is `http://localhost:3000/cars/391039`. The caching script will make an MD5 hash of this URL to use as a filename. The next time you request this URL the cache checks if a filename with the same MD5 hash exists and hasn't expired so it can serve it. Otherwise it will (re)create it.<br>**Note:** if you add parameters to the URL a new cache will be created since the MD5 hash will be different.

### Clearing the cache manually
You are able to clear the cache manually. You have to add the `clear_cache` _as a parameter_ to the URL you're requesting. The cache script first filters out the `clear_cache` so the MD5 hash won't change, then it deletes the cache file and recreates it with fresh data.<br>
**Note:** The `clear_cache` parameter always has to be at the end of the query string.<br>
Examples: <br>
`http://localhost:3000/cars/391039?clear_cache`<br>
`http://localhost:3000/cars/391039?color=purple&clear_cache`

## Author

👤 **Jeroen Hammann**

* Github: [@jhammann](https://github.com/jhammann)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/jhammann/express-middleware-caching/issues).

## 📝 License

Copyright © 2019 [Jeroen Hammann](https://github.com/jhammann).<br />
This project is [MIT](https://github.com/jhammann/express-middleware-caching/blob/master/LICENSE) licensed.
