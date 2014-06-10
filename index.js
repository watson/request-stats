'use strict';

var util = require('util');
var http = require('http');
var EventEmitter = require('events').EventEmitter;
var httpHeaders = require('http-headers');

var StatsEmitter = function () {
  EventEmitter.call(this);
};
util.inherits(StatsEmitter, EventEmitter);

StatsEmitter.prototype._record = function (req, res) {
  var that = this;
  var start = new Date();

  var emit = function (ok) {
    return function () {
      that.emit('stats', {
        ok   : ok,
        time : new Date() - start,
        req  : {
          bytes   : req.connection.bytesRead,
          headers : req.headers,
          method  : req.method,
          path    : req.url
        },
        res  : {
          bytes   : req.connection.bytesWritten,
          headers : httpHeaders(res),
          status  : res.statusCode
        }
      });
    };
  };

  res.once('finish', emit(true));
  res.once('close', emit(false));
};

var statsEmitter = new StatsEmitter();

var requestStats = function (req, res) {
  if (req instanceof http.IncomingMessage)
    statsEmitter._record(req, res);
  return statsEmitter;
};

requestStats.middleware = function () {
  return function (req, res, next) {
    statsEmitter._record(req, res);
    next();
  };
};

module.exports = requestStats;
