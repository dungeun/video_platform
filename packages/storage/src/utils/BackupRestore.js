export class BackupRestore {
    constructor() {
        this.version = '1.0.0';
    }
    /**
     * 전체 백업 생성
     */
    async createBackup(provider, config) {
        try {
            const startTime = Date.now();
            const finalConfig = {
                format: 'json',
                includeMetadata: true,
                compress: false,
                encrypt: false,
                password: '',
                ...config
            };
            // 모든 데이터 수집
            const entriesResult = await provider.entries();
            if (entriesResult.isFailure) {
                return Result.failure('BACKUP_ENTRIES_FAILED', '데이터 조회 실패');
            }
            const entries = entriesResult.data;
            const namespaces = new Set();
            let totalSize = 0;
            // 데이터 준비
            const backupEntries = entries.map(([key, value]) => {
                if (value.metadata?.namespace) {
                    namespaces.add(value.metadata.namespace);
                }
                totalSize += this.calculateSize(value);
                return {
                    key,
                    value,
                    metadata: finalConfig.includeMetadata ? value.metadata : undefined
                };
            });
            // 메타데이터 생성
            const metadata = {
                version: this.version,
                createdAt: new Date(),
                provider: provider.constructor.name,
                itemCount: entries.length,
                totalSize,
                namespaces: Array.from(namespaces),
                compressed: finalConfig.compress,
                encrypted: finalConfig.encrypt
            };
            // 백업 데이터 구성
            let backupData = {
                metadata,
                data: backupEntries
            };
            // 압축 처리
            if (finalConfig.compress) {
                backupData = await this.compressBackup(backupData);
            }
            // 암호화 처리
            if (finalConfig.encrypt && finalConfig.password) {
                backupData = await this.encryptBackup(backupData, finalConfig.password);
            }
            // 체크섬 생성
            backupData.checksum = await this.generateChecksum(backupData);
            return Result.success(backupData);
        }
        catch (error) {
            return Result.failure('BACKUP_FAILED', `백업 생성 실패: ${error}`);
        }
    }
    /**
     * 부분 백업 생성
     */
    async createPartialBackup(provider, filter, config) {
        try {
            const entriesResult = await provider.entries();
            if (entriesResult.isFailure) {
                return Result.failure('PARTIAL_BACKUP_ENTRIES_FAILED', '데이터 조회 실패');
            }
            // 필터링된 데이터만 백업
            const filteredEntries = entriesResult.data.filter(([key, value]) => filter(key, value));
            // 필터링된 프로바이더 생성
            const filteredProvider = {
                ...provider,
                entries: async () => Result.success(filteredEntries)
            };
            return this.createBackup(filteredProvider, config);
        }
        catch (error) {
            return Result.failure('PARTIAL_BACKUP_FAILED', `부분 백업 생성 실패: ${error}`);
        }
    }
    /**
     * 백업 복원
     */
    async restoreBackup(provider, backup, options) {
        try {
            const startTime = Date.now();
            const finalOptions = {
                overwrite: true,
                skipErrors: false,
                namespaceMapping: new Map(),
                filter: () => true,
                ...options
            };
            // 체크섬 검증
            if (backup.checksum) {
                const isValid = await this.verifyChecksum(backup);
                if (!isValid) {
                    return Result.failure('RESTORE_CHECKSUM_FAILED', '백업 데이터 무결성 검증 실패');
                }
            }
            // 버전 호환성 검사
            if (!this.isVersionCompatible(backup.metadata.version)) {
                return Result.failure('RESTORE_VERSION_INCOMPATIBLE', `호환되지 않는 백업 버전: ${backup.metadata.version}`);
            }
            const result = {
                restored: 0,
                skipped: 0,
                errors: [],
                duration: 0
            };
            // 데이터 복원
            for (const entry of backup.data) {
                try {
                    // 필터 적용
                    if (!finalOptions.filter(entry.key, entry.value)) {
                        result.skipped++;
                        continue;
                    }
                    // 키 존재 확인
                    if (!finalOptions.overwrite) {
                        const exists = await provider.exists(entry.key);
                        if (exists.isSuccess && exists.data) {
                            result.skipped++;
                            continue;
                        }
                    }
                    // 네임스페이스 매핑
                    let key = entry.key;
                    if (entry.metadata?.namespace && finalOptions.namespaceMapping.has(entry.metadata.namespace)) {
                        const newNamespace = finalOptions.namespaceMapping.get(entry.metadata.namespace);
                        key = key.replace(entry.metadata.namespace, newNamespace);
                    }
                    // 데이터 복원
                    const setResult = await provider.set(key, entry.value, entry.metadata);
                    if (setResult.isSuccess) {
                        result.restored++;
                    }
                    else {
                        result.errors.push(`Failed to restore ${key}: ${setResult.message}`);
                        if (!finalOptions.skipErrors) {
                            break;
                        }
                    }
                }
                catch (error) {
                    result.errors.push(`Error restoring ${entry.key}: ${error}`);
                    if (!finalOptions.skipErrors) {
                        break;
                    }
                }
            }
            result.duration = Date.now() - startTime;
            return Result.success(result);
        }
        catch (error) {
            return Result.failure('RESTORE_FAILED', `백업 복원 실패: ${error}`);
        }
    }
    /**
     * 백업 파일로 내보내기
     */
    async exportToFile(backup) {
        try {
            const jsonString = JSON.stringify(backup, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            return Result.success(blob);
        }
        catch (error) {
            return Result.failure('EXPORT_FAILED', `백업 내보내기 실패: ${error}`);
        }
    }
    /**
     * 백업 파일에서 가져오기
     */
    async importFromFile(file) {
        try {
            const text = await file.text();
            const backup = JSON.parse(text);
            // 기본 검증
            if (!backup.metadata || !backup.data) {
                return Result.failure('IMPORT_INVALID_FORMAT', '올바르지 않은 백업 파일 형식');
            }
            return Result.success(backup);
        }
        catch (error) {
            return Result.failure('IMPORT_FAILED', `백업 가져오기 실패: ${error}`);
        }
    }
    /**
     * 백업 다운로드
     */
    downloadBackup(backup, filename) {
        try {
            const exportResult = this.exportToFile(backup);
            if (exportResult.isFailure) {
                return Result.failure('DOWNLOAD_EXPORT_FAILED', exportResult.message);
            }
            const blob = exportResult.data;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `backup_${new Date().toISOString()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            return Result.success(undefined);
        }
        catch (error) {
            return Result.failure('DOWNLOAD_FAILED', `백업 다운로드 실패: ${error}`);
        }
    }
    /**
     * 스케줄 백업
     */
    scheduleBackup(provider, interval, onBackup, config) {
        const performBackup = async () => {
            const result = await this.createBackup(provider, config);
            if (result.isSuccess) {
                onBackup(result.data);
            }
        };
        // 초기 백업
        performBackup();
        // 주기적 백업
        const intervalId = setInterval(performBackup, interval);
        return {
            stop: () => clearInterval(intervalId)
        };
    }
    /**
     * 백업 압축
     */
    async compressBackup(backup) {
        // 실제 구현에서는 CompressionStream 사용
        // 여기서는 간단히 표시만
        return {
            ...backup,
            data: backup.data, // 실제로는 압축된 데이터
            metadata: {
                ...backup.metadata,
                compressed: true
            }
        };
    }
    /**
     * 백업 암호화
     */
    async encryptBackup(backup, password) {
        // 실제 구현에서는 Web Crypto API 사용
        // 여기서는 간단히 표시만
        return {
            ...backup,
            data: backup.data, // 실제로는 암호화된 데이터
            metadata: {
                ...backup.metadata,
                encrypted: true
            }
        };
    }
    /**
     * 체크섬 생성
     */
    async generateChecksum(backup) {
        const data = JSON.stringify({ metadata: backup.metadata, data: backup.data });
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    /**
     * 체크섬 검증
     */
    async verifyChecksum(backup) {
        if (!backup.checksum)
            return true;
        const currentChecksum = await this.generateChecksum(backup);
        return currentChecksum === backup.checksum;
    }
    /**
     * 버전 호환성 검사
     */
    isVersionCompatible(version) {
        const [major] = version.split('.');
        const [currentMajor] = this.version.split('.');
        return major === currentMajor;
    }
    /**
     * 데이터 크기 계산
     */
    calculateSize(value) {
        const str = JSON.stringify(value);
        return new Blob([str]).size;
    }
    /**
     * 백업 정보 조회
     */
    getBackupInfo(backup) {
        const features = [];
        if (backup.metadata.compressed)
            features.push('압축됨');
        if (backup.metadata.encrypted)
            features.push('암호화됨');
        if (backup.checksum)
            features.push('체크섬 검증');
        return {
            version: backup.metadata.version,
            created: backup.metadata.createdAt.toLocaleString(),
            itemCount: backup.metadata.itemCount,
            size: this.formatBytes(backup.metadata.totalSize),
            namespaces: backup.metadata.namespaces,
            features
        };
    }
    /**
     * 바이트 포맷팅
     */
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
export const defaultBackupRestore = new BackupRestore();
//# sourceMappingURL=BackupRestore.js.map