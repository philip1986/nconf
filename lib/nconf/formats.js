/*
 * formats.js: Default formats supported by nconf
 *
 * (C) 2011, Nodejitsu Inc.
 *
 */

var ini = require('ini');

//
// ### @json
// Standard JSON format which pretty prints `.stringify()`.
//
exports.json = {
  stringify: function (obj, replacer, spacing) {
    return JSON.stringify(obj, replacer || null, spacing || 2)
  },
  parse: JSON.parse
};

//
// ### @ini
// Standard INI format supplied from the `ini` module
// http://en.wikipedia.org/wiki/INI_file
//
exports.ini = ini;
