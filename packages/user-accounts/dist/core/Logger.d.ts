/**
 * Simple Logger for User Accounts Module
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export declare class Logger {
    private context;
    constructor(context: string);
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, error?: any): void;
    private log;
}
//# sourceMappingURL=Logger.d.ts.map