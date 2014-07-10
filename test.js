'use strict';

var http = require('http');
var assert = require('assert');
var requestStats = require('./index');

assert._statsCommon = function (stats) {
  assert(stats.req.bytes > 0); // different headers will result in different results
  assert.equal(typeof stats.req.headers.connection, 'string');
  assert.equal(stats.req.method, 'PUT');
  assert.equal(stats.req.path, '/');
  assert.equal(stats.res.status, 200);
};

// assertion helper for validating stats from HTTP requests that finished correctly
assert.statsFinished = function (stats) {
  assert(stats.ok);
  assert(stats.time >= 9); // The reason we don't just do >= 10, is because setTimeout is not that precise
  assert(stats.res.bytes > 0); // different headers will result in different results
  assert.equal(typeof stats.res.headers.connection, 'string');
  assert._statsCommon(stats);
};

// assertion helper for validating stats from HTTP requests that are closed before finishing
assert.statsClosed = function (stats) {
  assert(!stats.ok);
  assert(stats.time >= 0);
  assert.equal(stats.res.bytes, 0);
  assert.deepEqual(stats.res.headers, {});
  assert._statsCommon(stats);
};

var _listen = function (server, errorHandler) {
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

    if (errorHandler)
      req.on('error', errorHandler);

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

describe('request-stats', function () {
  afterEach(function () {
    requestStats().removeAllListeners();
  });

  describe('requestStats(server, onStats)', function () {
    it('should call the stats-listener on request end', function (done) {
      var server = http.createServer(_respond);
      requestStats(server, function (stats) {
        assert.statsFinished(stats);
        done();
      });
      _listen(server);
    });

    it('should call the stats-listener when the request is destroyed', function (done) {
      var server = http.createServer(function (req, res) {
        req.destroy();
      });
      requestStats(server, function (stats) {
        assert.statsClosed(stats);
      });
      _listen(server, function (err) {
        assert(err instanceof Error);
        done();
      });
    });
  });

  describe('requestStats(req, res).once(...)', function () {
    it('should call the stats-listener on request end', function (done) {
      _listen(http.createServer(function (req, res) {
        requestStats(req, res).once('stats', function (stats) {
          assert.statsFinished(stats);
          done();
        });
        _respond(req, res);
      }));
    });
  });

  describe('requestStats(server).once(...)', function () {
    it('should call the stats-listener on request end', function (done) {
      var server = http.createServer(_respond);
      requestStats(server).once('stats', function (stats) {
        assert.statsFinished(stats);
        done();
      });
      _listen(server);
    });
  });

  describe('requestStats(req, res, onStats)', function () {
    it('should call the stats-listener on request end', function (done) {
      _listen(http.createServer(function (req, res) {
        requestStats(req, res, function (stats) {
          assert.statsFinished(stats);
          done();
        });
        _respond(req, res);
      }));
    });
  });
});
