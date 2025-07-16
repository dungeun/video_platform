/**
 * @company/database - Migration Runner
 * 
 * 데이터베이스 마이그레이션을 실행하고 관리하는 클래스
 * Zero Error Architecture 기반으로 설계됨
 */

import { Logger } from '@company/core';
import { QueryBuilder } from '../query/QueryBuilder';
import type {
  Migration,
  MigrationRecord,
  MigrationRunner as IMigrationRunner,
  MigrationResult,
  MigrationStatus,
  MigrationOptions
} from '../types';
import { MigrationError } from '../types';

export class MigrationRunner implements IMigrationRunner {
  private logger = new Logger('MigrationRunner');
  private connection: any;
  private tableName: string;

  constructor(
    connection: any,
    options: MigrationOptions = {}
  ) {
    this.connection = connection;
    this.tableName = options.tableName || 'migrations';
  }

  /**
   * 마이그레이션 실행
   */
  async run(): Promise<MigrationResult> {
    const startTime = Date.now();
    const executed: string[] = [];
    const skipped: string[] = [];

    try {
      this.logger.info('마이그레이션 실행 시작');

      // 마이그레이션 테이블 확인/생성
      await this.ensureMigrationTable();

      // 실행 가능한 마이그레이션 조회
      const status = await this.status();
      const pendingMigrations = status.pending;

      if (pendingMigrations.length === 0) {
        this.logger.info('실행할 마이그레이션이 없습니다');
        return {
          success: true,
          executed: [],
          skipped: [],
          duration: Date.now() - startTime
        };
      }

      this.logger.info(`${pendingMigrations.length}개의 마이그레이션을 실행합니다`);

      // 마이그레이션 순차 실행
      for (const migration of pendingMigrations) {
        try {
          await this.executeMigration(migration, 'up');
          executed.push(migration.name);
          
          this.logger.info(`마이그레이션 실행 완료: ${migration.name}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '마이그레이션 실행 실패';
          this.logger.error(`마이그레이션 실행 실패: ${migration.name}`, { error: errorMessage });
          
          throw new MigrationError(
            `마이그레이션 실행 실패: ${migration.name} - ${errorMessage}`,
            migration.name
          );
        }
      }

      const duration = Date.now() - startTime;
      
      this.logger.info('마이그레이션 실행 완료', { 
        executed: executed.length, 
        duration 
      });

      return {
        success: true,
        executed,
        skipped,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : '마이그레이션 실행 실패';
      
      this.logger.error('마이그레이션 실행 실패', { 
        error: errorMessage, 
        executed, 
        duration 
      });

      return {
        success: false,
        error: errorMessage,
        executed,
        skipped,
        duration
      };
    }
  }

  /**
   * 마이그레이션 롤백
   */
  async rollback(steps: number = 1): Promise<MigrationResult> {
    const startTime = Date.now();
    const executed: string[] = [];
    const skipped: string[] = [];

    try {
      this.logger.info(`마이그레이션 롤백 시작 (${steps}단계)`);

      // 마이그레이션 테이블 확인
      await this.ensureMigrationTable();

      // 롤백할 마이그레이션 조회
      const executedMigrations = await this.getExecutedMigrations();
      const toRollback = executedMigrations
        .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
        .slice(0, steps);

      if (toRollback.length === 0) {
        this.logger.info('롤백할 마이그레이션이 없습니다');
        return {
          success: true,
          executed: [],
          skipped: [],
          duration: Date.now() - startTime
        };
      }

      this.logger.info(`${toRollback.length}개의 마이그레이션을 롤백합니다`);

      // 마이그레이션 롤백 실행
      for (const record of toRollback) {
        try {
          const migration = await this.loadMigration(record.name);
          await this.executeMigration(migration, 'down');
          await this.removeMigrationRecord(record.id);
          
          executed.push(record.name);
          
          this.logger.info(`마이그레이션 롤백 완료: ${record.name}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '마이그레이션 롤백 실패';
          this.logger.error(`마이그레이션 롤백 실패: ${record.name}`, { error: errorMessage });
          
          throw new MigrationError(
            `마이그레이션 롤백 실패: ${record.name} - ${errorMessage}`,
            record.name
          );
        }
      }

      const duration = Date.now() - startTime;
      
      this.logger.info('마이그레이션 롤백 완료', { 
        executed: executed.length, 
        duration 
      });

      return {
        success: true,
        executed,
        skipped,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : '마이그레이션 롤백 실패';
      
      this.logger.error('마이그레이션 롤백 실패', { 
        error: errorMessage, 
        executed, 
        duration 
      });

      return {
        success: false,
        error: errorMessage,
        executed,
        skipped,
        duration
      };
    }
  }

  /**
   * 마이그레이션 상태 조회
   */
  async status(): Promise<MigrationStatus> {
    try {
      this.logger.debug('마이그레이션 상태 조회 시작');

      await this.ensureMigrationTable();

      const [allMigrations, executedRecords] = await Promise.all([
        this.getAllMigrations(),
        this.getExecutedMigrations()
      ]);

      const executedNames = new Set(executedRecords.map(r => r.name));
      const pending = allMigrations.filter(m => !executedNames.has(m.name));
      const current = executedRecords.length > 0 
        ? executedRecords.sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())[0]
        : undefined;

      this.logger.debug('마이그레이션 상태 조회 완료', {
        total: allMigrations.length,
        executed: executedRecords.length,
        pending: pending.length
      });

      return {
        pending,
        executed: executedRecords,
        current
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '마이그레이션 상태 조회 실패';
      this.logger.error('마이그레이션 상태 조회 실패', { error: errorMessage });
      
      throw new MigrationError(`마이그레이션 상태 조회 실패: ${errorMessage}`);
    }
  }

  /**
   * 모든 마이그레이션 초기화 (주의: 모든 데이터가 삭제됨)
   */
  async reset(): Promise<MigrationResult> {
    const startTime = Date.now();

    try {
      this.logger.warn('마이그레이션 초기화 시작 - 모든 마이그레이션이 롤백됩니다');

      const status = await this.status();
      const executedCount = status.executed.length;

      if (executedCount === 0) {
        this.logger.info('초기화할 마이그레이션이 없습니다');
        return {
          success: true,
          executed: [],
          skipped: [],
          duration: Date.now() - startTime
        };
      }

      // 모든 마이그레이션 롤백
      const rollbackResult = await this.rollback(executedCount);

      if (!rollbackResult.success) {
        throw new Error(rollbackResult.error || '마이그레이션 롤백 실패');
      }

      const duration = Date.now() - startTime;
      
      this.logger.warn('마이그레이션 초기화 완료', { 
        rolledBack: rollbackResult.executed.length, 
        duration 
      });

      return {
        success: true,
        executed: rollbackResult.executed,
        skipped: rollbackResult.skipped,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : '마이그레이션 초기화 실패';
      
      this.logger.error('마이그레이션 초기화 실패', { 
        error: errorMessage, 
        duration 
      });

      return {
        success: false,
        error: errorMessage,
        executed: [],
        skipped: [],
        duration
      };
    }
  }

  // ===== Private Methods =====

  private async ensureMigrationTable(): Promise<void> {
    const exists = await this.connection.schema.hasTable(this.tableName);
    
    if (!exists) {
      this.logger.info(`마이그레이션 테이블 생성: ${this.tableName}`);
      
      await this.connection.schema.createTable(this.tableName, (table: any) => {
        table.increments('id').primary();
        table.string('name').notNullable().unique();
        table.integer('batch').notNullable();
        table.timestamp('executed_at').defaultTo(this.connection.fn.now());
      });
    }
  }

  private async getAllMigrations(): Promise<Migration[]> {
    // 실제 구현에서는 파일 시스템에서 마이그레이션 파일들을 읽어와야 함
    // 여기서는 예시용 더미 데이터 반환
    return [
      {
        id: '001',
        name: '001_create_users_table',
        createdAt: new Date('2024-01-01'),
        up: async () => {},
        down: async () => {}
      },
      {
        id: '002',
        name: '002_create_posts_table',
        createdAt: new Date('2024-01-02'),
        up: async () => {},
        down: async () => {}
      }
    ];
  }

  private async getExecutedMigrations(): Promise<MigrationRecord[]> {
    const queryBuilder = new QueryBuilder(this.connection);
    const result = await queryBuilder
      .select()
      .from(this.tableName)
      .orderBy('executed_at', 'DESC')
      .execute<{
        id: string;
        name: string;
        batch: number;
        executed_at: string;
      }>();

    if (!result.success || !result.data) {
      return [];
    }

    return result.data.map(row => ({
      id: row.id,
      name: row.name,
      batch: row.batch,
      executedAt: new Date(row.executed_at)
    }));
  }

  private async loadMigration(name: string): Promise<Migration> {
    // 실제 구현에서는 파일 시스템에서 마이그레이션 파일을 로드해야 함
    // 여기서는 예시용 더미 마이그레이션 반환
    return {
      id: name,
      name,
      createdAt: new Date(),
      up: async () => {
        this.logger.debug(`마이그레이션 UP 실행: ${name}`);
      },
      down: async () => {
        this.logger.debug(`마이그레이션 DOWN 실행: ${name}`);
      }
    };
  }

  private async executeMigration(migration: Migration, direction: 'up' | 'down'): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`마이그레이션 ${direction.toUpperCase()} 시작: ${migration.name}`);
      
      if (direction === 'up') {
        await migration.up();
        await this.addMigrationRecord(migration);
      } else {
        await migration.down();
      }
      
      const duration = Date.now() - startTime;
      
      this.logger.debug(`마이그레이션 ${direction.toUpperCase()} 완료: ${migration.name}`, { duration });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '마이그레이션 실행 실패';
      this.logger.error(`마이그레이션 ${direction.toUpperCase()} 실패: ${migration.name}`, { error: errorMessage });
      
      throw new MigrationError(
        `마이그레이션 ${direction.toUpperCase()} 실패: ${migration.name} - ${errorMessage}`,
        migration.name
      );
    }
  }

  private async addMigrationRecord(migration: Migration): Promise<void> {
    const latestBatch = await this.getLatestBatch();
    const queryBuilder = new QueryBuilder(this.connection);
    
    const result = await queryBuilder
      .insert({
        name: migration.name,
        batch: latestBatch + 1,
        executed_at: new Date()
      })
      .from(this.tableName)
      .execute();

    if (!result.success) {
      throw new Error(result.error || '마이그레이션 기록 추가 실패');
    }
  }

  private async removeMigrationRecord(id: string): Promise<void> {
    const queryBuilder = new QueryBuilder(this.connection);
    
    const result = await queryBuilder
      .delete()
      .from(this.tableName)
      .where('id', '=', id)
      .execute();

    if (!result.success) {
      throw new Error(result.error || '마이그레이션 기록 삭제 실패');
    }
  }

  private async getLatestBatch(): Promise<number> {
    const queryBuilder = new QueryBuilder(this.connection);
    
    const result = await queryBuilder
      .select('batch')
      .from(this.tableName)
      .orderBy('batch', 'DESC')
      .limit(1)
      .execute<{ batch: number }>();

    if (!result.success || !result.data || result.data.length === 0) {
      return 0;
    }

    return result.data[0]!.batch;
  }
}