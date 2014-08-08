'use strict';

var util = require('util');
var http = require('http');
var EventEmitter = require('events').EventEmitter;
var once = require('once');
var httpHeaders = require('http-headers');

var StatsEmitter = function () {
  EventEmitter.call(this);
};
util.inherits(StatsEmitter, EventEmitter);

StatsEmitter.prototype._server = function (server, onStats) {
  this._attach(onStats);
  server.on('request', this._request.bind(this));
};

var toMilliseconds = function (tuple) {
  return Math.round(tuple[0] * 1000 + tuple[1] / 1000000);
};

StatsEmitter.prototype._request = function (req, res, onStats) {
  var that = this;
  this._start = process.hrtime();
  this._connection = req.connection;
  this._totalBytes = req.headers['content-length'];

  this._attach(onStats);

  var emit = once(function (ok) {
    var bytesReadPreviously = req.connection._requestStats ? req.connection._requestStats.bytesRead : 0;
    var bytesWrittenPreviously = req.connection._requestStats ? req.connection._requestStats.bytesWritten : 0;
    var bytesReadDelta = req.connection.bytesRead - bytesReadPreviously;
    var bytesWrittenDelta = req.connection.bytesWritten - bytesWrittenPreviously;

    req.connection._requestStats = {
      bytesRead: req.connection.bytesRead,
      bytesWritten: req.connection.bytesWritten
    };

    that.emit('stats', {
      ok   : ok,
      time : toMilliseconds(process.hrtime(that._start)),
      req  : {
        bytes   : bytesReadDelta,
        headers : req.headers,
        method  : req.method,
        path    : req.url
      },
      res  : {
        bytes   : bytesWrittenDelta,
        headers : httpHeaders(res),
        status  : res.statusCode
      }
    });
  });

  res.once('finish', emit.bind(null, true));
  res.once('close', emit.bind(null, false));
};

StatsEmitter.prototype._attach = function (listener) {
  if (typeof listener === 'function')
    this.on('stats', listener);
};

StatsEmitter.prototype.progress = function () {
  if (!this._start) return;

  var delta = toMilliseconds(process.hrtime(this._progressTime || this._start));
  var read = this._connection.bytesRead - (this._progressRead || 0);
  var written = this._connection.bytesWritten - (this._progressWritten || 0);

  this._progressTime = process.hrtime();
  this._progressRead = this._connection.bytesRead;
  this._progressWritten = this._connection.bytesWritten;

  var result = {
    time: toMilliseconds(process.hrtime(this._start)),
    timeDelta: delta,
    req: {
      bytes: this._connection.bytesRead,
      bytesDelta: read,
      speed: read / (delta / 1000)
    },
    res: {
      bytes: this._connection.bytesWritten,
      bytesDelta: written,
      speed: written / (delta / 1000)
    }
  };

  if (this._totalBytes) {
    var bytesLeft = this._totalBytes - this._connection.bytesRead;
    bytesLeft = bytesLeft < 0 ? 0 : bytesLeft;
    result.req.bytesLeft = bytesLeft;
    result.req.timeLeft = bytesLeft ? bytesLeft / result.req.speed : 0;
  }

  return result;
};

var requestStats = function (req, res, onStats) {
  var statsEmitter = new StatsEmitter();
  if (req instanceof http.Server)
    statsEmitter._server(req, res);
  else if (req instanceof http.IncomingMessage)
    statsEmitter._request(req, res, onStats);
  return statsEmitter;
};

module.exports = requestStats;
