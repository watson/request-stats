# request-stats

[![Build Status](https://travis-ci.org/watson/request-stats.png)](https://travis-ci.org/watson/request-stats)

Get stats on your Node.js HTTP server requests.

Emits a `stats` event for each request with a single object as its first
argument, containing the following properties:

- `ok`: `true` if the connection was closed correctly and `false` otherwise
- `time`: The milliseconds it took to serve the request
- `req`:
  - `bytes`: Number of bytes sent by the client
  - `headers`: The headers sent by the client
  - `method`: The HTTP method used by the client
  - `path`: The path part of the request URL
- `res`:
  - `bytes`: Number of bytes sent back to the client
  - `headers`: The headers sent back to the client
  - `status`: The HTTP status code returned to the client

## Installation

```
npm install request-stats
```

## Usage

```javascript
var requestStats = require('request-stats');

http.createServer(function (req, res) {
  requestStats(req, res).on('complete', function (stats) {
    console.log(stats); // { read: 42, written: 123, method: 'PUT', status: 200 }
  });
});
```

Or you can just parse it the `http.Server` object for a completely
decoupled experience:

```javascript
var server = http.createServer(function (req, res) {
  // ...
});

requestStats(server).on('complete', function (stats) {
  console.log(stats);
});
```

### Alternative implementation

Instead of attaching the `stats` listener using the conventional `.on()` approach, you can also just parse the callback function as an optional extra argument:

```javascript
var onStats = function (stats) {
  console.log(stats);
};

// either inside the request callback:
requestStats(req, res, onStats);

// or with the entire server:
requestStats(server, onStats);
```

## Acknowledgement

Thanks to [mafintosh](https://github.com/mafintosh) for coming up with
the initial concept and pointing me in the right direction.

## License

MIT
