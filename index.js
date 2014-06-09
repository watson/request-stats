'use strict';

var util = require('util');
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
  statsEmitter._record(req, res);
  return statsEmitter;
};

requestStats.middleware = function () {
  return function (req, res, next) {
    statsEmitter._record(req, res);
    next();
  };
};

// Allow us to use the EventEmitter functions of StatsEmitter on the
// requestStats function, like requestStats.on(...) etc
requestStats.__proto__ = StatsEmitter.prototype;

module.exports = requestStats;
