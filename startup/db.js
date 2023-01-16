// In test modes do not log errors or messages in Files or DB
const config = require('config');
const testStatus = config.get('testStatus');

const FileLogger = require('../middleware/loggerFile');

const mongoose = require('mongoose');

////mongoose.set('bufferCommands', false);

module.exports = async () => {
    const db = config.get('db');
    await mongoose.connect(db)
        .then(() => {

            let st = mongoose.connection.readyState;

            if (st === 1) {
                 if (!testStatus) {
                     console.log(`Connected to ${db}...`);
                     FileLogger.info(`Connected to ${db}...`);
                 }
            }
            else {
                console.log(`could not connect to ${db} or connection is not ready ... `);
                 if (!testStatus)
                     FileLogger.error(`could not connect to ${db} or connection is not ready ... `);
            }
        })
        .catch(err => {
            console.error(`Can not connect to ${db}...`, err.message);
             if (!testStatus)
                 FileLogger.error(`Can not connect to ${db}...` + err.message);
            process.exit(1);
        });
}

// Mongoose connections have a readyState property that 
// contains a number representing the current state of 
// the connection, 0-4. These states are as follows:
// 0 = disconnected
// 1 = connected
// 2 = connecting
// 3 = disconnecting
// 4 = invalid credentials
