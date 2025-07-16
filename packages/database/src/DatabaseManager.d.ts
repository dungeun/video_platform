/**
 * @company/database - Database Manager
 *
 * 데이터베이스 연결과 작업을 통합 관리하는 메인 클래스
 * Zero Error Architecture 기반으로 설계됨
 */
import { QueryBuilder } from './query/QueryBuilder';
import { DatabaseTransaction } from './transaction/TransactionManager';
import type { DatabaseConfig, DatabaseManager as IDatabaseManager, DatabaseResult, QueryResult, TransactionResult, MigrationResult, MigrationOptions, ConnectionInfo, PoolStats, SchemaBuilder } from './types';
export declare class DatabaseManager implements IDatabaseManager {
    private logger;
    private connectionManager;
    private events;
    constructor();
    /**
     * 모듈 초기화
     */
    initialize(): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * 모듈 정리
     */
    cleanup(): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * 데이터베이스 연결
     */
    connect(config: DatabaseConfig): Promise<DatabaseResult>;
    /**
     * 데이터베이스 연결 해제
     */
    disconnect(connectionId?: string): Promise<DatabaseResult>;
    /**
     * 쿼리 실행
     */
    query<T = any>(sql: string, bindings?: any[], connectionId?: string): Promise<QueryResult<T>>;
    /**
     * 쿼리 빌더 반환
     */
    queryBuilder(connectionId?: string): QueryBuilder;
    /**
     * 트랜잭션 실행
     */
    transaction<T = any>(callback: (trx: DatabaseTransaction) => Promise<T>, connectionId?: string): Promise<TransactionResult>;
    /**
     * 마이그레이션 실행
     */
    migrate(options?: MigrationOptions): Promise<MigrationResult>;
    /**
     * 스키마 빌더 반환
     */
    schema(connectionId?: string): SchemaBuilder;
    /**
     * 연결 정보 조회
     */
    getConnections(): ConnectionInfo[];
    /**
     * 특정 연결 정보 조회
     */
    getConnection(id: string): ConnectionInfo | null;
    /**
     * 연결 상태 확인
     */
    isConnected(connectionId?: string): boolean;
    /**
     * 연결 풀 통계 조회
     */
    getStats(connectionId?: string): PoolStats | null;
    /**
     * 이벤트 리스너 등록
     */
    addEventListener(event: string, listener: (...args: any[]) => void): void;
    /**
     * 이벤트 리스너 제거
     */
    removeEventListener(event: string, listener: (...args: any[]) => void): void;
    /**
     * 데이터베이스 상태 정보 조회
     */
    getSystemInfo(): Promise<{
        connections: ConnectionInfo[];
        stats: Record<string, PoolStats | null>;
        totalConnections: number;
        activeConnections: number;
    }>;
    /**
     * 연결 헬스체크
     */
    healthCheck(connectionId?: string): Promise<{
        success: boolean;
        connectionId?: string;
        provider?: string;
        responseTime?: number;
        error?: string;
    }>;
}
//# sourceMappingURL=DatabaseManager.d.ts.map