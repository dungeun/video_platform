import { Result } from '@company/core';
import { StorageProvider } from '../types';
export interface BackupConfig {
    format?: 'json' | 'binary' | 'compressed';
    includeMetadata?: boolean;
    compress?: boolean;
    encrypt?: boolean;
    password?: string;
}
export interface BackupMetadata {
    version: string;
    createdAt: Date;
    provider: string;
    itemCount: number;
    totalSize: number;
    namespaces: string[];
    compressed: boolean;
    encrypted: boolean;
}
export interface BackupData {
    metadata: BackupMetadata;
    data: any;
    checksum?: string;
}
export interface RestoreOptions {
    overwrite?: boolean;
    skipErrors?: boolean;
    namespaceMapping?: Map<string, string>;
    filter?: (key: string, value: any) => boolean;
}
export interface RestoreResult {
    restored: number;
    skipped: number;
    errors: string[];
    duration: number;
}
export declare class BackupRestore {
    private version;
    /**
     * 전체 백업 생성
     */
    createBackup(provider: StorageProvider, config?: BackupConfig): Promise<Result<BackupData>>;
    /**
     * 부분 백업 생성
     */
    createPartialBackup(provider: StorageProvider, filter: (key: string, value: any) => boolean, config?: BackupConfig): Promise<Result<BackupData>>;
    /**
     * 백업 복원
     */
    restoreBackup(provider: StorageProvider, backup: BackupData, options?: RestoreOptions): Promise<Result<RestoreResult>>;
    /**
     * 백업 파일로 내보내기
     */
    exportToFile(backup: BackupData): Promise<Result<Blob>>;
    /**
     * 백업 파일에서 가져오기
     */
    importFromFile(file: File): Promise<Result<BackupData>>;
    /**
     * 백업 다운로드
     */
    downloadBackup(backup: BackupData, filename?: string): Result<void>;
    /**
     * 스케줄 백업
     */
    scheduleBackup(provider: StorageProvider, interval: number, onBackup: (backup: BackupData) => void, config?: BackupConfig): {
        stop: () => void;
    };
    /**
     * 백업 압축
     */
    private compressBackup;
    /**
     * 백업 암호화
     */
    private encryptBackup;
    /**
     * 체크섬 생성
     */
    private generateChecksum;
    /**
     * 체크섬 검증
     */
    private verifyChecksum;
    /**
     * 버전 호환성 검사
     */
    private isVersionCompatible;
    /**
     * 데이터 크기 계산
     */
    private calculateSize;
    /**
     * 백업 정보 조회
     */
    getBackupInfo(backup: BackupData): {
        version: string;
        created: string;
        itemCount: number;
        size: string;
        namespaces: string[];
        features: string[];
    };
    /**
     * 바이트 포맷팅
     */
    private formatBytes;
}
export declare const defaultBackupRestore: BackupRestore;
//# sourceMappingURL=BackupRestore.d.ts.map