// In test modes do not log errors or messages in Files or DB
require('express-async-errors');
const config = require('config');
const testStatus = config.get('testStatus');

const host = "localhost";

const express = require('express');
const app = express();

require('./startup/logging')();
require('./startup/config')();
require('./startup/routes')(app);
require('./startup/validation')();
require('./startup/db')();

if ( !testStatus ){
  require('./startup/prod')(app);
}


const FileLogger = require('./middleware/loggerFile');

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server started and running on http://${host}:${port}`);
   if (!testStatus)
     FileLogger.info(`Server started and running on http://${host}:${port}`);
}
);

module.exports = server;

//Starts Mongdb server @ mongodb://127.0.0.1:27017/
//brew services start mongodb-community@4.2

//Stops Mongdb server @ mongodb://127.0.0.1:27017/
//brew services stop mongodb-community@4.2

//mongo
//mongo - starts the mongo client

