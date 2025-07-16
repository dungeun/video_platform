/**
 * @repo/database - PostgreSQL Provider
 *
 * PostgreSQL 데이터베이스 전용 프로바이더
 * Zero Error Architecture 기반으로 설계됨
 */
import type { DatabaseConfig, DatabaseResult, QueryResult } from '../types';
export declare class PostgreSQLProvider {
    private config;
    private logger;
    private client;
    private pool;
    constructor(config: DatabaseConfig);
    /**
     * PostgreSQL 연결 설정
     */
    connect(): Promise<DatabaseResult>;
    /**
     * PostgreSQL 연결 해제
     */
    disconnect(): Promise<DatabaseResult>;
    /**
     * PostgreSQL 쿼리 실행
     */
    query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
    /**
     * PostgreSQL 트랜잭션 시작
     */
    beginTransaction(): Promise<{
        success: boolean;
        client?: any;
        error?: string;
    }>;
    /**
     * PostgreSQL 트랜잭션 커밋
     */
    commitTransaction(client: any): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * PostgreSQL 트랜잭션 롤백
     */
    rollbackTransaction(client: any): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * PostgreSQL 연결 풀 상태
     */
    getPoolStats(): {
        totalCount: number;
        idleCount: number;
        waitingCount: number;
    };
    /**
     * PostgreSQL 전용 기능들
     */
    /**
     * LISTEN/NOTIFY 기능
     */
    listen(channel: string, callback: (payload: string) => void): Promise<DatabaseResult>;
    /**
     * NOTIFY 기능
     */
    notify(channel: string, payload?: string): Promise<DatabaseResult>;
    /**
     * JSONB 쿼리 헬퍼
     */
    buildJsonbQuery(column: string, path: string[], operator: string, value: any): string;
    /**
     * 전문 검색 쿼리 헬퍼
     */
    buildFullTextSearch(column: string, query: string, language?: string): string;
}
//# sourceMappingURL=PostgreSQLProvider.d.ts.map