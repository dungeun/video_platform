/**
 * @company/database - Database Types
 *
 * 데이터베이스 모듈의 핵심 타입 정의
 * Zero Error Architecture 기반으로 설계됨
 */
// ===== 에러 타입 =====
export class DatabaseError extends Error {
    constructor(message, code, query, bindings) {
        super(message);
        this.code = code;
        this.query = query;
        this.bindings = bindings;
        this.name = 'DatabaseError';
    }
}
export class ConnectionError extends DatabaseError {
    constructor(message, provider) {
        super(message, 'CONNECTION_ERROR');
        this.provider = provider;
        this.name = 'ConnectionError';
    }
}
export class QueryError extends DatabaseError {
    constructor(message, query, bindings) {
        super(message, 'QUERY_ERROR', query, bindings);
        this.name = 'QueryError';
    }
}
export class TransactionError extends DatabaseError {
    constructor(message, transactionId) {
        super(message, 'TRANSACTION_ERROR');
        this.transactionId = transactionId;
        this.name = 'TransactionError';
    }
}
export class MigrationError extends DatabaseError {
    constructor(message, migrationName) {
        super(message, 'MIGRATION_ERROR');
        this.migrationName = migrationName;
        this.name = 'MigrationError';
    }
}
//# sourceMappingURL=index.js.map