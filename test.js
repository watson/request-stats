'use strict';

var http = require('http');
var assert = require('assert');
var requestStats = require('./index');

assert.stats = function (stats) {
  assert(stats.ok);
  assert(stats.time >= 10);
  assert(stats.req.bytes > 0); // different headers will result in different results
  assert.equal(typeof stats.req.headers.connection, 'string');
  assert.equal(stats.req.method, 'PUT');
  assert.equal(stats.req.path, '/');
  assert(stats.res.bytes > 0); // different headers will result in different results
  assert.equal(typeof stats.res.headers.connection, 'string');
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

describe('request-stats', function () {
  afterEach(function () {
    requestStats().removeAllListeners();
  });

  describe('requestStats(req, res)', function () {
    it('should call the stats-listener on request end', function (done) {
      _listen(http.createServer(function (req, res) {
        requestStats(req, res).once('stats', function (stats) {
          assert.stats(stats);
          done();
        });
        _respond(req, res);
      }));
    });
  });

  describe('requestStats(server)', function () {
    it('should call the stats-listener on request end', function (done) {
      var server = http.createServer(_respond);
      requestStats(server).once('stats', function (stats) {
        assert.stats(stats);
        done();
      });
      _listen(server);
    });
  });

  describe('requestStats.middleware()', function () {
    it('should call the stats-listener on request end', function (done) {
      _listen(http.createServer(function (req, res) {
        requestStats.middleware()(req, res, function () {});
        requestStats().once('stats', function (stats) {
          assert.stats(stats);
          done();
        });
        _respond(req, res);
      }));
    });
  });

  describe('requestStats(req, res, onStats)', function () {
    it('should call the stats-listener on request end', function (done) {
      _listen(http.createServer(function (req, res) {
        requestStats(req, res, function (stats) {
          assert.stats(stats);
          done();
        });
        _respond(req, res);
      }));
    });
  });

  describe('requestStats(server, onStats)', function () {
    it('should call the stats-listener on request end', function (done) {
      var server = http.createServer(_respond);
      requestStats(server, function (stats) {
        assert.stats(stats);
        done();
      });
      _listen(server);
    });
  });

  describe('requestStats.middleware(onStats)', function () {
    it('should call the stats-listener on request end', function (done) {
      _listen(http.createServer(function (req, res) {
        var onStats = function (stats) {
          assert.stats(stats);
          done();
        };
        requestStats.middleware(onStats)(req, res, function () {});
        _respond(req, res);
      }));
    });
  });

});
