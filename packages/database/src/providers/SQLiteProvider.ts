/**
 * @company/database - SQLite Provider
 * 
 * SQLite 데이터베이스 전용 프로바이더
 * Zero Error Architecture 기반으로 설계됨
 */

import { Logger } from '@company/core';
import type { DatabaseConfig, DatabaseResult, QueryResult } from '../types';

export class SQLiteProvider {
  private logger = new Logger('SQLiteProvider');
  private db: any;

  constructor(private config: DatabaseConfig) {
    if (config.provider !== 'sqlite') {
      throw new Error('SQLite 프로바이더는 SQLite 설정만 지원합니다');
    }
  }

  /**
   * SQLite 연결 설정
   */
  async connect(): Promise<DatabaseResult> {
    try {
      const sqlite3 = require('sqlite3').verbose();
      const { open } = require('sqlite');
      
      this.db = await open({
        filename: this.config.filename || this.config.database,
        driver: sqlite3.Database
      });

      // 연결 테스트 및 설정
      await this.db.exec('PRAGMA journal_mode = WAL');
      await this.db.exec('PRAGMA foreign_keys = ON');
      await this.db.get('SELECT 1');

      this.logger.info('SQLite 연결 성공', {
        filename: this.config.filename || this.config.database
      });

      return {
        success: true,
        data: { provider: 'sqlite', database: this.config.database }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SQLite 연결 실패';
      this.logger.error('SQLite 연결 실패', { error: errorMessage });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * SQLite 연결 해제
   */
  async disconnect(): Promise<DatabaseResult> {
    try {
      if (this.db) {
        await this.db.close();
        this.db = null;
      }

      this.logger.info('SQLite 연결 해제 완료');

      return {
        success: true,
        data: { disconnected: true }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SQLite 연결 해제 실패';
      this.logger.error('SQLite 연결 해제 실패', { error: errorMessage });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * SQLite 쿼리 실행
   */
  async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    const startTime = Date.now();

    try {
      if (!this.db) {
        throw new Error('SQLite 연결이 설정되지 않았습니다');
      }

      this.logger.debug('SQLite 쿼리 실행', { sql, params });

      const trimmedSql = sql.trim().toUpperCase();
      
      if (trimmedSql.startsWith('SELECT') || trimmedSql.startsWith('WITH')) {
        // SELECT 쿼리
        const results = await this.db.all(sql, params);
        const executionTime = Date.now() - startTime;

        this.logger.debug('SQLite SELECT 쿼리 완료', {
          rowCount: results.length,
          executionTime
        });

        return {
          success: true,
          data: results,
          rowCount: results.length,
          executionTime
        };
      } else {
        // INSERT/UPDATE/DELETE 쿼리
        const result = await this.db.run(sql, params);
        const executionTime = Date.now() - startTime;

        this.logger.debug('SQLite DML 쿼리 완료', {
          changes: result.changes,
          lastID: result.lastID,
          executionTime
        });

        return {
          success: true,
          data: [],
          rowCount: result.changes,
          insertId: result.lastID,
          affectedRows: result.changes,
          executionTime
        };
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'SQLite 쿼리 실행 실패';
      
      this.logger.error('SQLite 쿼리 실행 실패', {
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
   * SQLite 트랜잭션 시작
   */
  async beginTransaction(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.db) {
        throw new Error('SQLite 연결이 설정되지 않았습니다');
      }

      await this.db.exec('BEGIN TRANSACTION');

      this.logger.debug('SQLite 트랜잭션 시작');

      return {
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SQLite 트랜잭션 시작 실패';
      this.logger.error('SQLite 트랜잭션 시작 실패', { error: errorMessage });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * SQLite 트랜잭션 커밋
   */
  async commitTransaction(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.db.exec('COMMIT');

      this.logger.debug('SQLite 트랜잭션 커밋 완료');

      return {
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SQLite 트랜잭션 커밋 실패';
      this.logger.error('SQLite 트랜잭션 커밋 실패', { error: errorMessage });

      try {
        await this.db.exec('ROLLBACK');
      } catch (rollbackError) {
        this.logger.error('SQLite 트랜잭션 롤백 실패', { error: rollbackError });
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * SQLite 트랜잭션 롤백
   */
  async rollbackTransaction(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.db.exec('ROLLBACK');

      this.logger.debug('SQLite 트랜잭션 롤백 완료');

      return {
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SQLite 트랜잭션 롤백 실패';
      this.logger.error('SQLite 트랜잭션 롤백 실패', { error: errorMessage });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * SQLite 데이터베이스 상태
   */
  async getDatabaseStats(): Promise<DatabaseResult> {
    try {
      const [pragma, tables] = await Promise.all([
        this.query('PRAGMA database_list'),
        this.query("SELECT name FROM sqlite_master WHERE type='table'")
      ]);

      if (!pragma.success || !tables.success) {
        throw new Error('데이터베이스 상태 조회 실패');
      }

      return {
        success: true,
        data: {
          databases: pragma.data,
          tables: tables.data,
          tableCount: tables.data?.length || 0
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SQLite 상태 조회 실패';
      this.logger.error('SQLite 상태 조회 실패', { error: errorMessage });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * SQLite 전용 기능들
   */

  /**
   * VACUUM 실행 (데이터베이스 최적화)
   */
  async vacuum(): Promise<DatabaseResult> {
    try {
      await this.db.exec('VACUUM');

      this.logger.info('SQLite VACUUM 완료');

      return {
        success: true,
        data: { vacuumed: true }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SQLite VACUUM 실패';
      this.logger.error('SQLite VACUUM 실패', { error: errorMessage });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * ANALYZE 실행 (통계 수집)
   */
  async analyze(tableName?: string): Promise<DatabaseResult> {
    try {
      const sql = tableName ? `ANALYZE ${tableName}` : 'ANALYZE';
      await this.db.exec(sql);

      this.logger.info('SQLite ANALYZE 완료', { tableName });

      return {
        success: true,
        data: { analyzed: true, tableName }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SQLite ANALYZE 실패';
      this.logger.error('SQLite ANALYZE 실패', { tableName, error: errorMessage });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 테이블 정보 조회
   */
  async getTableInfo(tableName: string): Promise<DatabaseResult> {
    try {
      const result = await this.query(`PRAGMA table_info(${tableName})`);

      if (!result.success) {
        throw new Error(result.error);
      }

      this.logger.debug(`SQLite 테이블 정보 조회: ${tableName}`, {
        columnCount: result.data?.length || 0
      });

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SQLite 테이블 정보 조회 실패';
      this.logger.error('SQLite 테이블 정보 조회 실패', { tableName, error: errorMessage });

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
      const result = await this.query(`PRAGMA index_list(${tableName})`);

      if (!result.success) {
        throw new Error(result.error);
      }

      this.logger.debug(`SQLite 인덱스 정보 조회: ${tableName}`, {
        indexCount: result.data?.length || 0
      });

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SQLite 인덱스 정보 조회 실패';
      this.logger.error('SQLite 인덱스 정보 조회 실패', { tableName, error: errorMessage });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * JSON1 확장 쿼리 헬퍼
   */
  buildJsonQuery(column: string, path: string, value?: any): string {
    if (value !== undefined) {
      return `json_extract(${column}, '$.${path}') = '${value}'`;
    }
    return `json_extract(${column}, '$.${path}')`;
  }

  /**
   * FTS (Full Text Search) 헬퍼
   */
  buildFTSQuery(ftsTable: string, column: string, query: string): string {
    return `SELECT * FROM ${ftsTable} WHERE ${column} MATCH '${query}'`;
  }

  /**
   * 데이터베이스 백업
   */
  async backup(backupPath: string): Promise<DatabaseResult> {
    try {
      if (!this.db) {
        throw new Error('SQLite 연결이 설정되지 않았습니다');
      }

      await this.db.backup(backupPath);

      this.logger.info('SQLite 백업 완료', { backupPath });

      return {
        success: true,
        data: { backupPath, backed_up: true }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SQLite 백업 실패';
      this.logger.error('SQLite 백업 실패', { backupPath, error: errorMessage });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 데이터베이스 파일 크기 조회
   */
  async getDatabaseSize(): Promise<DatabaseResult> {
    try {
      const fs = require('fs').promises;
      const stats = await fs.stat(this.config.filename || this.config.database);

      return {
        success: true,
        data: {
          size: stats.size,
          sizeFormatted: this.formatBytes(stats.size),
          modified: stats.mtime
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SQLite 파일 크기 조회 실패';
      this.logger.error('SQLite 파일 크기 조회 실패', { error: errorMessage });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // ===== Private Methods =====

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}