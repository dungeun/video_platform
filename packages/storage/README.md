# @repo/storage

엔터프라이즈급 스토리지 관리 모듈

## 특징

- 🗄️ 다양한 스토리지 프로바이더 지원 (LocalStorage, SessionStorage, Memory, IndexedDB)
- ⏱️ TTL(Time To Live) 기반 자동 만료
- 🔍 강력한 쿼리 시스템
- 📊 실시간 스토리지 통계
- 🔄 이벤트 기반 변경 감지
- 🛡️ Zero Error Architecture

## 설치

```bash
pnpm add @repo/storage
```

## 기본 사용법

```typescript
import { createStorageManager } from '@repo/storage';

// 스토리지 매니저 생성
const storage = createStorageManager({
  defaultProvider: 'local',
  namespace: 'myapp',
  ttl: 24 * 60 * 60 * 1000 // 24시간
});

// 값 저장
await storage.set('user', { id: 1, name: 'John Doe' });

// 값 조회
const user = await storage.get('user');

// 값 삭제
await storage.delete('user');
```

## 프로바이더별 사용

```typescript
// LocalStorage 사용
await storage.set('key', 'value', { provider: 'local' });

// SessionStorage 사용
await storage.set('key', 'value', { provider: 'session' });

// Memory Storage 사용
await storage.set('key', 'value', { provider: 'memory' });

// 직접 접근
await storage.local.set('key', 'value');
await storage.session.set('key', 'value');
await storage.memory.set('key', 'value');
```

## TTL 설정

```typescript
// 5분 후 자동 만료
await storage.set('temp', 'data', { 
  ttl: 5 * 60 * 1000 
});

// 특정 시간에 만료
const expiresAt = new Date('2024-12-31');
await storage.set('seasonal', 'data', { 
  ttl: expiresAt.getTime() - Date.now() 
});
```

## 배치 작업

```typescript
// 여러 값 저장
const entries = new Map([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3']
]);
await storage.setMany(entries);

// 여러 값 조회
const keys = ['key1', 'key2', 'key3'];
const values = await storage.getMany(keys);

// 여러 값 삭제
await storage.deleteMany(keys);
```

## 쿼리 시스템

```typescript
// 프리픽스로 검색
const keys = await storage.keys({ 
  prefix: 'user:' 
});

// 태그로 검색
const values = await storage.values({ 
  tags: ['important', 'active'] 
});

// 날짜 범위로 검색
const entries = await storage.entries({
  afterDate: new Date('2024-01-01'),
  beforeDate: new Date('2024-12-31'),
  limit: 10,
  offset: 0
});
```

## 네임스페이스

```typescript
// 네임스페이스별 저장
await storage.set('config', data, { 
  namespace: 'settings' 
});

// 네임스페이스별 조회
const config = await storage.get('config', { 
  namespace: 'settings' 
});

// 네임스페이스 전체 삭제
await storage.clear('settings');
```

## 이벤트 처리

```typescript
// 이벤트 리스너 등록
const unsubscribe = storage.addEventListener((event) => {
  console.log('Storage event:', {
    type: event.type,
    key: event.key,
    oldValue: event.oldValue,
    newValue: event.newValue
  });
});

// 리스너 제거
unsubscribe();
```

## 통계 및 모니터링

```typescript
// 스토리지 통계
const stats = await storage.getStats();
console.log('Storage stats:', stats);

// 특정 프로바이더 통계
const localStats = await storage.getStats('local');

// 스토리지 크기
const size = await storage.size();
console.log(`Total size: ${size} bytes`);

// 브라우저 스토리지 할당량
import { estimateStorageQuota } from '@repo/storage';

const quota = await estimateStorageQuota();
if (quota) {
  console.log(`사용량: ${quota.usage} / ${quota.quota} (${quota.percent}%)`);
}
```

## 메모리 스토리지 설정

```typescript
import { createStorageManager, EvictionPolicy } from '@repo/storage';

const storage = createStorageManager({
  providers: {
    memory: {
      maxSize: 50 * 1024 * 1024, // 50MB
      evictionPolicy: EvictionPolicy.LRU,
      ttl: 60 * 60 * 1000 // 1시간
    }
  }
});
```

## 시리얼라이저

```typescript
import { StorageSerializer } from '@repo/storage';

const serializer = new StorageSerializer();

// 특수 타입 지원
const data = {
  date: new Date(),
  regex: /pattern/gi,
  map: new Map([['key', 'value']]),
  set: new Set([1, 2, 3]),
  buffer: new Uint8Array([1, 2, 3])
};

// 직렬화
const serialized = serializer.serialize(data);

// 역직렬화
const deserialized = serializer.deserialize(serialized);
```

## 스토리지 지속성

```typescript
import { requestPersistentStorage, isStoragePersistent } from '@repo/storage';

// 지속성 요청
const granted = await requestPersistentStorage();
if (granted) {
  console.log('스토리지 지속성이 허용되었습니다');
}

// 지속성 확인
const isPersistent = await isStoragePersistent();
console.log('지속성 상태:', isPersistent);
```

## 에러 처리

```typescript
// 모든 메소드는 Result 타입을 반환
const result = await storage.set('key', 'value');

if (result.success) {
  console.log('저장 성공');
} else {
  console.error('저장 실패:', result.error);
}
```

## TypeScript 지원

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// 타입 안전 저장/조회
await storage.set<User>('user', {
  id: 1,
  name: 'John',
  email: 'john@example.com'
});

const result = await storage.get<User>('user');
if (result.success && result.data) {
  console.log(result.data.name); // 타입 안전
}
```