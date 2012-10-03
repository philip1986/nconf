var utils = require('./util/operations');
var Store = require('./store.js');
var MemoryStore = module.exports = function (options) {
   options = options || {};
   Store.call(this);
   this.sync = true;
   this.root = options.root || {};
   return this;
 }
 MemoryStore.prototype = new Store();
 MemoryStore.prototype.constructor = MemoryStore;
 MemoryStore.prototype.get = function (path, callback) {
   path = this.getPath(path);
   var value = utils.get(path, this.root);
   if (callback) {
     callback(null, value)
   }
   return value;
 }
 MemoryStore.prototype.set = function (path, value, callback) {
   path = this.getPath(path);
   if (path.length === 0) {
     if (!utils.isMergeable(value)) {
       var err = new Error('Root must be an Object');
       if (callback) {
         callback(err);
         return void 0;
       }
       throw err;
     }
   }
   this.root = value = utils.set(path, this.root, value);
   if (callback) {
     callback(null, value)
   }
   return value;
 }
 MemoryStore.prototype.clear = function (path, callback) {
   path = this.getPath(path);
   if (path.length === 0) {
     this.root = {};
     if (callback) {
       callback(null, void 0);
     }
     return void 0;
   }
   this.root = result = utils.clear(path, this.root);
   if (callback) {
     callback(null, result);
   }
   return result;
 }
 MemoryStore.prototype.merge = function (path, value, callback) {
   path = this.getPath(path);
   if (path.length === 0) {
     if (!utils.isMergeable(value)) {
       var err = new Error('Root must be an Object');
       if (callback) {
         callback(err);
         return void 0;
       }
       throw err;
     }
   }
   var result = this.root = utils.merge(path, this.root, value);
   if (callback) {
      callback(null, result);
   }
   return result;
 }
 MemoryStore.prototype.save = function (callback) {
   return true;
 }
 MemoryStore.prototype.load = function (callback) {
   this.emit('load');
   return true;
 }