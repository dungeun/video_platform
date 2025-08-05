# 📋 VideoPick 프로젝트 문서 인덱스

> 기준: PRD_VIDEO_PLATFORM_V2.md (Ant Media 통합 버전)

## 🎯 핵심 문서 (Core Documents)

### 1. 제품 정의
- **[PRD_VIDEO_PLATFORM_V2.md](./PRD_VIDEO_PLATFORM_V2.md)** ⭐
  - 최종 PRD (Ant Media Server 통합)
  - 모든 개발의 기준 문서

### 2. 실행 계획
- **[🎬_VIDEO_MIGRATION_PLAN.md](./🎬_VIDEO_MIGRATION_PLAN.md)** 🆕 ⭐
  - 4주 실전 전환 계획
  - 코드 재사용 전략
  - 주차별 상세 일정

- **[🔄_REUSE_STRATEGY.md](./🔄_REUSE_STRATEGY.md)** 🆕 ⭐
  - 기존 코드 재사용 전략
  - 컴포넌트별 재사용률
  - 점진적 전환 방법

### 3. 빠른 시작
- **[🎯_QUICK_START.md](./🎯_QUICK_START.md)** ✅
  - 즉시 실행 가능한 가이드
  - 체크리스트 및 명령어

- **[📐_PROJECT_STRUCTURE.md](./📐_PROJECT_STRUCTURE.md)** ✅
  - 프로젝트 구조 설명
  - 파일 구성 및 역할

### 4. 인프라 & 배포
- **[ANT_MEDIA_INFRASTRUCTURE_PLAN.md](./ANT_MEDIA_INFRASTRUCTURE_PLAN.md)** ✅
  - Ant Media Server 인프라 구성
  - 서버 아키텍처, 클러스터링, 비용 계획
  
- **[ANT_MEDIA_QUICK_START.md](./ANT_MEDIA_QUICK_START.md)** ✅
  - 30분 내 구축 가이드
  - 실제 설치 명령어 및 스크립트

### 5. 기술 아키텍처
- **[TECHNICAL_ARCHITECTURE_CHANGES.md](./TECHNICAL_ARCHITECTURE_CHANGES.md)** ✅
  - 현재 LinkPick → VideoPick 전환 아키텍처
  - 데이터 모델, API 설계

- **[MIGRATION_PLAN.md](./MIGRATION_PLAN.md)** ✅
  - 6개월 단계별 마이그레이션 계획
  - 리스크 관리 및 롤백 전략

### 6. 통합 가이드
- **[APPWRITE_INTEGRATION_GUIDE.md](./APPWRITE_INTEGRATION_GUIDE.md)** ✅
  - 인증 시스템 통합
  - 실시간 채팅 구현

- **[YOUTUBE_IMPORT_SYSTEM.md](./YOUTUBE_IMPORT_SYSTEM.md)** ✅
  - YouTube 영상 임포트 기능
  - 초기 콘텐츠 확보 전략

### 7. 환경 설정
- **[ENV_VARS_GUIDE.md](./ENV_VARS_GUIDE.md)** ✅
  - 환경 변수 설정 가이드
  - 개발/운영 환경 구분

## 📦 참고 문서 (Reference Documents)

### 기술 검토 문서
- **[ANT_MEDIA_PERFORMANCE_REVIEW.md](./ANT_MEDIA_PERFORMANCE_REVIEW.md)** 📚
  - Ant Media Server 성능 분석
  - 해외 사용자 리뷰

- **[OBJECT_STORAGE_COMPARISON.md](./OBJECT_STORAGE_COMPARISON.md)** 📚
  - Vultr vs AWS S3 vs Naver Cloud 비교
  - 비용 분석 (Vultr 선택)

- **[OPENSOURCE_STREAMING_PLATFORMS.md](./OPENSOURCE_STREAMING_PLATFORMS.md)** 📚
  - 오픈소스 스트리밍 플랫폼 비교
  - Ant Media 선택 근거

## 🗄️ 보관 문서 (Archived Documents)

> archive/ 폴더로 이동됨

### 초기 검토 문서
- PRD_VIDEO_PLATFORM.md
- VIDEO_PLATFORM_MASTER_PLAN.md
- DRAGONFLY_VS_REDIS.md
- REDIS_USAGE_GUIDE.md
- AUTH_SOLUTIONS_COMPARISON.md
- COOLIFY_AUTH_SERVICES.md
- SUPABASE_REALTIME_CHAT.md
- LIVE_STREAMING_SOLUTIONS.md
- DEPLOYMENT_OPTIONS.md

## 📊 문서 우선순위

### 🚨 즉시 확인 필요
1. **🎬_VIDEO_MIGRATION_PLAN.md** - 4주 실행 계획
2. **🔄_REUSE_STRATEGY.md** - 재사용 전략
3. **🎯_QUICK_START.md** - 빠른 시작

### 📖 개발 시 참조
1. **PRD_VIDEO_PLATFORM_V2.md** - 기능 명세
2. **📐_PROJECT_STRUCTURE.md** - 코드 구조
3. **TECHNICAL_ARCHITECTURE_CHANGES.md** - 기술 구조

### 🔧 구현 시 필요
1. **ANT_MEDIA_QUICK_START.md** - 스트리밍 설정
2. **APPWRITE_INTEGRATION_GUIDE.md** - 인증 설정
3. **ENV_VARS_GUIDE.md** - 환경 변수

## 🚀 다음 단계

### Week 1: 백엔드 전환
- [ ] 데이터 모델 확장 (Campaign → Video)
- [ ] API 라우트 확장
- [ ] 스트리밍 서비스 추가

### Week 2: 프론트엔드 전환
- [ ] 홈페이지 UI 변경
- [ ] 비디오 플레이어 통합
- [ ] 카드 컴포넌트 수정

### Week 3: 크리에이터 도구
- [ ] 업로드 기능 수정
- [ ] 라이브 스트리밍 UI
- [ ] 대시보드 확장

### Week 4: 통합 및 출시
- [ ] 실시간 채팅
- [ ] 성능 최적화
- [ ] 배포 준비

## 📝 문서 관리 규칙

1. **핵심 문서**: PRD_V2 기준으로 필수 유지
2. **실행 문서**: 재사용 전략과 마이그레이션 계획 우선
3. **참고 문서**: 의사결정 근거로 보관
4. **새 문서**: 실전 중심으로 작성

---

마지막 업데이트: 2025-08-01