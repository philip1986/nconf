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
   [{x: 0, y: ['1', '2'], z: {a: 3}}, 'x', 0],
   [{x: 0, y: ['1', '2'], z: {a: 3}}, 'z:a', 3],
   [{x: 0, y: ['1', '2'], z: {a: 3}}, ['z', 'a'], 3],
   [{x: 0, y: ['1', '2'], z: {a: 3}}, 'y:0', 1],
   [{x: 0, y: ['1', '2'], z: {a: 3}}, 'y', [1, 2]],
   [{x: 0, y: ['1', '2'], z: {a: 3}}, void 0, {x: 0, y: ['1', '2'], z: {a: 3}}],
   [{x: 0, y: ['1', '2'], z: {a: 3}}, null, {x: 0, y: ['1', '2'], z: {a: 3}}],
   [{x: 0, y: ['1', '2'], z: {a: 3}}, [], {x: 0, y: ['1', '2'], z: {a: 3}}],
   [{x: 0, y: ['1', '2'], z: {a: 3}}, '', void 0],
   [{'': '', ':': ':'}, '', ''],
   [{'': '', ':': ':'}, '\\:', ':']
];

clearList.forEach(function (spec, index) {
   var original = spec[0];
   var path = spec[1];
   var expected = spec[2];
   var config = new stores.MemoryStore({root: original});
   var result = config.get(path);
   assert.deepEqual(result, expected);
});