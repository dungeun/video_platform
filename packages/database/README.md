# @repo/database

Enterprise Database Module with Multiple Providers and Query Builder

## 개요

@repo/database는 엔터프라이즈급 데이터베이스 연결, 쿼리 빌더, 마이그레이션, 트랜잭션 관리를 제공하는 통합 모듈입니다. Zero Error Architecture 기반으로 설계되어 안정성과 확장성을 보장합니다.

## 주요 기능

- **다중 데이터베이스 지원**: PostgreSQL, MySQL, SQLite
- **연결 풀 관리**: 자동 연결 관리 및 최적화
- **체이닝 쿼리 빌더**: 직관적인 SQL 쿼리 작성
- **트랜잭션 관리**: 안전한 트랜잭션 처리
- **마이그레이션 시스템**: 데이터베이스 스키마 버전 관리
- **스키마 빌더**: 동적 스키마 생성 및 관리
- **연결 모니터링**: 실시간 연결 상태 추적
- **성능 분석**: 쿼리 성능 모니터링

## 설치

```bash
npm install @repo/database
```

## 의존성

```bash
npm install pg mysql2 sqlite3 knex
npm install -D @types/pg @types/sqlite3
```

## 기본 사용법

### 데이터베이스 연결

```typescript
import { DatabaseManager } from '@repo/database';

const dbManager = new DatabaseManager();
await dbManager.initialize();

// PostgreSQL 연결
const pgResult = await dbManager.connect({
  provider: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  username: 'user',
  password: 'password',
  pool: {
    min: 2,
    max: 10
  }
});

if (pgResult.success) {
  console.log('연결 성공:', pgResult.connectionId);
}
```

### 간편한 연결 헬퍼 사용

```typescript
import { connectDatabase } from '@repo/database';

const db = await connectDatabase({
  provider: 'sqlite',
  database: './app.db'
});

// 직접 쿼리 실행
const users = await db.query('SELECT * FROM users');

// 연결 해제
await db.disconnect();
```

## 쿼리 실행

### 직접 SQL 쿼리

```typescript
// 데이터 조회
const result = await dbManager.query(
  'SELECT * FROM users WHERE age > ?',
  [25]
);

if (result.success) {
  console.log('사용자:', result.data);
}

// 데이터 삽입
const insertResult = await dbManager.query(
  'INSERT INTO users (name, email) VALUES (?, ?)',
  ['John Doe', 'john@example.com']
);
```

### 쿼리 빌더 사용

```typescript
const queryBuilder = dbManager.queryBuilder();

// SELECT 쿼리
const users = await queryBuilder
  .select(['id', 'name', 'email'])
  .from('users')
  .where('age', '>', 25)
  .where('status', '=', 'active')
  .orderBy('created_at', 'DESC')
  .limit(10)
  .execute();

// INSERT 쿼리
const insertResult = await queryBuilder
  .insert({
    name: 'Jane Smith',
    email: 'jane@example.com',
    age: 28
  })
  .from('users')
  .execute();

// UPDATE 쿼리
const updateResult = await queryBuilder
  .update({ status: 'inactive' })
  .from('users')
  .where('last_login', '<', '2024-01-01')
  .execute();

// DELETE 쿼리
const deleteResult = await queryBuilder
  .delete()
  .from('users')
  .where('status', '=', 'inactive')
  .execute();
```

### 복잡한 쿼리

```typescript
// JOIN 쿼리
const postsWithUsers = await queryBuilder
  .select(['posts.title', 'posts.content', 'users.name'])
  .from('posts')
  .leftJoin('users', 'posts.user_id = users.id')
  .where('posts.published', '=', true)
  .orderBy('posts.created_at', 'DESC')
  .execute();

// 서브쿼리와 집계
const popularPosts = await queryBuilder
  .select(['posts.*'])
  .from('posts')
  .whereIn('id', function(subquery) {
    return subquery
      .select('post_id')
      .from('post_views')
      .groupBy('post_id')
      .having('COUNT(*) > 100');
  })
  .execute();
```

## 트랜잭션

### 자동 트랜잭션 관리

```typescript
const result = await dbManager.transaction(async (trx) => {
  // 트랜잭션 내에서 여러 작업 수행
  const user = await trx.query(
    'INSERT INTO users (name, email) VALUES (?, ?) RETURNING id',
    ['John Doe', 'john@example.com']
  );

  await trx.query(
    'INSERT INTO user_profiles (user_id, bio) VALUES (?, ?)',
    [user.data[0].id, 'Software Developer']
  );

  await trx.query(
    'UPDATE user_stats SET total_users = total_users + 1'
  );

  return user.data[0];
});

if (result.success) {
  console.log('트랜잭션 성공');
} else {
  console.log('트랜잭션 실패, 롤백됨');
}
```

### 수동 트랜잭션 제어

```typescript
const transactionManager = new TransactionManager(connection);
const beginResult = await transactionManager.begin();

if (beginResult.success && beginResult.transaction) {
  const trx = beginResult.transaction;
  
  try {
    await trx.query('INSERT INTO orders (user_id, total) VALUES (?, ?)', [1, 100]);
    await trx.query('UPDATE inventory SET stock = stock - 1 WHERE id = ?', [1]);
    
    const commitResult = await trx.commit();
    if (commitResult.success) {
      console.log('주문 처리 완료');
    }
  } catch (error) {
    await trx.rollback();
    console.log('주문 처리 실패, 롤백됨');
  }
}
```

## 마이그레이션

### 마이그레이션 실행

```typescript
// 모든 대기 중인 마이그레이션 실행
const migrationResult = await dbManager.migrate({
  directory: './migrations',
  tableName: 'schema_migrations'
});

if (migrationResult.success) {
  console.log('실행된 마이그레이션:', migrationResult.executed);
}

// 마이그레이션 상태 확인
const migrationRunner = new MigrationRunner(connection);
const status = await migrationRunner.status();

console.log('대기 중인 마이그레이션:', status.pending.length);
console.log('실행된 마이그레이션:', status.executed.length);
```

### 마이그레이션 롤백

```typescript
// 최근 1개 마이그레이션 롤백
const rollbackResult = await migrationRunner.rollback(1);

// 모든 마이그레이션 초기화
const resetResult = await migrationRunner.reset();
```

## 스키마 빌더

### 테이블 생성

```typescript
const schema = dbManager.schema();

await schema.createTable('users', (table) => {
  table.increments('id').primary();
  table.string('name', 100).notNullable();
  table.string('email', 255).unique().notNullable();
  table.integer('age').nullable();
  table.boolean('active').defaultTo(true);
  table.timestamps();
  
  table.index(['email']);
  table.index(['name', 'active']);
});
```

### 테이블 수정

```typescript
await schema.alterTable('users', (table) => {
  table.string('phone', 20).nullable();
  table.text('bio').nullable();
  table.dropColumn('old_column');
  table.renameColumn('full_name', 'name');
});
```

### 외래 키 관계

```typescript
await schema.createTable('posts', (table) => {
  table.increments('id').primary();
  table.string('title').notNullable();
  table.text('content');
  table.integer('user_id').notNullable();
  table.timestamps();
  
  table.foreign('user_id')
    .references('id')
    .inTable('users')
    .onDelete('CASCADE');
});
```

## 연결 관리

### 다중 연결

```typescript
// 여러 데이터베이스 연결
const pgConnection = await dbManager.connect({
  provider: 'postgresql',
  host: 'pg-server',
  database: 'main_db'
});

const mysqlConnection = await dbManager.connect({
  provider: 'mysql',
  host: 'mysql-server',
  database: 'analytics_db'
});

// 특정 연결로 쿼리 실행
const pgUsers = await dbManager.query(
  'SELECT * FROM users',
  [],
  pgConnection.connectionId
);

const mysqlStats = await dbManager.query(
  'SELECT COUNT(*) FROM events',
  [],
  mysqlConnection.connectionId
);
```

### 연결 상태 모니터링

```typescript
// 연결 목록 조회
const connections = dbManager.getConnections();
console.log('활성 연결:', connections.length);

// 특정 연결 정보
const connection = dbManager.getConnection('connection-id');
console.log('연결 정보:', connection);

// 연결 풀 통계
const stats = dbManager.getStats('connection-id');
console.log('풀 상태:', stats);

// 헬스체크
const health = await dbManager.healthCheck();
console.log('DB 상태:', health.success ? '정상' : '비정상');
```

## 이벤트 모니터링

```typescript
// 쿼리 실행 이벤트
dbManager.on('query:start', (data) => {
  console.log('쿼리 시작:', data.query);
});

dbManager.on('query:complete', (data) => {
  console.log('쿼리 완료:', data.duration + 'ms');
});

dbManager.on('query:error', (data) => {
  console.error('쿼리 오류:', data.error);
});

// 연결 이벤트
dbManager.on('connection:created', (data) => {
  console.log('연결 생성:', data.connectionId);
});

dbManager.on('connection:destroyed', (data) => {
  console.log('연결 해제:', data.connectionId);
});
```

## 프로바이더별 고급 기능

### PostgreSQL 전용 기능

```typescript
import { PostgreSQLProvider } from '@repo/database';

const pgProvider = new PostgreSQLProvider(config);

// LISTEN/NOTIFY
await pgProvider.listen('user_updates', (payload) => {
  console.log('사용자 업데이트:', payload);
});

await pgProvider.notify('user_updates', JSON.stringify({ userId: 1 }));

// JSONB 쿼리
const jsonQuery = pgProvider.buildJsonbQuery(
  'metadata',
  ['user', 'preferences'],
  'contains',
  { theme: 'dark' }
);

// 전문 검색
const ftsQuery = pgProvider.buildFullTextSearch(
  'content',
  'database management',
  'english'
);
```

### MySQL 전용 기능

```typescript
import { MySQLProvider } from '@repo/database';

const mysqlProvider = new MySQLProvider(config);

// JSON 함수
const jsonQuery = mysqlProvider.buildJsonQuery(
  'settings',
  'user.theme',
  'extract'
);

// 전문 검색 (FULLTEXT 인덱스 필요)
const ftsQuery = mysqlProvider.buildFullTextSearch(
  ['title', 'content'],
  'database tutorial',
  'boolean'
);

// 테이블 정보 조회
const tableInfo = await mysqlProvider.getTableInfo('users');
const indexInfo = await mysqlProvider.getIndexInfo('users');
```

### SQLite 전용 기능

```typescript
import { SQLiteProvider } from '@repo/database';

const sqliteProvider = new SQLiteProvider(config);

// 데이터베이스 최적화
await sqliteProvider.vacuum();
await sqliteProvider.analyze('users');

// FTS 검색
const ftsQuery = sqliteProvider.buildFTSQuery(
  'documents_fts',
  'content',
  'database optimization'
);

// 백업
await sqliteProvider.backup('./backup.db');

// 데이터베이스 크기 조회
const sizeInfo = await sqliteProvider.getDatabaseSize();
```

## 성능 최적화

### 연결 풀 최적화

```typescript
import { ConnectionPool } from '@repo/database';

const pool = new ConnectionPool({
  min: 5,
  max: 20,
  idleTimeoutMillis: 30000,
  acquireTimeoutMillis: 60000
});

// 풀 상태 모니터링
const summary = pool.getSummary();
console.log('풀 상태:', summary.status);
console.log('경고:', summary.warnings);
console.log('권장사항:', summary.recommendations);

// 자동 모니터링 시작
const stopMonitoring = pool.startMonitoring(10000);
```

### 쿼리 성능 분석

```typescript
import { analyzeQueryPerformance, formatSqlForLogging } from '@repo/database';

const result = await dbManager.query('SELECT * FROM users WHERE active = ?', [true]);

if (result.executionTime) {
  const analysis = analyzeQueryPerformance(result.executionTime);
  console.log('쿼리 성능:', analysis.level, analysis.message);
  
  if (analysis.level === 'slow' || analysis.level === 'critical') {
    const formattedSql = formatSqlForLogging(
      'SELECT * FROM users WHERE active = ?',
      [true]
    );
    console.log('느린 쿼리:', formattedSql);
  }
}
```

## 에러 처리

### 안전한 에러 처리

```typescript
import { analyzeDatabaseError } from '@repo/database';

try {
  const result = await dbManager.query('SELECT * FROM nonexistent_table');
  if (!result.success) {
    const errorAnalysis = analyzeDatabaseError(new Error(result.error!));
    console.log('에러 타입:', errorAnalysis.type);
    console.log('심각도:', errorAnalysis.severity);
    console.log('제안:', errorAnalysis.suggestion);
  }
} catch (error) {
  if (error instanceof Error) {
    const analysis = analyzeDatabaseError(error);
    // 에러 타입에 따른 처리 로직
  }
}
```

### 사용자 정의 에러 핸들링

```typescript
import { DatabaseError, ConnectionError, QueryError } from '@repo/database';

dbManager.on('query:error', (data) => {
  if (data.error.includes('connection')) {
    // 연결 에러 처리
    console.error('연결 문제 발생, 재연결 시도');
  } else if (data.error.includes('syntax')) {
    // 문법 에러 처리
    console.error('SQL 문법 오류:', data.query);
  }
});
```

## 유틸리티 함수

### SQL 빌더 헬퍼

```typescript
import { 
  buildWhereConditions,
  buildInsertValues,
  buildUpdateSet,
  createPagination
} from '@repo/database';

// WHERE 조건 빌더
const where = buildWhereConditions({
  status: 'active',
  age: 25,
  city: 'Seoul'
}, 'AND');

// INSERT 값 빌더
const insert = buildInsertValues([
  { name: 'John', email: 'john@example.com' },
  { name: 'Jane', email: 'jane@example.com' }
]);

// UPDATE SET 빌더
const update = buildUpdateSet({
  status: 'inactive',
  updated_at: new Date()
});

// 페이지네이션
const pagination = createPagination(2, 20); // 2페이지, 20개씩
```

## 타입 안전성

### TypeScript 타입 지원

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
}

// 타입 안전한 쿼리
const users = await dbManager.query<User>(
  'SELECT * FROM users WHERE age > ?',
  [25]
);

if (users.success && users.data) {
  users.data.forEach((user: User) => {
    console.log(user.name, user.email);
  });
}

// 타입 안전한 쿼리 빌더
const typedResult = await queryBuilder
  .select(['id', 'name', 'email'])
  .from('users')
  .execute<User>();
```

## 테스트

```bash
# 테스트 실행
npm test

# 커버리지 포함 테스트
npm run test:coverage

# 특정 테스트 파일
npm test database.test.ts
```

## 라이센스

MIT License

## 지원

- 문서: [내부 문서 시스템]
- 이슈 리포트: [내부 이슈 트래커]
- 팀 채널: #database-support