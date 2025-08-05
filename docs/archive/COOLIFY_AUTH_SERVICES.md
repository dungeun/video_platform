# 🔐 Coolify에서 설치 가능한 인증 서비스

## 1. Coolify 공식 지원 인증 서비스

### 1.1 Keycloak ✅
```yaml
설치 방법:
  - Coolify → Add Service → Keycloak
  - 1-Click 설치 가능
  
특징:
  - Red Hat 개발
  - 엔터프라이즈급 IAM
  - 소셜 로그인 지원 (Google, GitHub, etc.)
  - 관리자 UI 제공
  - OIDC/SAML 지원
  
리소스:
  - RAM: 1-2GB
  - CPU: 1-2 cores
  - 무거운 편
```

### 1.2 Appwrite ✅
```yaml
설치 방법:
  - Coolify → Add Service → Appwrite
  - 1-Click 설치 가능
  
특징:
  - Firebase 대안 (가장 유사!)
  - Auth + Database + Storage + Functions
  - 실시간 기능 지원
  - 웹 콘솔 제공
  - SDK 다양함
  
리소스:
  - RAM: 2-4GB
  - CPU: 2 cores
  - 중간 정도
```

### 1.3 Logto ✅
```yaml
설치 방법:
  - Coolify → Add Service → Logto
  - 1-Click 설치 가능
  
특징:
  - 현대적인 인증 서비스
  - 깔끔한 UI/UX
  - 다국어 지원
  - 소셜 로그인
  - Passwordless 지원
  
리소스:
  - RAM: 512MB-1GB
  - CPU: 1 core
  - 가벼움
```

## 2. 동영상 플랫폼 추천: Appwrite

### 2.1 왜 Appwrite인가?
```yaml
Firebase/Supabase와 유사:
  - ✅ Authentication (인증)
  - ✅ Database (문서 DB)
  - ✅ Storage (파일 저장)
  - ✅ Functions (서버리스)
  - ✅ Realtime (실시간)
  
동영상 플랫폼 적합성:
  - ✅ 대용량 파일 업로드 지원
  - ✅ 실시간 채팅 가능
  - ✅ 소셜 로그인 (YouTube, Google)
  - ✅ JWT 토큰 지원
  - ✅ 웹훅 지원
```

### 2.2 Coolify에서 Appwrite 설치
```bash
# 1. Coolify 대시보드에서
Services → Add Service → Appwrite

# 2. 설정
Domain: auth.video.one-q.xyz
Appwrite Endpoint: https://auth.video.one-q.xyz/v1

# 3. 환경변수 (자동 생성됨)
_APP_ENV=production
_APP_DOMAIN=auth.video.one-q.xyz
_APP_DOMAIN_TARGET=auth.video.one-q.xyz
```

### 2.3 Appwrite 실시간 채팅 구현
```typescript
// lib/appwrite/client.ts
import { Client, Account, Databases, Storage, Realtime } from 'appwrite'

const client = new Client()
  .setEndpoint('https://auth.video.one-q.xyz/v1')
  .setProject('videopick')

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)
export const realtime = new Realtime(client)

// 실시간 채팅
export function subscribeToChat(streamId: string, callback: (message: any) => void) {
  return client.subscribe(
    `databases.chat.collections.messages.documents`,
    callback
  )
}

// 메시지 전송
export async function sendMessage(streamId: string, message: string) {
  const user = await account.get()
  
  return databases.createDocument(
    'chat',
    'messages',
    'unique()',
    {
      streamId,
      userId: user.$id,
      username: user.name,
      message,
      timestamp: new Date()
    }
  )
}
```

## 3. 대안: Pocketbase (수동 설치)

### 3.1 특징
```yaml
Pocketbase:
  - SQLite 기반 (가벼움!)
  - 단일 실행 파일
  - Auth + DB + Realtime
  - 관리자 UI 내장
  - 100MB 미만
```

### 3.2 Coolify Docker 설치
```dockerfile
# Dockerfile
FROM alpine:latest

RUN apk add --no-cache ca-certificates

ADD https://github.com/pocketbase/pocketbase/releases/download/v0.20.0/pocketbase_0.20.0_linux_amd64.zip /tmp/
RUN unzip /tmp/pocketbase_*.zip -d /pb/

EXPOSE 8090

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  pocketbase:
    build: .
    ports:
      - "8090:8090"
    volumes:
      - ./pb_data:/pb/pb_data
    restart: unless-stopped
```

## 4. 각 서비스별 채팅 구현 비교

### 4.1 Appwrite
```typescript
// Appwrite 실시간
client.subscribe('collections.messages.documents', (response) => {
  console.log('New message:', response.payload)
})
```

### 4.2 Pocketbase
```typescript
// Pocketbase 실시간
pb.collection('messages').subscribe('*', (e) => {
  console.log('New message:', e.record)
})
```

### 4.3 기존 Redis (현재 사용 가능)
```typescript
// Redis Pub/Sub
import { createClient } from 'redis'

const sub = createClient({ 
  url: 'redis://default:uu1SxljgYlrQpLlhIqXUn4GY1TNUuu81hk0IL0bDdT7WbuoDZ2JxUWITk9PVgQ2Q@bssgk8sogo8cgs4c4o0gkwkw:6379/4' 
})

await sub.subscribe(`chat:${streamId}`, (message) => {
  console.log('New message:', message)
})
```

## 5. 최종 추천

### 5.1 즉시 사용 가능 (Coolify 1-Click)
```yaml
1순위 - Appwrite:
  - Firebase와 가장 유사
  - 모든 기능 포함
  - 실시간 채팅 지원
  - 파일 스토리지 포함

2순위 - Logto:
  - 인증만 필요한 경우
  - 가볍고 빠름
  - 현대적인 UI

3순위 - Keycloak:
  - 엔터프라이즈급 필요시
  - 복잡하지만 강력함
```

### 5.2 하이브리드 접근 (권장)
```yaml
인증: Appwrite 또는 Logto
채팅: Redis Pub/Sub (이미 있음)
파일: AWS S3 또는 Appwrite Storage
DB: PostgreSQL (이미 있음)

장점:
  - 각 서비스의 강점 활용
  - 유연한 확장
  - 비용 효율적
```

## 6. 마이그레이션 전략

### 6.1 단계별 접근
```yaml
Phase 1: 현재 JWT 유지
  - Redis로 채팅 구현
  - 기본 기능 개발

Phase 2: Appwrite 추가
  - 소셜 로그인 추가
  - 파일 업로드 개선
  - 실시간 기능 확장

Phase 3: 완전 전환
  - 기존 JWT 제거
  - Appwrite로 통합
```

### 6.2 실용적 접근
```typescript
// 현재 가능한 채팅 구현 (Redis 사용)
export class ChatService {
  private publisher: RedisClient
  private subscriber: RedisClient
  
  constructor() {
    this.publisher = redis.duplicate()
    this.subscriber = redis.duplicate()
  }
  
  async joinRoom(roomId: string, onMessage: (msg: any) => void) {
    await this.subscriber.subscribe(`chat:${roomId}`)
    this.subscriber.on('message', (channel, message) => {
      onMessage(JSON.parse(message))
    })
  }
  
  async sendMessage(roomId: string, message: any) {
    await this.publisher.publish(
      `chat:${roomId}`, 
      JSON.stringify(message)
    )
  }
}
```

## 7. 결론

**Coolify 공식 지원 서비스 중에서는 Appwrite가 가장 적합합니다.**

하지만 **현재 Redis**가 이미 있으므로:
1. 먼저 Redis Pub/Sub로 채팅 구현
2. 나중에 Appwrite로 인증 업그레이드
3. 점진적으로 기능 통합

이렇게 하면 즉시 개발을 시작할 수 있고, 나중에 필요에 따라 확장할 수 있습니다!