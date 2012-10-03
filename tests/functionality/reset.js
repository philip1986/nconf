var assert = require('assert');
var stores = require('../..');

//
// Needed to remove an explicitly set property so Object.keys works
//
function deleteProperty(obj, path) {
   delete obj[path];
   return obj;
}

var clearList = [
   [{x: 0, y: ['1', '2'], z: {a: 3}}],
   [{'': '', ':': ':'}],
   [{'': '', ':': ':'}]
];

clearList.forEach(function (spec, index) {
   var original = spec[0];
   var config = new stores.MemoryStore({root: original});
   var result = config.reset();
   assert.deepEqual(result, void 0);
});