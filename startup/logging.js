// In test modes do not log errors or messages in Files or DB
const config = require('config');
const testStatus = config.get('testStatus');

const FileLogger = require('../middleware/loggerFile');

module.exports = function () {
  ////for synchronous codes, the following process.on function 
  ////  can caught the happening exception
  process.on('uncaughtException', (ex) => {
    console.log('We got an uncaught exception.' + ex.message);
    if (!testStatus)
        FileLogger.error('We got an uncaught exception.' + ex.message);
    process.exit(1);
  });

  ////for asynchronous codes, the following process.on function 
  ////can caught the happening rejection
  process.on('unhandledRejection', (ex) => {
    console.log('We got an unhandled Rejection.' + ex.message, ex);
    if (!testStatus)
        FileLogger.error('We got an unhandled Rejection.' + ex.message, ex);
    process.exit(1);
  });

  //const p = Promise.reject(new Error ('***an uncaught promise rejection happend***'));
  //p.then( () => console.log('Done'));


  //throw new Error('** Creating an uncaught exception **');
}

