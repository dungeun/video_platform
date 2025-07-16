/**
 * @company/database - MySQL Provider
 *
 * MySQL 데이터베이스 전용 프로바이더
 * Zero Error Architecture 기반으로 설계됨
 */
import type { DatabaseConfig, DatabaseResult, QueryResult } from '../types';
export declare class MySQLProvider {
    private config;
    private logger;
    private pool;
    constructor(config: DatabaseConfig);
    /**
     * MySQL 연결 설정
     */
    connect(): Promise<DatabaseResult>;
    /**
     * MySQL 연결 해제
     */
    disconnect(): Promise<DatabaseResult>;
    /**
     * MySQL 쿼리 실행
     */
    query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
    /**
     * MySQL 트랜잭션 시작
     */
    beginTransaction(): Promise<{
        success: boolean;
        connection?: any;
        error?: string;
    }>;
    /**
     * MySQL 트랜잭션 커밋
     */
    commitTransaction(connection: any): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * MySQL 트랜잭션 롤백
     */
    rollbackTransaction(connection: any): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * MySQL 연결 풀 상태
     */
    getPoolStats(): {
        totalConnections: number;
        activeConnections: number;
        idleConnections: number;
        queuedConnections: number;
    };
    /**
     * MySQL 전용 기능들
     */
    /**
     * 테이블 정보 조회
     */
    getTableInfo(tableName: string): Promise<DatabaseResult>;
    /**
     * 인덱스 정보 조회
     */
    getIndexInfo(tableName: string): Promise<DatabaseResult>;
    /**
     * JSON 컬럼 쿼리 헬퍼
     */
    buildJsonQuery(column: string, path: string, operator: string, value: any): string;
    /**
     * 전문 검색 쿼리 헬퍼 (FULLTEXT 인덱스 필요)
     */
    buildFullTextSearch(columns: string[], query: string, mode?: 'natural' | 'boolean'): string;
    /**
     * 파티션 정보 조회
     */
    getPartitionInfo(tableName: string): Promise<DatabaseResult>;
}
//# sourceMappingURL=MySQLProvider.d.ts.map