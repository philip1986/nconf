/*
 * dir.js: Simple storage engine for loading directories of files in nconf
 *
 * (C) 2011, Nodejitsu Inc.
 *
 */

var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    async = require('async'),
    mkdirp = require('mkdirp'),
    formats = require('../formats'),
    Memory = require('./memory').Memory,
    exists = fs.exists || path.exists,
    existsSync = fs.existsSync || path.existsSync;

//
// ### function Dir (options)
// #### @options {Object} Options for this instance
// Constructor function for the Dir nconf store, a simple abstraction
// around the Memory store that can persist a directory of configuration
// files to disk.
//
var Dir = exports.Dir = function (options) {
  if (!options || !options.dir) {
    throw new Error ('Missing required option `dir`');
  }

  Memory.call(this, options);

  this.type     = 'dir';
  this.dir      = options.dir;
  this.env      = options.env || process.env.NODE_ENV || 'development';
  this.formats  = {};
  this.json_spacing = options.json_spacing || 2;
  this.matchers = {
    hasEnv: /^[^\.]+\.[^\.]+\.[A-Za-z0-9]+$/,
    getEnv: /^[^\.]+\.([^\.]+)\.[A-Za-z0-9]+$/
  };
};

// Inherit from the Memory store
util.inherits(Dir, Memory);

//
// ### function save (value, callback)
// #### @value {Object} _Ignored_ Left here for consistency
// #### @callback {function} Continuation to respond to when complete.
// Saves the current configuration object to files in the directory on
// disk at `this.dir` using the format specified by each file.
//
Dir.prototype.save = function (value, callback) {
  if (!callback) {
    callback = value;
    value = null;
  }

  var self = this;

  mkdirp(this.dir, function () {
    //
    // Ignore errors in-case the directory already exists
    // and then iterate over all keys in `this.store` and
    // save each value to the appropriate file.
    //
    async.forEach(
      Object.keys(this.store),
      function (key, next) {
        //
        // Get the information of the file to save.
        //
        var info   = self.formats[key],
            file   = info && info.file,
            format = info && info.format
              || 'json';

        //
        // If no file is found then default to
        // key.env.format
        //
        if (!file) {
          file = [key, self.env, format]
            .filter(Boolean)
            .join('.');
        }

        fs.writeFile(
          path.join(self.dir, file),
          formats[format].stringify(
            self.store[key],
            null,
            self.json_spacing
          ),
          'utf8',
          next
        );
      },
      callback
    );
  });
};

//
// ### function saveSync (value, callback)
// #### @value {Object} _Ignored_ Left here for consistency
// #### @callback {function} **Optional** Continuation to respond to when complete.
// Saves the current configuration object to files in the directory on
// disk at `this.dir` using the format specified by each file synchronously.
//
Dir.prototype.saveSync = function (value) {
  var self = this;

  //
  // Ignore errors when making `this.dir` in
  // case it already exists.
  //
  try { mkdirp.sync(this.dir) }
  catch (ex) { }

  Object.keys(this.store).forEach(function (key) {
    //
    // Get the information of the file to save.
    //
    var info   = self.formats[key],
        file   = info && info.file,
        format = info && info.format
          || 'json';

    //
    // If no file is found then default to
    // key.env.format
    //
    if (!file) {
      file = [key, self.env, format]
        .filter(Boolean)
        .join('.');
    }

    fs.writeFileSync(
      path.join(self.dir, file),
      formats[format].stringify(
        self.store[key],
        null,
        self.json_spacing
      ),
      'utf8'
    );
  });

  return this.store;
};

//
// ### function load (callback)
// #### @callback {function} Continuation to respond to when complete.
// Responds with an Object representing all keys associated in this instance.
//
Dir.prototype.load = function (callback) {
  var self = this;

  exists(self.dir, function (exists) {
    if (!exists) {
      return callback(null, {});
    }

    //
    // Else, the path exists, read all files from disk
    //
    self.list(function (err, files) {
      if (err) {
        return callback(err);
      }

      async.reduce(
        files,
        {},
        function (all, file, next) {
          var info;

          try { info = self._getInfo(file) }
          catch (ex) { return next(ex) }

          self.formats[info.key] = info;
          
          fs.readFile(path.join(self.dir, file), 'utf8', function (err, data) {
            if (err) {
              return next(err);
            }
            
            try {
              all[info.key] = formats[info.format].parse(data);
            }
            catch (ex) {
              return next(new Error('Error parsing: ' + file));
            }
            
            next(null, all);
          });
        },
        function (err, all) {
          if (err) {
            return callback(err);
          }

          self.store = all;
          callback(null, self.store);
        }
      );
    });
  });
};

//
// ### function loadSync (callback)
// Attempts to load the data stored in `this.dir` synchronously
// and responds appropriately.
//
Dir.prototype.loadSync = function () {
  var self = this,
      files,
      data;

  if (!existsSync(self.dir)) {
    self.store = {};
    data = {};
  }
  else {
    //
    // Else, the path exists, read it all files from disk
    //
    files = this.listSync();
    this.store = data = files.reduce(function (all, file) {
      try {
        var info = self._getInfo(file);

        self.formats[info.key] = info;
        all[info.key] = formats[info.format].parse(
          fs.readFileSync(path.join(self.dir, file))
        );

        return all;
      }
      catch (ex) {
        throw new Error('Error parsing: ' + file);
      }
    }, {});
  }

  return data;
};

//
// ### function list (callback)
// #### @callback {function} Continuation to respond to.
// Lists all files in `this.dir` that match the current environment
// (if `this.env` is set).
//
Dir.prototype.list = function (callback) {
  var self = this;

  fs.readdir(this.dir, function (err, files) {
    if (err) {
      return callback(err);
    }

    callback(null, files.filter(function (file) {
      return self._validFile(file);
    }));
  });
};

//
// ### function list (callback)
// Lists all files in `this.dir` that match the current environment
// (if `this.env` is set) synchronously.
//
Dir.prototype.listSync = function () {
  var self = this;

  return fs.readdirSync(this.dir).filter(function (file) {
    return self._validFile(file);
  });
};

//
// ### @private function _getInfo (file)
// #### @file {string} File to extract information from
// Extracts and returns relevant information (ext, format, key)
// about the specified `file`.
//
Dir.prototype._getInfo = function (file) {
  var ext    = path.extname(file),
      format = ext.slice(1),
      env    = this.matchers.getEnv.exec(file),
      key;

  key = path.basename(
    env ? file.replace('.' + env[1], '') : file,
    ext
  );

  if (!formats[format]) {
    throw new Error('Cannot parse unknown format: ' + format);
  }

  return {
    ext:    ext,
    key:    key,
    file:   file,
    format: format
  };
};

//
// ### @private function _validFile (file)
// #### @file {string} File to validate.
// Returns a value indicating whether the specified `file`
// is valid for this instance. A file is valid if:
// 1. The file has no environment. e.g. `foo.json`
// 2. The file has an environment and it matches ours. e.g. `foo.development.json`.
//
Dir.prototype._validFile = function (file) {
  return !this.matchers.hasEnv.test(file)
    || this.matchers.getEnv.exec(file)[1] === this.env;
};