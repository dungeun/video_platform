/**
 * @company/database - SQLite Provider
 *
 * SQLite 데이터베이스 전용 프로바이더
 * Zero Error Architecture 기반으로 설계됨
 */
import type { DatabaseConfig, DatabaseResult, QueryResult } from '../types';
export declare class SQLiteProvider {
    private config;
    private logger;
    private db;
    constructor(config: DatabaseConfig);
    /**
     * SQLite 연결 설정
     */
    connect(): Promise<DatabaseResult>;
    /**
     * SQLite 연결 해제
     */
    disconnect(): Promise<DatabaseResult>;
    /**
     * SQLite 쿼리 실행
     */
    query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
    /**
     * SQLite 트랜잭션 시작
     */
    beginTransaction(): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * SQLite 트랜잭션 커밋
     */
    commitTransaction(): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * SQLite 트랜잭션 롤백
     */
    rollbackTransaction(): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * SQLite 데이터베이스 상태
     */
    getDatabaseStats(): Promise<DatabaseResult>;
    /**
     * SQLite 전용 기능들
     */
    /**
     * VACUUM 실행 (데이터베이스 최적화)
     */
    vacuum(): Promise<DatabaseResult>;
    /**
     * ANALYZE 실행 (통계 수집)
     */
    analyze(tableName?: string): Promise<DatabaseResult>;
    /**
     * 테이블 정보 조회
     */
    getTableInfo(tableName: string): Promise<DatabaseResult>;
    /**
     * 인덱스 정보 조회
     */
    getIndexInfo(tableName: string): Promise<DatabaseResult>;
    /**
     * JSON1 확장 쿼리 헬퍼
     */
    buildJsonQuery(column: string, path: string, value?: any): string;
    /**
     * FTS (Full Text Search) 헬퍼
     */
    buildFTSQuery(ftsTable: string, column: string, query: string): string;
    /**
     * 데이터베이스 백업
     */
    backup(backupPath: string): Promise<DatabaseResult>;
    /**
     * 데이터베이스 파일 크기 조회
     */
    getDatabaseSize(): Promise<DatabaseResult>;
    private formatBytes;
}
//# sourceMappingURL=SQLiteProvider.d.ts.map