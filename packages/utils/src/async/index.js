/**
 * @repo/utils - 비동기 처리 유틸리티
 */
// ===== 지연 실행 =====
/**
 * 지정된 시간만큼 지연
 */
export function delay(ms) {
    return new Promise((resolve) => {
        if (ms < 0) {
            resolve({ success: false, error: '지연 시간은 0 이상이어야 합니다' });
            return;
        }
        setTimeout(() => {
            resolve({ success: true, data: undefined });
        }, ms);
    });
}
/**
 * 다음 이벤트 루프까지 지연
 */
export function nextTick() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ success: true, data: undefined });
        }, 0);
    });
}
/**
 * 함수 실행을 재시도
 */
export async function retry(fn, options) {
    try {
        const { maxAttempts, delay: initialDelay, backoff = 'linear', maxDelay = 30000 } = options;
        if (maxAttempts <= 0) {
            return { success: false, error: '최대 시도 횟수는 1 이상이어야 합니다' };
        }
        if (initialDelay < 0) {
            return { success: false, error: '지연 시간은 0 이상이어야 합니다' };
        }
        let lastError = '';
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const result = await fn();
            if (result.success) {
                return result;
            }
            lastError = result.error || 'Unknown error';
            // 마지막 시도면 더 이상 지연하지 않음
            if (attempt === maxAttempts) {
                break;
            }
            // 지연 계산
            let currentDelay = initialDelay;
            if (backoff === 'exponential') {
                currentDelay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
            }
            const delayResult = await delay(currentDelay);
            if (!delayResult.success) {
                return { success: false, error: delayResult.error || 'Delay failed' };
            }
        }
        return { success: false, error: `모든 재시도 실패: ${lastError}` };
    }
    catch (error) {
        return { success: false, error: `재시도 실행 실패: ${error}` };
    }
}
// ===== 타임아웃 처리 =====
/**
 * Promise에 타임아웃 추가
 */
export async function withTimeout(promise, timeoutMs, timeoutMessage = '타임아웃') {
    try {
        if (timeoutMs <= 0) {
            return { success: false, error: '타임아웃은 0보다 커야 합니다' };
        }
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(timeoutMessage));
            }, timeoutMs);
        });
        const result = await Promise.race([promise, timeoutPromise]);
        return { success: true, data: result };
    }
    catch (error) {
        if (error instanceof Error && error.message === timeoutMessage) {
            return { success: false, error: timeoutMessage };
        }
        return { success: false, error: `실행 실패: ${error}` };
    }
}
// ===== 배치 처리 =====
/**
 * 배열을 청크 단위로 순차 처리
 */
export async function processInChunks(items, processor, chunkSize = 10) {
    try {
        if (!Array.isArray(items)) {
            return { success: false, error: '항목이 배열이 아닙니다' };
        }
        if (typeof processor !== 'function') {
            return { success: false, error: '처리 함수가 유효하지 않습니다' };
        }
        if (chunkSize <= 0) {
            return { success: false, error: '청크 크기는 0보다 커야 합니다' };
        }
        const results = [];
        for (let i = 0; i < items.length; i += chunkSize) {
            const chunk = items.slice(i, i + chunkSize);
            const chunkPromises = chunk.map(processor);
            const chunkResults = await Promise.all(chunkPromises);
            for (const result of chunkResults) {
                if (!result.success) {
                    return { success: false, error: `청크 처리 실패: ${result.error}` };
                }
                results.push(result.data);
            }
        }
        return { success: true, data: results };
    }
    catch (error) {
        return { success: false, error: `배치 처리 실패: ${error}` };
    }
}
/**
 * 배열을 병렬로 처리 (동시 실행 수 제한)
 */
export async function processInParallel(items, processor, concurrency = 5) {
    try {
        if (!Array.isArray(items)) {
            return { success: false, error: '항목이 배열이 아닙니다' };
        }
        if (typeof processor !== 'function') {
            return { success: false, error: '처리 함수가 유효하지 않습니다' };
        }
        if (concurrency <= 0) {
            return { success: false, error: '동시 실행 수는 0보다 커야 합니다' };
        }
        const results = new Array(items.length);
        const executing = [];
        for (let i = 0; i < items.length; i++) {
            const promise = processor(items[i]).then(result => {
                if (!result.success) {
                    throw new Error(`인덱스 ${i} 처리 실패: ${result.error}`);
                }
                results[i] = result.data;
            });
            executing.push(promise);
            if (executing.length >= concurrency) {
                await Promise.race(executing);
                executing.splice(executing.findIndex(p => p === promise), 1);
            }
        }
        await Promise.all(executing);
        return { success: true, data: results };
    }
    catch (error) {
        return { success: false, error: `병렬 처리 실패: ${error}` };
    }
}
// ===== 디바운스/스로틀 =====
/**
 * 디바운스 함수 생성
 */
export function debounce(func, delay) {
    let timeoutId = null;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
}
/**
 * 스로틀 함수 생성
 */
export function throttle(func, delay) {
    let lastCallTime = 0;
    let timeoutId = null;
    return (...args) => {
        const now = Date.now();
        if (now - lastCallTime >= delay) {
            lastCallTime = now;
            func(...args);
        }
        else if (!timeoutId) {
            timeoutId = setTimeout(() => {
                lastCallTime = Date.now();
                timeoutId = null;
                func(...args);
            }, delay - (now - lastCallTime));
        }
    };
}
// ===== Promise 유틸리티 =====
/**
 * Promise 결과를 Result로 래핑
 */
export async function wrapPromise(promise, errorCode = 'PROMISE_ERROR') {
    try {
        const result = await promise;
        return { success: true, data: result };
    }
    catch (error) {
        return { success: false, error: `Promise 실행 실패: ${error}` };
    }
}
/**
 * 모든 Promise가 완료될 때까지 대기 (일부 실패해도 계속)
 */
export async function allSettled(promises) {
    try {
        if (!Array.isArray(promises)) {
            return { success: false, error: 'Promise 배열이 아닙니다' };
        }
        const results = await Promise.allSettled(promises);
        const mappedResults = results.map(result => {
            if (result.status === 'fulfilled') {
                return { status: 'fulfilled', value: result.value };
            }
            else {
                return { status: 'rejected', reason: result.reason };
            }
        });
        return { success: true, data: mappedResults };
    }
    catch (error) {
        return { success: false, error: `Promise.allSettled 실패: ${error}` };
    }
}
/**
 * 첫 번째로 완료되는 Promise 결과 반환
 */
export async function race(promises) {
    try {
        if (!Array.isArray(promises)) {
            return { success: false, error: 'Promise 배열이 아닙니다' };
        }
        if (promises.length === 0) {
            return { success: false, error: 'Promise 배열이 비어있습니다' };
        }
        const result = await Promise.race(promises);
        return { success: true, data: result };
    }
    catch (error) {
        return { success: false, error: `Promise.race 실패: ${error}` };
    }
}
// ===== 큐 처리 =====
/**
 * 순차 실행 큐
 */
export class SequentialQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }
    /**
     * 큐에 작업 추가
     */
    async enqueue(task) {
        return new Promise((resolve) => {
            this.queue.push(async () => {
                try {
                    const result = await task();
                    resolve({ success: true, data: result });
                }
                catch (error) {
                    resolve({ success: false, error: `작업 실행 실패: ${error}` });
                }
            });
            this.processQueue();
        });
    }
    /**
     * 큐 처리
     */
    async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }
        this.processing = true;
        while (this.queue.length > 0) {
            const task = this.queue.shift();
            if (task) {
                await task();
            }
        }
        this.processing = false;
    }
    /**
     * 큐 크기 반환
     */
    size() {
        return this.queue.length;
    }
    /**
     * 큐 비우기
     */
    clear() {
        this.queue = [];
    }
}
// ===== 캐시 유틸리티 =====
/**
 * 메모이제이션 캐시
 */
export function memoize(func, keyGenerator) {
    const cache = new Map();
    const defaultKeyGenerator = (...args) => {
        return JSON.stringify(args);
    };
    const getKey = keyGenerator || defaultKeyGenerator;
    return ((...args) => {
        const key = getKey(...args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = func(...args);
        cache.set(key, result);
        return result;
    });
}
/**
 * TTL(Time To Live) 캐시
 */
export class TTLCache {
    constructor(ttlMs = 60000) {
        this.cache = new Map();
        this.ttl = ttlMs;
    }
    /**
     * 값 설정
     */
    set(key, value) {
        const expires = Date.now() + this.ttl;
        this.cache.set(key, { value, expires });
    }
    /**
     * 값 가져오기
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            return undefined;
        }
        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return undefined;
        }
        return item.value;
    }
    /**
     * 값 존재 여부 확인
     */
    has(key) {
        return this.get(key) !== undefined;
    }
    /**
     * 값 삭제
     */
    delete(key) {
        return this.cache.delete(key);
    }
    /**
     * 캐시 비우기
     */
    clear() {
        this.cache.clear();
    }
    /**
     * 만료된 항목 정리
     */
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expires) {
                this.cache.delete(key);
            }
        }
    }
    /**
     * 캐시 크기
     */
    size() {
        this.cleanup();
        return this.cache.size;
    }
}
//# sourceMappingURL=index.js.map