/*
 * http.js: Simple http storage engine for nconf files
 *
 * (C) 2011, Nodejitsu Inc.
 *
 */

var http = require('http'),
    url = require('url');
    util = require('util'),
    formats = require('../formats'),
    Memory = require('./memory');

//
// ### function Http (options)
// #### @options {Object} Options for this instance
// Constructor function for the Http nconf store, a simple abstraction
// around the Memory store that can persist configuration to disk.
//
var Http = module.exports = function (options) {
  if (!options || !options.url) {
    throw new Error ('Missing required option `url`');
  }

  Memory.call(this, options);

  this.type     = 'http';
  this.url      = options.url;
  this.poll     = options.poll || false;
  this.format   = options.format || formats.json;
  this.interval = options.interval || 60 * 1000;
  
  if (this.poll) {
    setInterval(this.load.bind(this, function () {}), this.interval);
  }
};

// Inherit from the Memory store
util.inherits(Http, Memory);

//
// ### function save (value, callback)
// #### @value {Object} _Ignored_ Left here for consistency
// #### @callback {function} Continuation to respond to when complete.
// Saves the current configuration object to disk at `this.file`
// using the format specified by `this.format`.
//
Http.prototype.save = function (value, callback) {
  if (!callback) {
    callback = value;
    value = null;
  }

  var self = this;
  var options = url.parse(self.url);
  options.method = 'put';
  var req = http.request(options);
  var done = false;
  req.on('error', function (e) {
    if (done) return;
    done = true;
    callback(e, null);
  });
  req.on('response', function (res) {
    if (done) return;
    done = true;
    if (res.statusCode > 299 || res.statusCode < 200) {
      callback(new Error('Status code ' + res.statusCode), null);
    }
    else {
      callback(null, self.store);
    }
  });
  req.write(JSON.stringify(self.store));
  req.end();
};

//
// ### function load (callback)
// #### @callback {function} Continuation to respond to when complete.
// Responds with an Object representing all keys associated in this instance.
//
Http.prototype.load = function (callback) {
  var self = this;
  var options = url.parse(self.url);
  var req = http.request(options);
  var done = false;
  req.on('error', function (e) {
    if (done) return;
    done = true;
    callback(e, null);
  });
  req.on('response', function (res) {
    if (res.statusCode > 299 || res.statusCode < 200) {
      done = true;
      callback(new Error('Status code ' + res.statusCode), null);
      return;
    }
    else {
      var store = '';
      res.on('error', function (e) {
         if (done) return;
         done = true;
         callback(e, null);
      });
      res.on('data', function (data) {
         store += data;
      });
      res.on('end', function () {
         if (done) return;
         done = true;
         try {
            self.store = self.format.parse(store);
         }
         catch (e) {
            callback(e, null);
            return;
         }
         callback(null, self.store);
      });
    }
  });
  req.end();
};
