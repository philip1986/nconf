var http = require('http');
var MemoryStore = require('../').MemoryStore;
var config = new MemoryStore();
var emptyPath = [];
config.getPath = function (str) {
  if (str == null) return emptyPath;
  if (typeof str === 'object') return str;
  var offset = 0;
  var index = 0;
  var parts = [];
  while((index = str.indexOf('/', index)) !== -1) {
    if (index && str[index-1] === '\\') {
      index += 1;
      continue;
    }
    parts[parts.length]=decodeURIComponent(str.substring(offset, index)).replace(/\\/g, '');
    index = index + 1;
    offset = index;
  }
  parts[parts.length]=decodeURIComponent(str.substring(offset)).replace(/\\/g, '');
  return parts;
}

var server = http.createServer(function (req, res) {
   var path = req.url.replace(/^\//,'');
   if (path.length === 0) {
      path = void 0;
   }
   console.error(path, config)
   switch (req.method.toLowerCase()) {
      case 'get':
         res.end(JSON.stringify(config.get(path)));
         break;
      case 'put':
         var buffers = [];
         req.on('data', function (data) {buffers.push(data);});
         req.on('end', function () {
            res.end(JSON.stringify(config.set(path, JSON.parse(buffers.join('')))));
            console.error(config, JSON.parse(buffers.join('')))
         });
         break;
      case 'post':
         var buffers = [];
         req.on('data', function (data) {buffers.push(data);});
         req.on('end', function () {
            res.end(JSON.stringify(config.merge(path, JSON.parse(buffers.join('')))));
         });
         break;
      case 'delete':
         var buffers = [];
         req.on('data', function (data) {buffers.push(data);});
         req.on('end', function () {
            res.end(JSON.stringify(config.clear(path, JSON.parse(buffers.join('')))));
         });
         break;
   }
}).listen(process.argv[2]);