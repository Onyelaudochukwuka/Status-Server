//jshint esversion:6
/*
 *
 *Library For storing and editing data
 * 
 */
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

// Container for module (to be exported)

var lib = {};

// Base data directory of the data folder

lib.baseDir = path.join(__dirname, '/../.data/');

// Write data to a file

lib.create = (dir, file, data, callback) => {

    //open the file for writing

    fs.open(`${lib.baseDir + dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {

            // Convert data to string

            var stringData = JSON.stringify(data);

            // Write to file and close it

            fs.writeFile(fileDescriptor, stringData, (err) => {
                if (!err) {
                    fs.close(fileDescriptor, (err) => {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error closing new file');
                        }
                    });
                } else {
                    callback('Error writing to new file');
                }
            });
        } else {
            callback('Could not create new file, it may already exists');
        }
    });

};

// Read data from a file

lib.read = function (dir, file, callback) {
    fs.readFile(`${lib.baseDir + dir}/${file}.json`, 'utf8', function (err, data) {
        if (!err && data) {
            var parseData = helpers.parseJsonToObject(data);
            callback(false, parseData);
        } else {
            callback(err, data);
        }

    });
};

// Update data inside a file

lib.update = (dir, file, data, callback) => {

    // Open the file for writing

    fs.open(`${lib.baseDir + dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {

            // Convert Data to string

            var stringData = JSON.stringify(data);

            // Truncate file

            fs.ftruncate(fileDescriptor, (err) => {
                if (!err) {

                    // Write to file and close

                    fs.writeFile(fileDescriptor, stringData, (err) => {
                        if (!err) {
                            fs.close(fileDescriptor, (err) => {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing existing file');
                                }
                            });
                        } else {
                            callback('Error writing to existing file');
                        }
                    });
                } else {
                    callback('Error truncating file');
                }
            });

        } else {
            callback('Could not ope file for updating, it may not exist yet');
        }
    });
};

// Delete a file

lib.delete = (dir, file, callback) => {

    // Unlink the file

    fs.unlink(`${lib.baseDir + dir}/${file}.json`, (err) => {
        if (!err) {
            callback(false);
        } else {
            callback('Error deleting file');
        }
    });
};

// List all the items in a directory
lib.list = (dir, callback) => {
    fs.readdir(`${lib.baseDir + dir}/`, (err, data) => {
        if (!err && data && data.length > 0) {
            var trimmedFileNames = [];
            data.forEach((fileName =>{
                trimmedFileNames.push(fileName.replace('.json',''));
            }));
            callback(false,trimmedFileNames);
        } else {
            callback(err, data);
        }
    });
};
// Export the module

module.exports = lib;