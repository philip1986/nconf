var Store = require('./store.js');
var ReadOnlyStore = module.exports = function (options) {
   options = options || {};
   Store.call(this);
   this.store = options.store;
   this.sync = this.store.sync;
   return this;
 }
 ReadOnlyStore.prototype = new Store;
 ReadOnlyStore.prototype.constructor = ReadOnlyStore;
 ReadOnlyStore.prototype.merge = ReadOnlyStore.prototype.clear = ReadOnlyStore.prototype.set = function (path, value, callback) {
   if (callback) {
     callback(null, void 0);
   }
   return void 0;
 }
 ReadOnlyStore.prototype.get = function (path, callback) {
   return this.store.get(path, callback);
 }
 ReadOnlyStore.prototype.save = function (callback) {
   return this.store.save(callback);
 }
 ReadOnlyStore.prototype.load = function (callback) {
   return this.store.load(callback);
 }