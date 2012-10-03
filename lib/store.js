var EventEmitter = require('events').EventEmitter;
var Store = module.exports = function (options) {
   EventEmitter.call(this);
  this.sync = false;
  return this;
}
Store.prototype = new EventEmitter();
Store.prototype.constructor = Store;
var emptyPath = [];
//
// Turns a string into an Array of Strings to follow as a path
//
Store.prototype.getPath = function (str) {
  if (str == null) return emptyPath;
  if (typeof str === 'object') return str;
  var offset = 0;
  var index = 0;
  var parts = [];
  while((index = str.indexOf(':', index)) !== -1) {
    if (index && str[index-1] === '\\') {
      index += 1;
      continue;
    }
    parts[parts.length]=decodeURIComponent(str.substring(offset, index)).replace(/\\/g, '');
    index = index + 1;
    offset = index;
  }
  parts[parts.length]=decodeURIComponent(str.substring(offset)).replace(/\\/g, '');
  return parts;
}
Store.prototype.replicate = function (destination, callback) {
   return this.get(null, function (err, value) {
      if (err) {
         callback(err, null);
         return void 0;
      }
      return destination.set(null, value, callback);
   });
}
Store.prototype.get = function (path, callback) {
  throw new Error('Not Implemented');
}
Store.prototype.set = function (path, value, callback) {
  throw new Error('Not Implemented');
}
Store.prototype.clear = function (path, callback) {
  throw new Error('Not Implemented');
}
Store.prototype.reset = function (callback) {
  return this.clear(null, callback);
};
Store.prototype.save = function (callback) {
  throw new Error('Not Implemented');
}
Store.prototype.load = function (callback) {
  throw new Error('Not Implemented');
}
