Hierarchical node.js configuration with etcd, files, environment variables, command-line arguments, and atomic object merging.

This is a fork from https://github.com/flatiron/nconf, with the purpose to add etcd as a configuration source.

## Example

``` js
var nconf = require('./lib/nconf'),
    path  = require('path');

var cluster = [
  { host: '127.0.0.1', port: 4001 },
  { host: '127.0.0.1', port: 4002 }
];

//
// Configure the provider with a single store and
// support for command-line arguments and environment
// variables.
//
var single = new nconf.Provider({
  env: true,
  argv: true,
  store: {
    type: 'etcd',
    key: 'databases/db1', // the etcd path
    cluster: cluster, // at least one ip addess and port of a etcd node
    readOnly: false, // is true by default
    sync: true // is true by default
  }
});

// Assuming that under the key 'databases/db1' etcd stores something like:
// "db1": {
//   "host": "127.0.0.1",
//   "user": "root",
//   "password": "secret"
// }

console.log(single.get('db1'));
// this will return:
// {
//   "host": "127.0.0.1",
//   "user": "root",
//   "password": "secret"
// }

console.log(single.get('db1:host'));
// and this will return:
// "127.0.0.1"


// Configure the provider with multiple hierarchical stores
// representing `user`(via etcd) and `global`(via file) configuration values.

var multiple = new nconf.Provider({
  stores: [
    { name: 'user', type: 'etcd', key: 'databases/db1', cluster: cluster},
    { name: 'global', type: 'file', file: path.join(__dirname, 'global-config.json') }
  ]
});

// Assuming that under the key 'databases/db1' etcd stores something like:
// "db1": {
//   "host": "127.0.0.1",
//   "user": "root",
//   "password": "secret"
// }
// and the file 'global-config.json' includes something like:
// "db1": {
//   "host": "127.0.0.1",
//   "user": "ro",
//   "password": "dummy",
//   "port": 3006
// }

console.log(multiple.get('db1'));
// this will return:
// {
//   host: '127.0.0.1',
//   user: 'root',
//   password: 'secret',
//   port: 3006
// }

//
// Setup nconf to use etcd stores and set a couple of values;
//
nconf.etcd('A', {key: 'databases/db1', cluster: cluster, readOnly: false})
      .etcd('B', {key: 'databases/db2', cluster: cluster, readOnly: false})

nconf.set('db2:host', '10.0.10.18'); // this will be set and later saved in A and B
nconf.set('A','db1:port', 3007);  // this will be set and later saved in A

//
// Save the configuration object on etcd
//
nconf.save()

//
// Setup nconf to use etcd store and allow the store to keep synced with etcd.
//
nconf.etcd('A', {key: 'databases/db1', cluster: cluster, sync: true})

//
// Observe the configuration object
//
nconf.on('change', function(obj){
  // Assuming something changed etcd that is stored under the key 'databases/db1'.
  // Considering the hierarchy nconf.get() will deliver the latest configuration.
  // This is just to inform the app about something changed.
  console.log(obj);
  // obj will be like:
  // { store: 'A',
  //   data: { 'the updated data from this store' }
  // }
});


```


## Installation

### Installing npm (node package manager)
```
  curl http://npmjs.org/install.sh | sh
```

### Installing nconf
```
  [sudo] npm install nconf
```

## More Documentation
There is more documentation available through docco. I haven't gotten around to making a gh-pages branch so in the meantime if you clone the repository you can view the docs:

```
  open docs/nconf.html
```

## Run Tests
Tests are written in vows and give complete coverage of all APIs and storage engines.

``` bash
  $ npm test
```

#### Author: [Charlie Robbins](http://nodejitsu.com)
#### License: MIT

[0]: http://github.com/indexzero/nconf-redis
