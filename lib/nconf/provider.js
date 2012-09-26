/*
 * provider.js: Abstraction providing an interface into pluggable configuration storage.
 *
 * (C) 2011, Nodejitsu Inc.
 *
 */

var async = require('async'),
    common = require('./common');
    

//
// ### function Provider (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Provider object responsible
// for exposing the pluggable storage features of `nconf`.
//
var Provider = exports.Provider = function (options) {
  //
  // Setup default options for working with `stores`,
  // `overrides`, `process.env` and `process.argv`.
  //
  options       = options || {};
  this.stores  = {};
  this.sources = [];
  this.init(options);
};

//
// Define wrapper functions for using basic stores
// in this instance
//
['argv', 'env', 'http'].forEach(function (type) {
  Provider.prototype[type] = function (options) {
    options = options || {};
    options.type = type;
    return this.add(type, options);
  };
});

//
// ### function file (key, options)
// #### @key {string|Object} Fully qualified options, name of file store, or path.
// #### @path {string|Object} **Optional** Full qualified options, or path.
// Adds a new `File` store to this instance. Accepts the following options
//
//    nconf.file({ file: '.jitsuconf', dir: process.env.HOME, search: true });
//    nconf.file('path/to/config/file');
//    nconf.file('userconfig', 'path/to/config/file');
//    nconf.file('userconfig', { file: '.jitsuconf', search: true });
//
Provider.prototype.file = function (key, options) {
  if (arguments.length == 1) {
    options = key;
    key = 'file';
  }
  options = typeof options === 'string'
    ? { file: options }
    : options;
  
  options.type = 'file';
  return this.add(key, options);
};

//
// Define wrapper functions for using 
// overrides and defaults
//
['defaults', 'overrides'].forEach(function (type) {
  Provider.prototype[type] = function (options) {
    options = options || {};
    options.type = options.type || 'literal';

    return this.add(type, options);
  };
});

//
// ### function use (name, options)
// #### @type {string} Type of the nconf store to use.
// #### @options {Object} Options for the store instance.
// Adds (or replaces) a new store with the specified `name`
// and `options`. If `options.type` is not set, then `name`
// will be used instead:
//
//    provider.use('file');
//    provider.use('file', { type: 'file', file: '/path/to/userconf' })
//
Provider.prototype.use = function (name, options) {
  options  = options      || {};
  var type = options.type || name;

  var store = this.stores[name],
      update = store && !sameOptions(store);

  if (store) {
    this.remove(name);
  }

  this.add(name, options);
  return this;
};

//
// ### function add (name, options)
// #### @name {string} Name of the store to add to this instance
// #### @options {Object} Options for the store to create
// Adds a new store with the specified `name` and `options`. If `options.type`
// is not set, then `name` will be used instead:
//
//    provider.add('memory');
//    provider.add('userconf', { type: 'file', filename: '/path/to/userconf' })
//
var nconf = null;
Provider.prototype.add = function (name, options, cb) {
  options  = options      || {};
  var store;
  nconf = nconf || require('../nconf');
  if (options instanceof nconf.engines.memory) {
    store = this.stores[name] = options;
  }
  else {
    var type = options.type || name;
    if (!nconf.engines[type]) {
      throw new Error('Cannot add store with unknown type: ' + type);
    }
  
    store = this.stores[name] = new nconf.engines[type](options);
  }
  if (cb && store.load) {
    store.load(cb);
  }
  else if (store.loadSync) {
    store.loadSync();
  }
  else {
    throw new Error('Unable to load store with name: ' + name)
  }

  return this;
};

//
// ### function remove (name)
// #### @name {string} Name of the store to remove from this instance
// Removes a store with the specified `name` from this instance. Users
// are allowed to pass in a type argument (e.g. `memory`) as name if
// this was used in the call to `.add()`.
//
Provider.prototype.remove = function (name) {
  delete this.stores[name];
  return this;
};

//
// ### function init (options)
// #### @options {Object} Options to initialize this instance with.
// Initializes this instance with additional `stores` or `sources` in the
// `options` supplied.
//
Provider.prototype.init = function (options) {
  var self = this;

  //
  // Add any stores passed in through the options
  // to this instance.
  //
  if (options.type) {
    this.add(options.type, options);
  }
  else if (options.store) {
    this.add(options.store.name || options.store.type, options.store);
  }
  else if (options.stores) {
    Object.keys(options.stores).forEach(function (name) {
      var store = options.stores[name];
      self.add(store.name || name || store.type, store);
    });
  }
};

//
// ### function get (key, callback)
// #### @key {string} Key to retrieve for this instance.
// #### @callback {function} **Optional** Continuation to respond to when complete.
// Retrieves the value for the specified key (if any).
//
Provider.prototype.get = function (key, callback) {
  //
  // If there is no callback we can short-circuit into the default
  // logic for traversing stores.
  //
  var self = this;
  var results = null;
  var mergedValue = void 0;
  async.forEach(Object.keys(this.stores).reverse(), function (storeName, next) {
    var store = self.stores[storeName];
    var value = store.get(key);
    if (value !== void 0) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        ;(results || (results = [])).push(value);
      }
      else {
        results = null;
        mergedValue = value;
      }
    }
    next();
  }, function (err) {
    if (err) {
      onError(err, callback);
    }
    if (results !== null) {
      mergedValue = common.merge(results.reverse());
    }
  });
  return mergedValue;
};

//
// ### function set (key, value, callback)
// #### @key {string} Key to set in this instance
// #### @value {literal|Object} Value for the specified key
// #### @callback {function} **Optional** Continuation to respond to when complete.
// Sets the `value` for the specified `key` in this instance.
//
Provider.prototype.set = function (key, value, callback) {
  var self = this;
  async.forEach(Object.keys(this.stores), function (storeName, next) {
    var store = self.stores[storeName];
    store.set(key, value);
    next();
  }, callback);
};

//
// ### function reset (callback)
// #### @callback {function} **Optional** Continuation to respond to when complete.
// Clears all keys associated with this instance.
//
Provider.prototype.reset = function (callback) {
  var self = this;
  async.forEach(Object.keys(this.stores), function (storeName, next) {
    var store = self.stores[storeName];
    store.reset();
    next();
  }, callback);
};

//
// ### function clear (key, callback)
// #### @key {string} Key to remove from this instance
// #### @callback {function} **Optional** Continuation to respond to when complete.
// Removes the value for the specified `key` from this instance.
//
Provider.prototype.clear = function (key, callback) {
  var self = this;
  async.forEach(Object.keys(this.stores), function (storeName, next) {
    var store = self.stores[storeName];
    store.clear();
    next();
  }, callback);
};

//
// ### function merge ([key,] value [, callback])
// #### @key {string} Key to merge the value into
// #### @value {literal|Object} Value to merge into the key
// #### @callback {function} **Optional** Continuation to respond to when complete.
// Merges the properties in `value` into the existing object value at `key`.
//
// 1. If the existing value `key` is not an Object, it will be completely overwritten.
// 2. If `key` is not supplied, then the `value` will be merged into the root.
//
Provider.prototype.merge = function (key, value, callback) {
  var self = this;
  async.forEach(Object.keys(this.stores), function (storeName, next) {
    var store = self.stores[storeName];
    store.merge(key, value);
    next();
  }, callback);
};

//
// ### function load (callback)
// #### @callback {function} Continuation to respond to when complete.
// Responds with an Object representing all keys associated in this instance.
//
Provider.prototype.load = function (callback) {
  var self = this;

  function getStores () {
    var stores = Object.keys(self.stores);
    stores.reverse();
    return stores.map(function (name) {
      return self.stores[name];
    });
  }

  function loadStoreSync(store) {
    if (!store.loadSync) {
      throw new Error('nconf store ' + store.type + ' has no loadSync() method');
    }

    return store.loadSync();
  }

  function loadStore(store, next) {
    if (!store.load && !store.loadSync) {
      return next(new Error('nconf store ' + store.type + ' has no load() method'));
    }

    return store.loadSync
      ? next(null, store.loadSync())
      : store.load(next);
  }

  function loadBatch (targets, done) {
    if (!done) {
      common.merge(targets.map(loadStoreSync));
      return;
    }

    async.map(targets, loadStore, function (err, objs) {
      return err ? done(err) : done(null, common.merge(objs));
    });
  }

  function mergeSources (data) {
    //
    // If `data` was returned then merge it into
    // the system store.
    //
    if (data && typeof data === 'object') {
      self.use('sources', {
        type: 'literal',
        store: data
      });
    }
  }

  function loadSources () {
    var sourceHierarchy = self.sources.splice(0);
    sourceHierarchy.reverse();

    //
    // If we don't have a callback and the current
    // store is capable of loading synchronously
    // then do so.
    //
    if (!callback) {
      mergeSources(loadBatch(sourceHierarchy));
      loadBatch(getStores());
      return;
    }

    loadBatch(sourceHierarchy, function (err, data) {
      if (err) {
        return callback(err);
      }

      mergeSources(data);
      return loadBatch(getStores(), callback);
    });
  }

  return self.sources.length
    ? loadSources()
    : loadBatch(getStores(), callback);
};

//
// ### function save (callback)
// #### @callback {function} **optional**  Continuation to respond to when 
// complete.
// Instructs each provider to save.  If a callback is provided, we will attempt
// asynchronous saves on the providers, falling back to synchronous saves if
// this isn't possible.  If a provider does not know how to save, it will be
// ignored.  Returns an object consisting of all of the data which was
// actually saved.
//
Provider.prototype.save = function (callback) {
  var self = this;
  var wasAsync = false;
  var result;
  async.map(Object.keys(this.stores), function (storeName, next) {
    var store = self.stores[storeName];
    store.save ? (wasAsync = true, store.save(next)) : next(null, store.saveSync ? store.saveSync() : void 0);
  }, function (err, stores) {
    if (err) onError(err, callback);
    result = common.merge(stores);
    callback && callback(null, result);
  });
  if (!wasAsync) return result;
};

//
// Throw the `err` if a callback is not supplied
//
function onError(err, callback) {
  if (callback) {
    return callback(err);
  }
  throw err;
}
