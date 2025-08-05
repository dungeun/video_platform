# 🚀 Appwrite 통합 가이드 - 동영상 플랫폼

## 1. Appwrite 설정 정보

### 1.1 접속 정보
```bash
# Appwrite 콘솔
URL: https://[your-appwrite-domain]/console

# API Endpoint
APPWRITE_ENDPOINT: https://[your-appwrite-domain]/v1

# 프로젝트 생성 후 얻을 정보
APPWRITE_PROJECT_ID: [project-id]
APPWRITE_API_KEY: [api-key]
```

### 1.2 초기 설정 단계
1. Appwrite 콘솔 접속
2. 새 프로젝트 생성: "VideoPick"
3. API 키 생성 (Settings → API Keys)
4. 플랫폼 추가 (Web: video.one-q.xyz)

## 2. Appwrite 컬렉션 구조

### 2.1 Users Collection (확장)
```javascript
// Appwrite는 기본 auth 제공, 추가 정보는 별도 컬렉션
{
  "channelInfo": {
    "name": "string",
    "handle": "string",
    "description": "string",
    "avatarUrl": "string",
    "bannerUrl": "string",
    "subscriberCount": "number",
    "verified": "boolean"
  },
  "creatorStats": {
    "totalViews": "number",
    "totalVideos": "number",
    "totalRevenue": "number"
  },
  "preferences": {
    "language": "string",
    "notifications": "object"
  }
}
```

### 2.2 Videos Collection
```javascript
{
  "channelId": "string",
  "title": "string",
  "description": "string",
  "videoUrl": "string",
  "thumbnailUrl": "string",
  "duration": "number",
  "resolution": "string",
  "category": "string",
  "tags": "string[]",
  "status": "string", // processing, published, private
  "stats": {
    "views": "number",
    "likes": "number",
    "dislikes": "number",
    "comments": "number"
  },
  "monetization": {
    "enabled": "boolean",
    "adsEnabled": "boolean",
    "memberOnly": "boolean"
  },
  "publishedAt": "datetime",
  "createdAt": "datetime"
}
```

### 2.3 LiveChats Collection
```javascript
{
  "streamId": "string",
  "userId": "string",
  "username": "string",
  "message": "string",
  "type": "string", // message, super_chat, announcement
  "amount": "number", // for super chat
  "createdAt": "datetime"
}
```

### 2.4 Comments Collection
```javascript
{
  "videoId": "string",
  "userId": "string",
  "username": "string",
  "content": "string",
  "parentId": "string", // for replies
  "likeCount": "number",
  "isPinned": "boolean",
  "isHearted": "boolean",
  "createdAt": "datetime"
}
```

## 3. 환경변수 업데이트

### 3.1 Appwrite 환경변수 추가
```bash
# .env.video에 추가
# ===== APPWRITE CONFIGURATION =====
NEXT_PUBLIC_APPWRITE_ENDPOINT="https://[your-appwrite-domain]/v1"
NEXT_PUBLIC_APPWRITE_PROJECT_ID="[your-project-id]"
APPWRITE_API_KEY="[your-api-key]"

# Appwrite Storage Buckets
APPWRITE_BUCKET_VIDEOS="videos"
APPWRITE_BUCKET_THUMBNAILS="thumbnails"
APPWRITE_BUCKET_AVATARS="avatars"
APPWRITE_BUCKET_BANNERS="banners"

# Appwrite Database
APPWRITE_DATABASE_ID="videopick"

# Appwrite Collections
APPWRITE_COLLECTION_CHANNELS="channels"
APPWRITE_COLLECTION_VIDEOS="videos"
APPWRITE_COLLECTION_COMMENTS="comments"
APPWRITE_COLLECTION_LIVE_CHATS="liveChats"
APPWRITE_COLLECTION_PLAYLISTS="playlists"

# Appwrite Functions (선택사항)
APPWRITE_FUNCTION_VIDEO_PROCESSOR="processVideo"
APPWRITE_FUNCTION_THUMBNAIL_GENERATOR="generateThumbnail"
```

### 3.2 Coolify 환경변수 업데이트
```bash
# COOLIFY_ENV_VARS_VIDEO.txt에 추가
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://[your-appwrite-domain]/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=[your-project-id]
APPWRITE_API_KEY=[your-api-key]
APPWRITE_DATABASE_ID=videopick
```

## 4. Appwrite SDK 통합

### 4.1 클라이언트 설정
```typescript
// lib/appwrite/client.ts
import { Client, Account, Databases, Storage, Realtime, Teams } from 'appwrite'

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

// 서비스 인스턴스
export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)
export const realtime = new Realtime(client)
export const teams = new Teams(client)

// 서버 사이드 클라이언트 (API Key 사용)
export function createServerClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!)
}
```

### 4.2 인증 서비스
```typescript
// lib/appwrite/auth.ts
import { account } from './client'
import { ID, Models } from 'appwrite'

export class AuthService {
  // 회원가입
  async signUp(email: string, password: string, name: string) {
    try {
      // 1. 계정 생성
      const user = await account.create(ID.unique(), email, password, name)
      
      // 2. 자동 로그인
      await this.signIn(email, password)
      
      // 3. 채널 생성 (크리에이터용)
      await this.createChannel(user.$id, name)
      
      return user
    } catch (error) {
      throw error
    }
  }
  
  // 로그인
  async signIn(email: string, password: string) {
    try {
      const session = await account.createEmailSession(email, password)
      return session
    } catch (error) {
      throw error
    }
  }
  
  // 소셜 로그인
  async signInWithProvider(provider: 'google' | 'github' | 'facebook') {
    try {
      account.createOAuth2Session(
        provider,
        `${window.location.origin}/auth/callback`,
        `${window.location.origin}/auth/error`
      )
    } catch (error) {
      throw error
    }
  }
  
  // 로그아웃
  async signOut() {
    try {
      await account.deleteSession('current')
    } catch (error) {
      throw error
    }
  }
  
  // 현재 사용자
  async getCurrentUser() {
    try {
      return await account.get()
    } catch (error) {
      return null
    }
  }
  
  // 채널 생성
  private async createChannel(userId: string, name: string) {
    const { databases } = await import('./client')
    
    return databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_COLLECTION_CHANNELS!,
      ID.unique(),
      {
        userId,
        name,
        handle: name.toLowerCase().replace(/\s+/g, ''),
        subscriberCount: 0,
        videoCount: 0,
        viewCount: 0,
        verified: false,
        createdAt: new Date()
      }
    )
  }
}

export const authService = new AuthService()
```

### 4.3 실시간 채팅 서비스
```typescript
// lib/appwrite/chat.ts
import { client, databases, realtime } from './client'
import { ID, Models, RealtimeResponseEvent } from 'appwrite'

export class ChatService {
  private subscriptions: Map<string, () => void> = new Map()
  
  // 채팅방 구독
  subscribeToChat(
    streamId: string, 
    onMessage: (message: Models.Document) => void
  ) {
    const subscription = client.subscribe(
      `databases.${process.env.APPWRITE_DATABASE_ID}.collections.${process.env.APPWRITE_COLLECTION_LIVE_CHATS}.documents`,
      (response: RealtimeResponseEvent<Models.Document>) => {
        if (
          response.events.includes('databases.*.collections.*.documents.*.create') &&
          response.payload.streamId === streamId
        ) {
          onMessage(response.payload)
        }
      }
    )
    
    this.subscriptions.set(streamId, subscription)
    return subscription
  }
  
  // 메시지 전송
  async sendMessage(streamId: string, message: string, type = 'message') {
    const user = await account.get()
    
    return databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_COLLECTION_LIVE_CHATS!,
      ID.unique(),
      {
        streamId,
        userId: user.$id,
        username: user.name,
        message,
        type,
        createdAt: new Date()
      }
    )
  }
  
  // Super Chat
  async sendSuperChat(streamId: string, message: string, amount: number) {
    const user = await account.get()
    
    // TODO: 결제 처리 로직 추가
    
    return databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_COLLECTION_LIVE_CHATS!,
      ID.unique(),
      {
        streamId,
        userId: user.$id,
        username: user.name,
        message,
        type: 'super_chat',
        amount,
        createdAt: new Date()
      }
    )
  }
  
  // 구독 해제
  unsubscribe(streamId: string) {
    const unsubscribe = this.subscriptions.get(streamId)
    if (unsubscribe) {
      unsubscribe()
      this.subscriptions.delete(streamId)
    }
  }
  
  // 모든 구독 해제
  unsubscribeAll() {
    this.subscriptions.forEach(unsubscribe => unsubscribe())
    this.subscriptions.clear()
  }
}

export const chatService = new ChatService()
```

### 4.4 파일 업로드 서비스
```typescript
// lib/appwrite/storage.ts
import { storage } from './client'
import { ID } from 'appwrite'

export class StorageService {
  // 동영상 업로드
  async uploadVideo(file: File, onProgress?: (progress: number) => void) {
    return storage.createFile(
      process.env.APPWRITE_BUCKET_VIDEOS!,
      ID.unique(),
      file,
      undefined,
      onProgress
    )
  }
  
  // 썸네일 업로드
  async uploadThumbnail(file: File) {
    return storage.createFile(
      process.env.APPWRITE_BUCKET_THUMBNAILS!,
      ID.unique(),
      file
    )
  }
  
  // 파일 URL 가져오기
  getFileUrl(bucketId: string, fileId: string) {
    return storage.getFileView(bucketId, fileId)
  }
  
  // 파일 다운로드
  getFileDownload(bucketId: string, fileId: string) {
    return storage.getFileDownload(bucketId, fileId)
  }
  
  // 파일 삭제
  async deleteFile(bucketId: string, fileId: string) {
    return storage.deleteFile(bucketId, fileId)
  }
}

export const storageService = new StorageService()
```

## 5. React 컴포넌트 예제

### 5.1 인증 Hook
```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react'
import { Models } from 'appwrite'
import { authService } from '@/lib/appwrite/auth'

export function useAuth() {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    checkAuth()
    
    // 실시간 세션 변경 감지
    const unsubscribe = authService.subscribeToAuth((session) => {
      if (session) {
        checkAuth()
      } else {
        setUser(null)
      }
    })
    
    return unsubscribe
  }, [])
  
  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }
  
  return { user, loading }
}
```

### 5.2 라이브 채팅 컴포넌트
```tsx
// components/LiveChat.tsx
import { useState, useEffect, useRef } from 'react'
import { chatService } from '@/lib/appwrite/chat'
import { useAuth } from '@/hooks/useAuth'

export function LiveChat({ streamId }: { streamId: string }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  
  useEffect(() => {
    // 채팅 구독
    const unsubscribe = chatService.subscribeToChat(streamId, (message) => {
      setMessages(prev => [...prev, message])
    })
    
    return () => {
      chatService.unsubscribe(streamId)
    }
  }, [streamId])
  
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !user) return
    
    try {
      await chatService.sendMessage(streamId, input)
      setInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(msg => (
          <div key={msg.$id} className="mb-2">
            <span className="font-bold">{msg.username}:</span>
            <span className="ml-2">{msg.message}</span>
          </div>
        ))}
      </div>
      
      <form onSubmit={sendMessage} className="p-4 border-t">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지 입력..."
          className="w-full px-3 py-2 border rounded"
        />
      </form>
    </div>
  )
}
```

## 6. 마이그레이션 전략

### 6.1 기존 JWT → Appwrite
```typescript
// 1. 병행 운영 기간
if (process.env.USE_APPWRITE_AUTH === 'true') {
  // Appwrite 인증 사용
  const user = await authService.getCurrentUser()
} else {
  // 기존 JWT 사용
  const user = await getCurrentUserJWT()
}

// 2. 사용자 마이그레이션
async function migrateUsers() {
  const users = await prisma.user.findMany()
  
  for (const user of users) {
    try {
      // Appwrite에 사용자 생성
      await account.create(
        user.id, // 기존 ID 사용
        user.email,
        'TempPassword123!', // 임시 비밀번호
        user.name
      )
      
      // 비밀번호 재설정 이메일 발송
      await account.createRecovery(
        user.email,
        'https://video.one-q.xyz/reset-password'
      )
    } catch (error) {
      console.error(`Failed to migrate user ${user.email}:`, error)
    }
  }
}
```

## 7. Appwrite 콘솔 설정

### 7.1 데이터베이스 생성
1. Console → Databases → Create Database
2. Name: "VideoPick"
3. ID: "videopick"

### 7.2 컬렉션 생성
각 컬렉션별로:
1. Create Collection
2. 위에 정의한 속성 추가
3. Indexes 설정 (검색 최적화)
4. Permissions 설정

### 7.3 Storage Buckets
1. Console → Storage → Create Bucket
2. 각 버킷 생성:
   - videos (Max: 10GB)
   - thumbnails (Max: 10MB)
   - avatars (Max: 5MB)
   - banners (Max: 10MB)

### 7.4 Auth 설정
1. Console → Auth → Settings
2. OAuth2 Providers 활성화:
   - Google
   - GitHub
   - YouTube (커스텀 OAuth2)

## 8. 모니터링 및 관리

### 8.1 Appwrite 대시보드
- 실시간 사용자 수
- API 요청 수
- 스토리지 사용량
- 에러 로그

### 8.2 웹훅 설정
```javascript
// Appwrite Console → Functions → Webhooks
{
  "events": [
    "users.*.create",
    "users.*.delete",
    "databases.*.collections.*.documents.*.create"
  ],
  "url": "https://video.one-q.xyz/api/webhooks/appwrite",
  "security": true,
  "httpUser": "webhook",
  "httpPass": "secure-password"
}
```

## 9. 주의사항

1. **Rate Limiting**: Appwrite는 기본적으로 rate limiting이 있음
2. **파일 크기**: 기본 100MB, 설정으로 변경 가능
3. **실시간 연결**: 동시 연결 수 제한 확인
4. **백업**: 정기적인 데이터 백업 필수

이제 Appwrite가 설치되었으니 위 가이드에 따라 통합을 진행하시면 됩니다!