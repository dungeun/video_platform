# 📹 VideoPick Platform PRD 2025

## 📋 목차
1. [제품 개요](#1-제품-개요)
2. [프로젝트 현황](#2-프로젝트-현황)
3. [기술 아키텍처](#3-기술-아키텍처)
4. [핵심 기능](#4-핵심-기능)
5. [개발 계획](#5-개발-계획)
6. [로컬 개발 가이드](#6-로컬-개발-가이드)
7. [배포 전략](#7-배포-전략)
8. [성공 지표](#8-성공-지표)

---

## 1. 제품 개요

### 1.1 프로젝트 정보
- **제품명**: VideoPick (구 LinkPick 재활용)
- **버전**: 1.0.0 (MVP)
- **목표**: YouTube형 동영상 플랫폼 + 라이브 스트리밍
- **대상**: 한국 시장 우선, 글로벌 확장 준비

### 1.2 핵심 가치 제안
- 🎬 **통합 플랫폼**: VOD + 라이브 스트리밍 일원화
- 💰 **수익화**: 다양한 수익 모델 (광고, 구독, 후원)
- 🚀 **저지연**: WebRTC 기반 0.5초 미만 지연
- ♻️ **기존 코드 80% 재사용**: LinkPick 인프라 활용

### 1.3 현재 상태
- **코드베이스**: LinkPick 플랫폼 (인플루언서 마케팅)
- **완료된 작업**:
  - ✅ package.json 이름 변경 (videopick-web)
  - ✅ 환경변수 설정 (DB, Redis, JWT)
  - ✅ 비디오 관련 환경변수 추가
  - ✅ 도메인 설정 (video.one-q.xyz)

## 2. 프로젝트 현황

### 2.1 재사용 가능한 자산
```yaml
✅ 100% 재사용:
  - 관리자 시스템 (AdminLayout, 대시보드, 사용자/결제 관리)
  - 인증 시스템 (JWT, 로그인/회원가입)
  - 인프라 (Next.js 14, Prisma, Redis, 파일 업로드)
  - UI 컴포넌트 (레이아웃, 폼, 모달, 테이블)

🔄 80% 재사용 (수정 필요):
  - 비즈니스 로직 (Campaign → Video)
  - 사용자 타입 (BUSINESS → CREATOR, INFLUENCER → VIEWER)
  - API 라우트 (/campaigns → /videos)
  - 홈페이지 섹션 (캠페인 → 비디오 중심)

🆕 새로 추가:
  - 비디오 플레이어
  - 라이브 스트리밍 UI
  - 실시간 채팅
  - 구독 시스템
```

### 2.2 기술 스택
```yaml
Frontend:
  - Next.js 14.2.0 (App Router)
  - React 18.3.1
  - TypeScript
  - Tailwind CSS
  - Radix UI

Backend:
  - Prisma ORM (PostgreSQL)
  - Redis (캐싱)
  - JWT 인증
  - Toss Payments

Infrastructure:
  - Database: PostgreSQL (Coolify)
  - Cache: Redis (Coolify)
  - Storage: S3 호환 (Vultr 예정)
  - Streaming: Ant Media Server (예정)
```

## 3. 기술 아키텍처

### 3.1 시스템 구성도
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  PostgreSQL     │────▶│     Redis       │
│  (video.one-q)  │     │   (Coolify)     │     │   (Coolify)     │
└────────┬────────┘     └─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Ant Media Server│────▶│ Vultr Storage   │────▶│      CDN        │
│  (스트리밍)     │     │  (S3 호환)      │     │   (비디오)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 3.2 데이터 모델 확장
```prisma
// 기존 모델 확장
model User {
  // 기존 필드 유지
  type String // ADMIN, CREATOR, VIEWER로 변경
  
  // 추가 관계
  channel Channel?
  videos Video[]
  subscriptions Subscription[]
}

// Campaign → Video 변환
model Video {
  id String @id
  title String
  description String
  thumbnailUrl String
  videoUrl String // 새 필드
  duration Int?
  viewCount Int @default(0)
  
  // 라이브 관련
  isLive Boolean @default(false)
  streamKey String?
  
  // 기존 관계 유지
  userId String
  user User @relation(...)
  comments Comment[]
}

// 새 모델 추가
model Channel {
  id String @id
  name String
  description String?
  userId String @unique
  user User @relation(...)
  
  subscribers Subscription[]
  videos Video[]
}
```

## 4. 핵심 기능

### 4.1 Phase 1: MVP (4주)

#### Week 1: Backend 기반 전환
- [ ] 데이터베이스 스키마 확장 (Video, Channel 모델)
- [ ] API 라우트 확장 (/api/videos, /api/streams)
- [ ] 파일 업로드 시스템 비디오 지원
- [ ] 기본 비디오 메타데이터 관리

#### Week 2: Frontend UI 전환
- [ ] 홈페이지를 비디오 중심으로 변경
- [ ] CampaignCard → VideoCard 컴포넌트 변환
- [ ] 비디오 상세 페이지 구현
- [ ] 기본 비디오 플레이어 통합 (HTML5)

#### Week 3: 크리에이터 도구
- [ ] /business → /studio 라우트 변경
- [ ] 비디오 업로드 폼 구현
- [ ] 크리에이터 대시보드 수정
- [ ] 기본 분석 통계

#### Week 4: 통합 및 테스트
- [ ] 검색/필터 시스템 수정
- [ ] 추천 알고리즘 기본 구현
- [ ] 성능 최적화
- [ ] 버그 수정 및 QA

### 4.2 Phase 2: 라이브 스트리밍 (4주)
- Ant Media Server 통합
- WebRTC 플레이어
- 실시간 채팅 (Appwrite)
- 라이브 녹화 및 VOD 변환

### 4.3 Phase 3: 수익화 (4주)
- 광고 시스템
- 채널 구독
- Super Chat
- 크리에이터 정산

## 5. 개발 계획

### 5.1 즉시 실행 (Day 1-2)
```bash
# 1. 로컬 환경 설정
npm install
cp .env.local.example .env.local

# 2. 데이터베이스 마이그레이션
npx prisma generate
npx prisma db push

# 3. 개발 서버 실행
npm run dev
```

### 5.2 주차별 마일스톤
```yaml
Week 1-2: 기본 전환
  - 목표: 비디오 업로드 및 재생 가능
  - 검증: 로컬에서 비디오 CRUD 작동

Week 3-4: UI/UX 개선
  - 목표: 사용자 친화적 인터페이스
  - 검증: 5명 베타 테스터 피드백

Week 5-6: 스트리밍 준비
  - 목표: Ant Media 테스트 환경
  - 검증: 로컬 스트리밍 성공

Week 7-8: 프로덕션 준비
  - 목표: Coolify 배포 완료
  - 검증: 실제 도메인 접속 가능
```

## 6. 로컬 개발 가이드

### 6.1 환경 설정
```bash
# .env.local 설정
DATABASE_URL="postgresql://user:password@localhost:5432/videopick"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="local-development-secret"
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Feature Flags (로컬은 모두 활성화)
ENABLE_VIDEO_UPLOAD="true"
ENABLE_VIDEO_PLAYER="true"
SHOW_VIDEO_TAB="true"
```

### 6.2 개발 명령어
```bash
# 데이터베이스
npm run db:generate    # Prisma 클라이언트 생성
npm run db:push       # 스키마 동기화
npm run db:seed       # 샘플 데이터

# 개발
npm run dev           # 개발 서버 (자동 포트)
npm run build         # 프로덕션 빌드
npm run lint          # 코드 검사
npm run type-check    # 타입 체크
```

### 6.3 테스트 시나리오
1. **회원가입/로그인**: 기존 시스템 사용
2. **비디오 업로드**: /studio/upload
3. **비디오 시청**: /video/[id]
4. **채널 페이지**: /channel/[id]

## 7. 배포 전략

### 7.1 인프라 구성
```yaml
Phase 1 (MVP):
  - Coolify: Next.js, PostgreSQL, Redis
  - 비용: 기존 인프라 사용 ($0)

Phase 2 (스트리밍):
  - Ant Media Server: $20/월
  - Vultr Storage: $5/월
  - 추가 비용: $25/월

Phase 3 (스케일):
  - CDN: $50/월
  - 추가 서버: $100/월
  - 총 비용: ~$175/월
```

### 7.2 배포 체크리스트
- [ ] 도메인 설정 (video.one-q.xyz)
- [ ] SSL 인증서
- [ ] 환경변수 설정
- [ ] 데이터베이스 마이그레이션
- [ ] 파일 스토리지 설정
- [ ] 모니터링 설정

## 8. 성공 지표

### 8.1 기술 지표 (4주차)
- ✅ 코드 재사용률: 80% 이상
- ✅ 페이지 로드 시간: 3초 미만
- ✅ API 응답 시간: 200ms 미만
- ✅ 동시 접속자: 100명 지원

### 8.2 비즈니스 지표 (3개월)
- 월간 활성 사용자: 1,000명
- 업로드된 비디오: 500개
- 일일 시청 시간: 1,000시간
- 크리에이터 가입: 50명

### 8.3 마일스톤
```yaml
Month 1: MVP 출시
  - 기본 비디오 플랫폼 작동
  - 10명의 크리에이터 확보

Month 2: 라이브 추가
  - 라이브 스트리밍 베타
  - 첫 라이브 이벤트

Month 3: 수익화 시작
  - 광고 시스템 도입
  - 첫 크리에이터 정산
```

## 📌 핵심 원칙

### DO ✅
- 기존 코드 최대한 재사용
- 점진적 기능 추가
- 사용자 피드백 우선
- 안정성 우선

### DON'T ❌
- 대규모 리팩토링
- 과도한 최적화
- 복잡한 기능 우선
- 완벽주의

---

**다음 단계**: 로컬 환경에서 Week 1 작업 시작 → 데이터베이스 스키마 확장 → API 라우트 구현