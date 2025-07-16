# @repo/cache

엔터프라이즈급 캐시 관리 모듈

## 특징

- 🚀 다양한 캐시 전략 지원 (LRU, LFU, FIFO)
- ⏱️ TTL(Time To Live) 기반 자동 만료
- 📊 캐시 통계 및 모니터링
- 🔄 이벤트 기반 캐시 무효화
- 🛡️ Zero Error Architecture

## 설치

```bash
pnpm add @repo/cache
```

## 기본 사용법

```typescript
import { createCacheManager } from '@repo/cache';

// 캐시 매니저 생성
const cache = createCacheManager({
  maxSize: 100,
  ttl: 60000, // 1분
  strategy: 'lru'
});

// 값 설정
await cache.set('user:1', { id: 1, name: 'John' });

// 값 조회
const user = await cache.get('user:1');

// 값 삭제
await cache.delete('user:1');
```

## 캐시 전략

### LRU (Least Recently Used)
```typescript
const lruCache = createCacheManager({
  strategy: 'lru',
  maxSize: 1000
});
```

### LFU (Least Frequently Used)
```typescript
const lfuCache = createCacheManager({
  strategy: 'lfu',
  maxSize: 1000
});
```

### FIFO (First In First Out)
```typescript
const fifoCache = createCacheManager({
  strategy: 'fifo',
  maxSize: 1000
});
```

## TTL 설정

```typescript
// 전역 TTL
const cache = createCacheManager({
  ttl: 5 * 60 * 1000 // 5분
});

// 개별 TTL
await cache.set('temp', 'data', { ttl: 60000 }); // 1분
```

## 네임스페이스

```typescript
// 네임스페이스별 캐시 관리
await cache.set('key', 'value', { namespace: 'users' });
const value = await cache.get('key', { namespace: 'users' });

// 네임스페이스 전체 삭제
await cache.clear('users');
```

## 태그 기반 무효화

```typescript
// 태그 설정
await cache.set('product:1', product1, { tags: ['products', 'category:1'] });
await cache.set('product:2', product2, { tags: ['products', 'category:2'] });

// 태그로 무효화
await cache.invalidateByTag('products'); // 모든 제품 캐시 삭제
await cache.invalidateByTag('category:1'); // 카테고리 1의 캐시만 삭제
```

## 이벤트 처리

```typescript
// 캐시 이벤트 구독
cache.on('set', (key, value) => {
  console.log(`캐시 설정: ${key}`);
});

cache.on('hit', (key) => {
  console.log(`캐시 히트: ${key}`);
});

cache.on('miss', (key) => {
  console.log(`캐시 미스: ${key}`);
});

cache.on('evict', (key, reason) => {
  console.log(`캐시 제거: ${key}, 이유: ${reason}`);
});
```

## 통계 및 모니터링

```typescript
// 캐시 통계 조회
const stats = await cache.getStats();
console.log({
  hitRate: stats.hitRate,
  missRate: stats.missRate,
  evictionCount: stats.evictionCount,
  size: stats.size,
  maxSize: stats.maxSize
});

// 캐시 성능 메트릭
const metrics = await cache.getMetrics();
```

## 메모리 관리

```typescript
// 메모리 사용량 확인
const memoryUsage = await cache.getMemoryUsage();

// 캐시 크기 조정
await cache.resize(500); // 최대 크기를 500으로 변경

// 수동 정리
await cache.prune(); // 만료된 항목 제거
```

## 고급 기능

### 캐시 워밍
```typescript
// 미리 캐시 로드
await cache.warm([
  { key: 'config', value: config },
  { key: 'translations', value: translations }
]);
```

### 캐시 직렬화
```typescript
// 캐시 내용 직렬화
const snapshot = await cache.serialize();

// 캐시 복원
await cache.deserialize(snapshot);
```

### 분산 캐시 (향후 지원)
```typescript
const distributedCache = createCacheManager({
  strategy: 'distributed',
  nodes: ['redis://node1', 'redis://node2']
});
```

## TypeScript 지원

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// 타입 안전 캐시
const userCache = createCacheManager<User>();

await userCache.set('user:1', {
  id: 1,
  name: 'John',
  email: 'john@example.com'
});

const user = await userCache.get('user:1');
if (user.success && user.data) {
  console.log(user.data.name); // 타입 안전
}
```