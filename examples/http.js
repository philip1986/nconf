var http = require('http');
var https = require('https');
var path = require('path');
var url = require('url');
var Store = require('../').Store;

var HTTPStore = module.exports = function(options) {
   Store.call(this);
   this.url = url.parse(options.url);
   return this;
}
HTTPStore.prototype = new Store;
HTTPStore.prototype.constructor = HTTPStore;
HTTPStore.prototype.get = function (attrPath, callback) {
   var opts = Object.create(this.url);
   opts.method = 'GET';
   opts.path = path.join(opts.path, attrPath);
   var req = http.request(opts);
   var buffers = [];
   req.on('response', function (res) {
      res.on('data', function (data) {
         buffers.push(data);
      });
      res.on('end', function () {
         var valueStr = buffers.join('');
         var value;
         try {
            value = JSON.parse(valueStr);
         }
         catch (e) {
            callback(e, void 0);
            return;
         }
         console.log('got', value)
         callback(null, value);
      });
   });
   req.on('error', callback);
   req.end();
}
HTTPStore.prototype.set = function (attrPath, value, callback) {
   var opts = Object.create(this.url);
   opts.method = 'PUT';
   opts.path = path.join(opts.path, attrPath);
   var req = http.request(opts);
   var buffers = [];
   req.on('response', function (res) {
      res.on('data', function (data) {
         buffers.push(data);
      });
      res.on('end', function () {
         var valueStr = buffers.join('');
         var value;
         try {
            value = JSON.parse(valueStr);
         }
         catch (e) {
            callback(e, void 0);
            return;
         }
         callback(null, value);
      });
   });
   req.on('error', callback);
   var valueString;
   try {
      valueString = JSON.stringify(value);
   }
   catch (e) {
      callback(e, void 0);
      return;
   }
   req.write(valueString);
   req.end();
}
HTTPStore.prototype.merge = function (attrPath, value, callback) {
   var opts = Object.create(this.url);
   opts.method = 'POST';
   opts.path = path.join(opts.path, attrPath);
   var req = http.request(opts);
   var buffers = [];
   req.on('response', function (res) {
      res.on('data', function (data) {
         buffers.push(data);
      });
      res.on('end', function () {
         var valueStr = buffers.join('');
         var value;
         try {
            value = JSON.parse(valueStr);
         }
         catch (e) {
            callback(e, void 0);
            return;
         }
         callback(null, value);
      });
   });
   req.on('error', callback);
   var valueString;
   try {
      valueString = JSON.stringify(value);
   }
   catch (e) {
      callback(e, void 0);
      return;
   }
   req.write(valueString);
   req.end();
}
HTTPStore.prototype.clear = function (attrPath, callback) {
   var opts = Object.create(this.url);
   opts.method = 'DELETE';
   opts.path = path.join(opts.path, attrPath);
   var req = http.request(opts);
   var buffers = [];
   req.on('response', function (res) {
      res.on('data', function (data) {
         buffers.push(data);
      });
      res.on('end', function () {
         var valueStr = buffers.join('');
         var value;
         try {
            value = JSON.parse(valueStr);
         }
         catch (e) {
            callback(e, void 0);
            return;
         }
         callback(null, value);
      });
   });
   req.on('error', callback);
   req.end();
}
//
// Saves on 'set'
//
HTTPStore.prototype.save = function (callback) {
   if (callback) {
      callback(null);
   }
}
//
// Loads on 'get'
//
HTTPStore.prototype.load = function (callback) {
   this.emit('load');
   if (callback) {
      callback(null);
   }
}