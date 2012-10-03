//
// Configuration provider
//
// Aggregates configuration stores to act as a asingle one
//
var utils = require('./util/operations');
var Store = require('./store.js');
var async = require('async');
var AggregateStore = module.exports = function (options) {
  Store.call(this);
  this.stores = [];
  return this;
}
AggregateStore.prototype = new Store;
AggregateStore.prototype.constructor = AggregateStore;
AggregateStore.prototype.get = function (path, callback) {
  var result = void 0;
  var isAsync = false;
  var self = this;
  path = this.getPath(path);
  async.map(this.stores, function (store, next) {
    if (store.sync) {
      var result = store.get(path);
      next(null, result);
    }
    else {
      isAsync = true;
      store.get(path, next);
    }
  }, function (err, values) {
    if (err) {
      callback(err, void 0);
      return;
    }
    result = utils.mergeObjects(values.filter(function (value) { return value !== void 0;}));
    if (callback) {
      callback(err, result);
    }
  });
  if (isAsync && !callback) {
    throw new Error('Async required by stores ' + this.stores.filter(function(store){return !store.sync;}).map(function(store){return store.name}));
  }
  return result;
}
//
// Add a store to the front of the queue for queries
//
AggregateStore.prototype.use = function (name, store, callback) {
  store.name = name;
  if (!(store instanceof Store)) {
    
  }
  return this.add({store: store}, callback);
}
AggregateStore.prototype.add = function (options, callback) {
  var store = options.store;
  if (options.readonly) {
    store = new ReadOnlyStore(store);
  }
  this.stores.unshift(store);
  store.load(callback);
  return this;
}
AggregateStore.prototype.remove = function (store, callback) {
  var index = -1;
  if (typeof store === 'string') {
    for (var i = 0; i < this.stores.length; i++) {
      if (stores[i].name === store) {
        index = i;
        break;
      }
    }
  }
  else {
    index = this.stores.indexOf(store);
  }
  if (index !== -1) {
    store = stores[index];
    this.stores.splice(index, 1);
  }
  if (callback) {
    callback(null, index !== -1);
  }
  return index !== -1;
}
//
// ALL DESTRUCTIVE / LOADING ACTIONS ARE DONE ON ALL STORES
//
AggregateStore.prototype.merge = function (path, value, callback) {
  var result = void 0;
  var isAsync = false;
  path = this.getPath(path);
  async.map(this.stores, function (store, next) {
    if (store.sync) {
      var result = store.merge(path, value);
      next(null, result);
    }
    else {
      isAsync = true;
      store.merge(path, value, next);
    }
  }, function (err, values) {
    if (err) {
      callback(err, void 0);
      return;
    }
    result = utils.mergeObjects(values.filter(function (value) { return value !== void 0;}));
    if (callback) {
      callback(err, result);
    }
  });
  if (isAsync && !callback) {
    throw new Error('Async required by stores ' + this.stores.filter(function(store){return !store.sync;}).map(function(store){return store.name}));
  }
  return result;
}
//
// 
//
AggregateStore.prototype.set = function (path, value, callback) {
  var result = void 0;
  var isAsync = false;
  path = this.getPath(path);
  async.map(this.stores, function (store, next) {
    if (store.sync) {
      var result = store.set(path, value);
      next(null, result);
    }
    else {
      isAsync = true;
      store.set(path, value, next);
    }
  }, function (err, values) {
    if (err) {
      callback(err, void 0);
      return;
    }
    result = utils.mergeObjects(values.filter(function (value) { return value !== void 0;}));
    if (callback) {
      callback(err, result);
    }
  });
  if (isAsync && !callback) {
    throw new Error('Async required by stores ' + this.stores.filter(function(store){return !store.sync;}).map(function(store){return store.name}));
  }
  return result;
}
//
// Removes an entry from the config
//
AggregateStore.prototype.clear = function (callback) {
  var result = void 0;
  var isAsync = false;
  async.map(this.stores, function (store, next) {
    if (store.sync) {
      var result = store.clear();
      next(null, result);
    }
    else {
      isAsync = true;
      store.clear(next);
    }
  }, function (err, values) {
    if (err) {
      callback(err, void 0);
      return;
    }
    result = utils.mergeObjects(values.filter(function (value) { return value !== void 0;}));
    if (callback) {
      callback(err, result);
    }
  });
  if (isAsync && !callback) {
    throw new Error('Async required by stores ' + this.stores.filter(function(store){return !store.sync;}).map(function(store){return store.name}));
  }
  return result;
}
AggregateStore.prototype.load = function (callback) {
  var result = void 0;
  var isAsync = false;
  async.map(this.stores, function (store, next) {
    if (store.sync) {
      var result = store.load();
      next(null, result);
    }
    else {
      isAsync = true;
      store.load(next);
    }
  }, function (err, values) {
    if (err) {
      callback(err, void 0);
      return;
    }
    result = utils.mergeObjects(values.filter(function (value) { return value !== void 0;}));
    if (callback) {
      callback(err, result);
    }
  });
  if (isAsync && !callback) {
    throw new Error('Async required by stores ' + this.stores.filter(function(store){return !store.sync;}).map(function(store){return store.name}));
  }
  return result;
}
AggregateStore.prototype.save = function (callback) {
  var result = void 0;
  var isAsync = false;
  async.map(this.stores, function (store, next) {
    if (store.sync) {
      var result = store.save();
      next(null, result);
    }
    else {
      isAsync = true;
      store.save(next);
    }
  }, function (err, values) {
    if (err) {
      callback(err, void 0);
      return;
    }
    result = utils.mergeObjects(values.filter(function (value) { return value !== void 0;}));
    if (callback) {
      callback(err, result);
    }
  });
  if (isAsync && !callback) {
    throw new Error('Async required by stores ' + this.stores.filter(function(store){return !store.sync;}).map(function(store){return store.name}));
  }
  return result;
}