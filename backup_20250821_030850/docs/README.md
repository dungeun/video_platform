# 📺 비디오픽 (VideoPick) - 프로젝트 문서

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [주요 기능](#주요-기능)
4. [기술 스택](#기술-스택)
5. [문서 목록](#문서-목록)

## 프로젝트 개요

**비디오픽**은 YouTube 콘텐츠를 통합 관리하고 사용자에게 큐레이션된 비디오 경험을 제공하는 플랫폼입니다.

### 핵심 가치
- 🎬 YouTube 비디오 통합 관리
- 👥 다중 사용자 유형 지원 (일반/크리에이터/비즈니스)
- 🎨 동적 UI 커스터마이징
- 📊 실시간 데이터 분석
- 🔒 엔터프라이즈급 보안

### 대상 사용자
- **일반 사용자**: 비디오 시청 및 구독
- **크리에이터**: 콘텐츠 제작 및 수익화
- **비즈니스**: 광고 캠페인 및 마케팅
- **관리자**: 플랫폼 운영 및 관리

## 시스템 아키텍처

```
┌─────────────────────────────────────────┐
│           Frontend (Next.js 14)          │
│  - App Router                            │
│  - Server/Client Components              │
│  - Tailwind CSS                          │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│          API Layer (Next.js API)         │
│  - RESTful APIs                          │
│  - Authentication Middleware             │
│  - Rate Limiting                         │
└─────────────────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                      ▼
┌──────────────────┐  ┌──────────────────┐
│   PostgreSQL     │  │  External APIs    │
│   (Prisma ORM)   │  │  - YouTube API    │
│                  │  │  - Analytics      │
└──────────────────┘  └──────────────────┘
```

## 주요 기능

### 1. 사용자 시스템
- 다중 사용자 타입 (USER, CREATOR, BUSINESS, ADMIN)
- JWT 기반 인증
- 역할 기반 접근 제어 (RBAC)
- 프로필 관리

### 2. 비디오 관리
- YouTube 비디오 임포트
- 메타데이터 관리
- 카테고리 분류
- 추천 알고리즘

### 3. 관리자 시스템
- UI 섹션 동적 관리
- 사용자 관리
- 콘텐츠 모더레이션
- 분석 대시보드

### 4. 비즈니스 기능
- 캠페인 관리
- 광고 시스템
- 수익화 도구
- 분석 리포트

## 기술 스택

### Frontend
- **Framework**: Next.js 14.2 (App Router)
- **언어**: TypeScript 5.x
- **스타일링**: Tailwind CSS 3.4
- **상태관리**: Zustand
- **UI 컴포넌트**: Radix UI, Headless UI
- **폼 관리**: React Hook Form
- **유효성 검사**: Zod

### Backend
- **Runtime**: Node.js 20.x
- **API**: Next.js API Routes
- **ORM**: Prisma 5.x
- **데이터베이스**: PostgreSQL 16
- **인증**: JWT (jsonwebtoken)
- **파일 업로드**: Multer
- **로깅**: Winston

### DevOps
- **배포**: Coolify (Self-hosted)
- **컨테이너**: Docker
- **CI/CD**: GitHub Actions
- **모니터링**: 내장 로깅 시스템

## 문서 목록

### 📚 상세 문서

1. **[프로젝트 구조](./PROJECT_STRUCTURE.md)** - 전체 폴더 구조 및 파일 설명
2. **[관리자 시스템](./ADMIN_SYSTEM.md)** - 관리자 기능 상세 가이드
3. **[사용자 시스템](./USER_SYSTEM.md)** - 사용자 인증 및 권한 관리
4. **[API 문서](./API_DOCUMENTATION.md)** - 모든 API 엔드포인트 명세
5. **[데이터베이스 스키마](./DATABASE_SCHEMA.md)** - Prisma 모델 및 관계도
6. **[UI 섹션 관리](./UI_SECTION_MANAGEMENT.md)** - 동적 UI 관리 시스템
7. **[YouTube 임포트](./YOUTUBE_IMPORT_SYSTEM.md)** - YouTube 비디오 통합
8. **[로깅 시스템](./LOGGING_SYSTEM.md)** - 로그 관리 및 모니터링
9. **[환경 변수 가이드](./ENV_VARS_GUIDE.md)** - 환경 설정 가이드
10. **[Coolify 배포](./🚀_COOLIFY_SETUP.md)** - 배포 및 운영 가이드
11. **[데이터베이스 보안](./database-security.md)** - DB 보안 설정

### 🚀 빠른 시작

```bash
# 1. 저장소 클론
git clone https://github.com/yourusername/video_platform.git
cd video_platform

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 편집

# 4. 데이터베이스 마이그레이션
npx prisma migrate dev

# 5. 개발 서버 실행
npm run dev
```

### 📝 개발 가이드

- [개발 환경 설정](./DEVELOPMENT_SETUP.md)
- [코딩 컨벤션](./CODING_CONVENTIONS.md)
- [Git 워크플로우](./GIT_WORKFLOW.md)
- [테스팅 가이드](./TESTING_GUIDE.md)

### 🔧 운영 가이드

- [배포 프로세스](./DEPLOYMENT_PROCESS.md)
- [모니터링 및 로깅](./MONITORING.md)
- [백업 및 복구](./BACKUP_RECOVERY.md)
- [성능 최적화](./PERFORMANCE_OPTIMIZATION.md)

## 연락처

- **프로젝트 관리자**: admin@videopick.com
- **기술 지원**: support@videopick.com
- **GitHub**: https://github.com/videopick

---

최종 업데이트: 2024년 1월