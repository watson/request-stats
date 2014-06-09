'use strict';

var http = require('http');
var assert = require('assert');
var requestStats = require('./index');

var cbCount = 2;
var done = function () {
  if (!--cbCount) process.exit();
};

var server = http.createServer(function (req, res) {
  // normal implementation
  requestStats(req, res).once('stats', function (stats) {
    assert(stats.read > 0); // different headers will result in different results
    assert(stats.written > 0); // different headers will result in different results
    assert.equal(stats.method, 'PUT');
    assert.equal(stats.status, 200);
    done();
  });

  // middleware implementation
  requestStats.middleware()(req, res, done);
  requestStats.once('stats', function (stats) {
    assert(stats.read > 0); // different headers will result in different results
    assert(stats.written > 0); // different headers will result in different results
    assert.equal(stats.method, 'PUT');
    assert.equal(stats.status, 200);
  });

  req.on('end', function () {
    res.end('Answer to the Ultimate Question of Life, The Universe, and Everything');
  });
  req.resume();
});

server.listen(0, function () {
  var options = {
    host: 'localhost',
    port: server.address().port,
    method: 'PUT'
  };

  var req = http.request(options, function (res) {
    res.resume();
  });

  req.end('42');
});
