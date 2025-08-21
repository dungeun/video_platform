'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

export interface StreamKeyData {
  id: string
  streamKey: string
  userId: string
  title?: string
  isActive: boolean
  isLive: boolean
  createdAt: string
  updatedAt: string
}

export interface UseStreamKeyReturn {
  streamKey: string | null
  streamUrl: string
  streamData: StreamKeyData | null
  isLoading: boolean
  isLoadingKey: boolean
  error: string | null
  isConnected: boolean | null
  generateNewKey: () => Promise<void>
  updateStreamTitle: (title: string) => Promise<void>
  updateStreamInfo: (info: any) => Promise<void>
  startStream: () => Promise<void>
  stopStream: () => Promise<void>
  validateKey: () => Promise<boolean>
  refreshStatus: () => Promise<void>
}

export function useStreamKey(providedUserId?: string): UseStreamKeyReturn {
  const { user } = useAuth()
  const [streamKey, setStreamKey] = useState<string | null>(null)
  const [streamData, setStreamData] = useState<StreamKeyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)

  const userId = providedUserId || user?.id
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const streamUrl = process.env.NEXT_PUBLIC_STREAMING_SERVER_URL || 'rtmp://localhost:1935'

  // 스트림 키 정보 불러오기
  const fetchStreamKey = useCallback(async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const response = await fetch(`${baseUrl}/api/streaming/stream-keys`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          // 스트림 키가 없으면 새로 생성
          await generateNewStreamKey()
          return
        }
        throw new Error('스트림 키를 불러올 수 없습니다')
      }

      const data: StreamKeyData = await response.json()
      setStreamData(data)
      setStreamKey(data.streamKey)

      // 스트림 상태 확인
      await checkStreamStatus(data.streamKey)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다'
      setError(errorMessage)
      console.error('Error fetching stream key:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userId, baseUrl])

  // 새 스트림 키 생성
  const generateNewStreamKey = async (): Promise<void> => {
    if (!userId) return

    try {
      setError(null)
      const response = await fetch(`${baseUrl}/api/streaming/stream-keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('새 스트림 키 생성에 실패했습니다')
      }

      const data: StreamKeyData = await response.json()
      setStreamData(data)
      setStreamKey(data.streamKey)
      setIsConnected(false) // 새 키이므로 연결 안됨

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '스트림 키 생성에 실패했습니다'
      setError(errorMessage)
      console.error('Error generating stream key:', err)
    }
  }

  // 스트림 상태 확인
  const checkStreamStatus = async (key: string): Promise<boolean> => {
    try {
      const response = await fetch(`${baseUrl}/api/streaming/streams/${key}/status`)
      
      if (response.ok) {
        const status = await response.json()
        const connected = status.isLive || false
        setIsConnected(connected)
        return connected
      } else {
        setIsConnected(false)
        return false
      }
    } catch (error) {
      console.error('Error checking stream status:', error)
      setIsConnected(false)
      return false
    }
  }

  // 스트림 제목 업데이트
  const updateStreamTitle = async (title: string): Promise<void> => {
    if (!streamKey) return

    try {
      setError(null)
      const response = await fetch(`${baseUrl}/api/streaming/streams/${streamKey}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      })

      if (!response.ok) {
        throw new Error('스트림 제목 업데이트에 실패했습니다')
      }

      const updatedData: StreamKeyData = await response.json()
      setStreamData(updatedData)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '제목 업데이트에 실패했습니다'
      setError(errorMessage)
      console.error('Error updating stream title:', err)
    }
  }

  // 스트림 키 유효성 검사
  const validateKey = async (): Promise<boolean> => {
    if (!streamKey) return false

    try {
      const response = await fetch(`${baseUrl}/api/streaming/streams/${streamKey}/validate`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      return response.ok
    } catch (error) {
      console.error('Error validating stream key:', error)
      return false
    }
  }

  // 스트림 상태 새로고침
  const refreshStatus = async (): Promise<void> => {
    if (streamKey) {
      await checkStreamStatus(streamKey)
    }
  }

  // 새 키 생성 (외부 호출용)
  const generateNewKey = async (): Promise<void> => {
    await generateNewStreamKey()
  }

  // 스트림 정보 업데이트 (설정 등)
  const updateStreamInfo = async (info: any): Promise<void> => {
    if (!streamKey) return

    try {
      setError(null)
      const response = await fetch(`${baseUrl}/api/streaming/streams/${streamKey}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(info)
      })

      if (!response.ok) {
        throw new Error('스트림 정보 업데이트에 실패했습니다')
      }

      const updatedData: StreamKeyData = await response.json()
      setStreamData(updatedData)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '정보 업데이트에 실패했습니다'
      setError(errorMessage)
      console.error('Error updating stream info:', err)
    }
  }

  // 스트림 시작
  const startStream = async (): Promise<void> => {
    if (!streamKey) return

    try {
      setError(null)
      const response = await fetch(`${baseUrl}/api/streaming/streams/${streamKey}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('스트림 시작에 실패했습니다')
      }

      const updatedData: StreamKeyData = await response.json()
      setStreamData(updatedData)
      setIsConnected(true)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '스트림 시작에 실패했습니다'
      setError(errorMessage)
      console.error('Error starting stream:', err)
    }
  }

  // 스트림 종료
  const stopStream = async (): Promise<void> => {
    if (!streamKey) return

    try {
      setError(null)
      const response = await fetch(`${baseUrl}/api/streaming/streams/${streamKey}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('스트림 종료에 실패했습니다')
      }

      const updatedData: StreamKeyData = await response.json()
      setStreamData(updatedData)
      setIsConnected(false)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '스트림 종료에 실패했습니다'
      setError(errorMessage)
      console.error('Error stopping stream:', err)
    }
  }

  // 컴포넌트 마운트 시 스트림 키 불러오기
  useEffect(() => {
    fetchStreamKey()
  }, [fetchStreamKey])

  // 정기적으로 스트림 상태 확인 (30초마다)
  useEffect(() => {
    if (!streamKey) return

    const interval = setInterval(async () => {
      await checkStreamStatus(streamKey)
    }, 30000)

    return () => clearInterval(interval)
  }, [streamKey])

  // 페이지 포커스 시 상태 새로고침
  useEffect(() => {
    const handleFocus = () => {
      if (streamKey) {
        checkStreamStatus(streamKey)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [streamKey])

  // 온라인/오프라인 상태 감지
  useEffect(() => {
    const handleOnline = () => {
      if (streamKey) {
        checkStreamStatus(streamKey)
      }
    }

    const handleOffline = () => {
      setIsConnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [streamKey])

  return {
    streamKey,
    streamUrl: `${streamUrl}/live`,
    streamData,
    isLoading,
    isLoadingKey: isLoading, // alias for backward compatibility
    error,
    isConnected,
    generateNewKey,
    updateStreamTitle,
    updateStreamInfo,
    startStream,
    stopStream,
    validateKey,
    refreshStatus
  }
}

// Default export for backward compatibility
export default useStreamKey