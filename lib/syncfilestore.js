var fs = require('fs');
var path = require('path');
var url = require('url');
var Store = require('./store');
var utils = require('./util/operations.js');
var SyncFileStore = module.exports = function(options) {
   Store.call(this);
   this.stync = true;
   this.filepath = path.resolve(process.cwd(), options.file);
   return this;
}
SyncFileStore.prototype = new Store();
SyncFileStore.prototype.constructor = SyncFileStore;
SyncFileStore.prototype.get = function (attrPath, callback) {
   var valueString;
   try {
      valueString = fs.readFileSync(this.filepath);
   }
   catch (err) {
      if (err.code === 'ENOENT') {
         if (callback) {
            callback(null, void 0);
         }
         return void 0;
      }
      if (callback) {
         callback(err, void 0);
         return void 0;
      }
      throw err;
   }
   var value;
   try {
      JSON.parse(valueString);
   }
   catch (err) {
      if (callback) {
         callback(err, void 0);
         return void 0;
      }
      throw err;
   }
   var result = utils.get(this.getPath(attrPath), value);
   if (callback) {
      callback(null, result);
   }
   return result;
}
SyncFileStore.prototype.set = function (attrPath, newValue, callback) {
   var valueString;
   var value;
   try {
      valueString = fs.readFileSync(this.filepath);
   }
   catch (err) {
      // Just set it
   }
   if (valueString) { 
      try {
         value = JSON.parse(valueString);
      }
      catch (err) {
         value = {};
      }
   }
   else {
      value = {};
   }
   value = utils.set(this.getPath(attrPath), value, newValue);
   try {
      fs.writeFileSync(this.filepath, JSON.stringify(value));
   }
   catch (err) {
      if (callback) {
         callback(err, void 0);
         return void 0;
      }
      throw err;
   }
   if (callback) {
      callback(null, value);
   }
   return value;
}
SyncFileStore.prototype.merge = function (attrPath, newValue, callback) {
   var valueString;
   var value;
   try {
      valueString = fs.readFileSync(this.filepath);
   }
   catch (err) {
      // Just set it
   }
   if (valueString) { 
      try {
         value = JSON.parse(valueString);
      }
      catch (err) {
         value = {};
      }
   }
   else {
      value = {};
   }
   value = utils.merge(this.getPath(attrPath), value, newValue);
   try {
      fs.writeFileSync(this.filepath, JSON.stringify(value));
   }
   catch (err) {
      if (callback) {
         callback(err, void 0);
         return void 0;
      }
      throw err;
   }
   if (callback) {
      callback(null, value);
   }
   return value;
}
SyncFileStore.prototype.clear = function (attrPath, callback) {
   var valueString;
   var value;
   try {
      valueString = fs.readFileSync(this.filepath);
   }
   catch (err) {
      // Just set it
   }
   if (valueString) { 
      try {
         value = JSON.parse(valueString);
      }
      catch (err) {
         value = {};
      }
   }
   else {
      value = {};
   }
   value = utils.clear(this.getPath(attrPath), value);
   try {
      fs.writeFileSync(this.filepath, JSON.stringify(value), {flags:'w+'});
   }
   catch (err) {
      if (callback) {
         callback(err, void 0);
         return void 0;
      }
      throw err;
   }
   if (callback) {
      callback(null, value);
   }
   return value;
}
//
// Saves on 'set'
//
SyncFileStore.prototype.save = function (callback) {
   if (callback) {
      callback(null);
   }
}
//
// Loads on 'get'
//
SyncFileStore.prototype.load = function (callback) {
   this.emit('load');
   if (callback) {
      callback(null);
   }
}