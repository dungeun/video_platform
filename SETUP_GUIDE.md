# REVU Platform 실행 가이드

## 🚀 빠른 시작

### 1단계: 필수 프로그램 설치 확인

```bash
# Node.js 버전 확인 (18 이상 필요)
node --version

# Docker 실행 여부 확인
docker --version
docker-compose --version

# pnpm 설치 (없는 경우)
npm install -g pnpm
```

### 2단계: 프로젝트 설정

```bash
# 프로젝트 디렉토리로 이동
cd revu-platform-integrated

# 의존성 설치
pnpm install

# 환경 변수 설정 (.env 파일이 이미 생성되어 있음)
# 필요시 .env 파일 수정
```

### 3단계: 데이터베이스 실행

```bash
# PostgreSQL과 Redis 실행
pnpm db:up

# 또는 직접 실행
docker-compose up -d

# 실행 확인
docker ps
```

### 4단계: 데이터베이스 초기화

```bash
# Prisma 클라이언트 생성
cd apps/api
npx prisma generate

# 데이터베이스 마이그레이션
npx prisma migrate dev

# 루트 디렉토리로 돌아가기
cd ../..
```

### 5단계: 서버 실행

**방법 1: 동시 실행 (권장)**
```bash
# API와 Web을 동시에 실행
pnpm start:all
```

**방법 2: 개별 실행**
```bash
# 터미널 1: API 서버
pnpm start:api

# 터미널 2: 웹 애플리케이션
pnpm start:web
```

### 6단계: 접속 확인

- 웹사이트: http://localhost:3000
- API 문서: http://localhost:4000/health

## 🧪 테스트 로그인

### 인플루언서 계정
- 이메일: `influencer@example.com`
- 비밀번호: `test1234`

### 비즈니스 계정
- 이메일: `business@example.com`
- 비밀번호: `test1234`

### 관리자 계정
- 이메일: `admin@example.com`
- 비밀번호: `admin1234`

## 🛠️ 문제 해결

### 포트 충돌 오류
```bash
# 3000 또는 4000 포트 사용 중인 프로세스 확인
lsof -i :3000
lsof -i :4000

# 프로세스 종료
kill -9 <PID>
```

### 데이터베이스 연결 오류
```bash
# Docker 컨테이너 상태 확인
docker-compose ps

# PostgreSQL 로그 확인
docker-compose logs postgres

# 컨테이너 재시작
docker-compose restart postgres
```

### Redis 연결 오류
```bash
# Redis 상태 확인
docker-compose logs redis

# Redis CLI로 확인
docker exec -it revu_redis redis-cli ping
# PONG이 나오면 정상
```

### 의존성 설치 오류
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
rm -rf apps/*/node_modules
pnpm install
```

## 📝 개발 팁

### 데이터베이스 초기화
```bash
# 모든 데이터 삭제 후 재생성
cd apps/api
npx prisma migrate reset
```

### 로그 확인
```bash
# API 서버 로그
tail -f apps/api/logs/all.log

# 에러 로그만
tail -f apps/api/logs/error.log
```

### 데이터베이스 GUI 접속
- pgAdmin: http://localhost:5050
- 이메일: `admin@revu.com`
- 비밀번호: `admin`

## 🔄 서버 종료

```bash
# 실행 중인 서버 종료
Ctrl + C

# Docker 컨테이너 종료
pnpm db:down
```