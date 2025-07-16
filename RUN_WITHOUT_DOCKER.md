# Docker 없이 실행하기

Docker를 사용할 수 없는 환경에서 애플리케이션을 실행하는 방법입니다.

## 옵션 1: 로컬 PostgreSQL과 Redis 설치

### macOS (Homebrew 사용)
```bash
# PostgreSQL 설치
brew install postgresql@15
brew services start postgresql@15

# Redis 설치
brew install redis
brew services start redis
```

### 데이터베이스 생성
```bash
# PostgreSQL 접속
psql postgres

# 데이터베이스 생성
CREATE DATABASE revu_platform;
CREATE USER postgres WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE revu_platform TO postgres;
\q
```

## 옵션 2: 인메모리 데이터베이스 사용 (개발용)

### SQLite로 변경
1. `.env` 파일 수정:
```env
DATABASE_URL="file:./dev.db"
```

2. `apps/api/prisma/schema.prisma` 수정:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

3. Prisma 재생성:
```bash
cd apps/api
npx prisma generate
npx prisma db push
```

### Redis 대신 메모리 캐시 사용
`apps/api/src/config/redis.ts` 파일을 수정하여 메모리 캐시를 사용하도록 변경할 수 있습니다.

## 옵션 3: 클라우드 서비스 사용

### Supabase (PostgreSQL)
1. https://supabase.com 에서 무료 프로젝트 생성
2. Settings > Database에서 연결 문자열 복사
3. `.env` 파일에 설정

### Upstash (Redis)
1. https://upstash.com 에서 무료 Redis 인스턴스 생성
2. 연결 정보를 `.env` 파일에 설정

## 테스트 실행 (데이터베이스 없이)

API 서버를 목 데이터 모드로 실행:
```bash
cd apps/api
MOCK_MODE=true pnpm dev
```

웹 애플리케이션만 실행:
```bash
cd apps/web
pnpm dev
```