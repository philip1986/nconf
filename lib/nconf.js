/*
 * nconf.js: Top-level include for the nconf module
 *
 * (C) 2011, Nodejitsu Inc.
 *
 */

var fs = require('fs'),
    common = require('./nconf/common'),
    Provider = require('./nconf/provider').Provider,
    nconf = module.exports = new Provider();

//
// Setup all stores as lazy-loaded getters.
//
nconf.engines = {};
fs.readdirSync(__dirname + '/nconf/stores').forEach(function (file) {
  Object.defineProperty(nconf.engines, file.replace('.js', ''), {
    get: function () {
      return require('./nconf/stores/' + file);
    },
    enumerable: true
  });
  Object.defineProperty(nconf, file.replace('.js', '').replace(/./, function (c) {return c.toUpperCase()}), {
    get: function () {
      return require('./nconf/stores/' + file);
    },
    enumerable: true
  });
});

//
// Expose the various components included with nconf
//
nconf.common        = common;
nconf.formats       = require('./nconf/formats');
nconf.Provider      = Provider;
