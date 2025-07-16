/**
 * @company/utils - 배열 처리 유틸리티
 */
// ===== 배열 검증 =====
/**
 * 빈 배열인지 확인
 */
export function isEmpty(arr) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        return { success: true, data: arr.length === 0 };
    }
    catch (error) {
        return { success: false, error: `빈 배열 검증 실패: ${error}` };
    }
}
/**
 * 배열에 중복 요소가 있는지 확인
 */
export function hasDuplicates(arr) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        const uniqueSet = new Set(arr);
        return { success: true, data: uniqueSet.size !== arr.length };
    }
    catch (error) {
        return { success: false, error: `중복 검사 실패: ${error}` };
    }
}
// ===== 배열 조작 =====
/**
 * 배열에서 중복 제거
 */
export function removeDuplicates(arr) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        const unique = [...new Set(arr)];
        return { success: true, data: unique };
    }
    catch (error) {
        return { success: false, error: `중복 제거 실패: ${error}` };
    }
}
/**
 * 배열 섞기 (Fisher-Yates 알고리즘)
 */
export function shuffle(arr) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return { success: true, data: shuffled };
    }
    catch (error) {
        return { success: false, error: `배열 섞기 실패: ${error}` };
    }
}
/**
 * 배열 청크 분할
 */
export function chunk(arr, size) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        if (size <= 0) {
            return { success: false, error: '청크 크기는 0보다 커야 합니다' };
        }
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return { success: true, data: chunks };
    }
    catch (error) {
        return { success: false, error: `배열 청크 분할 실패: ${error}` };
    }
}
/**
 * 배열 평탄화
 */
export function flatten(arr) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        const flattened = arr.flat();
        return { success: true, data: flattened };
    }
    catch (error) {
        return { success: false, error: `배열 평탄화 실패: ${error}` };
    }
}
/**
 * 깊은 배열 평탄화
 */
export function deepFlatten(arr) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        const flattened = arr.flat(Infinity);
        return { success: true, data: flattened };
    }
    catch (error) {
        return { success: false, error: `깊은 배열 평탄화 실패: ${error}` };
    }
}
/**
 * 배열 회전 (왼쪽으로)
 */
export function rotateLeft(arr, positions = 1) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        if (arr.length === 0) {
            return { success: true, data: [] };
        }
        const normalizedPositions = positions % arr.length;
        const rotated = [...arr.slice(normalizedPositions), ...arr.slice(0, normalizedPositions)];
        return { success: true, data: rotated };
    }
    catch (error) {
        return { success: false, error: `배열 왼쪽 회전 실패: ${error}` };
    }
}
/**
 * 배열 회전 (오른쪽으로)
 */
export function rotateRight(arr, positions = 1) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        if (arr.length === 0) {
            return { success: true, data: [] };
        }
        const normalizedPositions = positions % arr.length;
        const rotated = [...arr.slice(-normalizedPositions), ...arr.slice(0, -normalizedPositions)];
        return { success: true, data: rotated };
    }
    catch (error) {
        return { success: false, error: `배열 오른쪽 회전 실패: ${error}` };
    }
}
// ===== 배열 검색 =====
/**
 * 조건에 맞는 첫 번째 요소의 인덱스 찾기
 */
export function findIndex(arr, predicate) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        if (typeof predicate !== 'function') {
            return { success: false, error: '조건자가 함수가 아닙니다' };
        }
        const index = arr.findIndex(predicate);
        return { success: true, data: index };
    }
    catch (error) {
        return { success: false, error: `인덱스 검색 실패: ${error}` };
    }
}
/**
 * 조건에 맞는 마지막 요소의 인덱스 찾기
 */
export function findLastIndex(arr, predicate) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        if (typeof predicate !== 'function') {
            return { success: false, error: '조건자가 함수가 아닙니다' };
        }
        for (let i = arr.length - 1; i >= 0; i--) {
            if (predicate(arr[i], i)) {
                return { success: true, data: i };
            }
        }
        return { success: true, data: -1 };
    }
    catch (error) {
        return { success: false, error: `마지막 인덱스 검색 실패: ${error}` };
    }
}
/**
 * 특정 값의 모든 인덱스 찾기
 */
export function findAllIndexes(arr, value) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        const indexes = [];
        arr.forEach((item, index) => {
            if (item === value) {
                indexes.push(index);
            }
        });
        return { success: true, data: indexes };
    }
    catch (error) {
        return { success: false, error: `모든 인덱스 검색 실패: ${error}` };
    }
}
// ===== 배열 필터링 =====
/**
 * null과 undefined 제거
 */
export function compact(arr) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        const compacted = arr.filter((item) => item != null);
        return { success: true, data: compacted };
    }
    catch (error) {
        return { success: false, error: `null/undefined 제거 실패: ${error}` };
    }
}
/**
 * falsy 값 제거
 */
export function removeFalsy(arr) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        const filtered = arr.filter(Boolean);
        return { success: true, data: filtered };
    }
    catch (error) {
        return { success: false, error: `falsy 값 제거 실패: ${error}` };
    }
}
/**
 * 특정 값들 제거
 */
export function removeValues(arr, ...values) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        const valueSet = new Set(values);
        const filtered = arr.filter(item => !valueSet.has(item));
        return { success: true, data: filtered };
    }
    catch (error) {
        return { success: false, error: `특정 값 제거 실패: ${error}` };
    }
}
// ===== 배열 집합 연산 =====
/**
 * 두 배열의 교집합
 */
export function intersection(arr1, arr2) {
    try {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        const set2 = new Set(arr2);
        const intersected = arr1.filter(item => set2.has(item));
        return { success: true, data: [...new Set(intersected)] };
    }
    catch (error) {
        return { success: false, error: `교집합 연산 실패: ${error}` };
    }
}
/**
 * 두 배열의 합집합
 */
export function union(arr1, arr2) {
    try {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        const unionSet = new Set([...arr1, ...arr2]);
        return { success: true, data: [...unionSet] };
    }
    catch (error) {
        return { success: false, error: `합집합 연산 실패: ${error}` };
    }
}
/**
 * 첫 번째 배열에서 두 번째 배열 요소들 제외
 */
export function difference(arr1, arr2) {
    try {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        const set2 = new Set(arr2);
        const diff = arr1.filter(item => !set2.has(item));
        return { success: true, data: diff };
    }
    catch (error) {
        return { success: false, error: `차집합 연산 실패: ${error}` };
    }
}
/**
 * 대칭 차집합 (두 배열에서 공통 요소 제외)
 */
export function symmetricDifference(arr1, arr2) {
    try {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        const set1 = new Set(arr1);
        const set2 = new Set(arr2);
        const diff1 = arr1.filter(item => !set2.has(item));
        const diff2 = arr2.filter(item => !set1.has(item));
        return { success: true, data: [...diff1, ...diff2] };
    }
    catch (error) {
        return { success: false, error: `대칭 차집합 연산 실패: ${error}` };
    }
}
// ===== 배열 그룹화/분할 =====
/**
 * 특정 키로 객체 배열 그룹화
 */
export function groupBy(arr, key) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        const grouped = arr.reduce((acc, item) => {
            const groupKey = String(item[key]);
            if (!acc[groupKey]) {
                acc[groupKey] = [];
            }
            acc[groupKey].push(item);
            return acc;
        }, {});
        return { success: true, data: grouped };
    }
    catch (error) {
        return { success: false, error: `그룹화 실패: ${error}` };
    }
}
/**
 * 조건에 따라 배열 분할
 */
export function partition(arr, predicate) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        if (typeof predicate !== 'function') {
            return { success: false, error: '조건자가 함수가 아닙니다' };
        }
        const truthy = [];
        const falsy = [];
        arr.forEach(item => {
            if (predicate(item)) {
                truthy.push(item);
            }
            else {
                falsy.push(item);
            }
        });
        return { success: true, data: [truthy, falsy] };
    }
    catch (error) {
        return { success: false, error: `배열 분할 실패: ${error}` };
    }
}
// ===== 배열 통계 =====
/**
 * 숫자 배열의 합계
 */
export function sum(arr) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        if (!arr.every(item => typeof item === 'number' && !isNaN(item))) {
            return { success: false, error: '모든 요소가 유효한 숫자가 아닙니다' };
        }
        const total = arr.reduce((sum, num) => sum + num, 0);
        return { success: true, data: total };
    }
    catch (error) {
        return { success: false, error: `합계 계산 실패: ${error}` };
    }
}
/**
 * 숫자 배열의 평균
 */
export function average(arr) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        if (arr.length === 0) {
            return { success: false, error: '빈 배열의 평균을 계산할 수 없습니다' };
        }
        const sumResult = sum(arr);
        if (!sumResult.success) {
            return sumResult;
        }
        const avg = sumResult.data / arr.length;
        return { success: true, data: avg };
    }
    catch (error) {
        return { success: false, error: `평균 계산 실패: ${error}` };
    }
}
/**
 * 숫자 배열의 최댓값
 */
export function max(arr) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        if (arr.length === 0) {
            return { success: false, error: '빈 배열의 최댓값을 찾을 수 없습니다' };
        }
        if (!arr.every(item => typeof item === 'number' && !isNaN(item))) {
            return { success: false, error: '모든 요소가 유효한 숫자가 아닙니다' };
        }
        const maximum = Math.max(...arr);
        return { success: true, data: maximum };
    }
    catch (error) {
        return { success: false, error: `최댓값 계산 실패: ${error}` };
    }
}
/**
 * 숫자 배열의 최솟값
 */
export function min(arr) {
    try {
        if (!Array.isArray(arr)) {
            return { success: false, error: '입력값이 배열이 아닙니다' };
        }
        if (arr.length === 0) {
            return { success: false, error: '빈 배열의 최솟값을 찾을 수 없습니다' };
        }
        if (!arr.every(item => typeof item === 'number' && !isNaN(item))) {
            return { success: false, error: '모든 요소가 유효한 숫자가 아닙니다' };
        }
        const minimum = Math.min(...arr);
        return { success: true, data: minimum };
    }
    catch (error) {
        return { success: false, error: `최솟값 계산 실패: ${error}` };
    }
}
//# sourceMappingURL=index.js.map