//jshint esversion:6
/*
 *
 * Server-related tasks
 *
 */

// Dependencies
const http = require('http');
const https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
var handlers = require('./handlers');
var helpers = require('./helpers');
var util = require('util');
var debug = util.debuglog('server');
var path = require('path');
// Instantiate the  server module object
var server = {};

// Instanciating the http server

server.httpServer = http.createServer((req, res) => {
 server.unifiedServer(req, res);
});



// Instanciating the https server

server.httpsServerOptions = {
  'key': fs.readFileSync(path.join(__dirname,'/../https/key.pen')),
  'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pen'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, function (req, res) {
 server.unifiedServer(req, res);
});

// All the server logic for te http and https servers

server.unifiedServer = function (req, res) {
  var parsedUrl = url.parse(req.url, true);

  //Get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get query string
  var queryStringObject = parsedUrl.query;

  // Get the HTTP Method
  var method = req.method;

  // Get the headers as an object
  var headers = req.headers;

  // Get the payload, if any
  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function (data) {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    // Choose the handler this request should go to. If one is not found use the not found handler
    var choseHandler = typeof (server.router[trimmedPath]) != 'undefined' ? server.router[trimmedPath] : handlers.notFound;

    // Construct the data object to send to the handler
    var data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    };

    // Route the request to the handler specified in the router
    choseHandler(data, function (statusCode, payload) {
      // Use the status code called back by the handler, or default to 200
      statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

      // Use the payload called back by the handler, or default to an empty object
      payload = typeof (payload) == 'object' ? payload : {};

      // Convert te payload to a string 
      var payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log the request path
      // If the response is 200, print green else print red
      if (statusCode == 200) {
        debug('\x1b[32m%s\x1b[0m',method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
      } else {
        debug('\x1b[31m%s\x1b[0m',method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
      }
    });

  });

};

// Define a request router

server.router = {
  'ping': handlers.ping,
  'users': handlers.users,
  'tokens': handlers.tokens,
  'checks': handlers.checks
};
server.init = () => {
  // Start the HTTP server

  server.httpServer.listen(config.httpPort, () => {
helpers.sendTwilioSms('8110536818', 'config.httpPort', (err) => console.log(err));
    console.log('\x1b[35m%s\x1b[0m',`the server is listening on port ${config.httpPort}`);
  });
// Start the https server

server.httpsServer.listen(config.httpsPort, () => {
    console.log('\x1b[36m%s\x1b[0m',`the server is listening on port ${config.httpsPort}`);
  });
};
module.exports = server;