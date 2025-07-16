/**
 * @repo/database - Database Manager
 *
 * 데이터베이스 연결과 작업을 통합 관리하는 메인 클래스
 * Zero Error Architecture 기반으로 설계됨
 */
import { Logger } from '@repo/core';
import { EventEmitter } from 'events';
import { ConnectionManager } from './connection/ConnectionManager';
import { QueryBuilder } from './query/QueryBuilder';
import { TransactionManager } from './transaction/TransactionManager';
import { MigrationRunner } from './migration/MigrationRunner';
export class DatabaseManager {
    constructor() {
        this.logger = new Logger('DatabaseManager');
        this.events = new EventEmitter();
        this.connectionManager = new ConnectionManager();
        // 연결 매니저 이벤트를 전파
        this.connectionManager.on('connection:created', (data) => {
            this.events.emit('connection:created', data);
        });
        this.connectionManager.on('connection:destroyed', (data) => {
            this.events.emit('connection:destroyed', data);
        });
        this.connectionManager.on('query:start', (data) => {
            this.events.emit('query:start', data);
        });
        this.connectionManager.on('query:complete', (data) => {
            this.events.emit('query:complete', data);
        });
        this.connectionManager.on('query:error', (data) => {
            this.events.emit('query:error', data);
        });
        this.logger.info('DatabaseManager 초기화 완료');
    }
    /**
     * 모듈 초기화
     */
    async initialize() {
        try {
            this.logger.info('DatabaseManager 초기화 시작');
            // 필요한 경우 기본 설정 로드
            // await this.loadDefaultConfigurations();
            this.logger.info('DatabaseManager 초기화 완료');
            return { success: true };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'DatabaseManager 초기화 실패';
            this.logger.error('DatabaseManager 초기화 실패', { error: errorMessage });
            return { success: false, error: errorMessage };
        }
    }
    /**
     * 모듈 정리
     */
    async cleanup() {
        try {
            this.logger.info('DatabaseManager 정리 시작');
            // 모든 연결 해제
            const disconnectResult = await this.connectionManager.disconnect();
            if (!disconnectResult.success) {
                this.logger.warn('일부 연결 해제 실패', { error: disconnectResult.error });
            }
            this.logger.info('DatabaseManager 정리 완료');
            return { success: true };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'DatabaseManager 정리 실패';
            this.logger.error('DatabaseManager 정리 실패', { error: errorMessage });
            return { success: false, error: errorMessage };
        }
    }
    /**
     * 데이터베이스 연결
     */
    async connect(config) {
        try {
            this.logger.info('데이터베이스 연결 요청', {
                provider: config.provider,
                database: config.database
            });
            const result = await this.connectionManager.connect(config);
            if (result.success) {
                this.logger.info('데이터베이스 연결 성공', {
                    connectionId: result.connectionId,
                    provider: config.provider
                });
            }
            else {
                this.logger.error('데이터베이스 연결 실패', { error: result.error });
            }
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '데이터베이스 연결 실패';
            this.logger.error('데이터베이스 연결 실패', { error: errorMessage });
            return {
                success: false,
                error: errorMessage
            };
        }
    }
    /**
     * 데이터베이스 연결 해제
     */
    async disconnect(connectionId) {
        try {
            this.logger.info('데이터베이스 연결 해제 요청', { connectionId });
            const result = await this.connectionManager.disconnect(connectionId);
            if (result.success) {
                this.logger.info('데이터베이스 연결 해제 성공', { connectionId });
            }
            else {
                this.logger.error('데이터베이스 연결 해제 실패', { error: result.error });
            }
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '데이터베이스 연결 해제 실패';
            this.logger.error('데이터베이스 연결 해제 실패', { error: errorMessage });
            return {
                success: false,
                error: errorMessage
            };
        }
    }
    /**
     * 쿼리 실행
     */
    async query(sql, bindings, connectionId) {
        try {
            const targetConnectionId = connectionId || this.connectionManager.getDefaultConnectionId();
            if (!targetConnectionId) {
                return {
                    success: false,
                    error: '사용 가능한 데이터베이스 연결이 없습니다'
                };
            }
            const connection = this.connectionManager.getRawConnection(targetConnectionId);
            if (!connection) {
                return {
                    success: false,
                    error: `연결을 찾을 수 없습니다: ${targetConnectionId}`
                };
            }
            const queryBuilder = new QueryBuilder(connection);
            return await queryBuilder.raw(sql, bindings);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '쿼리 실행 실패';
            this.logger.error('쿼리 실행 실패', { sql, bindings, error: errorMessage });
            return {
                success: false,
                error: errorMessage
            };
        }
    }
    /**
     * 쿼리 빌더 반환
     */
    queryBuilder(connectionId) {
        const targetConnectionId = connectionId || this.connectionManager.getDefaultConnectionId();
        if (!targetConnectionId) {
            throw new Error('사용 가능한 데이터베이스 연결이 없습니다');
        }
        const connection = this.connectionManager.getRawConnection(targetConnectionId);
        if (!connection) {
            throw new Error(`연결을 찾을 수 없습니다: ${targetConnectionId}`);
        }
        return new QueryBuilder(connection);
    }
    /**
     * 트랜잭션 실행
     */
    async transaction(callback, connectionId) {
        try {
            const targetConnectionId = connectionId || this.connectionManager.getDefaultConnectionId();
            if (!targetConnectionId) {
                return {
                    success: false,
                    error: '사용 가능한 데이터베이스 연결이 없습니다'
                };
            }
            const connection = this.connectionManager.getRawConnection(targetConnectionId);
            if (!connection) {
                return {
                    success: false,
                    error: `연결을 찾을 수 없습니다: ${targetConnectionId}`
                };
            }
            const transactionManager = new TransactionManager(connection);
            const result = await transactionManager.execute(callback);
            return {
                success: result.success,
                error: result.error || undefined,
                duration: 0, // TransactionManager에서 계산된 값 사용
                queryCount: 0 // TransactionManager에서 계산된 값 사용
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '트랜잭션 실행 실패';
            this.logger.error('트랜잭션 실행 실패', { error: errorMessage });
            return {
                success: false,
                error: errorMessage
            };
        }
    }
    /**
     * 마이그레이션 실행
     */
    async migrate(options = {}) {
        try {
            const targetConnectionId = options.connectionId || this.connectionManager.getDefaultConnectionId();
            if (!targetConnectionId) {
                return {
                    success: false,
                    error: '사용 가능한 데이터베이스 연결이 없습니다',
                    executed: [],
                    skipped: [],
                    duration: 0
                };
            }
            const connection = this.connectionManager.getRawConnection(targetConnectionId);
            if (!connection) {
                return {
                    success: false,
                    error: `연결을 찾을 수 없습니다: ${targetConnectionId}`,
                    executed: [],
                    skipped: [],
                    duration: 0
                };
            }
            const migrationRunner = new MigrationRunner(connection, options);
            return await migrationRunner.run();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '마이그레이션 실행 실패';
            this.logger.error('마이그레이션 실행 실패', { error: errorMessage });
            return {
                success: false,
                error: errorMessage,
                executed: [],
                skipped: [],
                duration: 0
            };
        }
    }
    /**
     * 스키마 빌더 반환
     */
    schema(connectionId) {
        const targetConnectionId = connectionId || this.connectionManager.getDefaultConnectionId();
        if (!targetConnectionId) {
            throw new Error('사용 가능한 데이터베이스 연결이 없습니다');
        }
        const connection = this.connectionManager.getRawConnection(targetConnectionId);
        if (!connection) {
            throw new Error(`연결을 찾을 수 없습니다: ${targetConnectionId}`);
        }
        return connection.schema;
    }
    /**
     * 연결 정보 조회
     */
    getConnections() {
        return this.connectionManager.getConnections();
    }
    /**
     * 특정 연결 정보 조회
     */
    getConnection(id) {
        return this.connectionManager.getConnection(id);
    }
    /**
     * 연결 상태 확인
     */
    isConnected(connectionId) {
        if (connectionId) {
            return this.connectionManager.isConnected(connectionId);
        }
        const defaultId = this.connectionManager.getDefaultConnectionId();
        return defaultId ? this.connectionManager.isConnected(defaultId) : false;
    }
    /**
     * 연결 풀 통계 조회
     */
    getStats(connectionId) {
        const targetConnectionId = connectionId || this.connectionManager.getDefaultConnectionId();
        if (!targetConnectionId) {
            return null;
        }
        return this.connectionManager.getStats(targetConnectionId);
    }
    /**
     * 이벤트 리스너 등록
     */
    addEventListener(event, listener) {
        this.events.on(event, listener);
    }
    /**
     * 이벤트 리스너 제거
     */
    removeEventListener(event, listener) {
        this.events.off(event, listener);
    }
    /**
     * 데이터베이스 상태 정보 조회
     */
    async getSystemInfo() {
        const connections = this.getConnections();
        const stats = {};
        let totalConnections = 0;
        let activeConnections = 0;
        for (const connection of connections) {
            const poolStats = this.getStats(connection.id);
            stats[connection.id] = poolStats;
            if (poolStats) {
                totalConnections += poolStats.size;
                activeConnections += poolStats.borrowed;
            }
        }
        return {
            connections,
            stats,
            totalConnections,
            activeConnections
        };
    }
    /**
     * 연결 헬스체크
     */
    async healthCheck(connectionId) {
        const startTime = Date.now();
        try {
            const targetConnectionId = connectionId || this.connectionManager.getDefaultConnectionId();
            if (!targetConnectionId) {
                return {
                    success: false,
                    error: '사용 가능한 데이터베이스 연결이 없습니다'
                };
            }
            const connectionInfo = this.getConnection(targetConnectionId);
            if (!connectionInfo) {
                return {
                    success: false,
                    connectionId: targetConnectionId,
                    error: '연결 정보를 찾을 수 없습니다'
                };
            }
            // 간단한 쿼리로 연결 상태 확인
            const result = await this.query('SELECT 1 as health_check', [], targetConnectionId);
            const responseTime = Date.now() - startTime;
            if (result.success) {
                return {
                    success: true,
                    connectionId: targetConnectionId,
                    provider: connectionInfo.provider,
                    responseTime
                };
            }
            else {
                return {
                    success: false,
                    connectionId: targetConnectionId,
                    provider: connectionInfo.provider,
                    responseTime,
                    error: result.error || '헬스체크 실패'
                };
            }
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : '헬스체크 실패';
            return {
                success: false,
                ...(connectionId && { connectionId }),
                responseTime,
                error: errorMessage
            };
        }
    }
}
//# sourceMappingURL=DatabaseManager.js.map