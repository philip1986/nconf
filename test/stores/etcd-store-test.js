/*
 * etcd-store-test.js: Tests for the nconf File store.
 *
 *
 */

var vows = require('vows'),
    assert = require('assert'),
    nconf = require('../../lib/nconf'),
    data = require('../fixtures/etcd.json'),
    sinon = require('sinon'),
    httpSync = require('http-sync'),
    nock = require('nock'),
    store,
    cluster = [
      { host: '127.0.0.1', port: 4001 },
      { host: '127.0.0.1', port: 4002 }
    ];

// stub the reuests to etcd
httpSync.request = function(options) {
  if(typeof(data[options.path]) === 'object') {
    body = JSON.stringify(data[options.path]);
  }
  else {
    body = data[options.path];
  }
  returnObj = {
    setTimeout: function() {},
    end: function() {
      if(options.method === 'GET') {
        return {body: body};
      }
      if(options.method === 'PUT') {
        return {body: 'fake'};
      }
    }
  }
  return returnObj;
}

vows.describe('nconf/stores/etcd').addBatch({
  "When using the nconf etcd store with readOnly: false and sync: false": {
    topic: function() {
      spyRequestSync = sinon.spy(httpSync, 'request');
      store = new nconf.Etcd({key: 'mysql/db1', cluster: cluster, readOnly: false, sync: false});
      return store;
    },
    "should create a new etcd store": function () {
        assert.isObject(store);

        assert.equal(4, store.cluster.length);
        assert.equal('mysql/db1', store.key);
        assert.isFalse(store.sync);
        assert.isFalse(store.readOnly);
      },
      "the loadSync() method": {
        "should load the data correctly": function() {
          store.loadSync();
          storedData = JSON.parse(data['/v2/keys/mysql/db1'].node.value);
          assert.deepEqual(storedData, store.store);
        }
      },
      "the set() method": {
        "should respond with true": function () {
          assert.isTrue(store.set('foo:bar:bazz', 'buzz'));
          assert.isTrue(store.set('falsy:number', 0));
          assert.isTrue(store.set('falsy:string', ''));
          assert.isTrue(store.set('falsy:boolean', false));
          assert.isTrue(store.set('falsy:object', null));
        }
    },
      "the get() method" : {
        "should respond with the correct value": function () {
          assert.equal(store.get('db1:host'), '127.0.0.1');
          assert.equal(store.get('db1:user'), 'root');
          assert.equal(store.get('db1:password'), 'supersecret');
          assert.equal(store.get('foo:bar:bazz'), 'buzz');
          assert.equal(store.get('falsy:number'), 0);
          assert.equal(store.get('falsy:string'), '');
          assert.equal(store.get('falsy:boolean'), false);
          assert.equal(store.get('falsy:object'), null);
          }
      },
        "the saveSync() method" : {
          "should put the current data in the store to etcd ": function () {
            store.saveSync();

            assert.equal(spyRequestSync.args.length, 3);
            assert.equal(spyRequestSync.args[0][0].method, 'GET');
            assert.equal(spyRequestSync.args[1][0].method, 'GET');
            assert.equal(spyRequestSync.args[2][0].method, 'PUT');

            assert.equal(spyRequestSync.args[2][0].path, '/v2/keys/mysql/db1');
            assert.isString(spyRequestSync.args[2][0].body);

            body = JSON.parse(spyRequestSync.args[2][0].body.replace('value=', ''));
            storedData = JSON.parse(data['/v2/keys/mysql/db1'].node.value);

            assert.deepEqual(body['db1'], storedData['db1']);
            assert.equal(body['foo']['bar']['bazz'], 'buzz');
            assert.isObject(body['falsy']);
        }
      }
    }
}).addBatch( {
  "When using the nconf etcd store with readOnly: true and sync: false": {
    topic: function() {
      spyRequestSync.restore();
      spyRequestSync = sinon.spy(httpSync, 'request');
      store = new nconf.Etcd({key: 'mysql/db1', cluster: cluster, readOnly: true, sync: false});
      return store;
    },
    "should create a new etcd store": function () {
        assert.isObject(store);
        assert.equal(4, store.cluster.length);
        assert.equal('mysql/db1', store.key);
        assert.isFalse(store.sync);
        assert.isTrue(store.readOnly);
      },
      "the loadSync() method": {
        "should load the data correctly": function() {
          store.loadSync();
          storedData = JSON.parse(data['/v2/keys/mysql/db1'].node.value);
          assert.deepEqual(storedData, store.store);
        }
      },
      "the set() method": {
        "should respond with true": function () {
          assert.isFalse(store.set('foo:bar:bazz', 'buzz'));
          assert.isFalse(store.set('falsy:number', 0));
          assert.isFalse(store.set('falsy:string', ''));
          assert.isFalse(store.set('falsy:boolean', false));
          assert.isFalse(store.set('falsy:object', null));
        }
    },
    "the get() method" : {
      "should respond with the correct value": function () {
        assert.equal(store.get('db1:host'), '127.0.0.1');
        assert.equal(store.get('db1:user'), 'root');
        assert.equal(store.get('db1:password'), 'supersecret');
        assert.equal(store.get('foo:bar:bazz'), undefined);
        assert.equal(store.get('falsy:number'), undefined);
        assert.equal(store.get('falsy:string'), undefined);
        assert.equal(store.get('falsy:boolean'), undefined);
        assert.equal(store.get('falsy:object'), undefined);
        }
      },
      "the saveSync() method" : {
        "should not send a put request": function () {
          store.saveSync();
          assert.equal(spyRequestSync.args.length, 2);
          assert.equal(spyRequestSync.args[0][0].method, 'GET');
          assert.equal(spyRequestSync.args[1][0].method, 'GET');
      }
    }
  }
}).addBatch( {
  "When using the nconf etcd store with readOnly: true and sync: true": {
    topic: function() {
      spyRequestSync.restore();
      spyRequestSync = sinon.spy(httpSync, 'request');

      etcd = nock('http://127.0.0.1:4001')
        .get('/v2/keys/mysql/db1?wait=true')
        .delay(500)
        .reply(200, data['/v2/keys/mysql/db1?wait=true']);

      store = new nconf.Etcd({key: 'mysql/db1', cluster: cluster, readOnly: false, sync: true});
      return store;
    },
    "the internal _watch method": {
        topic: function () {
          store.on('change', this.callback)
        },
        "should observe the etcd cluster by long time polling and keep the local store synced": function (err, value) {
          storedData = JSON.parse(data['/v2/keys/mysql/db1?wait=true'].node.value);
          assert.deepEqual(storedData, store.store);
        }
    },
    "should create a new etcd store": function () {
        assert.isObject(store);
        assert.equal(4, store.cluster.length);
        assert.equal('mysql/db1', store.key);
        assert.isTrue(store.sync);
        assert.isFalse(store.readOnly);
      },
      "the loadSync() method": {
        "should load the data correctly": function() {
          store.loadSync();
          storedData = JSON.parse(data['/v2/keys/mysql/db1'].node.value);
          assert.deepEqual(storedData, store.store);
        }
      },
      "the set() method": {
        "should respond with true": function () {
          assert.isTrue(store.set('foo:bar:bazz', 'buzz'));
          assert.isTrue(store.set('falsy:number', 0));
          assert.isTrue(store.set('falsy:string', ''));
          assert.isTrue(store.set('falsy:boolean', false));
          assert.isTrue(store.set('falsy:object', null));
        }
    },
      "the get() method" : {
        "should respond with the correct value": function () {
          assert.equal(store.get('db1:host'), '127.0.0.1');
          assert.equal(store.get('db1:user'), 'root');
          assert.equal(store.get('db1:password'), 'supersecret');
          assert.equal(store.get('foo:bar:bazz'), 'buzz');
          assert.equal(store.get('falsy:number'), 0);
          assert.equal(store.get('falsy:string'), '');
          assert.equal(store.get('falsy:boolean'), false);
          assert.equal(store.get('falsy:object'), null);
          }
      },
        "the saveSync() method" : {
          "should not send a put request": function () {
            store.saveSync();
            assert.equal(spyRequestSync.args.length, 3);
            assert.equal(spyRequestSync.args[0][0].method, 'GET');
            assert.equal(spyRequestSync.args[1][0].method, 'GET');
            assert.equal(spyRequestSync.args[2][0].method, 'PUT');

            assert.equal(spyRequestSync.args[2][0].path, '/v2/keys/mysql/db1');
            assert.isString(spyRequestSync.args[2][0].body);

            body = JSON.parse(spyRequestSync.args[2][0].body.replace('value=', ''));
            storedData = JSON.parse(data['/v2/keys/mysql/db1'].node.value);

            assert.deepEqual(body['db1'], storedData['db1']);
            assert.equal(body['foo']['bar']['bazz'], 'buzz');
            assert.isObject(body['falsy']);
      }
    }
  }
}).export(module);
