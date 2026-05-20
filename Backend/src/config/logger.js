import winston from 'winston'

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'warn':'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
    ),
    transports: [
        new winston.transports.Console({
            format: process.env.NODE_ENV !== 'production' 
            ? winston.format.combine(winston.format.colorize(),winston.format.simple())
            : winston.format.combine(winston.format.timestamp(),winston.format.json())
        }),

        ...(process.env.NODE_ENV !== 'production' ? [
            new winston.transports.File({filename:'logs/combined.log'}),
            new winston.transports.File({filename:'logs/error.log',level:'error'})
        ]:[])
    ]
})

export default logger;