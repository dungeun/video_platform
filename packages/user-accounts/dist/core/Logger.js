/**
 * Simple Logger for User Accounts Module
 */
export class Logger {
    context;
    constructor(context) {
        this.context = context;
    }
    debug(message, meta) {
        this.log('debug', message, meta);
    }
    info(message, meta) {
        this.log('info', message, meta);
    }
    warn(message, meta) {
        this.log('warn', message, meta);
    }
    error(message, error) {
        this.log('error', message, error);
    }
    log(level, message, meta) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}`;
        if (meta) {
            console.log(logMessage, meta);
        }
        else {
            console.log(logMessage);
        }
    }
}
//# sourceMappingURL=Logger.js.map