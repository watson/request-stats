'use strict';

var http = require('http');
var assert = require('assert');
var requestStats = require('./index');

setTimeout(function () {
  throw new Error('Too long time have passed');
}, 2000);

var cbCount = 0;
var done = function () {
  cbCount++;
  return function () {
    if (!--cbCount) process.exit();
  };
};

assert.stats = function (stats) {
  assert(stats.ok);
  assert(stats.time >= 10);
  assert(stats.req.bytes > 0); // different headers will result in different results
  assert.equal(stats.req.headers.connection, 'keep-alive');
  assert.equal(stats.req.method, 'PUT');
  assert.equal(stats.req.path, '/');
  assert(stats.res.bytes > 0); // different headers will result in different results
  assert.equal(stats.res.headers.connection, 'keep-alive');
  assert.equal(stats.res.status, 200);
};

var _listen = function (server) {
  server.listen(0, function () {
    var options = {
      host: 'localhost',
      port: server.address().port,
      method: 'PUT'
    };

    var req = http.request(options, function (res) {
      res.resume();
      res.once('end', function () {
        server.close();
      });
    });

    req.end('42');
  });
};

var _respond = function (req, res) {
  req.on('end', function () {
    setTimeout(function () {
      res.end('Answer to the Ultimate Question of Life, The Universe, and Everything');
    }, 10);
  });
  req.resume();
};

var testNormalImpl = function () {
  var callback = done();
  _listen(http.createServer(function (req, res) {
    requestStats(req, res).once('stats', function (stats) {
      assert.stats(stats);
      callback();
    });
    _respond(req, res);
  }));
};

var testMiddlewareImpl = function () {
  var callback1 = done();
  var callback2 = done();
  _listen(http.createServer(function (req, res) {
    requestStats.middleware()(req, res, callback1);
    requestStats().once('stats', function (stats) {
      assert.stats(stats);
      callback2();
    });
    _respond(req, res);
  }));
};

testNormalImpl();
testMiddlewareImpl();
