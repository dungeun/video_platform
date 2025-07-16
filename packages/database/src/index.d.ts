/**
 * @company/database - Enterprise Database Module
 *
 * 데이터베이스 연결, 쿼리 빌더, 마이그레이션, 트랜잭션을 통합 지원하는 엔터프라이즈 모듈
 * Zero Error Architecture 기반으로 설계됨
 *
 * @version 1.0.0
 * @author Enterprise AI Team
 */
export { DatabaseManager } from './DatabaseManager';
export * from './types';
export { ConnectionManager } from './connection/ConnectionManager';
export { QueryBuilder } from './query/QueryBuilder';
export { TransactionManager, DatabaseTransaction } from './transaction/TransactionManager';
export { MigrationRunner } from './migration/MigrationRunner';
export * from './providers';
import { DatabaseManager } from './DatabaseManager';
import type { DatabaseConfig } from './types';
export declare function createDatabaseManager(): DatabaseManager;
/**
 * 기본 DatabaseManager 인스턴스 반환
 */
export declare function getDatabaseManager(): DatabaseManager;
/**
 * 빠른 데이터베이스 연결 헬퍼
 */
export declare function connectDatabase(config: DatabaseConfig): Promise<{
    manager: DatabaseManager;
    connectionId: string;
    query: <T = any>(sql: string, bindings?: any[]) => Promise<import("./types").QueryResult<T>>;
    queryBuilder: () => import("./query/QueryBuilder").QueryBuilder;
    transaction: <T = any>(callback: (trx: any) => Promise<T>) => Promise<import("./types").TransactionResult>;
    schema: () => import("./types").SchemaBuilder;
    disconnect: () => Promise<import("./types").DatabaseResult>;
}>;
/**
 * SQL 인젝션 방지를 위한 문자열 이스케이프
 */
export declare function escapeString(value: string): string;
/**
 * 테이블명/컬럼명 검증
 */
export declare function validateIdentifier(identifier: string): boolean;
/**
 * SQL 바인딩 파라미터 생성
 */
export declare function createBindings(values: any[]): string;
/**
 * 페이지네이션 헬퍼
 */
export declare function createPagination(page: number, limit: number): {
    offset: number;
    limit: number;
};
/**
 * WHERE 절 조건 빌더
 */
export declare function buildWhereConditions(conditions: Record<string, any>, operator?: 'AND' | 'OR'): {
    sql: string;
    bindings: any[];
};
/**
 * INSERT 값 빌더
 */
export declare function buildInsertValues(data: Record<string, any> | Record<string, any>[]): {
    columns: string;
    values: string;
    bindings: any[];
};
/**
 * UPDATE SET 절 빌더
 */
export declare function buildUpdateSet(data: Record<string, any>): {
    sql: string;
    bindings: any[];
};
export declare const DATABASE_DEFAULTS: {
    readonly POOL: {
        readonly MIN: 2;
        readonly MAX: 10;
        readonly IDLE_TIMEOUT: 30000;
        readonly ACQUIRE_TIMEOUT: 60000;
    };
    readonly MIGRATION: {
        readonly TABLE_NAME: "migrations";
        readonly DIRECTORY: "./migrations";
        readonly EXTENSION: ".ts";
    };
    readonly TIMEOUT: {
        readonly QUERY: 30000;
        readonly TRANSACTION: 60000;
        readonly CONNECTION: 10000;
    };
};
export declare const SUPPORTED_PROVIDERS: readonly ["postgresql", "mysql", "sqlite"];
export declare const DATABASE_MODULE_INFO: {
    readonly name: "@company/database";
    readonly version: "1.0.0";
    readonly description: "Enterprise Database Module with Multiple Providers and Query Builder";
    readonly author: "Enterprise AI Team";
    readonly license: "MIT";
    readonly supportedProviders: readonly ["postgresql", "mysql", "sqlite"];
};
/**
 * SQL 쿼리 로깅을 위한 포맷터
 */
export declare function formatSqlForLogging(sql: string, bindings?: any[]): string;
/**
 * 쿼리 성능 분석을 위한 헬퍼
 */
export declare function analyzeQueryPerformance(executionTime: number): {
    level: 'fast' | 'normal' | 'slow' | 'critical';
    message: string;
};
/**
 * 데이터베이스 에러 분석
 */
export declare function analyzeDatabaseError(error: Error): {
    type: 'connection' | 'syntax' | 'constraint' | 'permission' | 'timeout' | 'unknown';
    severity: 'low' | 'medium' | 'high' | 'critical';
    suggestion: string;
};
//# sourceMappingURL=index.d.ts.map