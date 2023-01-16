const { createLogger, format, transports } = require('winston');

require('winston-mongodb');

module.exports = createLogger({
    transports: [
        // Console transport
        //  new transports.Console({

        //      level: 'silly',
        //      format: format.combine(
        //          format.timestamp({ format: 'MM-DD-YYYY HH:mm:ss' }),
        //          format.align(),
        //          format.colorize(true),
        //          format.prettyPrint(true),
        //          format.printf(info => `${info.level}: 
        //                          ${[info.timestamp]}: 
        //                          ${info.message}`),
        //      )
        //  }),

        // File transport

        new transports.File({

            level: 'info',
            //  level:'warn',
            //  level:'verbose',
            //  level:'silly',
            filename: 'logs/server.log',
            format: format.combine(
                format.timestamp({ format: 'MM-DD-YYYY HH:mm:ss' }),
                format.align(),
                format.printf(info => `${info.level}: 
                                ${[info.timestamp]}: 
                                ${info.message}`),
            )
        }),
        new transports.File({

            level: 'warn',
            //  level:'verbose',
            //  level:'warn',
            //  level:'silly',
            //  info
            filename: 'logs/url.log',
            format: format.combine(
                format.timestamp({ format: 'MM-DD-YYYY HH:mm:ss' }),
                format.align(),
                format.printf(info => `${info.level}: 
                                ${[info.timestamp]}: 
                                ${info.message}`),
            )
        }),        new transports.File({
            level: 'error',
            filename: 'logs/unhandledExceptions.log',
            format: format.combine(
                format.timestamp({ format: 'MM-DD-YYYY HH:mm:ss' }),
                format.align(),
                format.printf(info => `${info.level}: 
                                                 ${[info.timestamp]}: 
                                                 ${info.message}`),
            )
        })

    ]
});
