# 📋 환경변수 설정 가이드

## 1. 환경변수 파일 구조

### 파일 목록
- `.env` - 현재 사용 중인 환경변수
- `.env.video` - 동영상 플랫폼용 전체 환경변수
- `COOLIFY_ENV_VARS_VIDEO.txt` - Coolify 배포용 환경변수

## 2. 주요 변경사항

### 2.1 데이터베이스 변경
```bash
# 기존 (LinkPick)
DATABASE_URL="postgres://linkpick_user:LinkPick2024!@coolify.one-q.xyz:5433/revu_platform"

# 신규 (VideoPick)
DATABASE_URL="postgres://postgres:47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX@i4sccwsosskookos4084ogkc:5432/postgres"
```

### 2.2 Redis 활성화 (필수)
```bash
# 기존
DISABLE_REDIS="true"

# 신규 - Redis는 동영상 플랫폼에서 필수
DISABLE_REDIS="false"
REDIS_URL="redis://video-platform-redis:6379"
```

### 2.3 새로운 환경변수 카테고리

#### 동영상 스토리지
```bash
VIDEO_STORAGE_TYPE="s3"
S3_VIDEO_BUCKET="videopick-videos"
S3_THUMBNAIL_BUCKET="videopick-thumbnails"
MAX_VIDEO_SIZE_MB="10240"  # 10GB
```

#### 스트리밍
```bash
STREAMING_PROTOCOL="hls"
HLS_SEGMENT_DURATION="6"
STREAMING_SERVER_URL="https://stream.videopick.one-q.xyz"
```

#### 수익화
```bash
AD_REVENUE_SHARE="0.7"  # 크리에이터 70%
MIN_MONETIZATION_SUBSCRIBERS="1000"
MIN_MONETIZATION_WATCH_HOURS="4000"
```

## 3. Redis 사용 용도

동영상 플랫폼에서 Redis는 다음 용도로 필수적으로 사용됩니다:

### 3.1 캐싱 (DB 0)
- 동영상 메타데이터 캐싱
- 채널 정보 캐싱
- 추천 결과 캐싱
- 검색 결과 캐싱

### 3.2 세션 관리 (DB 1)
- 사용자 인증 토큰
- 로그인 세션
- 임시 인증 상태

### 3.3 작업 큐 (DB 2)
- 동영상 업로드 큐
- 인코딩 작업 큐
- 썸네일 생성 큐
- 알림 발송 큐

### 3.4 실시간 분석 (DB 3)
- 조회수 집계
- 실시간 시청자 수
- 트렌딩 계산
- 인기 동영상 추적

### 3.5 Pub/Sub (DB 4)
- 실시간 알림
- 라이브 채팅
- 구독 알림
- 업로드 완료 알림

## 4. 단계별 적용 방법

### Phase 1: 환경 준비 (현재)
```bash
# 1. 백업
cp .env .env.backup

# 2. 동영상 플랫폼 환경변수 추가 (기능은 비활성화)
cat >> .env << EOF

# === VIDEO PLATFORM PREPARATION ===
ENABLE_VIDEO_UPLOAD=false
ENABLE_VIDEO_PLAYER=false
SHOW_VIDEO_TAB=false
MIGRATION_MODE=prepare
EOF
```

### Phase 2: Redis 활성화
```bash
# Redis 활성화
DISABLE_REDIS=false
REDIS_URL=redis://video-platform-redis:6379
```

### Phase 3: 스토리지 설정
```bash
# AWS S3 설정 추가
VIDEO_STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_VIDEO_BUCKET=videopick-videos
```

### Phase 4: 기능 활성화
```bash
# 점진적 기능 활성화
SHOW_VIDEO_TAB=true
ENABLE_VIDEO_UPLOAD=true
ENABLE_VIDEO_PLAYER=true
```

## 5. Coolify 배포 시

1. `COOLIFY_ENV_VARS_VIDEO.txt` 파일의 내용을 복사
2. Coolify 대시보드에서 Environment Variables 섹션에 붙여넣기
3. AWS 키 등 실제 값으로 교체
4. 배포 실행

## 6. 환경변수 검증

### 필수 환경변수 체크리스트
- [ ] DATABASE_URL - 새 PostgreSQL 연결 정보
- [ ] REDIS_URL - Redis 연결 정보
- [ ] JWT_SECRET - 인증 시크릿
- [ ] AWS 자격증명 (S3 사용 시)
- [ ] VIDEO_CDN_URL - CDN 주소

### 옵션 환경변수
- [ ] 이메일 설정 (SMTP)
- [ ] 모니터링 (Sentry, DataDog)
- [ ] 검색 엔진 (Elasticsearch)

## 7. 주의사항

1. **Redis 필수**: 동영상 플랫폼은 Redis 없이 작동하지 않습니다
2. **스토리지 비용**: S3 사용 시 비용 모니터링 필요
3. **보안**: JWT_SECRET은 반드시 변경
4. **점진적 적용**: Feature Flag로 단계별 활성화

## 8. 문제 해결

### Redis 연결 실패
```bash
# Redis 컨테이너 확인
docker ps | grep redis

# Redis 연결 테스트
redis-cli -h video-platform-redis ping
```

### S3 연결 실패
```bash
# AWS 자격증명 확인
aws s3 ls s3://videopick-videos --profile videopick

# 버킷 정책 확인
aws s3api get-bucket-policy --bucket videopick-videos
```

### 환경변수 로드 실패
```bash
# 환경변수 확인
printenv | grep VIDEO_

# Next.js 환경변수 재로드
npm run dev -- --force
```