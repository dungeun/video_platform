/**
 * @repo/database - Database Providers
 *
 * 모든 데이터베이스 프로바이더를 통합 관리
 */
export { PostgreSQLProvider } from './PostgreSQLProvider';
export { MySQLProvider } from './MySQLProvider';
export { SQLiteProvider } from './SQLiteProvider';
import { PostgreSQLProvider } from './PostgreSQLProvider';
import { MySQLProvider } from './MySQLProvider';
import { SQLiteProvider } from './SQLiteProvider';
export function createProvider(config) {
    switch (config.provider) {
        case 'postgresql':
            return new PostgreSQLProvider(config);
        case 'mysql':
            return new MySQLProvider(config);
        case 'sqlite':
            return new SQLiteProvider(config);
        default:
            throw new Error(`지원하지 않는 데이터베이스 프로바이더: ${config.provider}`);
    }
}
//# sourceMappingURL=index.js.map