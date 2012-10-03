//
// Memory store that is pulling from a different store that should not save until explicitly stated
//
var utils = require('./util/operations.js');
var MemoryStore = require('./memorystore.js');
var CachedStore = module.exports = function(options) {
  options = options || {};
  MemoryStore.call(this);
  this.source = options.store;
  this.source.on('load', this.emit.bind(this, 'load'));
  return this;
}
CachedStore.prototype = Object.create(MemoryStore.prototype);
CachedStore.prototype.constructor = CachedStore;
CachedStore.prototype.load = function (callback) {
  var self = this;
  return this.source.load(function (err) {
    if (err) { 
      if (callback) {
        callback(err, null);
      }
      return false;
    }
    return self.source.get(null, function (err, root) {
      if (!err) {
        if (utils.isMergeable(root)) {
          self.root = root;
        }
        else {
          self.root = {};
        }
      }
      if (callback) {
        callback(err, root);
      }
      return !err;
    })
  });
}
CachedStore.prototype.save = function (callback) {
  //
  // Save it to the memory representation of the async store to propagate the cache changes
  // Then save it after that is done
  //
  var self = this;
  return this.source.set(null, this.get(null), function (err, root) {
    if (err) { 
      if (callback) {
        callback(err, root);
      }
      return false;
    }
    return self.source.save(callback);
  });
}