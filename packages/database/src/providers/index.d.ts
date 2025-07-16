/**
 * @company/database - Database Providers
 *
 * 모든 데이터베이스 프로바이더를 통합 관리
 */
export { PostgreSQLProvider } from './PostgreSQLProvider';
export { MySQLProvider } from './MySQLProvider';
export { SQLiteProvider } from './SQLiteProvider';
import type { DatabaseConfig } from '../types';
import { PostgreSQLProvider } from './PostgreSQLProvider';
import { MySQLProvider } from './MySQLProvider';
import { SQLiteProvider } from './SQLiteProvider';
export declare function createProvider(config: DatabaseConfig): PostgreSQLProvider | MySQLProvider | SQLiteProvider;
//# sourceMappingURL=index.d.ts.map