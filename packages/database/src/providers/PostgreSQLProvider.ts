/**
 * @company/database - PostgreSQL Provider
 * 
 * PostgreSQL 데이터베이스 전용 프로바이더
 * Zero Error Architecture 기반으로 설계됨
 */

import { Logger } from '@company/core';
import type { DatabaseConfig, DatabaseResult, QueryResult } from '../types';

export class PostgreSQLProvider {
  private logger = new Logger('PostgreSQLProvider');
  private client: any;
  private pool: any;

  constructor(private config: DatabaseConfig) {
    if (config.provider !== 'postgresql') {
      throw new Error('PostgreSQL 프로바이더는 PostgreSQL 설정만 지원합니다');
    }
  }

  /**
   * PostgreSQL 연결 설정
   */
  async connect(): Promise<DatabaseResult> {
    try {
      const { Pool } = require('pg');
      
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port || 5432,
        user: this.config.username,
        password: this.config.password,
        database: this.config.database,
        ssl: this.config.ssl,
        min: this.config.pool?.min || 2,
        max: this.config.pool?.max || 10,
        idleTimeoutMillis: this.config.pool?.idleTimeoutMillis || 30000,
        acquireTimeoutMillis: this.config.pool?.acquireTimeoutMillis || 60000
      });

      // 연결 테스트
      this.client = await this.pool.connect();
      await this.client.query('SELECT 1');
      this.client.release();

      this.logger.info('PostgreSQL 연결 성공', {
        host: this.config.host,
        database: this.config.database
      });

      return {
        success: true,
        data: { provider: 'postgresql', database: this.config.database }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PostgreSQL 연결 실패';
      this.logger.error('PostgreSQL 연결 실패', { error: errorMessage });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * PostgreSQL 연결 해제
   */
  async disconnect(): Promise<DatabaseResult> {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }

      this.logger.info('PostgreSQL 연결 해제 완료');

      return {
        success: true,
        data: { disconnected: true }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PostgreSQL 연결 해제 실패';
      this.logger.error('PostgreSQL 연결 해제 실패', { error: errorMessage });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * PostgreSQL 쿼리 실행
   */
  async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    const startTime = Date.now();

    try {
      if (!this.pool) {
        throw new Error('PostgreSQL 연결이 설정되지 않았습니다');
      }

      this.logger.debug('PostgreSQL 쿼리 실행', { sql, params });

      const client = await this.pool.connect();
      const result = await client.query(sql, params);
      client.release();

      const executionTime = Date.now() - startTime;

      this.logger.debug('PostgreSQL 쿼리 완료', {
        rowCount: result.rowCount,
        executionTime
      });

      return {
        success: true,
        data: result.rows,
        rowCount: result.rowCount,
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'PostgreSQL 쿼리 실행 실패';
      
      this.logger.error('PostgreSQL 쿼리 실행 실패', {
        sql,
        params,
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
   * PostgreSQL 트랜잭션 시작
   */
  async beginTransaction(): Promise<{ success: boolean; client?: any; error?: string }> {
    try {
      if (!this.pool) {
        throw new Error('PostgreSQL 연결이 설정되지 않았습니다');
      }

      const client = await this.pool.connect();
      await client.query('BEGIN');

      this.logger.debug('PostgreSQL 트랜잭션 시작');

      return {
        success: true,
        client
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PostgreSQL 트랜잭션 시작 실패';
      this.logger.error('PostgreSQL 트랜잭션 시작 실패', { error: errorMessage });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * PostgreSQL 트랜잭션 커밋
   */
  async commitTransaction(client: any): Promise<{ success: boolean; error?: string }> {
    try {
      await client.query('COMMIT');
      client.release();

      this.logger.debug('PostgreSQL 트랜잭션 커밋 완료');

      return {
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PostgreSQL 트랜잭션 커밋 실패';
      this.logger.error('PostgreSQL 트랜잭션 커밋 실패', { error: errorMessage });

      try {
        client.release();
      } catch (releaseError) {
        this.logger.error('PostgreSQL 클라이언트 해제 실패', { error: releaseError });
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * PostgreSQL 트랜잭션 롤백
   */
  async rollbackTransaction(client: any): Promise<{ success: boolean; error?: string }> {
    try {
      await client.query('ROLLBACK');
      client.release();

      this.logger.debug('PostgreSQL 트랜잭션 롤백 완료');

      return {
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PostgreSQL 트랜잭션 롤백 실패';
      this.logger.error('PostgreSQL 트랜잭션 롤백 실패', { error: errorMessage });

      try {
        client.release();
      } catch (releaseError) {
        this.logger.error('PostgreSQL 클라이언트 해제 실패', { error: releaseError });
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * PostgreSQL 연결 풀 상태
   */
  getPoolStats(): {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  } {
    if (!this.pool) {
      return {
        totalCount: 0,
        idleCount: 0,
        waitingCount: 0
      };
    }

    return {
      totalCount: this.pool.totalCount || 0,
      idleCount: this.pool.idleCount || 0,
      waitingCount: this.pool.waitingCount || 0
    };
  }

  /**
   * PostgreSQL 전용 기능들
   */

  /**
   * LISTEN/NOTIFY 기능
   */
  async listen(channel: string, callback: (payload: string) => void): Promise<DatabaseResult> {
    try {
      if (!this.pool) {
        throw new Error('PostgreSQL 연결이 설정되지 않았습니다');
      }

      const client = await this.pool.connect();
      await client.query(`LISTEN ${channel}`);

      client.on('notification', (msg: any) => {
        if (msg.channel === channel) {
          callback(msg.payload);
        }
      });

      this.logger.info(`PostgreSQL LISTEN 시작: ${channel}`);

      return {
        success: true,
        data: { channel, listening: true }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PostgreSQL LISTEN 실패';
      this.logger.error('PostgreSQL LISTEN 실패', { channel, error: errorMessage });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * NOTIFY 기능
   */
  async notify(channel: string, payload?: string): Promise<DatabaseResult> {
    try {
      const sql = payload 
        ? `NOTIFY ${channel}, '${payload}'`
        : `NOTIFY ${channel}`;

      const result = await this.query(sql);

      if (!result.success) {
        throw new Error(result.error);
      }

      this.logger.debug(`PostgreSQL NOTIFY 발송: ${channel}`, { payload });

      return {
        success: true,
        data: { channel, payload, notified: true }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PostgreSQL NOTIFY 실패';
      this.logger.error('PostgreSQL NOTIFY 실패', { channel, payload, error: errorMessage });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * JSONB 쿼리 헬퍼
   */
  buildJsonbQuery(column: string, path: string[], operator: string, value: any): string {
    const pathStr = path.map(p => `'${p}'`).join(',');
    
    switch (operator) {
      case 'contains':
        return `${column} @> '${JSON.stringify(value)}'`;
      case 'contained':
        return `${column} <@ '${JSON.stringify(value)}'`;
      case 'path_exists':
        return `${column} #> '{${pathStr}}' IS NOT NULL`;
      case 'path_equals':
        return `${column} #>> '{${pathStr}}' = '${value}'`;
      default:
        throw new Error(`지원하지 않는 JSONB 연산자: ${operator}`);
    }
  }

  /**
   * 전문 검색 쿼리 헬퍼
   */
  buildFullTextSearch(column: string, query: string, language: string = 'simple'): string {
    return `to_tsvector('${language}', ${column}) @@ plainto_tsquery('${language}', '${query}')`;
  }
}