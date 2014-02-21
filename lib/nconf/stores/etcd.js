/*
 * etcd.js: Simple etcd storage engine
 *
 *
 */
var util = require('util'),
    sync = require('sync-operation'),
    Memory = require('./memory').Memory,
    httpSync = require('http-sync'),
    request = require('request'),
    async = require('async');

//
// ### function Etcd (options)
// #### @options {Object} Options for this instance
// Constructor function for the Etcd nconf store, a simple abstraction
// around the Memory store that can persist configuration to etcd.
//
var Etcd = exports.Etcd = function (options) {

  Memory.call(this, options);
  this.type   = options.type;

  this.cluster = options.cluster;
  this.key = options.key;
  this.readOnly = options.readOnly && true;
  this.sync = options.sync !== undefined ? options.sync : true;
  this.name = options.name;

  // TODO: react on cluster changes dynamic
  this._fetchCurrentCluster();

  if(this.sync) {
    this._watch();
  }
};

// Inherit from the Memory store
util.inherits(Etcd, Memory);

//
// ### function _fetchCurrentCluster ()
// Store all nodes of the requested etcd cluster at `this.cluster`
//
Etcd.prototype._fetchCurrentCluster = function() {
  var cluster = null,
      currentCluster = [];

  opts = {
    method: 'GET',
    path: '/v2/machines'
  }
  try {
    cluster = this._requestSync(opts).body.toString();
  } catch(e) {console.error(e);}

  if(cluster !== null && cluster !== ''){
    cluster.replace(/http:\/\/|\s/g, '').split(',').forEach(function(node){
      node = node.split(':');
      currentCluster.push({host: node[0], port: node[1]});
    });
  }
  else {
      throw new Error('Could not find etcd cluster!');
  }
  this.cluster = currentCluster;
  return null;
}

//
// ### function _etcd2json (body)
// ### @body {String} Result of a
// Converts the body of an etcd response into JSON
//
Etcd.prototype._etcd2json = function(body) {
  if (typeof body !== "undefined" && body !== null){
     try {
      body = JSON.parse(body)
    } catch(e){
      console.error(e);
    }
  }
  if((body.node != null ? body.node.value : void 0) != null) {
    body = body.node.value
    if(typeof(body) === 'object'){
      body = JSON.parse(body);
    }
  }
  else {
    body = {}
  }
  if(typeof(body) !== 'object'){
    body = JSON.parse(body);
  }
  return body;
}

//
// ### function _requestSync (opts)
// #### @opts {Object} Options for request
// Fires HTTP request and returns the result
//
Etcd.prototype._requestSync = function(opts) {
  var res = null;

  this.cluster.some(function(node){
    try {
      var request = httpSync.request({
          method: opts.method,
          headers: opts.headers || {},
          body: opts.body || {},

          protocol: 'http',
          host: node.host,
          port: node.port,
          path: opts.path,
      });
      var timedout = false;
      request.setTimeout(5000, function() {
          timedout = true;
      });
      var response = request.end();
      if(response.statusCode === 307){
        // TODO: follow the redirect directly
        return false;
      }
      if (!timedout && response.body !== null && response.body !== '') {
        res = response;
        return true;
      }
      else {
        console.warn(new Error('Could not reach node: ' + JSON.stringify(node)));
        return false;
      }
    }
    catch(e) {
      console.warn(e);
      return false;
    }
  });
  if (res === null) {
    throw new Error("No answer from any Etcd node");
  }
  return res;
}

//
// ### function saveSync (value, callback)
// #### @value {Object} _Ignored_ Left here for consistency
// Saves the current configuration object to etcd at `this.cluster` synchronously.
//
Etcd.prototype.saveSync = function(value) {
  if(this.readOnly) {
    return;
  }
  opts = {
    method: 'PUT',
    path: '/v2/keys/' + this.key,
    body: 'value=' + JSON.stringify(this.store)
  }
  try {
    this._requestSync(opts);
  }
  catch(e) { console.error(e); }
  return this.store;
}

//
// ### function loadSync ()
// Attempts to load the data stored in etcd at `this.cluster` synchronously
// and responds appropriately.
//
Etcd.prototype.loadSync = function () {
  var data;
  opts = {
    method: 'GET',
    path: '/v2/keys/' + this.key
  }

  try {
    data = this._requestSync(opts).body.toString();
    data = this._etcd2json(data);
  }
  catch(e) {
    console.error('Could not parse ' + data + ' to JSON. ' + e);
    data = {};
  }
  this.store = data;
  return(data);
}

//
// ### function _requestAsync (opts, callback)
// #### @opts {Object} Options for request
// #### @callback {function}
// Fires HTTP request and throws a callback with the result.
//
Etcd.prototype._requestAsync = function(opts, callback) {
  var self = this,
      err = null;

  async.detectSeries(this.cluster, function(node, cb) {
    opts = {
      method: opts.method,
      url: 'http://' + node.host + ':' + node.port + opts.path,
      qs: opts.qs || {}
    }

    request(opts, function(error, response, body){
      if(error !== null){
        err = error;
        console.warn(error);
        cb(false);
      }
      else {
        // cb(true);
        return callback(null, JSON.parse(body));
      }
    });
  }, function() {
    callback(err);
  });
}

//
// ### function _watch ()
// Sync the configuration object `this.store` with those
// stored under `this.key` in etcd
//
Etcd.prototype._watch = function() {
  var self = this;

  opts = {
    method: 'GET',
    path: '/v2/keys/' + self.key,
    qs: {wait: true}
  }

  this._requestAsync(opts, function(error, body){
    if(!error && !body.errorCode) {
      if(body.action === 'set') {
        self.store = JSON.parse(body.node.value);
      }
      else {
        self.reset();
      }
      self.emit('change', {store: self.name, data: self.store});
      self._watch();
    }
    else {
      console.error('Can not watch: ' + self.key + ' in store ' + self.name + ' -> ' + error);
      setTimeout(function(){self._watch();}, 10000);
    }
  });
}
