//jshint esversion:6
/*
 *
 *
 *Primary file for the API
 *
 * 
 */
// Dependencies
var server = require('./lib/server');
var workers = require('./lib/workers');

//Declare app
var app = {};

// Init fuction
app.init = () => {
    // start the server;
    server.init();
    workers.init();
};

// Execute
app.init();

// Export the app
module.exports = app;