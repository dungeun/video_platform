/**
 * @repo/database - Connection Manager
 *
 * 데이터베이스 연결을 관리하는 핵심 클래스
 * Zero Error Architecture 기반으로 설계됨
 */
import { EventEmitter } from 'events';
import { Logger } from '@repo/core';
import { ConnectionError } from '../types';
export class ConnectionManager {
    constructor() {
        this.connections = new Map();
        this.configs = new Map();
        this.logger = new Logger('ConnectionManager');
        this.idCounter = 0;
        this.events = new EventEmitter();
    }
    /**
     * 새 데이터베이스 연결 생성
     */
    async connect(config, _options = {}) {
        try {
            const connectionId = this.generateConnectionId();
            this.logger.info('데이터베이스 연결 시작', {
                connectionId,
                provider: config.provider,
                database: config.database
            });
            // 프로바이더별 연결 생성
            const connection = await this.createConnection(config, connectionId);
            // 연결 테스트
            await this.testConnection(connection, config.provider);
            // 연결 정보 저장
            this.connections.set(connectionId, connection);
            this.configs.set(connectionId, config);
            // 이벤트 발생
            this.events.emit('connection:created', { connectionId, config });
            this.logger.info('데이터베이스 연결 성공', { connectionId });
            return {
                success: true,
                connectionId,
                data: { connectionId, provider: config.provider }
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '연결 실패';
            this.logger.error('데이터베이스 연결 실패', { error: errorMessage, config });
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
            if (connectionId) {
                // 특정 연결 해제
                return await this.disconnectSingle(connectionId);
            }
            else {
                // 모든 연결 해제
                return await this.disconnectAll();
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '연결 해제 실패';
            this.logger.error('연결 해제 실패', { error: errorMessage, connectionId });
            return {
                success: false,
                error: errorMessage
            };
        }
    }
    /**
     * 연결 정보 조회
     */
    getConnection(connectionId) {
        if (!this.connections.has(connectionId)) {
            return null;
        }
        const config = this.configs.get(connectionId);
        if (!config) {
            return null;
        }
        return {
            id: connectionId,
            provider: config.provider,
            database: config.database,
            connected: this.isConnected(connectionId),
            createdAt: new Date(), // 실제로는 생성 시간을 저장해야 함
            lastUsed: new Date() // 실제로는 마지막 사용 시간을 저장해야 함
        };
    }
    /**
     * 모든 연결 정보 조회
     */
    getConnections() {
        return Array.from(this.connections.keys())
            .map(id => this.getConnection(id))
            .filter((info) => info !== null);
    }
    /**
     * 연결 상태 확인
     */
    isConnected(connectionId) {
        return this.connections.has(connectionId);
    }
    /**
     * 연결 풀 통계 조회
     */
    getStats(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            return null;
        }
        // Knex 연결인 경우 풀 정보 반환
        if (connection.client && connection.client.pool) {
            const pool = connection.client.pool;
            return {
                size: pool.size || 0,
                available: pool.available || 0,
                borrowed: pool.borrowed || 0,
                invalid: pool.invalid || 0,
                pending: pool.pending || 0,
                max: pool.max || 0,
                min: pool.min || 0
            };
        }
        return null;
    }
    /**
     * 원시 연결 객체 반환 (내부 사용)
     */
    getRawConnection(connectionId) {
        return this.connections.get(connectionId);
    }
    /**
     * 기본 연결 ID 반환
     */
    getDefaultConnectionId() {
        const connections = Array.from(this.connections.keys());
        return connections.length > 0 ? connections[0] : null;
    }
    /**
     * 이벤트 리스너 등록
     */
    on(event, listener) {
        this.events.on(event, listener);
    }
    /**
     * 이벤트 리스너 제거
     */
    off(event, listener) {
        this.events.off(event, listener);
    }
    // ===== Private Methods =====
    generateConnectionId() {
        return `conn_${++this.idCounter}_${Date.now()}`;
    }
    async createConnection(config, connectionId) {
        const knex = require('knex');
        const knexConfig = this.buildKnexConfig(config);
        try {
            const connection = knex(knexConfig);
            // 연결 이벤트 설정
            this.setupConnectionEvents(connection, connectionId);
            return connection;
        }
        catch (error) {
            throw new ConnectionError(`${config.provider} 연결 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, config.provider);
        }
    }
    buildKnexConfig(config) {
        const baseConfig = {
            client: this.getKnexClient(config.provider),
            connection: this.buildConnectionConfig(config),
            pool: {
                min: config.pool?.min || 2,
                max: config.pool?.max || 10,
                idleTimeoutMillis: config.pool?.idleTimeoutMillis || 30000,
                acquireTimeoutMillis: config.pool?.acquireTimeoutMillis || 60000
            },
            debug: config.debug || false,
            useNullAsDefault: config.provider === 'sqlite'
        };
        return baseConfig;
    }
    getKnexClient(provider) {
        switch (provider) {
            case 'postgresql':
                return 'pg';
            case 'mysql':
                return 'mysql2';
            case 'sqlite':
                return 'sqlite3';
            default:
                throw new ConnectionError(`지원하지 않는 데이터베이스 프로바이더: ${provider}`);
        }
    }
    buildConnectionConfig(config) {
        switch (config.provider) {
            case 'postgresql':
            case 'mysql':
                return {
                    host: config.host,
                    port: config.port,
                    user: config.username,
                    password: config.password,
                    database: config.database,
                    ssl: config.ssl
                };
            case 'sqlite':
                return {
                    filename: config.filename || config.database
                };
            default:
                throw new ConnectionError(`지원하지 않는 데이터베이스 프로바이더: ${config.provider}`);
        }
    }
    async testConnection(connection, provider) {
        try {
            // 간단한 쿼리로 연결 테스트
            switch (provider) {
                case 'postgresql':
                    await connection.raw('SELECT 1');
                    break;
                case 'mysql':
                    await connection.raw('SELECT 1');
                    break;
                case 'sqlite':
                    await connection.raw('SELECT 1');
                    break;
                default:
                    throw new Error(`지원하지 않는 프로바이더: ${provider}`);
            }
        }
        catch (error) {
            await connection.destroy();
            throw new ConnectionError(`연결 테스트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, provider);
        }
    }
    setupConnectionEvents(connection, connectionId) {
        // Query 이벤트
        connection.on('query', (queryData) => {
            this.events.emit('query:start', {
                query: queryData.sql,
                bindings: queryData.bindings || [],
                connectionId
            });
        });
        connection.on('query-response', (response, queryData) => {
            this.events.emit('query:complete', {
                query: queryData.sql,
                bindings: queryData.bindings || [],
                duration: response.duration || 0,
                connectionId
            });
        });
        connection.on('query-error', (error, queryData) => {
            this.events.emit('query:error', {
                query: queryData.sql,
                bindings: queryData.bindings || [],
                error: error.message,
                connectionId
            });
        });
    }
    async disconnectSingle(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            return {
                success: false,
                error: `연결을 찾을 수 없습니다: ${connectionId}`
            };
        }
        try {
            await connection.destroy();
            this.connections.delete(connectionId);
            this.configs.delete(connectionId);
            this.events.emit('connection:destroyed', { connectionId });
            this.logger.info('연결 해제 완료', { connectionId });
            return {
                success: true,
                data: { disconnected: connectionId }
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '연결 해제 실패';
            throw new Error(errorMessage);
        }
    }
    async disconnectAll() {
        const connectionIds = Array.from(this.connections.keys());
        const results = [];
        const errors = [];
        for (const connectionId of connectionIds) {
            try {
                const result = await this.disconnectSingle(connectionId);
                if (result.success) {
                    results.push(connectionId);
                }
                else {
                    errors.push(`${connectionId}: ${result.error}`);
                }
            }
            catch (error) {
                errors.push(`${connectionId}: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
            }
        }
        this.logger.info('모든 연결 해제 완료', {
            disconnected: results.length,
            errors: errors.length
        });
        return {
            success: errors.length === 0,
            ...(errors.length > 0 && { error: errors.join(', ') }),
            data: {
                disconnected: results,
                ...(errors.length > 0 && { errors })
            }
        };
    }
}
//# sourceMappingURL=ConnectionManager.js.map