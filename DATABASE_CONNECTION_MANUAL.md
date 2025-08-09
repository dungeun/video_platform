# 데이터베이스 연결 매뉴얼

## 📋 개요
이 문서는 VideoPick 프로젝트의 Coolify PostgreSQL 데이터베이스 연결 방법을 설명합니다.

## 🔧 데이터베이스 정보

### Coolify PostgreSQL 서버
- **호스트 (외부)**: 141.164.60.51
- **포트 (외부)**: 5434
- **호스트 (Coolify 내부)**: m00wk0gg0kck804084wwwow0
- **포트 (내부)**: 5432
- **데이터베이스명**: postgres
- **사용자**: postgres
- **비밀번호**: REBYg9hnDdvw6gFMKwBPbnDIDclHKF4RHo9aIuAchefIqqxN6XOOOIKmyb89ItuK

### 관리자 계정
- **이메일**: admin@videopick.com
- **비밀번호**: admin123!@#
- **타입**: ADMIN

## 📁 환경 설정 파일

### 1. 로컬 개발용 (.env.local)
```env
# 로컬 개발 환경 설정
NODE_ENV=development
SKIP_DB_CONNECTION=false

# Coolify PostgreSQL 외부 연결 (포트 5434 사용)
DATABASE_URL="postgresql://postgres:REBYg9hnDdvw6gFMKwBPbnDIDclHKF4RHo9aIuAchefIqqxN6XOOOIKmyb89ItuK@141.164.60.51:5434/postgres?sslmode=disable"
POSTGRES_URL="postgresql://postgres:REBYg9hnDdvw6gFMKwBPbnDIDclHKF4RHo9aIuAchefIqqxN6XOOOIKmyb89ItuK@141.164.60.51:5434/postgres"
POSTGRES_PRISMA_URL="postgresql://postgres:REBYg9hnDdvw6gFMKwBPbnDIDclHKF4RHo9aIuAchefIqqxN6XOOOIKmyb89ItuK@141.164.60.51:5434/postgres"
POSTGRES_URL_NON_POOLING="postgresql://postgres:REBYg9hnDdvw6gFMKwBPbnDIDclHKF4RHo9aIuAchefIqqxN6XOOOIKmyb89ItuK@141.164.60.51:5434/postgres"
POSTGRES_HOST="141.164.60.51"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="REBYg9hnDdvw6gFMKwBPbnDIDclHKF4RHo9aIuAchefIqqxN6XOOOIKmyb89ItuK"
POSTGRES_DATABASE="postgres"

# JWT (개발용)
JWT_SECRET="development-jwt-secret-change-in-production"

# Next.js 설정
PORT=3004
NEXT_PUBLIC_API_URL=http://localhost:3004
NEXT_PUBLIC_APP_URL=http://localhost:3004
```

### 2. Coolify 프로덕션 환경 변수
Coolify 대시보드에서 다음 환경 변수들을 설정해야 합니다:

```env
DATABASE_URL=postgresql://postgres:REBYg9hnDdvw6gFMKwBPbnDIDclHKF4RHo9aIuAchefIqqxN6XOOOIKmyb89ItuK@m00wk0gg0kck804084wwwow0:5432/postgres
POSTGRES_URL=postgresql://postgres:REBYg9hnDdvw6gFMKwBPbnDIDclHKF4RHo9aIuAchefIqqxN6XOOOIKmyb89ItuK@m00wk0gg0kck804084wwwow0:5432/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:REBYg9hnDdvw6gFMKwBPbnDIDclHKF4RHo9aIuAchefIqqxN6XOOOIKmyb89ItuK@m00wk0gg0kck804084wwwow0:5432/postgres
POSTGRES_URL_NON_POOLING=postgresql://postgres:REBYg9hnDdvw6gFMKwBPbnDIDclHKF4RHo9aIuAchefIqqxN6XOOOIKmyb89ItuK@m00wk0gg0kck804084wwwow0:5432/postgres
POSTGRES_HOST=m00wk0gg0kck804084wwwow0
POSTGRES_USER=postgres
POSTGRES_PASSWORD=REBYg9hnDdvw6gFMKwBPbnDIDclHKF4RHo9aIuAchefIqqxN6XOOOIKmyb89ItuK
POSTGRES_DATABASE=postgres
JWT_SECRET=VideoPick2024!SuperSecretJWTKey#VideoPickProduction$
NODE_ENV=production
SKIP_DB_CONNECTION=false
REDIS_URL=redis://default:uu1SxljgYlrQpLlhIqXUn4GY1TNUuu81hk0IL0bDdT7WbuoDZ2JxUWITk9PVgQ2Q@bssgk8sogo8cgs4c4o0gkwkw:6379/0
KV_URL=redis://default:uu1SxljgYlrQpLlhIqXUn4GY1TNUuu81hk0IL0bDdT7WbuoDZ2JxUWITk9PVgQ2Q@bssgk8sogo8cgs4c4o0gkwkw:6379/0
NEXT_TELEMETRY_DISABLED=1
```

## 🚀 연결 테스트

### 1. 데이터베이스 연결 테스트
```bash
# 간단한 연결 테스트
node scripts/test-final.js

# Prisma 스키마 동기화
npx prisma db push
```

### 2. 로그인 테스트
```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 접속
http://localhost:3004

# 로그인 정보
이메일: admin@videopick.com
비밀번호: admin123!@#
```

### 3. API 테스트
```bash
# 로그인 API 테스트
curl -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@videopick.com","password":"admin123!@#"}'
```

## 🔍 문제 해결

### 포트 충돌 문제
- **증상**: 5432 포트 연결 실패
- **원인**: 다른 프로젝트가 동일 포트 사용 중
- **해결**: 5434 포트로 변경

### 인증 실패 문제
- **증상**: password authentication failed
- **원인**: 비밀번호 불일치
- **해결**: SSH로 접속하여 비밀번호 재설정
```sql
ALTER USER postgres PASSWORD 'REBYg9hnDdvw6gFMKwBPbnDIDclHKF4RHo9aIuAchefIqqxN6XOOOIKmyb89ItuK';
```

### 관리자 계정 생성
```javascript
// scripts/create-admin.js 실행
node scripts/create-admin.js
```

### 비밀번호 업데이트
```javascript
// scripts/update-admin-password.js 실행
node scripts/update-admin-password.js
```

## 📝 중요 참고사항

1. **포트 차이점**
   - 로컬 개발: 141.164.60.51:5434 (외부 접속)
   - Coolify 내부: m00wk0gg0kck804084wwwow0:5432 (Docker 네트워크)

2. **SKIP_DB_CONNECTION**
   - 반드시 `false`로 설정
   - `true`일 경우 mock 데이터 사용됨

3. **여러 프로젝트 동시 실행**
   - 서버에 여러 PostgreSQL 인스턴스 실행 중
   - 각 프로젝트별로 다른 포트 사용 필요

4. **Coolify 특징**
   - `.env` 파일 자동 생성/덮어쓰기
   - 환경 변수는 UI에서 관리
   - Docker Compose가 진실의 원천

## 📌 체크리스트

- [ ] `.env.local` 파일 생성
- [ ] DATABASE_URL에 포트 5434 설정
- [ ] SKIP_DB_CONNECTION=false 확인
- [ ] Coolify 환경 변수 설정
- [ ] 데이터베이스 연결 테스트
- [ ] 관리자 계정 생성
- [ ] 로그인 테스트

## 🔗 관련 파일
- `/scripts/test-final.js` - 연결 테스트 스크립트
- `/scripts/create-admin.js` - 관리자 계정 생성
- `/scripts/update-admin-password.js` - 비밀번호 업데이트
- `/.env.local` - 로컬 환경 변수
- `/COOLIFY_ENV_COMPLETE.txt` - Coolify 환경 변수 전체 목록