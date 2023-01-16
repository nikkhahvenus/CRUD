// const { createLogger, format, transports } = require('winston');
// const config = require('config');

// const dbLogPath = config.get('dbLogPath');

// // // Import mongodb
// require('winston-mongodb');

// module.exports = createLogger({
    
//     transports: [
//        // MongoDB transport
//         new transports.MongoDB({
//             level: 'error',
//             //mongo database connection link
//             db: dbLogPath ,
//             options: {
//                 useUnifiedTopology: true
//             },
//             // A collection to save json formatted logs
//             collection: 'server_logs',
//             format: format.combine(
//                 format.timestamp(),
//                 // Convert logs to a json format
//                 format.json())
//         })
//     ]
// });
