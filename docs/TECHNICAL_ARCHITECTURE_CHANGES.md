# 🎬 동영상 플랫폼 기술 아키텍처 변경사항

## 1. 데이터베이스 스키마 변경사항

### 1.1 기존 모델 → 신규 모델 매핑

#### User 모델 변경
```prisma
// 기존
enum UserType {
  ADMIN
  BUSINESS     → ADVERTISER (광고주)
  INFLUENCER   → CREATOR (크리에이터)
}

// 추가 필드
model User {
  // ... 기존 필드
  channels      Channel[]      // 크리에이터의 채널
  subscriptions Subscription[] // 구독 정보
  watchHistory  WatchHistory[] // 시청 기록
  playlists     Playlist[]     // 재생목록
}
```

#### Campaign → Video 전환
```prisma
// 기존 Campaign 모델을 Video 모델로 전환
model Video {
  id                String    @id @default(cuid())
  channelId         String    // businessId → channelId
  title             String
  description       String
  thumbnailUrl      String?   
  videoUrl          String    // 새로운 필드
  duration          Int       // 동영상 길이 (초)
  viewCount         Int       @default(0)
  likeCount         Int       @default(0)
  dislikeCount      Int       @default(0)
  status            String    @default("PROCESSING") // PROCESSING, PUBLISHED, PRIVATE, UNLISTED
  publishedAt       DateTime?
  category          String
  tags              String[]  // hashtags → tags (배열)
  
  // 수익화 관련
  monetizationEnabled Boolean @default(false)
  adsEnabled          Boolean @default(false)
  memberOnly          Boolean @default(false)
  
  // 기술 메타데이터
  resolution        String?   // 1080p, 720p, etc
  fileSize          BigInt?
  encoding          String?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  channel           Channel   @relation(fields: [channelId], references: [id])
  comments          Comment[]
  analytics         VideoAnalytics[]
  likes             VideoLike[]
  playlists         PlaylistVideo[]
}
```

### 1.2 신규 모델 추가

#### Channel 모델 (새로운)
```prisma
model Channel {
  id               String    @id @default(cuid())
  userId           String    
  name             String
  handle           String    @unique // @username
  description      String?
  bannerUrl        String?
  avatarUrl        String?
  subscriberCount  Int       @default(0)
  videoCount       Int       @default(0)
  viewCount        BigInt    @default(0)
  country          String?
  customUrl        String?
  verified         Boolean   @default(false)
  
  // 수익화 설정
  monetizationEnabled Boolean @default(false)
  membershipEnabled   Boolean @default(false)
  
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  // Relations
  user             User      @relation(fields: [userId], references: [id])
  videos           Video[]
  subscribers      Subscription[]
  memberships      Membership[]
  communityPosts   CommunityPost[]
  analytics        ChannelAnalytics[]
}
```

#### Subscription 모델 (새로운)
```prisma
model Subscription {
  id                String    @id @default(cuid())
  subscriberId      String    // 구독자
  channelId         String    // 구독 채널
  notificationLevel String    @default("ALL") // ALL, PERSONALIZED, NONE
  createdAt         DateTime  @default(now())
  
  subscriber        User      @relation(fields: [subscriberId], references: [id])
  channel           Channel   @relation(fields: [channelId], references: [id])
  
  @@unique([subscriberId, channelId])
}
```

#### VideoAnalytics 모델 (새로운)
```prisma
model VideoAnalytics {
  id                String    @id @default(cuid())
  videoId           String
  date              DateTime
  views             Int       @default(0)
  watchTime         BigInt    @default(0) // 총 시청 시간 (초)
  averageViewDuration Int     @default(0) // 평균 시청 시간 (초)
  likes             Int       @default(0)
  dislikes          Int       @default(0)
  comments          Int       @default(0)
  shares            Int       @default(0)
  estimatedRevenue  Float     @default(0)
  
  video             Video     @relation(fields: [videoId], references: [id])
  
  @@unique([videoId, date])
}
```

#### Advertisement 모델 (새로운)
```prisma
model Advertisement {
  id              String    @id @default(cuid())
  advertiserId    String    // 기존 Business 사용자
  title           String
  description     String?
  type            String    // VIDEO, BANNER, OVERLAY
  targetUrl       String
  mediaUrl        String
  budget          Float
  costPerView     Float
  status          String    @default("PENDING")
  
  // 타겟팅
  targetAudience  Json?     // 연령, 성별, 관심사 등
  targetKeywords  String[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  advertiser      User      @relation(fields: [advertiserId], references: [id])
  campaigns       AdCampaign[]
}
```

### 1.3 기존 모델 수정사항

#### Payment 모델 수정
```prisma
model Payment {
  // ... 기존 필드
  type            String    // 'CAMPAIGN' → 'AD_CAMPAIGN', 'MEMBERSHIP', 'SUPER_CHAT', 'SUPER_THANKS'
  
  // 관계 수정
  adCampaignId    String?   // campaignId 대체
  membershipId    String?   // 새로운 관계
  videoId         String?   // Super Thanks용
}
```

#### Comment 모델 확장
```prisma
model Comment {
  // ... 기존 필드
  videoId         String?   // postId와 함께 사용
  channelId       String?   // 커뮤니티 포스트용
  likeCount       Int       @default(0)
  dislikeCount    Int       @default(0)
  isPinned        Boolean   @default(false)
  isHearted       Boolean   @default(false) // 크리에이터 하트
  
  video           Video?    @relation(fields: [videoId], references: [id])
}
```

## 2. API 엔드포인트 변경사항

### 2.1 기존 API 매핑

| 기존 엔드포인트 | 신규 엔드포인트 | 설명 |
|---------------|---------------|------|
| `/api/campaigns` | `/api/videos` | 동영상 목록 |
| `/api/campaigns/:id` | `/api/videos/:id` | 동영상 상세 |
| `/api/business/*` | `/api/channel/*` | 채널 관리 |
| `/api/influencer/*` | `/api/creator/*` | 크리에이터 관리 |

### 2.2 신규 API 엔드포인트

#### 동영상 관련
```
POST   /api/videos/upload         # 동영상 업로드 시작
PUT    /api/videos/:id/publish    # 동영상 게시
GET    /api/videos/:id/stream     # 스트리밍 URL 획득
POST   /api/videos/:id/like       # 좋아요/싫어요
GET    /api/videos/:id/analytics  # 동영상 분석
```

#### 채널 관련
```
POST   /api/channels              # 채널 생성
GET    /api/channels/:handle      # 채널 정보
POST   /api/channels/:id/subscribe # 구독/구독취소
GET    /api/channels/:id/videos   # 채널 동영상 목록
GET    /api/channels/:id/playlists # 채널 재생목록
```

#### 검색 및 추천
```
GET    /api/search                # 통합 검색
GET    /api/trending              # 인기 동영상
GET    /api/recommendations       # 추천 동영상
GET    /api/feed/subscriptions    # 구독 피드
```

#### 수익화
```
GET    /api/monetization/eligibility  # 수익화 자격 확인
POST   /api/monetization/enable       # 수익화 활성화
GET    /api/revenue/analytics         # 수익 분석
POST   /api/memberships/create        # 멤버십 생성
```

## 3. 환경 변수 변경사항

### 3.1 기존 환경 변수 수정
```bash
# 기존
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."

# 추가/변경
VIDEO_STORAGE_BUCKET="videopick-videos"
VIDEO_CDN_URL="https://cdn.videopick.com"
STREAMING_SERVER_URL="https://stream.videopick.com"

# 인코딩 서비스
ENCODING_SERVICE_URL="https://encode.videopick.com"
ENCODING_API_KEY="..."

# 스토리지 설정
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="ap-northeast-2"
S3_VIDEO_BUCKET="videopick-videos"
S3_THUMBNAIL_BUCKET="videopick-thumbnails"

# 스트리밍 설정
HLS_SEGMENT_DURATION="6"
HLS_PLAYLIST_SIZE="10"

# 업로드 제한
MAX_VIDEO_SIZE_MB="10240" # 10GB
ALLOWED_VIDEO_FORMATS="mp4,avi,mov,mkv,webm"

# 수익화 설정
AD_REVENUE_SHARE="0.7" # 크리에이터 70%
MEMBERSHIP_PLATFORM_FEE="0.3" # 플랫폼 30%
MIN_MONETIZATION_SUBSCRIBERS="1000"
MIN_MONETIZATION_WATCH_HOURS="4000"
```

### 3.2 신규 환경 변수
```bash
# 동영상 처리
FFMPEG_PATH="/usr/local/bin/ffmpeg"
VIDEO_PROCESSING_QUEUE="video-processing"
THUMBNAIL_COUNT="3" # 자동 생성 썸네일 수

# 분석 및 추천
ANALYTICS_DB_URL="postgresql://analytics..."
RECOMMENDATION_SERVICE_URL="https://ml.videopick.com"
ELASTICSEARCH_URL="https://search.videopick.com"

# 실시간 기능
WEBSOCKET_URL="wss://ws.videopick.com"
LIVE_STREAMING_SERVER="rtmp://live.videopick.com"

# 외부 서비스
GOOGLE_API_KEY="..." # YouTube Data API 마이그레이션용
CONTENT_MODERATION_API="https://moderate.videopick.com"

# 캐싱 설정
VIDEO_METADATA_CACHE_TTL="3600" # 1시간
TRENDING_CACHE_TTL="300" # 5분
RECOMMENDATION_CACHE_TTL="1800" # 30분
```

## 4. 인프라 아키텍처 변경사항

### 4.1 기존 아키텍처
```
Client → Next.js → PostgreSQL/Redis
```

### 4.2 신규 아키텍처
```
Client → CDN → Next.js → API Gateway → Microservices
                  ↓           ↓              ↓
              Video Player  Load Balancer  Services:
                  ↓                        - Upload Service
              HLS/DASH                     - Encoding Service
              Streaming                    - Analytics Service
                                          - Recommendation Service
                                          
Storage: S3 (Videos) → CloudFront CDN
DB: PostgreSQL (Main) + MongoDB (Analytics) + Redis (Cache) + Elasticsearch (Search)
```

### 4.3 마이크로서비스 구성
1. **Video Service**: 동영상 메타데이터 관리
2. **Upload Service**: 대용량 업로드 처리
3. **Encoding Service**: 동영상 인코딩 및 썸네일 생성
4. **Streaming Service**: HLS/DASH 스트리밍
5. **Analytics Service**: 조회수, 시청 시간 추적
6. **Recommendation Service**: ML 기반 추천
7. **Search Service**: Elasticsearch 기반 검색
8. **Notification Service**: 실시간 알림
9. **Monetization Service**: 광고, 수익 관리

## 5. 성능 최적화 고려사항

### 5.1 동영상 스트리밍
- Adaptive Bitrate Streaming (ABR)
- Edge 서버 캐싱
- P2P 스트리밍 검토

### 5.2 대용량 업로드
- Multipart 업로드
- 재개 가능한 업로드
- 클라이언트 사이드 압축

### 5.3 검색 최적화
- Elasticsearch 인덱싱
- 자동완성 캐싱
- 검색 결과 캐싱

### 5.4 추천 시스템
- 협업 필터링
- 콘텐츠 기반 필터링
- 실시간 개인화

## 6. 보안 고려사항

### 6.1 콘텐츠 보호
- DRM (Digital Rights Management)
- 워터마킹
- 핫링킹 방지

### 6.2 사용자 인증
- OAuth 2.0 소셜 로그인 추가
- 2단계 인증
- 세션 관리 강화

### 6.3 콘텐츠 모니터링
- 자동 콘텐츠 필터링
- 커뮤니티 신고 시스템
- 저작권 침해 감지

## 7. 마이그레이션 준비사항

### 7.1 데이터베이스
1. 백업 전략 수립
2. 스키마 마이그레이션 스크립트 준비
3. 데이터 변환 매핑 정의
4. 롤백 계획 수립

### 7.2 파일 스토리지
1. 기존 이미지 → 썸네일 변환
2. S3 버킷 구조 설계
3. CDN 설정 준비

### 7.3 사용자 경험
1. 기존 사용자 안내
2. 새 기능 튜토리얼
3. 점진적 기능 출시 계획