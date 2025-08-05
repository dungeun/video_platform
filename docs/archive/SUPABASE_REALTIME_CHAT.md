# 💬 Supabase Realtime으로 채팅 구현하기

## 1. Supabase Realtime 개요

### 1.1 작동 원리
```yaml
Supabase Realtime:
  - PostgreSQL의 Logical Replication 사용
  - WebSocket 연결로 실시간 통신
  - Row Level Security (RLS)로 보안
  - Presence (온라인 상태) 지원
  - Broadcast (메시지 전달) 지원
```

### 1.2 실시간 기능 종류
1. **Database Changes** - DB 변경사항 실시간 구독
2. **Broadcast** - 클라이언트 간 메시지 전달
3. **Presence** - 온라인 사용자 추적

## 2. 동영상 플랫폼 채팅 구현

### 2.1 데이터베이스 스키마
```sql
-- 채팅 메시지 테이블
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 라이브 채팅용 (영구 저장 안함)
CREATE TABLE live_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'message', -- message, super_chat, announcement
  amount DECIMAL(10,2), -- Super Chat 금액
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_chat_messages_video_id ON chat_messages(video_id);
CREATE INDEX idx_live_chat_stream_id ON live_chat_messages(stream_id);

-- RLS 정책
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;

-- 읽기 권한 (모두)
CREATE POLICY "Messages are viewable by everyone" 
  ON chat_messages FOR SELECT 
  USING (true);

-- 쓰기 권한 (인증된 사용자)
CREATE POLICY "Users can insert their own messages" 
  ON chat_messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

### 2.2 실시간 채팅 구현 (Next.js)

#### 라이브 채팅 컴포넌트
```typescript
// components/LiveChat.tsx
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

interface ChatMessage {
  id: string
  user_id: string
  username: string
  message: string
  type: 'message' | 'super_chat' | 'announcement'
  amount?: number
  created_at: string
}

export function LiveChat({ streamId }: { streamId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // 1. 기존 메시지 로드
    loadMessages()
    
    // 2. 실시간 구독 설정
    const channel = supabase
      .channel(`live-chat:${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `stream_id=eq.${streamId}`
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage
          setMessages(prev => [...prev, newMsg])
          scrollToBottom()
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = Object.keys(state).map(key => state[key][0].username)
        setOnlineUsers(users)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // 온라인 상태 전송
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await channel.track({
              online_at: new Date().toISOString(),
              username: user.email?.split('@')[0] || 'Anonymous'
            })
          }
        }
      })
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [streamId])
  
  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('live_chat_messages')
      .select('*')
      .eq('stream_id', streamId)
      .order('created_at', { ascending: true })
      .limit(100)
    
    if (data) {
      setMessages(data)
      scrollToBottom()
    }
  }
  
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { error } = await supabase
      .from('live_chat_messages')
      .insert({
        stream_id: streamId,
        user_id: user.id,
        username: user.email?.split('@')[0] || 'Anonymous',
        message: newMessage,
        type: 'message'
      })
    
    if (!error) {
      setNewMessage('')
    }
  }
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* 온라인 사용자 수 */}
      <div className="p-2 bg-gray-100 border-b">
        <span className="text-sm">
          🟢 {onlineUsers.length} 명 시청 중
        </span>
      </div>
      
      {/* 채팅 메시지 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`
            ${msg.type === 'super_chat' ? 'bg-yellow-100 p-2 rounded' : ''}
            ${msg.type === 'announcement' ? 'bg-blue-100 p-2 rounded' : ''}
          `}>
            <span className="font-semibold">{msg.username}:</span>
            <span className="ml-2">{msg.message}</span>
            {msg.type === 'super_chat' && msg.amount && (
              <span className="ml-2 text-yellow-600">
                ₩{msg.amount.toLocaleString()}
              </span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* 메시지 입력 */}
      <form onSubmit={sendMessage} className="p-4 border-t">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="메시지를 입력하세요..."
          className="w-full px-3 py-2 border rounded-lg"
          maxLength={200}
        />
      </form>
    </div>
  )
}
```

### 2.3 Super Chat 구현
```typescript
// components/SuperChat.tsx
export function SuperChat({ streamId }: { streamId: string }) {
  const [amount, setAmount] = useState(1000)
  const [message, setMessage] = useState('')
  
  const sendSuperChat = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    // 1. 결제 처리 (Toss Payments)
    const payment = await processPayment(amount)
    
    if (payment.success) {
      // 2. Super Chat 메시지 전송
      await supabase
        .from('live_chat_messages')
        .insert({
          stream_id: streamId,
          user_id: user.id,
          username: user.email?.split('@')[0] || 'Anonymous',
          message: message,
          type: 'super_chat',
          amount: amount
        })
      
      // 3. 크리에이터에게 알림
      await supabase
        .channel(`creator-notifications`)
        .send({
          type: 'broadcast',
          event: 'super_chat',
          payload: {
            from: user.email,
            amount: amount,
            message: message
          }
        })
    }
  }
  
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold mb-2">Super Chat</h3>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        min={1000}
        step={1000}
        className="w-full mb-2"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="응원 메시지"
        className="w-full mb-2"
        maxLength={100}
      />
      <button
        onClick={sendSuperChat}
        className="w-full bg-yellow-500 text-white py-2 rounded"
      >
        ₩{amount.toLocaleString()} 후원하기
      </button>
    </div>
  )
}
```

### 2.4 동영상 댓글 (비실시간)
```typescript
// components/VideoComments.tsx
export function VideoComments({ videoId }: { videoId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  
  useEffect(() => {
    // 실시간 업데이트 구독
    const subscription = supabase
      .channel(`comments:${videoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `video_id=eq.${videoId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setComments(prev => [...prev, payload.new as Comment])
          } else if (payload.eventType === 'UPDATE') {
            setComments(prev => 
              prev.map(c => c.id === payload.new.id ? payload.new as Comment : c)
            )
          } else if (payload.eventType === 'DELETE') {
            setComments(prev => prev.filter(c => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [videoId])
  
  return (
    <div>{/* 댓글 UI */}</div>
  )
}
```

## 3. Broadcast 채널 (DB 저장 없이)

### 3.1 임시 채팅방
```typescript
// 가벼운 실시간 통신 (DB 저장 X)
const channel = supabase.channel('room-1')

// 메시지 수신
channel
  .on('broadcast', { event: 'message' }, ({ payload }) => {
    console.log('New message:', payload)
  })
  .subscribe()

// 메시지 전송
channel.send({
  type: 'broadcast',
  event: 'message',
  payload: { 
    user: 'user123',
    text: 'Hello!' 
  }
})
```

## 4. Presence (온라인 상태)

### 4.1 실시간 시청자 추적
```typescript
// components/ViewerCount.tsx
export function ViewerCount({ videoId }: { videoId: string }) {
  const [viewers, setViewers] = useState<number>(0)
  
  useEffect(() => {
    const channel = supabase.channel(`video:${videoId}`)
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setViewers(Object.keys(state).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser()
          await channel.track({
            user_id: user?.id || 'anonymous',
            online_at: new Date().toISOString(),
          })
        }
      })
    
    return () => {
      channel.unsubscribe()
    }
  }, [videoId])
  
  return <div>👁 {viewers} 명 시청 중</div>
}
```

## 5. 성능 최적화

### 5.1 채팅 메시지 최적화
```sql
-- 오래된 라이브 채팅 자동 삭제
CREATE OR REPLACE FUNCTION delete_old_live_chat()
RETURNS void AS $$
BEGIN
  DELETE FROM live_chat_messages
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- 매일 실행
SELECT cron.schedule(
  'delete-old-chat',
  '0 3 * * *',
  'SELECT delete_old_live_chat()'
);
```

### 5.2 연결 관리
```typescript
// lib/supabase/realtime-manager.ts
class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map()
  
  getChannel(name: string): RealtimeChannel {
    if (!this.channels.has(name)) {
      const channel = supabase.channel(name)
      this.channels.set(name, channel)
    }
    return this.channels.get(name)!
  }
  
  removeChannel(name: string) {
    const channel = this.channels.get(name)
    if (channel) {
      channel.unsubscribe()
      this.channels.delete(name)
    }
  }
  
  cleanup() {
    this.channels.forEach(channel => channel.unsubscribe())
    this.channels.clear()
  }
}

export const realtimeManager = new RealtimeManager()
```

## 6. 비용 고려사항

### 6.1 Supabase Realtime 제한
```yaml
Self-hosted:
  - 무제한 (서버 성능에 따라)
  - WebSocket 연결 수 제한 없음
  - 메시지 수 제한 없음

최적화 방법:
  - 라이브 채팅은 임시 저장
  - 오래된 메시지 자동 삭제
  - 연결 풀링 사용
  - 메시지 배치 처리
```

## 7. 대안: Redis Pub/Sub

### 7.1 Redis를 사용한 채팅
```typescript
// Redis Pub/Sub 사용 시
import { createClient } from 'redis'

const pubClient = createClient({ url: REDIS_URL })
const subClient = pubClient.duplicate()

// 메시지 발행
await pubClient.publish(`chat:${videoId}`, JSON.stringify({
  user: 'user123',
  message: 'Hello!'
}))

// 메시지 구독
await subClient.subscribe(`chat:${videoId}`, (message) => {
  console.log('New message:', JSON.parse(message))
})
```

## 8. 결론

### Supabase Realtime 장점:
1. **통합 솔루션** - Auth + DB + Realtime
2. **RLS 보안** - Row Level Security
3. **Presence** - 온라인 상태 추적
4. **쉬운 구현** - 몇 줄의 코드로 가능

### 사용 사례:
- ✅ 라이브 채팅
- ✅ 실시간 댓글
- ✅ 시청자 수 추적
- ✅ Super Chat
- ✅ 실시간 알림

동영상 플랫폼의 모든 실시간 기능을 Supabase로 구현 가능합니다!