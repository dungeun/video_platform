# REVU Platform - 인플루언서 마케팅 플랫폼

50개 이상의 모듈을 100% 활용하여 구축된 종합 인플루언서 마케팅 플랫폼입니다.

## 🚀 주요 기능

- **인플루언서**: 캠페인 참여, 콘텐츠 제작, 수익 관리
- **비즈니스**: 캠페인 생성, 인플루언서 매칭, 성과 분석
- **관리자**: 플랫폼 모니터링, 사용자 관리, 시스템 관리

## 📋 사전 요구사항

- Node.js 18+ 
- Docker & Docker Compose
- pnpm (권장) 또는 npm

## 🛠️ 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd revu-platform-integrated
```

### 2. 의존성 설치
```bash
pnpm install
# 또는
npm install
```

### 3. 환경 변수 설정
```bash
# .env.example을 복사하여 .env 생성
cp .env.example .env

# .env 파일을 열어 필요한 값 수정
```

### 4. 데이터베이스 및 Redis 실행
```bash
docker-compose up -d
```

### 5. 데이터베이스 마이그레이션
```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
```

### 6. 서버 실행

**개발 모드:**
```bash
# 터미널 1 - API 서버
cd apps/api
pnpm dev

# 터미널 2 - 웹 애플리케이션
cd apps/web
pnpm dev
```

**프로덕션 빌드:**
```bash
# 전체 빌드
pnpm build

# API 서버 실행
cd apps/api
pnpm start

# 웹 애플리케이션 실행
cd apps/web
pnpm start
```

## 🌐 접속 정보

- **웹 애플리케이션**: http://localhost:3000
- **API 서버**: http://localhost:4000
- **pgAdmin**: http://localhost:5050 (admin@revu.com / admin)

## 🧪 테스트 계정

### 인플루언서
- 이메일: influencer@example.com
- 비밀번호: test1234

### 비즈니스
- 이메일: business@example.com
- 비밀번호: test1234

### 관리자
- 이메일: admin@example.com
- 비밀번호: admin1234

## 📁 프로젝트 구조

```
revu-platform-integrated/
├── apps/
│   ├── api/               # Express.js 백엔드 서버
│   │   ├── src/
│   │   │   ├── core/      # 핵심 모듈 (Orchestrator, DB, Redis)
│   │   │   ├── modules/   # 비즈니스 모듈 (Auth, Campaign, etc.)
│   │   │   ├── middleware/ # 미들웨어 (보안, 로깅, 검증)
│   │   │   └── utils/     # 유틸리티
│   │   └── prisma/        # 데이터베이스 스키마
│   └── web/               # Next.js 프론트엔드
│       └── src/
│           ├── app/       # 페이지 및 라우트
│           ├── components/# 컴포넌트
│           └── lib/       # 유틸리티 및 API 클라이언트
├── packages/              # 공유 패키지
└── docker-compose.yml     # Docker 설정
```

## 🔧 주요 기술 스택

### Backend
- **Express.js** - 웹 프레임워크
- **Prisma** - ORM
- **PostgreSQL** - 메인 데이터베이스
- **Redis** - 캐싱 및 세션
- **Socket.IO** - 실시간 통신
- **JWT** - 인증
- **Winston** - 로깅

### Frontend
- **Next.js 14** - React 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **50+ 모듈** - UI, 인증, 상태관리 등

### Security
- **Helmet** - 보안 헤더
- **CORS** - 교차 출처 리소스 공유
- **Rate Limiting** - API 요청 제한
- **Input Validation** - 입력 검증
- **XSS/SQL Injection 방지**

## 🚦 API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보

### 캠페인
- `GET /api/campaigns` - 캠페인 목록
- `POST /api/campaigns` - 캠페인 생성
- `GET /api/campaigns/:id` - 캠페인 상세
- `POST /api/campaigns/:id/apply` - 캠페인 지원

### 알림
- `GET /api/notifications` - 알림 목록
- `PUT /api/notifications/:id/read` - 읽음 처리

## 📝 개발 가이드

### 새 모듈 추가
1. `apps/api/src/modules/` 디렉토리에 모듈 생성
2. Adapter, Service, Router 구현
3. ModuleOrchestrator에 등록

### 데이터베이스 변경
```bash
# 스키마 수정 후
cd apps/api
npx prisma migrate dev --name <migration-name>
```

## 🐛 문제 해결

### 포트 충돌
```bash
# 사용 중인 포트 확인
lsof -i :4000
lsof -i :3000

# 프로세스 종료
kill -9 <PID>
```

### 데이터베이스 연결 실패
```bash
# Docker 컨테이너 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs postgres
```

## 📄 라이센스

MIT License