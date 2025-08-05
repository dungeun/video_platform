# 🎯 VideoPick 빠른 시작 가이드

> PRD_VIDEO_PLATFORM_V2.md 기반 실행 가이드

## 📋 체크리스트

### 1. 환경 변수 설정 ✅
```bash
# 1. 기존 .env 파일 백업
cp .env .env.backup

# 2. 비디오 플랫폼용 환경 변수 설정
cp .env.video .env

# 3. Ant Media 환경 변수 추가
cat .env.antmedia >> .env
```

### 2. Ant Media Server 설치 🚀
```bash
# Vultr 서버에서 실행
wget https://raw.githubusercontent.com/videopick/setup/main/install-antmedia.sh
chmod +x install-antmedia.sh
sudo ./install-antmedia.sh

# S3 설정
./configure-s3.sh
```

### 3. Appwrite 컬렉션 생성 📊
```javascript
// Appwrite 대시보드에서 생성할 컬렉션
Collections:
- users (확장)
- channels
- videos
- live_streams
- comments
- subscriptions
- analytics
```

### 4. 데이터베이스 마이그레이션 🗄️
```bash
# Prisma 스키마 업데이트
npx prisma generate
npx prisma db push

# 시드 데이터 (선택사항)
npm run db:seed
```

## 🔧 핵심 설정 파일

### 1. `.env` (환경 변수)
```env
# Database
DATABASE_URL="postgres://..."

# Redis
REDIS_URL="redis://..."

# Appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT="https://appwrite.coolify.one-q.xyz/v1"
NEXT_PUBLIC_APPWRITE_PROJECT_ID="videopick"

# Ant Media
ANT_MEDIA_URL="https://stream.video.one-q.xyz:5443"
ANT_MEDIA_APP="LiveApp"

# Vultr Storage
VULTR_ACCESS_KEY="..."
VULTR_SECRET_KEY="..."
VULTR_BUCKET_NAME="videopick-recordings"
```

### 2. `prisma/schema.prisma` (데이터 모델)
```prisma
// 주요 모델
model Channel { ... }
model Video { ... }
model LiveStream { ... }
model User { ... }
```

## 🚀 개발 서버 실행

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 시작
npm run dev

# 3. 접속
http://localhost:3000
```

## 📱 주요 페이지 구조

```
/                     # 홈 (추천 영상)
/live                 # 라이브 목록
/channel/[id]         # 채널 페이지
/video/[id]          # 비디오 재생
/stream/[id]         # 라이브 시청
/studio              # 크리에이터 스튜디오
/studio/upload       # 영상 업로드
/studio/live         # 라이브 방송
```

## 🔌 API 엔드포인트

### 스트리밍 API
```
POST   /api/streams/create      # 스트림 생성
GET    /api/streams/[id]        # 스트림 정보
POST   /api/streams/[id]/start  # 방송 시작
POST   /api/streams/[id]/end    # 방송 종료
```

### 비디오 API
```
POST   /api/videos/upload       # 업로드 URL 생성
GET    /api/videos/[id]         # 비디오 정보
PUT    /api/videos/[id]         # 정보 수정
DELETE /api/videos/[id]         # 삭제
```

## 🧪 테스트

### 1. 라이브 스트리밍 테스트
```bash
# OBS 설정
서버: rtmp://stream.video.one-q.xyz/LiveApp
스트림 키: test-stream-001

# 시청 URL
https://stream.video.one-q.xyz:5443/LiveApp/play.html?name=test-stream-001
```

### 2. VOD 업로드 테스트
```bash
# API로 업로드 URL 받기
curl -X POST http://localhost:3000/api/videos/upload \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.mp4","size":1000000}'
```

## 📊 모니터링

### 1. Ant Media 상태
```
https://stream.video.one-q.xyz:5080
```

### 2. 시스템 로그
```bash
# Ant Media 로그
tail -f /usr/local/antmedia/log/ant-media-server.log

# Next.js 로그
pm2 logs videopick
```

## 🚨 문제 해결

### 1. 스트리밍 연결 안됨
- 방화벽 포트 확인 (1935, 5080, 5443)
- SSL 인증서 확인
- Ant Media 서비스 상태 확인

### 2. 업로드 실패
- Vultr Object Storage 권한 확인
- CORS 설정 확인
- 파일 크기 제한 확인

### 3. 인증 문제
- Appwrite 프로젝트 ID 확인
- API 키 설정 확인
- 세션 쿠키 확인

## 📞 지원

- 문서: `/docs/📋_DOCUMENT_INDEX.md`
- 이슈: GitHub Issues
- 로그: `/var/log/videopick/`

---

시작하기: **Ant Media Server 설치부터 시작하세요!**