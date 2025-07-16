/**
 * @company/database - Database Types
 *
 * 데이터베이스 모듈의 핵심 타입 정의
 * Zero Error Architecture 기반으로 설계됨
 */
export type DatabaseProvider = 'postgresql' | 'mysql' | 'sqlite' | 'memory';
export interface DatabaseConfig {
    provider: DatabaseProvider;
    host?: string;
    port?: number;
    database: string;
    username?: string;
    password?: string;
    filename?: string;
    ssl?: boolean | {
        rejectUnauthorized?: boolean;
        ca?: string;
        cert?: string;
        key?: string;
    };
    pool?: {
        min?: number;
        max?: number;
        idleTimeoutMillis?: number;
        acquireTimeoutMillis?: number;
    };
    debug?: boolean;
}
export interface ConnectionOptions {
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
}
export interface ConnectionInfo {
    id: string;
    provider: DatabaseProvider;
    database: string;
    connected: boolean;
    createdAt: Date;
    lastUsed: Date;
}
export type QueryOperator = '=' | '!=' | '<>' | '<' | '<=' | '>' | '>=' | 'LIKE' | 'NOT LIKE' | 'ILIKE' | 'NOT ILIKE' | 'IN' | 'NOT IN' | 'BETWEEN' | 'NOT BETWEEN' | 'IS NULL' | 'IS NOT NULL';
export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
export type OrderDirection = 'ASC' | 'DESC';
export interface WhereClause {
    column: string;
    operator: QueryOperator;
    value?: any;
    values?: any[];
}
export interface JoinClause {
    type: JoinType;
    table: string;
    on: string;
}
export interface OrderClause {
    column: string;
    direction: OrderDirection;
}
export interface QueryBuilder {
    select(columns?: string | string[]): QueryBuilder;
    from(table: string): QueryBuilder;
    where(column: string, operator: QueryOperator, value?: any): QueryBuilder;
    whereIn(column: string, values: any[]): QueryBuilder;
    whereBetween(column: string, min: any, max: any): QueryBuilder;
    whereNull(column: string): QueryBuilder;
    whereNotNull(column: string): QueryBuilder;
    join(table: string, on: string, type?: JoinType): QueryBuilder;
    leftJoin(table: string, on: string): QueryBuilder;
    rightJoin(table: string, on: string): QueryBuilder;
    innerJoin(table: string, on: string): QueryBuilder;
    orderBy(column: string, direction?: OrderDirection): QueryBuilder;
    groupBy(columns: string | string[]): QueryBuilder;
    having(condition: string): QueryBuilder;
    limit(count: number): QueryBuilder;
    offset(count: number): QueryBuilder;
    insert(data: Record<string, any> | Record<string, any>[]): QueryBuilder;
    update(data: Record<string, any>): QueryBuilder;
    delete(): QueryBuilder;
    toSQL(): {
        sql: string;
        bindings: any[];
    };
    execute<T = any>(): Promise<QueryResult<T>>;
}
export interface QueryResult<T = any> {
    success: boolean;
    data?: T[];
    error?: string;
    rowCount?: number;
    insertId?: number | string;
    affectedRows?: number;
    executionTime?: number;
}
export interface QueryMetrics {
    query: string;
    bindings: any[];
    executionTime: number;
    rowCount: number;
    timestamp: Date;
}
export interface Transaction {
    id: string;
    startedAt: Date;
    queries: QueryMetrics[];
    commit(): Promise<TransactionResult>;
    rollback(): Promise<TransactionResult>;
    query<T = any>(sql: string, bindings?: any[]): Promise<QueryResult<T>>;
    queryBuilder(): QueryBuilder;
    isActive(): boolean;
}
export interface TransactionResult {
    success: boolean;
    error?: string | undefined;
    duration?: number;
    queryCount?: number;
}
export interface Migration {
    id: string;
    name: string;
    up(): Promise<void>;
    down(): Promise<void>;
    createdAt: Date;
}
export interface MigrationRecord {
    id: string;
    name: string;
    batch: number;
    executedAt: Date;
}
export interface MigrationRunner {
    run(): Promise<MigrationResult>;
    rollback(steps?: number): Promise<MigrationResult>;
    status(): Promise<MigrationStatus>;
    reset(): Promise<MigrationResult>;
}
export interface MigrationResult {
    success: boolean;
    error?: string;
    executed: string[];
    skipped: string[];
    duration: number;
}
export interface MigrationStatus {
    pending: Migration[];
    executed: MigrationRecord[];
    current?: MigrationRecord | undefined;
}
export interface SchemaBuilder {
    createTable(name: string, callback: (table: TableBuilder) => void): Promise<void>;
    dropTable(name: string): Promise<void>;
    alterTable(name: string, callback: (table: TableBuilder) => void): Promise<void>;
    hasTable(name: string): Promise<boolean>;
    renameTable(from: string, to: string): Promise<void>;
}
export interface TableBuilder {
    increments(name?: string): ColumnBuilder;
    integer(name: string): ColumnBuilder;
    bigInteger(name: string): ColumnBuilder;
    text(name: string): ColumnBuilder;
    string(name: string, length?: number): ColumnBuilder;
    varchar(name: string, length?: number): ColumnBuilder;
    boolean(name: string): ColumnBuilder;
    date(name: string): ColumnBuilder;
    datetime(name: string): ColumnBuilder;
    timestamp(name: string): ColumnBuilder;
    timestamps(): void;
    json(name: string): ColumnBuilder;
    decimal(name: string, precision?: number, scale?: number): ColumnBuilder;
    float(name: string): ColumnBuilder;
    double(name: string): ColumnBuilder;
    binary(name: string): ColumnBuilder;
    uuid(name: string): ColumnBuilder;
    primary(columns: string | string[]): void;
    index(columns: string | string[], name?: string): void;
    unique(columns: string | string[], name?: string): void;
    foreign(column: string): ForeignKeyBuilder;
    dropColumn(name: string): void;
    renameColumn(from: string, to: string): void;
}
export interface ColumnBuilder {
    primary(): ColumnBuilder;
    nullable(): ColumnBuilder;
    notNullable(): ColumnBuilder;
    unique(): ColumnBuilder;
    index(): ColumnBuilder;
    defaultTo(value: any): ColumnBuilder;
    comment(text: string): ColumnBuilder;
    unsigned(): ColumnBuilder;
    after(column: string): ColumnBuilder;
    first(): ColumnBuilder;
}
export interface ForeignKeyBuilder {
    references(column: string): ForeignKeyBuilder;
    inTable(table: string): ForeignKeyBuilder;
    onDelete(action: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'): ForeignKeyBuilder;
    onUpdate(action: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'): ForeignKeyBuilder;
}
export interface PoolConfig {
    min: number;
    max: number;
    idleTimeoutMillis: number;
    acquireTimeoutMillis: number;
    createTimeoutMillis: number;
    destroyTimeoutMillis: number;
    reapIntervalMillis: number;
    createRetryIntervalMillis: number;
}
export interface PoolStats {
    size: number;
    available: number;
    borrowed: number;
    invalid: number;
    pending: number;
    max: number;
    min: number;
}
export interface DatabaseManager {
    connect(config: DatabaseConfig): Promise<DatabaseResult>;
    disconnect(connectionId?: string): Promise<DatabaseResult>;
    query<T = any>(sql: string, bindings?: any[], connectionId?: string): Promise<QueryResult<T>>;
    queryBuilder(connectionId?: string): QueryBuilder;
    transaction<T = any>(callback: (trx: Transaction) => Promise<T>, connectionId?: string): Promise<TransactionResult>;
    migrate(options?: MigrationOptions): Promise<MigrationResult>;
    schema(connectionId?: string): SchemaBuilder;
    getConnections(): ConnectionInfo[];
    getConnection(id: string): ConnectionInfo | null;
    isConnected(connectionId?: string): boolean;
    getStats(connectionId?: string): PoolStats | null;
}
export interface DatabaseResult {
    success: boolean;
    error?: string;
    connectionId?: string;
    data?: any;
}
export interface MigrationOptions {
    directory?: string;
    tableName?: string;
    extension?: string;
    connectionId?: string;
}
export interface DatabaseEvents {
    'connection:created': {
        connectionId: string;
        config: DatabaseConfig;
    };
    'connection:destroyed': {
        connectionId: string;
    };
    'query:start': {
        query: string;
        bindings: any[];
        connectionId: string;
    };
    'query:complete': {
        query: string;
        bindings: any[];
        duration: number;
        connectionId: string;
    };
    'query:error': {
        query: string;
        bindings: any[];
        error: string;
        connectionId: string;
    };
    'transaction:start': {
        transactionId: string;
        connectionId: string;
    };
    'transaction:commit': {
        transactionId: string;
        duration: number;
        connectionId: string;
    };
    'transaction:rollback': {
        transactionId: string;
        duration: number;
        connectionId: string;
    };
    'migration:start': {
        migration: string;
    };
    'migration:complete': {
        migration: string;
        duration: number;
    };
    'migration:error': {
        migration: string;
        error: string;
    };
}
export declare class DatabaseError extends Error {
    code?: string | undefined;
    query?: string | undefined;
    bindings?: any[] | undefined;
    constructor(message: string, code?: string | undefined, query?: string | undefined, bindings?: any[] | undefined);
}
export declare class ConnectionError extends DatabaseError {
    provider?: DatabaseProvider | undefined;
    constructor(message: string, provider?: DatabaseProvider | undefined);
}
export declare class QueryError extends DatabaseError {
    constructor(message: string, query?: string, bindings?: any[]);
}
export declare class TransactionError extends DatabaseError {
    transactionId?: string | undefined;
    constructor(message: string, transactionId?: string | undefined);
}
export declare class MigrationError extends DatabaseError {
    migrationName?: string | undefined;
    constructor(message: string, migrationName?: string | undefined);
}
//# sourceMappingURL=index.d.ts.map