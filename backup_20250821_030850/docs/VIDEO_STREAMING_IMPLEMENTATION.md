# 🎬 동영상 스트리밍 및 라이브 기능 구현 계획

## 현재 상태 분석

### ✅ 이미 구현된 기능
- 기본 HTML5 비디오 플레이어 (VideoPlayer.tsx)
- 간단한 파일 업로드 API (/api/videos/upload)
- 데이터베이스 스키마 (videos, live_streams, live_chat_messages)
- YouTube 비디오 임포트 시스템

### ❌ 구현이 필요한 기능
- 대용량 비디오 업로드 및 처리
- HLS/DASH 적응형 스트리밍
- RTMP 라이브 스트리밍
- WebSocket 실시간 채팅
- 비디오 트랜스코딩

## 🛠 기술 스택 제안

### 1. 동영상 업로드 & 처리

#### A. 클라우드 기반 솔루션 (권장)
```typescript
// AWS MediaConvert + S3 + CloudFront
const techStack = {
  upload: 'AWS S3 Multipart Upload',
  transcoding: 'AWS MediaConvert',
  storage: 'AWS S3',
  cdn: 'AWS CloudFront',
  streaming: 'HLS/DASH'
}
```

**장점**: 확장성, 안정성, 자동 트랜스코딩
**단점**: 비용, 복잡성

#### B. 셀프 호스팅 솔루션 (경제적)
```typescript
// FFmpeg + MinIO + Node.js
const techStack = {
  upload: 'tus-js-client (resumable upload)',
  transcoding: 'FFmpeg',
  storage: 'MinIO (S3 compatible)',
  cdn: 'Nginx + Local Cache',
  streaming: 'HLS with FFmpeg'
}
```

**장점**: 비용 효율적, 완전한 제어
**단점**: 직접 관리, 확장성 제한

### 2. 라이브 스트리밍

#### RTMP → HLS 파이프라인
```bash
# FFmpeg를 이용한 RTMP to HLS 변환
ffmpeg -i rtmp://localhost:1935/live/STREAM_KEY \
  -c:v libx264 -c:a aac \
  -preset veryfast -tune zerolatency \
  -f hls -hls_time 2 -hls_list_size 5 \
  -hls_flags delete_segments \
  /path/to/hls/stream.m3u8
```

### 3. 실시간 채팅

#### WebSocket + Redis
```typescript
// Socket.io + Redis Adapter
const chatStack = {
  websocket: 'Socket.io',
  scaling: 'Redis Adapter',
  persistence: 'PostgreSQL',
  cache: 'Redis'
}
```

## 📋 단계별 구현 계획

### Phase 1: 고급 비디오 업로드 (1-2주)

#### 1.1 대용량 파일 업로드
```typescript
// 청크 기반 업로드 구현
interface ChunkedUpload {
  chunkSize: 5 * 1024 * 1024; // 5MB chunks
  maxFileSize: 2 * 1024 * 1024 * 1024; // 2GB
  supportedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm'];
}
```

#### 1.2 업로드 진행률 추적
```typescript
// WebSocket을 통한 실시간 업로드 진행률
interface UploadProgress {
  uploadId: string;
  fileName: string;
  totalSize: number;
  uploadedSize: number;
  percentage: number;
  speed: number;
  estimatedTime: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
}
```

#### 1.3 비디오 메타데이터 추출
```typescript
// FFprobe를 이용한 메타데이터 추출
interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  codec: string;
  fileSize: number;
}
```

### Phase 2: 비디오 처리 & 스트리밍 (2-3주)

#### 2.1 FFmpeg 트랜스코딩
```typescript
// 다중 해상도 트랜스코딩
const transcodingProfiles = {
  '1080p': { width: 1920, height: 1080, bitrate: '5000k' },
  '720p': { width: 1280, height: 720, bitrate: '2500k' },
  '480p': { width: 854, height: 480, bitrate: '1200k' },
  '360p': { width: 640, height: 360, bitrate: '800k' }
}
```

#### 2.2 HLS 스트리밍
```typescript
// HLS 플레이리스트 생성
interface HLSConfig {
  segmentDuration: 4; // seconds
  targetDuration: 6; // seconds
  playlistType: 'VOD';
  formats: ['720p', '480p', '360p'];
}
```

#### 2.3 적응형 스트리밍 플레이어
```typescript
// HLS.js 통합 플레이어
interface AdaptivePlayer {
  autoQuality: boolean;
  qualitySelector: boolean;
  bufferLength: number;
  maxBufferLength: number;
}
```

### Phase 3: 라이브 스트리밍 (2-3주)

#### 3.1 RTMP 서버 설정
```yaml
# Docker Compose로 RTMP 서버
services:
  nginx-rtmp:
    image: alfg/nginx-rtmp
    ports:
      - "1935:1935"
      - "8080:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./hls:/var/www/hls
```

#### 3.2 스트림 키 관리
```typescript
interface LiveStream {
  id: string;
  channelId: string;
  title: string;
  streamKey: string;
  rtmpUrl: string;
  hlsUrl: string;
  status: 'preparing' | 'live' | 'ended';
  viewerCount: number;
  startedAt?: Date;
  endedAt?: Date;
}
```

#### 3.3 실시간 시청자 수
```typescript
// WebSocket을 통한 실시간 통계
interface LiveStats {
  streamId: string;
  viewerCount: number;
  peakViewers: number;
  duration: number;
  chatMessageCount: number;
  superChatAmount: number;
}
```

### Phase 4: 실시간 채팅 (1-2주)

#### 4.1 Socket.io 채팅 시스템
```typescript
// 실시간 채팅 서버
interface ChatMessage {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  avatar?: string;
  message: string;
  type: 'message' | 'super_chat' | 'gift';
  timestamp: Date;
  amount?: number; // 후원 금액
  color?: string;   // 메시지 색상
}
```

#### 4.2 채팅 모더레이션
```typescript
interface ChatModeration {
  badWords: string[];
  slowMode: number; // seconds
  subscriberOnly: boolean;
  moderators: string[];
  bannedUsers: string[];
  timeouts: Map<string, Date>;
}
```

#### 4.3 슈퍼채팅 & 후원
```typescript
interface SuperChat {
  id: string;
  streamId: string;
  userId: string;
  amount: number;
  currency: string;
  message: string;
  color: string;
  duration: number; // 상단 고정 시간
  isPaid: boolean;
}
```

## 🏗 구현 아키텍처

### 전체 시스템 구조
```
┌─────────────────────────────────────────────────┐
│                 Frontend                         │
│  Next.js + React + Socket.io Client            │
│  - Video Upload UI                              │
│  - HLS Video Player                             │
│  - Live Chat Interface                          │
│  - Stream Dashboard                             │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────┐
│                 Backend                          │
│  Next.js API Routes + Socket.io Server         │
│  - Upload Management                            │
│  - Video Processing Queue                       │
│  - Stream Management                            │
│  - Chat System                                  │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────┐
│              Infrastructure                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │   MinIO     │ │   FFmpeg    │ │    Redis    ││
│  │ (Storage)   │ │(Transcoding)│ │  (Cache)    ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
│                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │ Nginx-RTMP  │ │ PostgreSQL  │ │   Docker    ││
│  │(Live Stream)│ │ (Database)  │ │(Container)  ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────┘
```

### 데이터 플로우
```
1. 비디오 업로드
   User → Frontend → API → MinIO → FFmpeg → HLS → CDN

2. 라이브 스트리밍
   OBS → RTMP → Nginx-RTMP → FFmpeg → HLS → Frontend

3. 실시간 채팅
   User → Socket.io → Redis → PostgreSQL → All Connected Users
```

## 📦 필요한 패키지

### Frontend
```json
{
  "dependencies": {
    "hls.js": "^1.4.0",
    "socket.io-client": "^4.7.0",
    "react-dropzone": "^14.2.0",
    "react-player": "^2.12.0"
  }
}
```

### Backend
```json
{
  "dependencies": {
    "socket.io": "^4.7.0",
    "fluent-ffmpeg": "^2.1.2",
    "@aws-sdk/client-s3": "^3.0.0",
    "redis": "^4.6.0",
    "minio": "^7.1.0",
    "multer": "^1.4.5-lts.1"
  }
}
```

### DevOps
```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
      - minio
      - nginx-rtmp

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: videopick
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: password123
    command: server /data --console-address ":9001"

  nginx-rtmp:
    image: alfg/nginx-rtmp
    ports:
      - "1935:1935"
      - "8080:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./hls:/var/www/hls
```

## 💰 비용 고려사항

### 클라우드 vs 셀프 호스팅

#### 클라우드 (AWS/GCP/Azure)
- **월 예상 비용**: $100-500 (트래픽에 따라)
- **장점**: 자동 스케일링, 안정성, 글로벌 CDN
- **단점**: 지속적인 비용, 종속성

#### 셀프 호스팅
- **초기 비용**: 서버 구축 $50-200
- **월 운영비**: $20-100 (서버 + 대역폭)
- **장점**: 낮은 운영비, 완전 제어
- **단점**: 기술적 복잡성, 확장성 제한

## 🚦 우선순위 및 단계별 구현

### 1단계 (즉시 시작 가능)
1. **대용량 파일 업로드** - 기존 업로드 API 개선
2. **기본 비디오 처리** - FFmpeg 트랜스코딩 구현
3. **개선된 비디오 플레이어** - HLS.js 통합

### 2단계 (1-2주 후)
1. **라이브 스트리밍 기초** - RTMP 서버 설정
2. **실시간 채팅** - Socket.io 구현
3. **스트림 관리 UI** - 크리에이터 대시보드

### 3단계 (1개월 후)
1. **고급 기능** - 슈퍼채팅, 모더레이션
2. **모바일 최적화** - 반응형 플레이어
3. **분석 및 모니터링** - 시청 통계, 성능 모니터링

## 🔧 개발 환경 설정

### Docker 개발 환경
```bash
# 1. 저장소 클론
git clone <repository>
cd video_platform

# 2. Docker 환경 구성
cp .env.example .env.local
docker-compose -f docker-compose.dev.yml up -d

# 3. 데이터베이스 마이그레이션
npm run prisma:migrate

# 4. 개발 서버 실행
npm run dev
```

### FFmpeg 설치
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Docker
docker pull jrottenberg/ffmpeg
```

이 계획을 바탕으로 어떤 부분부터 구현하시겠습니까? 

1. **대용량 파일 업로드** 부터 시작
2. **라이브 스트리밍** 부터 시작  
3. **실시간 채팅** 부터 시작
4. **전체 시스템 아키텍처** 설정부터 시작

추천드리는 순서는 **1 → 4 → 2 → 3** 입니다!