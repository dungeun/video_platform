/**
 * @company/database - Database Module Tests
 * 
 * 데이터베이스 모듈의 핵심 기능 테스트
 */

import { describe, it, expect } from 'vitest';
import { 
  testDatabaseManager, 
  testConnectionId,
  createTestTable,
  insertTestData,
  expectTableExists,
  expectRowCount
} from './setup';

describe('DatabaseManager', () => {
  describe('연결 관리', () => {
    it('데이터베이스에 연결되어 있어야 한다', () => {
      expect(testDatabaseManager.isConnected(testConnectionId)).toBe(true);
    });

    it('연결 정보를 조회할 수 있어야 한다', () => {
      const connection = testDatabaseManager.getConnection(testConnectionId);
      expect(connection).toBeTruthy();
      expect(connection?.provider).toBe('sqlite');
      expect(connection?.connected).toBe(true);
    });

    it('모든 연결 목록을 조회할 수 있어야 한다', () => {
      const connections = testDatabaseManager.getConnections();
      expect(connections.length).toBeGreaterThan(0);
      expect(connections.some(c => c.id === testConnectionId)).toBe(true);
    });
  });

  describe('쿼리 실행', () => {
    it('간단한 SELECT 쿼리를 실행할 수 있어야 한다', async () => {
      const result = await testDatabaseManager.query(
        'SELECT 1 as test_value',
        [],
        testConnectionId
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeTruthy();
      expect(result.data![0].test_value).toBe(1);
    });

    it('테이블을 생성할 수 있어야 한다', async () => {
      await createTestTable('test_users', `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      `);

      const exists = await expectTableExists('test_users');
      expect(exists).toBe(true);
    });

    it('데이터를 삽입할 수 있어야 한다', async () => {
      await createTestTable('test_users', `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      `);

      await insertTestData('test_users', [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' }
      ]);

      const hasCorrectCount = await expectRowCount('test_users', 2);
      expect(hasCorrectCount).toBe(true);
    });

    it('데이터를 조회할 수 있어야 한다', async () => {
      await createTestTable('test_users', `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      `);

      await insertTestData('test_users', [
        { name: 'John Doe', email: 'john@example.com' }
      ]);

      const result = await testDatabaseManager.query(
        'SELECT * FROM test_users WHERE name = ?',
        ['John Doe'],
        testConnectionId
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeTruthy();
      expect(result.data!.length).toBe(1);
      expect(result.data![0].name).toBe('John Doe');
      expect(result.data![0].email).toBe('john@example.com');
    });

    it('데이터를 업데이트할 수 있어야 한다', async () => {
      await createTestTable('test_users', `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      `);

      await insertTestData('test_users', [
        { name: 'John Doe', email: 'john@example.com' }
      ]);

      const updateResult = await testDatabaseManager.query(
        'UPDATE test_users SET name = ? WHERE email = ?',
        ['John Smith', 'john@example.com'],
        testConnectionId
      );

      expect(updateResult.success).toBe(true);
      expect(updateResult.affectedRows).toBe(1);

      const selectResult = await testDatabaseManager.query(
        'SELECT name FROM test_users WHERE email = ?',
        ['john@example.com'],
        testConnectionId
      );

      expect(selectResult.success).toBe(true);
      expect(selectResult.data![0].name).toBe('John Smith');
    });

    it('데이터를 삭제할 수 있어야 한다', async () => {
      await createTestTable('test_users', `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      `);

      await insertTestData('test_users', [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' }
      ]);

      const deleteResult = await testDatabaseManager.query(
        'DELETE FROM test_users WHERE name = ?',
        ['John Doe'],
        testConnectionId
      );

      expect(deleteResult.success).toBe(true);
      expect(deleteResult.affectedRows).toBe(1);

      const hasCorrectCount = await expectRowCount('test_users', 1);
      expect(hasCorrectCount).toBe(true);
    });
  });

  describe('쿼리 빌더', () => {
    it('SELECT 쿼리를 빌드할 수 있어야 한다', async () => {
      await createTestTable('test_users', `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      `);

      await insertTestData('test_users', [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' }
      ]);

      const queryBuilder = testDatabaseManager.queryBuilder(testConnectionId);
      const result = await queryBuilder
        .select(['name', 'email'])
        .from('test_users')
        .where('name', '=', 'John Doe')
        .execute();

      expect(result.success).toBe(true);
      expect(result.data).toBeTruthy();
      expect(result.data!.length).toBe(1);
      expect(result.data![0].name).toBe('John Doe');
    });

    it('INSERT 쿼리를 빌드할 수 있어야 한다', async () => {
      await createTestTable('test_users', `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      `);

      const queryBuilder = testDatabaseManager.queryBuilder(testConnectionId);
      const result = await queryBuilder
        .insert({
          name: 'Alice Johnson',
          email: 'alice@example.com'
        })
        .from('test_users')
        .execute();

      expect(result.success).toBe(true);
      expect(result.affectedRows).toBe(1);

      const hasCorrectCount = await expectRowCount('test_users', 1);
      expect(hasCorrectCount).toBe(true);
    });

    it('UPDATE 쿼리를 빌드할 수 있어야 한다', async () => {
      await createTestTable('test_users', `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      `);

      await insertTestData('test_users', [
        { name: 'John Doe', email: 'john@example.com' }
      ]);

      const queryBuilder = testDatabaseManager.queryBuilder(testConnectionId);
      const result = await queryBuilder
        .update({ name: 'John Smith' })
        .from('test_users')
        .where('email', '=', 'john@example.com')
        .execute();

      expect(result.success).toBe(true);
      expect(result.affectedRows).toBe(1);
    });

    it('DELETE 쿼리를 빌드할 수 있어야 한다', async () => {
      await createTestTable('test_users', `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      `);

      await insertTestData('test_users', [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' }
      ]);

      const queryBuilder = testDatabaseManager.queryBuilder(testConnectionId);
      const result = await queryBuilder
        .delete()
        .from('test_users')
        .where('name', '=', 'John Doe')
        .execute();

      expect(result.success).toBe(true);
      expect(result.affectedRows).toBe(1);

      const hasCorrectCount = await expectRowCount('test_users', 1);
      expect(hasCorrectCount).toBe(true);
    });

    it('복잡한 WHERE 절을 빌드할 수 있어야 한다', async () => {
      await createTestTable('test_users', `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        age INTEGER
      `);

      await insertTestData('test_users', [
        { name: 'John Doe', email: 'john@example.com', age: 25 },
        { name: 'Jane Smith', email: 'jane@example.com', age: 30 },
        { name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
      ]);

      const queryBuilder = testDatabaseManager.queryBuilder(testConnectionId);
      
      // WHERE age > 25 AND name LIKE '%John%'
      const { sql, bindings } = queryBuilder
        .select()
        .from('test_users')
        .where('age', '>', 25)
        .where('name', 'LIKE', '%John%')
        .toSQL();

      expect(sql).toContain('WHERE');
      expect(sql).toContain('age');
      expect(sql).toContain('name');
      expect(bindings).toContain(25);
      expect(bindings).toContain('%John%');
    });
  });

  describe('트랜잭션', () => {
    it('트랜잭션을 성공적으로 커밋할 수 있어야 한다', async () => {
      await createTestTable('test_users', `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      `);

      const result = await testDatabaseManager.transaction(async (trx) => {
        await trx.query(
          'INSERT INTO test_users (name, email) VALUES (?, ?)',
          ['John Doe', 'john@example.com']
        );
        
        await trx.query(
          'INSERT INTO test_users (name, email) VALUES (?, ?)',
          ['Jane Smith', 'jane@example.com']
        );

        return 'success';
      }, testConnectionId);

      expect(result.success).toBe(true);
      
      const hasCorrectCount = await expectRowCount('test_users', 2);
      expect(hasCorrectCount).toBe(true);
    });

    it('트랜잭션 실패 시 롤백되어야 한다', async () => {
      await createTestTable('test_users', `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      `);

      // 의도적으로 실패하는 트랜잭션
      const result = await testDatabaseManager.transaction(async (trx) => {
        await trx.query(
          'INSERT INTO test_users (name, email) VALUES (?, ?)',
          ['John Doe', 'john@example.com']
        );
        
        // 중복 이메일로 실패 유도
        await trx.query(
          'INSERT INTO test_users (name, email) VALUES (?, ?)',
          ['Jane Smith', 'john@example.com'] // 같은 이메일
        );

        return 'success';
      }, testConnectionId);

      expect(result.success).toBe(false);
      
      // 롤백으로 인해 데이터가 없어야 함
      const hasCorrectCount = await expectRowCount('test_users', 0);
      expect(hasCorrectCount).toBe(true);
    });
  });

  describe('헬스체크', () => {
    it('연결 헬스체크가 성공해야 한다', async () => {
      const health = await testDatabaseManager.healthCheck(testConnectionId);
      
      expect(health.success).toBe(true);
      expect(health.connectionId).toBe(testConnectionId);
      expect(health.provider).toBe('sqlite');
      expect(health.responseTime).toBeGreaterThan(0);
    });
  });

  describe('시스템 정보', () => {
    it('시스템 정보를 조회할 수 있어야 한다', async () => {
      const systemInfo = await testDatabaseManager.getSystemInfo();
      
      expect(systemInfo.connections.length).toBeGreaterThan(0);
      expect(systemInfo.totalConnections).toBeGreaterThanOrEqual(0);
      expect(systemInfo.activeConnections).toBeGreaterThanOrEqual(0);
    });
  });
});