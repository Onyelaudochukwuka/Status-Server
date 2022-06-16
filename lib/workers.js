//jshint esversion:6
/*
 *
 *worker-related tasks
 *
 *
 */
//Dependencies
var path = require('path');
var fs = require('fs');
var _data = require('./data');
var https = require('https');
var http = require('http');
var helpers = require('./helpers');
var url = require('url');
var _logs = require('./logs');
const {
    checks
} = require('./handlers');
const {
    error
} = require('console');
const {
    connect
} = require('http2');

// Instantiate the worker object
var workers = {};

// Lookup all the checks, get their data, send to a validator
workers.gatherAllChecks = () => {
    // Get all the checks that exist in the form;
    _data.list('checks', (err, checks) => {
        if (!err && checks && checks.length > 0) {
            checks.forEach(check => {
                // Read in the check data
                _data.read('checks', check, (err, originalCheckData) => {
                    if (!err && originalCheckData) {
                        // Pass it to the check validtor, and let that function continue or log error as needed
                        workers.validateCheckData(originalCheckData);
                    } else {
                        console.log('Error: Could not read one of the checks data');
                    }
                });
            });
        } else {
            console.log("Error : Could not find any checks to process");
        }

    });
};

//Sanity-check the check data
workers.validateCheckData = (originalCheckData) => {
    originalCheckData = typeof (originalCheckData) == 'object' && originalCheckData !== null ? originalCheckData : {};
    originalCheckData.id = typeof (originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false;
    originalCheckData.userPhone = typeof (originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone.trim() : false;
    originalCheckData.protocol = typeof (originalCheckData.protocol) == 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false;
    originalCheckData.url = typeof (originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
    originalCheckData.method = typeof (originalCheckData.method) == 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false;
    originalCheckData.successCodes = typeof (originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
    originalCheckData.timeoutSeconds = typeof (originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds % 1 == 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false;

    // Set the keys that may not be set (if the workers have never seen this check before)
    originalCheckData.state = typeof (originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
    originalCheckData.lastChecked = typeof (originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

    //if all the checks pass pass the data along to the next step in the process
    if (originalCheckData.id &&
        originalCheckData.userPhone &&
        originalCheckData.protocol &&
        originalCheckData.url &&
        originalCheckData.method &&
        originalCheckData.successCodes &&
        originalCheckData.timeoutSeconds) {
        workers.performCheck(originalCheckData);
    } else {
        console.log('Error : one of the checks is not properly formatted. Skipping it.');
    }
};
// Perform check,send the originalCheckData and the outcome of the check process, to the next step in the process 
workers.performCheck = (originalCheckData) => {
    // Prepare the initial check outcome
    var checkOutcome = {
        'error': false,
        'responseCode': false
    };

    // mark that the outcome  has not been sent yet
    var outcomesent = false;

    var parsedUrl = url.parse(`${originalCheckData.protocol}://${originalCheckData.url}`, true);
    var hostname = parsedUrl.hostname;
    var path = parsedUrl.path;

    // construct the request
    var requestDetails = {
        'protocol': `${originalCheckData.protocol}:`,
        'hostname': hostname,
        'method': originalCheckData.method,
        'path': path,
        'timeout': originalCheckData.timeoutSeconds * 1000
    };
    // Instantiate the request status using the http module)
    var _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
    var req = _moduleToUse.request(requestDetails, (res) => {
        var status = res.statusCode;
        // Update the checkOutcoe and pass the data along
        checkOutcome.responseCode = status;
        if (!outcomesent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomesent = true;
        }
    });
    // Bind to the error event so it doesn't get thrown
    req.on('error', (e => {
        checkOutcome.error = {
            'error': true,
            'value': e
        };
        if (!outcomesent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomesent = true;

        }

    }));
    req.on('timeout', (e => {
        checkOutcome.error = {
            'error': true,
            'value': 'timeout'
        };
        if (!outcomesent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomesent = true;

        }

    }));
    // End the request
    req.end();
};
// process the check outcome,update the check data s needed trigger an aler if needed
// Special logic for accomoaing a check that hs never been tested before
workers.processCheckOutcome = (originalCheckData, checkOutCome) => {
    // Decide if the check is up or down
    var state = !checkOutCome.error && checkOutCome.responseCode && originalCheckData.successCodes.indexOf(checkOutCome.responseCode) > -1 ? 'up' : 'down';

    // Decide if an alert is warrented
    var alertWarranted = originalCheckData.lastChecked && originalCheckData.state != state ? true : false;
    var timeOfCheck = Date.now();
    // Update the check data
    var newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();
    // Log the outcome of the checks
    workers.log(originalCheckData, checkOutCome, state, alertWarranted, timeOfCheck);
    // Save the updates
    _data.update('checks', newCheckData.id, newCheckData, (err) => {
        if (!err) {
            // Send the new checkdata to the next phase in process if needed 
            if (alertWarranted) {
                workers.alertUserToStatusChange(newCheckData);
            } else {
                console.log('Check outcome has not changed, no alert needed');
            }
        } else {
            console.log('Error trying to save updates to one of the checks');
        }
    });
};
//alet users to status change
workers.alertUserToStatusChange = (newCheckData) => {
    var msg = `Alert: Your check for ${newCheckData.method.toUpperCase()} ${newCheckData.protocol}//${newCheckData.url} is currently ${newCheckData.status}`;
    helpers.sendTwilioSms(newCheckData.userPhone, msg, (err) => {
        if (!err) {
            console.log('Sucess: User was alerted to a change in thier checks,via sms :', msg);
        } else {
            console.log('Erro could not send alert user who had a state change in their check', err);
        }
    });
};
workers.log = (originalCheckData, checkOutCome, state, alertWarranted, timeOfCheck) => {
    // form the log data
    var logData = {
        'check': originalCheckData,
        'outCome': checkOutCome,
        'state': state,
        'alert': alertWarranted,
        'time': timeOfCheck
    };
    // Convert data to a string
    var logString = JSON.stringify(logData);

    // Determine the name of the log file
    var logFileName = originalCheckData.id;

    // Append the log string to the file
    _logs.append(logFileName,logString,(err)=>{
        if(!err){
            console.log("Logging to file suceeded");
        }else{
            console.log(err);
            console.log("Logging to file failed");
        }
    });

};
// Timer to execute the worker-process once per minute
workers.loop = () => {
    setInterval(() => {
        workers.gatherAllChecks();
    }, 1000 * 60);
};
// Rotate (compress) the log file
workers.rotateLogs()
// Timer to execute the log-rotation process once per day
workers.logRotaionLoop = () => {
    setInterval(() => {
        workers.rotateLogs();
    }, 1000 * 60 * 60 * 24);
}
// init script
workers.init = () => {
    //Execute all the checks immediately
    workers.gatherAllChecks();
    // Call the loop so the ckecks will execute later on
    workers.loop();
    // Compress all logs
    workers.rotateLogs();

    // Call the compression loop so logs will be compressed later on
    workers.logRotaionLoop();
};

// Export the module
module.exports = workers;