/**
 * @company/database - Transaction Manager
 *
 * 데이터베이스 트랜잭션을 관리하는 클래스
 * Zero Error Architecture 기반으로 설계됨
 */
import { Logger } from '@company/core';
import { QueryBuilder } from '../query/QueryBuilder';
import { TransactionError } from '../types';
export class DatabaseTransaction {
    constructor(knexTransaction) {
        this.queries = [];
        this.logger = new Logger('Transaction');
        this.active = true;
        this.id = this.generateTransactionId();
        this.startedAt = new Date();
        this.knexTransaction = knexTransaction;
        this.logger.debug('트랜잭션 시작', { transactionId: this.id });
    }
    /**
     * 트랜잭션 커밋
     */
    async commit() {
        const startTime = Date.now();
        try {
            if (!this.active) {
                throw new TransactionError('트랜잭션이 이미 종료되었습니다', this.id);
            }
            this.logger.debug('트랜잭션 커밋 시작', { transactionId: this.id });
            await this.knexTransaction.commit();
            this.active = false;
            const duration = Date.now() - startTime;
            this.logger.info('트랜잭션 커밋 완료', {
                transactionId: this.id,
                duration,
                queryCount: this.queries.length
            });
            return {
                success: true,
                duration,
                queryCount: this.queries.length
            };
        }
        catch (error) {
            this.active = false;
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : '트랜잭션 커밋 실패';
            this.logger.error('트랜잭션 커밋 실패', {
                transactionId: this.id,
                error: errorMessage,
                duration
            });
            return {
                success: false,
                error: errorMessage,
                duration,
                queryCount: this.queries.length
            };
        }
    }
    /**
     * 트랜잭션 롤백
     */
    async rollback() {
        const startTime = Date.now();
        try {
            if (!this.active) {
                throw new TransactionError('트랜잭션이 이미 종료되었습니다', this.id);
            }
            this.logger.debug('트랜잭션 롤백 시작', { transactionId: this.id });
            await this.knexTransaction.rollback();
            this.active = false;
            const duration = Date.now() - startTime;
            this.logger.info('트랜잭션 롤백 완료', {
                transactionId: this.id,
                duration,
                queryCount: this.queries.length
            });
            return {
                success: true,
                duration,
                queryCount: this.queries.length
            };
        }
        catch (error) {
            this.active = false;
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : '트랜잭션 롤백 실패';
            this.logger.error('트랜잭션 롤백 실패', {
                transactionId: this.id,
                error: errorMessage,
                duration
            });
            return {
                success: false,
                error: errorMessage,
                duration,
                queryCount: this.queries.length
            };
        }
    }
    /**
     * 트랜잭션 내에서 쿼리 실행
     */
    async query(sql, bindings) {
        if (!this.active) {
            return {
                success: false,
                error: '트랜잭션이 종료되었습니다'
            };
        }
        const startTime = Date.now();
        try {
            this.logger.debug('트랜잭션 쿼리 실행', {
                transactionId: this.id,
                sql,
                bindings
            });
            const result = await this.knexTransaction.raw(sql, bindings);
            const executionTime = Date.now() - startTime;
            // 쿼리 메트릭스 저장
            this.queries.push({
                query: sql,
                bindings: bindings || [],
                executionTime,
                rowCount: Array.isArray(result.rows) ? result.rows.length : 1,
                timestamp: new Date()
            });
            this.logger.debug('트랜잭션 쿼리 완료', {
                transactionId: this.id,
                executionTime
            });
            return {
                success: true,
                data: result.rows || result,
                rowCount: Array.isArray(result.rows) ? result.rows.length : 1,
                executionTime
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : '쿼리 실행 실패';
            // 실패한 쿼리도 메트릭스에 기록
            this.queries.push({
                query: sql,
                bindings: bindings || [],
                executionTime,
                rowCount: 0,
                timestamp: new Date()
            });
            this.logger.error('트랜잭션 쿼리 실패', {
                transactionId: this.id,
                sql,
                bindings,
                error: errorMessage,
                executionTime
            });
            return {
                success: false,
                error: errorMessage,
                executionTime
            };
        }
    }
    /**
     * 트랜잭션용 쿼리 빌더 반환
     */
    queryBuilder() {
        if (!this.active) {
            throw new TransactionError('트랜잭션이 종료되었습니다', this.id);
        }
        return new QueryBuilder(this.knexTransaction);
    }
    /**
     * 트랜잭션 활성 상태 확인
     */
    isActive() {
        return this.active;
    }
    /**
     * 트랜잭션 통계 반환
     */
    getStats() {
        return {
            id: this.id,
            startedAt: this.startedAt,
            duration: Date.now() - this.startedAt.getTime(),
            queryCount: this.queries.length,
            active: this.active
        };
    }
    // ===== Private Methods =====
    generateTransactionId() {
        return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
export class TransactionManager {
    constructor(connection) {
        this.connection = connection;
        this.logger = new Logger('TransactionManager');
        this.activeTransactions = new Map();
    }
    /**
     * 새 트랜잭션 시작
     */
    async begin() {
        try {
            this.logger.debug('트랜잭션 시작 요청');
            const knexTransaction = await this.connection.transaction();
            const transaction = new DatabaseTransaction(knexTransaction);
            this.activeTransactions.set(transaction.id, transaction);
            this.logger.info('트랜잭션 시작 완료', { transactionId: transaction.id });
            return {
                success: true,
                transaction
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '트랜잭션 시작 실패';
            this.logger.error('트랜잭션 시작 실패', { error: errorMessage });
            return {
                success: false,
                error: errorMessage
            };
        }
    }
    /**
     * 트랜잭션 콜백 실행
     */
    async execute(callback) {
        const beginResult = await this.begin();
        if (!beginResult.success || !beginResult.transaction) {
            return {
                success: false,
                error: beginResult.error || '트랜잭션 시작 실패'
            };
        }
        const transaction = beginResult.transaction;
        try {
            this.logger.debug('트랜잭션 콜백 실행 시작', { transactionId: transaction.id });
            const result = await callback(transaction);
            const commitResult = await transaction.commit();
            this.activeTransactions.delete(transaction.id);
            if (!commitResult.success) {
                return {
                    success: false,
                    error: commitResult.error || '커밋 실패',
                    transactionId: transaction.id
                };
            }
            this.logger.info('트랜잭션 콜백 실행 완료', { transactionId: transaction.id });
            return {
                success: true,
                data: result,
                transactionId: transaction.id
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '트랜잭션 실행 중 오류';
            this.logger.error('트랜잭션 콜백 실행 실패', {
                transactionId: transaction.id,
                error: errorMessage
            });
            const rollbackResult = await transaction.rollback();
            this.activeTransactions.delete(transaction.id);
            if (!rollbackResult.success) {
                this.logger.error('트랜잭션 롤백 실패', {
                    transactionId: transaction.id,
                    rollbackError: rollbackResult.error
                });
            }
            return {
                success: false,
                error: errorMessage,
                transactionId: transaction.id
            };
        }
    }
    /**
     * 활성 트랜잭션 조회
     */
    getActiveTransaction(transactionId) {
        return this.activeTransactions.get(transactionId) || null;
    }
    /**
     * 모든 활성 트랜잭션 조회
     */
    getActiveTransactions() {
        return Array.from(this.activeTransactions.values());
    }
    /**
     * 활성 트랜잭션 통계
     */
    getStats() {
        const transactions = this.getActiveTransactions();
        return {
            activeCount: transactions.length,
            transactions: transactions.map(tx => tx.getStats())
        };
    }
    /**
     * 모든 활성 트랜잭션 강제 롤백 (긴급 상황용)
     */
    async rollbackAll() {
        const transactions = this.getActiveTransactions();
        const rolledBack = [];
        const errors = [];
        this.logger.warn('모든 활성 트랜잭션 강제 롤백 시작', {
            activeCount: transactions.length
        });
        for (const transaction of transactions) {
            try {
                const result = await transaction.rollback();
                if (result.success) {
                    rolledBack.push(transaction.id);
                }
                else {
                    errors.push({
                        transactionId: transaction.id,
                        error: result.error || '롤백 실패'
                    });
                }
                this.activeTransactions.delete(transaction.id);
            }
            catch (error) {
                errors.push({
                    transactionId: transaction.id,
                    error: error instanceof Error ? error.message : '알 수 없는 오류'
                });
                this.activeTransactions.delete(transaction.id);
            }
        }
        this.logger.info('모든 활성 트랜잭션 강제 롤백 완료', {
            rolledBack: rolledBack.length,
            errors: errors.length
        });
        return {
            success: errors.length === 0,
            rolledBack,
            errors
        };
    }
}
//# sourceMappingURL=TransactionManager.js.map