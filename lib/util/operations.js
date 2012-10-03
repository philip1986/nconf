
exports.isMergeable = function (obj) {
  return typeof obj === 'object' && obj && !Array.isArray(obj);
}

exports.mergeObjects = function (objs) {
  if (objs.length === 0) return void 0;
  var root = objs.shift();
  for(var i = 0; i < objs.length; i++) {
    var obj = objs[i];
    if (exports.isMergeable(root)) {
      for (var k in obj) {
        if (exports.isMergeable(root[k])) {
           root[k] = exports.mergeObjects([root[k], obj[k]]);
        }
        else {
           root[k] = obj[k];
        }
      }
    }
    else {
      root = obj;
      continue;
    }
  }
  return root;
}
 
exports.get = function (attrPath, current) {
   for (var i = 0; i < attrPath.length; i++) {
     var attrName = attrPath[i];
     if (attrName in current) {
       current = current[attrName];
     }
     else {
       current = void 0;
       break;
     }
   }
   return current;
}
exports.set = function (attrPath, current, value) {
   var root = current;
   if (attrPath.length === 0) {
      return value;
   }
   var endAttr = attrPath[attrPath.length - 1];
   for (var i = 0; i < attrPath.length - 1; i++) {
     var attrName = attrPath[i];
     if (attrName in current) {
       var next = current[attrName];
       if (exports.isMergeable(next)) {
         current = next;
         continue;
       }
     }
     current = current[attrName] = {};
   }
   current[endAttr] = value;
   return root;
}
exports.clear = function (attrPath, current) {
   var root = current;
   if (attrPath.length === 0) {
      return void 0;
   }
   var endAttr = attrPath[attrPath.length - 1];
   for (var i = 0; i < attrPath.length - 1; i++) {
     var attrName = attrPath[i];
     if (attrName in current) {
       current = current[attrName];
     }
     else {
       return root;
     }
   }
   if (current) {
      delete current[endAttr];
   }
   return root;
}

exports.merge = function (attrPath, current, value) {
   var root = current;
   if (attrPath.length === 0) {
      return exports.mergeObjects([current, value]);
   }
   var endAttr = attrPath[attrPath.length - 1];
   for (var i = 0; i < attrPath.length - 1; i++) {
     var attrName = attrPath[i];
     if (attrName in current) {
       var next = current[attrName];
       if (exports.isMergeable(value)) {
         current = next;
         continue;
       }
     }
     current = current[attrName] = {};
   }
   current[endAttr] = exports.mergeObjects([current[endAttr], value]);
   return root;
}