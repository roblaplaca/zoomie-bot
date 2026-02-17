const winston = require('winston');

class Logger {
    constructor(options = {}) {
        this.logger = winston.createLogger({
            level: options.level || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.cli()
                    )
                }),
                new winston.transports.File({ filename: options.filename || 'app.log' }),
            ],
        });
    }

    debug(message, metadata) {
        this.logger.debug(message, metadata);
    }

    info(message, metadata) {
        this.logger.info(message, metadata);
    }

    warn(message, metadata) {
        this.logger.warn(message, metadata);
    }

    error(message, metadata) {
        this.logger.error(message, metadata);
    }
}

module.exports = Logger;