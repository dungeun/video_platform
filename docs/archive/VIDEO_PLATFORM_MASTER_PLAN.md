# 🎬 VideoPick 플랫폼 마스터 플랜

## 📌 프로젝트 개요

### 프로젝트 정보
- **현재 상태**: LinkPick (인플루언서 캠페인 플랫폼)
- **목표 상태**: VideoPick (YouTube형 동영상 플랫폼)
- **전환 기간**: 6개월
- **호스팅**: Coolify (https://coolify.one-q.xyz)

### 핵심 목표
1. 기존 사용자 베이스 유지하며 동영상 플랫폼으로 전환
2. YouTube 콘텐츠 임포트로 초기 콘텐츠 확보
3. 자체 업로드 및 수익화 시스템 구축
4. 실시간 기능 (라이브 스트리밍, 채팅) 지원

## 🏗️ 기술 스택

### 현재 구성
```yaml
Frontend:
  - Next.js 14.2.0 (App Router)
  - TypeScript
  - Tailwind CSS
  - Radix UI

Backend:
  - PostgreSQL (신규 DB)
  - Redis (캐싱 + 실시간)
  - Prisma ORM
  - JWT 인증

Infrastructure:
  - Coolify 호스팅
  - Docker 컨테이너
```

### 추가되는 기술
```yaml
Authentication:
  - Appwrite (Coolify 1-Click 설치)
  - 소셜 로그인
  - 실시간 채팅

Video:
  - YouTube Data API
  - FFmpeg (인코딩)
  - HLS 스트리밍
  - AWS S3 (스토리지)

Real-time:
  - Appwrite Realtime
  - Redis Pub/Sub
  - WebSocket
```

## 🗄️ 데이터베이스 구조

### 핵심 모델 변경
```prisma
// 사용자 타입 변경
enum UserType {
  ADMIN
  CREATOR      // INFLUENCER → CREATOR
  ADVERTISER   // BUSINESS → ADVERTISER
}

// 새로운 핵심 모델
model Channel {
  id               String @id
  userId           String
  name             String
  handle           String @unique
  subscriberCount  Int
  verified         Boolean
  
  // YouTube 연동
  externalId       String?
  externalPlatform String?
}

model Video {
  id              String @id
  channelId       String
  title           String
  description     String
  videoUrl        String?    // 자체 업로드
  thumbnailUrl    String
  duration        Int
  viewCount       Int
  status          String
  
  // YouTube 연동
  externalId      String?    // YouTube Video ID
  externalPlatform String?   // "youtube"
  embedEnabled    Boolean
}

model LiveChat {
  id        String @id
  streamId  String
  userId    String
  message   String
  type      String  // message, super_chat
  amount    Float?  // Super Chat 금액
}
```

## 🔑 환경변수 설정

### 1. 데이터베이스
```bash
# PostgreSQL (새 DB)
DATABASE_URL="postgres://postgres:47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX@i4sccwsosskookos4084ogkc:5432/postgres"

# Redis
REDIS_URL="redis://default:uu1SxljgYlrQpLlhIqXUn4GY1TNUuu81hk0IL0bDdT7WbuoDZ2JxUWITk9PVgQ2Q@bssgk8sogo8cgs4c4o0gkwkw:6379/0"
```

### 2. 애플리케이션 URL
```bash
# 서브도메인 사용 (권장)
NEXT_PUBLIC_API_URL="https://video.one-q.xyz"
NEXT_PUBLIC_APP_URL="https://video.one-q.xyz"
```

### 3. Appwrite 설정
```bash
# Appwrite (인증 + 실시간 + 스토리지)
NEXT_PUBLIC_APPWRITE_ENDPOINT="https://[appwrite-domain]/v1"
NEXT_PUBLIC_APPWRITE_PROJECT_ID="videopick"
APPWRITE_API_KEY="[your-api-key]"
```

### 4. YouTube API
```bash
# YouTube 임포트
YOUTUBE_API_KEY="[your-youtube-api-key]"
```

### 5. 스토리지
```bash
# AWS S3 (동영상 스토리지)
AWS_ACCESS_KEY_ID="[your-key]"
AWS_SECRET_ACCESS_KEY="[your-secret]"
S3_VIDEO_BUCKET="videopick-videos"
S3_THUMBNAIL_BUCKET="videopick-thumbnails"
```

## 🚀 구현 로드맵

### Phase 1: 기반 구축 (2주)
- [x] 환경변수 설정
- [x] 데이터베이스 스키마 설계
- [x] Appwrite 설치 및 설정
- [ ] 기본 프로젝트 구조 수정
- [ ] 인증 시스템 마이그레이션

### Phase 2: YouTube 임포트 (2주)
- [ ] YouTube API 통합
- [ ] 임포트 시스템 구현
- [ ] 하이브리드 플레이어 개발
- [ ] 관리자 임포트 도구

### Phase 3: 핵심 기능 (4주)
- [ ] 동영상 업로드 시스템
- [ ] 채널 시스템
- [ ] 구독 기능
- [ ] 검색 및 추천
- [ ] 실시간 채팅

### Phase 4: 수익화 (2주)
- [ ] 광고 시스템
- [ ] 멤버십 기능
- [ ] Super Chat
- [ ] 정산 시스템

### Phase 5: 고급 기능 (4주)
- [ ] 라이브 스트리밍
- [ ] 동영상 분석
- [ ] 커뮤니티 기능
- [ ] 모바일 최적화

## 💡 핵심 기능 상세

### 1. YouTube 임포트 시스템
```typescript
// YouTube URL → 자체 플랫폼
1. URL 입력
2. 메타데이터 추출 (제목, 설명, 썸네일)
3. 채널 정보 동기화
4. 자체 DB 저장
5. 독립적 조회수/좋아요 관리
```

### 2. 실시간 채팅 (Appwrite Realtime)
```typescript
// 라이브 채팅
- WebSocket 기반
- Super Chat 지원
- 실시간 시청자 수
- 채팅 모더레이션
```

### 3. 하이브리드 스토리지
```typescript
// 동영상 저장
- YouTube: 임베드 플레이어
- 자체 업로드: S3 + CloudFront
- 썸네일: Appwrite Storage
```

### 4. Redis 활용
```yaml
DB 0: 캐싱 (메타데이터, 추천)
DB 1: 세션 관리
DB 2: 작업 큐 (인코딩, 썸네일)
DB 3: 실시간 분석 (조회수, 트렌딩)
DB 4: Pub/Sub (채팅, 알림)
```

## 📊 마이그레이션 전략

### 1. 데이터 마이그레이션
```sql
-- 사용자 타입 매핑
INFLUENCER → CREATOR
BUSINESS → ADVERTISER

-- 캠페인 → 동영상 전환
campaigns → video_metadata
```

### 2. 단계별 전환
```yaml
Week 1-2: 환경 준비
  - 새 DB/Redis 설정
  - Appwrite 설치
  
Week 3-4: YouTube 임포트
  - 관리자 도구 개발
  - 초기 콘텐츠 확보
  
Week 5-8: 핵심 기능
  - 업로드/재생
  - 채널/구독
  
Week 9-10: 수익화
  - 광고/멤버십
  - 정산 시스템
  
Week 11-14: 고급 기능
  - 라이브 스트리밍
  - 분석 도구
```

### 3. 기능 플래그
```bash
# 점진적 활성화
ENABLE_VIDEO_UPLOAD=false
ENABLE_VIDEO_PLAYER=false
ENABLE_CHANNELS=false
ENABLE_MONETIZATION=false

# 레거시 지원
ENABLE_LEGACY_ROUTES=true
```

## 🎯 성공 지표

### 사용자 지표
- MAU: 10만 명
- 일일 시청 시간: 10만 시간
- 크리에이터 수: 1,000명
- 평균 세션 시간: 30분

### 콘텐츠 지표
- 총 동영상 수: 10만 개
- 일일 업로드: 1,000개
- 평균 조회수: 1,000회
- 인기 카테고리: 게임, 음악, 교육

### 수익 지표
- 광고 수익: 월 $10,000
- 멤버십 수익: 월 $5,000
- Super Chat: 월 $3,000
- 크리에이터 평균 수익: $100/월

## 🚨 위험 관리

### 기술적 위험
- **스토리지 비용**: S3 비용 모니터링, 효율적 인코딩
- **API 제한**: YouTube API 쿼터 관리, 캐싱 활용
- **성능**: CDN 최적화, 캐싱 전략

### 법적 위험
- **저작권**: YouTube 임베드 정책 준수
- **개인정보**: GDPR/KISA 준수
- **콘텐츠**: 자동 모더레이션 시스템

### 비즈니스 위험
- **사용자 이탈**: 점진적 전환, 인센티브 제공
- **경쟁**: 차별화 기능 (한국 특화)
- **수익성**: 다양한 수익 모델

## 📝 다음 단계 체크리스트

### 즉시 실행 (Day 1-3)
- [ ] Coolify에서 Appwrite 프로젝트 설정
- [ ] YouTube API 키 발급
- [ ] AWS S3 버킷 생성
- [ ] 환경변수 파일 업데이트

### 1주차
- [ ] Appwrite 컬렉션 생성
- [ ] YouTube 임포트 API 개발
- [ ] 기본 인증 시스템 전환
- [ ] 채널 모델 구현

### 2주차
- [ ] 동영상 플레이어 개발
- [ ] 업로드 시스템 구현
- [ ] 실시간 채팅 프로토타입
- [ ] 관리자 대시보드

## 🔗 참고 문서

1. [PRD_VIDEO_PLATFORM.md](./PRD_VIDEO_PLATFORM.md) - 제품 요구사항
2. [TECHNICAL_ARCHITECTURE_CHANGES.md](./TECHNICAL_ARCHITECTURE_CHANGES.md) - 기술 변경사항
3. [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) - 마이그레이션 계획
4. [APPWRITE_INTEGRATION_GUIDE.md](./APPWRITE_INTEGRATION_GUIDE.md) - Appwrite 통합
5. [YOUTUBE_IMPORT_SYSTEM.md](./YOUTUBE_IMPORT_SYSTEM.md) - YouTube 임포트
6. [REDIS_USAGE_GUIDE.md](./REDIS_USAGE_GUIDE.md) - Redis 활용

## 💬 연락처

프로젝트 관련 문의:
- 기술 지원: dev@videopick.com
- 비즈니스: biz@videopick.com

---

**Last Updated**: 2025-08-01
**Version**: 1.0.0