//jshint esversion:6
/*
 *
 * Request the handlers
 * 
 */

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');

// Define the handlers

var handlers = {};

// Users

handlers.users = (data, callback) => {
  var acceptableMethods = ['POST', 'GET', 'PUT', 'DELETE'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the users submethods

handlers._users = {};

// Users - post

// Required data: firstName, lastName, phone , password , tosagreement

handlers._users.POST = (data, callback) => {

  // Check that all required field are filled out
if(data.headers.publickey != "m28yk6ju7nmqmevz780e") return callback(401, {'Error':'Missing publickey in header or publickey is invalid'});
  var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;
  if (firstName && lastName && phone && password && tosAgreement) {

    // Make sure users doesn't already exist

    _data.read('users', phone, (err, data) => {
      if (err) {

        // Hash the password

        var hashPassword = helpers.hash(password);

        // Create the user object

        if (hashPassword) {
          var userObject = {
            'firstName': firstName,
            'lastName': lastName,
            'phone': phone,
            'hashedPassword': hashPassword,
            'tosAgreement': true
          };

          // Store the user

          _data.create('users', phone, userObject, (err) => {
            if (!err) {
              callback(200);
            } else {
              callback(500, {
                'Error': 'Could not create the new user'
              });
            }
          });

        } else {
          callback(500, {
            'Error': 'Could not hash the user\'s password'
          });
        }
      } else {
        callback(400, {
          'Error': 'A user with that phone number already exists'
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required fields'
    });
  }

};

// Users - get
// Required data: phone
handlers._users.GET = (data, callback) => {
  //Check that the phone number is valid
  var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    //Get token from headers
    let token = typeof (data.headers.id) == 'string' ? data.headers.id : false;
    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        //look up the user
        _data.read('users', phone, function (err, data) {
          if (!err && data) {
            // Remove the hashed password from the user object before returning it to  
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {
          'Error': 'Missing Required tokrn in header, or token is invalid'
        });
      }
    });


  } else {
    callback(404, {
      'Error': 'Missing required field'
    });
  }
};

// Users - put
// Required data: phone
// Optonal data: firstName, lastNamw, password (at least one must be specidfied)
handlers._users.PUT = (data, callback) => {
  // Check the required fields
  var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

  // Check for the optional fields
  var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Error if the phone is invalid
  if (phone) {
    if (firstName || lastName || password) {
      let token = typeof (data.headers.id) == 'string' ? data.headers.id : false;
      // Verify that the given token is valid for the phone number
      handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
        if (tokenIsValid) {
          //lookup the users
          _data.read('users', phone, (err, userData) => {
            if (!err && userData) {
              // Update the fields necessary
              if (firstName) {
                userData.firstName = firstName;

              }
              if (lastName) {
                userData.lastName = lastName;

              }
              if (password) {
                userData.hashedPassword = helpers.hash(password);

              }
              // Store the new data
              _data.update('users', phone, userData, (err) => {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, {
                    'Error': 'Could not update the user'
                  });
                }
              });
            } else {
              callback(400, {
                'Error': 'The specified user does ot exist'
              });
            }
          });
        } else {
          callback(403, {
            'Error': 'Missing Required token in header, or token is invalid'
          });
        }
      });


    } else {
      callback(400, {
        'Error': 'Missing fields to update'
      });
    }
  } else {
    callback(404, {
      'Error': 'Missing required field'
    });
  }
};

// Users - delete
// Required field: phone
// @TODO Only let an authenticated user delete their project, Don't let them delete any one elses
// @TODO Cleanup (delete) any other files associated with this user
handlers._users.DELETE = (data, callback) => {
  //Check that the phone number is valid
  var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    let token = typeof (data.headers.id) == 'string' ? data.headers.id : false;
    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
        //look up the user
        _data.read('users', phone, (err, userData) => {
          if (!err && data) {
            _data.delete('users', phone, (err) => {
              if (!err){
                  // Delete each of the usersnassociated with the user
                  var userTokens = typeof(userData.tokens) == 'object' && userData.tokens instanceof Array ? userData.tokens : [];
                  var tokensToDelete = userTokens.length;
                  if(tokensToDelete > 0){
                      var tokensDeleted = 0;
                      var deletionErrors = false;
                      // loop through the checks
                      userTokens.forEach(tokenId => {
                        _data.delete('tokens',tokenId,(err)=>{
                          if(err){
                            deletionErrors = true;
                          }
                          tokensDeleted++;
                        if(tokensDeleted === tokensToDelete){
                          if(!deletionErrors){
                            var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                            var checksToDelete = userChecks.length;
                            if(checksToDelete > 0){
                                var checksDeleted = 0;
                                // loop through the checks
                                userChecks.forEach(checkId => {
                                  _data.delete('checks',checkId,(err)=>{
                                    if(err){
                                      deletionErrors = true;
                                    }
                                    checksDeleted++;
                                  if(checksDeleted === checksToDelete){
                                    if(!deletionErrors){
                                      callback(200);
                                    }else{
                                      callback(500,{'Error':'Error encountered while trying to delete all of the users checks. All checks my not hve been deleted from the sysem successfully'});
                                    }
                                  }
                                  });
                                });
                            }else{
                            callback(200,{'Success':'All tokens deleted no checks available'});
                            } }else{
                            callback(500,{'Error':'Error encountered while trying to delete all of the users checks. All checks my not hve been deleted from the sysem successfully'});
                          }
                        }
                        });
                      });
                  }else{
                        callback(500, {'Error' : 'No checks created by this user'});
                  }
                  
            
             
                 }
              else{ callback(500, {
                'Error': 'Could not delete the specified user'
              });}
            });
          } else {
            callback(404, {
              'Error': 'Could not find specified user'
            });
          }
        });

      } else {
        callback(403, {
          'Error': 'Missing Required tokrn in header, or token is invalid'
        });
      }
    });
  } else {
    callback(404, {
      'Error': 'Missing required field'
    });
  }
};

handlers.tokens = (data, callback) => {
  var acceptableMethods = ['POST', 'GET', 'PUT', 'DELETE'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens methods
handlers._tokens = {};

// Tokens - POST
// Required data : phone,password
// Optional data is none
handlers._tokens.POST = (data, callback) => {
if(data.headers.publickey != "m28yk6ju7nmqmevz780e") return callback(401, {'Error':'Missing publickey in header or publickey is invalid'});
  var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (phone && password) {
    //lookup the user who matches that phone number
    _data.read('users', phone, (err, userData) => {
      if (!err && userData) {
        //Hash the sent password, and comapre it to thw password stored in he object
        var hashPassword = helpers.hash(password);
        if (hashPassword == userData.hashedPassword) {
          // If valid create a new token with a random name . Set expiration date 1 hour in the future
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            'phone': phone,
            'id': tokenId,
            'expires': expires
          };
          // store the token
          _data.create('tokens', tokenId, tokenObject, (err) => {
            if (!err) {
              _data.read('tokens',tokenId,(err,data)=>{
                if(!err && userData){
          var userTokens = typeof(userData.tokens) == 'object' && userData.tokens instanceof Array ? userData.tokens : [];
          userData.tokens = userTokens;
          userData.tokens.push(data.id);          
          _data.update('users',data.phone,userData,(err)=>{
            if(!err){
               callback(200, tokenObject);
            }
            else{
              callback(500,{'Error':'Error updting user data'});
            }
          });
                }
              });
             
            } else {
              callback(500, {
                'Erro': 'Could not create the new token'
              });
            }
          });
        } else {
          callback(400, {
            'Error': 'Passowrd did not match the specifis user\'s stored password'
          });
        }
      } else {
        callback(400, {
          'Error': 'Could not find the specified user'
        });
      }
    });
  } else {
    callback(404, {
      'Error': 'Missing required fields'
    });
  }
};
// Tokens - GET
//required data: id
//optional data: none
handlers._tokens.GET = (data, callback) => {
  //check that the id is valid
  var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    //look up the token
    _data.read('token', id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(404, {
      'Error': 'Missing required field'
    });
  }

};
// Tokens - PUT
// Required data : id, extend
// optional data : none;
handlers._tokens.PUT = (data, callback) => {
  var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
  if (id && extend) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        //Check to make sure the token isn't already expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // Store the new updates
          _data.update('tokens', id, tokenData, (err) => {
            if (!err) {
              callback(200);
            } else {
              callback(500, {
                'Error': 'Could not update the token\'s expiration'
              });
            }
          });
        } else {
          callback(400, {
            'Error': 'The Token is already expied'
          });
        }
      } else {
        callback(400, {
          'Error': 'Specified token does not exist'
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing Required field(s) or field(s) are invalid'
    });
  }
};
// Tokens - DELETE
// Required data: id
// Optional data: none
handlers._tokens.DELETE = (data, callback) => {
  var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    //look up the user
    _data.read('tokens', id, (err, data) => {
      if (!err && data) {
        _data.delete('tokens', id, (err) => {
          return (!err) ? callback(200) : callback(500, {
            'Error': 'Could not delete the specified token'
          });
        });
      } else {
        callback(404, {
          'Error': 'Could not find specified token'
        });
      }
    });
  } else {
    callback(404, {
      'Error': 'Missing required field'
    });
  }
};
//Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = (id, phone, callback) => {

  // lookup the token
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      // Check that the token is for the given user and has not expired
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Checks
handlers.checks = (data, callback) => {
  var acceptableMethods = ['POST', 'GET', 'PUT', 'DELETE'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the checks methods
handlers._checks = {};

// Checks - post
// Required data: protocol, url, method, successCodes, timeoutSeconds
//optionl data: none

handlers._checks.POST = (data, callback) => {
  // Validate inputs
if(data.headers.publickey != "m28yk6ju7nmqmevz780e") return callback(401, {'Error':'Missing publickey in header or publickey is invalid'});
  var protocol = typeof (data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  var method = typeof (data.payload.method) == 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  var successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  var timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
  if (protocol && url && method && successCodes && timeoutSeconds) {
    // Get token from headers
    let token = typeof (data.headers.id) == 'string' ? data.headers.id : false;
    // Verify that the given token is valid for the phone number
    _data.read('tokens', token, (err, tokenData) => {
      if (!err && tokenData) {
        var userPhone = tokenData.phone;

        //lookup thr user data
        _data.read('users', userPhone, (err, userData) => {
          if (!err && userData) {
            var userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
            // Verify that the users has less than the nmber of mx-checks-per-user
            if (userChecks.length < config.maxChecks) {
              //Create a random id for thw check
              var checkId = helpers.createRandomString(20);

              // Create the check object, and include the user's phone
              var checkObject = {
                'id': checkId,
                'userPhone': userPhone,
                'protocol': protocol,
                'url': url,
                'method': method,
                'successCodes': successCodes,
                'timeoutSeconds': timeoutSeconds,
              };
              //Save the object
              _data.create('checks', checkId, checkObject, (err) => {
                if (!err) {
                  // Add the checkId to the user's object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // Save the new user data
                  _data.update('users', userPhone, userData, (err) => {
                    if (!err) {
                      //return the data about the new checks
                      callback(200, checkObject);
                    } else {
                      callback(500, {
                        'Error': 'Could not update the user with the new check'
                      });
                    }
                  });
                } else {
                  callback(500, {
                    'Error': 'Could not create the new check'
                  });
                }
              });
            } else {
              callback(400, {
                'Error': `The user already has the maximum number of checks(${config.maxChecks})`
              });
            }
          } else {
            callback(403, {
              'Error': 'Unable to user data'
            });
          }
        });
      } else {
        callback(403, {
          'Error': 'Unable to get token data'
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required inputs, or inputs are invaid'
    });
  }
};

// Check - gets
// Required data : id
// Optional data : none
handlers._checks.GET = (data, callback) => {
  //Check that the phone number is valid
  var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    //lookup the check
    _data.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        //Get token from headers
        let token = typeof (data.headers.id) == 'string' ? data.headers.id : false;
        // Verify that the given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
          if (tokenIsValid) {
            // Return the check data
            callback(200, checkData);
          } else {
            callback(403, {
              'Error': 'invalid check or check does not exist or token expired'
            });
          }
        });

      } else {
        callback(403, {
          'Error': 'Unable to ccess checks data'
        });
      }
    });


  } else {
    callback(404, {
      'Error': 'Missing required field'
    });
  }
};

// checks - put
// required data : id
// optional data : protocol url method successCodes, timeoutSeconds (one must be defined)
handlers._checks.PUT = (data, callback) => {
  // Check the required sting
  var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

  // Check for the optional fields
  var protocol = typeof (data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  var method = typeof (data.payload.method) == 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  var successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  var timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
  // Check to make sure id is valid
  if (id) {
    // Check to make sure one or more optional field has been sent
    if (protocol || url || method || successCodes || timeoutSeconds) {
      // Lookup checks
      _data.read('checks', id, (err, checkData) => {
        if (!err && checkData) {
          let token = typeof (data.headers.id) == 'string' ? data.headers.id : false;
          // Verify that the given token is valid and belongs to the user who created the check
          handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
            if (tokenIsValid) {
              // Update check where necessary
              if (!err && checkData) {
                // Update the fields necessary
                if (protocol) {
                  checkData.protocol = protocol;

                }
                if (url) {
                  checkData.url = url;

                }
                if (method) {
                  checkData.method = method;
                }
                if (successCodes) {
                  checkData.successCodes = successCodes;
                }
                if (timeoutSeconds) {
                  checkData.timeoutSeconds = timeoutSeconds;
                }
                // Store the updates
                _data.update('checks', id, checkData, (err) => {
                  if (!err) {
                    callback(200);
                  } else {
                    callback(500, {
                      'Error': 'Could not update the check'
                    });
                  }
                });
              } else {
                callback(400, {
                  'Error': 'The specified user does ot exist'
                });
              }
            } else {
              callback(403);
            }
          });
        } else {
          callback(400, {
            'Error': 'Check ID did not exist'
          });
        }
      });
    } else {
      callback(400, {
        'Error': 'Missing fields to update'
      });
    }

  } else {
    callback(400, {
      'Error': 'Missing required fields'
    });
  }
};

// Checks - delete
// Required field: id
// Optional data : none
handlers._checks.DELETE = (data, callback) => {
  //Check that the phone number is valid
  var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    // lookup the check
    _data.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        let token = typeof (data.headers.id) == 'string' ? data.headers.id : false;
        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
          if (tokenIsValid) {
            // Delete the check data
            _data.delete('checks', id, (err) => {
              if (!err) {
                _data.read('users', checkData.userPhone, (err, userData) => {
                  if (!err && userData) {
                    var userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                      // Remove the deleted checks from thir list of checks
                      var checkPosition = userChecks.indexOf(id);
                    if(checkPosition > -1){
                        userChecks.splice(checkPosition,1);
                        // resave the user
                        _data.update('users',checkData.userPhone,userData,(err)=>{
                          if(!err){
                             callback(200);
                          }else{
                             callback(500, {
                            'Error': 'Could not delete the specified user'
                          });
                        }
                        });
                    }else{
                      callback(500,{'Error' : 'Could not find the check on the user\'s object, so could not remove it'});
                    }
                  } else {
                    callback(404, {
                      'Error': 'Could not find the user who created the check so could not remove the check from the list of user data'
                    });
                  }
                });

              } else {
                callback(500, {
                  'Error': 'Could not delete the check data'
                });
              }
            });

          } else {
            callback(403, {
              'Error': 'Missing Required tokrn in header, or token is invalid'
            });
          }
        });

      } else {
        callback(400, {
          'Error': 'The specified check id does not exist'
        });
      }
    });
  } else {
    callback(404, {
      'Error': 'Missing required field'
    });
  }
};
// Ping handler
handlers._ping = {};

handlers.ping = (data, callback) => {
  //Callback a http status code, and a payload object
  var acceptableMethods = ['GET'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._ping[data.method](data, callback);
  } else {
    callback(405);
  }
};
handlers._ping.GET = (data, callback) => {
      //Hash the sent password, and comapre it to thw password stored in he object
        // If valid create a new token with a random name . Set expiration date 1 hour in the future
        var publickey = helpers.createRandomString(20);
        var keyObject = {
          'publickey': publickey,
        };
        // store the token
        _data.create('publickeys', publickey, keyObject, (err) => {
          if (!err) {
            _data.read('publickeys',publickey,(err,data)=>{
              if(!err && userData){
        var userTokens = typeof(userData.publickey) == 'object' && userData.publickey instanceof Array ? userData.publickey : [];
        userData.publickey = userKey;
        userData.tokens.push(data.id);          
        _data.update('users',data.phone,userData,(err)=>{
          if(!err){
             callback(200, tokenObject);
          }
          else{
            callback(500,{'Error':'Error updting user data'});
          }
        });
              }
            });
           
          } else {
            callback(500, {
              'Erro': 'Could not create the new token'
            });
          }
        });
      
  
}
//Not Found handler

handlers.notFound = (data, callback) => {
  callback(404);
};

//Export the modules

module.exports = handlers;