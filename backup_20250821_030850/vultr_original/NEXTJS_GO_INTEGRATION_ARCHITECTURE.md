# 🏗️ Next.js + Go 스트리밍 서버 통합 아키텍처

## 📊 전체 시스템 구성도

```
┌─────────────────────────────────────────────────────────────┐
│                        사용자 (브라우저)                      │
└─────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                    Nginx (리버스 프록시)                      │
│                         80, 443                              │
└─────────────────────────────────────────────────────────────┘
        ↓                      ↓                      ↓
┌──────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js    │    │   Go Services    │    │     Static      │
│   (3000)     │    │                  │    │   CDN/Storage   │
├──────────────┤    ├──────────────────┤    ├─────────────────┤
│ • 웹 UI      │    │ • API Gateway    │    │ • 비디오 파일   │
│ • SSR/SSG    │    │   (8080)         │    │ • 이미지        │
│ • React      │    │ • Stream Server  │    │ • 정적 자원     │
│              │    │   (1935, 8888)   │    │                 │
│              │    │ • Chat Server    │    │                 │
│              │    │   (8000)         │    │                 │
│              │    │ • Upload Server  │    │                 │
│              │    │   (8090)         │    │                 │
└──────────────┘    └──────────────────┘    └─────────────────┘
        ↓                      ↓                      ↓
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL (5432)                        │
│                  데이터베이스 (Prisma ORM)                   │
└─────────────────────────────────────────────────────────────┘
        ↓                      ↓                      ↓
┌─────────────────────────────────────────────────────────────┐
│                       Redis (6379)                           │
│               세션, 캐시, Pub/Sub, 실시간 데이터            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 서비스별 역할 분담

### Next.js (Frontend + BFF)
```typescript
// 담당 영역
- 사용자 인터페이스 (React)
- 서버사이드 렌더링 (SSR)
- 정적 생성 (SSG)
- API Routes (/api/*) - 인증, 비즈니스 로직
- Prisma ORM으로 DB 접근

// 통신 방식
- Go 서비스와 HTTP/WebSocket 통신
- JWT 토큰 공유
- Redis Session 공유
```

### Go Services (고성능 백엔드)
```go
// 담당 영역
- 라이브 스트리밍 (MediaMTX)
- 실시간 채팅 (Centrifugo)
- 대용량 파일 업로드 (TUS)
- 비디오 트랜스코딩 (FFmpeg wrapper)
- WebRTC 시그널링

// 통신 방식
- PostgreSQL 직접 접근 (pgx)
- Redis Pub/Sub
- gRPC 내부 통신
```

---

## 📁 프로젝트 구조

```
video_platform/
├── frontend/                 # Next.js 애플리케이션
│   ├── src/
│   │   ├── app/            # App Router
│   │   ├── components/     # React 컴포넌트
│   │   └── lib/           # 유틸리티
│   ├── prisma/            # Prisma 스키마
│   └── package.json
│
├── backend/                  # Go 서비스들
│   ├── cmd/
│   │   ├── api/           # API Gateway
│   │   ├── streaming/     # 스트리밍 서버
│   │   ├── chat/          # 채팅 서버
│   │   └── worker/        # 백그라운드 작업
│   ├── internal/
│   │   ├── config/        # 설정
│   │   ├── database/      # DB 연결
│   │   ├── auth/          # 인증
│   │   └── services/      # 비즈니스 로직
│   ├── pkg/               # 공용 패키지
│   ├── go.mod
│   └── go.sum
│
├── docker-compose.yml        # 전체 오케스트레이션
└── nginx.conf               # 리버스 프록시 설정
```

---

## 🔧 Go 백엔드 구현

### 1. API Gateway (Gin Framework)
```go
// backend/cmd/api/main.go
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/cors"
    "videopick/internal/auth"
    "videopick/internal/database"
    "videopick/internal/services"
)

func main() {
    // DB 연결
    db := database.Connect()
    defer db.Close()
    
    // Redis 연결
    redis := database.ConnectRedis()
    defer redis.Close()
    
    // Gin 라우터 설정
    r := gin.Default()
    
    // CORS 설정 (Next.js 연동)
    r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"http://localhost:3000"},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
        AllowHeaders:     []string{"Authorization", "Content-Type"},
        AllowCredentials: true,
    }))
    
    // JWT 미들웨어
    authMiddleware := auth.JWTMiddleware()
    
    // API 라우트
    api := r.Group("/api/v2")
    {
        // 공개 엔드포인트
        api.POST("/auth/login", services.Login)
        api.POST("/auth/register", services.Register)
        
        // 보호된 엔드포인트
        protected := api.Group("/")
        protected.Use(authMiddleware)
        {
            // 스트리밍 관련
            protected.POST("/streams/start", services.StartStream)
            protected.POST("/streams/stop", services.StopStream)
            protected.GET("/streams/key", services.GetStreamKey)
            
            // 업로드 관련
            protected.POST("/upload/init", services.InitUpload)
            protected.POST("/upload/chunk", services.UploadChunk)
            protected.POST("/upload/complete", services.CompleteUpload)
            
            // 실시간 통계
            protected.GET("/stats/live", services.GetLiveStats)
        }
    }
    
    r.Run(":8080")
}
```

### 2. 스트리밍 서버 (MediaMTX 통합)
```go
// backend/cmd/streaming/main.go
package main

import (
    "context"
    "fmt"
    "github.com/bluenviron/mediamtx/pkg/core"
    "videopick/internal/streaming"
)

type StreamingServer struct {
    core     *core.Core
    db       *sql.DB
    redis    *redis.Client
    recorder *streaming.Recorder
}

func (s *StreamingServer) OnPublish(ctx context.Context, streamKey string) error {
    // 스트림 키 검증
    user, err := s.ValidateStreamKey(streamKey)
    if err != nil {
        return fmt.Errorf("invalid stream key: %w", err)
    }
    
    // DB에 스트림 시작 기록
    streamID, err := s.CreateStreamSession(user.ID)
    if err != nil {
        return err
    }
    
    // 녹화 시작
    s.recorder.Start(streamID, streamKey)
    
    // Redis에 실시간 정보 발행
    s.redis.Publish(ctx, "stream:start", map[string]interface{}{
        "stream_id": streamID,
        "user_id":   user.ID,
        "started_at": time.Now(),
    })
    
    return nil
}

func (s *StreamingServer) OnRead(ctx context.Context, streamKey string) error {
    // 시청자 수 증가
    viewers, err := s.redis.Incr(ctx, fmt.Sprintf("viewers:%s", streamKey)).Result()
    if err != nil {
        return err
    }
    
    // 실시간 통계 업데이트
    s.UpdateStats(streamKey, viewers)
    
    return nil
}

func main() {
    // MediaMTX 설정
    conf := &core.Conf{
        Protocols: []string{"rtmp", "hls", "webrtc"},
        RTMP: &core.ConfRTMP{
            Address: ":1935",
        },
        HLS: &core.ConfHLS{
            Address: ":8888",
        },
        WebRTC: &core.ConfWebRTC{
            Address: ":8889",
        },
    }
    
    // 커스텀 핸들러 등록
    server := &StreamingServer{
        db:    database.Connect(),
        redis: database.ConnectRedis(),
        recorder: streaming.NewRecorder(),
    }
    
    core, err := core.New(conf)
    if err != nil {
        panic(err)
    }
    
    server.core = core
    core.Start()
    
    select {}
}
```

### 3. 채팅 서버 (Centrifugo 래퍼)
```go
// backend/cmd/chat/main.go
package main

import (
    "github.com/centrifugal/centrifuge"
    "github.com/gin-gonic/gin"
    "videopick/internal/chat"
)

type ChatServer struct {
    node     *centrifuge.Node
    db       *sql.DB
    redis    *redis.Client
    managers map[string]*chat.Manager
}

func (s *ChatServer) AuthMiddleware(h centrifuge.ConnectHandler) centrifuge.ConnectHandler {
    return func(client *centrifuge.Client) {
        // JWT 토큰 검증
        token := client.Token()
        user, err := s.ValidateToken(token)
        if err != nil {
            client.Disconnect(centrifuge.DisconnectInvalidToken)
            return
        }
        
        // 사용자 정보 설정
        client.UserID = user.ID
        h(client)
    }
}

func (s *ChatServer) OnMessage(client *centrifuge.Client, event centrifuge.PublishEvent) {
    // 메시지 필터링
    message := s.FilterMessage(event.Data)
    
    // 이모티콘 효과 확인
    if effects := s.CheckEmojiEffects(message); len(effects) > 0 {
        s.BroadcastEffects(event.Channel, effects)
    }
    
    // 슈퍼챗 처리
    if superChat := s.CheckSuperChat(message); superChat != nil {
        s.HandleSuperChat(client.UserID, superChat)
    }
    
    // DB에 메시지 저장
    s.SaveMessage(client.UserID, event.Channel, message)
}

func main() {
    // Centrifuge 노드 생성
    node, _ := centrifuge.New(centrifuge.Config{
        LogLevel: centrifuge.LogLevelInfo,
    })
    
    server := &ChatServer{
        node:     node,
        db:       database.Connect(),
        redis:    database.ConnectRedis(),
        managers: make(map[string]*chat.Manager),
    }
    
    // 핸들러 등록
    node.OnConnect(server.AuthMiddleware(func(client *centrifuge.Client) {
        log.Printf("User %s connected", client.UserID)
    }))
    
    node.OnPublish(server.OnMessage)
    
    // HTTP 핸들러 (WebSocket 업그레이드)
    r := gin.Default()
    r.GET("/connection/websocket", gin.WrapH(centrifuge.NewWebsocketHandler(node)))
    
    go func() {
        if err := r.Run(":8000"); err != nil {
            log.Fatal(err)
        }
    }()
    
    // 노드 시작
    if err := node.Run(); err != nil {
        log.Fatal(err)
    }
}
```

### 4. 대용량 업로드 서버 (TUS)
```go
// backend/cmd/upload/main.go
package main

import (
    "github.com/tus/tusd/pkg/handler"
    "github.com/tus/tusd/pkg/filestore"
    "videopick/internal/upload"
)

func main() {
    // TUS 스토어 설정
    store := filestore.FileStore{
        Path: "/uploads",
    }
    
    composer := handler.NewStoreComposer()
    store.UseIn(composer)
    
    // 커스텀 훅 설정
    handler, err := handler.NewHandler(handler.Config{
        BasePath:      "/files/",
        StoreComposer: composer,
        NotifyCompleteUploads: true,
    })
    
    if err != nil {
        panic(err)
    }
    
    // 업로드 완료 처리
    go func() {
        for {
            select {
            case info := <-handler.CompleteUploads:
                // 썸네일 생성
                upload.GenerateThumbnails(info.ID)
                
                // 트랜스코딩 작업 큐에 추가
                upload.QueueTranscoding(info.ID)
                
                // DB 업데이트
                upload.UpdateFileStatus(info.ID, "processing")
            }
        }
    }()
    
    http.Handle("/files/", http.StripPrefix("/files/", handler))
    http.ListenAndServe(":8090", nil)
}
```

---

## 🔗 Next.js 통합

### 1. API 클라이언트
```typescript
// frontend/src/lib/api/streaming.ts
class StreamingAPI {
  private baseURL = process.env.NEXT_PUBLIC_GO_API_URL || 'http://localhost:8080'
  
  async startStream(title: string, description: string) {
    const response = await fetch(`${this.baseURL}/api/v2/streams/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, description })
    })
    
    return response.json()
  }
  
  async getStreamKey() {
    const response = await fetch(`${this.baseURL}/api/v2/streams/key`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    })
    
    return response.json()
  }
  
  async getLiveStats() {
    const response = await fetch(`${this.baseURL}/api/v2/stats/live`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    })
    
    return response.json()
  }
}

export const streamingAPI = new StreamingAPI()
```

### 2. 스트리밍 컴포넌트
```tsx
// frontend/src/components/streaming/LiveStream.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { streamingAPI } from '@/lib/api/streaming'

export function LiveStream({ streamId }: { streamId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [viewers, setViewers] = useState(0)
  const [isLive, setIsLive] = useState(false)
  
  useEffect(() => {
    if (!videoRef.current) return
    
    // HLS 스트림 URL (Go 서버)
    const streamUrl = `http://localhost:8888/live/${streamId}/index.m3u8`
    
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveSyncDuration: 1
      })
      
      hls.loadSource(streamUrl)
      hls.attachMedia(videoRef.current)
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play()
        setIsLive(true)
      })
      
      return () => {
        hls.destroy()
      }
    }
  }, [streamId])
  
  useEffect(() => {
    // 실시간 통계 폴링
    const interval = setInterval(async () => {
      const stats = await streamingAPI.getLiveStats()
      setViewers(stats.viewers)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="relative">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        autoPlay
        muted
      />
      
      {isLive && (
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="bg-red-600 text-white px-2 py-1 rounded text-sm">
            LIVE
          </span>
          <span className="bg-black/50 text-white px-2 py-1 rounded text-sm">
            👁 {viewers.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  )
}
```

### 3. 채팅 컴포넌트
```tsx
// frontend/src/components/chat/LiveChat.tsx
'use client'

import { useEffect, useState } from 'react'
import { Centrifuge } from 'centrifuge'

export function LiveChat({ streamId }: { streamId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [connected, setConnected] = useState(false)
  
  useEffect(() => {
    // Centrifugo 연결 (Go 채팅 서버)
    const client = new Centrifuge('ws://localhost:8000/connection/websocket', {
      token: getToken()
    })
    
    client.on('connected', () => {
      setConnected(true)
    })
    
    const sub = client.newSubscription(`chat:${streamId}`)
    
    sub.on('publication', (ctx) => {
      setMessages(prev => [...prev, ctx.data])
      
      // 이모티콘 효과 처리
      if (ctx.data.effects) {
        showEmojiEffects(ctx.data.effects)
      }
    })
    
    sub.subscribe()
    client.connect()
    
    return () => {
      client.disconnect()
    }
  }, [streamId])
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} />
        ))}
      </div>
      
      <ChatInput 
        onSend={(text) => sendMessage(text)} 
        disabled={!connected}
      />
    </div>
  )
}
```

---

## 🐳 Docker Compose 통합

```yaml
version: '3.8'

services:
  # Next.js 프론트엔드
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/videopick
      - REDIS_URL=redis://redis:6379
      - NEXT_PUBLIC_GO_API_URL=http://localhost:8080
    depends_on:
      - postgres
      - redis

  # Go API Gateway
  go-api:
    build: 
      context: ./backend
      dockerfile: cmd/api/Dockerfile
    ports:
      - "8080:8080"
    environment:
      - DB_URL=postgres://postgres:password@postgres:5432/videopick
      - REDIS_URL=redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  # Go 스트리밍 서버
  go-streaming:
    build:
      context: ./backend
      dockerfile: cmd/streaming/Dockerfile
    ports:
      - "1935:1935"  # RTMP
      - "8888:8888"  # HLS
      - "8889:8889"  # WebRTC
    volumes:
      - ./recordings:/recordings
    depends_on:
      - postgres
      - redis

  # Go 채팅 서버
  go-chat:
    build:
      context: ./backend
      dockerfile: cmd/chat/Dockerfile
    ports:
      - "8000:8000"
    depends_on:
      - redis

  # Go 업로드 서버
  go-upload:
    build:
      context: ./backend
      dockerfile: cmd/upload/Dockerfile
    ports:
      - "8090:8090"
    volumes:
      - ./uploads:/uploads
    depends_on:
      - postgres

  # PostgreSQL
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=videopick
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # Redis
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  # Nginx
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - go-api
      - go-streaming

volumes:
  postgres_data:
  redis_data:
  recordings:
  uploads:
```

---

## 🚀 배포 전략

### 개발 환경
```bash
# 전체 시작
docker-compose up -d

# Go 서비스만 재시작
docker-compose restart go-api go-streaming go-chat

# Next.js 개발 모드
cd frontend && npm run dev
```

### 프로덕션 배포
```bash
# 1. Go 바이너리 빌드
cd backend
CGO_ENABLED=0 GOOS=linux go build -o bin/api cmd/api/main.go
CGO_ENABLED=0 GOOS=linux go build -o bin/streaming cmd/streaming/main.go
CGO_ENABLED=0 GOOS=linux go build -o bin/chat cmd/chat/main.go

# 2. Next.js 빌드
cd frontend
npm run build

# 3. Docker 이미지 생성
docker build -t videopick/frontend ./frontend
docker build -t videopick/go-services ./backend

# 4. 배포
docker stack deploy -c docker-compose.prod.yml videopick
```

---

## 📊 성능 최적화

### Go 서비스 최적화
```go
// 연결 풀 설정
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(5 * time.Minute)

// Redis 파이프라이닝
pipe := redis.Pipeline()
pipe.Incr(ctx, "viewers")
pipe.Expire(ctx, "viewers", time.Hour)
pipe.Exec(ctx)

// 고루틴 풀
workerPool := make(chan struct{}, 100)
```

### Next.js 최적화
```typescript
// ISR (Incremental Static Regeneration)
export const revalidate = 60 // 60초마다 재생성

// 이미지 최적화
import Image from 'next/image'

// API 캐싱
const { data } = useSWR('/api/streams', fetcher, {
  refreshInterval: 5000,
  revalidateOnFocus: false
})
```

---

## 🔐 보안 설정

### JWT 토큰 공유
```go
// Go에서 JWT 생성
token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
    "user_id": user.ID,
    "exp":     time.Now().Add(time.Hour * 24).Unix(),
})

// Next.js에서 검증
import { verify } from 'jsonwebtoken'
const decoded = verify(token, process.env.JWT_SECRET)
```

### CORS 설정
```go
// Go CORS
r.Use(cors.New(cors.Config{
    AllowOrigins: []string{process.env.FRONTEND_URL},
    AllowCredentials: true,
}))
```

---

*이 아키텍처는 Next.js의 장점(SSR, React)과 Go의 장점(고성능, 동시성)을 모두 활용합니다.*
*각 서비스는 독립적으로 스케일링 가능하며, 마이크로서비스 패턴을 따릅니다.*