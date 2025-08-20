# 🔌 모듈화 플러그인 아키텍처

## 📦 플러그인 시스템 개요

```
┌─────────────────────────────────────────────────────────────┐
│                     React/Next.js/Remix App                  │
├─────────────────────────────────────────────────────────────┤
│                      Plugin Manager Core                      │
│                    @videopick/plugin-core                    │
└─────────────────────────────────────────────────────────────┘
                               ↓
    ┌──────────────┬──────────────┬──────────────┬──────────────┐
    │   Chat       │   Streaming  │   Comments   │  SuperChat   │
    │   Plugin     │   Plugin     │   Plugin     │   Plugin     │
    ├──────────────┼──────────────┼──────────────┼──────────────┤
    │ @videopick/  │ @videopick/  │ @videopick/  │ @videopick/  │
    │ plugin-chat  │ plugin-stream│ plugin-comment│ plugin-super │
    └──────────────┴──────────────┴──────────────┴──────────────┘
```

---

## 🎯 플러그인 코어 시스템

### @videopick/plugin-core
```typescript
// packages/plugin-core/src/index.ts
export interface PluginConfig {
  name: string
  version: string
  dependencies?: string[]
  permissions?: string[]
  settings?: PluginSettings
}

export interface Plugin {
  id: string
  config: PluginConfig
  
  // 생명주기 메서드
  install(context: PluginContext): Promise<void>
  uninstall(): Promise<void>
  start(): Promise<void>
  stop(): Promise<void>
  
  // React 통합
  getComponents(): PluginComponents
  getHooks(): PluginHooks
  getRoutes(): PluginRoutes
  getProviders(): PluginProviders
}

export interface PluginContext {
  api: {
    http: HttpClient
    ws: WebSocketClient
    storage: StorageClient
    auth: AuthClient
  }
  events: EventEmitter
  config: AppConfig
  logger: Logger
}

export class PluginManager {
  private plugins = new Map<string, Plugin>()
  private context: PluginContext
  
  constructor(config: AppConfig) {
    this.context = this.createContext(config)
  }
  
  async register(plugin: Plugin) {
    // 의존성 체크
    await this.checkDependencies(plugin)
    
    // 권한 체크
    await this.checkPermissions(plugin)
    
    // 플러그인 설치
    await plugin.install(this.context)
    
    this.plugins.set(plugin.id, plugin)
    
    // React 컴포넌트 등록
    this.registerComponents(plugin)
    
    // 이벤트 리스너 등록
    this.registerEventListeners(plugin)
  }
  
  async unregister(pluginId: string) {
    const plugin = this.plugins.get(pluginId)
    if (plugin) {
      await plugin.uninstall()
      this.plugins.delete(pluginId)
    }
  }
  
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId)
  }
  
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }
}

// React Hook for Plugin Manager
export function usePluginManager() {
  const manager = useContext(PluginManagerContext)
  return manager
}

export function usePlugin(pluginId: string) {
  const manager = usePluginManager()
  return manager.getPlugin(pluginId)
}
```

---

## 💬 채팅 플러그인

### @videopick/plugin-chat

```typescript
// packages/plugin-chat/src/index.ts
import { Plugin, PluginConfig, PluginContext } from '@videopick/plugin-core'
import { ChatClient } from './client'
import { ChatComponent } from './components'
import { useChatHooks } from './hooks'

export class ChatPlugin implements Plugin {
  id = 'chat'
  config: PluginConfig = {
    name: 'Chat Plugin',
    version: '1.0.0',
    permissions: ['websocket', 'storage'],
    settings: {
      maxMessageLength: 500,
      rateLimitSeconds: 1,
      enableEmojis: true,
      enableMentions: true
    }
  }
  
  private client?: ChatClient
  private context?: PluginContext
  
  async install(context: PluginContext) {
    this.context = context
    
    // Chat 클라이언트 초기화
    this.client = new ChatClient({
      wsUrl: context.config.chatServerUrl || 'ws://localhost:8000',
      auth: context.api.auth
    })
    
    // 이벤트 등록
    context.events.on('stream:start', this.onStreamStart.bind(this))
    context.events.on('stream:stop', this.onStreamStop.bind(this))
  }
  
  async start() {
    await this.client?.connect()
  }
  
  async stop() {
    await this.client?.disconnect()
  }
  
  getComponents() {
    return {
      ChatBox: ChatComponent,
      ChatInput: () => import('./components/ChatInput'),
      ChatMessage: () => import('./components/ChatMessage'),
      EmojiPicker: () => import('./components/EmojiPicker'),
      ChatManager: () => import('./components/ChatManager')
    }
  }
  
  getHooks() {
    return {
      useChat: useChatHooks.useChat,
      useMessages: useChatHooks.useMessages,
      useChatState: useChatHooks.useChatState,
      useChatManager: useChatHooks.useChatManager
    }
  }
  
  // Public API
  async sendMessage(channel: string, message: string) {
    return this.client?.sendMessage(channel, message)
  }
  
  async joinChannel(channel: string) {
    return this.client?.joinChannel(channel)
  }
  
  async leaveChannel(channel: string) {
    return this.client?.leaveChannel(channel)
  }
}

// React Components
// packages/plugin-chat/src/components/ChatComponent.tsx
export const ChatComponent: React.FC<ChatProps> = ({ channelId, height = 400 }) => {
  const plugin = usePlugin('chat') as ChatPlugin
  const { messages, sendMessage, isConnected } = plugin.getHooks().useChat(channelId)
  
  return (
    <div className="chat-container" style={{ height }}>
      <div className="chat-messages">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>
      <ChatInput 
        onSend={sendMessage} 
        disabled={!isConnected}
      />
    </div>
  )
}

// Chat Client (Go 서버 연동)
// packages/plugin-chat/src/client.ts
import { Centrifuge } from 'centrifuge'

export class ChatClient {
  private centrifuge: Centrifuge
  private subscriptions = new Map<string, any>()
  
  constructor(config: ChatClientConfig) {
    this.centrifuge = new Centrifuge(config.wsUrl, {
      token: () => config.auth.getToken()
    })
    
    this.setupEventHandlers()
  }
  
  async connect() {
    return this.centrifuge.connect()
  }
  
  async disconnect() {
    return this.centrifuge.disconnect()
  }
  
  async joinChannel(channel: string) {
    if (this.subscriptions.has(channel)) return
    
    const sub = this.centrifuge.newSubscription(channel)
    
    sub.on('publication', (ctx) => {
      this.handleMessage(channel, ctx.data)
    })
    
    sub.on('presence', (ctx) => {
      this.handlePresence(channel, ctx)
    })
    
    await sub.subscribe()
    this.subscriptions.set(channel, sub)
  }
  
  async sendMessage(channel: string, text: string) {
    const sub = this.subscriptions.get(channel)
    if (!sub) throw new Error('Not subscribed to channel')
    
    return sub.publish({
      text,
      timestamp: Date.now(),
      user: this.getCurrentUser()
    })
  }
}
```

---

## 🎥 스트리밍 플러그인

### @videopick/plugin-stream

```typescript
// packages/plugin-stream/src/index.ts
import { Plugin, PluginConfig, PluginContext } from '@videopick/plugin-core'
import { StreamPlayer } from './components/StreamPlayer'
import { StreamControls } from './components/StreamControls'
import { StreamClient } from './client'

export class StreamPlugin implements Plugin {
  id = 'stream'
  config: PluginConfig = {
    name: 'Streaming Plugin',
    version: '1.0.0',
    dependencies: ['@videopick/plugin-core'],
    settings: {
      defaultQuality: '720p',
      lowLatencyMode: true,
      dvr: true,
      autoplay: true
    }
  }
  
  private client?: StreamClient
  
  async install(context: PluginContext) {
    this.client = new StreamClient({
      rtmpUrl: context.config.rtmpUrl || 'rtmp://localhost:1935',
      hlsUrl: context.config.hlsUrl || 'http://localhost:8888',
      webrtcUrl: context.config.webrtcUrl || 'http://localhost:8889'
    })
  }
  
  getComponents() {
    return {
      StreamPlayer,
      StreamControls,
      StreamDashboard: () => import('./components/StreamDashboard'),
      StreamSettings: () => import('./components/StreamSettings'),
      StreamStats: () => import('./components/StreamStats')
    }
  }
  
  getHooks() {
    return {
      useStream: () => {
        const [streamState, setStreamState] = useState<StreamState>()
        const [stats, setStats] = useState<StreamStats>()
        
        useEffect(() => {
          const interval = setInterval(async () => {
            const newStats = await this.client?.getStats()
            setStats(newStats)
          }, 1000)
          
          return () => clearInterval(interval)
        }, [])
        
        return {
          streamState,
          stats,
          startStream: this.startStream.bind(this),
          stopStream: this.stopStream.bind(this),
          getStreamKey: this.getStreamKey.bind(this)
        }
      }
    }
  }
  
  // Public API
  async startStream(config: StreamConfig) {
    return this.client?.startStream(config)
  }
  
  async stopStream() {
    return this.client?.stopStream()
  }
  
  async getStreamKey() {
    return this.client?.getStreamKey()
  }
}

// Stream Player Component
// packages/plugin-stream/src/components/StreamPlayer.tsx
import Hls from 'hls.js'
import { useEffect, useRef } from 'react'

export const StreamPlayer: React.FC<StreamPlayerProps> = ({ 
  streamId, 
  autoplay = true,
  controls = true,
  lowLatency = true 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const plugin = usePlugin('stream') as StreamPlugin
  const { streamState, stats } = plugin.getHooks().useStream()
  
  useEffect(() => {
    if (!videoRef.current) return
    
    const streamUrl = `${plugin.config.settings.hlsUrl}/live/${streamId}/index.m3u8`
    
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: lowLatency,
        liveSyncDuration: lowLatency ? 1 : 3,
        liveMaxLatencyDuration: lowLatency ? 2 : 6
      })
      
      hls.loadSource(streamUrl)
      hls.attachMedia(videoRef.current)
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoplay) videoRef.current?.play()
      })
      
      return () => hls.destroy()
    }
  }, [streamId, autoplay, lowLatency])
  
  return (
    <div className="stream-player">
      <video 
        ref={videoRef} 
        controls={controls}
        className="w-full h-full"
      />
      
      {streamState?.isLive && (
        <div className="stream-overlay">
          <span className="live-badge">LIVE</span>
          <span className="viewer-count">{stats?.viewers || 0}</span>
        </div>
      )}
    </div>
  )
}
```

---

## 💬 댓글 플러그인

### @videopick/plugin-comment

```typescript
// packages/plugin-comment/src/index.ts
import { Plugin, PluginConfig, PluginContext } from '@videopick/plugin-core'

export class CommentPlugin implements Plugin {
  id = 'comment'
  config: PluginConfig = {
    name: 'Comment Plugin',
    version: '1.0.0',
    settings: {
      maxCommentLength: 1000,
      enableReplies: true,
      enableReactions: true,
      sortBy: 'newest'
    }
  }
  
  private api?: CommentAPI
  
  async install(context: PluginContext) {
    this.api = new CommentAPI(context.api.http)
  }
  
  getComponents() {
    return {
      CommentSection: () => import('./components/CommentSection'),
      CommentForm: () => import('./components/CommentForm'),
      CommentList: () => import('./components/CommentList'),
      CommentItem: () => import('./components/CommentItem')
    }
  }
  
  getHooks() {
    return {
      useComments: (videoId: string) => {
        const { data, error, mutate } = useSWR(
          `/api/videos/${videoId}/comments`,
          this.api.fetcher
        )
        
        return {
          comments: data || [],
          isLoading: !data && !error,
          error,
          addComment: async (text: string) => {
            await this.api.addComment(videoId, text)
            mutate()
          },
          deleteComment: async (commentId: string) => {
            await this.api.deleteComment(commentId)
            mutate()
          }
        }
      }
    }
  }
}

// Comment Section Component
// packages/plugin-comment/src/components/CommentSection.tsx
export const CommentSection: React.FC<{ videoId: string }> = ({ videoId }) => {
  const plugin = usePlugin('comment') as CommentPlugin
  const { comments, isLoading, addComment } = plugin.getHooks().useComments(videoId)
  const [sortBy, setSortBy] = useState('newest')
  
  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      if (sortBy === 'popular') {
        return b.likes - a.likes
      }
      return 0
    })
  }, [comments, sortBy])
  
  return (
    <div className="comment-section">
      <div className="comment-header">
        <h3>{comments.length} 댓글</h3>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">최신순</option>
          <option value="popular">인기순</option>
        </select>
      </div>
      
      <CommentForm onSubmit={addComment} />
      
      <div className="comment-list">
        {isLoading ? (
          <CommentSkeleton />
        ) : (
          sortedComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  )
}
```

---

## 💰 슈퍼챗 플러그인

### @videopick/plugin-superchat

```typescript
// packages/plugin-superchat/src/index.ts
import { Plugin, PluginConfig, PluginContext } from '@videopick/plugin-core'
import { SuperChatAPI } from './api'
import { SuperChatEffects } from './effects'

export class SuperChatPlugin implements Plugin {
  id = 'superchat'
  config: PluginConfig = {
    name: 'SuperChat Plugin',
    version: '1.0.0',
    dependencies: ['@videopick/plugin-chat'],
    settings: {
      minAmount: 1000,
      maxAmount: 100000,
      currency: 'KRW',
      tiers: [
        { min: 1000, max: 5000, color: '#1e88e5', duration: 2 },
        { min: 5000, max: 10000, color: '#ffc107', duration: 5 },
        { min: 10000, max: 50000, color: '#ff5722', duration: 10 },
        { min: 50000, max: 100000, color: '#e91e63', duration: 30 }
      ]
    }
  }
  
  private api?: SuperChatAPI
  private effects?: SuperChatEffects
  
  async install(context: PluginContext) {
    this.api = new SuperChatAPI(context.api.http)
    this.effects = new SuperChatEffects()
    
    // Chat 플러그인과 연동
    const chatPlugin = context.pluginManager.getPlugin('chat')
    if (chatPlugin) {
      chatPlugin.on('message', this.handleChatMessage.bind(this))
    }
  }
  
  getComponents() {
    return {
      SuperChatButton: () => import('./components/SuperChatButton'),
      SuperChatModal: () => import('./components/SuperChatModal'),
      SuperChatDisplay: () => import('./components/SuperChatDisplay'),
      SuperChatHistory: () => import('./components/SuperChatHistory')
    }
  }
  
  getHooks() {
    return {
      useSuperChat: () => {
        const [isOpen, setIsOpen] = useState(false)
        const [amount, setAmount] = useState(1000)
        
        const sendSuperChat = async (message: string) => {
          const result = await this.api.sendSuperChat({
            amount,
            message,
            streamId: getCurrentStreamId()
          })
          
          if (result.success) {
            this.effects.showSuperChatEffect(result.data)
            setIsOpen(false)
          }
          
          return result
        }
        
        return {
          isOpen,
          setIsOpen,
          amount,
          setAmount,
          sendSuperChat,
          getTier: (amount: number) => this.getTierByAmount(amount)
        }
      }
    }
  }
  
  private getTierByAmount(amount: number) {
    return this.config.settings.tiers.find(
      tier => amount >= tier.min && amount <= tier.max
    )
  }
}

// SuperChat Display Component
// packages/plugin-superchat/src/components/SuperChatDisplay.tsx
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

export const SuperChatDisplay: React.FC = () => {
  const plugin = usePlugin('superchat') as SuperChatPlugin
  const [superChats, setSuperChats] = useState<SuperChat[]>([])
  
  useEffect(() => {
    // WebSocket으로 실시간 슈퍼챗 수신
    const ws = new WebSocket('ws://localhost:8000/superchat')
    
    ws.onmessage = (event) => {
      const superChat = JSON.parse(event.data)
      
      // 슈퍼챗 추가
      setSuperChats(prev => [...prev, superChat])
      
      // 효과 실행
      showSuperChatEffect(superChat)
      
      // 일정 시간 후 제거
      setTimeout(() => {
        setSuperChats(prev => prev.filter(sc => sc.id !== superChat.id))
      }, superChat.tier.duration * 1000)
    }
    
    return () => ws.close()
  }, [])
  
  const showSuperChatEffect = (superChat: SuperChat) => {
    // 금액에 따른 효과
    if (superChat.amount >= 50000) {
      // 대형 효과
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 }
      })
    } else if (superChat.amount >= 10000) {
      // 중형 효과
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    } else {
      // 소형 효과
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 }
      })
    }
  }
  
  return (
    <div className="superchat-display">
      <AnimatePresence>
        {superChats.map((superChat) => (
          <motion.div
            key={superChat.id}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="superchat-item"
            style={{ 
              backgroundColor: superChat.tier.color,
              boxShadow: `0 0 20px ${superChat.tier.color}`
            }}
          >
            <div className="superchat-header">
              <img src={superChat.user.avatar} alt="" />
              <span className="username">{superChat.user.name}</span>
              <span className="amount">₩{superChat.amount.toLocaleString()}</span>
            </div>
            <div className="superchat-message">
              {superChat.message}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
```

---

## 🔧 통합 설정

### Next.js 앱 통합

```typescript
// app/providers.tsx
import { PluginManager } from '@videopick/plugin-core'
import { ChatPlugin } from '@videopick/plugin-chat'
import { StreamPlugin } from '@videopick/plugin-stream'
import { CommentPlugin } from '@videopick/plugin-comment'
import { SuperChatPlugin } from '@videopick/plugin-superchat'

export function PluginProvider({ children }: { children: React.ReactNode }) {
  const [manager] = useState(() => {
    const mgr = new PluginManager({
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      wsUrl: process.env.NEXT_PUBLIC_WS_URL,
      chatServerUrl: process.env.NEXT_PUBLIC_CHAT_URL,
      rtmpUrl: process.env.NEXT_PUBLIC_RTMP_URL,
      hlsUrl: process.env.NEXT_PUBLIC_HLS_URL
    })
    
    // 플러그인 등록
    mgr.register(new ChatPlugin())
    mgr.register(new StreamPlugin())
    mgr.register(new CommentPlugin())
    mgr.register(new SuperChatPlugin())
    
    return mgr
  })
  
  return (
    <PluginManagerContext.Provider value={manager}>
      {children}
    </PluginManagerContext.Provider>
  )
}
```

### 사용 예시

```tsx
// app/live/[id]/page.tsx
export default function LiveStreamPage({ params }: { params: { id: string } }) {
  const streamPlugin = usePlugin('stream')
  const chatPlugin = usePlugin('chat')
  const superChatPlugin = usePlugin('superchat')
  
  const StreamPlayer = streamPlugin?.getComponents().StreamPlayer
  const ChatBox = chatPlugin?.getComponents().ChatBox
  const SuperChatDisplay = superChatPlugin?.getComponents().SuperChatDisplay
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        {StreamPlayer && <StreamPlayer streamId={params.id} />}
        {SuperChatDisplay && <SuperChatDisplay />}
      </div>
      
      <div className="col-span-1">
        {ChatBox && <ChatBox channelId={`stream:${params.id}`} />}
      </div>
    </div>
  )
}
```

---

## 📦 NPM 패키지 구조

```
@videopick/
├── plugin-core           # 코어 시스템
├── plugin-chat           # 채팅 플러그인
├── plugin-stream         # 스트리밍 플러그인
├── plugin-comment        # 댓글 플러그인
├── plugin-superchat      # 슈퍼챗 플러그인
└── plugin-preset-default # 기본 플러그인 세트
```

### package.json 예시
```json
{
  "name": "@videopick/plugin-chat",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0",
    "@videopick/plugin-core": "^1.0.0"
  },
  "dependencies": {
    "centrifuge": "^5.0.0",
    "swr": "^2.0.0"
  }
}
```

---

## 🚀 장점

1. **재사용성**: 다른 프로젝트에서 바로 사용 가능
2. **독립성**: 각 플러그인이 독립적으로 동작
3. **확장성**: 새로운 플러그인 쉽게 추가
4. **타입 안정성**: TypeScript 완벽 지원
5. **프레임워크 호환**: Next.js, Remix, Vite 모두 지원

---

*이 플러그인 시스템은 어떤 React 기반 프로젝트에서도 사용 가능합니다.*