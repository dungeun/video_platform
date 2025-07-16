/**
 * @repo/database - Transaction Manager
 *
 * 데이터베이스 트랜잭션을 관리하는 클래스
 * Zero Error Architecture 기반으로 설계됨
 */
import { QueryBuilder } from '../query/QueryBuilder';
import type { Transaction, TransactionResult, QueryResult, QueryMetrics } from '../types';
export declare class DatabaseTransaction implements Transaction {
    readonly id: string;
    readonly startedAt: Date;
    readonly queries: QueryMetrics[];
    private logger;
    private knexTransaction;
    private active;
    constructor(knexTransaction: any);
    /**
     * 트랜잭션 커밋
     */
    commit(): Promise<TransactionResult>;
    /**
     * 트랜잭션 롤백
     */
    rollback(): Promise<TransactionResult>;
    /**
     * 트랜잭션 내에서 쿼리 실행
     */
    query<T = any>(sql: string, bindings?: any[]): Promise<QueryResult<T>>;
    /**
     * 트랜잭션용 쿼리 빌더 반환
     */
    queryBuilder(): QueryBuilder;
    /**
     * 트랜잭션 활성 상태 확인
     */
    isActive(): boolean;
    /**
     * 트랜잭션 통계 반환
     */
    getStats(): {
        id: string;
        startedAt: Date;
        duration: number;
        queryCount: number;
        active: boolean;
    };
    private generateTransactionId;
}
export declare class TransactionManager {
    private connection;
    private logger;
    private activeTransactions;
    constructor(connection: any);
    /**
     * 새 트랜잭션 시작
     */
    begin(): Promise<{
        success: boolean;
        transaction?: DatabaseTransaction;
        error?: string;
    }>;
    /**
     * 트랜잭션 콜백 실행
     */
    execute<T>(callback: (transaction: DatabaseTransaction) => Promise<T>): Promise<{
        success: boolean;
        data?: T;
        error?: string;
        transactionId?: string;
    }>;
    /**
     * 활성 트랜잭션 조회
     */
    getActiveTransaction(transactionId: string): DatabaseTransaction | null;
    /**
     * 모든 활성 트랜잭션 조회
     */
    getActiveTransactions(): DatabaseTransaction[];
    /**
     * 활성 트랜잭션 통계
     */
    getStats(): {
        activeCount: number;
        transactions: Array<{
            id: string;
            startedAt: Date;
            duration: number;
            queryCount: number;
        }>;
    };
    /**
     * 모든 활성 트랜잭션 강제 롤백 (긴급 상황용)
     */
    rollbackAll(): Promise<{
        success: boolean;
        rolledBack: string[];
        errors: Array<{
            transactionId: string;
            error: string;
        }>;
    }>;
}
//# sourceMappingURL=TransactionManager.d.ts.map