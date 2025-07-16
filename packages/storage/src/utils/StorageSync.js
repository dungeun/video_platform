export class StorageSync {
    constructor(config) {
        this.syncInterval = null;
        this.state = {
            lastSync: new Date(0),
            inProgress: false,
            totalSynced: 0,
            totalConflicts: 0
        };
        this.config = {
            interval: 5 * 60 * 1000, // 기본 5분
            strategy: 'newest-wins',
            batchSize: 100,
            conflictResolver: this.defaultConflictResolver.bind(this),
            ...config
        };
    }
    /**
     * 단방향 동기화 (source → target)
     */
    async syncOneWay(source, target, filter) {
        if (this.state.inProgress) {
            return Result.failure('SYNC_IN_PROGRESS', '동기화가 이미 진행 중입니다');
        }
        this.state.inProgress = true;
        const startTime = Date.now();
        const result = {
            synced: 0,
            conflicts: 0,
            errors: [],
            duration: 0
        };
        try {
            const keysResult = await source.keys();
            if (keysResult.isFailure) {
                return Result.failure('SYNC_SOURCE_ERROR', '소스 키 목록 조회 실패');
            }
            const keys = keysResult.data;
            // 배치 처리
            for (let i = 0; i < keys.length; i += this.config.batchSize) {
                const batch = keys.slice(i, i + this.config.batchSize);
                await Promise.all(batch.map(async (key) => {
                    try {
                        const sourceResult = await source.get(key);
                        if (sourceResult.isSuccess && sourceResult.data !== null) {
                            // 필터 적용
                            if (filter && !filter(key, sourceResult.data)) {
                                return;
                            }
                            const targetResult = await target.set(key, sourceResult.data);
                            if (targetResult.isSuccess) {
                                result.synced++;
                            }
                            else {
                                result.errors.push(`Failed to sync ${key}: ${targetResult.message}`);
                            }
                        }
                    }
                    catch (error) {
                        result.errors.push(`Error syncing ${key}: ${error}`);
                    }
                }));
            }
            result.duration = Date.now() - startTime;
            this.state.lastSync = new Date();
            this.state.totalSynced += result.synced;
            return Result.success(result);
        }
        finally {
            this.state.inProgress = false;
        }
    }
    /**
     * 양방향 동기화
     */
    async syncBidirectional(providerA, providerB) {
        if (this.state.inProgress) {
            return Result.failure('SYNC_IN_PROGRESS', '동기화가 이미 진행 중입니다');
        }
        this.state.inProgress = true;
        const startTime = Date.now();
        const result = {
            synced: 0,
            conflicts: 0,
            errors: [],
            duration: 0
        };
        try {
            // 양쪽 키 목록 가져오기
            const [keysA, keysB] = await Promise.all([
                providerA.keys(),
                providerB.keys()
            ]);
            if (keysA.isFailure || keysB.isFailure) {
                return Result.failure('SYNC_KEYS_ERROR', '키 목록 조회 실패');
            }
            const allKeys = new Set([...keysA.data, ...keysB.data]);
            // 모든 키에 대해 동기화
            for (const key of allKeys) {
                try {
                    const [valueA, valueB] = await Promise.all([
                        providerA.get(key),
                        providerB.get(key)
                    ]);
                    if (valueA.isFailure || valueB.isFailure) {
                        result.errors.push(`Failed to get ${key}`);
                        continue;
                    }
                    const syncResult = await this.synchronizeItem(key, valueA.data, valueB.data, providerA, providerB);
                    if (syncResult.isSuccess) {
                        result.synced++;
                        if (syncResult.data.conflict) {
                            result.conflicts++;
                        }
                    }
                    else {
                        result.errors.push(syncResult.message);
                    }
                }
                catch (error) {
                    result.errors.push(`Error syncing ${key}: ${error}`);
                }
            }
            result.duration = Date.now() - startTime;
            this.state.lastSync = new Date();
            this.state.totalSynced += result.synced;
            this.state.totalConflicts += result.conflicts;
            return Result.success(result);
        }
        finally {
            this.state.inProgress = false;
        }
    }
    /**
     * 단일 항목 동기화
     */
    async synchronizeItem(key, valueA, valueB, providerA, providerB) {
        // 양쪽 모두 없는 경우
        if (valueA === null && valueB === null) {
            return Result.success({ synced: false, conflict: false });
        }
        // A에만 있는 경우
        if (valueA !== null && valueB === null) {
            const result = await providerB.set(key, valueA);
            return Result.success({ synced: result.isSuccess, conflict: false });
        }
        // B에만 있는 경우
        if (valueA === null && valueB !== null) {
            const result = await providerA.set(key, valueB);
            return Result.success({ synced: result.isSuccess, conflict: false });
        }
        // 양쪽 모두 있는 경우 - 충돌 해결
        if (!this.areEqual(valueA, valueB)) {
            const resolved = await this.resolveConflict(key, valueA, valueB);
            await Promise.all([
                providerA.set(key, resolved),
                providerB.set(key, resolved)
            ]);
            return Result.success({ synced: true, conflict: true });
        }
        return Result.success({ synced: false, conflict: false });
    }
    /**
     * 충돌 해결
     */
    async resolveConflict(key, valueA, valueB) {
        switch (this.config.strategy) {
            case 'source-wins':
                return valueA;
            case 'target-wins':
                return valueB;
            case 'newest-wins':
                // 메타데이터가 있다면 수정 시간 비교
                if (valueA.metadata?.modified && valueB.metadata?.modified) {
                    return valueA.metadata.modified > valueB.metadata.modified ? valueA : valueB;
                }
                // 메타데이터가 없으면 custom resolver 사용
                return this.config.conflictResolver(valueA, valueB, key);
            case 'merge':
                return this.config.conflictResolver(valueA, valueB, key);
            default:
                return this.config.conflictResolver(valueA, valueB, key);
        }
    }
    /**
     * 기본 충돌 해결자
     */
    defaultConflictResolver(valueA, valueB, key) {
        // 객체인 경우 얕은 병합
        if (typeof valueA === 'object' && typeof valueB === 'object' && !Array.isArray(valueA)) {
            return { ...valueA, ...valueB };
        }
        // 배열인 경우 연결
        if (Array.isArray(valueA) && Array.isArray(valueB)) {
            return [...new Set([...valueA, ...valueB])];
        }
        // 기본: 최신 값 사용 (B를 최신으로 가정)
        return valueB;
    }
    /**
     * 값 비교
     */
    areEqual(a, b) {
        return JSON.stringify(a) === JSON.stringify(b);
    }
    /**
     * 자동 동기화 시작
     */
    startAutoSync(source, target, bidirectional = false) {
        this.stopAutoSync();
        const sync = async () => {
            if (bidirectional) {
                await this.syncBidirectional(source, target);
            }
            else {
                await this.syncOneWay(source, target);
            }
        };
        // 초기 동기화
        sync();
        // 주기적 동기화
        this.syncInterval = setInterval(sync, this.config.interval);
    }
    /**
     * 자동 동기화 중지
     */
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
    /**
     * 동기화 상태 조회
     */
    getSyncState() {
        return { ...this.state };
    }
    /**
     * 선택적 동기화
     */
    async syncSelective(source, target, keys) {
        const result = {
            synced: 0,
            conflicts: 0,
            errors: [],
            duration: 0
        };
        const startTime = Date.now();
        for (const key of keys) {
            try {
                const sourceResult = await source.get(key);
                if (sourceResult.isSuccess && sourceResult.data !== null) {
                    const targetResult = await target.set(key, sourceResult.data);
                    if (targetResult.isSuccess) {
                        result.synced++;
                    }
                    else {
                        result.errors.push(`Failed to sync ${key}`);
                    }
                }
            }
            catch (error) {
                result.errors.push(`Error syncing ${key}: ${error}`);
            }
        }
        result.duration = Date.now() - startTime;
        return Result.success(result);
    }
    /**
     * 증분 동기화 (변경된 항목만)
     */
    async syncIncremental(source, target, since) {
        // 메타데이터의 modified 시간을 기준으로 필터링
        return this.syncOneWay(source, target, (key, value) => {
            if (value.metadata?.modified) {
                return new Date(value.metadata.modified) > since;
            }
            return true;
        });
    }
    /**
     * 동기화 검증
     */
    async verifySyncIntegrity(providerA, providerB) {
        try {
            const [keysA, keysB] = await Promise.all([
                providerA.keys(),
                providerB.keys()
            ]);
            if (keysA.isFailure || keysB.isFailure) {
                return Result.failure('VERIFY_KEYS_ERROR', '키 목록 조회 실패');
            }
            const differences = [];
            const allKeys = new Set([...keysA.data, ...keysB.data]);
            for (const key of allKeys) {
                const [valueA, valueB] = await Promise.all([
                    providerA.get(key),
                    providerB.get(key)
                ]);
                if (valueA.isSuccess && valueB.isSuccess) {
                    if (!this.areEqual(valueA.data, valueB.data)) {
                        differences.push(key);
                    }
                }
            }
            return Result.success({
                identical: differences.length === 0,
                differences
            });
        }
        catch (error) {
            return Result.failure('VERIFY_ERROR', `검증 중 오류: ${error}`);
        }
    }
}
export const defaultStorageSync = new StorageSync();
//# sourceMappingURL=StorageSync.js.map