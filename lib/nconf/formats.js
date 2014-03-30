/*
 * formats.js: Default formats supported by nconf
 *
 * (C) 2011, Nodejitsu Inc.
 *
 */

var ini = require('ini');
var yaml = require('js-yaml');

var formats = exports;

//
// ### @json
// Standard JSON format which pretty prints `.stringify()`.
//
formats.json = {
    stringify: function (obj, replacer, spacing) {
        return JSON.stringify(obj, replacer || null, spacing || 2)
    },
    parse: JSON.parse
};

//
// ### @yml
// Standard YAML format supplied from the `js-yaml` module
//
formats.yaml = formats.yml = {
    stringify: function (obj, replacer, spacing) {
        return yaml.safeDump(obj, {spacing: spacing || 2});
    },
    parse: yaml.safeLoad
};

//
// ### @ini
// Standard INI format supplied from the `ini` module
// http://en.wikipedia.org/wiki/INI_file
//
formats.ini = ini;
