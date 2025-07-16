/**
 * Database Adapter for User Accounts Module
 *
 * This adapter provides a simplified interface for database operations
 * specific to the user accounts module requirements.
 */
export interface DatabaseAdapter {
    queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
    queryMany<T = any>(sql: string, params?: any[]): Promise<T[]>;
    execute(sql: string, params?: any[]): Promise<void>;
    beginTransaction(): Promise<void>;
    commitTransaction(): Promise<void>;
    rollbackTransaction(): Promise<void>;
}
/**
 * Simple implementation that can be extended or replaced
 */
export declare class SimpleDatabaseAdapter implements DatabaseAdapter {
    constructor(_connection?: any);
    queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
    queryMany<T = any>(sql: string, params?: any[]): Promise<T[]>;
    execute(sql: string, params?: any[]): Promise<void>;
    beginTransaction(): Promise<void>;
    commitTransaction(): Promise<void>;
    rollbackTransaction(): Promise<void>;
}
/**
 * Create a database adapter that can work with the existing DatabaseManager
 */
export declare function createDatabaseAdapter(databaseManager?: any): DatabaseAdapter;
//# sourceMappingURL=DatabaseAdapter.d.ts.map