# 🔄 VideoPick 재사용 전략

> 기존 LinkPick 코드를 최대한 활용하여 비디오 플랫폼으로 전환

## 📊 현재 프로젝트 분석

### ✅ 재사용 가능한 핵심 컴포넌트

#### 1. **관리자 시스템** (100% 재사용)
```
admin/
├── AdminLayout.tsx        ✅ 그대로 사용
├── 대시보드              ✅ 통계만 변경
├── 사용자 관리           ✅ 그대로 사용
├── 결제 관리             ✅ 그대로 사용
├── 분석/리포트           ✅ 그대로 사용
└── UI 설정 관리          ✅ 섹션만 수정
```

#### 2. **인증/권한 시스템** (90% 재사용)
- `/hooks/useAuth` ✅
- 로그인/회원가입 페이지 ✅
- JWT 토큰 관리 ✅
- 사용자 타입 (ADMIN, BUSINESS → CREATOR, INFLUENCER → VIEWER)

#### 3. **기본 인프라** (100% 재사용)
- Next.js 14 App Router 구조 ✅
- Prisma ORM 설정 ✅
- Redis 캐싱 ✅
- 파일 업로드 시스템 ✅
- API 라우트 구조 ✅

#### 4. **UI 컴포넌트** (80% 재사용)
- 레이아웃 컴포넌트 ✅
- 폼 컴포넌트 ✅
- 모달/팝업 ✅
- 테이블/리스트 ✅
- 차트/그래프 ✅

### 🔄 변환이 필요한 부분

#### 1. **비즈니스 로직 변환**
```typescript
// 기존: 캠페인
Campaign → Video/LiveStream
CampaignApplication → VideoComment/Subscription
Business → Channel/Creator
Influencer → Viewer/Subscriber

// 예시: campaigns → videos
/api/campaigns → /api/videos
/api/campaigns/[id]/applications → /api/videos/[id]/comments
```

#### 2. **데이터 모델 확장**
```prisma
// 기존 User 모델 확장
model User {
  // 기존 필드 유지
  type UserType // ADMIN, CREATOR, VIEWER로 변경
  
  // 추가 필드
  channel Channel?
  subscriptions Subscription[]
  watchHistory WatchHistory[]
}

// Campaign → Video 변환
model Video {
  id String @id // 기존 Campaign id 구조 유지
  title String // 기존 title
  description String // 기존 description
  thumbnailUrl String // 기존 imageUrl
  videoUrl String // 새로운 필드
  
  // 기존 관계 유지
  userId String
  user User @relation(...)
}
```

## 🛠️ 구현 전략

### Phase 1: 기본 구조 유지 (1주)

#### 1. 환경 설정
```bash
# 기존 환경 변수 유지 + 추가
DATABASE_URL      # 유지
REDIS_URL         # 유지
JWT_SECRET        # 유지

# 새로운 환경 변수
ANT_MEDIA_URL     # 추가
VULTR_STORAGE     # 추가
APPWRITE_URL      # 추가
```

#### 2. 라우팅 구조 매핑
```typescript
// 기존 라우트 → 새 라우트 매핑
const routeMapping = {
  '/campaigns': '/videos',
  '/campaigns/[id]': '/video/[id]',
  '/business/campaigns': '/studio/videos',
  '/influencer/campaigns': '/my/videos',
  
  // 새로운 라우트 추가
  '/live': '/live',
  '/studio/live': '/studio/live',
}
```

### Phase 2: UI 전환 (1주)

#### 1. 홈페이지 섹션 변경
```typescript
// 기존 UI Config 활용
sections:
  - hero → 추천 동영상
  - recommended → 인기 동영상
  - new → 최신 동영상
  - category → 카테고리별 동영상
  - ranking → 인기 채널
```

#### 2. 카드 컴포넌트 수정
```tsx
// CampaignCard → VideoCard
<VideoCard>
  <VideoThumbnail /> // 새로운
  <VideoTitle />     // 기존 title
  <ChannelInfo />    // 기존 business 정보
  <VideoStats />     // 조회수, 좋아요
</VideoCard>
```

### Phase 3: 핵심 기능 추가 (2주)

#### 1. 비디오 플레이어 통합
```tsx
// 새로운 컴포넌트
<VideoPlayer 
  src={video.url}
  poster={video.thumbnail}
  antMediaStream={liveStream?.streamKey}
/>
```

#### 2. 라이브 스트리밍
```tsx
// 기존 business 대시보드 활용
/business/dashboard → /studio/dashboard
+ 라이브 시작 버튼
+ 스트림 키 관리
+ 실시간 통계
```

#### 3. 채팅 시스템
```tsx
// 기존 댓글 시스템 확장
<Comments /> → <LiveChat />
+ Appwrite Realtime
+ 이모티콘
+ Super Chat
```

## 📋 재사용 체크리스트

### ✅ 100% 재사용
- [ ] 관리자 전체 시스템
- [ ] 인증/로그인 시스템
- [ ] 파일 업로드
- [ ] 결제 시스템
- [ ] 이메일 알림
- [ ] 통계/분석

### 🔄 수정 후 재사용
- [ ] 사용자 대시보드 (business → creator)
- [ ] 콘텐츠 관리 (campaign → video)
- [ ] 검색/필터 (카테고리 변경)
- [ ] 추천 시스템 (로직 유지)

### 🆕 새로 추가
- [ ] 비디오 플레이어
- [ ] 라이브 스트리밍 UI
- [ ] 실시간 채팅
- [ ] 구독 시스템
- [ ] 알림 시스템

## 💡 개발 팁

### 1. 네이밍 전략
```typescript
// 점진적 마이그레이션
interface Campaign extends Video {} // 임시 호환성
type Business = Channel // 타입 별칭

// API 호환성
app.get('/api/campaigns/*', (req, res) => {
  // 기존 API를 새 API로 리다이렉트
  res.redirect(req.url.replace('campaigns', 'videos'))
})
```

### 2. 데이터 마이그레이션
```sql
-- 기존 데이터 보존하며 새 필드 추가
ALTER TABLE campaigns ADD COLUMN video_url TEXT;
ALTER TABLE campaigns ADD COLUMN duration INTEGER;
ALTER TABLE campaigns ADD COLUMN view_count INTEGER DEFAULT 0;

-- 뷰 생성으로 호환성 유지
CREATE VIEW videos AS SELECT * FROM campaigns;
```

### 3. 컴포넌트 래핑
```tsx
// 기존 컴포넌트를 래핑하여 재사용
export function VideoCard({ video }: { video: Video }) {
  // Campaign 데이터 구조로 변환
  const campaignData = {
    ...video,
    businessName: video.channel?.name,
    applicationCount: video.commentCount,
  }
  
  return <CampaignCard campaign={campaignData} />
}
```

## 🚀 빠른 시작

### 1주차: 기본 전환
```bash
# 1. 환경 변수 추가
cp .env.video .env

# 2. 데이터베이스 마이그레이션
npx prisma migrate dev --name add_video_fields

# 3. 라우트 별칭 설정
npm run setup:routes
```

### 2주차: UI 개선
- 홈페이지를 비디오 중심으로 변경
- 카드 컴포넌트 스타일 조정
- 네비게이션 메뉴 업데이트

### 3주차: 핵심 기능
- Ant Media 플레이어 통합
- 라이브 스트리밍 테스트
- 채팅 기능 구현

### 4주차: 최적화
- 성능 튜닝
- 버그 수정
- 사용자 피드백 반영

## 📊 예상 결과

### 재사용률
- **코드 재사용**: 70-80%
- **개발 시간 단축**: 60%
- **안정성**: 검증된 코드 기반

### 주요 이점
1. **빠른 출시**: 4주 내 MVP
2. **안정적 운영**: 기존 인프라 활용
3. **점진적 전환**: 기능별 단계적 출시
4. **비용 절감**: 새로 개발 대비 70% 절약

---

**결론**: 기존 LinkPick의 견고한 구조를 최대한 활용하면서 비디오 플랫폼 특화 기능만 추가하여 빠르고 안정적인 전환이 가능합니다.