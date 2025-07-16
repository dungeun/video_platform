/**
 * @company/database - Enterprise Database Module
 *
 * 데이터베이스 연결, 쿼리 빌더, 마이그레이션, 트랜잭션을 통합 지원하는 엔터프라이즈 모듈
 * Zero Error Architecture 기반으로 설계됨
 *
 * @version 1.0.0
 * @author Enterprise AI Team
 */
// ===== 메인 매니저 =====
export { DatabaseManager } from './DatabaseManager';
// ===== 타입 시스템 =====
export * from './types';
// ===== 연결 관리 =====
export { ConnectionManager } from './connection/ConnectionManager';
// ===== 쿼리 빌더 =====
export { QueryBuilder } from './query/QueryBuilder';
// ===== 트랜잭션 관리 =====
export { TransactionManager, DatabaseTransaction } from './transaction/TransactionManager';
// ===== 마이그레이션 시스템 =====
export { MigrationRunner } from './migration/MigrationRunner';
// ===== 데이터베이스 프로바이더 =====
export * from './providers';
// ===== 팩토리 함수 =====
import { DatabaseManager } from './DatabaseManager';
/**
 * DatabaseManager 인스턴스 생성 (싱글톤)
 */
let databaseManagerInstance = null;
export function createDatabaseManager() {
    if (!databaseManagerInstance) {
        databaseManagerInstance = new DatabaseManager();
    }
    return databaseManagerInstance;
}
/**
 * 기본 DatabaseManager 인스턴스 반환
 */
export function getDatabaseManager() {
    return createDatabaseManager();
}
/**
 * 빠른 데이터베이스 연결 헬퍼
 */
export async function connectDatabase(config) {
    const manager = getDatabaseManager();
    await manager.initialize();
    const result = await manager.connect(config);
    if (!result.success) {
        throw new Error(result.error || '데이터베이스 연결 실패');
    }
    return {
        manager,
        connectionId: result.connectionId,
        query: (sql, bindings) => manager.query(sql, bindings, result.connectionId),
        queryBuilder: () => manager.queryBuilder(result.connectionId),
        transaction: (callback) => manager.transaction(callback, result.connectionId),
        schema: () => manager.schema(result.connectionId),
        disconnect: () => manager.disconnect(result.connectionId)
    };
}
// ===== 유틸리티 함수 =====
/**
 * SQL 인젝션 방지를 위한 문자열 이스케이프
 */
export function escapeString(value) {
    return value.replace(/'/g, "''").replace(/\\/g, '\\\\');
}
/**
 * 테이블명/컬럼명 검증
 */
export function validateIdentifier(identifier) {
    // 알파벳, 숫자, 언더스코어만 허용 (첫 글자는 알파벳 또는 언더스코어)
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
}
/**
 * SQL 바인딩 파라미터 생성
 */
export function createBindings(values) {
    return values.map(() => '?').join(', ');
}
/**
 * 페이지네이션 헬퍼
 */
export function createPagination(page, limit) {
    const normalizedPage = Math.max(1, page);
    const normalizedLimit = Math.max(1, Math.min(1000, limit)); // 최대 1000개 제한
    return {
        offset: (normalizedPage - 1) * normalizedLimit,
        limit: normalizedLimit
    };
}
/**
 * WHERE 절 조건 빌더
 */
export function buildWhereConditions(conditions, operator = 'AND') {
    const entries = Object.entries(conditions).filter(([_, value]) => value !== undefined);
    if (entries.length === 0) {
        return { sql: '', bindings: [] };
    }
    const conditions_sql = entries.map(([key]) => {
        if (!validateIdentifier(key)) {
            throw new Error(`유효하지 않은 컬럼명: ${key}`);
        }
        return `${key} = ?`;
    });
    const bindings = entries.map(([_, value]) => value);
    return {
        sql: conditions_sql.join(` ${operator} `),
        bindings
    };
}
/**
 * INSERT 값 빌더
 */
export function buildInsertValues(data) {
    const records = Array.isArray(data) ? data : [data];
    if (records.length === 0) {
        throw new Error('INSERT할 데이터가 없습니다');
    }
    const columns = Object.keys(records[0]);
    // 컬럼명 검증
    for (const column of columns) {
        if (!validateIdentifier(column)) {
            throw new Error(`유효하지 않은 컬럼명: ${column}`);
        }
    }
    const columnsStr = columns.join(', ');
    const valuesStr = records.map(() => `(${createBindings(columns)})`).join(', ');
    const bindings = records.flatMap(record => columns.map(col => record[col]));
    return {
        columns: columnsStr,
        values: valuesStr,
        bindings
    };
}
/**
 * UPDATE SET 절 빌더
 */
export function buildUpdateSet(data) {
    const entries = Object.entries(data).filter(([_, value]) => value !== undefined);
    if (entries.length === 0) {
        throw new Error('UPDATE할 데이터가 없습니다');
    }
    const setClause = entries.map(([key]) => {
        if (!validateIdentifier(key)) {
            throw new Error(`유효하지 않은 컬럼명: ${key}`);
        }
        return `${key} = ?`;
    });
    const bindings = entries.map(([_, value]) => value);
    return {
        sql: setClause.join(', '),
        bindings
    };
}
// ===== 상수 및 기본값 =====
export const DATABASE_DEFAULTS = {
    POOL: {
        MIN: 2,
        MAX: 10,
        IDLE_TIMEOUT: 30000,
        ACQUIRE_TIMEOUT: 60000
    },
    MIGRATION: {
        TABLE_NAME: 'migrations',
        DIRECTORY: './migrations',
        EXTENSION: '.ts'
    },
    TIMEOUT: {
        QUERY: 30000,
        TRANSACTION: 60000,
        CONNECTION: 10000
    }
};
export const SUPPORTED_PROVIDERS = [
    'postgresql',
    'mysql',
    'sqlite'
];
// ===== 모듈 정보 =====
export const DATABASE_MODULE_INFO = {
    name: '@company/database',
    version: '1.0.0',
    description: 'Enterprise Database Module with Multiple Providers and Query Builder',
    author: 'Enterprise AI Team',
    license: 'MIT',
    supportedProviders: SUPPORTED_PROVIDERS
};
// ===== 개발 도구 =====
/**
 * SQL 쿼리 로깅을 위한 포맷터
 */
export function formatSqlForLogging(sql, bindings) {
    if (!bindings || bindings.length === 0) {
        return sql;
    }
    let formattedSql = sql;
    bindings.forEach((binding) => {
        const value = typeof binding === 'string' ? `'${binding}'` : String(binding);
        formattedSql = formattedSql.replace('?', value);
    });
    return formattedSql;
}
/**
 * 쿼리 성능 분석을 위한 헬퍼
 */
export function analyzeQueryPerformance(executionTime) {
    if (executionTime < 100) {
        return { level: 'fast', message: '빠른 쿼리' };
    }
    else if (executionTime < 1000) {
        return { level: 'normal', message: '일반 쿼리' };
    }
    else if (executionTime < 5000) {
        return { level: 'slow', message: '느린 쿼리 - 최적화 권장' };
    }
    else {
        return { level: 'critical', message: '매우 느린 쿼리 - 즉시 최적화 필요' };
    }
}
// ===== 에러 헬퍼 =====
/**
 * 데이터베이스 에러 분석
 */
export function analyzeDatabaseError(error) {
    const message = error.message.toLowerCase();
    if (message.includes('connection') || message.includes('connect')) {
        return {
            type: 'connection',
            severity: 'critical',
            suggestion: '데이터베이스 연결 설정을 확인하세요'
        };
    }
    if (message.includes('syntax') || message.includes('near')) {
        return {
            type: 'syntax',
            severity: 'medium',
            suggestion: 'SQL 문법을 확인하세요'
        };
    }
    if (message.includes('constraint') || message.includes('unique') || message.includes('foreign')) {
        return {
            type: 'constraint',
            severity: 'medium',
            suggestion: '데이터 제약 조건을 확인하세요'
        };
    }
    if (message.includes('permission') || message.includes('access')) {
        return {
            type: 'permission',
            severity: 'high',
            suggestion: '데이터베이스 권한을 확인하세요'
        };
    }
    if (message.includes('timeout') || message.includes('lock')) {
        return {
            type: 'timeout',
            severity: 'high',
            suggestion: '쿼리 최적화 또는 타임아웃 설정을 확인하세요'
        };
    }
    return {
        type: 'unknown',
        severity: 'medium',
        suggestion: '에러 로그를 자세히 확인하세요'
    };
}
//# sourceMappingURL=index.js.map