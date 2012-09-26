/*
 * memory.js: Simple memory storage engine for nconf configuration(s)
 *
 * (C) 2011, Nodejitsu Inc.
 *
 */

var common = require('../common');
var merge = require('merge-recursive');

//
// ### function Memory (options)
// #### @options {Object} Options for this instance
// Constructor function for the Memory nconf store which maintains
// a nested json structure based on key delimiters `:`.
//
// e.g. `my:nested:key` ==> `{ my: { nested: { key: } } }`
//
var Memory = module.exports = function (options) {
  options       = options || {};
  this.type     = 'memory';
  this.store    = {};
  this.readOnly = false;
  this.loadFrom = options.loadFrom || null;
};

//
// ### function get (key)
// #### @key {string} Key to retrieve for this instance.
// Retrieves the value for the specified key (if any).
//
Memory.prototype.get = function (key) {
  var value = common.scope(common.path(key), this.store);
  return value;
};

//
// ### function set (key, value)
// #### @key {string} Key to set in this instance
// #### @value {literal|Object} Value for the specified key
// Sets the `value` for the specified `key` in this instance.
//
Memory.prototype.set = function (key, value) {
  if (this.readOnly) {
    return false;
  }

  //
  // Root must be an object
  //
  if (key == null) {
    if (!value || typeof value !== 'object') {
      return false;
    }
    else {
      this.reset();
      this.store = value;
      return true;
    }
  }
  var path = common.path(key);
  var attribute = path.pop();
  var target = common.ensure(path, this.store);
  target[attribute] = value;
  return true;
};

//
// ### function clear (key)
// #### @key {string} Key to remove from this instance
// Removes the value for the specified `key` from this instance.
//
Memory.prototype.clear = function (key) {
  if (this.readOnly) {
    return false;
  }

  var path      = common.path(key),
      attribute = path.pop(),
      target    = common.scope(path, this.store);

  if (target && typeof target === 'object') {
    delete target[attribute];
    return true;
  }
  return false;
};

//
// ### function merge (key, value)
// #### @key {string} Key to merge the value into
// #### @value {literal|Object} Value to merge into the key
// Merges the properties in `value` into the existing object value
// at `key`. If the existing value `key` is not an Object, it will be
// completely overwritten.
//
Memory.prototype.merge = function (key, value) {
  if (this.readOnly) {
    return false;
  }

  //
  // If the key is not an `Object` or is an `Array`,
  // then simply set it. Merging is for Objects.
  //
  if (typeof value !== 'object' || Array.isArray(value)) {
    return this.set(key, value);
  }

  var self      = this,
      path      = common.path(key),
      attribute = path.pop(),
      target    = common.ensure(path, this.store);
      
  //
  // If the current value at the key target is not an `Object`,
  // or is an `Array` then simply override it because the new value
  // is an Object.
  //
  if (target[attribute] == null || typeof target[attribute] !== 'object' || Array.isArray(target[attribute])) {
    target[attribute] = value;
    return true;
  }
  
  merge.recursive(target[attribute], value);
  return target;
};

//
// ### function reset (callback)
// Clears all keys associated with this instance.
//
Memory.prototype.reset = function () {
  if (this.readOnly) {
    return false;
  }
  this.store  = {};
  return true;
};

Memory.prototype.save = function (callback) {
  var store = this.store;
  if (this.saveSync) {
    store = this.saveSync();
  }
  if (callback) callback(null, store);
  return store;
}

Memory.prototype.saveSync = function (callback) {
  return this.store;
}

Memory.prototype.load = function (callback) {
  var store = this.store;
  if (this.loadSync) {
    store = this.loadSync();
  }
  if (callback) callback(null, store);
}

//
// ### function loadSync
// Returns the store managed by this instance
//
Memory.prototype.loadSync = function () {
  return this.store || {};
};
