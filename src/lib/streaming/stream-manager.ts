import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

export interface StreamData {
  id: string
  userId: string
  title: string
  description?: string
  category: string
  streamKey: string
  rtmpUrl: string
  hlsUrl: string
  isLive: boolean
  viewerCount: number
  startedAt?: Date
  endedAt?: Date
  thumbnailUrl?: string
  chatEnabled: boolean
  recordingEnabled: boolean
}

export class StreamManager {
  private static instance: StreamManager
  private activeStreams = new Map<string, StreamData>()

  private constructor() {}

  static getInstance(): StreamManager {
    if (!StreamManager.instance) {
      StreamManager.instance = new StreamManager()
    }
    return StreamManager.instance
  }

  // 스트림 키 생성
  async generateStreamKey(userId: string): Promise<string> {
    const streamKey = `${userId}_${uuidv4().replace(/-/g, '')}`
    
    // 기존 스트림 키 비활성화
    await prisma.videos.updateMany({
      where: { 
        creatorId: userId,
        type: 'LIVE',
        status: 'ACTIVE'
      },
      data: { status: 'INACTIVE' }
    })

    // 새 스트림 생성
    await prisma.videos.create({
      data: {
        id: uuidv4(),
        title: '새로운 라이브 스트림',
        description: '',
        creatorId: userId,
        type: 'LIVE',
        status: 'ACTIVE',
        streamKey,
        isLive: false,
        category: '기타',
        thumbnailUrl: '/images/default-stream-thumbnail.jpg'
      }
    })

    return streamKey
  }

  // 스트림 정보 조회
  async getStreamByKey(streamKey: string): Promise<StreamData | null> {
    const stream = await prisma.videos.findFirst({
      where: { 
        streamKey,
        status: 'ACTIVE',
        type: 'LIVE'
      },
      include: {
        creator: true
      }
    })

    if (!stream) return null

    const rtmpUrl = `${process.env.NEXT_PUBLIC_RTMP_URL || 'rtmp://localhost:1935/live'}`
    const hlsUrl = `${process.env.NEXT_PUBLIC_HLS_URL || 'http://localhost:8080/hls'}/${streamKey}.m3u8`

    return {
      id: stream.id,
      userId: stream.creatorId,
      title: stream.title,
      description: stream.description || '',
      category: stream.category || '기타',
      streamKey: stream.streamKey || '',
      rtmpUrl,
      hlsUrl,
      isLive: stream.isLive || false,
      viewerCount: stream.viewerCount || 0,
      startedAt: stream.streamStartedAt || undefined,
      endedAt: stream.streamEndedAt || undefined,
      thumbnailUrl: stream.thumbnailUrl || '',
      chatEnabled: stream.chatEnabled !== false,
      recordingEnabled: stream.recordingEnabled || false
    }
  }

  // 스트림 시작
  async startStream(streamKey: string): Promise<boolean> {
    try {
      const result = await prisma.videos.updateMany({
        where: { 
          streamKey,
          status: 'ACTIVE',
          type: 'LIVE'
        },
        data: {
          isLive: true,
          streamStartedAt: new Date(),
          streamEndedAt: null
        }
      })

      if (result.count > 0) {
        // 활성 스트림 캐시 업데이트
        const streamData = await this.getStreamByKey(streamKey)
        if (streamData) {
          this.activeStreams.set(streamKey, streamData)
        }
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to start stream:', error)
      return false
    }
  }

  // 스트림 종료
  async stopStream(streamKey: string): Promise<boolean> {
    try {
      const result = await prisma.videos.updateMany({
        where: { 
          streamKey,
          status: 'ACTIVE',
          type: 'LIVE'
        },
        data: {
          isLive: false,
          streamEndedAt: new Date()
        }
      })

      if (result.count > 0) {
        // 활성 스트림 캐시에서 제거
        this.activeStreams.delete(streamKey)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to stop stream:', error)
      return false
    }
  }

  // 스트림 정보 업데이트
  async updateStreamInfo(streamKey: string, data: {
    title?: string
    description?: string
    category?: string
    thumbnailUrl?: string
    chatEnabled?: boolean
    recordingEnabled?: boolean
  }): Promise<boolean> {
    try {
      const result = await prisma.videos.updateMany({
        where: { 
          streamKey,
          status: 'ACTIVE',
          type: 'LIVE'
        },
        data
      })

      return result.count > 0
    } catch (error) {
      console.error('Failed to update stream info:', error)
      return false
    }
  }

  // 시청자 수 업데이트
  async updateViewerCount(streamKey: string, count: number): Promise<void> {
    try {
      await prisma.videos.updateMany({
        where: { 
          streamKey,
          status: 'ACTIVE',
          type: 'LIVE'
        },
        data: { viewerCount: count }
      })

      // 캐시 업데이트
      const cached = this.activeStreams.get(streamKey)
      if (cached) {
        cached.viewerCount = count
        this.activeStreams.set(streamKey, cached)
      }
    } catch (error) {
      console.error('Failed to update viewer count:', error)
    }
  }

  // 활성 스트림 목록
  getActiveStreams(): StreamData[] {
    return Array.from(this.activeStreams.values())
  }

  // 사용자별 스트림 정보
  async getUserStream(userId: string): Promise<StreamData | null> {
    const stream = await prisma.videos.findFirst({
      where: { 
        creatorId: userId,
        status: 'ACTIVE',
        type: 'LIVE'
      }
    })

    if (!stream || !stream.streamKey) return null
    return this.getStreamByKey(stream.streamKey)
  }
}