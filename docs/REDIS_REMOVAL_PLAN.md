# 🔴 Redis 제거 계획

## 📊 현재 Redis 사용 현황

### 1. Redis 사용 위치
- **캐시 시스템**: `src/lib/cache.ts`, `src/lib/cache/`
- **데이터베이스 연결**: `src/lib/db/redis.ts`
- **환경 설정**: `.env` 파일들, `docker-compose.dev.yml`
- **패키지 의존성**: `package.json` - ioredis

### 2. Redis 사용 목적
1. **캐싱**: API 응답, 데이터베이스 쿼리 결과
2. **세션 관리**: 사용자 세션 저장 (현재는 JWT 사용)
3. **임시 데이터 저장**: 단기 데이터 저장

### 3. 현재 구현 특징
- **폴백 메커니즘**: Redis 없이도 작동 (MockRedis, memoryCache)
- **DISABLE_REDIS 플래그**: 이미 Redis 비활성화 옵션 존재
- **개발 환경**: 기본적으로 Redis 없이 작동

## 🎯 제거 영향 분석

### 긍정적 영향
1. **인프라 단순화**: Redis 서버 관리 불필요
2. **비용 절감**: Redis 서버 비용 제거
3. **배포 간소화**: 의존성 감소
4. **개발 환경 설정 간소화**: Redis 설치 불필요

### 부정적 영향
1. **성능**: 캐싱 없이 데이터베이스 직접 접근
2. **확장성**: 멀티 서버 환경에서 캐시 공유 불가
3. **세션 관리**: 서버 재시작 시 메모리 캐시 손실

## 🛠️ 제거 계획

### Phase 1: 코드 정리 (즉시)

#### 1. 캐시 시스템 단순화
```typescript
// src/lib/cache.ts - 메모리 캐시만 사용하도록 수정
export class SimpleCacheManager {
  private memoryCache = new Map<string, { value: any; expires: number }>();
  
  async get<T>(key: string): Promise<T | null> {
    const cached = this.memoryCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }
    return null;
  }
  
  async set<T>(key: string, value: T, ttl = 3600): Promise<void> {
    this.memoryCache.set(key, {
      value,
      expires: Date.now() + ttl * 1000
    });
  }
}
```

#### 2. Redis 관련 파일 제거
- `src/lib/db/redis.ts` - 삭제
- `src/lib/cache/redis-client.ts` - 삭제
- `src/lib/cache/cache-service.ts` - 메모리 캐시로 대체

#### 3. import 문 정리
- Redis/ioredis import 제거
- cache import 경로 수정

### Phase 2: 환경 설정 (1일)

#### 1. 환경 변수 제거
```bash
# 제거할 환경 변수
REDIS_URL
REDIS_HOST
REDIS_PORT
REDIS_PASSWORD
REDIS_DB
DISABLE_REDIS
```

#### 2. Docker 설정 수정
```yaml
# docker-compose.dev.yml에서 redis 서비스 제거
services:
  # redis: 제거
```

#### 3. 패키지 제거
```bash
npm uninstall ioredis
npm uninstall @types/ioredis
```

### Phase 3: 대체 구현 (2-3일)

#### 1. 세션 관리
- JWT 토큰만 사용 (이미 구현됨)
- 리프레시 토큰은 데이터베이스에 저장

#### 2. 캐싱 전략
- **짧은 TTL**: 메모리 캐시 사용 (현재 구현)
- **긴 TTL**: 데이터베이스 캐시 테이블 고려
- **정적 데이터**: Next.js 빌트인 캐싱 활용

#### 3. 성능 최적화
- 데이터베이스 쿼리 최적화
- 인덱스 추가
- Next.js 캐싱 활용 (ISR, SSG)

## 📋 체크리스트

### 코드 변경
- [ ] `src/lib/cache.ts` 단순화
- [ ] `src/lib/db/redis.ts` 제거
- [ ] `src/lib/cache/redis-client.ts` 제거
- [ ] `src/lib/cache/cache-service.ts` 수정
- [ ] `src/lib/cache/index.ts` exports 수정
- [ ] import 문 전체 수정

### 설정 파일
- [ ] `.env.local.example` Redis 설정 제거
- [ ] `.env.video` Redis 설정 제거
- [ ] `COOLIFY_ENV_VARS.txt` Redis 설정 제거
- [ ] `COOLIFY_ENV_VARS_VIDEO.txt` Redis 설정 제거
- [ ] `docker-compose.dev.yml` redis 서비스 제거

### 문서 업데이트
- [ ] `README.md` Redis 요구사항 제거
- [ ] `DEPLOYMENT.md` Redis 설정 제거
- [ ] 기타 문서에서 Redis 참조 제거

### 패키지 정리
- [ ] `package.json`에서 ioredis 제거
- [ ] node_modules 재설치

## 🚀 실행 순서

1. **백업**: 현재 코드 백업
2. **캐시 코드 수정**: SimpleCacheManager로 대체
3. **Redis 파일 제거**: 불필요한 파일 삭제
4. **Import 수정**: 전체 프로젝트에서 import 경로 수정
5. **환경 변수 정리**: Redis 관련 설정 제거
6. **테스트**: 기능 테스트
7. **성능 모니터링**: 캐시 제거 후 성능 확인

## 💡 대안

### 향후 캐싱이 필요한 경우
1. **Vercel KV**: Vercel 플랫폼 사용 시
2. **Upstash Redis**: 서버리스 Redis
3. **Database 캐시 테이블**: PostgreSQL 내 캐시 테이블
4. **CDN 캐싱**: 정적 콘텐츠용

## ⚠️ 주의사항

1. **개발/스테이징 환경 먼저 테스트**
2. **성능 모니터링 필수**
3. **롤백 계획 준비**
4. **사용자 세션 영향 최소화**