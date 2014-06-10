'use strict';

var util = require('util');
var http = require('http');
var EventEmitter = require('events').EventEmitter;

var StatsEmitter = function () {
  EventEmitter.call(this);
};
util.inherits(StatsEmitter, EventEmitter);

StatsEmitter.prototype._record = function (req, res) {
  var that = this;

  var emit = function () {
    that.emit('stats', {
      read    : req.connection.bytesRead,
      written : req.connection.bytesWritten,
      method  : req.method,
      status  : res.statusCode
    });
  };

  res.once('finish', emit);
  res.once('close', emit);
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
