var optimist = require('optimist');

var HelperStore = module.exports = function () {
   AggregateStore.call(this);
   this.defaultsStore = null;// new MemoryStore();
   this.overridesStore = null;//new MemoryStore();
   return this;
}

HelperStore.prototype.argv = function (options) {
   var opts = Object.create(options);
   opts.root = optimist.argv;
   this.add(new MemoryStore(opts));
   return this;
}
HelperStore.prototype.defaults = function (values) {
   this.defaults = new MemoryStore({root: values});
   return this;
}
HelperStore.prototype.env = function (options) {
   var opts = Object.create(options);
   opts.root = process.argv;
   this.add(new MemoryStore(opts));
   return this;
}
HelperStore.prototype.file = function (options) {
   this.add(new CachedStore({store: new SyncFileStore(options)}));
   return this;
}
HelperStore.prototype.http = function (options) {
   this.add(new CachedStore({store: new HTTPStore(options)}));
   return this;
}
HelperStore.prototype.literal = function (options) {
   this.add(new MemoryStore(options));
   return this;
}
HelperStore.prototype.overrides = function (values) {
   this.overrides = new MemoryStore({root: values});
   return this;
}
