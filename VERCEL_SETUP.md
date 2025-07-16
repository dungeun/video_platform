# Vercel 서비스 설정 가이드

## 1. Vercel Postgres 설정

1. [Vercel Dashboard](https://vercel.com/dashboard)에 로그인
2. "Storage" 탭 클릭
3. "Create Database" 클릭
4. "Postgres" 선택
5. 데이터베이스 이름 입력 (예: revu-platform-db)
6. Region 선택 (가장 가까운 지역)
7. "Create" 클릭

생성 후 제공되는 환경 변수:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL` (Prisma용)
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

## 2. Vercel KV (Redis) 설정

1. Vercel Dashboard의 "Storage" 탭에서
2. "Create Database" 클릭
3. "KV" 선택
4. KV 스토어 이름 입력 (예: revu-platform-kv)
5. Region 선택
6. "Create" 클릭

생성 후 제공되는 환경 변수:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

## 3. 환경 변수 설정

`.env` 파일에 다음과 같이 추가:

```env
# Vercel Postgres
DATABASE_URL="복사한 POSTGRES_PRISMA_URL 값"

# Vercel KV (Redis 대체)
KV_URL="복사한 KV_URL 값"
KV_REST_API_URL="복사한 KV_REST_API_URL 값"
KV_REST_API_TOKEN="복사한 KV_REST_API_TOKEN 값"
KV_REST_API_READ_ONLY_TOKEN="복사한 KV_REST_API_READ_ONLY_TOKEN 값"
```

## 4. 패키지 설치

```bash
pnpm add @vercel/postgres @vercel/kv
```

## 5. 코드 수정 필요 사항

- RedisManager를 Vercel KV를 사용하도록 수정
- rate-limit-redis 대신 메모리 스토어 사용 (또는 Vercel KV 어댑터 구현)