'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/lib/auth'
import { useAuth } from '@/hooks/useAuth'
import useStreamKey from '@/hooks/useStreamKey'
import StreamSettings from '@/components/studio/StreamSettings'
import RTMPKeyManager from '@/components/studio/RTMPKeyManager'
import {
  Play,
  Square,
  Settings,
  Users,
  Eye,
  Wifi,
  WifiOff,
  Copy,
  ExternalLink,
  Info,
  AlertCircle,
  CheckCircle,
  Clock,
  Camera,
  Mic
} from 'lucide-react'

interface StreamStatus {
  isLive: boolean
  viewers: number
  duration: string
  quality: string
  bitrate: number
  fps: number
  uptime: string
}

export default function StudioLivePage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({
    isLive: false,
    viewers: 0,
    duration: '00:00:00',
    quality: 'HD',
    bitrate: 0,
    fps: 0,
    uptime: '00:00:00'
  })
  
  // 스트림 키 관리
  const {
    streamKey,
    streamData,
    isLoadingKey,
    error: keyError,
    generateNewKey,
    updateStreamInfo,
    startStream,
    stopStream
  } = useStreamKey()

  // 스트림 설정 상태
  const [streamSettings, setStreamSettings] = useState({
    title: '',
    description: '',
    category: '기타',
    thumbnailUrl: '',
    isPrivate: false,
    chatEnabled: true,
    superChatEnabled: true,
    recordingEnabled: false
  })

  const [showOBSGuide, setShowOBSGuide] = useState(false)
  const [activeTab, setActiveTab] = useState<'settings' | 'key' | 'monitor'>('settings')

  // 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!isAuthenticated) {
          router.push('/login')
          return
        }

        // 크리에이터 권한 확인
        if (!user || (user.type !== 'CREATOR' && user.type !== 'BUSINESS' && user.type !== 'ADMIN')) {
          router.push('/dashboard')
          return
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [isAuthenticated, user, router])

  // 스트림 데이터 로드
  useEffect(() => {
    if (streamData) {
      setStreamSettings({
        title: streamData.title || '',
        description: streamData.description || '',
        category: streamData.category || '기타',
        thumbnailUrl: streamData.thumbnailUrl || '',
        isPrivate: streamData.isPrivate || false,
        chatEnabled: streamData.chatEnabled ?? true,
        superChatEnabled: streamData.superChatEnabled ?? true,
        recordingEnabled: streamData.recordingEnabled || false
      })
    }
  }, [streamData])

  // 스트림 상태 모니터링
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (streamData?.isLive) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/streaming/streams/${streamData.id}/status`)
          if (response.ok) {
            const status = await response.json()
            setStreamStatus({
              isLive: status.isLive,
              viewers: status.viewers || 0,
              duration: formatDuration(status.duration || 0),
              quality: status.quality || 'HD',
              bitrate: status.bitrate || 0,
              fps: status.fps || 0,
              uptime: formatDuration(status.uptime || 0)
            })
          }
        } catch (error) {
          console.error('Failed to fetch stream status:', error)
        }
      }, 5000) // 5초마다 업데이트
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [streamData?.isLive, streamData?.id])

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSettingsUpdate = async (newSettings: typeof streamSettings) => {
    try {
      await updateStreamInfo(newSettings)
      setStreamSettings(newSettings)
    } catch (error) {
      console.error('Failed to update stream settings:', error)
      setError('설정 업데이트에 실패했습니다')
    }
  }

  const handleStartStream = async () => {
    try {
      await startStream()
      setStreamStatus(prev => ({ ...prev, isLive: true }))
    } catch (error) {
      console.error('Failed to start stream:', error)
      setError('방송 시작에 실패했습니다')
    }
  }

  const handleStopStream = async () => {
    try {
      await stopStream()
      setStreamStatus(prev => ({ ...prev, isLive: false }))
    } catch (error) {
      console.error('Failed to stop stream:', error)
      setError('방송 종료에 실패했습니다')
    }
  }

  const copyRTMPUrl = () => {
    const rtmpUrl = `${process.env.NEXT_PUBLIC_STREAMING_SERVER_URL || 'rtmp://localhost:1935'}/live/${streamKey}`
    navigator.clipboard.writeText(rtmpUrl)
  }

  const copyStreamKey = () => {
    if (streamKey) {
      navigator.clipboard.writeText(streamKey)
    }
  }

  if (isLoading || isLoadingKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">라이브 설정을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/studio/dashboard')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← 대시보드
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">라이브 방송 설정</h1>
                <p className="text-gray-600">방송 설정을 구성하고 라이브 스트리밍을 시작하세요</p>
              </div>
            </div>

            {/* 방송 상태 & 컨트롤 */}
            <div className="flex items-center gap-4">
              {streamStatus.isLive ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold">LIVE</span>
                    <span className="text-sm">{streamStatus.viewers}명 시청 중</span>
                  </div>
                  <button
                    onClick={handleStopStream}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    <Square className="w-4 h-4" />
                    방송 종료
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartStream}
                  disabled={!streamKey || !streamSettings.title.trim()}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  방송 시작
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽 컬럼 - 설정 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 탭 네비게이션 */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === 'settings'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    방송 설정
                  </button>
                  <button
                    onClick={() => setActiveTab('key')}
                    className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === 'key'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    RTMP 설정
                  </button>
                  <button
                    onClick={() => setActiveTab('monitor')}
                    className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === 'monitor'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    방송 모니터링
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'settings' && (
                  <StreamSettings
                    settings={streamSettings}
                    onUpdate={handleSettingsUpdate}
                    isLive={streamStatus.isLive}
                  />
                )}

                {activeTab === 'key' && (
                  <RTMPKeyManager
                    streamKey={streamKey}
                    onRegenerate={generateNewKey}
                    isLive={streamStatus.isLive}
                  />
                )}

                {activeTab === 'monitor' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-600">시청자</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{streamStatus.viewers}</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-600">방송 시간</span>
                        </div>
                        <p className="text-lg font-mono text-gray-900">{streamStatus.duration}</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Camera className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-gray-600">FPS</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{streamStatus.fps}</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Wifi className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-gray-600">비트레이트</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{streamStatus.bitrate} kbps</p>
                      </div>
                    </div>

                    {streamStatus.isLive && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-800">방송 중</span>
                        </div>
                        <p className="text-sm text-green-700">
                          방송이 정상적으로 진행되고 있습니다. 품질: {streamStatus.quality}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 에러 메시지 */}
            {(error || keyError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">오류</span>
                </div>
                <p className="text-sm text-red-700 mt-1">{error || keyError}</p>
              </div>
            )}
          </div>

          {/* 오른쪽 컬럼 - 가이드 & 정보 */}
          <div className="space-y-6">
            {/* 빠른 액션 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h3>
              <div className="space-y-3">
                <button
                  onClick={() => window.open('/watch-live/' + streamData?.id, '_blank')}
                  disabled={!streamStatus.isLive}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 py-3 px-4 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  방송 페이지 보기
                </button>

                <button
                  onClick={() => setShowOBSGuide(true)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 px-4 rounded-lg transition-colors"
                >
                  <Info className="w-4 h-4" />
                  OBS 연결 가이드
                </button>
              </div>
            </div>

            {/* RTMP 정보 요약 */}
            {streamKey && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">RTMP 연결 정보</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RTMP URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={`${process.env.NEXT_PUBLIC_STREAMING_SERVER_URL || 'rtmp://localhost:1935'}/live`}
                        readOnly
                        className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2"
                      />
                      <button
                        onClick={copyRTMPUrl}
                        className="bg-gray-200 hover:bg-gray-300 p-2 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      스트림 키
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={streamKey}
                        readOnly
                        className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg px-3 py-2"
                      />
                      <button
                        onClick={copyStreamKey}
                        className="bg-gray-200 hover:bg-gray-300 p-2 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 방송 팁 */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 방송 팁</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• 안정적인 인터넷 연결을 확인하세요 (업로드 속도 5Mbps 이상 권장)</li>
                <li>• 방송 시작 전 마이크와 카메라를 테스트하세요</li>
                <li>• 매력적인 제목과 썸네일로 시청자를 유치하세요</li>
                <li>• 채팅으로 시청자와 적극적으로 소통하세요</li>
                <li>• 정기적인 방송 스케줄을 유지하세요</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* OBS 가이드 모달 */}
      {showOBSGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">OBS 연결 가이드</h2>
                <button
                  onClick={() => setShowOBSGuide(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">1. OBS Studio 설정</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>OBS Studio를 실행하고 "설정"을 클릭합니다</li>
                    <li>"스트림" 탭을 선택합니다</li>
                    <li>서비스를 "사용자 정의"로 설정합니다</li>
                    <li>서버 URL을 입력합니다: <code className="bg-gray-100 px-2 py-1 rounded">{process.env.NEXT_PUBLIC_STREAMING_SERVER_URL || 'rtmp://localhost:1935'}/live</code></li>
                    <li>스트림 키를 입력합니다 (위 RTMP 정보의 스트림 키 사용)</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">2. 화질 설정 권장사항</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>1080p (권장)</strong>
                        <ul className="mt-1 space-y-1 text-gray-600">
                          <li>해상도: 1920x1080</li>
                          <li>프레임레이트: 30fps</li>
                          <li>비트레이트: 4000-6000 kbps</li>
                        </ul>
                      </div>
                      <div>
                        <strong>720p (안정)</strong>
                        <ul className="mt-1 space-y-1 text-gray-600">
                          <li>해상도: 1280x720</li>
                          <li>프레임레이트: 30fps</li>
                          <li>비트레이트: 2500-4000 kbps</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">3. 방송 시작하기</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>OBS에서 "방송 시작" 버튼을 클릭합니다</li>
                    <li>연결이 성공하면 위 "방송 모니터링" 탭에서 상태를 확인할 수 있습니다</li>
                    <li>방송 페이지에서 실시간 스트림을 확인하세요</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}