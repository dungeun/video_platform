/**
 * @repo/database - Test Setup
 * 
 * 데이터베이스 모듈 테스트 환경 설정
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { DatabaseManager } from '../src';
import type { DatabaseConfig } from '../src/types';

// 테스트용 데이터베이스 설정
export const testDatabaseConfig: DatabaseConfig = {
  provider: 'sqlite',
  database: ':memory:', // 메모리 데이터베이스 사용
  filename: ':memory:',
  debug: false
};

export let testDatabaseManager: DatabaseManager;
export let testConnectionId: string;

// 모든 테스트 시작 전 설정
beforeAll(async () => {
  testDatabaseManager = new DatabaseManager();
  await testDatabaseManager.initialize();
  
  const result = await testDatabaseManager.connect(testDatabaseConfig);
  if (!result.success) {
    throw new Error(`테스트 데이터베이스 연결 실패: ${result.error}`);
  }
  
  testConnectionId = result.connectionId!;
});

// 모든 테스트 종료 후 정리
afterAll(async () => {
  if (testDatabaseManager) {
    await testDatabaseManager.cleanup();
  }
});

// 각 테스트 전 데이터 정리
beforeEach(async () => {
  // 테스트용 테이블들 정리
  try {
    await testDatabaseManager.query(`
      DROP TABLE IF EXISTS test_users;
      DROP TABLE IF EXISTS test_posts;
      DROP TABLE IF EXISTS test_comments;
    `, [], testConnectionId);
  } catch (error) {
    // 테이블이 없을 수 있으므로 에러 무시
  }
});

// 테스트 헬퍼 함수들
export async function createTestTable(
  tableName: string, 
  columns: string
): Promise<void> {
  const sql = `CREATE TABLE ${tableName} (${columns})`;
  const result = await testDatabaseManager.query(sql, [], testConnectionId);
  
  if (!result.success) {
    throw new Error(`테스트 테이블 생성 실패: ${result.error}`);
  }
}

export async function insertTestData(
  tableName: string,
  data: Record<string, any>[]
): Promise<void> {
  for (const row of data) {
    const columns = Object.keys(row).join(', ');
    const placeholders = Object.keys(row).map(() => '?').join(', ');
    const values = Object.values(row);
    
    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
    const result = await testDatabaseManager.query(sql, values, testConnectionId);
    
    if (!result.success) {
      throw new Error(`테스트 데이터 삽입 실패: ${result.error}`);
    }
  }
}

export async function expectTableExists(tableName: string): Promise<boolean> {
  const result = await testDatabaseManager.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    [tableName],
    testConnectionId
  );
  
  return result.success && result.data && result.data.length > 0;
}

export async function expectRowCount(
  tableName: string, 
  expectedCount: number
): Promise<boolean> {
  const result = await testDatabaseManager.query(
    `SELECT COUNT(*) as count FROM ${tableName}`,
    [],
    testConnectionId
  );
  
  if (!result.success || !result.data || result.data.length === 0) {
    return false;
  }
  
  return result.data[0].count === expectedCount;
}