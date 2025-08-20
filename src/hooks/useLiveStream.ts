'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface LiveStreamStats {
  viewers: number
  likes: number
  duration: number
  quality: string
  bitrate: number
  fps: number
  latency: number
}

interface UseLiveStreamReturn {
  isConnected: boolean
  isConnecting: boolean
  viewers: number
  likes: number
  stats: LiveStreamStats
  error: string | null
  connectToStream: () => Promise<void>
  disconnectFromStream: () => void
  sendLike: () => Promise<void>
  updateStats: (newStats: Partial<LiveStreamStats>) => void
}

export default function useLiveStream(streamId: string): UseLiveStreamReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [viewers, setViewers] = useState(0)
  const [likes, setLikes] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<LiveStreamStats>({
    viewers: 0,
    likes: 0,
    duration: 0,
    quality: 'auto',
    bitrate: 0,
    fps: 0,
    latency: 0
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  // 웹소켓 연결
  const connectToStream = useCallback(async () => {
    if (!streamId || isConnected || isConnecting) return

    setIsConnecting(true)
    setError(null)

    try {
      // HTTP로 스트림 상태 먼저 확인
      const response = await fetch(`/api/streaming/streams/${streamId}/status`)
      if (!response.ok) {
        throw new Error('스트림을 찾을 수 없습니다')
      }

      const streamData = await response.json()
      if (!streamData.isLive) {
        throw new Error('방송이 종료되었습니다')
      }

      // 초기 통계 설정
      setViewers(streamData.viewers || 0)
      setLikes(streamData.likes || 0)
      setStats(prev => ({
        ...prev,
        viewers: streamData.viewers || 0,
        likes: streamData.likes || 0
      }))

      // WebSocket 연결
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/stream/${streamId}`
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log(`Connected to stream ${streamId}`)
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        reconnectAttempts.current = 0

        // 하트비트 시작
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, 30000) // 30초마다 ping
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          switch (data.type) {
            case 'stats_update':
              setViewers(data.viewers || 0)
              setLikes(data.likes || 0)
              setStats(prev => ({
                ...prev,
                viewers: data.viewers || 0,
                likes: data.likes || 0,
                quality: data.quality || prev.quality,
                bitrate: data.bitrate || prev.bitrate,
                fps: data.fps || prev.fps,
                latency: data.latency || prev.latency
              }))
              break

            case 'stream_ended':
              setError('방송이 종료되었습니다')
              disconnectFromStream()
              break

            case 'pong':
              // 하트비트 응답
              break

            default:
              console.log('Unknown message type:', data.type)
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        console.log('Stream WebSocket connection closed:', event.code, event.reason)
        setIsConnected(false)
        setIsConnecting(false)

        // 하트비트 정리
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
          heartbeatIntervalRef.current = null
        }

        // 비정상 종료인 경우 재연결 시도
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000) // 최대 10초
          
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectToStream()
          }, delay)
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError('연결에 실패했습니다. 새로고침 후 다시 시도해주세요.')
        }
      }

      ws.onerror = (error) => {
        console.error('Stream WebSocket error:', error)
        setError('연결 중 오류가 발생했습니다')
        setIsConnecting(false)
      }

      wsRef.current = ws

    } catch (error) {
      console.error('Failed to connect to stream:', error)
      setError(error instanceof Error ? error.message : '연결에 실패했습니다')
      setIsConnecting(false)
    }
  }, [streamId, isConnected, isConnecting])

  // 웹소켓 연결 해제
  const disconnectFromStream = useCallback(() => {
    // 재연결 타이머 정리
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // 하트비트 정리
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }

    // WebSocket 연결 종료
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected')
      wsRef.current = null
    }

    setIsConnected(false)
    setIsConnecting(false)
    reconnectAttempts.current = 0
  }, [])

  // 좋아요 전송
  const sendLike = useCallback(async () => {
    if (!isConnected || !wsRef.current) return

    try {
      // WebSocket으로 즉시 전송
      wsRef.current.send(JSON.stringify({
        type: 'like',
        streamId
      }))

      // HTTP API로도 전송 (영속성 위해)
      await fetch(`/api/streaming/streams/${streamId}/like`, {
        method: 'POST'
      })
      
    } catch (error) {
      console.error('Failed to send like:', error)
      throw error
    }
  }, [streamId, isConnected])

  // 통계 업데이트 (플레이어에서 호출)
  const updateStats = useCallback((newStats: Partial<LiveStreamStats>) => {
    setStats(prev => ({
      ...prev,
      ...newStats
    }))
  }, [])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      disconnectFromStream()
    }
  }, [disconnectFromStream])

  return {
    isConnected,
    isConnecting,
    viewers,
    likes,
    stats,
    error,
    connectToStream,
    disconnectFromStream,
    sendLike,
    updateStats
  }
}