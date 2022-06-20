//jshint esversion:6
/* 
 *
 *   export configuration variables
 * 
 */

// Container for all the environments

const environments = {};

// Staging (default) environment
environments.staging = {
  'httpPort': 3000,
  'httpsPort': 3001,
  'envName': 'staging',
  'hashingSecret': 'thisIsASecret',
  'maxChecks' : 5,
};

// Production environment

environments.production = {
  'httpPort': 5000,
  'httpsPort': 5001,
  'envName': 'production',
  'hashingSecret': 'thisIsAlsoASecret',
  'maxChecks' : 5,
  'twilio' : {
    'accountSid' : '',
    'authToken' : '',
    'fromPhone' : ''
  }
};


// Determine which environment was passed as a comman-line arguent

var currentEnivironment = typeof (process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current enviroment is one of the environment above, if not, default to staging

var environmentToExport = typeof (environments[currentEnivironment]) == 'object' ? environments[currentEnivironment] : environments.staging;

module.exports = environmentToExport;