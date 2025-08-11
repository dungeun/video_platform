# 🗄️ 데이터베이스 스키마 문서

## 개요

비디오픽 플랫폼의 데이터베이스 구조 및 관계를 정의하는 문서입니다. PostgreSQL과 Prisma ORM을 사용합니다.

## 데이터베이스 정보

### 연결 정보
```env
DATABASE_URL="postgresql://username:password@localhost:5432/videopick"
```

### Prisma 설정
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    User ||--o{ Video : uploads
    User ||--o{ Comment : writes
    User ||--o{ Subscription : subscribes
    User ||--o{ Like : likes
    User ||--o{ WatchHistory : watches
    
    Channel ||--o{ Video : contains
    Channel ||--o{ Subscription : has_subscribers
    
    Video ||--o{ Comment : has
    Video ||--o{ Like : receives
    Video ||--o{ WatchHistory : tracked
    Video ||--o{ VideoTag : has_tags
    
    Category ||--o{ Video : categorizes
    Tag ||--o{ VideoTag : applied_to
    
    Campaign ||--o{ CampaignVideo : includes
    Video ||--o{ CampaignVideo : featured_in
```

## 스키마 정의

### User (사용자)

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  password        String?   // 소셜 로그인 시 null
  name            String?
  avatar          String?
  bio             String?
  type            UserType  @default(USER)
  role            UserRole  @default(USER)
  verified        Boolean   @default(false)
  verifyToken     String?
  resetToken      String?
  resetTokenExp   DateTime?
  
  // 소셜 로그인
  googleId        String?   @unique
  facebookId      String?   @unique
  kakaoId         String?   @unique
  naverId         String?   @unique
  
  // 설정
  language        String    @default("ko")
  timezone        String    @default("Asia/Seoul")
  notifications   Json?     // 알림 설정
  
  // 통계
  followerCount   Int       @default(0)
  followingCount  Int       @default(0)
  videoCount      Int       @default(0)
  totalViews      BigInt    @default(0)
  
  // 타임스탬프
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime? // Soft delete
  lastLoginAt     DateTime?
  
  // 관계
  channels        Channel[]
  videos          Video[]
  comments        Comment[]
  likes           Like[]
  subscriptions   Subscription[]
  watchHistory    WatchHistory[]
  notifications   Notification[]
  
  @@index([email])
  @@index([type])
  @@index([role])
  @@index([verified])
}

enum UserType {
  USER
  CREATOR
  BUSINESS
  ADMIN
}

enum UserRole {
  USER
  MODERATOR
  ADMIN
  SUPER_ADMIN
}
```

### Channel (채널)

```prisma
model Channel {
  id                String    @id @default(uuid())
  userId            String
  name              String
  handle            String    @unique
  description       String?
  avatarUrl         String?
  bannerUrl         String?
  
  // 통계
  subscriberCount   Int       @default(0)
  videoCount        Int       @default(0)
  viewCount         BigInt    @default(0)
  
  // 외부 플랫폼
  externalId        String?   // YouTube Channel ID
  externalPlatform  String?   // youtube, twitch, etc
  lastSyncedAt      DateTime?
  
  // 설정
  verified          Boolean   @default(false)
  monetizationEnabled Boolean @default(false)
  customUrl         String?
  country           String?
  
  // 타임스탬프
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // 관계
  user              User      @relation(fields: [userId], references: [id])
  videos            Video[]
  subscriptions     Subscription[]
  
  @@index([userId])
  @@index([handle])
  @@index([externalId, externalPlatform])
}
```

### Video (비디오)

```prisma
model Video {
  id                String    @id @default(uuid())
  channelId         String
  userId            String
  
  // 기본 정보
  title             String
  description       String?
  thumbnailUrl      String?
  videoUrl          String?   // 자체 호스팅 URL
  duration          Int       // 초 단위
  
  // 외부 플랫폼
  youtubeId         String?   @unique
  externalId        String?   // 범용 외부 ID
  externalPlatform  String?   // youtube, vimeo, etc
  externalUrl       String?   // 원본 URL
  embedEnabled      Boolean   @default(true)
  
  // 메타데이터
  categoryId        String?
  tags              String[]
  language          String    @default("ko")
  visibility        VideoVisibility @default(PUBLIC)
  status            VideoStatus @default(DRAFT)
  
  // 통계 (자체 플랫폼)
  viewCount         BigInt    @default(0)
  likeCount         Int       @default(0)
  dislikeCount      Int       @default(0)
  commentCount      Int       @default(0)
  shareCount        Int       @default(0)
  
  // 외부 플랫폼 통계
  externalViewCount    BigInt @default(0)
  externalLikeCount    Int    @default(0)
  externalCommentCount Int    @default(0)
  
  // 수익화
  monetizationEnabled Boolean @default(false)
  adEnabled         Boolean   @default(true)
  
  // 타임스탬프
  publishedAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime? // Soft delete
  
  // 관계
  channel           Channel   @relation(fields: [channelId], references: [id])
  user              User      @relation(fields: [userId], references: [id])
  category          Category? @relation(fields: [categoryId], references: [id])
  comments          Comment[]
  likes             Like[]
  watchHistory      WatchHistory[]
  videoTags         VideoTag[]
  campaignVideos    CampaignVideo[]
  
  @@index([channelId])
  @@index([userId])
  @@index([categoryId])
  @@index([youtubeId])
  @@index([status, visibility])
  @@index([publishedAt])
}

enum VideoVisibility {
  PUBLIC
  PRIVATE
  UNLISTED
}

enum VideoStatus {
  DRAFT
  PROCESSING
  PUBLISHED
  DELETED
}
```

### Category (카테고리)

```prisma
model Category {
  id          String    @id @default(uuid())
  name        String    @unique
  slug        String    @unique
  description String?
  icon        String?
  color       String?
  order       Int       @default(0)
  isActive    Boolean   @default(true)
  
  // 타임스탬프
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // 관계
  videos      Video[]
  
  @@index([slug])
  @@index([isActive])
}
```

### Tag (태그)

```prisma
model Tag {
  id          String    @id @default(uuid())
  name        String    @unique
  slug        String    @unique
  usageCount  Int       @default(0)
  
  // 타임스탬프
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // 관계
  videoTags   VideoTag[]
  
  @@index([slug])
  @@index([usageCount])
}
```

### VideoTag (비디오-태그 연결)

```prisma
model VideoTag {
  id        String   @id @default(uuid())
  videoId   String
  tagId     String
  
  // 타임스탬프
  createdAt DateTime @default(now())
  
  // 관계
  video     Video    @relation(fields: [videoId], references: [id], onDelete: Cascade)
  tag       Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@unique([videoId, tagId])
  @@index([videoId])
  @@index([tagId])
}
```

### Comment (댓글)

```prisma
model Comment {
  id          String    @id @default(uuid())
  videoId     String
  userId      String
  parentId    String?   // 답글인 경우
  
  content     String
  likeCount   Int       @default(0)
  replyCount  Int       @default(0)
  
  // 타임스탬프
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  editedAt    DateTime?
  deletedAt   DateTime? // Soft delete
  
  // 관계
  video       Video     @relation(fields: [videoId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id])
  parent      Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies     Comment[] @relation("CommentReplies")
  likes       CommentLike[]
  
  @@index([videoId])
  @@index([userId])
  @@index([parentId])
}
```

### Like (좋아요)

```prisma
model Like {
  id        String    @id @default(uuid())
  videoId   String
  userId    String
  type      LikeType  @default(LIKE)
  
  // 타임스탬프
  createdAt DateTime  @default(now())
  
  // 관계
  video     Video     @relation(fields: [videoId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id])
  
  @@unique([videoId, userId])
  @@index([videoId])
  @@index([userId])
}

enum LikeType {
  LIKE
  DISLIKE
}
```

### CommentLike (댓글 좋아요)

```prisma
model CommentLike {
  id        String   @id @default(uuid())
  commentId String
  userId    String
  
  // 타임스탬프
  createdAt DateTime @default(now())
  
  // 관계
  comment   Comment  @relation(fields: [commentId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])
  
  @@unique([commentId, userId])
  @@index([commentId])
  @@index([userId])
}
```

### Subscription (구독)

```prisma
model Subscription {
  id            String    @id @default(uuid())
  userId        String
  channelId     String
  
  notifications Boolean   @default(true)
  
  // 타임스탬프
  createdAt     DateTime  @default(now())
  
  // 관계
  user          User      @relation(fields: [userId], references: [id])
  channel       Channel   @relation(fields: [channelId], references: [id])
  
  @@unique([userId, channelId])
  @@index([userId])
  @@index([channelId])
}
```

### WatchHistory (시청 기록)

```prisma
model WatchHistory {
  id            String    @id @default(uuid())
  userId        String
  videoId       String
  
  watchTime     Int       // 총 시청 시간 (초)
  lastPosition  Int       // 마지막 시청 위치 (초)
  completed     Boolean   @default(false)
  
  // 타임스탬프
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastWatchedAt DateTime  @default(now())
  
  // 관계
  user          User      @relation(fields: [userId], references: [id])
  video         Video     @relation(fields: [videoId], references: [id])
  
  @@unique([userId, videoId])
  @@index([userId])
  @@index([videoId])
  @@index([lastWatchedAt])
}
```

### Campaign (캠페인)

```prisma
model Campaign {
  id              String    @id @default(uuid())
  businessId      String    // 비즈니스 사용자 ID
  
  title           String
  description     String?
  budget          Decimal   @db.Decimal(10, 2)
  spentBudget     Decimal   @default(0) @db.Decimal(10, 2)
  
  // 타겟팅
  targetAudience  Json      // 연령, 성별, 관심사, 지역 등
  
  // 기간
  startDate       DateTime
  endDate         DateTime
  
  // 상태
  status          CampaignStatus @default(DRAFT)
  
  // 통계
  impressions     BigInt    @default(0)
  clicks          BigInt    @default(0)
  conversions     Int       @default(0)
  
  // 타임스탬프
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // 관계
  campaignVideos  CampaignVideo[]
  
  @@index([businessId])
  @@index([status])
  @@index([startDate, endDate])
}

enum CampaignStatus {
  DRAFT
  PENDING_APPROVAL
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
}
```

### CampaignVideo (캠페인-비디오 연결)

```prisma
model CampaignVideo {
  id          String    @id @default(uuid())
  campaignId  String
  videoId     String
  
  // 성과
  impressions BigInt    @default(0)
  clicks      BigInt    @default(0)
  ctr         Decimal   @default(0) @db.Decimal(5, 2) // Click Through Rate
  
  // 타임스탬프
  createdAt   DateTime  @default(now())
  
  // 관계
  campaign    Campaign  @relation(fields: [campaignId], references: [id])
  video       Video     @relation(fields: [videoId], references: [id])
  
  @@unique([campaignId, videoId])
  @@index([campaignId])
  @@index([videoId])
}
```

### Notification (알림)

```prisma
model Notification {
  id          String    @id @default(uuid())
  userId      String
  
  type        NotificationType
  title       String
  content     String
  data        Json?     // 추가 데이터
  
  isRead      Boolean   @default(false)
  readAt      DateTime?
  
  // 타임스탬프
  createdAt   DateTime  @default(now())
  
  // 관계
  user        User      @relation(fields: [userId], references: [id])
  
  @@index([userId, isRead])
  @@index([createdAt])
}

enum NotificationType {
  // 시스템
  SYSTEM_ANNOUNCEMENT
  SYSTEM_MAINTENANCE
  
  // 계정
  ACCOUNT_VERIFIED
  PASSWORD_CHANGED
  
  // 콘텐츠
  VIDEO_UPLOADED
  VIDEO_LIKED
  VIDEO_COMMENTED
  
  // 구독
  NEW_SUBSCRIBER
  CHANNEL_VIDEO
  
  // 비즈니스
  CAMPAIGN_APPROVED
  CAMPAIGN_COMPLETED
  BUDGET_ALERT
}
```

### UIConfig (UI 설정)

```prisma
model UIConfig {
  id        String    @id @default(uuid())
  key       String    @unique
  config    Json      // 전체 UI 설정 JSON
  
  // 타임스탬프
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  @@index([key])
}
```

### ActivityLog (활동 로그)

```prisma
model ActivityLog {
  id          String    @id @default(uuid())
  userId      String?
  
  action      String    // 'user.login', 'video.upload', etc
  entity      String?   // 'user', 'video', 'comment', etc
  entityId    String?   // 대상 엔티티 ID
  
  details     Json?     // 상세 정보
  ip          String?
  userAgent   String?
  
  // 타임스탬프
  createdAt   DateTime  @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([entity, entityId])
  @@index([createdAt])
}
```

## 인덱스 전략

### 성능 최적화 인덱스

```sql
-- 자주 조회되는 필드
CREATE INDEX idx_videos_published_at ON videos(published_at DESC);
CREATE INDEX idx_videos_view_count ON videos(view_count DESC);
CREATE INDEX idx_videos_status_visibility ON videos(status, visibility);

-- 복합 인덱스
CREATE INDEX idx_videos_channel_published ON videos(channel_id, published_at DESC);
CREATE INDEX idx_comments_video_created ON comments(video_id, created_at DESC);
CREATE INDEX idx_watch_history_user_watched ON watch_history(user_id, last_watched_at DESC);

-- 텍스트 검색
CREATE INDEX idx_videos_title_gin ON videos USING gin(to_tsvector('korean', title));
CREATE INDEX idx_videos_description_gin ON videos USING gin(to_tsvector('korean', description));

-- 부분 인덱스
CREATE INDEX idx_videos_public_published ON videos(published_at DESC) 
WHERE status = 'PUBLISHED' AND visibility = 'PUBLIC';
```

## 마이그레이션

### 초기 마이그레이션

```bash
# Prisma 마이그레이션 생성
npx prisma migrate dev --name init

# 마이그레이션 적용
npx prisma migrate deploy

# 시드 데이터 추가
npx prisma db seed
```

### 마이그레이션 파일 구조

```
prisma/
├── migrations/
│   ├── 20240101000000_init/
│   │   └── migration.sql
│   ├── 20240102000000_add_youtube_fields/
│   │   └── migration.sql
│   └── migration_lock.toml
├── schema.prisma
└── seed.ts
```

## 시드 데이터

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 카테고리 생성
  const categories = [
    { name: '게임', slug: 'gaming', order: 1 },
    { name: '음악', slug: 'music', order: 2 },
    { name: '교육', slug: 'education', order: 3 },
    { name: '엔터테인먼트', slug: 'entertainment', order: 4 },
    { name: '스포츠', slug: 'sports', order: 5 },
    { name: '뉴스', slug: 'news', order: 6 },
  ]
  
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category
    })
  }
  
  // 관리자 계정 생성
  const hashedPassword = await bcrypt.hash('admin123!@#', 10)
  
  await prisma.user.upsert({
    where: { email: 'admin@videopick.com' },
    update: {},
    create: {
      email: 'admin@videopick.com',
      password: hashedPassword,
      name: '관리자',
      type: 'ADMIN',
      role: 'SUPER_ADMIN',
      verified: true
    }
  })
  
  // UI 기본 설정
  await prisma.uIConfig.upsert({
    where: { key: 'main' },
    update: {},
    create: {
      key: 'main',
      config: {
        header: { /* 헤더 기본 설정 */ },
        footer: { /* 푸터 기본 설정 */ },
        sidebar: { /* 사이드바 기본 설정 */ },
        mainPage: { /* 메인페이지 기본 설정 */ }
      }
    }
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

## 백업 및 복구

### 백업 전략

```bash
# 전체 백업
pg_dump videopick > backup_$(date +%Y%m%d_%H%M%S).sql

# 스키마만 백업
pg_dump --schema-only videopick > schema_backup.sql

# 데이터만 백업
pg_dump --data-only videopick > data_backup.sql

# 특정 테이블 백업
pg_dump -t users -t videos videopick > partial_backup.sql
```

### 복구 절차

```bash
# 데이터베이스 복구
psql videopick < backup.sql

# Prisma 동기화
npx prisma db push --accept-data-loss
```

## 성능 최적화

### 쿼리 최적화

```typescript
// N+1 문제 해결 - include 사용
const videosWithChannel = await prisma.video.findMany({
  include: {
    channel: true,
    category: true,
    _count: {
      select: {
        comments: true,
        likes: true
      }
    }
  }
})

// 선택적 필드 로딩
const videos = await prisma.video.findMany({
  select: {
    id: true,
    title: true,
    thumbnailUrl: true,
    viewCount: true,
    channel: {
      select: {
        name: true,
        avatar: true
      }
    }
  }
})

// 페이지네이션
const videos = await prisma.video.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: {
    publishedAt: 'desc'
  }
})
```

### 커넥션 풀 설정

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### 데이터베이스 설정

```sql
-- 커넥션 설정
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';

-- 쿼리 최적화
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';

-- 로깅
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
```

## 모니터링

### 쿼리 모니터링

```sql
-- 느린 쿼리 찾기
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 테이블 크기 확인
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 인덱스 사용률
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

## 보안

### 권한 관리

```sql
-- 읽기 전용 사용자 생성
CREATE USER readonly_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE videopick TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- 애플리케이션 사용자
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE videopick TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

### 암호화

```typescript
// 민감한 정보 암호화
import crypto from 'crypto'

const algorithm = 'aes-256-gcm'
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

export function decrypt(text: string): string {
  const parts = text.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```