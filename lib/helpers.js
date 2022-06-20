//jshint esversion:6
/*
 *
 * Helpers for various tasks
 * 
 */

// Dependencies

const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const queryString = require('querystring');
require('dotenv').config();
// Container for helpers

var helpers = {};

// Create a SHA256 hash

helpers.hash = (str) => {
  if (typeof (str) == 'string' && str.length > 0) {
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Parse a Json string to an object in all cases, without throwing

helpers.parseJsonToObject = (str) => {
  try {
    var obj = JSON.parse(str);
    return obj;
  } catch (err) {
    return {};

  }
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = (strLength) => {
  strLength = typeof (strLength) == 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    // Define all the possible characters that can go into a string;
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyxz0123456789';

    var str = '';

    for (i = 1; i <= strLength; i++) {
      // Get random character from the possible string
      var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
      // Append this character to the fial string
      str += randomCharacter;
    }
    //return the final string
    return str;

  } else {
    return false;
  }
};
helpers.sendTwilioSms = (phone, msg, callback) => {
  // Validate prameters
  phone = typeof (phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
  msg = typeof (msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
  if (phone && msg) {
    const accountSid = process.env.ACCOUNTSID; 
const authToken = process.env.AUTHTOKEN; 
const client = require('twilio')(accountSid, authToken); 
 
client.messages 
      .create({ 
         body: msg,  
         messagingServiceSid: process.env.MESSAGING_SERVICESID,      
         to: '+234' + phone, 
       }) 
      .then(message => console.log(message)) 
      .done();
    // Configure the request payload
    // var payload = {
    //   'from': process.env.FROM_PHONE,
    //   'To': '+234' + phone,
    //   'Body': msg
    // };
    // //stringify the payload
    // var stringPayload = queryString.stringify(payload);
    // // Configure the request details 
    // var requestDetails = {
    //   'protocol': 'https:',
    //   'hostname': 'api.twilio.com',
    //   'method': 'POST',
    //   'path': `/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`,
    //   'auth': `${twilio.accountSid}:${twilio.authToken}`,
    //   'headers': {
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //     'Content-Length': Buffer.byteLength(stringPayload)
    //   }
    // };

    // // instatiate the request object
    // var req = https.request(requestDetails, (res) => {
    //   // Grab the status of the request
    //   var status = res.statusCode;
    //   //callback successful if request went through
    //   if(status == 200 || status == 201){
    //     callback(false);
    //   }else{
    //     callback(`Status code returned was ${status}`);
    //   }
    // });

    // // Bind to the error event so it doesn't get thrown
    // req.on('error',(e)=>{
    //   callback(e);
    // });
    // // Add the payload
    // req.write(stringPayload);

    // // End the request
    // req.end();
  } else {
    callback('Given prameters were missing or invalid');
  }

};
// Export module

module.exports = helpers;
