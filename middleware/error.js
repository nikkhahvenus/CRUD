// In test modes do not log errors or messages in Files or DB
const config = require('config');
const testStatus = config.get('testStatus');

const mongoose = require('mongoose');
const FileLogger = require('./loggerFile');
//const DBLogger = require('./loggerDB');

///////////////////////////////////////////////////////////
// Capture 500 errors
module.exports.error1 = function (err, req, res, next) {
    if (mongoose.connection.readyState != 1 || mongoose.connection.readyState != 2)
        return res.status(500).send('DB connection error. ' + err.message);

    if (testStatus)
        console.log(`${err.status || 500} - 
                    ${res.statusMessage} - 
                    ${err.message} - 
                    ${req.originalUrl} - 
                    ${req.method} - 
                    ${req.ip}`);
    else {
        try {
            FileLogger.error(`${err.status || 500} - 
                         ${res.statusMessage} - 
                         ${err.message} - 
                         ${req.originalUrl} - 
                         ${req.method} - 
                         ${req.ip}`);

            // DBLogger.error(`${err.status || 500} - 
            //          ${res.statusMessage} - 
            //          ${err.message} - 
            //          ${req.originalUrl} - 
            //          ${req.method} - 
            //          ${req.ip}`);
        }
        catch (err) {
            console.log('Log File or DB Error. Can not log error 500 in File or DB. Connection Error. ' + exr.message);
        }
    }
    next();
}
///////////////////////////////////////////////////////////
// Capture 404 erors
module.exports.error2 = function (req, res, next) {
    if (testStatus)
        console.log(`400 || 
                ${res.statusMessage} - 
                ${req.originalUrl} - 
                ${req.method} - 
                ${req.ip}`);
    else {
        try {
            FileLogger.error(`400 || 
                     ${res.statusMessage} - 
                     ${req.originalUrl} - 
                     ${req.method} - 
                     ${req.ip}`);

            // DBLogger.error(`400 || 
            //          ${res.statusMessage} - 
            //          ${req.originalUrl} - 
            //          ${req.method} - 
            //          ${req.ip}`);
        }
        catch (exr) {
            console.log('Log File or DB Error. Can not log error 404 in File or DB. Connection Error. ' + exr.message);
        }
    }
        //check the following commands
    return res.status(404).send('PAGE NOT FOUND');
    // next();
}
