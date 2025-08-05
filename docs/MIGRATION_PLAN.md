# 🔄 동영상 플랫폼 마이그레이션 계획

## 1. 마이그레이션 개요

### 1.1 목표
- LinkPick 캠페인 플랫폼 → VideoPick 동영상 플랫폼 전환
- 기존 사용자 및 데이터 보존
- 무중단 서비스 전환
- 단계적 기능 출시

### 1.2 전체 일정
- **총 기간**: 6개월
- **Phase 1**: 준비 단계 (1개월)
- **Phase 2**: 인프라 구축 (2개월)
- **Phase 3**: 데이터 마이그레이션 (1개월)
- **Phase 4**: 점진적 전환 (2개월)

## 2. Phase 1: 준비 단계 (1개월)

### 2.1 환경 설정 준비
```bash
# 1. 환경 변수 파일 분리
.env.legacy     # 기존 LinkPick 설정
.env.video      # VideoPick 설정
.env.migration  # 마이그레이션 전용 설정

# 2. 신규 환경 변수 추가 (코드 수정 없이)
cp .env .env.backup
cat >> .env << EOF

# === VIDEO PLATFORM CONFIGURATION ===
# Storage
VIDEO_STORAGE_TYPE=s3
VIDEO_STORAGE_BUCKET=videopick-videos-dev
VIDEO_CDN_URL=https://d1234567.cloudfront.net
MAX_VIDEO_SIZE_MB=10240
ALLOWED_VIDEO_FORMATS=mp4,avi,mov,mkv,webm

# Streaming
STREAMING_PROTOCOL=hls
HLS_SEGMENT_DURATION=6
STREAMING_SERVER_URL=https://stream-dev.videopick.com

# Processing
VIDEO_PROCESSING_ENABLED=false
ENCODING_SERVICE_URL=https://encode-dev.videopick.com
FFMPEG_PATH=/usr/local/bin/ffmpeg

# Analytics
VIDEO_ANALYTICS_ENABLED=false
ANALYTICS_DB_URL=postgresql://analytics:pass@localhost:5432/videopick_analytics

# Monetization
MONETIZATION_ENABLED=false
AD_REVENUE_SHARE=0.7
MIN_MONETIZATION_SUBSCRIBERS=1000
EOF
```

### 2.2 데이터베이스 준비
```sql
-- 1. 새 스키마 생성 (기존 DB 유지)
CREATE SCHEMA IF NOT EXISTS video_platform;

-- 2. 마이그레이션 추적 테이블
CREATE TABLE video_platform.migration_status (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50),
    legacy_id VARCHAR(50),
    new_id VARCHAR(50),
    status VARCHAR(20),
    migrated_at TIMESTAMP,
    metadata JSONB
);

-- 3. 매핑 테이블
CREATE TABLE video_platform.entity_mapping (
    legacy_table VARCHAR(50),
    legacy_id VARCHAR(50),
    new_table VARCHAR(50),
    new_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.3 스토리지 준비
```bash
# AWS S3 버킷 구조 설계
videopick-videos-dev/
├── originals/           # 원본 동영상
├── encoded/            # 인코딩된 동영상
│   ├── 1080p/
│   ├── 720p/
│   ├── 480p/
│   └── 360p/
├── thumbnails/         # 썸네일
├── previews/          # 미리보기 클립
└── temp/              # 임시 업로드

videopick-static-dev/
├── channel-banners/
├── channel-avatars/
└── community-images/
```

## 3. Phase 2: 인프라 구축 (2개월)

### 3.1 서비스 아키텍처 준비

#### Docker Compose 설정 (개발 환경)
```yaml
# docker-compose.video.yml
version: '3.8'

services:
  # 기존 서비스 유지
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: videopick
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    volumes:
      - ./init-video-db.sql:/docker-entrypoint-initdb.d/init.sql
  
  redis:
    image: redis:7-alpine
    
  # 신규 서비스 추가
  minio:  # S3 호환 로컬 스토리지
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
      
  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
```

### 3.2 마이그레이션 스크립트 준비

#### 데이터 매핑 정의
```javascript
// scripts/migration/mappings.js
const ENTITY_MAPPINGS = {
  // 사용자 타입 매핑
  USER_TYPE: {
    'BUSINESS': 'ADVERTISER',
    'INFLUENCER': 'CREATOR',
    'ADMIN': 'ADMIN'
  },
  
  // 상태 매핑
  CAMPAIGN_TO_VIDEO_STATUS: {
    'DRAFT': 'PRIVATE',
    'ACTIVE': 'PUBLISHED',
    'PAUSED': 'UNLISTED',
    'COMPLETED': 'PUBLISHED'
  },
  
  // 테이블 매핑
  TABLE_MAPPING: {
    'campaigns': 'videos',
    'campaign_applications': 'video_submissions',
    'business_profiles': 'channel_settings',
    'saved_campaigns': 'watch_later'
  }
};

module.exports = ENTITY_MAPPINGS;
```

#### 마이그레이션 유틸리티
```javascript
// scripts/migration/utils.js
const BATCH_SIZE = 100;
const MIGRATION_LOG_FILE = './migration.log';

class MigrationLogger {
  static log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    fs.appendFileSync(MIGRATION_LOG_FILE, logEntry);
    console.log(logEntry.trim());
  }
}

class MigrationTracker {
  static async markMigrated(entityType, legacyId, newId, status = 'completed') {
    // 마이그레이션 상태 추적
    await prisma.$executeRaw`
      INSERT INTO video_platform.migration_status 
      (entity_type, legacy_id, new_id, status, migrated_at)
      VALUES (${entityType}, ${legacyId}, ${newId}, ${status}, NOW())
    `;
  }
  
  static async checkMigrated(entityType, legacyId) {
    const result = await prisma.$queryRaw`
      SELECT * FROM video_platform.migration_status
      WHERE entity_type = ${entityType} AND legacy_id = ${legacyId}
    `;
    return result.length > 0;
  }
}
```

## 4. Phase 3: 데이터 마이그레이션 (1개월)

### 4.1 마이그레이션 순서
1. **사용자 계정** (우선순위: 높음)
2. **프로필 정보** (우선순위: 높음)
3. **캠페인 → 동영상 메타데이터** (우선순위: 중간)
4. **상호작용 데이터** (우선순위: 낮음)
5. **분석 데이터** (우선순위: 낮음)

### 4.2 사용자 마이그레이션 전략

#### Step 1: 사용자 타입 전환
```sql
-- 백업 테이블 생성
CREATE TABLE users_backup AS SELECT * FROM users;

-- 사용자 타입 매핑 (실제 UPDATE는 하지 않음)
-- 대신 뷰를 생성하여 새로운 타입으로 보이게 함
CREATE OR REPLACE VIEW video_platform.users_view AS
SELECT 
  id,
  email,
  name,
  CASE type
    WHEN 'BUSINESS' THEN 'ADVERTISER'
    WHEN 'INFLUENCER' THEN 'CREATOR'
    ELSE type
  END as type,
  status,
  created_at,
  updated_at
FROM users;
```

#### Step 2: 채널 생성 준비
```sql
-- 크리에이터용 채널 데이터 준비
CREATE TABLE video_platform.channels_prep AS
SELECT 
  gen_random_uuid() as id,
  u.id as user_id,
  COALESCE(p.name, u.name) as name,
  LOWER(REPLACE(COALESCE(p.name, u.name), ' ', '')) as handle,
  COALESCE(bp.company_intro, p.bio) as description,
  p.profile_image as avatar_url,
  0 as subscriber_count,
  0 as video_count,
  0 as view_count,
  NOW() as created_at
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN business_profiles bp ON u.id = bp.user_id
WHERE u.type IN ('INFLUENCER', 'BUSINESS');
```

### 4.3 콘텐츠 마이그레이션 전략

#### 캠페인 → 비디오 더미 데이터
```sql
-- 캠페인을 비디오 메타데이터로 변환 (실제 동영상 없이)
CREATE TABLE video_platform.videos_prep AS
SELECT
  c.id,
  ch.id as channel_id,
  c.title,
  c.description,
  c.thumbnail_image_url as thumbnail_url,
  NULL as video_url,  -- 아직 실제 동영상 없음
  0 as duration,
  COALESCE(c.view_count, 0) as view_count,
  0 as like_count,
  0 as dislike_count,
  CASE c.status
    WHEN 'DRAFT' THEN 'PRIVATE'
    WHEN 'ACTIVE' THEN 'PUBLISHED'
    WHEN 'PAUSED' THEN 'UNLISTED'
    ELSE 'PUBLISHED'
  END as status,
  c.created_at as published_at,
  'CAMPAIGN_MIGRATION' as category,
  string_to_array(c.hashtags, ',') as tags,
  c.created_at,
  c.updated_at
FROM campaigns c
JOIN video_platform.channels_prep ch ON c.business_id = ch.user_id;
```

### 4.4 점진적 마이그레이션 스크립트

```javascript
// scripts/migration/gradual-migration.js
async function migrateInBatches() {
  const DAILY_LIMIT = 1000;
  let offset = 0;
  
  while (true) {
    // 오늘 할당량 확인
    const todayMigrated = await prisma.$queryRaw`
      SELECT COUNT(*) FROM video_platform.migration_status
      WHERE DATE(migrated_at) = CURRENT_DATE
    `;
    
    if (todayMigrated[0].count >= DAILY_LIMIT) {
      console.log('Daily limit reached. Resuming tomorrow.');
      break;
    }
    
    // 배치 처리
    const batch = await prisma.user.findMany({
      skip: offset,
      take: BATCH_SIZE,
      where: {
        type: { in: ['INFLUENCER', 'BUSINESS'] }
      }
    });
    
    if (batch.length === 0) break;
    
    for (const user of batch) {
      await migrateUser(user);
    }
    
    offset += BATCH_SIZE;
  }
}
```

## 5. Phase 4: 점진적 전환 (2개월)

### 5.1 기능 플래그 설정
```javascript
// config/feature-flags.js
const FEATURE_FLAGS = {
  // Phase 4.1 (첫 2주)
  SHOW_VIDEO_TAB: process.env.ENABLE_VIDEO_TAB === 'true',
  ENABLE_VIDEO_UPLOAD: process.env.ENABLE_VIDEO_UPLOAD === 'true',
  
  // Phase 4.2 (3-4주)
  ENABLE_VIDEO_PLAYER: process.env.ENABLE_VIDEO_PLAYER === 'true',
  ENABLE_CHANNELS: process.env.ENABLE_CHANNELS === 'true',
  
  // Phase 4.3 (5-6주)
  ENABLE_SUBSCRIPTIONS: process.env.ENABLE_SUBSCRIPTIONS === 'true',
  ENABLE_RECOMMENDATIONS: process.env.ENABLE_RECOMMENDATIONS === 'true',
  
  // Phase 4.4 (7-8주)
  ENABLE_MONETIZATION: process.env.ENABLE_MONETIZATION === 'true',
  DISABLE_LEGACY_CAMPAIGNS: process.env.DISABLE_LEGACY_CAMPAIGNS === 'true'
};
```

### 5.2 사용자 안내 계획

#### 인앱 공지사항
```javascript
// 단계별 공지 메시지
const MIGRATION_NOTICES = {
  PHASE_1: {
    title: "LinkPick이 동영상 플랫폼으로 진화합니다!",
    message: "곧 동영상 콘텐츠를 업로드하고 공유할 수 있습니다.",
    cta: "자세히 알아보기"
  },
  PHASE_2: {
    title: "동영상 기능이 베타 오픈되었습니다",
    message: "이제 동영상을 업로드하고 채널을 만들 수 있습니다.",
    cta: "채널 만들기"
  },
  PHASE_3: {
    title: "캠페인이 동영상으로 전환됩니다",
    message: "기존 캠페인은 자동으로 동영상 콘텐츠로 변환됩니다.",
    cta: "내 콘텐츠 보기"
  }
};
```

### 5.3 롤백 계획

#### 데이터 롤백
```sql
-- 롤백 스크립트 준비
CREATE OR REPLACE FUNCTION rollback_migration(target_date TIMESTAMP)
RETURNS void AS $$
BEGIN
  -- 마이그레이션 이후 생성된 데이터 삭제
  DELETE FROM video_platform.videos 
  WHERE created_at > target_date;
  
  DELETE FROM video_platform.channels 
  WHERE created_at > target_date;
  
  -- 백업에서 복원
  INSERT INTO campaigns 
  SELECT * FROM campaigns_backup;
  
  -- 매핑 테이블 초기화
  TRUNCATE TABLE video_platform.migration_status;
  TRUNCATE TABLE video_platform.entity_mapping;
END;
$$ LANGUAGE plpgsql;
```

#### 기능 롤백
```bash
# 환경 변수로 즉시 롤백
export ENABLE_VIDEO_TAB=false
export ENABLE_VIDEO_UPLOAD=false
export USE_LEGACY_ROUTES=true

# 또는 .env 파일 수정
sed -i 's/ENABLE_VIDEO_TAB=true/ENABLE_VIDEO_TAB=false/g' .env
```

## 6. 모니터링 및 검증

### 6.1 마이그레이션 대시보드
```sql
-- 마이그레이션 진행 상황 뷰
CREATE VIEW migration_dashboard AS
SELECT 
  entity_type,
  COUNT(*) as total_migrated,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  MAX(migrated_at) as last_migration
FROM video_platform.migration_status
GROUP BY entity_type;
```

### 6.2 데이터 무결성 검증
```javascript
// scripts/migration/verify-migration.js
async function verifyDataIntegrity() {
  const checks = [
    {
      name: 'User Count Match',
      query: async () => {
        const legacyCount = await prisma.user.count();
        const migratedCount = await prisma.$queryRaw`
          SELECT COUNT(*) FROM video_platform.migration_status
          WHERE entity_type = 'user' AND status = 'completed'
        `;
        return legacyCount === migratedCount[0].count;
      }
    },
    {
      name: 'No Orphaned Records',
      query: async () => {
        const orphaned = await prisma.$queryRaw`
          SELECT COUNT(*) FROM video_platform.channels
          WHERE user_id NOT IN (SELECT id FROM users)
        `;
        return orphaned[0].count === 0;
      }
    }
  ];
  
  for (const check of checks) {
    const result = await check.query();
    console.log(`${check.name}: ${result ? 'PASS' : 'FAIL'}`);
  }
}
```

## 7. 위험 관리

### 7.1 주요 위험 요소
1. **데이터 손실**: 백업 및 검증 프로세스로 대응
2. **서비스 중단**: 점진적 전환 및 롤백 계획으로 대응
3. **사용자 이탈**: 충분한 안내 및 인센티브 제공
4. **성능 저하**: 캐싱 및 최적화로 대응

### 7.2 비상 계획
- 24시간 모니터링 체제
- 즉시 롤백 가능한 시스템
- 핫라인 운영
- 일일 백업 및 검증

## 8. 완료 기준

### 8.1 성공 지표
- [ ] 모든 사용자 데이터 무손실 마이그레이션
- [ ] 99.9% 이상 가동률 유지
- [ ] 사용자 이탈률 10% 미만
- [ ] 신규 동영상 업로드 일 100건 이상
- [ ] 롤백 없이 전체 전환 완료

### 8.2 최종 확인사항
- [ ] 모든 레거시 API 제거
- [ ] 구 도메인 리다이렉트 설정
- [ ] 데이터 아카이빙 완료
- [ ] 문서화 업데이트 완료