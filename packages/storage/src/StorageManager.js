/**
 * @repo/storage - 스토리지 매니저
 * 여러 스토리지 프로바이더를 통합 관리
 */
import { ModuleBase } from '@repo/core';
import { StorageType, StorageEventType } from './types';
import { LocalStorageProvider } from './providers/LocalStorageProvider';
import { SessionStorageProvider } from './providers/SessionStorageProvider';
import { MemoryStorageProvider } from './providers/MemoryStorageProvider';
export class StorageManager extends ModuleBase {
    constructor(config) {
        super({
            name: '@repo/storage',
            version: '1.0.0',
            description: 'Enterprise Storage Manager'
        });
        this.providers = new Map();
        this.listeners = new Set();
        this.storageConfig = {
            defaultProvider: StorageType.LOCAL,
            autoCleanup: true,
            cleanupInterval: 60000, // 1분
            ...config
        };
        this.defaultProvider = this.storageConfig.defaultProvider;
        this.initializeProviders();
    }
    // ===== 라이프사이클 메소드 =====
    async onInitialize() {
        try {
            // 각 프로바이더 초기화
            for (const [type, provider] of this.providers) {
                if (provider.initialize) {
                    const result = await provider.initialize();
                    if (!result.success) {
                        this.logger.warn(`프로바이더 초기화 실패: ${type}`, result.error);
                    }
                }
            }
            // 자동 정리 설정
            if (this.storageConfig.autoCleanup) {
                this.startAutoCleanup();
            }
            this.logger.info('스토리지 매니저 초기화 완료');
            return { success: true };
        }
        catch (error) {
            const storageError = this.errorHandler.handle(error, '스토리지 매니저 초기화 실패');
            return { success: false, error: storageError };
        }
    }
    async onDestroy() {
        try {
            // 자동 정리 중지
            this.stopAutoCleanup();
            // 각 프로바이더 종료
            for (const [type, provider] of this.providers) {
                if (provider.destroy) {
                    await provider.destroy();
                }
            }
            this.providers.clear();
            this.listeners.clear();
            return { success: true };
        }
        catch (error) {
            const storageError = this.errorHandler.handle(error, '스토리지 매니저 종료 실패');
            return { success: false, error: storageError };
        }
    }
    async healthCheck() {
        try {
            // 기본 프로바이더가 사용 가능한지 확인
            const provider = this.getProvider(this.defaultProvider);
            return { success: true, data: provider.isAvailable };
        }
        catch {
            return { success: true, data: false };
        }
    }
    // ===== 기본 작업 =====
    /**
     * 값 조회
     */
    async get(key, provider) {
        const storageProvider = this.getProvider(provider);
        const result = await storageProvider.get(key);
        return result;
    }
    /**
     * 값 저장
     */
    async set(key, value, options) {
        const provider = options?.provider;
        const storageProvider = this.getProvider(provider);
        // 이전 값 조회 (이벤트용)
        const oldValueResult = await storageProvider.get(key);
        const oldValue = oldValueResult.success && oldValueResult.data !== null ? oldValueResult.data : undefined;
        const result = await storageProvider.set(key, value, options);
        if (result.success) {
            const event = {
                type: StorageEventType.SET,
                key,
                newValue: value,
                timestamp: Date.now()
            };
            if (oldValue !== undefined) {
                event.oldValue = oldValue;
            }
            if (options?.namespace !== undefined) {
                event.namespace = options.namespace;
            }
            this.emitEvent(event);
        }
        return result;
    }
    /**
     * 값 삭제
     */
    async delete(key, provider) {
        const storageProvider = this.getProvider(provider);
        // 삭제 전 값 조회 (이벤트용)
        const oldValueResult = await storageProvider.get(key);
        const oldValue = oldValueResult.success ? oldValueResult.data : undefined;
        const result = await storageProvider.delete(key);
        if (result.success) {
            this.emitEvent({
                type: StorageEventType.DELETE,
                key,
                oldValue,
                timestamp: Date.now()
            });
        }
        return result;
    }
    /**
     * 키 존재 여부 확인
     */
    async exists(key, provider) {
        const storageProvider = this.getProvider(provider);
        return storageProvider.exists(key);
    }
    // ===== 배치 작업 =====
    /**
     * 여러 값 조회
     */
    async getMany(keys, provider) {
        const storageProvider = this.getProvider(provider);
        return storageProvider.getMany(keys);
    }
    /**
     * 여러 값 저장
     */
    async setMany(entries, options) {
        const provider = options?.provider;
        const storageProvider = this.getProvider(provider);
        return storageProvider.setMany(entries, options);
    }
    /**
     * 여러 값 삭제
     */
    async deleteMany(keys, provider) {
        const storageProvider = this.getProvider(provider);
        return storageProvider.deleteMany(keys);
    }
    // ===== 쿼리 작업 =====
    /**
     * 키 목록 조회
     */
    async keys(query) {
        const provider = query?.provider;
        const storageProvider = this.getProvider(provider);
        return storageProvider.keys(query);
    }
    /**
     * 값 목록 조회
     */
    async values(query) {
        const provider = query?.provider;
        const storageProvider = this.getProvider(provider);
        return storageProvider.values(query);
    }
    /**
     * 키-값 쌍 목록 조회
     */
    async entries(query) {
        const provider = query?.provider;
        const storageProvider = this.getProvider(provider);
        return storageProvider.entries(query);
    }
    // ===== 유틸리티 =====
    /**
     * 스토리지 초기화
     */
    async clear(namespace, provider) {
        if (provider) {
            const storageProvider = this.getProvider(provider);
            const result = await storageProvider.clear(namespace);
            if (result.success) {
                const event = {
                    type: StorageEventType.CLEAR,
                    key: '',
                    timestamp: Date.now()
                };
                if (namespace !== undefined) {
                    event.namespace = namespace;
                }
                this.emitEvent(event);
            }
            return result;
        }
        // 모든 프로바이더 초기화
        for (const storageProvider of this.providers.values()) {
            const result = await storageProvider.clear(namespace);
            if (!result.success) {
                return result;
            }
        }
        const event = {
            type: StorageEventType.CLEAR,
            key: '',
            timestamp: Date.now()
        };
        if (namespace !== undefined) {
            event.namespace = namespace;
        }
        this.emitEvent(event);
        return { success: true };
    }
    /**
     * 스토리지 크기 조회
     */
    async size(namespace, provider) {
        if (provider) {
            const storageProvider = this.getProvider(provider);
            return storageProvider.size(namespace);
        }
        // 모든 프로바이더의 크기 합계
        let totalSize = 0;
        for (const storageProvider of this.providers.values()) {
            const result = await storageProvider.size(namespace);
            if (result.success && result.data) {
                totalSize += result.data;
            }
        }
        return { success: true, data: totalSize };
    }
    // ===== 프로바이더 관리 =====
    /**
     * 프로바이더 추가
     */
    addProvider(type, provider) {
        this.providers.set(type, provider);
        this.logger.info('프로바이더 추가', { type, name: provider.name });
    }
    /**
     * 프로바이더 제거
     */
    removeProvider(type) {
        this.providers.delete(type);
        this.logger.info('프로바이더 제거', { type });
    }
    /**
     * 프로바이더 조회
     */
    getProvider(type) {
        const targetType = type || this.defaultProvider;
        const provider = this.providers.get(targetType);
        if (!provider) {
            throw new Error(`프로바이더를 찾을 수 없습니다: ${targetType}`);
        }
        if (!provider.isAvailable) {
            throw new Error(`프로바이더를 사용할 수 없습니다: ${targetType}`);
        }
        return provider;
    }
    /**
     * 사용 가능한 프로바이더 목록
     */
    getAvailableProviders() {
        return Array.from(this.providers.entries())
            .filter(([_, provider]) => provider.isAvailable)
            .map(([type, _]) => type);
    }
    /**
     * 기본 프로바이더 설정
     */
    setDefaultProvider(type) {
        if (!this.providers.has(type)) {
            throw new Error(`프로바이더를 찾을 수 없습니다: ${type}`);
        }
        this.defaultProvider = type;
        this.logger.info('기본 프로바이더 변경', { type });
    }
    // ===== 이벤트 관리 =====
    /**
     * 이벤트 리스너 추가
     */
    addEventListener(listener) {
        this.listeners.add(listener);
        // 제거 함수 반환
        return () => {
            this.listeners.delete(listener);
        };
    }
    /**
     * 이벤트 리스너 제거
     */
    removeEventListener(listener) {
        this.listeners.delete(listener);
    }
    /**
     * 이벤트 발행
     */
    emitEvent(event) {
        for (const listener of this.listeners) {
            try {
                listener(event);
            }
            catch (error) {
                this.logger.error('이벤트 리스너 실행 중 오류', error);
            }
        }
    }
    // ===== 통계 및 모니터링 =====
    /**
     * 스토리지 통계 조회
     */
    async getStats(provider) {
        const stats = [];
        if (provider) {
            const storageProvider = this.getProvider(provider);
            const stat = await this.getProviderStats(provider, storageProvider);
            stats.push(stat);
        }
        else {
            for (const [type, storageProvider] of this.providers) {
                if (storageProvider.isAvailable) {
                    const stat = await this.getProviderStats(type, storageProvider);
                    stats.push(stat);
                }
            }
        }
        return stats;
    }
    /**
     * 개별 프로바이더 통계
     */
    async getProviderStats(type, provider) {
        const sizeResult = await provider.size();
        const keysResult = await provider.keys();
        const stats = {
            provider: provider.name,
            type,
            totalSize: provider.capacity || 0,
            usedSize: sizeResult.success ? sizeResult.data : 0,
            availableSize: provider.capacity ?
                provider.capacity - (sizeResult.success ? sizeResult.data : 0) : 0,
            itemCount: keysResult.success ? keysResult.data.length : 0,
            namespaces: [] // 프로바이더별 구현 필요
        };
        return stats;
    }
    // ===== 내부 메소드 =====
    /**
     * 프로바이더 초기화
     */
    initializeProviders() {
        // LocalStorage
        this.providers.set(StorageType.LOCAL, new LocalStorageProvider(this.storageConfig.providers?.local));
        // SessionStorage
        this.providers.set(StorageType.SESSION, new SessionStorageProvider(this.storageConfig.providers?.session));
        // MemoryStorage
        this.providers.set(StorageType.MEMORY, new MemoryStorageProvider(this.storageConfig.providers?.memory));
    }
    /**
     * 자동 정리 시작
     */
    startAutoCleanup() {
        this.cleanupInterval = setInterval(async () => {
            for (const [type, provider] of this.providers) {
                if (provider.isAvailable && 'cleanup' in provider) {
                    try {
                        const cleaned = await provider.cleanup();
                        if (cleaned > 0) {
                            this.logger.debug('자동 정리 완료', { type, cleaned });
                        }
                    }
                    catch (error) {
                        this.logger.error('자동 정리 중 오류', { type, error });
                    }
                }
            }
        }, this.storageConfig.cleanupInterval);
    }
    /**
     * 자동 정리 중지
     */
    stopAutoCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }
    }
    // ===== 편의 메소드 =====
    /**
     * 로컬 스토리지 직접 접근
     */
    get local() {
        return this.getProvider(StorageType.LOCAL);
    }
    /**
     * 세션 스토리지 직접 접근
     */
    get session() {
        return this.getProvider(StorageType.SESSION);
    }
    /**
     * 메모리 스토리지 직접 접근
     */
    get memory() {
        return this.getProvider(StorageType.MEMORY);
    }
}
//# sourceMappingURL=StorageManager.js.map