/**
 * @company/database - MySQL Provider
 * 
 * MySQL 데이터베이스 전용 프로바이더
 * Zero Error Architecture 기반으로 설계됨
 */

import { Logger } from '@company/core';
import type { DatabaseConfig, DatabaseResult, QueryResult } from '../types';

export class MySQLProvider {
  private logger = new Logger('MySQLProvider');
  private pool: any;

  constructor(private config: DatabaseConfig) {
    if (config.provider !== 'mysql') {
      throw new Error('MySQL 프로바이더는 MySQL 설정만 지원합니다');
    }
  }

  /**
   * MySQL 연결 설정
   */
  async connect(): Promise<DatabaseResult> {
    try {
      const mysql = require('mysql2/promise');
      
      this.pool = mysql.createPool({
        host: this.config.host,
        port: this.config.port || 3306,
        user: this.config.username,
        password: this.config.password,
        database: this.config.database,
        ssl: this.config.ssl,
        connectionLimit: this.config.pool?.max || 10,
        acquireTimeout: this.config.pool?.acquireTimeoutMillis || 60000,
        timeout: this.config.pool?.idleTimeoutMillis || 30000,
        multipleStatements: false,
        charset: 'utf8mb4'
      });

      // 연결 테스트
      const connection = await this.pool.getConnection();
      await connection.execute('SELECT 1');
      connection.release();

      this.logger.info('MySQL 연결 성공', {
        host: this.config.host,
        database: this.config.database
      });

      return {
        success: true,
        data: { provider: 'mysql', database: this.config.database }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'MySQL 연결 실패';
      this.logger.error('MySQL 연결 실패', { error: errorMessage });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * MySQL 연결 해제
   */
  async disconnect(): Promise<DatabaseResult> {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }

      this.logger.info('MySQL 연결 해제 완료');

      return {
        success: true,
        data: { disconnected: true }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'MySQL 연결 해제 실패';
      this.logger.error('MySQL 연결 해제 실패', { error: errorMessage });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * MySQL 쿼리 실행
   */
  async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    const startTime = Date.now();

    try {
      if (!this.pool) {
        throw new Error('MySQL 연결이 설정되지 않았습니다');
      }

      this.logger.debug('MySQL 쿼리 실행', { sql, params });

      const [results] = await this.pool.execute(sql, params);
      const executionTime = Date.now() - startTime;

      // INSERT/UPDATE/DELETE 결과 처리
      if (results && typeof results === 'object' && 'affectedRows' in results) {
        this.logger.debug('MySQL 쿼리 완료 (DML)', {
          affectedRows: results.affectedRows,
          insertId: results.insertId,
          executionTime
        });

        return {
          success: true,
          data: [],
          rowCount: results.affectedRows,
          insertId: results.insertId,
          affectedRows: results.affectedRows,
          executionTime
        };
      }

      // SELECT 결과 처리
      const rows = Array.isArray(results) ? results : [];
      
      this.logger.debug('MySQL 쿼리 완료 (SELECT)', {
        rowCount: rows.length,
        executionTime
      });

      return {
        success: true,
        data: rows,
        rowCount: rows.length,
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'MySQL 쿼리 실행 실패';
      
      this.logger.error('MySQL 쿼리 실행 실패', {
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
   * MySQL 트랜잭션 시작
   */
  async beginTransaction(): Promise<{ success: boolean; connection?: any; error?: string }> {
    try {
      if (!this.pool) {
        throw new Error('MySQL 연결이 설정되지 않았습니다');
      }

      const connection = await this.pool.getConnection();
      await connection.beginTransaction();

      this.logger.debug('MySQL 트랜잭션 시작');

      return {
        success: true,
        connection
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'MySQL 트랜잭션 시작 실패';
      this.logger.error('MySQL 트랜잭션 시작 실패', { error: errorMessage });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * MySQL 트랜잭션 커밋
   */
  async commitTransaction(connection: any): Promise<{ success: boolean; error?: string }> {
    try {
      await connection.commit();
      connection.release();

      this.logger.debug('MySQL 트랜잭션 커밋 완료');

      return {
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'MySQL 트랜잭션 커밋 실패';
      this.logger.error('MySQL 트랜잭션 커밋 실패', { error: errorMessage });

      try {
        await connection.rollback();
        connection.release();
      } catch (rollbackError) {
        this.logger.error('MySQL 트랜잭션 롤백 실패', { error: rollbackError });
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * MySQL 트랜잭션 롤백
   */
  async rollbackTransaction(connection: any): Promise<{ success: boolean; error?: string }> {
    try {
      await connection.rollback();
      connection.release();

      this.logger.debug('MySQL 트랜잭션 롤백 완료');

      return {
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'MySQL 트랜잭션 롤백 실패';
      this.logger.error('MySQL 트랜잭션 롤백 실패', { error: errorMessage });

      try {
        connection.release();
      } catch (releaseError) {
        this.logger.error('MySQL 연결 해제 실패', { error: releaseError });
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * MySQL 연결 풀 상태
   */
  getPoolStats(): {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    queuedConnections: number;
  } {
    if (!this.pool) {
      return {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        queuedConnections: 0
      };
    }

    return {
      totalConnections: this.pool._allConnections?.length || 0,
      activeConnections: this.pool._acquiringConnections?.length || 0,
      idleConnections: this.pool._freeConnections?.length || 0,
      queuedConnections: this.pool._connectionQueue?.length || 0
    };
  }

  /**
   * MySQL 전용 기능들
   */

  /**
   * 테이블 정보 조회
   */
  async getTableInfo(tableName: string): Promise<DatabaseResult> {
    try {
      const sql = `
        SELECT 
          COLUMN_NAME as column_name,
          DATA_TYPE as data_type,
          IS_NULLABLE as is_nullable,
          COLUMN_DEFAULT as column_default,
          COLUMN_KEY as column_key,
          EXTRA as extra
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `;

      const result = await this.query(sql, [this.config.database, tableName]);

      if (!result.success) {
        throw new Error(result.error);
      }

      this.logger.debug(`MySQL 테이블 정보 조회: ${tableName}`, {
        columnCount: result.data?.length || 0
      });

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'MySQL 테이블 정보 조회 실패';
      this.logger.error('MySQL 테이블 정보 조회 실패', { tableName, error: errorMessage });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 인덱스 정보 조회
   */
  async getIndexInfo(tableName: string): Promise<DatabaseResult> {
    try {
      const sql = `
        SELECT 
          INDEX_NAME as index_name,
          COLUMN_NAME as column_name,
          NON_UNIQUE as non_unique,
          SEQ_IN_INDEX as seq_in_index
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
      `;

      const result = await this.query(sql, [this.config.database, tableName]);

      if (!result.success) {
        throw new Error(result.error);
      }

      this.logger.debug(`MySQL 인덱스 정보 조회: ${tableName}`, {
        indexCount: result.data?.length || 0
      });

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'MySQL 인덱스 정보 조회 실패';
      this.logger.error('MySQL 인덱스 정보 조회 실패', { tableName, error: errorMessage });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * JSON 컬럼 쿼리 헬퍼
   */
  buildJsonQuery(column: string, path: string, operator: string, value: any): string {
    const jsonPath = `$.${path}`;
    
    switch (operator) {
      case 'extract':
        return `JSON_EXTRACT(${column}, '${jsonPath}')`;
      case 'unquote':
        return `JSON_UNQUOTE(JSON_EXTRACT(${column}, '${jsonPath}'))`;
      case 'contains':
        return `JSON_CONTAINS(${column}, '${JSON.stringify(value)}', '${jsonPath}')`;
      case 'search':
        return `JSON_SEARCH(${column}, 'one', '${value}', NULL, '${jsonPath}')`;
      default:
        throw new Error(`지원하지 않는 JSON 연산자: ${operator}`);
    }
  }

  /**
   * 전문 검색 쿼리 헬퍼 (FULLTEXT 인덱스 필요)
   */
  buildFullTextSearch(columns: string[], query: string, mode: 'natural' | 'boolean' = 'natural'): string {
    const columnList = Array.isArray(columns) ? columns.join(',') : columns;
    
    switch (mode) {
      case 'natural':
        return `MATCH(${columnList}) AGAINST('${query}')`;
      case 'boolean':
        return `MATCH(${columnList}) AGAINST('${query}' IN BOOLEAN MODE)`;
      default:
        throw new Error(`지원하지 않는 전문 검색 모드: ${mode}`);
    }
  }

  /**
   * 파티션 정보 조회
   */
  async getPartitionInfo(tableName: string): Promise<DatabaseResult> {
    try {
      const sql = `
        SELECT 
          PARTITION_NAME as partition_name,
          PARTITION_ORDINAL_POSITION as partition_position,
          PARTITION_METHOD as partition_method,
          PARTITION_EXPRESSION as partition_expression,
          TABLE_ROWS as table_rows
        FROM INFORMATION_SCHEMA.PARTITIONS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? 
        AND PARTITION_NAME IS NOT NULL
        ORDER BY PARTITION_ORDINAL_POSITION
      `;

      const result = await this.query(sql, [this.config.database, tableName]);

      if (!result.success) {
        throw new Error(result.error);
      }

      this.logger.debug(`MySQL 파티션 정보 조회: ${tableName}`, {
        partitionCount: result.data?.length || 0
      });

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'MySQL 파티션 정보 조회 실패';
      this.logger.error('MySQL 파티션 정보 조회 실패', { tableName, error: errorMessage });

      return {
        success: false,
        error: errorMessage
      };
    }
  }
}