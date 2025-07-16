/**
 * @company/database - Migration Runner
 *
 * 데이터베이스 마이그레이션을 실행하고 관리하는 클래스
 * Zero Error Architecture 기반으로 설계됨
 */
import type { MigrationRunner as IMigrationRunner, MigrationResult, MigrationStatus, MigrationOptions } from '../types';
export declare class MigrationRunner implements IMigrationRunner {
    private logger;
    private connection;
    private tableName;
    constructor(connection: any, options?: MigrationOptions);
    /**
     * 마이그레이션 실행
     */
    run(): Promise<MigrationResult>;
    /**
     * 마이그레이션 롤백
     */
    rollback(steps?: number): Promise<MigrationResult>;
    /**
     * 마이그레이션 상태 조회
     */
    status(): Promise<MigrationStatus>;
    /**
     * 모든 마이그레이션 초기화 (주의: 모든 데이터가 삭제됨)
     */
    reset(): Promise<MigrationResult>;
    private ensureMigrationTable;
    private getAllMigrations;
    private getExecutedMigrations;
    private loadMigration;
    private executeMigration;
    private addMigrationRecord;
    private removeMigrationRecord;
    private getLatestBatch;
}
//# sourceMappingURL=MigrationRunner.d.ts.map