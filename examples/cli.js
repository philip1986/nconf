var nconfConfigs = require('../');
var AggregateStore = nconfConfigs.AggregateStore;
var CachedStore = nconfConfigs.CachedStore;
var ReadOnlyStore = nconfConfigs.ReadOnlyStore;
var SyncFileStore = nconfConfigs.SyncFileStore;
var PollingStore = nconfConfigs.PollingStore;
var EnvStore = nconfConfigs.EnvStore;


var config = new AggregateStore();
config.http().file().file().env().argv().defaults().overrides();
var authoritativeConfig = new CachedStore({store: new (require('./http.js'))({url:'http://localhost:9099'})});
var authoritativeCacheConfig = new CachedStore({store: new SyncFileStore({ file: 'config.remote.json' })});
var baseFile = new CachedStore({store: new SyncFileStore({ file: 'config.json' })});
config.add(authoritativeCacheConfig);
config.add(authoritativeConfig);
config.add(baseFile);
config.add(new ReadOnlyStore({store: new EnvStore()}));
config.add(new ReadOnlyStore({store: new EnvStore()}));
var actions = process.argv.slice(2);
for (var i = 0; i < actions.length; i++) {
   var action = actions[i];
   switch (action) {
      case 'save':
         console.error(config.save());
         break;
      case 'load':
         console.error(config.load());
         break;
      case 'get':
         console.log(config.get(actions[++i]));
         break;
      case 'set':
         console.error(config.set(actions[++i], JSON.parse(actions[++i])));
         break;
      case 'merge':
         console.error(config.merge(actions[++i], JSON.parse(actions[++i])));
         break;
      case 'clear':
         console.error(config.clear(actions[++i]));
         break;
      case 'reset':
         console.error(config.reset());
         break;
      default:
         console.error('UNKNOWN Action ' + action);
         break;
   }
}
setInterval(authoritativeConfig.load.bind(authoritativeConfig), 10 * 1000);
authoritativeConfig.on('load', function () {
   authoritativeConfig.replicate(authoritativeCacheConfig, authoritativeCacheConfig.save.bind(authoritativeCacheConfig));
});
