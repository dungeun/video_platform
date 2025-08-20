# 📺 YouTube 동영상 임포트 시스템

## 1. 개요

YouTube URL을 입력하면 동영상 정보를 가져와서 자체 플랫폼에서 서비스하는 시스템입니다.

### 1.1 주요 기능
- YouTube 동영상 메타데이터 추출
- 썸네일 다운로드 및 저장
- 자체 플레이어에서 재생
- 독립적인 조회수/좋아요 관리
- 채널 정보 동기화

## 2. 기술 구현

### 2.1 YouTube Data API 설정

#### 환경변수 추가
```bash
# YouTube API
YOUTUBE_API_KEY="your-youtube-api-key"
YOUTUBE_API_VERSION="v3"

# YouTube Player
NEXT_PUBLIC_YOUTUBE_PLAYER_API="https://www.youtube.com/iframe_api"
```

#### API 키 발급
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성
3. YouTube Data API v3 활성화
4. API 키 생성

### 2.2 YouTube 정보 추출 서비스

```typescript
// lib/youtube/youtube-service.ts
import axios from 'axios'

export interface YouTubeVideoInfo {
  videoId: string
  title: string
  description: string
  channelId: string
  channelTitle: string
  thumbnails: {
    default: string
    medium: string
    high: string
    maxres?: string
  }
  duration: string
  viewCount: number
  likeCount: number
  commentCount: number
  publishedAt: string
  tags: string[]
  categoryId: string
  embedHtml: string
}

export class YouTubeService {
  private apiKey: string
  private apiUrl: string

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY!
    this.apiUrl = 'https://www.googleapis.com/youtube/v3'
  }

  // YouTube URL에서 Video ID 추출
  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }

    return null
  }

  // 동영상 정보 가져오기
  async getVideoInfo(videoId: string): Promise<YouTubeVideoInfo> {
    try {
      const response = await axios.get(`${this.apiUrl}/videos`, {
        params: {
          part: 'snippet,contentDetails,statistics,player',
          id: videoId,
          key: this.apiKey
        }
      })

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Video not found')
      }

      const video = response.data.items[0]
      
      return {
        videoId: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        channelId: video.snippet.channelId,
        channelTitle: video.snippet.channelTitle,
        thumbnails: video.snippet.thumbnails,
        duration: this.parseDuration(video.contentDetails.duration),
        viewCount: parseInt(video.statistics.viewCount || '0'),
        likeCount: parseInt(video.statistics.likeCount || '0'),
        commentCount: parseInt(video.statistics.commentCount || '0'),
        publishedAt: video.snippet.publishedAt,
        tags: video.snippet.tags || [],
        categoryId: video.snippet.categoryId,
        embedHtml: video.player.embedHtml
      }
    } catch (error) {
      console.error('Failed to fetch YouTube video:', error)
      throw error
    }
  }

  // 채널 정보 가져오기
  async getChannelInfo(channelId: string) {
    try {
      const response = await axios.get(`${this.apiUrl}/channels`, {
        params: {
          part: 'snippet,statistics,brandingSettings',
          id: channelId,
          key: this.apiKey
        }
      })

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Channel not found')
      }

      const channel = response.data.items[0]

      return {
        channelId: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        customUrl: channel.snippet.customUrl,
        thumbnails: channel.snippet.thumbnails,
        subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
        videoCount: parseInt(channel.statistics.videoCount || '0'),
        viewCount: parseInt(channel.statistics.viewCount || '0'),
        country: channel.snippet.country,
        bannerUrl: channel.brandingSettings?.image?.bannerExternalUrl
      }
    } catch (error) {
      console.error('Failed to fetch YouTube channel:', error)
      throw error
    }
  }

  // ISO 8601 duration을 초로 변환
  private parseDuration(duration: string): string {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return '0'

    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')

    return String(hours * 3600 + minutes * 60 + seconds)
  }

  // 썸네일 다운로드
  async downloadThumbnail(thumbnailUrl: string): Promise<Buffer> {
    const response = await axios.get(thumbnailUrl, {
      responseType: 'arraybuffer'
    })
    return Buffer.from(response.data)
  }
}

export const youtubeService = new YouTubeService()
```

### 2.3 YouTube 임포트 API

```typescript
// app/api/import/youtube/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { youtubeService } from '@/lib/youtube/youtube-service'
import { prisma } from '@/lib/db'
import { storageService } from '@/lib/appwrite/storage'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    // 1. YouTube Video ID 추출
    const videoId = youtubeService.extractVideoId(url)
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      )
    }

    // 2. 이미 임포트된 동영상인지 확인
    const existingVideo = await prisma.video.findFirst({
      where: { 
        externalId: videoId,
        externalPlatform: 'youtube'
      }
    })

    if (existingVideo) {
      return NextResponse.json({
        message: 'Video already imported',
        video: existingVideo
      })
    }

    // 3. YouTube 정보 가져오기
    const videoInfo = await youtubeService.getVideoInfo(videoId)
    const channelInfo = await youtubeService.getChannelInfo(videoInfo.channelId)

    // 4. 채널 생성 또는 업데이트
    let channel = await prisma.channel.findFirst({
      where: {
        externalId: channelInfo.channelId,
        externalPlatform: 'youtube'
      }
    })

    if (!channel) {
      channel = await prisma.channel.create({
        data: {
          name: channelInfo.title,
          handle: channelInfo.customUrl || channelInfo.channelId,
          description: channelInfo.description,
          avatarUrl: channelInfo.thumbnails.high.url,
          bannerUrl: channelInfo.bannerUrl,
          subscriberCount: channelInfo.subscriberCount,
          videoCount: channelInfo.videoCount,
          viewCount: channelInfo.viewCount,
          externalId: channelInfo.channelId,
          externalPlatform: 'youtube',
          verified: channelInfo.subscriberCount > 100000 // 임의 기준
        }
      })
    }

    // 5. 썸네일 다운로드 및 저장
    const thumbnailBuffer = await youtubeService.downloadThumbnail(
      videoInfo.thumbnails.maxres?.url || videoInfo.thumbnails.high.url
    )
    
    const thumbnailFile = new File(
      [thumbnailBuffer], 
      `${videoId}_thumbnail.jpg`,
      { type: 'image/jpeg' }
    )
    
    const uploadedThumbnail = await storageService.uploadThumbnail(thumbnailFile)

    // 6. 동영상 정보 저장
    const video = await prisma.video.create({
      data: {
        channelId: channel.id,
        title: videoInfo.title,
        description: videoInfo.description,
        thumbnailUrl: storageService.getFileUrl(
          process.env.APPWRITE_BUCKET_THUMBNAILS!,
          uploadedThumbnail.$id
        ),
        duration: parseInt(videoInfo.duration),
        tags: videoInfo.tags,
        categoryId: videoInfo.categoryId,
        publishedAt: new Date(videoInfo.publishedAt),
        
        // YouTube 관련 필드
        externalId: videoInfo.videoId,
        externalPlatform: 'youtube',
        externalUrl: `https://youtube.com/watch?v=${videoInfo.videoId}`,
        embedEnabled: true,
        
        // 초기 통계 (YouTube 데이터)
        externalViewCount: videoInfo.viewCount,
        externalLikeCount: videoInfo.likeCount,
        externalCommentCount: videoInfo.commentCount,
        
        // 자체 플랫폼 통계 (0부터 시작)
        viewCount: 0,
        likeCount: 0,
        dislikeCount: 0,
        commentCount: 0,
        
        status: 'published',
        monetizationEnabled: false
      }
    })

    return NextResponse.json({
      message: 'Video imported successfully',
      video: video
    })

  } catch (error) {
    console.error('YouTube import error:', error)
    return NextResponse.json(
      { error: 'Failed to import YouTube video' },
      { status: 500 }
    )
  }
}
```

### 2.4 YouTube 플레이어 컴포넌트

```tsx
// components/YouTubePlayer.tsx
import { useEffect, useRef } from 'react'
import Script from 'next/script'

interface YouTubePlayerProps {
  videoId: string
  onReady?: () => void
  onStateChange?: (state: number) => void
  onError?: (error: number) => void
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export function YouTubePlayer({ 
  videoId, 
  onReady, 
  onStateChange,
  onError 
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // YouTube Player API 로드 완료 후 실행
    const initPlayer = () => {
      if (!window.YT || !containerRef.current) return

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            onReady?.()
            
            // 조회수 증가 (자체 플랫폼)
            incrementViewCount(videoId)
          },
          onStateChange: (event: any) => {
            onStateChange?.(event.data)
            
            // 재생 시작 시 시청 시간 추적
            if (event.data === window.YT.PlayerState.PLAYING) {
              startWatchTimeTracking()
            } else if (event.data === window.YT.PlayerState.PAUSED ||
                      event.data === window.YT.PlayerState.ENDED) {
              stopWatchTimeTracking()
            }
          },
          onError: (event: any) => {
            onError?.(event.data)
          }
        }
      })
    }

    // API가 이미 로드되어 있으면 바로 실행
    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      // API 로드 콜백 설정
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy()
      }
    }
  }, [videoId])

  const incrementViewCount = async (videoId: string) => {
    try {
      await fetch(`/api/videos/${videoId}/view`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Failed to increment view count:', error)
    }
  }

  let watchStartTime: number | null = null
  
  const startWatchTimeTracking = () => {
    watchStartTime = Date.now()
  }

  const stopWatchTimeTracking = async () => {
    if (!watchStartTime) return
    
    const watchDuration = Math.floor((Date.now() - watchStartTime) / 1000)
    watchStartTime = null

    try {
      await fetch(`/api/videos/${videoId}/watch-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: watchDuration })
      })
    } catch (error) {
      console.error('Failed to track watch time:', error)
    }
  }

  return (
    <>
      <Script
        src="https://www.youtube.com/iframe_api"
        strategy="lazyOnload"
      />
      <div 
        ref={containerRef}
        className="w-full aspect-video"
      />
    </>
  )
}
```

### 2.5 하이브리드 비디오 플레이어

```tsx
// components/VideoPlayer.tsx
import { YouTubePlayer } from './YouTubePlayer'
import { NativeVideoPlayer } from './NativeVideoPlayer'

interface VideoPlayerProps {
  video: {
    id: string
    externalId?: string
    externalPlatform?: string
    videoUrl?: string
  }
}

export function VideoPlayer({ video }: VideoPlayerProps) {
  // YouTube 동영상인 경우
  if (video.externalPlatform === 'youtube' && video.externalId) {
    return (
      <YouTubePlayer
        videoId={video.externalId}
        onReady={() => console.log('YouTube player ready')}
        onStateChange={(state) => console.log('State:', state)}
      />
    )
  }

  // 자체 업로드 동영상인 경우
  if (video.videoUrl) {
    return (
      <NativeVideoPlayer
        src={video.videoUrl}
        videoId={video.id}
      />
    )
  }

  return <div>동영상을 재생할 수 없습니다.</div>
}
```

## 3. 데이터베이스 스키마 수정

```prisma
// schema.prisma 추가 필드
model Channel {
  // ... 기존 필드
  
  // 외부 플랫폼 연동
  externalId         String?   // YouTube Channel ID
  externalPlatform   String?   // youtube, twitch, etc.
  lastSyncedAt       DateTime? // 마지막 동기화 시간
}

model Video {
  // ... 기존 필드
  
  // 외부 플랫폼 연동
  externalId         String?   // YouTube Video ID
  externalPlatform   String?   // youtube, vimeo, etc.
  externalUrl        String?   // 원본 URL
  embedEnabled       Boolean   @default(true)
  
  // 외부 플랫폼 통계 (참고용)
  externalViewCount    Int     @default(0)
  externalLikeCount    Int     @default(0)
  externalCommentCount Int     @default(0)
  
  // 동기화 설정
  syncEnabled        Boolean   @default(false)
  lastSyncedAt       DateTime?
}
```

## 4. 관리자 대시보드

### 4.1 YouTube 임포트 UI

```tsx
// app/admin/import/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ImportPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleImport = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/import/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      
      const data = await response.json()
      setResult(data)
      
      if (response.ok) {
        setUrl('')
      }
    } catch (error) {
      console.error('Import failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">YouTube 동영상 임포트</h1>
      
      <div className="max-w-2xl">
        <div className="flex gap-2 mb-4">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="YouTube URL 입력 (예: https://youtube.com/watch?v=...)"
            className="flex-1"
          />
          <Button 
            onClick={handleImport}
            disabled={!url || loading}
          >
            {loading ? '임포트 중...' : '임포트'}
          </Button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            {result.error ? (
              <p className="text-red-600">에러: {result.error}</p>
            ) : (
              <div>
                <p className="text-green-600 mb-2">{result.message}</p>
                {result.video && (
                  <div className="mt-2">
                    <p><strong>제목:</strong> {result.video.title}</p>
                    <p><strong>채널:</strong> {result.video.channelId}</p>
                    <p><strong>길이:</strong> {result.video.duration}초</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">대량 임포트</h2>
        <textarea
          className="w-full h-32 p-2 border rounded"
          placeholder="YouTube URL을 한 줄에 하나씩 입력..."
        />
        <Button className="mt-2">대량 임포트 시작</Button>
      </div>
    </div>
  )
}
```

## 5. 자동 동기화 시스템

### 5.1 정기적 업데이트

```typescript
// lib/youtube/sync-service.ts
export class YouTubeSyncService {
  // 채널의 최신 동영상 동기화
  async syncChannelVideos(channelId: string) {
    const channel = await prisma.channel.findFirst({
      where: {
        externalId: channelId,
        externalPlatform: 'youtube'
      }
    })

    if (!channel) return

    // YouTube API로 최신 동영상 목록 가져오기
    const response = await axios.get(`${this.apiUrl}/search`, {
      params: {
        part: 'id',
        channelId: channelId,
        order: 'date',
        maxResults: 10,
        type: 'video',
        key: this.apiKey
      }
    })

    for (const item of response.data.items) {
      // 각 동영상 임포트
      await this.importVideo(item.id.videoId)
    }

    // 동기화 시간 업데이트
    await prisma.channel.update({
      where: { id: channel.id },
      data: { lastSyncedAt: new Date() }
    })
  }

  // 크론잡으로 실행
  async syncAllChannels() {
    const channels = await prisma.channel.findMany({
      where: {
        externalPlatform: 'youtube',
        syncEnabled: true
      }
    })

    for (const channel of channels) {
      await this.syncChannelVideos(channel.externalId!)
      // Rate limit 고려
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}
```

## 6. 법적 고려사항 및 주의점

### 6.1 YouTube 서비스 약관
- YouTube 임베드 플레이어 사용 시 YouTube 로고 표시 필수
- 광고 제거 불가
- 다운로드 기능 제공 금지

### 6.2 권장 사항
- 원본 YouTube 링크 표시
- 크리에이터 정보 명시
- 자체 광고 삽입 시 YouTube 광고와 구분

### 6.3 API 제한
- YouTube Data API: 일일 10,000 쿼터
- 효율적인 쿼터 사용 필요
- 캐싱 적극 활용

## 7. 수익 모델

### 7.1 하이브리드 수익화
```typescript
// YouTube 동영상
- YouTube 광고 수익 (크리에이터)
- 플랫폼 프리미엄 구독 (광고 없는 UI)
- Super Chat/Thanks (자체 구현)

// 자체 업로드 동영상
- 자체 광고 시스템
- 구독 모델
- PPV (Pay Per View)
```

이 시스템을 통해 YouTube 콘텐츠를 활용하면서도 자체 플랫폼을 구축할 수 있습니다!